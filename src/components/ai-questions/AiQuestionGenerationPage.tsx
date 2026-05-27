"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  FileText,
  Loader2,
  Sparkles,
  Upload,
  WandSparkles,
} from "lucide-react";
import { toast } from "sonner";
import type { AxiosError } from "axios";
import type {
  AiBloomLevel,
  AiDocumentUploadResponse,
  AiGeneratedQuestion,
  AiGeneratedQuestionStatus,
  AiJobStatus,
} from "@/types/ai-questions";
import {
  approveAiGeneratedQuestions,
  createAiQuestionJob,
  getAiGeneratedQuestions,
  getAiQuestionJob,
  uploadAiDocument,
} from "@/services/aiQuestionService";

const BLOOM_LEVELS: AiBloomLevel[] = [
  "Remember",
  "Understand",
  "Apply",
  "Analyze",
  "Evaluate",
  "Create",
];

const FINAL_JOB_STATUSES: AiJobStatus[] = ["completed", "needs_review", "failed"];
const JOB_FAILED_FALLBACK = "Question generation failed. Please try again.";

type QuestionFilter = "all" | "passed" | "needs_review" | "saved";
type QuestionSort = "score" | "attempt" | "status";

interface Props {
  courseId: string;
}

function getApiErrorMessage(error: unknown): string {
  const err = error as AxiosError<{ message?: string; error?: string } | string>;
  const status = err.response?.status;
  const data = err.response?.data;

  if (status === 403) {
    return "You do not have permission to generate questions for this course.";
  }
  if (status === 429) {
    return "AI quota exceeded. Please try again later.";
  }
  if (status === 400) {
    if (typeof data === "string") return data;
    return data?.message || data?.error || "Invalid request. Please check your input.";
  }
  if (typeof data === "string") return data;
  return data?.message || data?.error || "Something went wrong. Please try again.";
}

