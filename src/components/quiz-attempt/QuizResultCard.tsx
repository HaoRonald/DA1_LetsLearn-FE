'use client';

import React from 'react';
import { Trophy, Clock, CheckCircle2, AlertCircle, MinusCircle } from 'lucide-react';
import type { QuizResult } from '@/types/quiz-attempt';
import { formatDuration } from '@/lib/utils/quiz-utils';

interface Props {
  result: QuizResult;
  quizTitle: string;
}

const levelConfig = {
  good: {
    icon: <Trophy className="w-12 h-12 text-yellow-500" />,
    label: 'Excellent!',
    subtitle: 'You did great on this quiz.',
    accent: 'from-yellow-400 to-amber-500',
    bg: 'from-yellow-50 to-amber-50',
    border: 'border-yellow-200',
    badgeBg: 'bg-yellow-100 text-yellow-700',
  },
  average: {
    icon: <CheckCircle2 className="w-12 h-12 text-blue-500" />,
    label: 'Good Job!',
    subtitle: 'Keep practising to improve your score.',
    accent: 'from-blue-400 to-indigo-500',
    bg: 'from-blue-50 to-indigo-50',
    border: 'border-blue-200',
    badgeBg: 'bg-blue-100 text-blue-700',
  },
  bad: {
    icon: <AlertCircle className="w-12 h-12 text-red-500" />,
    label: 'Keep Trying!',
    subtitle: 'Review the material and try again.',
    accent: 'from-red-400 to-rose-500',
    bg: 'from-red-50 to-rose-50',
    border: 'border-red-200',
    badgeBg: 'bg-red-100 text-red-700',
  },
};

export function QuizResultCard({ result, quizTitle }: Props) {
  const config = levelConfig[result.level];
  const pct =
    result.totalScore > 0
      ? Math.round((result.score / result.totalScore) * 100)
      : 0;

  return (
    <div className={`rounded-2xl border ${config.border} bg-gradient-to-br ${config.bg} p-6 shadow-sm`}>
      {/* Icon + title */}
      <div className="flex flex-col items-center text-center mb-6 gap-3">
        {config.icon}
        <div>
          <h2 className="text-[24px] font-black text-[#1F2937]">{config.label}</h2>
          <p className="text-[14px] text-[#6B7280] mt-0.5">{config.subtitle}</p>
        </div>
      </div>

      {/* Score ring */}
      <div className="flex flex-col items-center mb-6">
        <div className="relative w-28 h-28 mb-2">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" stroke="#E5E7EB" strokeWidth="8" fill="none" />
            <circle
              cx="50"
              cy="50"
              r="42"
              stroke="url(#grad)"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 42}`}
              strokeDashoffset={`${2 * Math.PI * 42 * (1 - pct / 100)}`}
              style={{ transition: 'stroke-dashoffset 1s ease' }}
            />
            <defs>
              <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#DB2777" />
                <stop offset="100%" stopColor="#EC4899" />
              </linearGradient>
            </defs>
          </svg>
          <span className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[24px] font-black text-[#1F2937]">{pct}%</span>
          </span>
        </div>
        <p className="text-[18px] font-black text-[#1F2937]">
          {result.score} / {result.totalScore}
          <span className="text-[14px] font-medium text-[#9CA3AF] ml-1">points</span>
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white/70 rounded-xl p-3 text-center border border-white/50">
          <Clock className="w-5 h-5 text-[#6B7280] mx-auto mb-1" />
          <p className="text-[13px] font-black text-[#374151]">
            {formatDuration(result.durationSeconds)}
          </p>
          <p className="text-[11px] text-[#9CA3AF]">Duration</p>
        </div>
        <div className={`${config.badgeBg} rounded-xl p-3 text-center`}>
          <MinusCircle className="w-5 h-5 mx-auto mb-1 opacity-70" />
          <p className="text-[13px] font-black capitalize">{result.level}</p>
          <p className="text-[11px] opacity-70">Result</p>
        </div>
      </div>
    </div>
  );
}
