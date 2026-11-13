"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { Award, Check, Copy, Crown, LoaderCircle, Medal, Radio, Shield, Swords, Timer, Trophy, Users, Zap } from "lucide-react";
import MainLayout from "@/components/layout/MainLayout";
import { useAuth } from "@/contexts/AuthContext";
import { courseApi, type CourseResponse } from "@/services/courseService";
import { quizBattleService } from "@/services/quizBattleService";
import { battleError, useQuizBattle } from "@/hooks/useQuizBattle";
import type { User } from "@/types";

const panel = "rounded-2xl border border-slate-200 bg-white shadow-sm";
const primaryButton = "inline-flex items-center justify-center gap-2 rounded-xl bg-[#5546a8] px-4 py-3 font-bold text-white transition hover:bg-[#47388f] disabled:cursor-not-allowed disabled:opacity-50";

export default function QuizBattlePage() {
  return <Suspense fallback={<p className="p-8">Loading Quiz Battle...</p>}><QuizBattleAccount /></Suspense>;
}

function QuizBattleAccount() {
  const { user, isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <MainLayout headerTitle="Quiz Battle"><p className="p-8">Loading your account...</p></MainLayout>;
  if (!isAuthenticated || !user) return <MainLayout headerTitle="Quiz Battle"><div className="p-8 text-center"><h1 className="text-2xl font-black">Sign in to play</h1><Link href="/login" className="mt-4 inline-block rounded-xl bg-indigo-600 px-5 py-3 font-bold text-white">Sign in</Link></div></MainLayout>;
  return <QuizBattleRoom key={user.id} user={user} />;
}

function QuizBattleRoom({ user }: { user: User }) {
  const { battle, busy, error, live, secondsLeft, joinSecondsLeft, startsIn, myAnswer, run: act, answer, leave, close, setError } = useQuizBattle(user.id);
  const [courses, setCourses] = useState<CourseResponse[]>([]);
  const [code, setCode] = useState("");
  const [courseId, setCourseId] = useState("");
  const [selection, setSelection] = useState<{ key: string; id: string } | null>(null);
  const [copiedCode, setCopiedCode] = useState("");
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const currentQuestion = battle?.questions.find(q => q.index === battle.currentQuestionIndex);
  const questionKey = `${battle?.id}:${battle?.currentQuestionIndex}`;
  const selectedChoice = myAnswer?.choiceId ?? (selection?.key === questionKey ? selection.id : "");
  const answered = myAnswer?.questionIndex ?? null;
  const feedback = myAnswer ? (myAnswer.correct ? `Correct! +${myAnswer.points} points` : "Not quite. The next question is coming up.") : "";
  const isHost = !!battle?.players.some(p => p.isHost && p.userId === user.id);
  const copied = !!battle && copiedCode === battle.joinCode;
  const formatTime = (value: number) => `${Math.floor(value / 60)}:${String(value % 60).padStart(2, "0")}`;

  useEffect(() => {
    let alive = true;
    courseApi.getAll().then(r => {
      if (!alive) return;
      const visible = r.data.filter(course => course.isPublished && course.creatorId === user.id);
      setCourses(visible);
      setCourseId(previous => visible.some(c => c.id === previous) ? previous : visible[0]?.id || "");
    }).catch(e => { if (alive) setError(battleError(e)); });
    return () => { alive = false; };
  }, [user, setError]);

  const copyCode = async () => {
    if (!battle) return;
    try { await navigator.clipboard.writeText(battle.joinCode); setCopiedCode(battle.joinCode); }
    catch { setError("Could not copy the code. Please copy the six digits shown above manually."); }
  };

  return <MainLayout headerTitle="Quiz Battle">
    <main className="min-h-full bg-[#f6f7fb] text-slate-900">
      <div className="mx-auto w-full max-w-7xl px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
        <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.14em] text-[#5546a8]"><Swords className="h-4 w-4" />Quiz Battle</p>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">Study together. Compete fairly.</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Take a timed course quiz with your classmates and earn points for correct answers.</p>
          </div>
          <Link href="/leaderboard" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"><Trophy className="h-4 w-4 text-amber-600" />Leaderboard</Link>
        </header>

        {battle && battle.status !== "completed" && <div className="mb-4 flex items-center gap-2 text-xs font-medium text-slate-500"><span className={`h-2 w-2 rounded-full ${live ? "bg-emerald-500" : "bg-slate-300"}`} /><Radio className="h-3.5 w-3.5" />{live ? "Live updates connected" : "Reconnecting. Room updates continue automatically."}</div>}
        {error && <div role="alert" className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">{error}</div>}

        {!battle ? <div className="grid gap-5 lg:grid-cols-2">
          <section className={`${panel} p-6 sm:p-7`}>
            <div className="mb-6 flex items-start gap-4"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#f0eef9] text-[#5546a8]"><Crown className="h-5 w-5" /></div><div><h2 className="text-xl font-bold">Host a battle</h2><p className="mt-1 text-sm text-slate-500">Create a room for learners in one of your courses.</p></div></div>
            <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="course">Course</label>
            <select id="course" value={courseId} onChange={e => setCourseId(e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#7466bf] focus:ring-2 focus:ring-[#7466bf]/15"><option value="">Choose a course...</option>{courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}</select>
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500"><span>10 questions</span><span>10 minutes</span><span>Up to 8 players</span></div>
            {courses.length === 0 && <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">You do not own a published course that can host a battle.</p>}
            <button disabled={busy || !courseId} onClick={() => void act(() => quizBattleService.create(courseId))} className={`${primaryButton} mt-5 w-full`}>{busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Swords className="h-4 w-4" />}Create room</button>
            <p className="mt-3 text-xs leading-5 text-slate-500">Only the course teacher can host. The course needs at least 10 valid single-answer questions.</p>
          </section>

          <section className={`${panel} p-6 sm:p-7`}>
            <div className="mb-6 flex items-start gap-4"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#edf4f5] text-[#34717a]"><Users className="h-5 w-5" /></div><div><h2 className="text-xl font-bold">Join a battle</h2><p className="mt-1 text-sm text-slate-500">Enter the six-digit code shared by the host.</p></div></div>
            <label htmlFor="join-code" className="mb-2 block text-sm font-semibold text-slate-700">Room code</label>
            <input id="join-code" value={code} maxLength={6} inputMode="numeric" onChange={e => setCode(e.target.value.replace(/\D/g, ""))} placeholder="000000" className="w-full rounded-xl border border-slate-300 bg-white px-4 py-4 text-center font-mono text-2xl font-bold tracking-[.3em] text-slate-900 outline-none placeholder:text-slate-300 focus:border-[#43828a] focus:ring-2 focus:ring-[#43828a]/15" />
            <button disabled={busy || code.length !== 6} onClick={() => void act(() => quizBattleService.join(code))} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#34717a] px-4 py-3 font-bold text-white transition hover:bg-[#285c63] disabled:cursor-not-allowed disabled:opacity-50">Join room <span aria-hidden="true">→</span></button>
            <p className="mt-3 text-xs leading-5 text-slate-500">You must be enrolled in the course to join.</p>
          </section>
        </div> : <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
          <section className={`${panel} p-5 sm:p-7`}>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div className="flex items-center gap-3"><div className={`grid h-11 w-11 place-items-center rounded-xl ${battle.status === "completed" ? "bg-amber-50 text-amber-700" : "bg-[#f0eef9] text-[#5546a8]"}`}>{battle.status === "completed" ? <Trophy className="h-5 w-5" /> : <Swords className="h-5 w-5" />}</div><div><p className="text-xs font-semibold text-slate-500">{battle.status === "waiting" ? "Waiting room" : battle.status === "active" ? "Battle in progress" : "Final results"}</p><h2 className="mt-0.5 text-xl font-bold">Room <span className="font-mono text-[#5546a8]">{battle.joinCode}</span></h2>{battle.status === "active" && <p className="mt-1 text-xs text-slate-500">{joinSecondsLeft > 0 ? `Joining closes in ${formatTime(joinSecondsLeft)}` : "Joining is closed"}</p>}</div></div>
              <div className="flex flex-wrap items-center gap-2">{(battle.status === "waiting" || (battle.status === "active" && joinSecondsLeft > 0)) && <button onClick={() => void copyCode()} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"><Copy className="h-4 w-4" />{copied ? "Copied" : "Copy code"}</button>}{battle.status === "active" && isHost && <button disabled={busy} onClick={() => setShowEndConfirm(true)} className="rounded-lg border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:opacity-50">End battle</button>}</div>
            </div>

            {battle.status === "waiting" && <div>
              <div className="mb-5 flex items-center justify-between"><div><h3 className="font-semibold text-slate-800">Players</h3><p className="mt-1 text-sm text-slate-500">The host can start once another player has joined.</p></div><span className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-600">{battle.players.length} / 8</span></div>
              <div className="grid gap-3 sm:grid-cols-2">{Array.from({ length: Math.min(4, Math.max(2, battle.players.length)) }, (_, index) => { const player = battle.players[index]; return <div key={player?.userId ?? index} className={`flex items-center gap-3 rounded-xl border p-3 ${player ? "border-slate-200 bg-slate-50" : "border-dashed border-slate-200 bg-white"}`}><div className={`grid h-9 w-9 place-items-center rounded-lg text-sm font-bold ${player ? "bg-[#e9e6f5] text-[#5546a8]" : "bg-slate-100 text-slate-400"}`}>{player ? player.username.slice(0, 1).toUpperCase() : <Users className="h-4 w-4" />}</div><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-800">{player ? `${player.username}${player.userId === user.id ? " (you)" : ""}` : "Open seat"}</p><p className="text-xs text-slate-500">{player ? player.isHost ? "Host" : "Player" : "Waiting for player"}</p></div>{player?.isHost && <Crown className="ml-auto h-4 w-4 text-amber-600" />}</div>; })}</div>
              <div className="mt-5 flex flex-wrap items-center gap-3">{battle.players.length >= 2 && isHost && <button disabled={busy} onClick={() => void act(() => quizBattleService.start(battle.id))} className={primaryButton}><Zap className="h-4 w-4" />Start battle</button>}{!isHost && <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">You joined. Waiting for the host to start.</p>}{battle.players.length < 2 && <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">Waiting for one more player.</p>}<button disabled={busy} onClick={() => void leave()} className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50">{isHost ? "Close room" : "Leave room"}</button></div>
            </div>}

            {battle.status === "active" && <>
              <div className="mb-5 grid grid-cols-3 gap-3"><div className="rounded-xl bg-slate-50 p-3"><p className="text-xs font-medium text-slate-500">Question</p><p className="mt-1 font-bold text-slate-900">{battle.finished ? battle.questionCount : Math.max(0, battle.currentQuestionIndex + 1)} <span className="font-medium text-slate-500">/ {battle.questionCount}</span></p></div><div className="rounded-xl bg-rose-50 p-3"><p className="flex items-center gap-1 text-xs font-medium text-rose-700"><Timer className="h-3.5 w-3.5" />Time left</p><p className="mt-1 font-mono font-bold text-rose-800">{formatTime(secondsLeft)}</p></div><div className="rounded-xl bg-[#f0eef9] p-3"><p className="text-xs font-medium text-[#5546a8]">Your score</p><p className="mt-1 font-bold text-[#403486]">{battle.players.find(p => p.userId === user.id)?.score ?? 0} <span className="text-xs font-medium">pts</span></p></div></div>
              <div className="mb-6 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[#7568bd] transition-all" style={{ width: `${Math.min(battle.questionCount, battle.finished ? battle.questionCount : Math.max(0, battle.currentQuestionIndex)) / battle.questionCount * 100}%` }} /></div>
              {currentQuestion ? <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7"><div className="mb-4 text-xs font-bold uppercase tracking-wider text-[#5546a8]">Question {String(currentQuestion.index + 1).padStart(2, "0")}</div><h3 className="mb-6 text-lg font-bold leading-relaxed text-slate-900 sm:text-xl">{currentQuestion.text}</h3><div className="grid gap-3 sm:grid-cols-2">{currentQuestion.choices.map((choice, i) => { const selected = selectedChoice === choice.id; return <button key={choice.id} disabled={answered === currentQuestion.index || busy || secondsLeft === 0} onClick={() => setSelection({ key: questionKey, id: choice.id })} className={`flex min-h-14 items-center gap-3 rounded-xl border p-3 text-left transition disabled:cursor-not-allowed ${selected ? "border-[#7668bc] bg-[#f4f2fb] text-slate-900 ring-1 ring-[#7668bc]/20" : "border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"}`}><span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg text-xs font-bold ${selected ? "bg-[#5546a8] text-white" : "bg-slate-100 text-slate-600"}`}>{String.fromCharCode(65 + i)}</span><span className="flex-1 text-sm font-medium leading-snug">{choice.text}</span>{selected && <Check className="h-4 w-4 text-[#5546a8]" />}</button>; })}</div>{feedback && <p role="status" className={`mt-4 rounded-lg px-3 py-2 text-sm font-semibold ${myAnswer?.correct ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}>{feedback}</p>}<button disabled={!selectedChoice || busy || answered === currentQuestion.index || secondsLeft === 0} onClick={() => void answer(selectedChoice)} className={`${primaryButton} mt-5 w-full`}>{busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}Submit answer</button></div> : <div className="rounded-xl border border-slate-200 bg-slate-50 p-7 text-center"><div className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-full bg-white text-[#5546a8]"><Check className="h-5 w-5" /></div><h3 className="font-bold text-slate-900">{startsIn > 0 ? `Battle starts in ${startsIn}` : battle.finished ? "You have answered every question" : "Loading next question..."}</h3><p className="mt-1 text-sm text-slate-500">{battle.finished ? "The final results will appear when the battle closes." : "Your next question will appear here."}</p></div>}
            </>}

            {battle.status === "completed" && <div className="mx-auto max-w-2xl"><div className="mb-6 text-center"><div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-xl bg-amber-50 text-amber-700"><Award className="h-6 w-6" /></div><h3 className="text-xl font-bold text-slate-900">Battle complete</h3><p className="mt-1 text-sm text-slate-500">Final scores for this room.</p></div><div className="space-y-2">{battle.results?.map(row => { const self = row.userId === user.id; const Icon = row.rank === 1 ? Crown : row.rank === 2 ? Medal : Shield; return <div key={row.userId} className={`flex items-center gap-3 rounded-xl border p-3 sm:p-4 ${self ? "border-[#d7d1ef] bg-[#f8f7fc]" : "border-slate-200 bg-white"}`}><div className={`grid h-9 w-9 place-items-center rounded-lg ${row.rank === 1 ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-500"}`}><Icon className="h-4 w-4" /></div><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-slate-900">{row.username}{self ? " · you" : ""}</p><p className="mt-0.5 text-xs text-slate-500">{row.correctCount} correct · Rank #{row.rank}</p></div><div className="text-right"><p className="font-bold text-slate-900">{row.score}</p><p className="text-[10px] text-slate-500">points</p></div></div>; })}</div><button onClick={close} className="mt-5 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Back to lobby</button></div>}
          </section>

          <aside className={`${panel} p-5`}>
            <div className="mb-4 flex items-center justify-between"><h3 className="flex items-center gap-2 font-bold text-slate-900"><Users className="h-4 w-4 text-[#5546a8]" />Players</h3><span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">{battle.players.length} / 8</span></div>
            <div className="space-y-2">{battle.players.map((player, index) => { const currentUser = player.userId === user.id; return <div key={player.userId} className={`rounded-xl border p-3 ${currentUser ? "border-[#ded9f1] bg-[#faf9fd]" : "border-slate-100 bg-white"}`}><div className="flex items-center gap-3"><div className={`relative grid h-9 w-9 shrink-0 place-items-center rounded-lg text-sm font-bold ${currentUser ? "bg-[#e9e6f5] text-[#5546a8]" : "bg-slate-100 text-slate-600"}`}>{player.username.slice(0, 1).toUpperCase()}{player.isHost && <Crown className="absolute -right-1.5 -top-1.5 h-3.5 w-3.5 fill-amber-500 text-amber-600" />}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-800">{player.username}{currentUser ? " (you)" : ""}</p><p className="mt-0.5 text-xs text-slate-500">{player.isHost ? "Host" : `Player ${index + 1}`}{battle.status === "active" ? ` · ${player.answeredCount}/${battle.questionCount} answered` : ""}</p></div><div className="text-right"><p className="text-sm font-bold text-slate-900">{player.score}</p><p className="text-[10px] text-slate-500">pts</p></div></div>{battle.status === "active" && <div className="mt-2 h-1 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[#8c81c8]" style={{ width: `${Math.min(100, player.answeredCount / battle.questionCount * 100)}%` }} /></div>}</div>; })}</div>
            <div className="mt-4 rounded-xl bg-slate-50 p-3"><p className="flex items-center gap-2 text-xs font-semibold text-slate-700"><Zap className="h-3.5 w-3.5 text-amber-600" />Scoring</p><p className="mt-1 text-xs leading-5 text-slate-600">Each correct answer earns 100 points. Unanswered questions earn no points.</p></div>
            {battle.status === "waiting" && !isHost && <p className="mt-3 text-xs text-slate-500">Waiting for the host to start.</p>}
          </aside>
        </div>}
      </div>
      {showEndConfirm && battle?.status === "active" && <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="presentation">
        <button aria-label="Close confirmation" onClick={() => setShowEndConfirm(false)} className="absolute inset-0 cursor-default bg-slate-950/40" />
        <section role="dialog" aria-modal="true" aria-labelledby="end-battle-title" aria-describedby="end-battle-description" className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
          <div className="mb-4 grid h-10 w-10 place-items-center rounded-xl bg-rose-50 text-rose-700"><Swords className="h-5 w-5" /></div>
          <h2 id="end-battle-title" className="text-lg font-bold text-slate-900">End this battle?</h2>
          <p id="end-battle-description" className="mt-2 text-sm leading-6 text-slate-600">The results will be shown to everyone now. Any unanswered questions will count as unanswered.</p>
          <div className="mt-6 flex justify-end gap-3">
            <button disabled={busy} onClick={() => setShowEndConfirm(false)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50">Cancel</button>
            <button disabled={busy} onClick={() => { setShowEndConfirm(false); void act(() => quizBattleService.end(battle.id)); }} className="inline-flex items-center gap-2 rounded-xl bg-rose-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-rose-800 disabled:opacity-50">{busy && <LoaderCircle className="h-4 w-4 animate-spin" />}End battle</button>
          </div>
        </section>
      </div>}
    </main>
  </MainLayout>;
}
