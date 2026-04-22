// ── Question Bank Types ────────────────────────────────────────────────────────

export type QuestionStatus = 'Ready' | 'Draft';
export type QuestionType = 'Choices Answer' | 'True/False' | 'Short Answer';

export interface QuestionChoice {
  id: string | null;
  questionId: string | null;
  text: string;
  gradePercent: number;
  feedback: string;
}

/** Shape returned by GET /question and POST /question */
export interface Question {
  id: string;
  topicQuizId?: string | null;
  questionName: string;
  questionText: string;
  status: QuestionStatus;
  type: QuestionType;
  defaultMark: number;
  usage: number;
  createdAt?: string;
  modifiedAt?: string;
  updatedAt?: string;
  createdBy?: unknown;
  modifiedBy?: unknown;
  // Flattened answer data returned by BE at top level
  multiple?: boolean;
  choices?: QuestionChoice[];
  correctAnswer?: boolean;
  feedbackOfTrue?: string;
  feedbackOfFalse?: string;
}

// ── Payload sent to POST /question ────────────────────────────────────────────

export interface CreateQuestionPayload {
  id: null;
  topicQuizId: null;
  questionName: string;
  questionText: string;
  status: QuestionStatus;
  type: QuestionType;
  defaultMark: number;
  usage: 0;
  feedbackOfTrue: string | null;
  feedbackOfFalse: string | null;
  correctAnswer: boolean;
  multiple: boolean;
  choices: Array<{
    id: null;
    text: string;
    gradePercent: number;
    feedback: string;
    questionId: null;
  }>;
  course: { id: string };
  createdAt: string;
  createdBy: null;
  modifiedBy: null;
  updatedAt: null;
  deletedAt: null;
}

// ── Quiz Topic Types ───────────────────────────────────────────────────────────

/** Flattened question shape stored inside quiz topic data.questions */
export interface QuizQuestion {
  id: string;
  topicQuizId: string | null;
  questionName: string;
  questionText: string;
  status: QuestionStatus;
  type: QuestionType;
  defaultMark: number;
  usage: number;
  multiple?: boolean;
  choices?: QuestionChoice[];
  correctAnswer?: boolean;
  feedbackOfTrue?: string | null;
  feedbackOfFalse?: string | null;
}

export interface QuizTopicData {
  description: string;
  open: string | null;
  close: string | null;
  timeLimit: number | null;
  timeLimitUnit: string;
  gradeToPass: number;
  gradingMethod: string;
  attemptAllowed: string;
  questions: QuizQuestion[];
}

export interface QuizTopic {
  id: string;
  title: string;
  type: 'quiz';
  sectionId: string;
  data: QuizTopicData;
}
