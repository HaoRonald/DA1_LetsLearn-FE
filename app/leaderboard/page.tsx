"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Trophy } from "lucide-react";
import MainLayout from "@/components/layout/MainLayout";
import { useAuth } from "@/contexts/AuthContext";
import { quizBattleService, type LeaderboardRow } from "@/services/quizBattleService";
import { battleError } from "@/hooks/useQuizBattle";

export default function LeaderboardPage() {
  return <Suspense fallback={<p className="p-8">Loading leaderboard...</p>}><LeaderboardAccount /></Suspense>;
}

function LeaderboardAccount() {
  const { user, isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <MainLayout headerTitle="Leaderboard"><p className="p-8">Loading your account...</p></MainLayout>;
  if (!isAuthenticated || !user) return <MainLayout headerTitle="Leaderboard"><div className="p-8 text-center"><Link href="/login" className="font-bold text-indigo-600">Sign in to view the leaderboard</Link></div></MainLayout>;
  return <Leaderboard key={user.id} />;
}

function Leaderboard() {
  const [period, setPeriod] = useState<"all" | "month" | "week">("all");
  const [reload, setReload] = useState(0);
  // Key requests in the rendered state so switching a tab never shows the previous period's rows.
  const [response, setResponse] = useState<{ key: string; rows: LeaderboardRow[]; error: string } | null>(null);
  const key = `${period}:${reload}`;
  const loading = response?.key !== key;
  const rows = loading ? [] : response?.rows ?? [];
  const error = loading ? "" : response?.error;
  useEffect(() => {
    let alive = true;
    quizBattleService.leaderboard(period)
      .then(rows => { if (alive) setResponse({ key, rows, error: "" }); })
      .catch(e => { if (alive) setResponse({ key, rows: [], error: battleError(e) }); });
    return () => { alive = false; };
  }, [period, key]);

  return <MainLayout headerTitle="Leaderboard">
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      <Link href="/quiz-battle" className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-indigo-700"><ArrowLeft className="h-4 w-4"/>Back to Quiz Battle</Link>
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div><div className="mb-2 inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-amber-700"><Trophy className="h-4 w-4"/>Learning achievements</div><h1 className="text-3xl font-black tracking-tight text-gray-900">Leaderboard</h1><p className="mt-2 text-gray-500">Points from completed lessons, quizzes, assignments, and Quiz Battles.</p></div>
        <div className="flex rounded-xl border border-gray-200 bg-white p-1">{(["all", "month", "week"] as const).map(value => <button key={value} onClick={() => setPeriod(value)} aria-pressed={period === value} className={`rounded-lg px-3 py-2 text-sm font-bold ${period === value ? "bg-indigo-600 text-white" : "text-gray-500 hover:bg-gray-50"}`}>{value === "all" ? "All time" : value === "month" ? "Last 30 days" : "Last 7 days"}</button>)}</div>
      </div>
      <section aria-label="Learning leaderboard" className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
        <div className="grid grid-cols-[54px_minmax(0,1fr)_100px] gap-3 border-b border-gray-100 bg-gray-50 px-5 py-3 text-xs font-extrabold uppercase tracking-wide text-gray-400"><span>Rank</span><span>Learner</span><span className="text-right">Points</span></div>
        {loading ? <div role="status" className="p-10 text-center text-gray-500">Loading rankings...</div>
          : error ? <div role="alert" className="p-6 text-red-700"><p>{error}</p><button onClick={() => setReload(n => n + 1)} className="mt-3 rounded-xl border px-4 py-2 font-bold">Try again</button></div>
          : rows.length === 0 ? <div className="p-10 text-center text-gray-500">No points yet for this period. Finish a learning activity or play a battle to get started.</div>
          : rows.map(row => <div key={row.userId} className="grid grid-cols-[54px_minmax(0,1fr)_100px] items-center gap-3 border-b border-gray-50 px-5 py-4 last:border-0">
            <span className={`flex h-9 w-9 items-center justify-center rounded-full font-black ${row.rank === 1 ? "bg-amber-100 text-amber-700" : row.rank === 2 ? "bg-slate-100 text-slate-600" : row.rank === 3 ? "bg-orange-100 text-orange-700" : "text-gray-400"}`}>{row.rank}</span>
            <div className="flex min-w-0 items-center gap-3"><span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 font-bold text-indigo-700">{row.username.slice(0, 1).toUpperCase()}</span><span className="truncate font-bold text-gray-800">{row.username}</span></div>
            <span className="text-right font-black text-indigo-700">{row.points.toLocaleString()}</span>
          </div>)}
      </section>
      <p className="mt-4 text-xs leading-5 text-gray-500">Top 50. Completed topic: 10 points; quiz submission: 15; assignment submission: 10; plus earned Quiz Battle points. Each learning activity is awarded once per topic and activity type, on its first recorded completion or submission. Equal points share a rank. Week and month use rolling 7-day and 30-day windows.</p>
    </main>
  </MainLayout>;
}
