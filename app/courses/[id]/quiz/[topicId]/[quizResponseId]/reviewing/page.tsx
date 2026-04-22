'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, AlertTriangle } from 'lucide-react';
import { getQuizTopic, getQuizResponse } from '@/lib/api/quiz';
import {
  mapQuizTopicResponseToClientModel,
  mapQuizResponseResponseToClientModel,
  buildAnswerRecordFromResponse,
} from '@/lib/mappers/quiz.mapper';
import { QuizAttemptPage } from '@/components/quiz-attempt/QuizAttemptPage';
import type { QuizTopic, StudentResponse, AnswerRecord } from '@/types/quiz-attempt';

export default function ReviewingPage() {
  const { id: courseId, topicId, quizResponseId } = useParams() as {
    id: string;
    topicId: string;
    quizResponseId: string;
  };
  const router = useRouter();

  const [quiz, setQuiz] = useState<QuizTopic | null>(null);
  const [response, setResponse] = useState<StudentResponse | null>(null);
  const [answerRecord, setAnswerRecord] = useState<AnswerRecord>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [rawQuiz, rawResponse] = await Promise.all([
          getQuizTopic(courseId, topicId),
          getQuizResponse(topicId, quizResponseId),
        ]);
        const quizModel = mapQuizTopicResponseToClientModel(rawQuiz);
        const responseModel = mapQuizResponseResponseToClientModel(rawResponse);
        const record = buildAnswerRecordFromResponse(responseModel, quizModel.data.questions);
        setQuiz(quizModel);
        setResponse(responseModel);
        setAnswerRecord(record);
      } catch {
        setError('Failed to load review data.');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [courseId, topicId, quizResponseId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F9FAFB]">
        <Loader2 className="w-10 h-10 animate-spin text-[#DB2777]" />
      </div>
    );
  }

  if (error || !quiz || !response) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <AlertTriangle className="w-12 h-12 text-red-400" />
        <p className="text-[16px] font-bold text-gray-600">{error ?? 'Could not load review.'}</p>
        <button type="button" onClick={() => router.back()} className="px-6 py-2 bg-[#DB2777] text-white font-bold rounded-xl">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <QuizAttemptPage
      quiz={quiz}
      initialAnswerRecord={answerRecord}
      initialReviewMode={true}
      initialResponse={response}
    />
  );
}
