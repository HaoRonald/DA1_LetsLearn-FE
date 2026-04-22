'use client';

import React from 'react';
import { Clock, AlertTriangle, Loader2 } from 'lucide-react';
import type { QuizTopic, AnswerRecord } from '@/types/quiz-attempt';
import { useQuizAttemptSession } from '@/hooks/useQuizAttemptSession';
import { QuizQuestionPanel } from './QuizQuestionPanel';
import { QuizNavigation } from './QuizNavigation';
import { QuizResultCard } from './QuizResultCard';
import {
  getQuizResponseMark,
  getQuizResponseTotalMark,
  getQuizResultFromMark,
} from '@/lib/utils/quiz-utils';

interface Props {
  quiz: QuizTopic;
  /** Pre-filled when entering review from an old response */
  initialAnswerRecord?: AnswerRecord;
  initialReviewMode?: boolean;
  initialResponse?: import('@/types/quiz-attempt').StudentResponse | null;
}

export function QuizAttemptPage({
  quiz,
  initialAnswerRecord = {},
  initialReviewMode = false,
  initialResponse = null,
}: Props) {
  const {
    session,
    currentQuestion,
    answeredCount,
    totalQuestions,
    setCurrentQuestion,
    toggleFlag,
    setAnswer,
    requestFinish,
    confirmFinish,
    cancelFinish,
    showConfirm,
    isAllAnswered,
    timerDisplay,
  } = useQuizAttemptSession(quiz, initialAnswerRecord, initialReviewMode, initialResponse);

  const questions = session.questions;
  const isCountdown = quiz.data.timeLimit !== null;
  const timerDanger = isCountdown && (session.timer ?? 0) < 300;

  const currentIdx = questions.findIndex((q) => q.id === session.currentQuestionId);
  const safeIdx = currentIdx >= 0 ? currentIdx : 0;

  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertTriangle className="w-12 h-12 text-yellow-400" />
        <p className="text-[18px] font-bold text-gray-600">This quiz has no questions yet.</p>
      </div>
    );
  }

  if (!currentQuestion) return null;

  // Result derived from session
  const resultData = (() => {
    if (!session.isReviewMode || !session.studentResponse) return null;
    const score = getQuizResponseMark(session.studentResponse);
    const totalScore = getQuizResponseTotalMark(quiz);
    const start = session.studentResponse.data.startedAt;
    const end = session.studentResponse.data.completedAt;
    const durationSeconds =
      start && end
        ? Math.floor((new Date(end).getTime() - new Date(start).getTime()) / 1000)
        : 0;
    return getQuizResultFromMark(score, totalScore, durationSeconds);
  })();

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* ── Top bar ─────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-[#E5E7EB] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <h1 className="text-[17px] font-black text-[#DB2777] truncate">{quiz.title}</h1>
            <span className="hidden sm:block text-[13px] text-[#9CA3AF]">
              Q {safeIdx + 1} / {totalQuestions}
            </span>
            {session.isReviewMode && (
              <span className="bg-indigo-100 text-indigo-700 text-[11px] font-black px-2.5 py-0.5 rounded-full">
                REVIEW
              </span>
            )}
          </div>

          {/* Timer */}
          {session.timer !== null && !session.isReviewMode && (
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black text-[16px] transition-colors ${
                timerDanger
                  ? 'bg-red-100 text-red-600 animate-pulse'
                  : isCountdown
                  ? 'bg-pink-50 text-[#DB2777]'
                  : 'bg-gray-100 text-[#374151]'
              }`}
            >
              <Clock className="w-5 h-5" />
              {timerDisplay}
            </div>
          )}

          {/* Submitting spinner */}
          {session.isSubmitting && (
            <div className="flex items-center gap-2 text-[#DB2777] font-bold text-[13px]">
              <Loader2 className="w-4 h-4 animate-spin" />
              Submitting…
            </div>
          )}
        </div>
      </div>

      {/* ── Main content ────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 py-6 flex gap-5">
        {/* LEFT: result card (review mode) or symbol guide */}
        <div className="w-64 shrink-0 hidden lg:block">
          {session.isReviewMode && resultData ? (
            <div className="sticky top-20">
              <QuizResultCard result={resultData} quizTitle={quiz.title} />
            </div>
          ) : (
            <div className="sticky top-20 bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="font-black text-[#374151] text-[14px]">Progress</h3>
              <div>
                <div className="flex justify-between text-[12px] text-gray-500 mb-1">
                  <span>Answered</span>
                  <span className="font-black text-[#DB2777]">{answeredCount}/{totalQuestions}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#DB2777] to-[#EC4899] rounded-full transition-all"
                    style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
                  />
                </div>
              </div>
              <div className="space-y-1.5 pt-2 border-t border-gray-100">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Legend</p>
                {[
                  { cls: 'bg-green-100', label: 'Answered' },
                  { cls: 'bg-amber-100 border-2 border-amber-400', label: 'Flagged' },
                  { cls: 'bg-gray-100', label: 'Not answered' },
                ].map(({ cls, label }) => (
                  <div key={label} className="flex items-center gap-2 text-[11px] text-gray-500">
                    <span className={`w-3 h-3 rounded shrink-0 ${cls}`} />
                    {label}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* MIDDLE: question */}
        <div className="flex-1 min-w-0">
          <QuizQuestionPanel
            question={currentQuestion}
            questionIndex={safeIdx}
            totalQuestions={totalQuestions}
            answerRecord={session.answerRecord}
            isFlagged={session.flaggedIds.has(currentQuestion.id)}
            onToggleFlag={() => toggleFlag(currentQuestion.id)}
            onAnswer={(v) => setAnswer(currentQuestion.id, v)}
            onPrev={() => {
              const prev = questions[safeIdx - 1];
              if (prev) setCurrentQuestion(prev.id);
            }}
            onNext={() => {
              const next = questions[safeIdx + 1];
              if (next) setCurrentQuestion(next.id);
            }}
            hasPrev={safeIdx > 0}
            hasNext={safeIdx < totalQuestions - 1}
            reviewMode={session.isReviewMode}
            onFinish={requestFinish}
          />
        </div>

        {/* RIGHT: navigation */}
        <div className="w-56 shrink-0 hidden xl:block">
          <QuizNavigation
            questions={questions}
            currentQuestionId={session.currentQuestionId}
            answerRecord={session.answerRecord}
            flaggedIds={session.flaggedIds}
            onNavigate={setCurrentQuestion}
            onFinish={requestFinish}
            isSubmitting={session.isSubmitting}
            isReviewMode={session.isReviewMode}
          />
        </div>
      </div>

      {/* ── Submit confirm modal ─────────────────────────────────────── */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[24px] w-full max-w-md shadow-2xl p-6">
            <h2 className="text-[20px] font-black text-[#374151] mb-2">
              {isAllAnswered ? 'Submit Quiz?' : 'Unanswered Questions'}
            </h2>
            <p className="text-[14px] text-[#6B7280] mb-2">
              You have answered{' '}
              <strong>
                {answeredCount} / {totalQuestions}
              </strong>{' '}
              questions.
            </p>
            {!isAllAnswered && (
              <p className="text-[14px] text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4">
                ⚠️ You have not answered all questions. Do you want to submit anyway?
              </p>
            )}
            {isAllAnswered && (
              <p className="text-[14px] text-gray-500 mb-4">
                Are you sure you want to submit this quiz? This action cannot be undone.
              </p>
            )}
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={cancelFinish}
                className="px-5 py-2.5 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-colors"
              >
                Continue Quiz
              </button>
              <button
                type="button"
                onClick={confirmFinish}
                disabled={session.isSubmitting}
                className="px-6 py-2.5 bg-[#DB2777] text-white font-bold rounded-xl hover:bg-[#BE185D] transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {session.isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Submit Quiz
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
