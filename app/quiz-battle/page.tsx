"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { Check, Copy, Crown, LoaderCircle, Radio, Rocket, Swords, Timer, Trophy, Users, Zap } from "lucide-react";
import MainLayout from "@/components/layout/MainLayout";
import { useAuth } from "@/contexts/AuthContext";
import { courseApi, type CourseResponse } from "@/services/courseService";
import axiosInstance from "@/lib/axios";
import { quizBattleService } from "@/services/quizBattleService";
import { battleError, useQuizBattle } from "@/hooks/useQuizBattle";
import type { User } from "@/types";

type BankQuestion = { id: string; questionText?: string | null; questionName?: string | null; status?: string | null; type?: string | null; multiple: boolean; choices?: { id: string; text?: string | null; gradePercent?: number | null }[] };

const panel = "rounded-2xl border border-[#30333b] bg-[#17191f]";
const primaryButton = "inline-flex items-center justify-center gap-2 rounded-xl bg-[#71658d] px-4 py-3 font-bold text-white transition hover:bg-[#81749e] disabled:cursor-not-allowed disabled:opacity-50";
const answerColors = ["border-[#34363e] bg-[#1a1c22] hover:border-[#55515f] hover:bg-[#202127]", "border-[#34363e] bg-[#1a1c22] hover:border-[#55515f] hover:bg-[#202127]", "border-[#34363e] bg-[#1a1c22] hover:border-[#55515f] hover:bg-[#202127]", "border-[#34363e] bg-[#1a1c22] hover:border-[#55515f] hover:bg-[#202127]"];
const battleMascots = ["🦊", "🐼", "🐸", "🐯", "🐙", "🐨", "🦉", "🐧"];

function BattleMascot({ userId, username, avatar, className }: { userId: string; username: string; avatar?: string; className: string }) {
  const hash = Array.from(userId || username).reduce((value, char) => value + char.charCodeAt(0), 0);
  const mascot = battleMascots[hash % battleMascots.length];
  return <div role="img" aria-label={`${username}'s mascot`} className={`relative grid shrink-0 place-items-center overflow-hidden rounded-full border border-white/15 bg-[#202637] ${className}`}>
    <span aria-hidden="true" className="text-xl leading-none">{mascot}</span>
    {avatar && <img src={avatar} alt="" className="absolute inset-0 h-full w-full object-cover" onError={event => event.currentTarget.remove()} />}
  </div>;
}

export default function QuizBattlePage() {
  return <Suspense fallback={<p className="p-8">Loading Quiz Battle...</p>}><QuizBattleAccount /></Suspense>;
}

