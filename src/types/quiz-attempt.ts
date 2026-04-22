// ── Question types ─────────────────────────────────────────────────────────────

export type QuestionStatus = 'Ready' | 'Draft';
export type QuestionType = 'Choices Answer' | 'True/False' | 'Short Answer';

export interface ChoiceOption {
  id: string;
  questionId: string | null;
  text: string;
  gradePercent: number;
  feedback: string;
}

/** Normalised client-side question — data is always structured */
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
  data:
    | { kind: 'choices'; multiple: boolean; choices: ChoiceOption[] }
    | { kind: 'truefalse'; correctAnswer: boolean; feedbackOfTrue: string; feedbackOfFalse: string }
    | { kind: 'shortanswer'; choices: ChoiceOption[] };
}

// ── Quiz topic ─────────────────────────────────────────────────────────────────

export type TimeLimitUnit = 'Seconds' | 'Minutes' | 'Hours' | 'Days' | 'Weeks';
export type GradingMethod = 'Highest Grade' | 'Average Grade' | 'First Attempt' | 'Last Attempt' | string;

export interface QuizTopicData {
  description: string;
  open: string | null;
  close: string | null;
  timeLimit: number | null;
  timeLimitUnit: TimeLimitUnit | string;
  gradeToPass: number;
  gradingMethod: GradingMethod;
  attemptAllowed: 'Unlimited' | string;
  questions: Question[];
}

export interface QuizTopic {
  id: string;
  title: string;
  type: 'quiz';
  sectionId: string;
  data: QuizTopicData;
}

// ── Quiz response / student submission ─────────────────────────────────────────

export type ResponseStatus = 'Finished' | 'Not finished' | 'Not started' | 'In Progress';

export interface SubmittedAnswer {
  topicQuizQuestionId: string;
  answer: string;
  mark: number;
}

export interface QuizResponseData {
  status: ResponseStatus;
  startedAt: string;
  completedAt: string;
  answers: SubmittedAnswer[];
}

export interface StudentResponse {
  id: string;
  studentId: string;
  topicId: string;
  data: QuizResponseData;
}

// ── Attempt session state ──────────────────────────────────────────────────────

/**
 * answerRecord stores raw local answers:
 *   - single-choice / true-false / short-answer → string (choiceId | "1"|"0" | text)
 *   - multiple-choice → string[] of choiceIds
 */
export type AnswerRecord = Record<string, string | string[]>;

export interface AttemptSessionState {
  questions: Question[];
  currentQuestionId: string;
  answerRecord: AnswerRecord;
  flaggedIds: Set<string>;
  isReviewMode: boolean;
  studentResponse: StudentResponse | null;
  startedAt: string;
  /** seconds remaining (countdown) or seconds elapsed (countup); null when not started */
  timer: number | null;
  isSubmitting: boolean;
}

// ── Review mode computed per-question ─────────────────────────────────────────

export type AnswerCorrectness = 'correct' | 'incorrect' | 'partial' | 'unanswered';

export interface QuizResult {
  score: number;
  totalScore: number;
  durationSeconds: number;
  level: 'good' | 'average' | 'bad';
}

export interface SubmitPayload {
  topicId: string;
  data: {
    status: 'Finished';
    startedAt: string;
    completedAt: string;
    answers: Array<{ topicQuizQuestionId: string; answer: string; mark: number }>;
  };
}
