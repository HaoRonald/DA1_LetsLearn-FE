import type {
  Question,
  QuizTopic,
  QuizTopicData,
  StudentResponse,
  QuizResponseData,
  SubmittedAnswer,
  ChoiceOption,
  AnswerRecord,
} from '@/types/quiz-attempt';
import type { RawTopicResponse, RawQuizResponse } from '@/lib/api/quiz';

// ── normalizeQuestion ──────────────────────────────────────────────────────────
/**
 * Backend may return question data in two shapes:
 *   1. Nested: question.data.choices / question.data.correctAnswer
 *   2. Flat:   question.choices / question.multiple / question.correctAnswer
 *
 * This function normalizes both into the tagged-union `data` field.
 */
export function normalizeQuestion(raw: Record<string, unknown>): Question {
  const type = (raw.type as string) as Question['type'];

  const flatChoices = (raw.choices as ChoiceOption[] | undefined) ?? [];
  const nestedData = (raw.data ?? {}) as Record<string, unknown>;
  const nestedChoices = (nestedData.choices as ChoiceOption[] | undefined) ?? [];

  let data: Question['data'];

  if (type === 'Choices Answer') {
    const choices: ChoiceOption[] = nestedChoices.length ? nestedChoices : flatChoices;
    const multiple =
      (nestedData.multiple as boolean | undefined) ??
      (raw.multiple as boolean | undefined) ??
      false;
    data = { kind: 'choices', multiple, choices };
  } else if (type === 'True/False') {
    const correctAnswer =
      (nestedData.correctAnswer as boolean | undefined) ??
      (raw.correctAnswer as boolean | undefined) ??
      true;
    const feedbackOfTrue =
      (nestedData.feedbackOfTrue as string | undefined) ??
      (raw.feedbackOfTrue as string | undefined) ??
      '';
    const feedbackOfFalse =
      (nestedData.feedbackOfFalse as string | undefined) ??
      (raw.feedbackOfFalse as string | undefined) ??
      '';
    data = { kind: 'truefalse', correctAnswer, feedbackOfTrue, feedbackOfFalse };
  } else {
    // Short Answer
    const choices: ChoiceOption[] = nestedChoices.length ? nestedChoices : flatChoices;
    data = { kind: 'shortanswer', choices };
  }

  return {
    id: raw.id as string,
    topicQuizId: (raw.topicQuizId as string | null) ?? null,
    questionName: (raw.questionName as string) ?? '',
    questionText: (raw.questionText as string) ?? '',
    status: ((raw.status as string) ?? 'Ready') as Question['status'],
    type,
    defaultMark: (raw.defaultMark as number) ?? 1,
    usage: (raw.usage as number) ?? 0,
    createdAt: raw.createdAt as string | undefined,
    modifiedAt: raw.modifiedAt as string | undefined,
    data,
  };
}

// ── parseQuizData ──────────────────────────────────────────────────────────────

function parseQuizData(raw: unknown): QuizTopicData {
  const defaults: QuizTopicData = {
    description: '',
    open: null,
    close: null,
    timeLimit: null,
    timeLimitUnit: 'Minutes',
    gradeToPass: 5,
    gradingMethod: 'Highest Grade',
    attemptAllowed: 'Unlimited',
    questions: [],
  };

  let obj: Record<string, unknown>;
  if (!raw) return defaults;
  if (typeof raw === 'string') {
    try { obj = JSON.parse(raw); } catch { return defaults; }
  } else {
    obj = raw as Record<string, unknown>;
  }

  const rawQuestions = Array.isArray(obj.questions) ? obj.questions : [];
  const questions: Question[] = rawQuestions.map((q) =>
    normalizeQuestion(q as Record<string, unknown>),
  );

  return {
    description: (obj.description as string) ?? defaults.description,
    open: (obj.open as string | null) ?? defaults.open,
    close: (obj.close as string | null) ?? defaults.close,
    timeLimit: (obj.timeLimit as number | null) ?? defaults.timeLimit,
    timeLimitUnit: (obj.timeLimitUnit as string) ?? defaults.timeLimitUnit,
    gradeToPass: (obj.gradeToPass as number) ?? defaults.gradeToPass,
    gradingMethod: (obj.gradingMethod as string) ?? defaults.gradingMethod,
    attemptAllowed: (obj.attemptAllowed as string) ?? defaults.attemptAllowed,
    questions,
  };
}

// ── mapQuizTopicResponseToClientModel ─────────────────────────────────────────

export function mapQuizTopicResponseToClientModel(raw: RawTopicResponse): QuizTopic {
  return {
    id: raw.id,
    title: raw.title,
    type: 'quiz',
    sectionId: raw.sectionId,
    data: parseQuizData(raw.data),
  };
}

// ── parseResponseData ──────────────────────────────────────────────────────────

function parseResponseData(raw: unknown): QuizResponseData {
  const defaults: QuizResponseData = {
    status: 'Not started',
    startedAt: '',
    completedAt: '',
    answers: [],
  };
  if (!raw) return defaults;

  let obj: Record<string, unknown>;
  if (typeof raw === 'string') {
    try { obj = JSON.parse(raw); } catch { return defaults; }
  } else {
    obj = raw as Record<string, unknown>;
  }

  return {
    status: (obj.status as QuizResponseData['status']) ?? defaults.status,
    startedAt: (obj.startedAt as string) ?? '',
    completedAt: (obj.completedAt as string) ?? '',
    answers: Array.isArray(obj.answers) ? (obj.answers as SubmittedAnswer[]) : [],
  };
}

// ── mapQuizResponseResponseToClientModel ──────────────────────────────────────

export function mapQuizResponseResponseToClientModel(
  raw: RawQuizResponse,
): StudentResponse {
  return {
    id: raw.id,
    studentId: raw.studentId,
    topicId: raw.topicId,
    data: parseResponseData(raw.data),
  };
}

// ── mapQuizResponseToSubmitPayload ────────────────────────────────────────────
// (used internally by the hook; exported for testing)
export function mapQuizResponseToSubmitPayload(
  topicId: string,
  startedAt: string,
  completedAt: string,
  answers: SubmittedAnswer[],
) {
  return {
    topicId,
    data: {
      status: 'Finished' as const,
      startedAt,
      completedAt,
      answers,
    },
  };
}

// ── parseAnswerFromHash ────────────────────────────────────────────────────────
/**
 * Reconstruct frontend answerRecord from a submitted answer string,
 * given the full question object for context.
 */
export function parseAnswerFromHash(
  question: Question,
  answerHash: string,
): string | string[] {
  if (question.data.kind === 'choices') {
    const { multiple, choices } = question.data;
    if (multiple) {
      // binary string e.g. "1001"
      return choices
        .filter((_, i) => answerHash[i] === '1')
        .map((c) => c.id);
    } else {
      // index string e.g. "2"
      const idx = parseInt(answerHash, 10);
      return isNaN(idx) ? '' : (choices[idx]?.id ?? '');
    }
  }
  // true/false and short answer: stored as-is
  return answerHash;
}

// ── buildAnswerRecord from review response ────────────────────────────────────

export function buildAnswerRecordFromResponse(
  response: StudentResponse,
  questions: Question[],
): AnswerRecord {
  const record: AnswerRecord = {};
  const questionMap = new Map(questions.map((q) => [q.id, q]));

  for (const submitted of response.data.answers) {
    const qid = submitted.topicQuizQuestionId;
    const question = questionMap.get(qid);
    if (!question) continue;
    record[qid] = parseAnswerFromHash(question, submitted.answer);
  }
  return record;
}
