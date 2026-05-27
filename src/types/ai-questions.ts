export type AiBloomLevel =
  | "Remember"
  | "Understand"
  | "Apply"
  | "Analyze"
  | "Evaluate"
  | "Create";

export type AiQuestionType = "MultipleChoice";

export type AiJobStatus =
  | "queued"
  | "running"
  | "completed"
  | "needs_review"
  | "failed";

export type AiGeneratedQuestionStatus =
  | "draft"
  | "passed"
  | "needs_teacher_review"
  | "saved_to_bank";

export interface AiDocumentUploadResponse {
  documentId: string;
  courseId: string;
  fileName: string;
  chunkCount: number;
  status: string;
}

export interface AiQuestionGenerationPayload {
  documentId: string;
  courseId: string;
  bloomLevel: AiBloomLevel;
  questionType: AiQuestionType;
  questionCount: number;
  topK: number;
  knowledgePoint?: string | null;
}

export interface AiGeneratedChoice {
  text: string;
  gradePercent: number;
  feedback?: string;
}

export interface AiGeneratedQuestion {
  id: string;
  jobId: string;
  courseId: string;
  questionName: string;
  questionText: string;
  type: AiQuestionType;
  bloomLevel: AiBloomLevel;
  status: AiGeneratedQuestionStatus;
  score: number;
  attempt: number;
  groundingRefs: string[];
  choices: AiGeneratedChoice[];
  feedback?: string;
}

export interface AiQuestionJobResponse {
  jobId: string;
  status: AiJobStatus;
  questions: AiGeneratedQuestion[];
  errorMessage?: string | null;
  knowledgePoint?: string | null;
  message?: string;
}

export interface AiQuestionApproveResponse {
  savedCount: number;
}
