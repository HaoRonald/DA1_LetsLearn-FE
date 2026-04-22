'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, AlertTriangle } from 'lucide-react';
import { getQuizTopic } from '@/lib/api/quiz';
import { mapQuizTopicResponseToClientModel } from '@/lib/mappers/quiz.mapper';
import { QuizAttemptPage } from '@/components/quiz-attempt/QuizAttemptPage';
import type { QuizTopic } from '@/types/quiz-attempt';

export default function AttemptingPage() {
  const { id: courseId, topicId } = useParams() as { id: string; topicId: string };
  const router = useRouter();
  const [quiz, setQuiz] = useState<QuizTopic | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getQuizTopic(courseId, topicId)
      .then((raw) => setQuiz(mapQuizTopicResponseToClientModel(raw)))
      .catch(() => setError('Failed to load quiz.'))
      .finally(() => setIsLoading(false));
  }, [courseId, topicId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F9FAFB]">
        <Loader2 className="w-10 h-10 animate-spin text-[#DB2777]" />
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <AlertTriangle className="w-12 h-12 text-red-400" />
        <p className="text-[16px] font-bold text-gray-600">{error ?? 'Quiz not found.'}</p>
        <button type="button" onClick={() => router.back()} className="px-6 py-2 bg-[#DB2777] text-white font-bold rounded-xl">
          Go Back
        </button>
      </div>
    );
  }

  if (quiz.data.questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <AlertTriangle className="w-12 h-12 text-yellow-400" />
        <p className="text-[16px] font-bold text-gray-600">This quiz has no questions.</p>
        <button type="button" onClick={() => router.back()} className="px-6 py-2 bg-[#DB2777] text-white font-bold rounded-xl">
          Go Back
        </button>
      </div>
    );
  }

  return <QuizAttemptPage quiz={quiz} />;
}