function formatBytes(size: number): string {
  if (!Number.isFinite(size) || size <= 0) return "0 KB";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(size) / Math.log(1024)), units.length - 1);
  return `${(size / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

function isAllowedFile(file: File): boolean {
  return [".docx", ".pdf", ".txt"].some((ext) =>
    file.name.toLowerCase().endsWith(ext),
  );
}

function statusLabel(status: AiJobStatus | null): string {
  switch (status) {
    case "queued":
      return "Waiting in queue";
    case "running":
      return "Generating questions";
    case "completed":
      return "Completed";
    case "needs_review":
      return "Needs teacher review";
    case "failed":
      return "Failed";
    default:
      return "Not started";
  }
}

function statusBadgeClass(status: string): string {
  if (status === "passed" || status === "completed" || status === "saved_to_bank") {
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  }
  if (status === "needs_teacher_review" || status === "needs_review" || status === "queued") {
    return "bg-amber-50 text-amber-700 border-amber-200";
  }
  if (status === "failed") return "bg-red-50 text-red-700 border-red-200";
  return "bg-slate-50 text-slate-700 border-slate-200";
}

function getJobFailureMessage(errorMessage?: string | null, message?: string): string {
  return errorMessage?.trim() || message?.trim() || JOB_FAILED_FALLBACK;
}

function scoreBadgeClass(score: number): string {
  if (score >= 0.8) return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (score >= 0.6) return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-red-50 text-red-700 border-red-200";
}

function normalizeStatus(status: AiGeneratedQuestionStatus): QuestionFilter {
  if (status === "saved_to_bank") return "saved";
  if (status === "needs_teacher_review") return "needs_review";
  if (status === "passed") return "passed";
  return "all";
}

function AiDocumentUpload({
  selectedFile,
  uploadedDocument,
  uploadLoading,
  onFileChange,
  onUpload,
}: {
  selectedFile: File | null;
  uploadedDocument: AiDocumentUploadResponse | null;
  uploadLoading: boolean;
  onFileChange: (file: File | null) => void;
  onUpload: () => void;
}) {
  return (
    <section className="border border-[#E5E7EB] rounded-lg bg-white p-5 space-y-4">
      <div>
        <h2 className="text-[16px] font-bold text-[#1F2937]">Lecture document</h2>
        <p className="text-[13px] text-[#6B7280] mt-1">
          Upload .docx, .pdf, or .txt material for this course.
        </p>
      </div>

      <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-[#CBD5E1] bg-[#F8FAFC] px-4 py-8 text-center hover:border-[#3B82F6] hover:bg-blue-50/40 transition-colors">
        <Upload className="w-8 h-8 text-[#3B82F6] mb-3" />
        <span className="text-[14px] font-bold text-[#374151]">
          Choose lecture file
        </span>
        <span className="text-[12px] text-[#6B7280] mt-1">DOCX, PDF, TXT</span>
        <input
          type="file"
          accept=".docx,.pdf,.txt"
          className="sr-only"
          onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
          disabled={uploadLoading}
        />
      </label>

      {selectedFile && (
        <div className="flex items-start gap-3 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] p-3">
          <FileText className="w-5 h-5 text-[#64748B] mt-0.5 shrink-0" />
          <div className="min-w-0">
            <p className="text-[14px] font-bold text-[#374151] break-words">
              {selectedFile.name}
            </p>
            <p className="text-[12px] text-[#6B7280]">{formatBytes(selectedFile.size)}</p>
          </div>
        </div>
      )}

      <button
        onClick={onUpload}
        disabled={!selectedFile || uploadLoading}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#2563EB] px-4 py-2.5 text-[14px] font-bold text-white hover:bg-[#1D4ED8] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {uploadLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
        Upload
      </button>

      {uploadedDocument && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-[13px] text-emerald-800 space-y-1">
          <p className="font-bold break-words">{uploadedDocument.fileName}</p>
          <p>{uploadedDocument.chunkCount} chunk(s) processed</p>
          <p>Status: {uploadedDocument.status}</p>
        </div>
      )}
    </section>
  );
}

function AiGenerationSettings({
  bloomLevel,
  questionCount,
  topK,
  knowledgePoint,
  knowledgePointError,
  generateLoading,
  generateDisabled,
  onBloomLevelChange,
  onQuestionCountChange,
  onTopKChange,
  onKnowledgePointChange,
  onGenerate,
}: {
  bloomLevel: AiBloomLevel;
  questionCount: number;
  topK: number;
  knowledgePoint: string;
  knowledgePointError: string | null;
  generateLoading: boolean;
  generateDisabled: boolean;
  onBloomLevelChange: (value: AiBloomLevel) => void;
  onQuestionCountChange: (value: number) => void;
  onTopKChange: (value: number) => void;
  onKnowledgePointChange: (value: string) => void;
  onGenerate: () => void;
}) {
  return (
    <section className="border border-[#E5E7EB] rounded-lg bg-white p-5 space-y-4">
      <div>
        <h2 className="text-[16px] font-bold text-[#1F2937]">Generation settings</h2>
        <p className="text-[13px] text-[#6B7280] mt-1">
          Configure the AI draft before starting a job.
        </p>
      </div>

      <div className="space-y-4">
        <label className="block">
          <span className="text-[13px] font-bold text-[#374151]">Bloom level</span>
          <select
            value={bloomLevel}
            onChange={(event) => onBloomLevelChange(event.target.value as AiBloomLevel)}
            className="mt-1.5 w-full rounded-lg border border-[#D1D5DB] bg-white px-3 py-2 text-[14px] outline-none focus:border-[#2563EB]"
          >
            {BLOOM_LEVELS.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-[13px] font-bold text-[#374151]">Question type</span>
          <input
            value="MultipleChoice"
            disabled
            className="mt-1.5 w-full rounded-lg border border-[#D1D5DB] bg-[#F9FAFB] px-3 py-2 text-[14px] text-[#6B7280]"
          />
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-[13px] font-bold text-[#374151]">Question count</span>
            <input
              type="number"
              min={1}
              max={50}
              value={questionCount}
              onChange={(event) => onQuestionCountChange(Number(event.target.value))}
              className="mt-1.5 w-full rounded-lg border border-[#D1D5DB] px-3 py-2 text-[14px] outline-none focus:border-[#2563EB]"
            />
          </label>
          <label className="block">
            <span className="text-[13px] font-bold text-[#374151]">Top K</span>
            <input
              type="number"
              min={1}
              max={12}
              value={topK}
              onChange={(event) => onTopKChange(Number(event.target.value))}
              className="mt-1.5 w-full rounded-lg border border-[#D1D5DB] px-3 py-2 text-[14px] outline-none focus:border-[#2563EB]"
            />
          </label>
        </div>

        <label className="block">
          <span className="text-[13px] font-bold text-[#374151]">Top K range</span>
          <input
            type="range"
            min={1}
            max={12}
            value={topK}
            onChange={(event) => onTopKChange(Number(event.target.value))}
            className="mt-2 w-full accent-[#2563EB]"
          />
        </label>

        <label className="block">
          <span className="text-[13px] font-bold text-[#374151]">
            Knowledge point
          </span>
          <textarea
            value={knowledgePoint}
            maxLength={600}
            rows={3}
            onChange={(event) => onKnowledgePointChange(event.target.value)}
            placeholder="e.g. khái niệm overfitting, vòng lặp for, định luật Newton..."
            className={`mt-1.5 w-full resize-none rounded-lg border px-3 py-2 text-[14px] leading-5 outline-none focus:border-[#2563EB] ${
              knowledgePointError ? "border-red-300 bg-red-50" : "border-[#D1D5DB]"
            }`}
          />
          <div className="mt-1.5 flex items-start justify-between gap-3">
            <p className="text-[12px] leading-5 text-[#6B7280]">
              Optional. Leave blank to let AI choose relevant content from the
              document.
            </p>
            <span
              className={`shrink-0 text-[12px] ${
                knowledgePointError ? "text-red-600" : "text-[#94A3B8]"
              }`}
            >
              {knowledgePoint.length}/500
            </span>
          </div>
          {knowledgePointError && (
            <p className="mt-1 text-[12px] font-medium text-red-600">
              {knowledgePointError}
            </p>
          )}
          <p className="mt-1 text-[12px] leading-5 text-[#6B7280]">
            If provided, AI prioritizes that focus. If blank, AI uses the Bloom
            level to choose relevant content.
          </p>
        </label>
      </div>

      <button
        onClick={onGenerate}
        disabled={generateDisabled}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#7C3AED] px-4 py-2.5 text-[14px] font-bold text-white hover:bg-[#6D28D9] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {generateLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <WandSparkles className="w-4 h-4" />
        )}
        Generate Questions
      </button>
    </section>
  );
}

function AiJobStatusView({
  jobStatus,
  jobId,
  failedMessage,
  knowledgePoint,
}: {
  jobStatus: AiJobStatus | null;
  jobId: string | null;
  failedMessage: string | null;
  knowledgePoint: string | null;
}) {
  if (!jobId && !jobStatus) return null;

  return (
    <section className="border border-[#E5E7EB] rounded-lg bg-white p-5">
      <div className="flex items-center gap-3">
        {jobStatus === "failed" ? (
          <AlertTriangle className="w-5 h-5 text-red-600" />
        ) : FINAL_JOB_STATUSES.includes(jobStatus as AiJobStatus) ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
        ) : (
          <Loader2 className="w-5 h-5 animate-spin text-[#7C3AED]" />
        )}
        <div className="min-w-0">
          <p className="text-[14px] font-bold text-[#374151]">
            {statusLabel(jobStatus)}
          </p>
          {jobId && (
            <p className="text-[12px] text-[#6B7280] truncate">
              Job {jobId.slice(0, 8)}
            </p>
          )}
        </div>
      </div>
      {knowledgePoint && (
        <p className="mt-3 max-w-full whitespace-normal break-words rounded-lg bg-[#F8FAFC] p-3 text-[13px] leading-5 text-[#475569]">
          <span className="font-bold text-[#334155]">Focused on:</span>{" "}
          {knowledgePoint}
        </p>
      )}
      {jobStatus === "failed" && (
        <p className="mt-3 max-w-full whitespace-normal break-words rounded-lg bg-red-50 p-3 text-[13px] leading-5 text-red-700">
          {failedMessage || JOB_FAILED_FALLBACK}
        </p>
      )}
    </section>
  );
}

function AiQuestionApproveToolbar({
  selectedCount,
  approveLoading,
  disabled,
  onApprove,
}: {
  selectedCount: number;
  approveLoading: boolean;
  disabled: boolean;
  onApprove: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-[#E5E7EB] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-[13px] font-bold text-[#374151]">
        {selectedCount} selected
      </span>
      <button
        onClick={onApprove}
        disabled={disabled}
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-[14px] font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {approveLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
        Approve selected
      </button>
    </div>
  );
}

function AiGeneratedQuestionItem({
  question,
  selected,
  onToggle,
}: {
  question: AiGeneratedQuestion;
  selected: boolean;
  onToggle: (id: string) => void;
}) {
  return (
    <article className="border-b border-[#F1F5F9] px-5 py-5 last:border-b-0">
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggle(question.id)}
          disabled={question.status === "saved_to_bank"}
          className="mt-1 h-4 w-4 rounded border-[#CBD5E1] accent-[#2563EB]"
          aria-label={`Select ${question.questionName || question.questionText}`}
        />
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h3 className="text-[15px] font-bold text-[#1F2937] break-words">
                {question.questionName || "Generated question"}
              </h3>
              <p className="text-[12px] text-[#6B7280]">
                Attempt {question.attempt} · Grounded in {question.groundingRefs?.length ?? 0} chunk(s)
              </p>
            </div>
            <div className="flex flex-wrap gap-2 sm:justify-end">
              <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[12px] font-bold text-blue-700">
                {question.bloomLevel}
              </span>
              <span className={`rounded-full border px-2.5 py-1 text-[12px] font-bold ${scoreBadgeClass(question.score)}`}>
                {Math.round(question.score * 100)}%
              </span>
              <span className={`rounded-full border px-2.5 py-1 text-[12px] font-bold ${statusBadgeClass(question.status)}`}>
                {question.status.replaceAll("_", " ")}
              </span>
            </div>
          </div>

          <p className="text-[14px] leading-6 text-[#374151] break-words">
            {question.questionText}
          </p>

          <div className="space-y-2">
            {question.choices?.map((choice, index) => {
              const isCorrect = choice.gradePercent === 100;
              return (
                <div
                  key={`${question.id}-${index}`}
                  className={`rounded-lg border p-3 ${
                    isCorrect
                      ? "border-emerald-200 bg-emerald-50"
                      : "border-[#E5E7EB] bg-[#F9FAFB]"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span
                      className={`mt-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full text-[11px] font-bold ${
                        isCorrect
                          ? "bg-emerald-600 text-white"
                          : "bg-white text-[#64748B] border border-[#CBD5E1]"
                      }`}
                    >
                      {String.fromCharCode(65 + index)}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[14px] text-[#1F2937] break-words">
                        {choice.text}
                      </p>
                      {choice.feedback && (
                        <p className="mt-1 text-[12px] leading-5 text-[#64748B] break-words">
                          {choice.feedback}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {question.feedback && (
            <div className="rounded-lg border border-[#E0E7FF] bg-[#EEF2FF] p-3">
              <p className="text-[12px] font-bold text-[#4338CA]">AI feedback</p>
              <p className="mt-1 text-[13px] leading-5 text-[#374151] break-words">
                {question.feedback}
              </p>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

function AiGeneratedQuestionList({
  questions,
  isLoading,
  jobStatus,
  selectedQuestionIds,
  approveLoading,
  filter,
  sort,
  onFilterChange,
  onSortChange,
  onToggleQuestion,
  onApprove,
  failedMessage,
  knowledgePoint,
}: {
  questions: AiGeneratedQuestion[];
  isLoading: boolean;
  jobStatus: AiJobStatus | null;
  selectedQuestionIds: Set<string>;
  approveLoading: boolean;
  filter: QuestionFilter;
  sort: QuestionSort;
  onFilterChange: (filter: QuestionFilter) => void;
  onSortChange: (sort: QuestionSort) => void;
  onToggleQuestion: (id: string) => void;
  onApprove: () => void;
  failedMessage: string | null;
  knowledgePoint: string | null;
}) {
  const visibleQuestions = useMemo(() => {
    const filtered = questions.filter((question) => {
      if (filter === "all") return true;
      return normalizeStatus(question.status) === filter;
    });

    return filtered.sort((a, b) => {
      if (sort === "attempt") return a.attempt - b.attempt;
      if (sort === "status") return a.status.localeCompare(b.status);
      return b.score - a.score;
    });
  }, [filter, questions, sort]);

  const selectedCount = selectedQuestionIds.size;
  const isGenerating = jobStatus === "queued" || jobStatus === "running";

  return (
    <section className="min-h-[520px] rounded-lg border border-[#E5E7EB] bg-white overflow-hidden">
      <div className="border-b border-[#E5E7EB] px-5 py-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-[18px] font-bold text-[#1F2937]">Generated questions</h2>
            <p className="text-[13px] text-[#6B7280] mt-1">
              Review drafts and save selected items to the question bank.
            </p>
            {knowledgePoint && (
              <div className="mt-2 inline-flex max-w-full items-start rounded-full border border-[#BFDBFE] bg-[#EFF6FF] px-3 py-1 text-[12px] font-bold text-[#1D4ED8]">
                <span className="min-w-0 break-words">
                  Knowledge point: {knowledgePoint}
                </span>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex flex-wrap gap-1 rounded-lg bg-[#F1F5F9] p-1">
              {[
                { value: "all", label: "All" },
                { value: "passed", label: "Passed" },
                { value: "needs_review", label: "Needs review" },
                { value: "saved", label: "Saved" },
              ].map((item) => (
                <button
                  key={item.value}
                  onClick={() => onFilterChange(item.value as QuestionFilter)}
                  className={`rounded-md px-3 py-1.5 text-[12px] font-bold ${
                    filter === item.value
                      ? "bg-white text-[#2563EB] shadow-sm"
                      : "text-[#64748B] hover:text-[#1F2937]"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <select
              value={sort}
              onChange={(event) => onSortChange(event.target.value as QuestionSort)}
              className="rounded-lg border border-[#D1D5DB] bg-white px-3 py-2 text-[13px] outline-none focus:border-[#2563EB]"
            >
              <option value="score">Score high to low</option>
              <option value="attempt">Attempt</option>
              <option value="status">Status</option>
            </select>
          </div>
        </div>
      </div>

      {questions.length > 0 && (
        <AiQuestionApproveToolbar
          selectedCount={selectedCount}
          approveLoading={approveLoading}
          disabled={selectedCount === 0 || approveLoading}
          onApprove={onApprove}
        />
      )}

      {jobStatus === "failed" ? (
        <div className="flex min-h-[360px] items-center justify-center px-5 py-8">
          <div className="w-full max-w-3xl rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
              <div className="min-w-0">
                <p className="text-[15px] font-bold text-red-800">Failed</p>
                <p className="mt-1 max-w-full whitespace-normal break-words text-[13px] leading-5 text-red-700">
                  {failedMessage || JOB_FAILED_FALLBACK}
                </p>
                {knowledgePoint && (
                  <p className="mt-3 max-w-full whitespace-normal break-words rounded-md bg-white/60 p-2 text-[12px] leading-5 text-red-700">
                    <span className="font-bold">Knowledge point:</span>{" "}
                    {knowledgePoint}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : isLoading || isGenerating ? (
        <div className="p-5 space-y-4">
          {[0, 1, 2].map((item) => (
            <div key={item} className="animate-pulse rounded-lg border border-[#E5E7EB] p-4">
              <div className="h-4 w-1/3 rounded bg-[#E5E7EB]" />
              <div className="mt-4 h-3 w-full rounded bg-[#E5E7EB]" />
              <div className="mt-2 h-3 w-3/4 rounded bg-[#E5E7EB]" />
              <div className="mt-4 grid gap-2">
                <div className="h-10 rounded bg-[#F1F5F9]" />
                <div className="h-10 rounded bg-[#F1F5F9]" />
              </div>
            </div>
          ))}
        </div>
      ) : questions.length === 0 ? (
        <div className="flex min-h-[360px] flex-col items-center justify-center px-6 text-center">
          <Sparkles className="w-10 h-10 text-[#CBD5E1] mb-3" />
          <p className="text-[15px] font-bold text-[#374151]">
            No valid questions were generated.
          </p>
          <p className="mt-1 max-w-sm text-[13px] text-[#6B7280]">
            Try a smaller question count or a different Bloom level.
          </p>
        </div>
      ) : visibleQuestions.length === 0 ? (
        <div className="flex min-h-[300px] items-center justify-center px-6 text-center text-[14px] text-[#6B7280]">
          No questions match this filter.
        </div>
      ) : (
        <div>
          {visibleQuestions.map((question) => (
            <AiGeneratedQuestionItem
              key={question.id}
              question={question}
              selected={selectedQuestionIds.has(question.id)}
              onToggle={onToggleQuestion}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export function AiQuestionGenerationPage({ courseId }: Props) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedDocument, setUploadedDocument] =
    useState<AiDocumentUploadResponse | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [generateLoading, setGenerateLoading] = useState(false);
  const [approveLoading, setApproveLoading] = useState(false);
  const [bloomLevel, setBloomLevel] = useState<AiBloomLevel>("Understand");
  const [questionCount, setQuestionCount] = useState(5);
  const [topK, setTopK] = useState(5);
  const [knowledgePoint, setKnowledgePoint] = useState("");
  const [jobKnowledgePoint, setJobKnowledgePoint] = useState<string | null>(null);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<AiJobStatus | null>(null);
  const [failedMessage, setFailedMessage] = useState<string | null>(null);
  const [questions, setQuestions] = useState<AiGeneratedQuestion[]>([]);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<QuestionFilter>("all");
  const [sort, setSort] = useState<QuestionSort>("score");
  const pollingRef = useRef<number | null>(null);
  const failedToastJobRef = useRef<string | null>(null);

  const clearPolling = useCallback(() => {
    if (pollingRef.current) {
      window.clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const resetJobState = useCallback(() => {
    clearPolling();
    setCurrentJobId(null);
    setJobStatus(null);
    setFailedMessage(null);
    setJobKnowledgePoint(null);
    setQuestions([]);
    setSelectedQuestionIds(new Set());
    failedToastJobRef.current = null;
  }, [clearPolling]);

  useEffect(() => clearPolling, [clearPolling]);

  const handleFileChange = (file: File | null) => {
    if (file && !isAllowedFile(file)) {
      toast.error("Only .docx, .pdf, and .txt files are supported.");
      return;
    }
    setSelectedFile(file);
    setUploadedDocument(null);
    setKnowledgePoint("");
    resetJobState();
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Please choose a file before uploading.");
      return;
    }
    if (!isAllowedFile(selectedFile)) {
      toast.error("Only .docx, .pdf, and .txt files are supported.");
      return;
    }

    setUploadLoading(true);
    try {
      const document = await uploadAiDocument(courseId, selectedFile);
      setUploadedDocument(document);
      resetJobState();
      toast.success("Document uploaded successfully.");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setUploadLoading(false);
    }
  };

  const loadQuestions = useCallback(
    async (jobId: string, fallbackQuestions?: AiGeneratedQuestion[]) => {
      if (fallbackQuestions?.length) {
        setQuestions(fallbackQuestions);
        return;
      }
      const data = await getAiGeneratedQuestions(jobId);
      setQuestions(data);
    },
    [],
  );

  const pollJob = useCallback(
    async (jobId: string) => {
      try {
        const job = await getAiQuestionJob(jobId);
        setJobStatus(job.status);
        if ("knowledgePoint" in job) {
          setJobKnowledgePoint(job.knowledgePoint ?? null);
        }
        if (job.status === "failed") {
          const failureMessage = getJobFailureMessage(job.errorMessage, job.message);
          setFailedMessage(failureMessage);
          if (failedToastJobRef.current !== jobId) {
            failedToastJobRef.current = jobId;
            toast.error("Question generation failed", {
              description: failureMessage,
            });
          }
        }
        if (job.status === "completed" || job.status === "needs_review") {
          clearPolling();
          await loadQuestions(jobId, job.questions);
        } else if (job.status === "failed") {
          clearPolling();
        }
      } catch (error) {
        clearPolling();
      setJobStatus("failed");
      const failureMessage = getApiErrorMessage(error);
      setFailedMessage(failureMessage);
      toast.error("Question generation failed", {
        description: failureMessage,
      });
      }
    },
    [clearPolling, loadQuestions],
  );

  const startPolling = useCallback(
    (jobId: string) => {
      clearPolling();
      void pollJob(jobId);
      pollingRef.current = window.setInterval(() => {
        void pollJob(jobId);
      }, 2500);
    },
    [clearPolling, pollJob],
  );

  const questionCountValid = questionCount >= 1 && questionCount <= 50;
  const topKValid = topK >= 1 && topK <= 12;
  const knowledgePointValid = knowledgePoint.length <= 500;
  const knowledgePointError = knowledgePointValid
    ? null
    : "Knowledge point must be 500 characters or less.";
  const jobRunning = jobStatus === "queued" || jobStatus === "running";
  const generateDisabled =
    !uploadedDocument ||
    uploadLoading ||
    generateLoading ||
    jobRunning ||
    !questionCountValid ||
    !topKValid ||
    !knowledgePointValid;

  const handleGenerate = async () => {
    if (!uploadedDocument?.documentId) {
      toast.error("Upload a document before generating questions.");
      return;
    }
    if (!questionCountValid) {
      toast.error("Question count must be between 1 and 50.");
      return;
    }
    if (!topKValid) {
      toast.error("Top K must be between 1 and 12.");
      return;
    }
    if (!knowledgePointValid) {
      toast.error("Knowledge point must be 500 characters or less.");
      return;
    }

    clearPolling();
    setGenerateLoading(true);
    setQuestions([]);
    setSelectedQuestionIds(new Set());
    setFailedMessage(null);
    setJobKnowledgePoint(null);
    failedToastJobRef.current = null;
    try {
      const trimmedKnowledgePoint = knowledgePoint.trim();
      const payloadKnowledgePoint =
        trimmedKnowledgePoint.length > 0 ? trimmedKnowledgePoint : null;
      const job = await createAiQuestionJob({
        documentId: uploadedDocument.documentId,
        courseId,
        bloomLevel,
        questionType: "MultipleChoice",
        questionCount,
        topK,
        knowledgePoint: payloadKnowledgePoint,
      });
      setCurrentJobId(job.jobId);
      setJobStatus(job.status);
      setJobKnowledgePoint(
        "knowledgePoint" in job ? job.knowledgePoint ?? null : payloadKnowledgePoint,
      );
      setQuestions(job.questions ?? []);
      if (job.status === "failed") {
        const failureMessage = getJobFailureMessage(job.errorMessage, job.message);
        setFailedMessage(failureMessage);
        failedToastJobRef.current = job.jobId;
        toast.error("Question generation failed", {
          description: failureMessage,
        });
      }
      if (job.status === "completed" || job.status === "needs_review") {
        await loadQuestions(job.jobId, job.questions);
      } else if (job.status !== "failed") {
        startPolling(job.jobId);
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setGenerateLoading(false);
    }
  };

  const handleToggleQuestion = (id: string) => {
    setSelectedQuestionIds((previous) => {
      const next = new Set(previous);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleApprove = async () => {
    const ids = Array.from(selectedQuestionIds);
    if (ids.length === 0) return;

    setApproveLoading(true);
    try {
      const result = await approveAiGeneratedQuestions(ids);
      setQuestions((previous) =>
        previous.map((question) =>
          selectedQuestionIds.has(question.id)
            ? { ...question, status: "saved_to_bank" }
            : question,
        ),
      );
      setSelectedQuestionIds(new Set());
      toast.success(`Saved ${result.savedCount} question(s) to question bank.`);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setApproveLoading(false);
    }
  };

  const resultIntro = !uploadedDocument
    ? "Upload a lecture document to start."
    : !currentJobId
      ? "Configure Bloom level and generate draft questions."
      : null;

  return (
    <div className="min-h-full bg-[#F8FAFC] px-4 py-6 md:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-1">
          <h1 className="text-[26px] font-bold text-[#111827]">
            AI Generate Questions
          </h1>
          <p className="text-[14px] text-[#6B7280]">
            Upload lecture material and generate draft questions for review.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="space-y-5">
            <AiDocumentUpload
              selectedFile={selectedFile}
              uploadedDocument={uploadedDocument}
              uploadLoading={uploadLoading}
              onFileChange={handleFileChange}
              onUpload={handleUpload}
            />
            <AiGenerationSettings
              bloomLevel={bloomLevel}
              questionCount={questionCount}
              topK={topK}
              knowledgePoint={knowledgePoint}
              knowledgePointError={knowledgePointError}
              generateLoading={generateLoading}
              generateDisabled={generateDisabled}
              onBloomLevelChange={setBloomLevel}
              onQuestionCountChange={setQuestionCount}
              onTopKChange={setTopK}
              onKnowledgePointChange={setKnowledgePoint}
              onGenerate={handleGenerate}
            />
            <AiJobStatusView
              jobStatus={jobStatus}
              jobId={currentJobId}
              failedMessage={failedMessage}
              knowledgePoint={jobKnowledgePoint}
            />
          </aside>

          <main>
            {resultIntro ? (
              <section className="flex min-h-[520px] flex-col items-center justify-center rounded-lg border border-dashed border-[#CBD5E1] bg-white px-6 text-center">
                <Sparkles className="w-10 h-10 text-[#CBD5E1] mb-3" />
                <p className="text-[15px] font-bold text-[#374151]">{resultIntro}</p>
              </section>
            ) : (
              <AiGeneratedQuestionList
                questions={questions}
                isLoading={generateLoading}
                jobStatus={jobStatus}
                selectedQuestionIds={selectedQuestionIds}
                approveLoading={approveLoading}
                filter={filter}
                sort={sort}
                onFilterChange={setFilter}
                onSortChange={setSort}
                onToggleQuestion={handleToggleQuestion}
                onApprove={handleApprove}
                failedMessage={failedMessage}
                knowledgePoint={jobKnowledgePoint}
              />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default AiQuestionGenerationPage;
