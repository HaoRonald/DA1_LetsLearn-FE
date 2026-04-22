'use client';

import React from 'react';
import { Eye, CheckCircle2, Clock, Trophy } from 'lucide-react';
import type { StudentResponse, QuizTopic } from '@/types/quiz-attempt';
import { getQuizResponseMark, getQuizResponseTotalMark, getGradedMark } from '@/lib/utils/quiz-utils';

interface Props {
  attempts: StudentResponse[];
  quiz: QuizTopic;
  currentUserId: string;
  onReview: (attempt: StudentResponse) => void;
}

function formatDate(d: string) {
  if (!d) return '—';
  return new Date(d).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function formatDurationFromStrings(start: string, end: string): string {
  if (!start || !end) return '—';
  const ms = new Date(end).getTime() - new Date(start).getTime();
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export function AttemptList({ attempts, quiz, currentUserId, onReview }: Props) {
  const myAttempts = attempts
    .filter((a) => a.studentId === currentUserId)
    .sort((a, b) => new Date(b.data.startedAt).getTime() - new Date(a.data.startedAt).getTime());

  const totalMark = getQuizResponseTotalMark(quiz);
  const gradedMark = getGradedMark(
    myAttempts.filter((a) => a.data.status === 'Finished'),
    quiz.data.gradingMethod,
    quiz,
  );

  if (myAttempts.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* Graded summary */}
      {gradedMark !== null && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-[14px]">
          <Trophy className="w-5 h-5 shrink-0" />
          <span>
            <strong>{quiz.data.gradingMethod}</strong>:{' '}
            <strong>
              {gradedMark} / {totalMark}
            </strong>{' '}
            points
          </span>
        </div>
      )}

      {myAttempts.map((attempt, idx) => {
        const score = getQuizResponseMark(attempt);
        const isFinished = attempt.data.status === 'Finished';

        return (
          <div
            key={attempt.id}
            className="border border-[#E5E7EB] rounded-xl overflow-hidden shadow-sm bg-white"
          >
            {/* Attempt header */}
            <div className="flex items-center justify-between px-5 py-3 bg-[#F9FAFB] border-b border-[#E5E7EB]">
              <span className="text-[14px] font-black text-[#374151]">
                Attempt {myAttempts.length - idx}
              </span>
              {isFinished && (
                <button
                  type="button"
                  onClick={() => onReview(attempt)}
                  className="flex items-center gap-1.5 text-[#3B82F6] hover:underline text-[13px] font-bold"
                >
                  <Eye className="w-4 h-4" /> Review
                </button>
              )}
            </div>

            {/* Rows */}
            {[
              {
                label: 'Status',
                value: (
                  <span
                    className={`flex items-center gap-1.5 ${
                      isFinished ? 'text-green-600' : 'text-yellow-600'
                    }`}
                  >
                    {isFinished ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <Clock className="w-4 h-4" />
                    )}
                    {attempt.data.status}
                  </span>
                ),
                stripe: false,
              },
              {
                label: 'Started',
                value: formatDate(attempt.data.startedAt),
                stripe: true,
              },
              {
                label: 'Completed',
                value: formatDate(attempt.data.completedAt),
                stripe: false,
              },
              {
                label: 'Duration',
                value: formatDurationFromStrings(
                  attempt.data.startedAt,
                  attempt.data.completedAt,
                ),
                stripe: true,
              },
              {
                label: 'Mark',
                value: isFinished ? (
                  <span className="font-black text-[#374151]">
                    {score} / {totalMark}
                  </span>
                ) : (
                  <span className="text-[#9CA3AF]">—</span>
                ),
                stripe: false,
              },
            ].map(({ label, value, stripe }) => (
              <div
                key={label}
                className={`grid grid-cols-4 text-[13px] ${stripe ? 'bg-[#F9FAFB]' : 'bg-white'}`}
              >
                <div className="p-3 font-bold text-[#374151] border-r border-[#E5E7EB]">{label}</div>
                <div className="p-3 col-span-3 text-[#6B7280]">{value}</div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
