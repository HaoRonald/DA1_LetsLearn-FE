import type {
  Question,
  QuizTopic,
  StudentResponse,
  SubmittedAnswer,
  AnswerRecord,
  QuizResult,
  TimeLimitUnit,
} from '@/types/quiz-attempt';

// ── Time conversion ────────────────────────────────────────────────────────────

export function getSecondFromTimeLimitType(
  value: number,
  unit: TimeLimitUnit | string,
): number {
  const u = unit.toLowerCase();
  if (u === 'seconds') return value;
  if (u === 'minutes') return value * 60;
  if (u === 'hours') return value * 3600;
  if (u === 'days') return value * 86400;
  if (u === 'weeks') return value * 604800;
  return value * 60; // fallback to minutes
}

export function formatSeconds(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const parts: string[] = [];
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  if (s > 0 || parts.length === 0) parts.push(`${s}s`);
  return parts.join(' ');
}

// ── Answer encoding ────────────────────────────────────────────────────────────

/**
 * Convert local answerRecord value → hash string for backend submission.
 *
 * - single choice: index of selected choiceId in the choices array → "2"
 * - multiple choice: binary string of selections → "1001"
 * - true/false: "1" or "0"
 * - short answer: raw text
 */
export function convertAnswerToHash(question: Question, value: string | string[]): string {
  if (question.data.kind === 'choices') {
    const { multiple, choices } = question.data;
    if (multiple) {
      const selected = value as string[];
      return choices
        .map((c) => (selected.includes(c.id) ? '1' : '0'))
        .join('');
    } else {
      const choiceId = value as string;
      const idx = choices.findIndex((c) => c.id === choiceId);
      return idx >= 0 ? String(idx) : '';
    }
  }

  // true/false and short answer stored as-is
  return typeof value === 'string' ? value : '';
}

// ── Scoring ────────────────────────────────────────────────────────────────────

export function getQuestionMark(question: Question, value: string | string[] | undefined): number {
  if (value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) return 0;

  if (question.data.kind === 'choices') {
    const { multiple, choices } = question.data;
    if (multiple) {
      const selected = value as string[];
      const totalGradePercent = selected.reduce((sum, id) => {
        const choice = choices.find((c) => c.id === id);
        return sum + (choice?.gradePercent ?? 0);
      }, 0);
      return Math.round((question.defaultMark * totalGradePercent) / 100);
    } else {
      const choiceId = value as string;
      const choice = choices.find((c) => c.id === choiceId);
      const pct = choice?.gradePercent ?? 0;
      return Math.round((question.defaultMark * pct) / 100);
    }
  }

  if (question.data.kind === 'truefalse') {
    const { correctAnswer } = question.data;
    const userAnswer = value === '1' ? true : false;
    return userAnswer === correctAnswer ? question.defaultMark : 0;
  }

  if (question.data.kind === 'shortanswer') {
    const { choices } = question.data;
    const text = (value as string).trim().toLowerCase();
    const match = choices.find((c) => c.text.trim().toLowerCase() === text);
    if (!match) return 0;
    return Math.round((question.defaultMark * match.gradePercent) / 100);
  }

  return 0;
}

export function getQuestionFeedback(
  question: Question,
  value: string | string[] | undefined,
  isCorrect: boolean,
): string {
  if (question.data.kind === 'truefalse') {
    const userTrue = value === '1';
    const fb = userTrue ? question.data.feedbackOfTrue : question.data.feedbackOfFalse;
    return fb || (isCorrect ? 'Great Job!' : 'Try Again.');
  }

  if (question.data.kind === 'choices') {
    const { choices } = question.data;
    const selected = Array.isArray(value) ? value : value ? [value] : [];
    const feedbacks = selected
      .map((id) => choices.find((c) => c.id === id)?.feedback)
      .filter(Boolean) as string[];
    if (feedbacks.length > 0) return feedbacks.join(' / ');
    return isCorrect ? 'Great Job!' : 'Try Again.';
  }

  return isCorrect ? 'Great Job!' : 'Try Again.';
}

// ── Build submit answers list ──────────────────────────────────────────────────

export function buildSubmittedAnswers(
  questions: Question[],
  answerRecord: AnswerRecord,
): Array<{ topicQuizQuestionId: string; answer: string; mark: number }> {
  return questions.map((q) => {
    const value = answerRecord[q.id];
    const mark = getQuestionMark(q, value);
    const answer = convertAnswerToHash(q, value ?? '');
    return { topicQuizQuestionId: q.id, answer, mark };
  });
}

// ── Grade aggregation ──────────────────────────────────────────────────────────

export function getQuizResponseMark(response: StudentResponse): number {
  return response.data.answers.reduce((sum, a) => sum + (a.mark ?? 0), 0);
}

export function getQuizResponseTotalMark(quiz: QuizTopic): number {
  return quiz.data.questions.reduce((sum, q) => sum + q.defaultMark, 0);
}

export function getGradedMark(
  responses: StudentResponse[],
  gradingMethod: string,
  quiz: QuizTopic,
): number | null {
  if (responses.length === 0) return null;
  const marks = responses.map(getQuizResponseMark);
  const method = gradingMethod.toLowerCase();
  if (method.includes('highest')) return Math.max(...marks);
  if (method.includes('average')) return Math.round(marks.reduce((a, b) => a + b, 0) / marks.length);
  if (method.includes('first')) return marks[marks.length - 1]; // oldest first
  if (method.includes('last')) return marks[0]; // newest first
  return Math.max(...marks);
}

export function getQuizResultFromMark(score: number, totalScore: number, durationSeconds: number): QuizResult {
  const pct = totalScore > 0 ? (score / totalScore) * 100 : 0;
  const level: QuizResult['level'] = pct >= 80 ? 'good' : pct >= 50 ? 'average' : 'bad';
  return { score, totalScore, durationSeconds, level };
}

// ── Attempt count helpers ──────────────────────────────────────────────────────

export function canStartAttempt(
  attempts: StudentResponse[],
  attemptAllowed: string,
  open: string | null,
  close: string | null,
): { allowed: boolean; reason?: string } {
  const now = new Date();
  if (open && new Date(open) > now) return { allowed: false, reason: 'Quiz is not open yet.' };
  if (close && new Date(close) < now) return { allowed: false, reason: 'Quiz is closed.' };

  if (attemptAllowed !== 'Unlimited') {
    const limit = parseInt(attemptAllowed, 10);
    if (!isNaN(limit) && attempts.length >= limit) {
      return { allowed: false, reason: 'You have used all allowed attempts.' };
    }
  }
  return { allowed: true };
}
