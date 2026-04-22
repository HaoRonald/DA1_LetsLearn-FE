'use client';

import React from 'react';
import { Flag, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Question, AnswerRecord } from '@/types/quiz-attempt';
import { getQuestionMark, getQuestionFeedback } from '@/lib/utils/quiz-utils';
import { QuizChoiceAnswer } from './QuizChoiceAnswer';
import { QuizTrueFalseAnswer } from './QuizTrueFalseAnswer';
import { QuizShortAnswer } from './QuizShortAnswer';

interface Props {
  question: Question;
  questionIndex: number;
  totalQuestions: number;
  answerRecord: AnswerRecord;
  isFlagged: boolean;
  onToggleFlag: () => void;
  onAnswer: (value: string | string[]) => void;
  onPrev: () => void;
  onNext: () => void;
  hasPrev: boolean;
  hasNext: boolean;
  reviewMode: boolean;
  onFinish?: () => void;
}

function getValue(record: AnswerRecord, qid: string, kind: string): string | string[] {
  const v = record[qid];
  if (kind === 'choices') return Array.isArray(v) ? v : v ? [v] : [];
  return typeof v === 'string' ? v : '';
}

export function QuizQuestionPanel({
  question,
  questionIndex,
  totalQuestions,
  answerRecord,
  isFlagged,
  onToggleFlag,
  onAnswer,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
  reviewMode,
  onFinish,
}: Props) {
  const isMultiple =
    question.data.kind === 'choices' && (question.data as { kind: 'choices'; multiple: boolean }).multiple;

  const value = getValue(answerRecord, question.id, question.data.kind);
  const mark = reviewMode ? getQuestionMark(question, value) : null;
  const isCorrect = mark !== null && mark >= question.defaultMark;
  const feedback =
    reviewMode && mark !== null
      ? getQuestionFeedback(question, value, isCorrect)
      : null;

  return (
    <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#F3F4F6] bg-gradient-to-r from-[#FFF1F6] to-white">
        <div className="flex items-center gap-3">
          <span className="bg-gradient-to-r from-[#DB2777] to-[#EC4899] text-white text-[13px] font-black px-3 py-1 rounded-lg">
            Q {questionIndex + 1} / {totalQuestions}
          </span>
          {!reviewMode && (
            <button
              type="button"
              onClick={onToggleFlag}
              className={`flex items-center gap-1.5 text-[12px] font-bold px-3 py-1 rounded-lg transition-all ${
                isFlagged
                  ? 'bg-amber-100 text-amber-700 border border-amber-300'
                  : 'bg-gray-100 text-gray-500 hover:bg-amber-50 hover:text-amber-600'
              }`}
            >
              <Flag className={`w-3.5 h-3.5 ${isFlagged ? 'fill-amber-500' : ''}`} />
              {isFlagged ? 'Flagged' : 'Flag'}
            </button>
          )}
        </div>

        {/* Mark badge */}
        <div className="flex items-center gap-2">
          {reviewMode && mark !== null ? (
            <span
              className={`text-[13px] font-black px-3 py-1 rounded-lg ${
                isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
              }`}
            >
              {mark} / {question.defaultMark} pts
            </span>
          ) : (
            <span className="text-[13px] font-bold text-gray-400">
              {question.defaultMark} pts
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-6 space-y-6">
        {/* Question text */}
        <div>
          <p className="text-[16px] text-[#374151] leading-relaxed font-medium">
            {question.questionText || question.questionName}
          </p>
          {isMultiple && !reviewMode && (
            <p className="text-[12px] text-indigo-500 mt-1 font-medium">
              Select all that apply
            </p>
          )}
        </div>

        {/* Answer input */}
        {question.data.kind === 'choices' && (
          <QuizChoiceAnswer
            question={question}
            value={value as string | string[]}
            onChange={onAnswer}
            reviewMode={reviewMode}
          />
        )}
        {question.data.kind === 'truefalse' && (
          <QuizTrueFalseAnswer
            question={question}
            value={value as string}
            onChange={(v) => onAnswer(v)}
            reviewMode={reviewMode}
          />
        )}
        {question.data.kind === 'shortanswer' && (
          <QuizShortAnswer
            question={question}
            value={value as string}
            onChange={(v) => onAnswer(v)}
            reviewMode={reviewMode}
          />
        )}

        {/* Feedback */}
        {reviewMode && feedback && (
          <div
            className={`text-[13px] font-medium px-4 py-3 rounded-xl border ${
              isCorrect
                ? 'bg-green-50 border-green-200 text-green-700'
                : 'bg-red-50 border-red-200 text-red-600'
            }`}
          >
            {feedback}
          </div>
        )}
      </div>

      {/* Footer navigation */}
      <div className="flex items-center justify-between px-6 py-4 border-t border-[#F3F4F6] bg-[#FAFAFA]">
        <button
          type="button"
          onClick={onPrev}
          disabled={!hasPrev}
          className="flex items-center gap-1.5 px-4 py-2 bg-white border border-[#E5E7EB] rounded-xl text-[13px] font-bold text-[#374151] hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Previous
        </button>

        {hasNext ? (
          <button
            type="button"
            onClick={onNext}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#DB2777] text-white rounded-xl text-[13px] font-bold hover:bg-[#BE185D] transition-colors"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        ) : !reviewMode ? (
          <button
            type="button"
            onClick={onFinish}
            className="flex items-center gap-1.5 px-4 py-2 bg-green-500 text-white rounded-xl text-[13px] font-bold hover:bg-green-600 transition-colors"
          >
            Finish Attempt
          </button>
        ) : null}
      </div>
    </div>
  );
}
