'use client';

import React from 'react';
import { Flag } from 'lucide-react';
import type { Question, AnswerRecord } from '@/types/quiz-attempt';

interface Props {
  questions: Question[];
  currentQuestionId: string;
  answerRecord: AnswerRecord;
  flaggedIds: Set<string>;
  onNavigate: (id: string) => void;
  onFinish: () => void;
  isSubmitting: boolean;
  isReviewMode: boolean;
}

function isAnswered(record: AnswerRecord, qid: string): boolean {
  const v = record[qid];
  if (v === undefined || v === '') return false;
  if (Array.isArray(v)) return v.length > 0;
  return v.trim() !== '';
}

export function QuizNavigation({
  questions,
  currentQuestionId,
  answerRecord,
  flaggedIds,
  onNavigate,
  onFinish,
  isSubmitting,
  isReviewMode,
}: Props) {
  const answeredCount = questions.filter((q) => isAnswered(answerRecord, q.id)).length;

  return (
    <div className="sticky top-24 bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-sm space-y-4">
      <h2 className="text-[15px] font-black text-[#374151]">Questions</h2>

      {/* Progress */}
      {!isReviewMode && (
        <div>
          <div className="flex items-center justify-between text-[12px] font-medium text-[#6B7280] mb-1.5">
            <span>Answered</span>
            <span className="font-black text-[#DB2777]">{answeredCount}/{questions.length}</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#DB2777] to-[#EC4899] rounded-full transition-all duration-300"
              style={{ width: `${(answeredCount / questions.length) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-5 gap-1.5">
        {questions.map((q, idx) => {
          const isCurrent = q.id === currentQuestionId;
          const answered = isAnswered(answerRecord, q.id);
          const flagged = flaggedIds.has(q.id);

          let cls =
            'relative aspect-square flex items-center justify-center rounded-lg text-[12px] font-bold transition-all ';

          if (isCurrent) cls += 'bg-[#DB2777] text-white shadow-md scale-105';
          else if (flagged) cls += 'bg-amber-100 text-amber-700 border-2 border-amber-400 hover:bg-amber-200';
          else if (answered) cls += 'bg-green-100 text-green-700 hover:bg-green-200';
          else cls += 'bg-gray-100 text-gray-500 hover:bg-gray-200';

          return (
            <button key={q.id} type="button" onClick={() => onNavigate(q.id)} className={cls}>
              {idx + 1}
              {flagged && (
                <Flag className="absolute -top-1 -right-1 w-2.5 h-2.5 text-amber-500 fill-amber-500" />
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="space-y-1 pt-1 border-t border-gray-100">
        {[
          { cls: 'bg-[#DB2777]', label: 'Current' },
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

      {/* Submit */}
      {!isReviewMode && (
        <button
          type="button"
          onClick={onFinish}
          disabled={isSubmitting}
          className="w-full py-2.5 bg-gradient-to-r from-[#4F46E5] to-[#6366F1] hover:from-[#4338CA] hover:to-[#4F46E5] text-white font-black text-[14px] rounded-xl transition-all disabled:opacity-50 shadow-sm"
        >
          {isSubmitting ? 'Submitting…' : 'Finish Attempt'}
        </button>
      )}
    </div>
  );
}
