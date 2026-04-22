'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, AlertTriangle, PlayCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import MainLayout from '@/components/layout/MainLayout';
import { QuizDescriptionCard } from '@/components/quiz-attempt/QuizDescriptionCard';
import { AttemptList } from '@/components/quiz-attempt/AttemptList';
import { useAuth } from '@/contexts/AuthContext';
import { getQuizTopic, getQuizResponsesOfTopic } from '@/lib/api/quiz';
import {
  mapQuizTopicResponseToClientModel,
  mapQuizResponseResponseToClientModel,
} from '@/lib/mappers/quiz.mapper';
import { canStartAttempt } from '@/lib/utils/quiz-utils';
import type { QuizTopic, StudentResponse } from '@/types/quiz-attempt';

export default function StudentQuizPage() {
  // The segment is [id] at the course level, matching the existing [id] folder
  const { id: courseId, topicId } = useParams() as { id: string; topicId: string };
  const router = useRouter();
  const { user } = useAuth();

  const [quiz, setQuiz] = useState<QuizTopic | null>(null);
  const [attempts, setAttempts] = useState<StudentResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [showTimeLimitWarning, setShowTimeLimitWarning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [rawQuiz, rawResponses] = await Promise.all([
        getQuizTopic(courseId, topicId),
        getQuizResponsesOfTopic(topicId),
      ]);
      setQuiz(mapQuizTopicResponseToClientModel(rawQuiz));
      setAttempts(rawResponses.map(mapQuizResponseResponseToClientModel));
    } catch {
      setError('Failed to load quiz. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [courseId, topicId]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleReview = (attempt: StudentResponse) => {
    router.push(`/courses/${courseId}/quiz/${topicId}/${attempt.id}/reviewing`);
  };

  const handleStartClick = () => {
    if (!quiz) return;
    if (quiz.data.questions.length === 0) {
      toast.error('This quiz has no questions yet.');
      return;
    }
    if (quiz.data.timeLimit) {
      setShowTimeLimitWarning(true);
    } else {
      doStartAttempt();
    }
  };

  const doStartAttempt = () => {
    setIsStarting(true);
    setShowTimeLimitWarning(false);
    router.push(`/courses/${courseId}/quiz/${topicId}/attempting`);
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-10 h-10 animate-spin text-[#DB2777]" />
        </div>
      </MainLayout>
    );
  }

  if (error || !quiz) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <AlertTriangle className="w-12 h-12 text-red-400" />
          <p className="text-[16px] font-bold text-gray-600">{error ?? 'Quiz not found.'}</p>
        </div>
      </MainLayout>
    );
  }

  const myAttempts = attempts.filter((a) => a.studentId === user?.id);
  const { allowed, reason } = canStartAttempt(
    myAttempts.filter((a) => a.data.status === 'Finished'),
    quiz.data.attemptAllowed,
    quiz.data.open,
    quiz.data.close,
  );

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <QuizDescriptionCard quiz={quiz} questionCount={quiz.data.questions.length} />

        {!allowed ? (
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 text-amber-700 px-5 py-4 rounded-xl text-[14px] font-medium">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            {reason}
          </div>
        ) : (
          <button
            type="button"
            onClick={handleStartClick}
            disabled={isStarting || quiz.data.questions.length === 0}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#DB2777] to-[#EC4899] hover:from-[#BE185D] hover:to-[#DB2777] text-white font-black text-[16px] py-4 rounded-xl transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isStarting ? <Loader2 className="w-5 h-5 animate-spin" /> : <PlayCircle className="w-5 h-5" />}
            {isStarting ? 'Starting…' : myAttempts.length > 0 ? 'Try Again' : 'Start Quiz'}
          </button>
        )}

        {user && (
          <AttemptList
            attempts={attempts}
            quiz={quiz}
            currentUserId={user.id}
            onReview={handleReview}
          />
        )}
      </div>

      {showTimeLimitWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[24px] w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-100 rounded-xl">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
              <h2 className="text-[18px] font-black text-[#374151]">Timed Quiz</h2>
            </div>
            <p className="text-[14px] text-[#6B7280] leading-relaxed">
              This quiz has a time limit of{' '}
              <strong>{quiz.data.timeLimit} {quiz.data.timeLimitUnit}</strong>.{' '}
              <span className="text-amber-600 font-bold">
                You cannot pause the quiz and the time will keep counting down.
              </span>
            </p>
            <div className="flex gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowTimeLimitWarning(false)}
                className="px-5 py-2.5 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={doStartAttempt}
                className="px-6 py-2.5 bg-[#DB2777] text-white font-bold rounded-xl hover:bg-[#BE185D] flex items-center gap-2"
              >
                <PlayCircle className="w-4 h-4" /> Start Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
