"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { Award, Check, Copy, Crown, LoaderCircle, Medal, Radio, Rocket, Shield, Swords, Timer, Trophy, Users, Zap } from "lucide-react";
import MainLayout from "@/components/layout/MainLayout";
import { useAuth } from "@/contexts/AuthContext";
import { courseApi, type CourseResponse } from "@/services/courseService";
import axiosInstance from "@/lib/axios";
import { quizBattleService } from "@/services/quizBattleService";
import { battleError, useQuizBattle } from "@/hooks/useQuizBattle";
import type { User } from "@/types";

type BankQuestion = { id: string; questionText?: string | null; questionName?: string | null; status?: string | null; type?: string | null; multiple: boolean; choices?: { id: string; text?: string | null; gradePercent?: number | null }[] };

const panel = "rounded-2xl border border-slate-200 bg-white shadow-sm";
const primaryButton = "inline-flex items-center justify-center gap-2 rounded-xl bg-[#5546a8] px-4 py-3 font-bold text-white transition hover:bg-[#47388f] disabled:cursor-not-allowed disabled:opacity-50";
const answerColors = ["border-transparent bg-[#e56562] text-white shadow-sm hover:-translate-y-0.5 hover:shadow-lg hover:shadow-rose-200/60", "border-transparent bg-[#468cdb] text-white shadow-sm hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-200/60", "border-transparent bg-[#e9ad38] text-white shadow-sm hover:-translate-y-0.5 hover:shadow-lg hover:shadow-amber-200/60", "border-transparent bg-[#39a58d] text-white shadow-sm hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-200/60"];

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

  return <MainLayout headerTitle="Quiz Battle">
    <main className="min-h-full bg-[radial-gradient(ellipse_at_top_left,_#eeeaff_0,_transparent_38%),linear-gradient(180deg,_#f8f7fc_0%,_#f6f7fb_100%)] text-slate-900">
      <div className="mx-auto w-full max-w-7xl px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
        <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.14em] text-[#5546a8]"><Swords className="h-4 w-4" />Quiz Battle</p>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">One room. One question. Everyone together.</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Race the clock, build a streak, and climb the live classroom scoreboard.</p>
          </div>
          <Link href="/leaderboard" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"><Trophy className="h-4 w-4 text-amber-600" />Leaderboard</Link>
        </header>

        {battle && battle.status !== "completed" && <div className="mb-4 flex items-center gap-2 text-xs font-medium text-slate-500"><span className={`h-2 w-2 rounded-full ${live ? "bg-emerald-500" : "bg-slate-300"}`} /><Radio className="h-3.5 w-3.5" />{live ? "Live updates connected" : "Reconnecting. Room updates continue automatically."}</div>}
        {error && <div role="alert" className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">{error}</div>}

        {!battle ? <div className="grid gap-5 lg:grid-cols-2">
          <section className={`${panel} p-6 sm:p-7`}>
            <div className="mb-6 flex items-start gap-4"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#f0eef9] text-[#5546a8]"><Crown className="h-5 w-5" /></div><div><h2 className="text-xl font-bold">Host a battle</h2><p className="mt-1 text-sm text-slate-500">Create a room for learners in one of your courses.</p></div></div>
            <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="course">Course</label>
            <select id="course" value={courseId} onChange={e => { setCourseId(e.target.value); setQuestionIds([]); }} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#7466bf] focus:ring-2 focus:ring-[#7466bf]/15"><option value="">Choose a course...</option>{courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}</select>
            <label className="mb-2 mt-4 block text-sm font-semibold text-slate-700" htmlFor="battle-difficulty">Question difficulty</label>
            <select id="battle-difficulty" value={difficulty} onChange={e => setDifficulty(e.target.value as typeof difficulty)} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#7466bf] focus:ring-2 focus:ring-[#7466bf]/15">
              <option value="mixed">Mixed · balanced</option><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
            </select>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="text-sm font-semibold text-slate-700">Questions {questionIds.length > 0 && <span className="font-normal text-slate-500">({questionIds.length} selected)</span>}<input type="number" min={1} max={100} value={questionCount} onChange={e => setQuestionCount(Math.max(1, Number(e.target.value) || 1))} disabled={questionIds.length > 0} className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal" /></label>
              <label className="text-sm font-semibold text-slate-700">Seconds per question<input type="number" min={5} max={300} step={5} value={secondsPerQuestion} onChange={e => setSecondsPerQuestion(Math.max(5, Number(e.target.value) || 5))} className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal" /></label>
            </div>
            {bankCourseId === courseId && bankQuestions.length > 0 && <div className="mt-5"><div className="mb-2 flex items-center justify-between gap-3"><div><h3 className="text-sm font-bold text-slate-800">Pick from your question bank</h3><p className="text-xs text-slate-500">Optional. Leave unselected to draw randomly.</p></div>{questionIds.length > 0 && <button onClick={() => setQuestionIds([])} className="text-xs font-semibold text-[#5546a8]">Clear</button>}</div><div className="max-h-52 space-y-1 overflow-y-auto rounded-xl border border-slate-200 p-2">{bankQuestions.map(q => <label key={q.id} className="flex cursor-pointer items-start gap-2 rounded-lg p-2 text-sm hover:bg-slate-50"><input type="checkbox" checked={questionIds.includes(q.id)} onChange={e => setQuestionIds(current => e.target.checked ? [...current, q.id] : current.filter(id => id !== q.id))} className="mt-1 accent-[#5546a8]" /><span className="line-clamp-2">{q.questionText || q.questionName || "Untitled question"}</span></label>)}</div></div>}
            <p className="mt-3 text-xs leading-5 text-slate-500">All learners see the same question at the same time. The host can move the room forward early.</p>
            {courses.length === 0 && <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">You do not own a published course that can host a battle.</p>}
            <button disabled={busy || !courseId || questionCount > 100 || secondsPerQuestion > 300} onClick={() => void act(() => quizBattleService.create(courseId, difficulty, secondsPerQuestion, questionCount, questionIds.length ? questionIds : undefined))} className={`${primaryButton} mt-5 w-full`}>{busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Swords className="h-4 w-4" />}Create room</button>
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
              <div className="flex items-center gap-3"><div className={`grid h-11 w-11 place-items-center rounded-xl ${battle.status === "completed" ? "bg-amber-50 text-amber-700" : "bg-[#f0eef9] text-[#5546a8]"}`}>{battle.status === "completed" ? <Trophy className="h-5 w-5" /> : <Swords className="h-5 w-5" />}</div><div><p className="text-xs font-semibold text-slate-500">{battle.status === "waiting" ? "Waiting room" : battle.status === "active" ? "Battle in progress" : "Final results"}</p><h2 className="mt-0.5 text-xl font-bold">Room <span className="font-mono text-[#5546a8]">{battle.joinCode}</span></h2><p className="mt-1 text-xs capitalize text-slate-500">{battle.difficulty === "mixed" ? "Mixed difficulty" : `${battle.difficulty} difficulty`} · {battle.questionCount} questions · {battle.durationSeconds}s each</p></div></div>
              <div className="flex flex-wrap items-center gap-2">{battle.status === "waiting" && <button onClick={() => void copyCode()} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"><Copy className="h-4 w-4" />{copied ? "Copied" : "Copy code"}</button>}{battle.status === "active" && isHost && <button disabled={busy} onClick={() => setShowEndConfirm(true)} className="rounded-lg border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:opacity-50">End battle</button>}</div>
            </div>

            {battle.status === "waiting" && <div>
              <div className="mb-5 flex items-center justify-between"><div><h3 className="font-semibold text-slate-800">Players</h3><p className="mt-1 text-sm text-slate-500">You’re hosting. Share the room code and start when everyone is ready.</p></div><span className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-600">{battle.players.length} joined</span></div>
              <div className="grid max-h-72 gap-3 overflow-y-auto sm:grid-cols-2">{battle.players.map((player, index) => <div key={player.userId} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3"><div className="grid h-9 w-9 place-items-center rounded-lg bg-[#e9e6f5] text-sm font-bold text-[#5546a8]">{player.username.slice(0, 1).toUpperCase()}</div><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-800">{player.username}{player.userId === user.id ? " (you)" : ""}</p><p className="text-xs text-slate-500">Player {index + 1}</p></div></div>)}</div>
              <div className="mt-5 flex flex-wrap items-center gap-3">{isHost && <button disabled={busy || battle.players.length === 0} onClick={() => void act(() => quizBattleService.start(battle.id))} className={primaryButton}><Zap className="h-4 w-4" />Start battle</button>}{!isHost && <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">You joined. Waiting for the teacher to start.</p>}{isHost && battle.players.length === 0 && <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">Waiting for the first player to join.</p>}<button disabled={busy} onClick={() => void leave()} className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50">{isHost ? "Close room" : "Leave room"}</button></div>
            </div>}

            {battle.status === "active" && <>
              <div className="mb-5 grid grid-cols-3 gap-3"><div className="rounded-xl bg-slate-50 p-3"><p className="text-xs font-medium text-slate-500">Question</p><p className="mt-1 font-bold text-slate-900">{Math.max(0, battle.currentQuestionIndex + 1)} <span className="font-medium text-slate-500">/ {battle.questionCount}</span></p></div><div className="rounded-xl bg-rose-50 p-3"><p className="flex items-center gap-1 text-xs font-medium text-rose-700"><Timer className="h-3.5 w-3.5" />Time left</p><p className="mt-1 font-mono font-bold text-rose-800">{formatTime(secondsLeft)}</p></div><div className="rounded-xl bg-[#f0eef9] p-3"><p className="text-xs font-medium text-[#5546a8]">{isHost ? "Players answered" : "Your score"}</p><p className="mt-1 font-bold text-[#403486]">{isHost ? `${battle.answersThisQuestion}/${battle.players.length}` : `${battle.players.find(p => p.userId === user.id)?.score ?? 0} pts`}</p></div></div>
              <div className="mb-6 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[#7568bd] transition-all" style={{ width: `${Math.min(battle.questionCount, battle.finished ? battle.questionCount : Math.max(0, battle.currentQuestionIndex)) / battle.questionCount * 100}%` }} /></div>
              {currentQuestion ? <div key={currentQuestion.index} className="battle-question-enter rounded-2xl border border-white bg-white p-5 shadow-[0_22px_70px_rgba(64,52,134,0.10)] sm:p-7"><div className="mb-4 text-xs font-bold uppercase tracking-wider text-[#5546a8]">Question {String(currentQuestion.index + 1).padStart(2, "0")}</div><h3 className="mb-6 text-lg font-bold leading-relaxed text-slate-900 sm:text-xl">{currentQuestion.text}</h3>{isHost && <div className="mb-5 rounded-xl bg-[#f6f4fb] p-4"><p className="text-sm font-semibold text-[#403486]">Host controls</p><p className="mt-1 text-sm text-slate-600">{battle.answersThisQuestion} of {battle.players.length} players answered.</p><button disabled={busy} onClick={() => void act(() => quizBattleService.advance(battle.id))} className={`${primaryButton} mt-4 w-full`}><Zap className="h-4 w-4" />{battle.currentQuestionIndex + 1 === battle.questionCount ? "Finish battle now" : "Next question"}</button></div>}<div className={`${isHost ? "hidden" : "grid gap-3 sm:grid-cols-2"}`}>{currentQuestion.choices.map((choice, i) => { const selected = selectedChoice === choice.id; return <button key={choice.id} disabled={answered === currentQuestion.index || busy || secondsLeft === 0} onClick={() => setSelection({ key: questionKey, id: choice.id })} className={`flex min-h-14 items-center gap-3 rounded-xl border p-3 text-left transition disabled:cursor-not-allowed ${selected ? "border-[#7668bc] bg-[#f4f2fb] text-slate-900 ring-1 ring-[#7668bc]/20" : answerColors[i % answerColors.length]}`}><span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg text-xs font-bold ${selected ? "bg-[#5546a8] text-white" : "bg-slate-100 text-slate-600"}`}>{String.fromCharCode(65 + i)}</span><span className="flex-1 text-sm font-medium leading-snug">{choice.text}</span>{selected && <Check className="h-4 w-4 text-[#5546a8]" />}</button>; })}</div>{!isHost && <div className="mt-4 flex flex-wrap items-center justify-between gap-3">{myPlayer && !myPlayer.rocketUsed && answered !== currentQuestion.index && <button type="button" onClick={() => setRocketSelection({ key: questionKey, armed: !rocketArmed })} className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-bold transition ${rocketArmed ? "border-amber-400 bg-amber-100 text-amber-900 shadow-sm" : "border-slate-200 bg-white text-slate-600 hover:border-amber-300 hover:text-amber-800"}`}><Rocket className="h-4 w-4" />{rocketArmed ? "Rocket armed · +50" : "Use rocket · +50"}</button>}{rocketArmed && <span className="text-xs text-amber-800">Bonus applies to a correct answer.</span>}</div>}{!isHost && feedback && <p role="status" className={`mt-4 rounded-lg px-3 py-2 text-sm font-semibold ${myAnswer?.correct ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}>{feedback}</p>}<button disabled={!selectedChoice || busy || answered === currentQuestion.index || secondsLeft === 0} onClick={() => void answer(selectedChoice, rocketArmed)} className={`${primaryButton} mt-5 w-full ${isHost ? "hidden" : ""}`}>{busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : rocketArmed ? <Rocket className="h-4 w-4" /> : <Check className="h-4 w-4" />}{rocketArmed ? "Submit · rocket boost" : "Submit answer"}</button></div> : <div className="rounded-xl border border-slate-200 bg-slate-50 p-7 text-center"><div className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-full bg-white text-[#5546a8]"><Check className="h-5 w-5" /></div><h3 className="font-bold text-slate-900">{startsIn > 0 ? `Battle starts in ${startsIn}` : battle.finished ? "You have answered every question" : "Loading next question..."}</h3><p className="mt-1 text-sm text-slate-500">{battle.finished ? "The final results will appear when the battle closes." : "Your next question will appear here."}</p></div>}
            </>}

            {battle.status === "completed" && <div className="mx-auto max-w-2xl">
              <div className="mb-6 text-center"><div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-xl bg-amber-50 text-amber-700"><Award className="h-6 w-6" /></div><h3 className="text-xl font-bold text-slate-900">Battle complete</h3><p className="mt-1 text-sm text-slate-500">Final scores and your answer review.</p></div>
              <div className="space-y-2">{battle.results?.map(row => { const self = row.userId === user.id; const Icon = row.rank === 1 ? Crown : row.rank === 2 ? Medal : Shield; return <div key={row.userId} className={`flex items-center gap-3 rounded-xl border p-3 sm:p-4 ${self ? "border-[#d7d1ef] bg-[#f8f7fc]" : "border-slate-200 bg-white"}`}><div className={`grid h-9 w-9 place-items-center rounded-lg ${row.rank === 1 ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-500"}`}><Icon className="h-4 w-4" /></div><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-slate-900">{row.username}{self ? " · you" : ""}</p><p className="mt-0.5 text-xs text-slate-500">{row.correctCount} correct · Rank #{row.rank}</p></div><div className="text-right"><p className="font-bold text-slate-900">{row.score}</p><p className="text-[10px] text-slate-500">points</p></div></div>; })}</div>
              {battle.review && battle.review.length > 0 && <section className="mt-7 border-t border-slate-100 pt-6"><h4 className="mb-3 text-base font-bold text-slate-900">Answer review</h4><div className="space-y-3">{battle.review.map(item => { const resultLabel = item.isCorrect === null ? "Not answered" : item.isCorrect ? "Correct" : "Incorrect"; const resultStyle = item.isCorrect === true ? "bg-emerald-50 text-emerald-800" : item.isCorrect === false ? "bg-rose-50 text-rose-800" : "bg-slate-100 text-slate-600"; return <article key={item.questionIndex} className="rounded-xl border border-slate-200 bg-white p-4"><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="text-sm font-semibold leading-6 text-slate-900">{item.questionIndex + 1}. {item.question}</p><p className="mt-1 text-xs capitalize text-slate-500">{item.difficulty} difficulty</p></div><span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${resultStyle}`}>{resultLabel}</span></div><div className="mt-3 grid gap-2 text-sm sm:grid-cols-2"><p className="rounded-lg bg-slate-50 p-3 text-slate-600"><span className="block text-xs font-semibold uppercase tracking-wide text-slate-400">Your answer</span><span className="mt-1 block">{item.yourAnswer ?? "Not answered"}</span></p><p className="rounded-lg bg-emerald-50 p-3 text-emerald-900"><span className="block text-xs font-semibold uppercase tracking-wide text-emerald-700">Correct answer</span><span className="mt-1 block">{item.correctAnswer}</span></p></div>{item.explanation && <p className="mt-3 border-l-2 border-[#b9b2df] pl-3 text-sm leading-6 text-slate-600"><span className="font-semibold text-slate-800">Why: </span>{item.explanation}</p>}</article>; })}</div></section>}
              <div className="mt-5 grid gap-2 sm:grid-cols-2">{isHost && !battle.rematchBattleId && <button disabled={busy} onClick={() => void act(() => quizBattleService.rematch(battle.id))} className={primaryButton}>Play again</button>}{battle.rematchBattleId && <button disabled={busy} onClick={() => void act(() => quizBattleService.get(battle.rematchBattleId!))} className="rounded-xl border border-[#d7d1ef] px-4 py-3 text-sm font-bold text-[#5546a8] transition hover:bg-[#f8f7fc]">Join rematch</button>}<button onClick={close} className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Back to lobby</button></div>
            </div>}
          </section>

          <aside className={`${panel} p-5`}>
            <div className="mb-4 flex items-center justify-between"><h3 className="flex items-center gap-2 font-bold text-slate-900"><Users className="h-4 w-4 text-[#5546a8]" />Players</h3><span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">{battle.players.length} joined</span></div>
            {isHost && <div className="mb-3 rounded-xl bg-[#f6f4fb] p-3"><p className="flex items-center gap-2 text-sm font-semibold text-[#403486]"><Crown className="h-4 w-4 text-amber-600" />Teacher · Host</p><p className="mt-1 text-xs text-slate-600">You manage the room and view live progress.</p></div>}
            <div className="max-h-[55vh] space-y-2 overflow-y-auto">{battle.players.map((player, index) => { const currentUser = player.userId === user.id; const answeredCurrent = battle.status === "active" && player.answeredCount > battle.currentQuestionIndex; return <div key={player.userId} className={`rounded-xl border p-3 ${currentUser ? "border-[#ded9f1] bg-[#faf9fd]" : "border-slate-100 bg-white"}`}><div className="flex items-center gap-3"><div className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg text-sm font-bold ${currentUser ? "bg-[#e9e6f5] text-[#5546a8]" : "bg-slate-100 text-slate-600"}`}>{player.username.slice(0, 1).toUpperCase()}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-800">{player.username}{currentUser ? " (you)" : ""}</p><p className="mt-0.5 text-xs text-slate-500">{battle.status === "active" ? answeredCurrent ? "Answered · waiting" : "Thinking" : `Player ${index + 1}`}</p></div><div className="text-right"><p className="text-sm font-bold text-slate-900">{player.score}</p><p className="text-[10px] text-slate-500">{player.streak > 1 ? `🔥 ${player.streak} streak` : "pts"}</p></div></div>{battle.status === "active" && <div className="mt-2 h-1 overflow-hidden rounded-full bg-slate-100"><div className={`h-full ${answeredCurrent ? "bg-emerald-500" : "bg-[#8c81c8]"}`} style={{ width: `${Math.min(100, answeredCurrent ? 100 : (battle.durationSeconds - secondsLeft) / battle.durationSeconds * 100)}%` }} /></div>}</div>; })}</div>
            <div className="mt-4 rounded-xl bg-slate-50 p-3"><p className="flex items-center gap-2 text-xs font-semibold text-slate-700"><Zap className="h-3.5 w-3.5 text-amber-600" />Streak scoring</p><p className="mt-1 text-xs leading-5 text-slate-600">Correct answers earn 100 points. Streaks add up to +100; one rocket per player adds +50 to a correct answer.</p></div>
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