function QuizBattleAccount() {
  const { user, isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <MainLayout headerTitle="Quiz Battle" immersive><p className="p-8 text-slate-200">Loading your account...</p></MainLayout>;
  if (!isAuthenticated || !user) return <MainLayout headerTitle="Quiz Battle" immersive><div className="p-8 text-center text-white"><h1 className="text-2xl font-black">Sign in to play</h1><Link href="/login" className="mt-4 inline-block rounded-xl bg-[#71658d] px-5 py-3 font-bold text-white">Sign in</Link></div></MainLayout>;
  return <QuizBattleRoom key={user.id} user={user} />;
}

function QuizBattleRoom({ user }: { user: User }) {
  const { battle, busy, error, live, secondsLeft, startsIn, myAnswer, answeredCurrentQuestion, run: act, answer, leave, close, setError } = useQuizBattle(user.id);
  const [courses, setCourses] = useState<CourseResponse[]>([]);
  const [code, setCode] = useState("");
  const [courseId, setCourseId] = useState("");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard" | "mixed">("mixed");
  const [questionCount, setQuestionCount] = useState(10);
  const [secondsPerQuestion, setSecondsPerQuestion] = useState(30);
  const [bankQuestions, setBankQuestions] = useState<BankQuestion[]>([]);
  const [bankCourseId, setBankCourseId] = useState("");
  const [questionIds, setQuestionIds] = useState<string[]>([]);
  const [selection, setSelection] = useState<{ key: string; id: string } | null>(null);
  const [rocketSelection, setRocketSelection] = useState<{ key: string; armed: boolean } | null>(null);
  const [copiedCode, setCopiedCode] = useState("");
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const currentQuestion = battle?.questions.find(q => q.index === battle.currentQuestionIndex);
  const questionKey = `${battle?.id}:${battle?.currentQuestionIndex}`;
  const selectedChoice = myAnswer?.choiceId ?? (battle?.answeredCurrentQuestion ? battle.myAnswerChoiceId ?? "" : selection?.key === questionKey ? selection.id : "");
  const rocketArmed = rocketSelection?.key === questionKey && rocketSelection.armed;
  const myPlayer = battle?.players.find(p => p.userId === user.id);
  const answered = answeredCurrentQuestion && battle ? battle.currentQuestionIndex : null;
  const feedback = myAnswer ? (myAnswer.correct ? `Correct! +${myAnswer.points} points` : "Not quite. The next question is coming up.") : "";
  const isHost = battle?.hostId === user.id;
  const battleResults = [...(battle?.results ?? [])].sort((a, b) => a.rank - b.rank);
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

  useEffect(() => {
    if (!courseId) return;
    let alive = true;
    axiosInstance.get<BankQuestion[]>("/question", { params: { courseId } }).then(({ data }) => {
      if (alive) { setBankQuestions(data.filter(q => !q.multiple && (q.type ?? "").toLowerCase().includes("choice") && (!q.status || ["ready", "active", "published"].includes(q.status.toLowerCase())) && (q.choices?.length ?? 0) >= 2 && q.choices?.every(c => !!c.text?.trim()) && q.choices?.filter(c => c.gradePercent === 100).length === 1)); setBankCourseId(courseId); }
    }).catch(e => { if (alive) setError(battleError(e)); });
    return () => { alive = false; };
  }, [courseId, setError]);

  const copyCode = async () => {
    if (!battle) return;
    try { await navigator.clipboard.writeText(battle.joinCode); setCopiedCode(battle.joinCode); }
    catch { setError("Could not copy the code. Please copy the six digits shown above manually."); }
  };

  return <MainLayout headerTitle="Quiz Battle" immersive>
    <main className="min-h-full bg-[#111318] text-white">
      <div className="mx-auto w-full max-w-7xl px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
        <header className="mb-7 flex flex-wrap items-end justify-between gap-4 text-white">
          <div>
            <p className="mb-2 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.14em] text-slate-200"><Swords className="h-4 w-4" />Quiz Battle</p>
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">{battle?.status === "completed" ? "Final results" : battle?.status === "active" ? "Battle in progress" : battle?.status === "waiting" ? "Classroom lobby" : "One room. One question. Everyone together."}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">{battle?.status === "completed" ? `Room ${battle.joinCode} · ${battle.questionCount} questions` : battle?.status === "active" ? "Think fast, answer smart, and keep an eye on the clock." : battle?.status === "waiting" ? "The room is open. Invite your classmates and get ready to play." : "Race the clock, build a streak, and climb the live classroom scoreboard."}</p>
          </div>
          <Link href="/leaderboard" className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/10"><Trophy className="h-4 w-4 text-amber-400" />Leaderboard</Link>
        </header>

        {battle && battle.status !== "completed" && <div className={`mb-4 flex items-center gap-2 text-xs font-medium ${battle.status === "active" ? "text-slate-400" : "text-slate-400"}`}><span className={`h-2 w-2 rounded-full ${live ? "bg-emerald-500" : "bg-slate-300"}`} /><Radio className="h-3.5 w-3.5" />{live ? "Live updates connected" : "Reconnecting. Room updates continue automatically."}</div>}
        {error && <div role="alert" className="mb-5 rounded-xl border border-rose-300/20 bg-rose-400/10 px-4 py-3 text-sm font-medium text-rose-100">{error}</div>}

        {!battle ? <div className="grid gap-5 lg:grid-cols-2">
          <section className={`${panel} p-6 sm:p-7`}>
            <div className="mb-6 flex items-start gap-4"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-slate-300/10 text-slate-200"><Crown className="h-5 w-5" /></div><div><h2 className="text-xl font-bold text-white">Host a battle</h2><p className="mt-1 text-sm text-slate-400">Create a room for learners in one of your courses.</p></div></div>
            <label className="mb-2 block text-sm font-semibold text-slate-200" htmlFor="course">Course</label>
            <select id="course" value={courseId} onChange={e => { setCourseId(e.target.value); setQuestionIds([]); }} className="w-full rounded-xl border border-white/10 bg-[#111318] px-4 py-3 text-sm text-white outline-none transition focus:border-slate-300/50 focus:ring-2 focus:ring-slate-300/10"><option value="">Choose a course...</option>{courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}</select>
            <label className="mb-2 mt-4 block text-sm font-semibold text-slate-200" htmlFor="battle-difficulty">Question difficulty</label>
            <select id="battle-difficulty" value={difficulty} onChange={e => setDifficulty(e.target.value as typeof difficulty)} className="w-full rounded-xl border border-white/10 bg-[#111318] px-4 py-3 text-sm text-white outline-none transition focus:border-slate-300/50 focus:ring-2 focus:ring-slate-300/10">
              <option value="mixed">Mixed · balanced</option><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
            </select>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="text-sm font-semibold text-slate-200">Questions {questionIds.length > 0 && <span className="font-normal text-slate-400">({questionIds.length} selected)</span>}<input type="number" min={1} max={100} value={questionCount} onChange={e => setQuestionCount(Math.max(1, Number(e.target.value) || 1))} disabled={questionIds.length > 0} className="mt-2 w-full rounded-xl border border-white/10 bg-[#111318] px-3 py-2.5 font-normal text-white disabled:text-slate-400" /></label>
              <label className="text-sm font-semibold text-slate-200">Seconds per question<input type="number" min={5} max={300} step={5} value={secondsPerQuestion} onChange={e => setSecondsPerQuestion(Math.max(5, Number(e.target.value) || 5))} className="mt-2 w-full rounded-xl border border-white/10 bg-[#111318] px-3 py-2.5 font-normal text-white" /></label>
            </div>
            {bankCourseId === courseId && bankQuestions.length > 0 && <div className="mt-5"><div className="mb-2 flex items-center justify-between gap-3"><div><h3 className="text-sm font-bold text-slate-200">Pick from your question bank</h3><p className="text-xs text-slate-400">Optional. Leave unselected to draw randomly.</p></div>{questionIds.length > 0 && <button onClick={() => setQuestionIds([])} className="text-xs font-semibold text-slate-200">Clear</button>}</div><div className="max-h-52 space-y-1 overflow-y-auto rounded-xl border border-white/10 bg-[#111318] p-2">{bankQuestions.map(q => <label key={q.id} className="flex cursor-pointer items-start gap-2 rounded-lg p-2 text-sm text-slate-300 hover:bg-white/[0.05]"><input type="checkbox" checked={questionIds.includes(q.id)} onChange={e => setQuestionIds(current => e.target.checked ? [...current, q.id] : current.filter(id => id !== q.id))} className="mt-1 accent-slate-400" /><span className="line-clamp-2">{q.questionText || q.questionName || "Untitled question"}</span></label>)}</div></div>}
            <p className="mt-3 text-xs leading-5 text-slate-400">All learners see the same question at the same time. The host can move the room forward early.</p>
            {courses.length === 0 && <p className="mt-4 rounded-xl border border-amber-200/10 bg-amber-300/10 p-3 text-sm text-amber-100">You do not own a published course that can host a battle.</p>}
            <button disabled={busy || !courseId || questionCount > 100 || secondsPerQuestion > 300} onClick={() => void act(() => quizBattleService.create(courseId, difficulty, secondsPerQuestion, questionCount, questionIds.length ? questionIds : undefined))} className={`${primaryButton} mt-5 w-full`}>{busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Swords className="h-4 w-4" />}Create room</button>
          </section>

          <section className={`${panel} p-6 sm:p-7`}>
            <div className="mb-6 flex items-start gap-4"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-slate-300/10 text-slate-200"><Users className="h-5 w-5" /></div><div><h2 className="text-xl font-bold text-white">Join a battle</h2><p className="mt-1 text-sm text-slate-400">Enter the six-digit code shared by the host.</p></div></div>
            <label htmlFor="join-code" className="mb-2 block text-sm font-semibold text-slate-200">Room code</label>
            <input id="join-code" value={code} maxLength={6} inputMode="numeric" onChange={e => setCode(e.target.value.replace(/\D/g, ""))} placeholder="000000" className="w-full rounded-xl border border-white/10 bg-[#111318] px-4 py-4 text-center font-mono text-2xl font-bold tracking-[.3em] text-white outline-none placeholder:text-slate-500 focus:border-slate-200/50 focus:ring-2 focus:ring-slate-200/10" />
            <button disabled={busy || code.length !== 6} onClick={() => void act(() => quizBattleService.join(code))} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#71658d] px-4 py-3 font-bold text-white transition hover:bg-[#81749e] disabled:cursor-not-allowed disabled:opacity-50">Join room <span aria-hidden="true">→</span></button>
            <p className="mt-3 text-xs leading-5 text-slate-400">You must be enrolled in the course to join.</p>
          </section>
        </div> : <div className={`grid gap-5 ${battle.status !== "active" ? "grid-cols-1" : "xl:grid-cols-[minmax(0,1fr)_320px]"}`}>
          <section className={battle.status === "completed" ? "relative overflow-hidden rounded-3xl border border-white/10 bg-[#10131d] p-5  sm:p-8" : battle.status === "active" ? "relative overflow-hidden rounded-3xl border border-white/10 bg-[#0d1019]/95 p-5  sm:p-7" : "relative overflow-hidden rounded-[28px] border border-white/10 bg-[#10131d] p-5  sm:p-8"}>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
              <div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-xl bg-white/10 text-slate-200">{battle.status === "completed" ? <Trophy className="h-5 w-5" /> : <Swords className="h-5 w-5" />}</div><div><p className="text-xs font-semibold text-slate-400">{battle.status === "waiting" ? "Waiting room" : battle.status === "active" ? "Battle in progress" : "Battle results"}</p><h2 className="mt-0.5 text-xl font-bold">Room <span className={`font-mono ${battle.status === "completed" ? "text-amber-200" : "text-slate-200"}`}>{battle.joinCode}</span></h2><p className="mt-1 text-xs capitalize text-slate-400">{battle.difficulty === "mixed" ? "Mixed difficulty" : `${battle.difficulty} difficulty`} · {battle.questionCount} questions · {battle.durationSeconds}s each</p></div></div>
              <div className="flex flex-wrap items-center gap-2">{battle.status === "waiting" && <button onClick={() => void copyCode()} className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.08]"><Copy className="h-4 w-4" />{copied ? "Copied" : "Copy code"}</button>}{battle.status === "active" && isHost && <button disabled={busy} onClick={() => setShowEndConfirm(true)} className="rounded-lg border border-rose-300/20 bg-rose-400/10 px-3 py-2 text-sm font-semibold text-rose-200 transition hover:bg-rose-400/20 disabled:opacity-50">End battle</button>}</div>
            </div>

            {battle.status === "waiting" && <div>
              <div className="relative overflow-hidden rounded-[24px] border border-white/10 bg-[#1a1c22] px-5 py-6 sm:px-8 sm:py-8">
                <div className="relative grid items-center gap-7 lg:grid-cols-[1fr_auto]">
                  <div><span className="inline-flex rounded-full border border-slate-200/15 bg-slate-200/[0.06] px-3 py-1 text-xs font-bold uppercase tracking-[.16em] text-slate-200">Classroom lobby</span><h3 className="mt-4 text-2xl font-black tracking-tight text-white sm:text-3xl">Your room is ready</h3><p className="mt-2 max-w-lg text-sm leading-6 text-slate-300">Share this code with your classmates. The teacher will start the battle when everyone is in.</p><div className="mt-5 flex flex-wrap items-center gap-3"><span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm font-semibold text-slate-200"><Users className="h-4 w-4 text-slate-200" />{battle.players.length} / 8 players</span><span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm font-semibold capitalize text-slate-200">{battle.difficulty} · {battle.questionCount} questions</span></div></div>
                  <div className="relative min-w-[230px] rounded-2xl border border-[#30333b] bg-[#111318] px-5 py-4 text-center  sm:min-w-[270px]"><p className="text-xs font-bold uppercase tracking-[.18em] text-slate-400">Join at Quiz Battle</p><p className="mt-2 font-mono text-4xl font-black tracking-[.16em] text-slate-200 sm:text-5xl">{battle.joinCode}</p><button onClick={() => void copyCode()} className="mt-3 inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-bold text-slate-200 transition hover:bg-white/[0.08]"><Copy className="h-4 w-4" />{copied ? "Copied" : "Copy room code"}</button></div>
                </div>
              </div>
              <div className="mt-7 flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-slate-200">Players in the room</p><h3 className="mt-1 text-xl font-extrabold text-white">Waiting for the class</h3></div><span className="text-sm text-slate-400">{battle.players.length === 0 ? "No learners have joined yet" : "Everyone is in? Start the battle."}</span></div>
              {battle.players.length > 0 ? <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{battle.players.map((player, index) => <div key={player.userId} className="flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.035] p-4"><BattleMascot userId={player.userId} username={player.username} avatar={player.avatar} className="h-11 w-11" /><div className="min-w-0 flex-1"><p className="truncate font-bold text-slate-100">{player.username}{player.userId === user.id ? " · you" : ""}</p><p className="mt-0.5 text-xs text-slate-400">Seat {String(index + 1).padStart(2, "0")}</p></div><span className="h-2.5 w-2.5 rounded-full bg-emerald-400 ring-4 ring-emerald-400/10" /></div>)}</div> : <div className="mt-4 flex min-h-28 items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-5 text-center text-sm text-slate-400">Share the room code to invite your first player.</div>}
              <div className="mt-6 flex flex-wrap items-center gap-3">{isHost && <button disabled={busy || battle.players.length === 0} onClick={() => void act(() => quizBattleService.start(battle.id))} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#71658d] px-5 py-3 font-bold text-white transition hover:bg-[#81749e] disabled:cursor-not-allowed disabled:opacity-50"><Zap className="h-4 w-4" />Start battle</button>}{!isHost && <p className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-slate-300">You are in. The teacher will start the battle soon.</p>}{isHost && battle.players.length === 0 && <p className="text-sm text-slate-400">The start button activates when the first learner joins.</p>}<button disabled={busy} onClick={() => void leave()} className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/[0.08] disabled:opacity-50">{isHost ? "Close room" : "Leave room"}</button></div>
            </div>}

            {battle.status === "active" && <>
              <div className="mb-5 grid grid-cols-3 gap-3"><div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 sm:p-4"><p className="text-xs font-medium text-slate-400">Question</p><p className="mt-1 text-lg font-bold text-white">{Math.max(0, battle.currentQuestionIndex + 1)} <span className="font-medium text-slate-400">/ {battle.questionCount}</span></p></div><div className="rounded-2xl border border-slate-300/20 bg-slate-300/[0.06] p-3 sm:p-4"><p className="flex items-center gap-1 text-xs font-medium text-slate-200"><Timer className="h-3.5 w-3.5" />Time left</p><p className={`mt-1 font-mono text-lg font-black ${secondsLeft <= 5 ? "animate-pulse text-rose-300" : "text-slate-200"}`}>{formatTime(secondsLeft)}</p></div><div className="rounded-2xl border border-slate-300/15 bg-slate-300/[0.05] p-3 sm:p-4"><p className="text-xs font-medium text-slate-200">{isHost ? "Players answered" : "Your score"}</p><p className="mt-1 text-lg font-bold text-white">{isHost ? `${battle.answersThisQuestion}/${battle.players.length}` : `${battle.players.find(p => p.userId === user.id)?.score ?? 0} pts`}</p></div></div>
              <div className="mb-6 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-[#71658d] transition-all" style={{ width: `${Math.min(battle.questionCount, battle.finished ? battle.questionCount : Math.max(0, battle.currentQuestionIndex)) / battle.questionCount * 100}%` }} /></div>
              {currentQuestion ? <div key={currentQuestion.index} className="battle-question-enter rounded-3xl border border-white/10 bg-[#1a1c22] p-5  sm:p-8"><div className="mb-5 flex items-center justify-between gap-3"><span className="rounded-full border border-slate-200/20 bg-slate-200/[0.07] px-3 py-1.5 text-xs font-bold uppercase tracking-[.14em] text-slate-100">Question {String(currentQuestion.index + 1).padStart(2, "0")}</span>{!isHost && answered === currentQuestion.index && <span className="text-xs font-semibold text-slate-400">Answer locked in</span>}</div><h3 className="mb-7 text-center text-xl font-extrabold leading-relaxed text-white sm:mb-9 sm:text-3xl">{currentQuestion.text}</h3>{isHost && <div className="mb-5 rounded-2xl border border-slate-300/15 bg-slate-300/[0.06] p-4"><p className="text-sm font-semibold text-slate-100">Host controls</p><p className="mt-1 text-sm text-slate-300">{battle.answersThisQuestion} of {battle.players.length} players answered.</p><button disabled={busy} onClick={() => void act(() => quizBattleService.advance(battle.id))} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#71658d] px-4 py-3 font-bold text-white transition hover:bg-[#81749e] disabled:opacity-50"><Zap className="h-4 w-4" />{battle.currentQuestionIndex + 1 === battle.questionCount ? "Finish battle now" : "Next question"}</button></div>}<div className={`${isHost ? "hidden" : "grid gap-3 sm:grid-cols-2"}`}>{currentQuestion.choices.map((choice, i) => { const selected = selectedChoice === choice.id; return <button key={choice.id} disabled={answered === currentQuestion.index || busy || secondsLeft === 0} onClick={() => setSelection({ key: questionKey, id: choice.id })} className={`group flex min-h-[76px] items-center gap-3 rounded-2xl border px-4 py-4 text-left text-white transition duration-200 disabled:cursor-not-allowed disabled:opacity-70 sm:px-5 ${selected ? "border-[#9487ad] bg-[#292532]" : answerColors[i % answerColors.length]}`}><span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl text-sm font-black ${selected ? "bg-[#71658d] text-white" : "bg-white/10 text-slate-200 group-hover:bg-white/15"}`}>{String.fromCharCode(65 + i)}</span><span className="flex-1 text-base font-semibold leading-snug sm:text-lg">{choice.text}</span>{selected && <Check className="h-5 w-5 text-slate-200" />}</button>; })}</div>{!isHost && <div className="mt-5 flex flex-wrap items-center justify-between gap-3">{myPlayer && !myPlayer.rocketUsed && answered !== currentQuestion.index && <button type="button" onClick={() => setRocketSelection({ key: questionKey, armed: !rocketArmed })} className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-bold transition ${rocketArmed ? "border-amber-300/60 bg-amber-300/15 text-amber-100" : "border-white/10 bg-white/[0.04] text-slate-300 hover:border-amber-200/30 hover:text-amber-100"}`}><Rocket className="h-4 w-4" />{rocketArmed ? "Rocket ready · +50" : "Use rocket · +50"}</button>}{rocketArmed && <span className="text-xs text-amber-100">Bonus applies to a correct answer.</span>}</div>}{!isHost && feedback && <p role="status" className={`mt-4 rounded-xl px-4 py-3 text-sm font-semibold ${myAnswer?.correct ? "border border-emerald-200/20 bg-emerald-300/10 text-emerald-100" : "border border-amber-200/20 bg-amber-300/10 text-amber-100"}`}>{feedback}</p>}<button disabled={!selectedChoice || busy || answered === currentQuestion.index || secondsLeft === 0} onClick={() => void answer(selectedChoice, rocketArmed)} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#71658d] px-4 py-3.5 font-extrabold text-white transition hover:bg-[#81749e] disabled:cursor-not-allowed disabled:opacity-40">{busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : rocketArmed ? <Rocket className="h-4 w-4" /> : <Check className="h-4 w-4" />}{rocketArmed ? "Submit answer · Rocket boost" : "Submit answer"}</button></div> : <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-8 text-center"><div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-slate-300/10 text-slate-200"><Check className="h-5 w-5" /></div><h3 className="font-bold text-white">{startsIn > 0 ? `Battle starts in ${startsIn}` : battle.finished ? "You have answered every question" : "Loading next question..."}</h3><p className="mt-1 text-sm text-slate-400">{battle.finished ? "The final results will appear when the battle closes." : "Your next question will appear here."}</p></div>}
            </>}

            {battle.status === "completed" && <div>
              <div className="mb-8 text-center"><p className="mb-2 text-xs font-extrabold uppercase tracking-[.22em] text-amber-200">Final scoreboard</p><h3 className="text-2xl font-black text-white sm:text-3xl">Battle complete</h3><p className="mt-2 text-sm text-slate-100">Every answer counted. Here is how the room finished.</p></div>
              {battleResults.length === 0 ? <p className="rounded-2xl border border-white/15 bg-white/5 p-8 text-center text-slate-100">No player results are available for this battle.</p> : <>
                <div className="mx-auto mb-8 flex min-h-52 max-w-3xl items-end justify-center gap-2 px-1 sm:min-h-64 sm:gap-4">
                  {[battleResults[1], battleResults[0], battleResults[2]].map((row, index) => {
                    if (!row) return <div key={`empty-${index}`} className="hidden flex-1 sm:block" />;
                    const place = row.rank;
                    const podium = place === 1 ? "h-48 border-[#806d38] bg-[#29251d] text-[#e4c978] sm:h-56" : place === 2 ? "h-36 border-[#555a63] bg-[#202126] text-[#c4c7ce] sm:h-44" : "h-28 border-[#70513f] bg-[#241f1d] text-[#c89472] sm:h-36";
                    const self = row.userId === user.id;
                    return <div key={row.userId} className={`relative flex min-w-0 flex-1 flex-col items-center justify-end rounded-t-2xl border-x border-t px-2 pb-3 pt-5 text-center  ${podium}`}>
                      {place === 1 && <Crown className="absolute -top-8 h-9 w-9 fill-amber-300 text-amber-200 sm:-top-10 sm:h-11 sm:w-11" />}
                      <div className="absolute -top-4 max-w-[90%] truncate rounded-lg border border-white/10 bg-[#10131d]/95 px-3 py-1 text-xs font-extrabold text-white  sm:text-sm">{row.username}{self ? " · you" : ""}</div>
                      <BattleMascot userId={row.userId} username={row.username} avatar={row.avatar} className="mb-2 h-10 w-10 border-2 border-white/70 bg-[#202637] text-sm font-black sm:h-12 sm:w-12" />
                      <p className="text-4xl font-black opacity-25 sm:text-6xl">{place}</p>
                      <p className="text-xs font-extrabold sm:text-sm">{row.score} pts</p>
                    </div>;
                  })}
                </div>
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#111318]">
                  <div className="overflow-x-auto"><table className="w-full min-w-[640px] border-collapse text-left text-sm">
                    <thead className="bg-white/[0.06] text-slate-300"><tr><th className="px-4 py-3 font-bold">Rank</th><th className="px-4 py-3 font-bold">Player</th><th className="px-4 py-3 text-right font-bold">Score</th><th className="px-4 py-3 text-right font-bold">Correct</th><th className="px-4 py-3 text-right font-bold">Incorrect</th><th className="px-4 py-3 text-right font-bold">Accuracy</th></tr></thead>
                    <tbody>{battleResults.map((row, index) => {
                      const correct = Math.min(battle.questionCount, Math.max(0, row.correctCount));
                      const incorrect = Math.max(0, battle.questionCount - correct);
                      const accuracy = battle.questionCount > 0 ? Math.round((correct / battle.questionCount) * 100) : 0;
                      const self = row.userId === user.id;
                      return <tr key={row.userId} className={`border-t border-white/[0.06] ${self ? "bg-slate-300/[0.07]" : index % 2 === 1 ? "bg-white/[0.025]" : "bg-transparent"}`}><td className="px-4 py-3.5 font-bold">{row.rank === 1 ? <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-amber-300 text-amber-950"><Trophy className="h-4 w-4" /></span> : <span className="pl-2">{row.rank}</span>}</td><td className="px-4 py-3.5 font-semibold">{row.username}{self ? <span className="ml-2 text-xs text-slate-200">you</span> : null}</td><td className="px-4 py-3.5 text-right font-extrabold text-amber-200">{row.score}</td><td className="px-4 py-3.5 text-right text-slate-200">{correct}</td><td className="px-4 py-3.5 text-right text-slate-300">{incorrect}</td><td className="px-4 py-3.5 text-right font-semibold text-slate-200">{accuracy}%</td></tr>;
                    })}</tbody>
                  </table></div>
                </div>
              </>}
              {battle.review && battle.review.length > 0 && <section className="mt-8 border-t border-white/10 pt-7"><div className="mb-4"><p className="text-xs font-bold uppercase tracking-[.16em] text-slate-200">Personal review</p><h4 className="mt-1 text-xl font-extrabold text-white">Your answers and explanations</h4></div><div className="space-y-3">{battle.review.map(item => { const resultLabel = item.isCorrect === null ? "Not answered" : item.isCorrect ? "Correct" : "Incorrect"; const resultStyle = item.isCorrect === true ? "bg-emerald-300/15 text-emerald-200" : item.isCorrect === false ? "bg-rose-300/15 text-rose-200" : "bg-white/10 text-slate-300"; return <article key={item.questionIndex} className="rounded-xl border border-white/[0.07] bg-[#151923] p-4 text-slate-100"><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="text-sm font-semibold leading-6">{item.questionIndex + 1}. {item.question}</p><p className="mt-1 text-xs capitalize text-slate-400">{item.difficulty} difficulty</p></div><span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${resultStyle}`}>{resultLabel}</span></div><div className="mt-3 grid gap-2 text-sm sm:grid-cols-2"><p className="rounded-lg border border-white/[0.06] bg-white/[0.025] p-3 text-slate-300"><span className="block text-xs font-semibold uppercase tracking-wide text-slate-400">Your answer</span><span className="mt-1 block">{item.yourAnswer ?? "Not answered"}</span></p><p className="rounded-lg border border-emerald-300/10 bg-emerald-300/[0.05] p-3 text-emerald-100"><span className="block text-xs font-semibold uppercase tracking-wide text-emerald-300/80">Correct answer</span><span className="mt-1 block">{item.correctAnswer}</span></p></div>{item.explanation && <p className="mt-3 border-l-2 border-slate-300/50 pl-3 text-sm leading-6 text-slate-300"><span className="font-semibold text-white">Why: </span>{item.explanation}</p>}</article>; })}</div></section>}
              <div className="mt-6 flex flex-wrap gap-3">{isHost && !battle.rematchBattleId && <button disabled={busy} onClick={() => void act(() => quizBattleService.rematch(battle.id))} className={`${primaryButton} px-5 py-3 text-sm disabled:opacity-50`}>Play again</button>}{battle.rematchBattleId && <button disabled={busy} onClick={() => void act(() => quizBattleService.get(battle.rematchBattleId!))} className="rounded-xl border border-white/25 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10">Join rematch</button>}<button onClick={close} className="rounded-xl border border-white/25 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10">Back to lobby</button></div>
            </div>}
          </section>

          {battle.status === "active" && <aside className="rounded-3xl border border-white/10 bg-[#0d1019]/95 p-5 text-white ">
            <div className="mb-4 flex items-center justify-between"><h3 className="flex items-center gap-2 font-bold text-white"><Users className="h-4 w-4 text-slate-200" />Players</h3><span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-xs font-semibold text-slate-300">{battle.players.length} joined</span></div>
            {isHost && <div className="mb-3 rounded-xl border border-slate-200/10 bg-slate-300/[0.06] p-3"><p className="flex items-center gap-2 text-sm font-semibold text-slate-100"><Crown className="h-4 w-4 text-amber-300" />Teacher · Host</p><p className="mt-1 text-xs text-slate-400">You manage the room and view live progress.</p></div>}
            <div className="max-h-[55vh] space-y-2 overflow-y-auto">{battle.players.map((player, index) => { const currentUser = player.userId === user.id; const answeredCurrent = player.answeredCount > battle.currentQuestionIndex; return <div key={player.userId} className={`rounded-xl border p-3 ${currentUser ? "border-slate-200/20 bg-slate-300/[0.07]" : "border-white/[0.06] bg-white/[0.025]"}`}><div className="flex items-center gap-3"><BattleMascot userId={player.userId} username={player.username} avatar={player.avatar} className="h-9 w-9" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-white">{player.username}{currentUser ? " (you)" : ""}</p><p className="mt-0.5 text-xs text-slate-300">{answeredCurrent ? "Answered · waiting" : "Thinking"}</p></div><div className="text-right"><p className="text-sm font-bold text-white">{player.score}</p><p className="text-[10px] text-slate-300">{player.streak > 1 ? `🔥 ${player.streak} streak` : "pts"}</p></div></div><div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10"><div className={`h-full ${answeredCurrent ? "bg-emerald-300" : "bg-slate-300/70"}`} style={{ width: `${Math.min(100, answeredCurrent ? 100 : (battle.durationSeconds - secondsLeft) / battle.durationSeconds * 100)}%` }} /></div></div>; })}</div>
            <div className="mt-4 rounded-xl border border-white/[0.06] bg-white/[0.025] p-3"><p className="flex items-center gap-2 text-xs font-semibold text-slate-200"><Zap className="h-3.5 w-3.5 text-amber-300" />Scoring</p><p className="mt-1 text-xs leading-5 text-slate-400">Correct answers earn 100 points. Streaks add up to +100; one rocket per player adds +50 to a correct answer.</p></div>
          </aside>}
        </div>}
      </div>
      {showEndConfirm && battle?.status === "active" && <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="presentation">
        <button aria-label="Close confirmation" onClick={() => setShowEndConfirm(false)} className="absolute inset-0 cursor-default bg-slate-950/40" />
        <section role="dialog" aria-modal="true" aria-labelledby="end-battle-title" aria-describedby="end-battle-description" className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#11141e] p-6 text-white ">
          <div className="mb-4 grid h-10 w-10 place-items-center rounded-xl bg-rose-300/10 text-rose-200"><Swords className="h-5 w-5" /></div>
          <h2 id="end-battle-title" className="text-lg font-bold text-white">End this battle?</h2>
          <p id="end-battle-description" className="mt-2 text-sm leading-6 text-slate-300">The results will be shown to everyone now. Any unanswered questions will count as unanswered.</p>
          <div className="mt-6 flex justify-end gap-3">
            <button disabled={busy} onClick={() => setShowEndConfirm(false)} className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.05] disabled:opacity-50">Cancel</button>
            <button disabled={busy} onClick={() => { setShowEndConfirm(false); void act(() => quizBattleService.end(battle.id)); }} className="inline-flex items-center gap-2 rounded-xl bg-rose-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-rose-800 disabled:opacity-50">{busy && <LoaderCircle className="h-4 w-4 animate-spin" />}End battle</button>
          </div>
        </section>
      </div>}
    </main>
  </MainLayout>;
}
