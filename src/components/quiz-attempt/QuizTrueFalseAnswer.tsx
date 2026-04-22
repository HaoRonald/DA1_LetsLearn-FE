'use client';

import React from 'react';
import { Check, X } from 'lucide-react';
import type { Question } from '@/types/quiz-attempt';

interface Props {
  question: Question;
  /** "1" = true, "0" = false, "" = not answered */
  value: string;
  onChange: (value: string) => void;
  reviewMode?: boolean;
}

export function QuizTrueFalseAnswer({ question, value, onChange, reviewMode = false }: Props) {
  if (question.data.kind !== 'truefalse') return null;
  const { correctAnswer } = question.data;

  const options: Array<{ label: string; val: string; isTrue: boolean }> = [
    { label: 'True', val: '1', isTrue: true },
    { label: 'False', val: '0', isTrue: false },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 max-w-sm">
      {options.map(({ label, val, isTrue }) => {
        const isSelected = value === val;
        const isCorrectVal = (correctAnswer === true) === isTrue;

        let cls =
          'h-16 rounded-xl border-2 text-[16px] font-bold transition-all flex items-center justify-center gap-2.5 ';

        if (reviewMode) {
          if (isSelected && isCorrectVal) cls += 'bg-green-50 border-green-500 text-green-700';
          else if (isSelected && !isCorrectVal) cls += 'bg-red-50 border-red-400 text-red-700';
          else if (!isSelected && isCorrectVal) cls += 'bg-amber-50 border-amber-400 text-amber-700';
          else cls += 'bg-gray-50 border-gray-200 text-gray-400';
        } else {
          if (isSelected) {
            cls += isTrue
              ? 'bg-green-50 border-green-500 text-green-700'
              : 'bg-red-50 border-red-400 text-red-700';
          } else {
            cls += 'bg-gray-50 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 cursor-pointer text-gray-600';
          }
        }

        return (
          <button
            key={val}
            type="button"
            onClick={() => !reviewMode && onChange(val)}
            disabled={reviewMode}
            className={cls}
          >
            {isTrue ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
            {label}
            {reviewMode && !isSelected && isCorrectVal && (
              <span className="text-[11px] font-bold text-amber-600 ml-1">(correct)</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
