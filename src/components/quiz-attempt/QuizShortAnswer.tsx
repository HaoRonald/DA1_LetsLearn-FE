'use client';

import React from 'react';
import { Check, X } from 'lucide-react';
import type { Question } from '@/types/quiz-attempt';
import { getQuestionMark } from '@/lib/utils/quiz-utils';

interface Props {
  question: Question;
  value: string;
  onChange: (value: string) => void;
  reviewMode?: boolean;
}

export function QuizShortAnswer({ question, value, onChange, reviewMode = false }: Props) {
  if (question.data.kind !== 'shortanswer') return null;
  const { choices } = question.data;

  const isCorrect = reviewMode
    ? getQuestionMark(question, value) >= question.defaultMark
    : null;

  return (
    <div className="space-y-3">
      <textarea
        value={value}
        onChange={(e) => !reviewMode && onChange(e.target.value)}
        readOnly={reviewMode}
        placeholder={reviewMode ? '' : 'Type your answer here...'}
        rows={4}
        className={`w-full border-2 rounded-xl px-4 py-3 text-[15px] focus:outline-none transition-colors resize-none ${
          reviewMode
            ? isCorrect
              ? 'border-green-400 bg-green-50 text-green-800'
              : 'border-red-400 bg-red-50 text-red-700'
            : 'border-gray-200 focus:border-indigo-400 bg-white'
        }`}
      />

      {reviewMode && (
        <div className="flex items-center gap-2 text-[13px] font-medium">
          {isCorrect ? (
            <>
              <Check className="w-4 h-4 text-green-600" />
              <span className="text-green-700">Correct!</span>
            </>
          ) : (
            <>
              <X className="w-4 h-4 text-red-500" />
              <span className="text-red-600">Incorrect.</span>
            </>
          )}
        </div>
      )}

      {reviewMode && choices.length > 0 && (
        <div className="mt-2 text-[13px] text-gray-500">
          <span className="font-bold text-gray-700">Accepted answers: </span>
          {choices.map((c) => c.text).join(', ')}
        </div>
      )}
    </div>
  );
}
