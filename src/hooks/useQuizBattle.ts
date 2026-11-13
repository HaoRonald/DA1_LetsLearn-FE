"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { quizBattleService, type BattleAnswer, type BattleState } from "@/services/quizBattleService";

export function battleError(error: unknown) {
  const value = error as { response?: { data?: { message?: string } }; message?: string };
  return value.response?.data?.message || value.message || "Something went wrong. Please try again.";
}

type Snapshot = { state: BattleState; localMs: number; serverMs: number };

export function useQuizBattle(userId: string) {
  const storageKey = `letslearn.activeQuizBattle:${userId}`;
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [receipt, setReceipt] = useState<{ battleId: string; answer: BattleAnswer } | null>(null);
  const [busy, setBusy] = useState(false);
  const [restoring, setRestoring] = useState(true);
  const [error, setError] = useState("");
  const [syncError, setSyncError] = useState("");
  const [live, setLive] = useState(false);
  const [tick, setTick] = useState(0);
  const session = useRef({ id: "", generation: 0, alive: false });
  const latest = useRef<BattleState | null>(null);
  const actionPending = useRef(false);
  const flight = useRef<{ generation: number; again: boolean; promise: Promise<void> } | null>(null);

  const matches = useCallback((id: string, generation: number) =>
    session.current.alive && session.current.id === id && session.current.generation === generation, []);

  const remember = useCallback((id: string | null) => {
    try {
      if (id) window.localStorage.setItem(storageKey, id);
      else window.localStorage.removeItem(storageKey);
    } catch { /* Storage may be unavailable; the current room still works. */ }
  }, [storageKey]);

  const close = useCallback(() => {
    session.current.id = "";
    session.current.generation++;
    latest.current = null;
    remember(null);
    setSnapshot(null);
    setReceipt(null);
    setSyncError("");
  }, [remember]);

  const accept = useCallback((state: BattleState, requestStarted: number) => {
    if (latest.current?.id === state.id && Date.parse(latest.current.serverNow) > Date.parse(state.serverNow)) return;
    const received = performance.now();
    latest.current = state;
    setSnapshot({ state, localMs: received, serverMs: Date.parse(state.serverNow) + (received - requestStarted) / 2 });
    remember(state.id);
    setSyncError("");
  }, [remember]);

  const refresh = useCallback(async function refreshRoom(id: string, generation: number): Promise<void> {
    if (!matches(id, generation)) return;
    const running = flight.current;
    if (running?.generation === generation) {
      running.again = true;
      return running.promise;
    }
    const work = { generation, again: false, promise: Promise.resolve() };
    flight.current = work;
    work.promise = (async () => {
      const started = performance.now();
      try {
        const state = await quizBattleService.get(id);
        if (matches(id, generation)) accept(state, started);
      } catch (e) {
        if (!matches(id, generation)) return;
        const status = (e as { response?: { status?: number } }).response?.status;
        if (status === 403 || status === 404) {
          close();
          setError("This room was closed or you are no longer a participant.");
        } else setSyncError("Could not sync the room. Retrying automatically.");
      } finally {
        if (flight.current === work) flight.current = null;
        if (work.again && matches(id, generation)) void refreshRoom(id, generation);
      }
    })();
    return work.promise;
  }, [accept, close, matches]);

  useEffect(() => {
    const current = session.current;
    current.alive = true;
    const generation = ++current.generation;
    void (async () => {
      let saved: string | null = null;
      try { saved = window.localStorage.getItem(storageKey); } catch { /* Optional persistence. */ }
      if (saved) {
        session.current.id = saved;
        await refresh(saved, generation);
      }
      if (session.current.alive && session.current.generation === generation) setRestoring(false);
      // A missing/deleted saved room advances the generation in close().
      else if (session.current.alive && !session.current.id) setRestoring(false);
    })();
    // Retry restoring a saved room even if the first HTTP request failed before any snapshot arrived.
    const restoreRetry = setInterval(() => {
      if (current.alive && current.id && !latest.current) void refresh(current.id, current.generation);
    }, 5000);
    return () => { current.alive = false; current.generation++; clearInterval(restoreRetry); };
  }, [storageKey, refresh]);

  const battle = snapshot?.state ?? null;
  const battleId = battle?.id;
  const completed = battle?.status === "completed";

  useEffect(() => {
    if (!battleId || completed) return;
    const id = battleId;
    const generation = session.current.generation;
    const connection = quizBattleService.connection();
    let disposed = false;
    let retry: ReturnType<typeof setTimeout> | undefined;
    const sync = () => { if (!disposed) void refresh(id, generation); };
    const join = async () => {
      await connection.invoke("JoinBattle", id);
      if (!disposed) { setLive(true); sync(); }
    };
    const start = async () => {
      try {
        await connection.start();
        if (disposed) { await connection.stop(); return; }
        await join();
      } catch {
        if (!disposed) { setLive(false); await connection.stop(); scheduleRetry(); }
      }
    };
    const scheduleRetry = () => {
      if (disposed) return;
      clearTimeout(retry);
      retry = setTimeout(() => void start(), 5000);
    };
    for (const event of ["PlayerJoined", "PlayerLeft", "BattleStarted", "AnswerReceived", "BattleCompleted"]) connection.on(event, sync);
    connection.on("RoomClosed", () => {
      if (!disposed && matches(id, generation)) { close(); setError("The host closed this waiting room."); }
    });
    connection.onreconnecting(() => { if (!disposed) setLive(false); });
    connection.onreconnected(() => { void join().catch(async () => { if (!disposed) await connection.stop(); }); });
    connection.onclose(() => { if (!disposed) { setLive(false); scheduleRetry(); } });
    // Register listeners before connecting; SignalR groups must be rejoined after every reconnect.
    void start();
    const poll = setInterval(sync, 2500);
    window.addEventListener("online", sync);
    document.addEventListener("visibilitychange", sync);
    return () => {
      disposed = true;
      clearTimeout(retry);
      clearInterval(poll);
      window.removeEventListener("online", sync);
      document.removeEventListener("visibilitychange", sync);
      void connection.stop();
    };
  }, [battleId, completed, close, matches, refresh]);

  useEffect(() => {
    if (battle?.status !== "active" || !snapshot) return;
    const timer = setInterval(() => setTick(performance.now()), 100);
    const boundary = battle.deadline ?? battle.startedAt;
    const estimatedNow = snapshot.serverMs + performance.now() - snapshot.localMs;
    const id = battle.id;
    const generation = session.current.generation;
    // Refresh exactly at the shared battle deadline; regular polling handles score/progress updates.
    const next = setTimeout(() => void refresh(id, generation), Math.max(150, Date.parse(boundary!) - estimatedNow + 50));
    return () => { clearInterval(timer); clearTimeout(next); };
  }, [battle, snapshot, refresh]);

  const run = async (operation: () => Promise<BattleState>) => {
    if (actionPending.current || restoring) return;
    actionPending.current = true;
    const generation = session.current.generation;
    setBusy(true); setError("");
    try {
      const started = performance.now();
      const state = await operation();
      if (!session.current.alive || generation !== session.current.generation) return;
      if (session.current.id !== state.id) {
        session.current.generation++;
        session.current.id = state.id;
        latest.current = null;
        setReceipt(null);
      }
      accept(state, started);
    } catch (e) { if (session.current.alive && generation === session.current.generation) setError(battleError(e)); }
    finally { actionPending.current = false; if (session.current.alive) setBusy(false); }
  };

  const answer = async (choiceId: string) => {
    const state = latest.current;
    if (actionPending.current || !state || state.status !== "active" || state.currentQuestionIndex < 0) return;
    actionPending.current = true;
    const generation = session.current.generation;
    setBusy(true); setError("");
    try {
      const result = await quizBattleService.answer(state.id, state.currentQuestionIndex, choiceId);
      if (matches(state.id, generation)) setReceipt({ battleId: state.id, answer: result });
    } catch (e) { if (matches(state.id, generation)) setError(battleError(e)); }
    finally {
      actionPending.current = false;
      if (session.current.alive) setBusy(false);
      // Also sync after a timeout/409: the server may already have accepted an answer from this or another tab.
      void refresh(state.id, generation);
    }
  };

  const leave = async () => {
    const id = session.current.id;
    const generation = session.current.generation;
    if (!id || actionPending.current) return;
    actionPending.current = true;
    setBusy(true); setError("");
    try { await quizBattleService.leave(id); if (matches(id, generation)) close(); }
    catch (e) { if (matches(id, generation)) setError(battleError(e)); }
    finally { actionPending.current = false; if (session.current.alive) setBusy(false); }
  };

  const serverNow = snapshot ? snapshot.serverMs + Math.max(0, tick - snapshot.localMs) : 0;
  const secondsLeft = battle?.deadline ? Math.max(0, Math.ceil((Date.parse(battle.deadline) - serverNow) / 1000)) : 0;
  const joinSecondsLeft = battle?.joinEndsAt ? Math.max(0, Math.ceil((Date.parse(battle.joinEndsAt) - serverNow) / 1000)) : 0;
  const startsIn = battle?.startedAt ? Math.max(0, Math.ceil((Date.parse(battle.startedAt) - serverNow) / 1000)) : 0;
  const myAnswer = receipt && receipt.battleId === battle?.id && receipt.answer.questionIndex === battle?.currentQuestionIndex
    ? receipt.answer : null;
  return { battle, busy: busy || restoring, error: error || syncError, live, secondsLeft, joinSecondsLeft, startsIn, myAnswer, run, answer, leave, close, setError };
}
