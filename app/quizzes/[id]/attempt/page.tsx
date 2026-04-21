'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import {
  Check, X, CheckCircle2, Circle, Flag, Loader2, Clock,
  ChevronLeft, ChevronRight, AlertTriangle, Send, CheckSquare, Square
} from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { quizResponseApi, QuizResponseDTO } from '@/services/quizResponseService';
import { courseApi, TopicResponse } from '@/services/courseService';
import { topicApi, TopicQuizData } from '@/services/topicService';
import { toast } from 'sonner';

interface QuizAnswer {
  topicQuizQuestionId: string;
  answer: string;
  mark?: number;
}

export default function QuizAttemptPage() {
  const { id: topicId } = useParams() as { id: string };
  const searchParams = useSearchParams();
  const responseId = searchParams.get('responseId');
  const courseIdParam = searchParams.get('courseId');

  const [quiz, setQuiz] = useState<TopicResponse | null>(null);
  const [response, setResponse] = useState<QuizResponseDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set());
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [answers, setAnswers] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchData = async () => {
      if (!topicId || !responseId) {
        setIsLoading(false);
        return;
      }
      try {
      // Get course ID — prefer from URL params, otherwise search all courses
      let resolvedCourseId = courseIdParam;
      if (!resolvedCourseId) {
        const courseRes = await courseApi.getAll();
        const currentCourse = courseRes.data.find((c: any) =>
          c.topics?.some((t: any) => t.id === topicId)
        );
        resolvedCourseId = currentCourse?.id;
      }

      if (!resolvedCourseId) {
        toast.error('Cannot find course context');
        setIsLoading(false);
        return;
      }

      const [quizRes, responseRes] = await Promise.all([
        courseApi.getTopicById(resolvedCourseId, topicId),
        quizResponseApi.getById(topicId, responseId),
      ]);

        setQuiz(quizRes.data);
        setResponse(responseRes.data);

        // Parse existing answers
        const existingAnswers: Record<string, string> = {};
        (responseRes.data.data?.answers || []).forEach((a: any) => {
          existingAnswers[a.topicQuizQuestionId] = a.answer;
        });
        setAnswers(existingAnswers);

        // Setup timer if quiz has time limit
        const quizData: TopicQuizData = quizRes.data.data || {};
        if (quizData.timeLimit && responseRes.data.data?.startedAt) {
          const startTime = new Date(responseRes.data.data.startedAt).getTime();
          const limitMs = (quizData.timeLimit || 0) * (quizData.timeLimitUnit === 'hours' ? 3600000 : 60000);
          const endTime = startTime + limitMs;
          const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
          setTimeLeft(remaining);
        }
      } catch (err) {
        console.error('Failed to fetch quiz data:', err);
        toast.error('Failed to load quiz');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [topicId, responseId, courseIdParam]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(timerRef.current!);
          toast.error('Time is up! Submitting quiz...');
          handleSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timeLeft !== null]);

  const quizData: TopicQuizData = quiz?.data || {};
  const questions = quizData.questions || [];
  const currentQ = questions[currentQuestion];

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleSelectAnswer = (questionId: string, answer: string, isMultiple: boolean) => {
    setAnswers(prev => {
      if (isMultiple) {
        const current = prev[questionId]?.split(',').filter(Boolean) || [];
        if (current.includes(answer)) {
          return { ...prev, [questionId]: current.filter(a => a !== answer).join(',') };
        }
        return { ...prev, [questionId]: [...current, answer].join(',') };
      }
      return { ...prev, [questionId]: answer };
    });
  };

  const toggleFlag = (idx: number) => {
    setFlaggedQuestions(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const isSubmittingRef = useRef(false);

  const handleSubmit = async (autoSubmit = false) => {
    if (!responseId || isSubmitting || isSubmittingRef.current) return;

    setIsSubmitting(true);
    isSubmittingRef.current = true;
    try {
      const quizAnswers: QuizAnswer[] = questions
        .filter(q => q.id) // Only include questions with valid IDs
        .map(q => ({
          topicQuizQuestionId: q.id!,
          answer: answers[q.id!] || '',
        }));

      await quizResponseApi.update(topicId, responseId, {
        data: {
          status: 'Finished',
          startedAt: response?.data?.startedAt,
          completedAt: new Date().toISOString(),
          answers: quizAnswers,
        },
      });

      toast.success(autoSubmit ? 'Quiz auto-submitted!' : 'Quiz submitted successfully!');
      router.push(`/quizzes/${topicId}?courseId=${searchParams.get('courseId') || courseIdParam || ''}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit quiz');
      setIsSubmitting(false);
      isSubmittingRef.current = false;
    }
  };

  const isAnswered = (questionId: string) => {
    return !!answers[questionId]?.trim();
  };

  const answeredCount = questions.filter(q => isAnswered(q.id || '')).length;

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-10 h-10 animate-spin text-[#DB2777]" />
        </div>
      </MainLayout>
    );
  }

  if (!quiz || !response) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-screen">
          <AlertTriangle className="w-12 h-12 text-red-400 mb-4" />
          <p className="text-[18px] font-bold text-gray-600">Quiz not found or expired.</p>
          <button
            onClick={() => router.back()}
            className="mt-4 bg-[#DB2777] text-white px-6 py-2 rounded-lg font-bold"
          >
            Go Back
          </button>
        </div>
      </MainLayout>
    );
  }

  if (questions.length === 0) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-screen">
          <AlertTriangle className="w-12 h-12 text-yellow-400 mb-4" />
          <p className="text-[18px] font-bold text-gray-600">This quiz has no questions yet.</p>
          <button
            onClick={() => router.back()}
            className="mt-4 bg-[#DB2777] text-white px-6 py-2 rounded-lg font-bold"
          >
            Go Back
          </button>
        </div>
      </MainLayout>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* Top Bar */}
      <div className="sticky top-0 z-20 bg-white border-b border-[#E5E7EB] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-[18px] font-bold text-[#DB2777]">{quiz.title}</h1>
            <span className="text-[13px] text-[#6B7280]">
              Question {currentQuestion + 1} of {questions.length}
            </span>
          </div>

          {timeLeft !== null && (
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-[16px] ${
              timeLeft < 300 ? 'bg-red-50 text-red-600' : 'bg-pink-50 text-[#DB2777]'
            }`}>
              <Clock className="w-5 h-5" />
              {formatTime(timeLeft)}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 flex gap-8">
        {/* LEFT: Annotation Legend */}
        <div className="w-64 shrink-0 hidden lg:block">
          <div className="sticky top-24 bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-sm">
            <h2 className="text-[16px] font-bold text-[#DB2777] mb-4">Symbol Guide</h2>

            <h3 className="text-[13px] font-bold text-[#DB2777] mb-3 text-center">Symbol</h3>
            <div className="space-y-3 mb-6">
              <div className="flex gap-3 items-start">
                <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                <span className="text-[12px] text-[#6B7280]">Correct answer selected</span>
              </div>
              <div className="flex gap-3 items-start">
                <X className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span className="text-[12px] text-[#6B7280]">Incorrect answer selected</span>
              </div>
              <div className="flex gap-3 items-start">
                <Flag className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span className="text-[12px] text-[#6B7280]">Flagged for review</span>
              </div>
            </div>

            <div className="border-t border-[#E5E7EB] pt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[13px] font-bold text-[#6B7280]">Answered</span>
                <span className="text-[14px] font-bold text-[#DB2777]">{answeredCount}/{questions.length}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className="bg-[#DB2777] h-2 rounded-full transition-all"
                  style={{ width: `${(answeredCount / questions.length) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* MIDDLE: Question */}
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 shadow-sm mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`px-4 py-2 rounded-xl font-bold text-[14px] text-white ${
                  flaggedQuestions.has(currentQuestion)
                    ? 'bg-gradient-to-r from-[#6366F1] to-[#06B6D4]'
                    : 'bg-gradient-to-r from-[#6366F1] to-[#06B6D4]'
                }`}>
                  <Flag
                    className={`w-4 h-4 inline mr-1 ${
                      flaggedQuestions.has(currentQuestion) ? 'text-red-400 fill-red-400' : 'text-white'
                    }`}
                    onClick={() => toggleFlag(currentQuestion)}
                  />
                  Question {currentQuestion + 1} / {questions.length}
                </div>
                <button
                  onClick={() => toggleFlag(currentQuestion)}
                  className="text-[13px] font-medium text-[#6B7280] hover:text-[#DB2777]"
                >
                  {flaggedQuestions.has(currentQuestion) ? 'Unflag' : 'Flag for review'}
                </button>
              </div>
              <span className="text-[13px] font-medium text-[#6B7280]">
                {currentQ.defaultMark || 10} pts
              </span>
            </div>

            <p className="text-[16px] text-[#374151] leading-relaxed mb-6">
              {currentQ.questionText}
            </p>

            {/* Multiple Choice */}
            {currentQ.type === 'Multiple Choice' && (
              <div className="space-y-3">
                {currentQ.choices?.map((choice, idx) => {
                  const isSelected = answers[currentQ.id || '']?.split(',').includes(choice.text);
                  const isCorrect = choice.gradePercent === 100;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelectAnswer(currentQ.id || '', choice.text, currentQ.multiple || false)}
                      className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl border-2 text-left transition-all ${
                        isSelected
                          ? isCorrect
                            ? 'bg-green-50 border-green-400 text-green-700'
                            : 'bg-blue-50 border-blue-400 text-blue-700'
                          : 'bg-gray-50 border-gray-200 hover:border-pink-300 hover:bg-pink-50'
                      }`}
                    >
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-[14px] font-bold shrink-0 ${
                        isSelected ? 'bg-white shadow-sm' : 'bg-gray-200 text-gray-600'
                      }`}>
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className="flex-1 text-[15px]">{choice.text}</span>
                      {currentQ.multiple ? (
                        isSelected ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />
                      ) : (
                        isSelected ? <Circle className="w-5 h-5 fill-current" /> : <Circle className="w-5 h-5" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* True/False */}
            {currentQ.type === 'True/False' && (
              <div className="grid grid-cols-2 gap-4 max-w-md">
                {[true, false].map(val => {
                  const isSelected = answers[currentQ.id || ''] === String(val);
                  return (
                    <button
                      key={String(val)}
                      onClick={() => handleSelectAnswer(currentQ.id || '', String(val), false)}
                      className={`h-16 rounded-xl border-2 text-[16px] font-medium transition-all flex items-center justify-center gap-3 ${
                        isSelected
                          ? val
                            ? 'bg-green-50 border-green-400 text-green-700'
                            : 'bg-red-50 border-red-400 text-red-700'
                          : 'bg-gray-50 border-gray-200 hover:border-pink-300'
                      }`}
                    >
                      {val ? <Check className="w-6 h-6" /> : <X className="w-6 h-6" />}
                      {val ? 'True' : 'False'}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Short Answer */}
            {currentQ.type === 'Short Answer' && (
              <textarea
                value={answers[currentQ.id || ''] || ''}
                onChange={e => handleSelectAnswer(currentQ.id || '', e.target.value, false)}
                placeholder="Type your answer here..."
                rows={4}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-[15px] focus:outline-none focus:border-pink-400 transition-colors"
              />
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
              disabled={currentQuestion === 0}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#E5E7EB] rounded-xl text-[14px] font-bold text-[#6B7280] hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>

            {currentQuestion < questions.length - 1 ? (
              <button
                onClick={() => setCurrentQuestion(currentQuestion + 1)}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#DB2777] text-white rounded-xl text-[14px] font-bold hover:bg-pink-700 transition-colors"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => setShowSubmitConfirm(true)}
                className="flex items-center gap-2 px-6 py-2.5 bg-green-500 text-white rounded-xl text-[14px] font-bold hover:bg-green-600 transition-colors"
              >
                <Send className="w-4 h-4" /> Submit Quiz
              </button>
            )}
          </div>
        </div>

        {/* RIGHT: Question Nav */}
        <div className="w-60 shrink-0 hidden xl:block">
          <div className="sticky top-24 bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-sm">
            <h2 className="text-[16px] font-bold text-[#DB2777] mb-4">Navigation</h2>

            <div className="grid grid-cols-5 gap-2 mb-6">
              {questions.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentQuestion(idx)}
                  className={`relative w-full aspect-square flex items-center justify-center rounded-lg text-[12px] font-bold transition-all ${
                    currentQuestion === idx
                      ? 'bg-[#DB2777] text-white'
                      : flaggedQuestions.has(idx)
                        ? 'bg-pink-100 text-[#DB2777] border-2 border-red-400'
                        : isAnswered(questions[idx].id || '')
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {idx + 1}
                  {flaggedQuestions.has(idx) && (
                    <Flag className="absolute -top-1 -right-1 w-3 h-3 text-red-500 fill-red-500" />
                  )}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowSubmitConfirm(true)}
              disabled={isSubmitting}
              className="w-full py-2.5 bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold text-[14px] rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
                </>
              ) : (
                <>Finish Attempt</>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[24px] w-full max-w-md shadow-2xl p-6">
            <h2 className="text-[20px] font-bold text-[#374151] mb-2">Submit Quiz?</h2>
            <p className="text-[14px] text-[#6B7280] mb-6">
              You have answered {answeredCount} out of {questions.length} questions.
              {answeredCount < questions.length && (
                <span className="text-yellow-600 block mt-1">
                  Warning: {questions.length - answeredCount} question(s) are unanswered.
                </span>
              )}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowSubmitConfirm(false)}
                className="px-5 py-2.5 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-colors"
              >
                Continue Quiz
              </button>
              <button
                onClick={() => handleSubmit(false)}
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
