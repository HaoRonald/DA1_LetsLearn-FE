'use client';

import React from 'react';
import { Check, X, Square, CheckSquare } from 'lucide-react';
import type { Question } from '@/types/quiz-attempt';

interface Props {
  question: Question;
  value: string | string[];
  onChange: (value: string | string[]) => void;
  reviewMode?: boolean;
}

export function QuizChoiceAnswer({ question, value, onChange, reviewMode = false }: Props) {
  if (question.data.kind !== 'choices') return null;
  const { multiple, choices } = question.data;

  const selectedIds = multiple
    ? (Array.isArray(value) ? value : [])
    : typeof value === 'string' ? [value] : [];

  const handleClick = (choiceId: string) => {
    if (reviewMode) return;
    if (multiple) {
      const next = selectedIds.includes(choiceId)
        ? selectedIds.filter((id) => id !== choiceId)
        : [...selectedIds, choiceId];
      onChange(next);
    } else {
      onChange(choiceId);
    }
  };

  return (
    <div className="space-y-3">
      {choices.map((choice, idx) => {
        const isSelected = selectedIds.includes(choice.id);
        const isCorrect = choice.gradePercent > 0;

        let baseClass =
          'w-full flex items-center gap-4 px-5 py-4 rounded-xl border-2 text-left transition-all ';

        if (reviewMode) {
          if (isSelected && isCorrect) baseClass += 'bg-green-50 border-green-500 text-green-800';
          else if (isSelected && !isCorrect) baseClass += 'bg-red-50 border-red-400 text-red-700';
          else if (!isSelected && isCorrect) baseClass += 'bg-amber-50 border-amber-300 text-amber-700';
          else baseClass += 'bg-gray-50 border-gray-200 text-gray-500';
        } else {
          if (isSelected) baseClass += 'bg-indigo-50 border-indigo-500 text-indigo-800';
          else baseClass += 'bg-gray-50 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50 cursor-pointer';
        }

        return (
          <button
            key={choice.id}
            type="button"
            onClick={() => handleClick(choice.id)}
            disabled={reviewMode}
            className={baseClass}
          >
            {/* Letter badge */}
            <span
              className={`w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-black shrink-0 ${
                isSelected ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}
            >
              {String.fromCharCode(65 + idx)}
            </span>

            <span className="flex-1 text-[15px]">{choice.text}</span>

            {/* Review indicators */}
            {reviewMode ? (
              isSelected && isCorrect ? (
                <Check className="w-5 h-5 text-green-600 shrink-0" />
              ) : isSelected && !isCorrect ? (
                <X className="w-5 h-5 text-red-500 shrink-0" />
              ) : !isSelected && isCorrect ? (
                <Check className="w-5 h-5 text-amber-500 shrink-0" />
              ) : null
            ) : multiple ? (
              isSelected
                ? <CheckSquare className="w-5 h-5 text-indigo-600 shrink-0" />
                : <Square className="w-5 h-5 text-gray-400 shrink-0" />
            ) : (
              <span
                className={`w-5 h-5 rounded-full border-2 shrink-0 ${
                  isSelected ? 'border-indigo-600 bg-indigo-600' : 'border-gray-300'
                }`}
              />
            )}
          </button>
        );
      })}

      {/* Review: correct answer hint */}
      {reviewMode && (
        <p className="text-[12px] text-amber-600 mt-1 pl-1">
          Highlighted in <span className="font-bold">gold</span> = missed correct answer
        </p>
      )}
    </div>
  );
}
