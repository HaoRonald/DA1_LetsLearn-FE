'use client';

import React from 'react';
import { Calendar, Timer, Target, BarChart3, HelpCircle, AlertTriangle } from 'lucide-react';
import type { QuizTopic } from '@/types/quiz-attempt';

interface Props {
  quiz: QuizTopic;
  questionCount: number;
}

interface InfoRowProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}

function InfoRow({ icon, label, value }: InfoRowProps) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-[#F3F4F6] last:border-0">
      <span className="flex items-center gap-1.5 text-[13px] font-semibold text-[#9CA3AF]">
        {icon}
        {label}
      </span>
      <span className="text-[14px] font-bold text-[#374151]">{value}</span>
    </div>
  );
}

function dateLabel(d: string | null, fallback: string): string {
  if (!d) return fallback;
  return new Date(d).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function QuizDescriptionCard({ quiz, questionCount }: Props) {
  const { data } = quiz;
  const hasNoQuestions = questionCount === 0;

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-2xl shadow-sm overflow-hidden">
      {/* Header banner */}
      <div className="bg-gradient-to-r from-[#9D174D] to-[#DB2777] px-6 py-4">
        <h2 className="text-white font-black text-[18px]">{quiz.title}</h2>
        {data.description && (
          <p className="text-white/80 text-[13px] mt-1">{data.description}</p>
        )}
      </div>

      {/* No-questions warning */}
      {hasNoQuestions && (
        <div className="mx-4 mt-4 flex items-center gap-3 bg-yellow-50 border border-yellow-200 text-yellow-700 text-[13px] font-medium px-4 py-3 rounded-xl">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          This quiz has no questions yet. Contact the instructor.
        </div>
      )}

      {/* Info rows */}
      <div className="px-6 py-2">
        <InfoRow
          icon={<Calendar className="w-3.5 h-3.5" />}
          label="Opens"
          value={dateLabel(data.open, 'Immediately')}
        />
        <InfoRow
          icon={<Calendar className="w-3.5 h-3.5" />}
          label="Closes"
          value={dateLabel(data.close, 'No deadline')}
        />
        <InfoRow
          icon={<Timer className="w-3.5 h-3.5" />}
          label="Time limit"
          value={data.timeLimit ? `${data.timeLimit} ${data.timeLimitUnit}` : 'No limit'}
        />
        <InfoRow
          icon={<HelpCircle className="w-3.5 h-3.5" />}
          label="Questions"
          value={questionCount}
        />
        <InfoRow
          icon={<Target className="w-3.5 h-3.5" />}
          label="Grade to pass"
          value={data.gradeToPass}
        />
        <InfoRow
          icon={<BarChart3 className="w-3.5 h-3.5" />}
          label="Grading method"
          value={data.gradingMethod}
        />
        <InfoRow
          icon={null}
          label="Attempts allowed"
          value={data.attemptAllowed}
        />
      </div>
    </div>
  );
}
