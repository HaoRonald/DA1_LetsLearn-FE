'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import type {
  Question, QuizTopic, StudentResponse,
  AnswerRecord, AttemptSessionState,
} from '@/types/quiz-attempt';
import { quizResponseApi } from '@/services/quizResponseService';
import {
  getSecondFromTimeLimitType,
  buildSubmittedAnswers,
} from '@/lib/utils/quiz-utils';

// ── Public interface ──────────────────────────────────────────────────────────

export interface UseQuizAttemptSessionReturn {
  session: AttemptSessionState;
  currentQuestion: Question | null;
  answeredCount: number;
  totalQuestions: number;
  setCurrentQuestion: (id: string) => void;
  toggleFlag: (id: string) => void;
  setAnswer: (questionId: string, value: string | string[]) => void;
  requestFinish: () => void;
  confirmFinish: () => Promise<void>;
  cancelFinish: () => void;
  showConfirm: boolean;
  isAllAnswered: boolean;
  enterReviewMode: (response: StudentResponse, answerRecord: AnswerRecord) => void;
  timerDisplay: string;
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useQuizAttemptSession(
  quiz: QuizTopic,
  initialAnswerRecord: AnswerRecord = {},
  initialReviewMode = false,
  initialResponse: StudentResponse | null = null,
): UseQuizAttemptSessionReturn {
  const questions = quiz.data.questions;
  const firstId = questions[0]?.id ?? '';
  const startedAt = useRef(new Date().toISOString());

  const initialState: AttemptSessionState = {
    questions,
    currentQuestionId: firstId,
    answerRecord: initialAnswerRecord,
    flaggedIds: new Set(),
    isReviewMode: initialReviewMode,
    studentResponse: initialResponse,
    startedAt: startedAt.current,
    timer: computeInitialTimer(quiz),
    isSubmitting: false,
  };

  const [session, setSession] = useState<AttemptSessionState>(initialState);
  const [showConfirm, setShowConfirm] = useState(false);

  // ── Refs ──────────────────────────────────────────────────────────────────

  /**
   * Always mirrors the latest session state so doSubmit can read it
   * without putting the API call inside a setState updater.
   * (Calling async code inside setState updaters causes React StrictMode
   *  to fire them twice → duplicate network requests → duplicate DB records.)
   */
  const sessionRef = useRef<AttemptSessionState>(initialState);
  useEffect(() => {
    sessionRef.current = session;
  });

  /** Single-flight guard — prevents double-submit from double-click or auto-submit race. */
  const isSubmittingRef = useRef(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Timer ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (session.isReviewMode) return;

    const tick = () => {
      setSession((prev) => {
        if (prev.isReviewMode || prev.isSubmitting) return prev;

        const { timer } = prev;
        const hasCountdown = quiz.data.timeLimit !== null;

        if (hasCountdown && timer !== null) {
          if (timer <= 1) {
            clearInterval(timerRef.current!);
            // Defer auto-submit outside the updater to avoid side-effects in StrictMode
            setTimeout(() => triggerAutoSubmit(), 0);
            return { ...prev, timer: 0 };
          }
          return { ...prev, timer: timer - 1 };
        }
        // count-up
        return { ...prev, timer: (timer ?? 0) + 1 };
      });
    };

    timerRef.current = setInterval(tick, 1000);
    return () => clearInterval(timerRef.current!);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.isReviewMode]);

  // ── Submit ────────────────────────────────────────────────────────────────

