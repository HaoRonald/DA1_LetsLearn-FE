'use client';

import React from 'react';
import {
  CornerDownLeft, MoreVertical, Send, Loader2,
  CheckCircle2, Clock, AlertCircle, BookOpen
} from 'lucide-react';
import { TopicResponse } from '@/services/courseService';
import { topicApi, TopicQuizData } from '@/services/topicService';

interface TeacherQuizViewProps {
  quiz: TopicResponse;
  courseId: string;
}

export function TeacherQuizView({ quiz, courseId }: TeacherQuizViewProps) {
  const quizData: TopicQuizData = quiz.data || {};

  const formatDate = (date?: string | null) => {
    if (!date) return 'Not set';
    return new Date(date).toLocaleString();
  };

  const totalQuestions = quizData.questions?.length || 0;
  const totalPoints = quizData.questions?.reduce((sum, q) => sum + (q.defaultMark || 10), 0) || 0;

  return (
    <div className="bg-transparent w-full">
      {/* Quiz Info Card */}
      <div className="bg-white rounded-xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] border border-[#E5E7EB] p-6 mb-6">
        <div className="flex flex-col gap-2 mb-6">
          <p className="text-[14px] text-[#6B7280]">
            <span className="font-bold text-[#374151]">Open:</span> {formatDate(quizData.open)}
          </p>
          <p className="text-[14px] text-[#6B7280]">
            <span className="font-bold text-[#374151]">Close:</span> {formatDate(quizData.close)}
          </p>
          {quizData.timeLimit && (
            <p className="text-[14px] text-[#6B7280]">
              <span className="font-bold text-[#374151]">Time limit:</span> {quizData.timeLimit} {quizData.timeLimitUnit}
            </p>
          )}
        </div>
        <hr className="border-[#E5E7EB] mb-6" />

        <p className="text-[#6B7280] text-[14px] mb-8">
          {quizData.description || "No description provided."}
        </p>

        {/* Quiz Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-pink-50 rounded-xl p-4 text-center">
            <p className="text-[24px] font-black text-[#DB2777]">{totalQuestions}</p>
            <p className="text-[12px] text-[#6B7280] font-medium">Questions</p>
          </div>
          <div className="bg-pink-50 rounded-xl p-4 text-center">
            <p className="text-[24px] font-black text-[#DB2777]">{totalPoints}</p>
            <p className="text-[12px] text-[#6B7280] font-medium">Total Points</p>
          </div>
          <div className="bg-pink-50 rounded-xl p-4 text-center">
            <p className="text-[24px] font-black text-[#DB2777]">
              {quizData.attemptAllowed || '∞'}
            </p>
            <p className="text-[12px] text-[#6B7280] font-medium">Attempts</p>
          </div>
          <div className="bg-pink-50 rounded-xl p-4 text-center">
            <p className="text-[24px] font-black text-[#DB2777]">
              {quizData.gradingMethod?.split(' ')[0] || 'Highest'}
            </p>
            <p className="text-[12px] text-[#6B7280] font-medium">Grade Method</p>
          </div>
        </div>

        {/* Questions Preview */}
        {totalQuestions > 0 && (
          <div className="mb-6">
            <h3 className="text-[16px] font-bold text-[#DB2777] mb-4">Questions</h3>
            <div className="space-y-2">
              {quizData.questions?.map((q, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 border border-[#E5E7EB] rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-pink-50 text-pink-600 flex items-center justify-center font-bold text-[13px] shrink-0">
                    {idx + 1}
                  </div>
                  <p className="flex-1 text-[14px] text-[#374151] line-clamp-1">{q.questionText}</p>
                  <span className="text-[12px] text-[#9CA3AF] font-medium shrink-0">
                    {q.defaultMark || 10} pts
                  </span>
                  <span className="text-[11px] px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full shrink-0">
                    {q.type}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {totalQuestions === 0 && (
          <div className="text-center py-8 border-2 border-dashed border-[#E5E7EB] rounded-xl">
            <BookOpen className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-[#9CA3AF] text-[14px]">No questions added yet.</p>
            <p className="text-[#9CA3AF] text-[13px]">Go to the Settings tab to add questions.</p>
          </div>
        )}
      </div>

      {/* Class Comments Section */}
      <div className="bg-white rounded-xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-[#E5E7EB] p-5 pb-6 mb-12">
        <div className="flex items-center gap-3 border-b border-[#E5E7EB] pb-3 mb-6">
          <div className="text-[#6B7280] flex items-center gap-2 font-bold text-[14px]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            Class comments
          </div>
        </div>
        <p className="text-center text-gray-400 text-sm py-4">No comments yet</p>

        <div className="flex gap-3 mt-8 items-center">
          <img
            src="https://ui-avatars.com/api/?name=Teacher&background=random"
            alt="Your Avatar"
            className="w-8 h-8 rounded-full object-cover shrink-0 border border-gray-200"
          />
          <div className="flex-1 relative flex items-center">
            <input
              type="text"
              placeholder="Add class comment"
              className="w-full border border-[#E5E7EB] rounded-full px-5 py-2.5 text-[14px] font-medium text-[#374151] placeholder-[#9CA3AF] focus:outline-none focus:border-[#DB2777] focus:ring-1 focus:ring-[#DB2777] transition-all bg-[#F9FAFB] focus:bg-white"
            />
            <button className="absolute right-3 text-[#6B7280] hover:text-[#DB2777] transition-colors p-1">
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TeacherQuizView;
