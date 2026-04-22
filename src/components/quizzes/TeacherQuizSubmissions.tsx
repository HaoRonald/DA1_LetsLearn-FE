'use client';

import React, { useEffect, useState } from 'react';
import {
  Filter, Loader2, MoreHorizontal, Search,
  ChevronLeft, ChevronRight, Settings2, FileText
} from 'lucide-react';
import { TopicResponse } from '@/services/courseService';
import { TopicQuizData } from '@/services/topicService';
import { topicApi } from '@/services/topicService';

interface TeacherQuizSubmissionsProps {
  quiz: TopicResponse;
  courseId: string;
}

interface StudentInfoAndMarkQuiz {
  student: {
    id: string;
    email: string;
    username: string;
    avatar?: string;
  };
  submitted: boolean;
  mark?: number;
  responseId?: string;
}

interface QuizReport {
  name: string;
  studentWithMark: StudentInfoAndMarkQuiz[];
  studentWithNoResponse: StudentInfoAndMarkQuiz[];
  maxDefaultMark: number;
  questionCount: number;
  avgStudentMarkBase10: number;
  maxStudentMarkBase10: number;
  attemptCount: number;
  avgTimeSpend: number; // seconds
  completionRate: number;
  students: Array<{ id: string; username: string; email: string; avatar?: string }>;
}

function formatDuration(seconds: number): string {
  if (!seconds || seconds === 0) return '-';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function TeacherQuizSubmissions({ quiz, courseId }: TeacherQuizSubmissionsProps) {
  const [report, setReport] = useState<QuizReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);

  const quizData: TopicQuizData = quiz.data || {};

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const res = await topicApi.getQuizReport(courseId, quiz.id);
        setReport(res.data);
      } catch (err: any) {
        console.error('Failed to fetch quiz report:', err);
        setError('Failed to load quiz results. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    if (courseId && quiz.id) {
      fetchReport();
    }
  }, [courseId, quiz.id]);

  const allRows: (StudentInfoAndMarkQuiz & { hasAttempt: boolean })[] = [
    ...(report?.studentWithMark || []).map(s => ({ ...s, hasAttempt: true })),
    ...(report?.studentWithNoResponse || []).map(s => ({ ...s, hasAttempt: false })),
  ];

  const filteredRows = allRows.filter(row =>
    row.student.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    row.student.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#DB2777]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-[24px] border border-[#F3F4F6] p-8 text-center">
        <p className="text-red-500 font-medium">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[24px] shadow-[0_4px_25px_rgba(0,0,0,0.05)] border border-[#F3F4F6] p-8">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-[28px] font-bold text-[#F97316]">Results</h2>
        <div className="flex items-center gap-4 text-[14px] text-[#6B7280]">
          <span>
            Attempted: <span className="font-bold text-[#374151]">{report?.attemptCount ?? 0}</span>
          </span>
          <span>
            Completion: <span className="font-bold text-[#374151]">
              {report?.completionRate != null ? `${Math.round(report.completionRate * 100)}%` : '-'}
            </span>
          </span>
          <span>
            Avg mark: <span className="font-bold text-[#374151]">
              {report?.avgStudentMarkBase10 != null ? report.avgStudentMarkBase10.toFixed(1) : '-'}/10
            </span>
          </span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search anything"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-[#E5E7EB] rounded-xl focus:outline-none focus:border-[#F97316]"
          />
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 border border-[#E5E7EB] bg-[#F9FAFB] px-5 py-3 rounded-xl font-bold text-[#374151] hover:bg-gray-100 transition-colors">
            <Filter className="w-5 h-5" />
            Filter
          </button>
          <button className="flex items-center gap-2 border border-[#E5E7EB] bg-[#F9FAFB] px-5 py-3 rounded-xl font-bold text-[#374151] hover:bg-gray-100 transition-colors">
            <Settings2 className="w-5 h-5" />
            Columns
          </button>
        </div>
      </div>

      {/* Results Table */}
      {filteredRows.length === 0 ? (
        <div className="text-center py-12 md:py-20 border-2 border-dashed border-[#E5E7EB] rounded-[24px]">
          <FileText className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <p className="text-[#9CA3AF] text-[15px]">No results yet.</p>
        </div>
      ) : (
        <div className="border border-[#F3F4F6] rounded-[24px] overflow-x-auto shadow-sm scrollbar-hide">
          <table className="w-full text-[13px] md:text-[14px] min-w-[700px]">
            <thead className="bg-[#F9FAFB] border-b border-[#F3F4F6]">
              <tr>
                <th className="p-4 w-10">
                  <input type="checkbox" className="w-4 h-4 rounded border-gray-300 accent-[#F97316]" />
                </th>
                <th className="p-4 font-bold text-[#374151] text-left whitespace-nowrap">#</th>
                <th className="p-4 font-bold text-[#374151] text-left whitespace-nowrap">Image</th>
                <th className="p-4 font-bold text-[#374151] text-left whitespace-nowrap">Student name</th>
                <th className="p-4 font-bold text-[#374151] text-left whitespace-nowrap">Email</th>
                <th className="p-4 font-bold text-[#374151] text-left whitespace-nowrap">Status</th>
                <th className="p-4 font-bold text-[#374151] text-left whitespace-nowrap">Grade (10)</th>
                <th className="p-4 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F4F6]">
              {filteredRows.map((item, idx) => (
                <tr key={item.student.id ?? idx} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4">
                    <input type="checkbox" className="w-4 h-4 rounded border-gray-300 accent-[#F97316]" />
                  </td>
                  <td className="p-4 text-[#6B7280]">{idx + 1}</td>
                  <td className="p-4">
                    <img
                      src={item.student.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.student.username)}&background=random`}
                      className="w-10 h-10 rounded-full border border-gray-100 object-cover"
                      alt={item.student.username}
                    />
                  </td>
                  <td className="p-4 font-bold text-[#374151] whitespace-nowrap">{item.student.username}</td>
                  <td className="p-4 text-[#6B7280] whitespace-nowrap">{item.student.email}</td>
                  <td className="p-4">
                    {item.hasAttempt ? (
                      <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-green-600 whitespace-nowrap">
                        <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                        Finished
                      </span>
                    ) : (
                      <span className="text-[#9CA3AF] text-[13px]">-</span>
                    )}
                  </td>
                  <td className="p-4">
                    {item.mark != null ? (
                      <span className={`font-bold ${item.mark >= 8 ? 'text-[#22C55E]' : item.mark >= 5 ? 'text-[#F97316]' : 'text-[#EF4444]'}`}>
                        {item.mark.toFixed(1)}
                      </span>
                    ) : (
                      <span className="text-[#9CA3AF]">-</span>
                    )}
                  </td>
                  <td className="p-4">
                    <button className="text-gray-400 hover:text-gray-600">
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Footer */}
      <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-[14px] text-[#6B7280]">
          0 of {filteredRows.length} row(s) selected
        </p>
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <span className="text-[14px] text-[#6B7280]">Page 1 of 1</span>
            <div className="flex items-center gap-1">
              <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-400">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-400">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[14px] text-[#6B7280]">Rows per page</span>
            <select className="border border-[#E5E7EB] rounded-lg px-2 py-1 text-[14px] font-medium outline-none focus:border-[#F97316]">
              <option>10</option>
              <option>20</option>
              <option>50</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TeacherQuizSubmissions;