  /** Called from the timer's setTimeout — avoids circular dep with doSubmit. */
  const triggerAutoSubmit = useCallback(() => {
    if (isSubmittingRef.current) return;
    toast.error('Time is up! Submitting your quiz...');
    doSubmit(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Core submit — reads state from sessionRef (not from inside a setState updater)
   * to prevent React StrictMode from firing the API call twice.
   */
  const doSubmit = useCallback(
    async (isAuto = false) => {
      // Hard guard: both ref and state checked to be safe
      if (isSubmittingRef.current) return;
      isSubmittingRef.current = true;

      // Mark submitting in UI immediately (safe — no side-effects in updater)
      setSession((s) => ({ ...s, isSubmitting: true }));

      // Read latest state from the ref (NOT from inside setState updater)
      const snap = sessionRef.current;
      const completedAt = new Date().toISOString();
      const answers = buildSubmittedAnswers(snap.questions, snap.answerRecord);

      const payload = {
        topicId: quiz.id,
        data: {
          status: 'Finished' as const,
          startedAt: snap.startedAt,
          completedAt,
          answers,
        },
      };

      console.log('[quiz submit] payload →', payload);

      try {
        const res = await quizResponseApi.create(quiz.id, payload);

        clearInterval(timerRef.current!);

        const clientResponse: StudentResponse = {
          id: res.data.id,
          studentId: res.data.studentId,
          topicId: res.data.topicId,
          data: {
            status: res.data.data.status as StudentResponse['data']['status'],
            startedAt: res.data.data.startedAt ?? '',
            completedAt: res.data.data.completedAt ?? '',
            answers: (res.data.data.answers ?? []).map((a) => ({
              topicQuizQuestionId: a.topicQuizQuestionId,
              answer: a.answer,
              mark: a.mark ?? 0,
            })),
          },
        };

        toast.success(isAuto ? 'Quiz auto-submitted!' : 'Quiz submitted successfully!');
        setSession((s) => ({
          ...s,
          isReviewMode: true,
          isSubmitting: false,
          studentResponse: clientResponse,
        }));
      } catch (err: unknown) {
        const msg =
          err && typeof err === 'object' && 'response' in err
            ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
            : undefined;
        toast.error(msg ?? 'Failed to submit quiz');
        isSubmittingRef.current = false;
        setSession((s) => ({ ...s, isSubmitting: false }));
      }
    },
    [quiz.id],
  );

  // ── Public actions ─────────────────────────────────────────────────────────

  const setCurrentQuestion = (id: string) =>
    setSession((p) => ({ ...p, currentQuestionId: id }));

  const toggleFlag = (id: string) =>
    setSession((p) => {
      const next = new Set(p.flaggedIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { ...p, flaggedIds: next };
    });

  const setAnswer = (questionId: string, value: string | string[]) => {
    if (sessionRef.current.isReviewMode) return;
    setSession((p) => ({
      ...p,
      answerRecord: { ...p.answerRecord, [questionId]: value },
    }));
  };

  const isAllAnswered = questions.every((q) => {
    const v = session.answerRecord[q.id];
    if (v === undefined || v === '') return false;
    if (Array.isArray(v)) return v.length > 0;
    return v.trim() !== '';
  });

  const requestFinish = () => {
    if (isSubmittingRef.current || session.isSubmitting) return;
    setShowConfirm(true);
  };

  const confirmFinish = async () => {
    setShowConfirm(false);
    await doSubmit(false);
  };

  const cancelFinish = () => setShowConfirm(false);

  const enterReviewMode = (response: StudentResponse, answerRecord: AnswerRecord) =>
    setSession((p) => ({
      ...p,
      isReviewMode: true,
      studentResponse: response,
      answerRecord,
    }));

  // ── Derived ────────────────────────────────────────────────────────────────

  const currentQuestion =
    questions.find((q) => q.id === session.currentQuestionId) ?? questions[0] ?? null;

  const answeredCount = questions.filter((q) => {
    const v = session.answerRecord[q.id];
    if (v === undefined || v === '') return false;
    if (Array.isArray(v)) return v.length > 0;
    return v.trim() !== '';
  }).length;

  const timerDisplay = formatTimerDisplay(session.timer, quiz.data.timeLimit !== null);

  return {
    session,
    currentQuestion,
    answeredCount,
    totalQuestions: questions.length,
    setCurrentQuestion,
    toggleFlag,
    setAnswer,
    requestFinish,
    confirmFinish,
    cancelFinish,
    showConfirm,
    isAllAnswered,
    enterReviewMode,
    timerDisplay,
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function computeInitialTimer(quiz: QuizTopic): number | null {
  const { timeLimit, timeLimitUnit } = quiz.data;
  if (!timeLimit) return 0; // count-up (no limit)
  return getSecondFromTimeLimitType(timeLimit, timeLimitUnit);
}

function formatTimerDisplay(timer: number | null, _isCountdown: boolean): string {
  if (timer === null) return '';
  const t = Math.abs(timer);
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = t % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}
