'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { 
  ChevronRight, ListChecks, CornerDownLeft, MoreVertical, Send, Loader2 
} from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { useParams, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { courseApi, TopicResponse } from '@/services/courseService';
import { quizResponseApi, QuizResponseDTO } from '@/services/quizResponseService';

export default function QuizDetailPage() {
  const { id: topicId } = useParams() as { id: string };
  const searchParams = useSearchParams();
  const courseId = searchParams.get('courseId');
  const { user } = useAuth();

  const [topic, setTopic] = useState<TopicResponse | null>(null);
  const [responses, setResponses] = useState<QuizResponseDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchQuizData = async () => {
      if (!topicId || !courseId || !user) return;
      setIsLoading(true);
      try {
        const [topicRes, responsesRes] = await Promise.all([
          courseApi.getTopicById(courseId, topicId),
          quizResponseApi.getByTopic(topicId)
        ]);

        setTopic(topicRes.data);
        // Filter responses for the current student
        const userResponses = responsesRes.data.filter(r => r.studentId === user.id);
        setResponses(userResponses);
      } catch (error) {
        console.error("Failed to fetch quiz data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuizData();
  }, [topicId, courseId, user]);

  const quizData = useMemo(() => {
    if (!topic?.data) return {};
    return typeof topic.data === 'string' ? JSON.parse(topic.data) : topic.data;
  }, [topic]);

  const attemptsSummary = useMemo(() => {
    if (responses.length === 0) return { highest: null, count: 0 };
    
    const scores = responses.map(r => {
      const totalMark = r.data.answers?.reduce((sum, a) => sum + (a.mark || 0), 0) || 0;
      return totalMark;
    });

    return {
      highest: Math.max(...scores),
      count: responses.length
    };
  }, [responses]);

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleString('en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateDuration = (start?: string, end?: string) => {
    if (!start || !end) return '-';
    const s = new Date(start).getTime();
    const e = new Date(end).getTime();
    const diff = e - s;
    
    const mins = Math.floor(diff / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    
    if (mins > 0) return `${mins} minute${mins > 1 ? 's' : ''} ${secs} second${secs > 1 ? 's' : ''}`;
    return `${secs} second${secs > 1 ? 's' : ''}`;
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-10 h-10 animate-spin text-[#06B6D4]" />
        </div>
      </MainLayout>
    );
  }

  const breadcrumbs = (
    <div className="flex items-center text-[14px] font-medium">
      <span className="text-[#6B7280] hidden md:inline">Home</span>
      <ChevronRight className="w-4 h-4 mx-2 text-[#9CA3AF] hidden md:inline" />
      <span className="text-[#6B7280] truncate max-w-[150px]">Course {courseId}</span>
      <ChevronRight className="w-4 h-4 mx-2 text-[#9CA3AF]" />
      <span className="font-bold text-[#374151] truncate max-w-[200px]">{topic?.title}</span>
    </div>
  );

  return (
    <MainLayout headerTitle={breadcrumbs}>
      <div className="flex flex-col min-h-full bg-white relative">
        
        {/* Deep Pink/Magenta Top Background */}
        <div className="w-full bg-[#9D174D] pt-10 pb-24 px-6 md:px-10">
          <div className="flex items-center gap-4 mb-8 text-white">
            <div className="bg-white/20 p-2 rounded-lg">
              <ListChecks className="w-6 h-6 shrink-0" />
            </div>
            <h1 className="text-[32px] font-bold">{topic?.title}</h1>
          </div>
          <div className="flex gap-8 border-b-2 border-white/20 text-white pb-3">
            <span className="text-[14px] font-bold border-b-4 border-white pb-[14px] -mb-[18px]">
              Quiz
            </span>
          </div>
        </div>

        {/* Content Box (overlapping the BG) */}
        <div className="px-6 md:px-10 -mt-16 w-full max-w-5xl">
          
          <div className="bg-white rounded-xl shadow-md border border-[#E5E7EB] p-6 mb-6">
            
            <div className="flex flex-col gap-2 mb-6">
              <p className="text-[14px] text-[#6B7280]">
                <span className="font-bold text-[#374151]">Open:</span> {formatDateTime(quizData.open)}
              </p>
              <p className="text-[14px] text-[#6B7280]">
                <span className="font-bold text-[#374151]">Due:</span> {formatDateTime(quizData.close)}
              </p>
            </div>
            <hr className="border-[#E5E7EB] mb-6" />

            <p className="text-[#6B7280] text-[14px] mb-6">
              {quizData.description || "This quiz contains a variety of questions to test your basic knowledge. At the end of the quiz you will be given your score with suggestions for improvement."}
            </p>

            <button className="bg-[#06B6D4] hover:bg-[#0891b2] transition-colors text-white text-[14px] font-bold px-6 py-2.5 rounded-lg mb-6 shadow-sm w-fit">
              Attempt quiz
            </button>

            <div className="text-[14px] text-[#6B7280] flex flex-col gap-2 mb-6">
              <p>Attempts allowed: {quizData.attemptsAllowed || 'Unlimited'}</p>
              <p>Grading method: {quizData.gradingMethod || 'Highest grade'}</p>
              {attemptsSummary.highest !== null && (
                <p className="font-bold text-[#22C55E] text-[16px] mt-2">
                  Highest grade: {attemptsSummary.highest} / 100
                </p>
              )}
            </div>

            {responses.length > 0 && (
              <>
                <h3 className="text-[16px] font-bold text-[#F97316] mb-4">Your attempts</h3>

                <div className="space-y-6">
                  {responses.map((attempt, index) => {
                    const totalMark = attempt.data.answers?.reduce((sum, a) => sum + (a.mark || 0), 0) || 0;
                    return (
                      <div key={attempt.id} className="w-full border border-[#E5E7EB] rounded-xl overflow-hidden shadow-sm">
                        
                        <div className="flex items-center justify-between border-b border-[#E5E7EB] bg-white p-4">
                          <div className="font-bold text-[14px] text-[#F97316]">Attempt {responses.length - index}</div>
                          <button className="text-[14px] text-[#3B82F6] hover:underline font-medium">Review</button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 border-b border-[#E5E7EB] bg-white text-[14px]">
                          <div className="p-4 font-bold text-[#374151] md:border-r md:border-[#E5E7EB]">Status</div>
                          <div className="p-4 text-[#6B7280] md:col-span-3 capitalize">{attempt.data.status}</div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 border-b border-[#E5E7EB] bg-[#F9FAFB] text-[14px]">
                          <div className="p-4 font-bold text-[#374151] md:border-r md:border-[#E5E7EB]">Started</div>
                          <div className="p-4 text-[#6B7280] md:col-span-3">{formatDateTime(attempt.data.startedAt)}</div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 border-b border-[#E5E7EB] bg-white text-[14px]">
                          <div className="p-4 font-bold text-[#374151] md:border-r md:border-[#E5E7EB]">Completed</div>
                          <div className="p-4 text-[#6B7280] md:col-span-3">{attempt.data.completedAt ? formatDateTime(attempt.data.completedAt) : '-'}</div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 border-b border-[#E5E7EB] bg-[#F9FAFB] text-[14px]">
                          <div className="p-4 font-bold text-[#374151] md:border-r md:border-[#E5E7EB]">Duration</div>
                          <div className="p-4 text-[#6B7280] md:col-span-3">{calculateDuration(attempt.data.startedAt, attempt.data.completedAt)}</div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 bg-white text-[14px]">
                          <div className="p-4 font-bold text-[#374151] md:border-r md:border-[#E5E7EB]">Mark</div>
                          <div className="p-4 text-[#6B7280] md:col-span-3 font-bold text-[#374151]">{totalMark} / 100</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
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

            <div className="space-y-6">
               {/* Comments logic could be added here similar to LearnerAssignmentView */}
               <p className="text-center text-gray-400 text-sm py-4">No comments yet</p>
            </div>

            <div className="flex gap-3 mt-8 items-center">
              <img 
                src="https://ui-avatars.com/api/?name=User&background=random" 
                alt="Your Avatar" 
                className="w-8 h-8 rounded-full object-cover shrink-0 border border-gray-200"
              />
              <div className="flex-1 relative flex items-center">
                <input 
                  type="text" 
                  placeholder="Add class comment" 
                  className="w-full border border-[#E5E7EB] rounded-full px-5 py-2.5 text-[14px] font-medium text-[#374151] placeholder-[#9CA3AF] focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] transition-all bg-[#F9FAFB] focus:bg-white"
                />
                <button className="absolute right-3 text-[#6B7280] hover:text-[#3B82F6] transition-colors p-1">
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>

          </div>
        </div>

      </div>
    </MainLayout>
  );
}
