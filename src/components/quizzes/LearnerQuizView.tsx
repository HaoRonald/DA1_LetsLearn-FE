'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Clock, CheckCircle2, Loader2, AlertTriangle, PlayCircle,
  RotateCcw, Eye
} from 'lucide-react';
import { TopicResponse } from '@/services/courseService';
import { topicApi, TopicQuizData } from '@/services/topicService';
import { quizResponseApi, QuizResponseDTO } from '@/services/quizResponseService';
import { toast } from 'sonner';

interface LearnerQuizViewProps {
  quiz: TopicResponse;
  courseId: string;
}

export function LearnerQuizView({ quiz, courseId }: LearnerQuizViewProps) {
  const quizData: TopicQuizData = quiz.data || {};
  const router = useRouter();

  const [myAttempts, setMyAttempts] = useState<QuizResponseDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    const fetchAttempts = async () => {
      try {
        const res = await quizResponseApi.getByTopic(quiz.id);
        setMyAttempts(res.data || []);
      } catch (err) {
        console.error('Failed to fetch attempts:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAttempts();
  }, [quiz.id]);

  const formatDate = (date?: string) => {
    if (!date) return '—';
    return new Date(date).toLocaleString();
  };

  const formatDuration = (start?: string, end?: string) => {
    if (!start || !end) return '—';
    const ms = new Date(end).getTime() - new Date(start).getTime();
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  const getBestScore = () => {
    if (myAttempts.length === 0) return null;
    const scores = myAttempts.map(r => {
      const total = (r.data?.answers || []).reduce((sum: number, a: any) => sum + (a.mark || 0), 0);
      return total;
    });
    return Math.max(...scores);
  };

  const isOpen = !quizData.open || new Date(quizData.open) <= new Date();
  const isClosed = quizData.close && new Date(quizData.close) < new Date();
  const canAttempt = isOpen && !isClosed;
  const attemptLimit = quizData.attemptAllowed ? Number(quizData.attemptAllowed) : null;
  const hasAttemptsLeft = attemptLimit === null || myAttempts.length < attemptLimit;
  const isInProgress = myAttempts.some(r => r.data?.status === 'In Progress');

  const handleStartAttempt = async () => {
    if (!canAttempt || !hasAttemptsLeft) return;

    setIsStarting(true);
    try {
      const res = await quizResponseApi.create(quiz.id, {
        topicId: quiz.id,
        data: {
          status: 'In Progress',
          startedAt: new Date().toISOString(),
          answers: [],
        },
      });

      // Navigate to attempt page
      router.push(`/quizzes/${quiz.id}/attempt?responseId=${res.data.id}&courseId=${courseId}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to start quiz');
    } finally {
      setIsStarting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#06B6D4]" />
      </div>
    );
  }

  const totalPoints = quizData.questions?.reduce((sum, q) => sum + (q.defaultMark || 10), 0) || 0;

  return (
    <div className="bg-transparent w-full">
      {/* Quiz Info Card */}
      <div className="bg-white rounded-xl shadow-md border border-[#E5E7EB] p-6 mb-6">
        <div className="flex flex-col gap-2 mb-6">
          <p className="text-[14px] text-[#6B7280]">
            <span className="font-bold text-[#374151]">Opens:</span>{' '}
            {quizData.open ? formatDate(quizData.open) : 'Now'}
          </p>
          <p className="text-[14px] text-[#6B7280]">
            <span className="font-bold text-[#374151]">Closes:</span>{' '}
            {quizData.close ? formatDate(quizData.close) : 'No deadline'}
          </p>
          {quizData.timeLimit && (
            <p className="text-[14px] text-[#6B7280]">
              <span className="font-bold text-[#374151]">Time limit:</span>{' '}
              {quizData.timeLimit} {quizData.timeLimitUnit}
            </p>
          )}
        </div>
        <hr className="border-[#E5E7EB] mb-6" />

        <p className="text-[#6B7280] text-[14px] mb-8">
          {quizData.description || "This quiz contains a variety of questions. You will see your score at the end."}
        </p>

        {/* Quiz Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-cyan-50 rounded-xl p-4 text-center">
            <p className="text-[24px] font-black text-[#06B6D4]">
              {quizData.questions?.length || 0}
            </p>
            <p className="text-[12px] text-[#6B7280] font-medium">Questions</p>
          </div>
          <div className="bg-cyan-50 rounded-xl p-4 text-center">
            <p className="text-[24px] font-black text-[#06B6D4]">{totalPoints}</p>
            <p className="text-[12px] text-[#6B7280] font-medium">Points</p>
          </div>
          <div className="bg-cyan-50 rounded-xl p-4 text-center">
            <p className="text-[24px] font-black text-[#06B6D4]">
              {attemptLimit || '∞'}
            </p>
            <p className="text-[12px] text-[#6B7280] font-medium">Attempts</p>
          </div>
          <div className="bg-cyan-50 rounded-xl p-4 text-center">
            <p className="text-[24px] font-black text-[#06B6D4]">
              {quizData.gradingMethod?.split(' ')[0] || 'Highest'}
            </p>
            <p className="text-[12px] text-[#6B7280] font-medium">Grading</p>
          </div>
        </div>

        {/* Start Button */}
        <div className="mb-8">
          {!canAttempt ? (
            <div className="flex items-center gap-2 text-yellow-600 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 text-[14px]">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              {isClosed ? 'This quiz is closed.' : 'This quiz is not open yet.'}
            </div>
          ) : isInProgress ? (
            <div className="flex items-center gap-3">
              <button
                onClick={handleStartAttempt}
                disabled={isStarting}
                className="flex items-center gap-2 bg-[#06B6D4] hover:bg-[#0891b2] transition-colors text-white text-[14px] font-bold px-6 py-2.5 rounded-lg disabled:opacity-50"
              >
                <PlayCircle className="w-5 h-5" />
                {isStarting ? 'Starting...' : 'Continue Quiz'}
              </button>
              <span className="text-[#6B7280] text-[13px]">You have an attempt in progress.</span>
            </div>
          ) : hasAttemptsLeft ? (
            <div className="flex items-center gap-3">
              <button
                onClick={handleStartAttempt}
                disabled={isStarting}
                className="flex items-center gap-2 bg-[#06B6D4] hover:bg-[#0891b2] transition-colors text-white text-[14px] font-bold px-6 py-2.5 rounded-lg disabled:opacity-50"
              >
                <PlayCircle className="w-5 h-5" />
                {isStarting ? 'Starting...' : 'Start Quiz'}
              </button>
              {myAttempts.length > 0 && (
                <span className="text-[#6B7280] text-[13px]">
                  {myAttempts.length} / {attemptLimit || '∞'} attempts used
                </span>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-[14px]">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              You have used all allowed attempts.
            </div>
          )}
        </div>

        {/* Best Score */}
        {getBestScore() !== null && (
          <div className="mb-6">
            <p className="font-bold text-[#22C55E] text-[18px]">
              Best grade: {getBestScore()} / {totalPoints}
            </p>
          </div>
        )}

        {/* Attempts */}
        {myAttempts.length > 0 && (
          <>
            <h3 className="text-[16px] font-bold text-[#06B6D4] mb-4">Your attempts</h3>
            <div className="space-y-4">
              {myAttempts.map((attempt, idx) => {
                const score = (attempt.data?.answers || []).reduce((sum: number, a: any) => sum + (a.mark || 0), 0);
                return (
                  <div key={attempt.id} className="w-full border border-[#E5E7EB] rounded-xl overflow-hidden shadow-sm">
                    <div className="flex items-center justify-between border-b border-[#E5E7EB] bg-white p-4">
                      <div className="font-bold text-[14px] text-[#06B6D4]">
                        Attempt {myAttempts.length - idx}
                      </div>
                      <button className="flex items-center gap-1.5 text-[#3B82F6] hover:underline font-medium text-[13px]">
                        <Eye className="w-4 h-4" />
                        Review
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 border-b border-[#E5E7EB] bg-white text-[14px]">
                      <div className="p-4 font-bold text-[#374151] md:border-r md:border-[#E5E7EB]">Status</div>
                      <div className="p-4 text-[#6B7280] md:col-span-3 capitalize">
                        <span className={`flex items-center gap-1.5 ${
                          attempt.data?.status === 'Finished' ? 'text-green-600' : 'text-yellow-600'
                        }`}>
                          {attempt.data?.status === 'Finished' ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : (
                            <Clock className="w-4 h-4" />
                          )}
                          {attempt.data?.status}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 border-b border-[#E5E7EB] bg-[#F9FAFB] text-[14px]">
                      <div className="p-4 font-bold text-[#374151] md:border-r md:border-[#E5E7EB]">Started</div>
                      <div className="p-4 text-[#6B7280] md:col-span-3">{formatDate(attempt.data?.startedAt)}</div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 border-b border-[#E5E7EB] bg-white text-[14px]">
                      <div className="p-4 font-bold text-[#374151] md:border-r md:border-[#E5E7EB]">Completed</div>
                      <div className="p-4 text-[#6B7280] md:col-span-3">{formatDate(attempt.data?.completedAt)}</div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 bg-[#F9FAFB] text-[14px]">
                      <div className="p-4 font-bold text-[#374151] md:border-r md:border-[#E5E7EB]">Mark</div>
                      <div className="p-4 text-[#6B7280] md:col-span-3 font-bold">
                        {attempt.data?.status === 'Finished' ? (
                          <span className="text-[#374151]">{score} / {totalPoints}</span>
                        ) : (
                          <span className="text-[#9CA3AF]">—</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
