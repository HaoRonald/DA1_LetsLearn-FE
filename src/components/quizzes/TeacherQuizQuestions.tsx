'use client';

import React from 'react';
import {
  ListChecks, Type, FileText, LayoutGrid, Trash2,
} from 'lucide-react';
import type { QuizTopic, QuizQuestion } from '@/types/quiz';

// ── Props ──────────────────────────────────────────────────────────────────────

interface Props {
  quiz: QuizTopic;
  courseId: string;
  onQuizUpdated: (updated: QuizTopic) => void;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function getIcon(type?: string) {
  switch (type) {
    case 'Choices Answer': return <ListChecks className="w-5 h-5 text-[#06B6D4]" />;
    case 'True/False':     return <LayoutGrid className="w-5 h-5 text-[#8B5CF6]" />;
    case 'Short Answer':   return <Type className="w-5 h-5 text-[#F59E0B]" />;
    default:               return <FileText className="w-5 h-5 text-[#6B7280]" />;
  }
}

// ══════════════════════════════════════════════════════════════════════════════

export function TeacherQuizQuestions({ quiz }: Props) {
  const questions: QuizQuestion[] = quiz.data?.questions ?? [];
  const totalMark = questions.reduce((sum, q) => sum + (q.defaultMark ?? 1), 0);

  // ════════════════════════════════════════════════════════════════════════════

  return (
    <div className="bg-white rounded-[24px] shadow-sm border border-[#E5E7EB] overflow-hidden">
      <div className="p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <h2 className="text-[28px] font-bold text-[#F97316]">Questions</h2>
          <span className="text-[14px] text-[#6B7280]">
            {questions.length} question{questions.length !== 1 ? 's' : ''} · Total mark:{' '}
            <strong>{totalMark}</strong>
          </span>
        </div>

        {/* Empty state */}
        {questions.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-gray-100 rounded-[24px]">
            <FileText className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-400 font-medium">No questions yet.</p>
            <p className="text-gray-400 text-[14px] mt-1">
              Go to the <span className="font-semibold text-[#F97316]">Question Bank</span> tab to add questions.
            </p>
          </div>
        ) : (
          <div className="border border-[#F3F4F6] rounded-[20px] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-[14px] min-w-[560px]">
                <thead className="bg-[#F9FAFB] border-b border-[#F3F4F6]">
                  <tr>
                    <th className="p-4 text-left font-bold text-[#374151] w-8">#</th>
                    <th className="p-4 text-left font-bold text-[#374151] w-10">Type</th>
                    <th className="p-4 text-left font-bold text-[#374151]">Question</th>
                    <th className="p-4 text-left font-bold text-[#374151] w-20">Mark</th>
                    <th className="p-4 text-left font-bold text-[#374151] w-24">Status</th>
                    <th className="p-4 w-10" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3F4F6]">
                  {questions.map((q, idx) => (
                    <tr key={q.id || idx} className="hover:bg-[#FFF7F0] transition-colors group">
                      <td className="p-4 text-[#9CA3AF]">{idx + 1}</td>
                      <td className="p-4">
                        <div className="p-1.5 bg-white rounded-lg shadow-sm inline-flex border border-gray-100">
                          {getIcon(q.type)}
                        </div>
                      </td>
                      <td className="p-4 font-medium text-[#374151] max-w-xs">
                        <span className="line-clamp-2">{q.questionText || q.questionName}</span>
                      </td>
                      <td className="p-4 font-bold text-[#374151]">{q.defaultMark ?? 1}</td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center gap-1.5 text-[12px] font-medium px-2.5 py-1 rounded-full ${
                            q.status === 'Ready'
                              ? 'text-green-600 bg-green-50'
                              : 'text-yellow-600 bg-yellow-50'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full inline-block ${
                              q.status === 'Ready' ? 'bg-green-500' : 'bg-yellow-500'
                            }`}
                          />
                          {q.status ?? 'Ready'}
                        </span>
                      </td>
                      <td className="p-4">
                        {/* Delete API not yet available — UI only */}
                        <button
                          disabled
                          className="text-gray-300 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 cursor-not-allowed"
                          title="Delete (coming soon)"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 bg-[#F9FAFB] border-t border-[#F3F4F6] flex items-center justify-between text-[13px] text-[#6B7280]">
              <span>{questions.length} question{questions.length !== 1 ? 's' : ''}</span>
              <span>Total: {totalMark} marks</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TeacherQuizQuestions;
