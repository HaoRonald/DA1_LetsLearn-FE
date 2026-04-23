import axiosInstance from '@/lib/axios';
import { topicApi } from '@/services/topicService';
import type {
  Question,
  CreateQuestionPayload,
  QuestionType,
  QuizQuestion,
  QuizTopicData,
} from '@/types/quiz';

// ── Reads ──────────────────────────────────────────────────────────────────────

export function fetchBankQuestions(courseId: string): Promise<Question[]> {
  return axiosInstance
    .get<Question[]>('/question', { params: { courseId } })
    .then((r) => r.data ?? []);
}

// ── Writes ─────────────────────────────────────────────────────────────────────

interface CreateInput {
  courseId: string;
  type: QuestionType;
  questionName: string;
  questionText: string;
  status: 'Ready' | 'Draft';
  defaultMark: number;
  multiple: boolean;
  correctAnswer: boolean;
  feedbackOfTrue: string;
  feedbackOfFalse: string;
  choices: Array<{ text: string; gradePercent: number; feedback: string }>;
}

export function createBankQuestion(input: CreateInput): Promise<Question> {
  const payload: CreateQuestionPayload = {
    id: null,
    topicQuizId: null,
    questionName: input.questionName || `Q - ${input.questionText.slice(0, 40)}`,
    questionText: input.questionText,
    status: input.status,
    type: input.type,
    defaultMark: input.defaultMark,
    usage: 0,
    feedbackOfTrue: input.type === 'True/False' ? (input.feedbackOfTrue || '') : null,
    feedbackOfFalse: input.type === 'True/False' ? (input.feedbackOfFalse || '') : null,
    correctAnswer: input.type === 'True/False' ? input.correctAnswer : false,
    multiple: input.type === 'Choices Answer' ? input.multiple : false,
    choices:
      input.type !== 'True/False'
        ? input.choices
            .filter((c) => c.text.trim())
            .map((c) => ({
              id: null,
              text: c.text,
              gradePercent: c.gradePercent,
              feedback: c.feedback,
              questionId: null,
            }))
        : [],
    course: { id: input.courseId },
    createdAt: new Date().toISOString(),
    createdBy: null,
    modifiedBy: null,
    updatedAt: null,
    deletedAt: null,
  };

  return axiosInstance.post<Question>('/question', payload).then((r) => r.data);
}

export function deleteBankQuestion(id: string): Promise<void> {
  return axiosInstance.delete(`/question/${id}`).then(() => undefined);
}

// ── Quiz topic update ──────────────────────────────────────────────────────────

interface UpdateQuizTopicInput {
  courseId: string;
  topicId: string;
  topicTitle: string;
  sectionId: string;
  quizData: QuizTopicData;
}

/**
 * Flatten a Question from the bank into the QuizQuestion shape the backend
 * stores inside topic.data.questions.
 */
export function bankQuestionToQuizQuestion(q: Question, topicId: string): QuizQuestion {
  const base: QuizQuestion = {
    id: q.id,
    topicQuizId: topicId,
    questionName: q.questionName,
    questionText: q.questionText,
    status: q.status,
    type: q.type,
    defaultMark: q.defaultMark,
    usage: q.usage ?? 0,
  };

  if (q.type === 'Choices Answer') {
    base.multiple = q.multiple ?? false;
    base.choices = (q.choices ?? []).map((c) => ({
      id: c.id,
      questionId: c.questionId,
      text: c.text,
      gradePercent: c.gradePercent,
      feedback: c.feedback,
    }));
  } else if (q.type === 'Short Answer') {
    base.choices = (q.choices ?? []).map((c) => ({
      id: c.id,
      questionId: c.questionId,
      text: c.text,
      gradePercent: c.gradePercent,
      feedback: c.feedback,
    }));
  } else if (q.type === 'True/False') {
    base.correctAnswer = q.correctAnswer ?? true;
    base.feedbackOfTrue = q.feedbackOfTrue ?? null;
    base.feedbackOfFalse = q.feedbackOfFalse ?? null;
  }

  return base;
}

/**
 * PUT /course/:courseId/topic/:topicId
 *
 * Routes through topicApi.update so the data field is properly
 * JSON.stringified (the service handles serialization internally).
 * Previously this called axiosInstance directly which caused a 500
 * due to the data field being double-stringified or not stringified at all.
 */
export function updateQuizTopicQuestions(input: UpdateQuizTopicInput): Promise<QuizTopic> {
  const updatePayload = {
    id: input.topicId,
    title: input.topicTitle,
    type: 'quiz',
    sectionId: input.sectionId,
    data: input.quizData as unknown,
  };

  return topicApi
    .update(input.courseId, input.topicId, updatePayload)
    .then((r) => ({
      id: r.data.id,
      title: r.data.title,
      type: 'quiz',
      sectionId: r.data.sectionId,
      // Need to parse the data field since topicApi.update returns it as raw object/string
      data: (typeof r.data.data === 'string' ? JSON.parse(r.data.data) : r.data.data) as QuizTopicData
    }));
}
