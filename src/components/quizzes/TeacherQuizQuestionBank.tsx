"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  BookOpen,
  Search,
  Plus,
  Loader2,
  X,
  ListChecks,
  Type,
  LayoutGrid,
  Trash2,
  FileText,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  PlusCircle,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import type {
  Question,
  QuestionType,
  QuizTopic,
  QuizQuestion,
} from "@/types/quiz";
import {
  fetchBankQuestions,
  createBankQuestion,
  deleteBankQuestion,
  bankQuestionToQuizQuestion,
  updateQuizTopicQuestions,
} from "@/services/questionBankService";

// ── Props ──────────────────────────────────────────────────────────────────────

interface Props {
  courseId: string;
  quiz: QuizTopic;
  onQuizUpdated: (updated: QuizTopic) => void;
}

// ── Constants ──────────────────────────────────────────────────────────────────

const GRADE_OPTIONS = [
  { label: "None", value: 0 },
  { label: "10%", value: 10 },
  { label: "25%", value: 25 },
  { label: "33.333%", value: 33.333 },
  { label: "50%", value: 50 },
  { label: "66.667%", value: 66.667 },
  { label: "75%", value: 75 },
  { label: "100%", value: 100 },
];

const QUESTION_TYPE_META = [
  {
    value: "True/False" as QuestionType,
    label: "True/False",
    formTitle: "Adding a True/False question",
    icon: <LayoutGrid className="w-5 h-5 text-[#8B5CF6]" />,
    rowIcon: (sz = 4) => (
      <LayoutGrid className={`w-${sz} h-${sz} text-[#8B5CF6]`} />
    ),
    description: "A simple form with just the two choices 'True' and 'False'.",
  },
  {
    value: "Short Answer" as QuestionType,
    label: "Short Answer",
    formTitle: "Adding a Short Answer question",
    icon: <Type className="w-5 h-5 text-[#F59E0B]" />,
    rowIcon: (sz = 4) => <Type className={`w-${sz} h-${sz} text-[#F59E0B]`} />,
    description: "Students type a short text response.",
  },
  {
    value: "Choices Answer" as QuestionType,
    label: "Choice Answer",
    formTitle: "Adding a Multiple or Single choice question",
    icon: <ListChecks className="w-5 h-5 text-[#06B6D4]" />,
    rowIcon: (sz = 4) => (
      <ListChecks className={`w-${sz} h-${sz} text-[#06B6D4]`} />
    ),
    description: "Single or multiple responses from a pre-defined list.",
  },
];

function getTypeIcon(type?: string) {
  const meta = QUESTION_TYPE_META.find((m) => m.value === type);
  if (meta) return meta.rowIcon(4);
  return <FileText className="w-4 h-4 text-[#6B7280]" />;
}

// ── Local form shape ───────────────────────────────────────────────────────────

interface ChoiceState {
  text: string;
  gradePercent: number;
  feedback: string;
}

interface FormState {
  questionName: string;
  questionText: string;
  status: "Ready" | "Draft";
  defaultMark: number;
  type: QuestionType;
  multiple: boolean;
  correctAnswer: boolean;
  feedbackOfTrue: string;
  feedbackOfFalse: string;
  choices: ChoiceState[];
}

const emptyChoice = (): ChoiceState => ({
  text: "",
  gradePercent: 100,
  feedback: "",
});

const emptyForm = (type: QuestionType): FormState => ({
  questionName: "",
  questionText: "",
  status: "Ready",
  defaultMark: 1,
  type,
  multiple: false,
  correctAnswer: true,
  feedbackOfTrue: "",
  feedbackOfFalse: "",
  choices:
    type === "Choices Answer"
      ? [emptyChoice(), emptyChoice()]
      : type === "Short Answer"
        ? [emptyChoice()]
        : [],
});

// ── Sub-components ─────────────────────────────────────────────────────────────

function FieldRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col md:flex-row gap-3 md:gap-6">
      <label className="md:w-48 shrink-0 text-[14px] font-medium text-[#374151] pt-2">
        {label}
      </label>
      <div className="flex-1">{children}</div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function TeacherQuizQuestionBank({
  courseId,
  quiz,
  onQuizUpdated,
}: Props) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Type picker modal state
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [selectedType, setSelectedType] = useState<QuestionType>("True/False");

  // Create form state
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm("True/False"));
  const [isCreating, setIsCreating] = useState(false);
  const [generalOpen, setGeneralOpen] = useState(true);
  const [answerOpen, setAnswerOpen] = useState(true);

  // Add-to-quiz loading: store which question id is being added
  const [addingId, setAddingId] = useState<string | null>(null);

  // ── Derive: which question IDs are already in the quiz ──────────────────────

  const getQuestionFingerprint = (q: any) => {
    const text = (q.questionText || '').trim();
    const name = (q.questionName || '').trim();
    const type = q.type;
    const choicesStr = (q.choices || [])
      .map((c: any) => (c.text || '').trim())
      .sort()
      .join('|');
    return `${text}::${name}::${type}::${choicesStr}`;
  };

  const existingFingerprints = new Set(
    (quiz.data?.questions ?? []).map(getQuestionFingerprint),
  );

  // ── Fetch bank ──────────────────────────────────────────────────────────────

  const loadBank = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchBankQuestions(courseId);
      setQuestions(data);
    } catch {
      toast.error("Failed to load question bank");
    } finally {
      setIsLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    if (courseId) loadBank();
  }, [courseId, loadBank]);

  // ── Type picker logic ────────────────────────────────────────────────────────

  const openTypePicker = () => {
    setSelectedType("True/False");
    setShowTypePicker(true);
  };

  const handlePickType = () => {
    setForm(emptyForm(selectedType));
    setGeneralOpen(true);
    setAnswerOpen(true);
    setShowTypePicker(false);
    setShowForm(true);
  };

  // ── Create question ──────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!form.questionText.trim() && !form.questionName.trim()) {
      toast.error("Question name or text is required");
      return;
    }

    setIsCreating(true);
    try {
      const created = await createBankQuestion({
        courseId,
        type: form.type,
        questionName:
          form.questionName || `Q - ${form.questionText.slice(0, 40)}`,
        questionText: form.questionText,
        status: form.status,
        defaultMark: form.defaultMark,
        multiple: form.multiple,
        correctAnswer: form.correctAnswer,
        feedbackOfTrue: form.feedbackOfTrue,
        feedbackOfFalse: form.feedbackOfFalse,
        choices: form.choices,
      });

      // Prepend the new question to the local list
      setQuestions((prev) => [created, ...prev]);
      setShowForm(false);
      toast.success("Question created and saved to bank!");
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response
              ?.data?.message
          : undefined;
      toast.error(msg ?? "Failed to create question");
    } finally {
      setIsCreating(false);
    }
  };

  // ── Delete question ──────────────────────────────────────────────────────────

  const handleDelete = async (id: string) => {
    try {
      await deleteBankQuestion(id);
      setQuestions((prev) => prev.filter((q) => q.id !== id));
      toast.success("Question deleted");
    } catch {
      toast.error("Failed to delete question");
    }
  };

  // ── Add to Quiz ──────────────────────────────────────────────────────────────

  const handleAddToQuiz = async (bankQuestion: Question) => {
    const fingerprint = getQuestionFingerprint(bankQuestion);
    if (existingFingerprints.has(fingerprint)) {
      toast.warning("This question is already in the quiz.");
      return;
    }

    setAddingId(bankQuestion.id);
    try {
      const quizQuestion = bankQuestionToQuizQuestion(bankQuestion, quiz.id);
      const updatedQuestions = [...(quiz.data?.questions ?? []), quizQuestion];
      const updatedData = { ...quiz.data, questions: updatedQuestions };

      await updateQuizTopicQuestions({
        courseId,
        topicId: quiz.id,
        topicTitle: quiz.title,
        sectionId: quiz.sectionId,
        quizData: updatedData,
      });

      // Notify parent to refresh quiz state
      const updatedQuiz: QuizTopic = {
        ...quiz,
        data: updatedData,
      };
      onQuizUpdated(updatedQuiz);
      toast.success(`"${bankQuestion.questionName}" added to quiz ✓`);
    } catch {
      toast.error("Failed to add question to quiz");
    } finally {
      setAddingId(null);
    }
  };

  // ── Choice helpers ───────────────────────────────────────────────────────────

  const addChoice = () =>
    setForm((p) => ({ ...p, choices: [...p.choices, emptyChoice()] }));

  const removeChoice = (i: number) =>
    setForm((p) => ({ ...p, choices: p.choices.filter((_, ci) => ci !== i) }));

  const updateChoice = (
    i: number,
    field: keyof ChoiceState,
    val: string | number,
  ) =>
    setForm((p) => ({
      ...p,
      choices: p.choices.map((c, ci) =>
        ci === i ? { ...c, [field]: val } : c,
      ),
    }));

  // ── Derived ──────────────────────────────────────────────────────────────────

  const formTitle =
    QUESTION_TYPE_META.find((t) => t.value === form.type)?.formTitle ?? "";

  const filtered = questions.filter(
    (q) =>
      q.questionText?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.questionName?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // ════════════════════════════════════════════════════════════════════════════
  // FORM VIEW
  // ════════════════════════════════════════════════════════════════════════════

  if (showForm) {
    return (
      <div className="bg-white min-h-[600px] rounded-[24px] shadow-sm border border-[#E5E7EB] p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setShowForm(false);
                setShowTypePicker(true);
              }}
              className="flex items-center gap-1.5 text-[#6B7280] hover:text-[#374151] font-medium text-[14px] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <span className="text-[#D1D5DB]">/</span>
            <h2 className="text-[20px] font-bold text-[#F97316]">
              {formTitle}
            </h2>
          </div>
          <button
            onClick={() => {
              setGeneralOpen(!generalOpen);
              setAnswerOpen(!answerOpen);
            }}
            className="text-[#3B82F6] text-[13px] font-medium hover:underline"
          >
            {generalOpen && answerOpen ? "Collapse all" : "Expand all"}
          </button>
        </div>

        {/* General Section */}
        <div className="border border-[#E5E7EB] rounded-xl overflow-hidden mb-6">
          <button
            onClick={() => setGeneralOpen(!generalOpen)}
            className="w-full flex items-center gap-3 px-6 py-4 bg-[#F9FAFB] hover:bg-gray-100 transition-colors text-left"
          >
            {generalOpen ? (
              <ChevronDown className="w-4 h-4 text-[#6B7280]" />
            ) : (
              <ChevronUp className="w-4 h-4 text-[#6B7280]" />
            )}
            <span className="font-bold text-[#374151] text-[15px]">
              General
            </span>
          </button>
          {generalOpen && (
            <div className="p-6 space-y-5">
              <FieldRow label="Question name">
                <input
                  type="text"
                  placeholder="Enter a name (optional)"
                  value={form.questionName}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, questionName: e.target.value }))
                  }
                  className="w-full border border-[#E5E7EB] rounded-lg px-4 py-2 text-[14px] focus:outline-none focus:border-[#F97316]"
                />
              </FieldRow>
              <FieldRow label="Question text">
                <textarea
                  placeholder="Enter the question text..."
                  value={form.questionText}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, questionText: e.target.value }))
                  }
                  rows={4}
                  className="w-full border border-[#E5E7EB] rounded-lg px-4 py-3 text-[14px] focus:outline-none focus:border-[#F97316] resize-none"
                />
              </FieldRow>
              <FieldRow label="Question status">
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      status: e.target.value as "Ready" | "Draft",
                    }))
                  }
                  className="border border-[#3B82F6] text-[#3B82F6] rounded-lg px-4 py-2 text-[14px] bg-white focus:outline-none min-w-[160px]"
                >
                  <option value="Ready">Ready</option>
                  <option value="Draft">Draft</option>
                </select>
              </FieldRow>
              <FieldRow label="Default mark">
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={form.defaultMark}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      defaultMark: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="border border-[#E5E7EB] rounded-lg px-4 py-2 text-[14px] w-32 focus:outline-none focus:border-[#F97316]"
                />
              </FieldRow>
            </div>
          )}
        </div>

        {/* Answer Section */}
        <div className="border border-[#E5E7EB] rounded-xl overflow-hidden mb-8">
          <button
            onClick={() => setAnswerOpen(!answerOpen)}
            className="w-full flex items-center gap-3 px-6 py-4 bg-[#F9FAFB] hover:bg-gray-100 transition-colors text-left"
          >
            {answerOpen ? (
              <ChevronDown className="w-4 h-4 text-[#6B7280]" />
            ) : (
              <ChevronUp className="w-4 h-4 text-[#6B7280]" />
            )}
            <span className="font-bold text-[#374151] text-[15px]">Answer</span>
          </button>
          {answerOpen && (
            <div className="p-6 space-y-6">
              {/* True / False */}
              {form.type === "True/False" && (
                <>
                  <FieldRow label="Correct answer">
                    <select
                      value={form.correctAnswer ? "True" : "False"}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          correctAnswer: e.target.value === "True",
                        }))
                      }
                      className="border border-[#3B82F6] text-[#3B82F6] rounded-lg px-4 py-2 text-[14px] bg-white focus:outline-none min-w-[160px]"
                    >
                      <option value="True">True</option>
                      <option value="False">False</option>
                    </select>
                  </FieldRow>
                  <FieldRow label="Feedback for 'True'">
                    <textarea
                      value={form.feedbackOfTrue}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          feedbackOfTrue: e.target.value,
                        }))
                      }
                      placeholder="Optional feedback when student answers True..."
                      rows={3}
                      className="w-full border border-[#E5E7EB] rounded-lg px-4 py-3 text-[14px] focus:outline-none focus:border-[#F97316] resize-none"
                    />
                  </FieldRow>
                  <FieldRow label="Feedback for 'False'">
                    <textarea
                      value={form.feedbackOfFalse}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          feedbackOfFalse: e.target.value,
                        }))
                      }
                      placeholder="Optional feedback when student answers False..."
                      rows={3}
                      className="w-full border border-[#E5E7EB] rounded-lg px-4 py-3 text-[14px] focus:outline-none focus:border-[#F97316] resize-none"
                    />
                  </FieldRow>
                </>
              )}

              {/* Choices Answer */}
              {form.type === "Choices Answer" && (
                <>
                  <FieldRow label="Allow multiple">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.multiple}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, multiple: e.target.checked }))
                        }
                        className="w-4 h-4 accent-[#3B82F6]"
                      />
                      <span className="text-[14px] text-[#374151]">
                        Multiple correct answers
                      </span>
                    </label>
                  </FieldRow>
                  {form.choices.map((choice, i) => (
                    <div
                      key={i}
                      className="bg-[#F9FAFB] rounded-xl p-5 space-y-4 border border-[#E5E7EB]"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#374151] text-[14px]">
                          Answer {i + 1}
                        </span>
                        <button
                          onClick={() => removeChoice(i)}
                          disabled={form.choices.length <= 2}
                          className="text-gray-300 hover:text-red-500 disabled:cursor-not-allowed p-1 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <textarea
                        value={choice.text}
                        onChange={(e) =>
                          updateChoice(i, "text", e.target.value)
                        }
                        placeholder={`Choice ${i + 1}`}
                        rows={2}
                        className="w-full border border-[#E5E7EB] rounded-lg px-4 py-2 text-[14px] bg-white focus:outline-none focus:border-[#F97316] resize-none"
                      />
                      <div className="flex items-center gap-4">
                        <label className="text-[14px] font-medium text-[#374151] w-32 shrink-0">
                          Grade percent
                        </label>
                        <select
                          value={choice.gradePercent}
                          onChange={(e) =>
                            updateChoice(
                              i,
                              "gradePercent",
                              parseFloat(e.target.value),
                            )
                          }
                          className="border border-[#3B82F6] text-[#3B82F6] rounded-lg px-4 py-2 text-[14px] bg-white focus:outline-none min-w-[140px]"
                        >
                          {GRADE_OPTIONS.map((g) => (
                            <option key={g.value} value={g.value}>
                              {g.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[14px] font-medium text-[#374151] block mb-2">
                          Feedback
                        </label>
                        <textarea
                          value={choice.feedback}
                          onChange={(e) =>
                            updateChoice(i, "feedback", e.target.value)
                          }
                          placeholder="Optional feedback for this choice..."
                          rows={2}
                          className="w-full border border-[#E5E7EB] rounded-lg px-4 py-2 text-[14px] bg-white focus:outline-none focus:border-[#F97316] resize-none"
                        />
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={addChoice}
                    className="flex items-center gap-2 text-[#F97316] font-bold text-[14px] hover:underline mt-2"
                  >
                    <Plus className="w-4 h-4" /> Add blank choice
                  </button>
                </>
              )}

              {/* Short Answer */}
              {form.type === "Short Answer" && (
                <>
                  {form.choices.map((choice, i) => (
                    <div
                      key={i}
                      className="bg-[#F9FAFB] rounded-xl p-5 space-y-4 border border-[#E5E7EB]"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#374151] text-[14px]">
                          Answer {i + 1}
                        </span>
                        <button
                          onClick={() => removeChoice(i)}
                          disabled={form.choices.length <= 1}
                          className="text-gray-300 hover:text-red-500 disabled:cursor-not-allowed p-1 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex items-center gap-4">
                        <input
                          type="text"
                          value={choice.text}
                          onChange={(e) =>
                            updateChoice(i, "text", e.target.value)
                          }
                          placeholder="Enter an accepted answer"
                          className="flex-1 border border-[#E5E7EB] rounded-lg px-4 py-2 text-[14px] bg-white focus:outline-none focus:border-[#F97316]"
                        />
                        <label className="text-[14px] font-medium text-[#374151] shrink-0">
                          Grade %
                        </label>
                        <select
                          value={choice.gradePercent}
                          onChange={(e) =>
                            updateChoice(
                              i,
                              "gradePercent",
                              parseFloat(e.target.value),
                            )
                          }
                          className="border border-[#3B82F6] text-[#3B82F6] rounded-lg px-4 py-2 text-[14px] bg-white focus:outline-none min-w-[140px]"
                        >
                          {GRADE_OPTIONS.map((g) => (
                            <option key={g.value} value={g.value}>
                              {g.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={addChoice}
                    className="flex items-center gap-2 text-[#F97316] font-bold text-[14px] hover:underline mt-2"
                  >
                    <Plus className="w-4 h-4" /> Add blank answer
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => setShowForm(false)}
            className="px-6 py-2.5 border border-[#E5E7EB] text-[#374151] font-bold rounded-xl hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isCreating}
            className="px-8 py-2.5 bg-[#3B82F6] hover:bg-blue-700 text-white font-bold rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {isCreating && <Loader2 className="w-4 h-4 animate-spin" />}
            Save to Bank
          </button>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // MAIN LIST VIEW
  // ════════════════════════════════════════════════════════════════════════════

  return (
    <div className="bg-white rounded-[24px] shadow-sm border border-[#E5E7EB] p-8 min-h-[500px]">
      {/* Header */}
      <div className="flex justify-between items-start mb-8 gap-4">
        <div>
          <h2 className="text-[28px] font-bold text-[#F97316]">
            Question Bank
          </h2>
          <p className="text-[14px] text-[#9CA3AF] mt-1">
            {questions.length} question{questions.length !== 1 ? "s" : ""} in
            this course
            {quiz.data?.questions?.length
              ? ` · ${quiz.data.questions.length} already in quiz`
              : ""}
          </p>
        </div>
        <button
          onClick={openTypePicker}
          className="bg-[#4F46E5] text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-[#4338CA] transition-colors shrink-0"
        >
          <Plus className="w-5 h-5" /> Create Question
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search questions in bank..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 border border-[#E5E7EB] rounded-xl focus:outline-none focus:border-[#4F46E5] text-[14px]"
        />
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[#4F46E5]" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-gray-100 rounded-[24px]">
          <BookOpen className="w-12 h-12 text-gray-200 mb-4" />
          <p className="text-gray-400 font-medium">
            {questions.length === 0
              ? "Your question bank is empty."
              : "No results found."}
          </p>
          <p className="text-gray-400 text-[14px] mt-1">
            {questions.length === 0
              ? 'Click "Create Question" to add your first question.'
              : "Try a different search term."}
          </p>
        </div>
      ) : (
        <div className="border border-[#F3F4F6] rounded-[20px] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[14px] min-w-[700px]">
              <thead className="bg-[#F9FAFB] border-b border-[#F3F4F6]">
                <tr>
                  <th className="p-4 text-left font-bold text-[#374151] w-8">
                    #
                  </th>
                  <th className="p-4 text-left font-bold text-[#374151] w-10">
                    Type
                  </th>
                  <th className="p-4 text-left font-bold text-[#374151]">
                    Question
                  </th>
                  <th className="p-4 text-left font-bold text-[#374151] w-20">
                    Mark
                  </th>
                  <th className="p-4 text-left font-bold text-[#374151] w-24">
                    Status
                  </th>
                  <th className="p-4 text-left font-bold text-[#374151] w-28">
                    Modified
                  </th>
                  <th className="p-4 text-center font-bold text-[#374151] w-32">
                    Action
                  </th>
                  <th className="p-4 w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F4F6]">
                {filtered.map((q, idx) => {
                  const fingerprint = getQuestionFingerprint(q);
                  const alreadyAdded = existingFingerprints.has(fingerprint);
                  const isBeingAdded = addingId === q.id;

                  return (
                    <tr
                      key={q.id}
                      className="hover:bg-[#F5F3FF] transition-colors group"
                    >
                      <td className="p-4 text-[#9CA3AF]">{idx + 1}</td>
                      <td className="p-4">
                        <div className="p-1.5 bg-white rounded-lg shadow-sm inline-flex border border-gray-100">
                          {getTypeIcon(q.type)}
                        </div>
                      </td>
                      <td className="p-4 max-w-xs">
                        <p className="font-medium text-[#374151] line-clamp-2">
                          {q.questionText}
                        </p>
                        {q.questionName && (
                          <p className="text-[12px] text-[#9CA3AF] mt-0.5">
                            {q.questionName}
                          </p>
                        )}
                      </td>
                      <td className="p-4 font-bold text-[#374151]">
                        {q.defaultMark ?? 1}
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center gap-1 text-[12px] font-medium px-2.5 py-1 rounded-full ${
                            q.status === "Ready"
                              ? "bg-green-50 text-green-600"
                              : "bg-yellow-50 text-yellow-600"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full inline-block ${
                              q.status === "Ready"
                                ? "bg-green-500"
                                : "bg-yellow-500"
                            }`}
                          />
                          {q.status}
                        </span>
                      </td>
                      <td className="p-4 text-[#9CA3AF]">
                        {q.updatedAt || q.modifiedAt
                          ? new Date(
                              q.updatedAt ?? q.modifiedAt ?? "",
                            ).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="p-4 text-center">
                        {alreadyAdded ? (
                          <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-green-600 bg-green-50 px-3 py-1.5 rounded-lg">
                            <Check className="w-3.5 h-3.5" /> In Quiz
                          </span>
                        ) : (
                          <button
                            onClick={() => handleAddToQuiz(q)}
                            disabled={isBeingAdded}
                            className="inline-flex items-center gap-1.5 text-[13px] font-bold text-white bg-[#DB2777] hover:bg-[#BE185D] px-3 py-1.5 rounded-lg transition-all disabled:opacity-60"
                          >
                            {isBeingAdded ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <PlusCircle className="w-3.5 h-3.5" />
                            )}
                            Add to Quiz
                          </button>
                        )}
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => handleDelete(q.id)}
                          className="text-gray-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 bg-[#F9FAFB] border-t border-[#F3F4F6] flex items-center justify-between text-[13px] text-[#6B7280]">
            <span>
              {filtered.length} question{filtered.length !== 1 ? "s" : ""}
              {searchTerm ? " matching search" : ""}
            </span>
            <span>{existingFingerprints.size} added to quiz</span>
          </div>
        </div>
      )}

      {/* Type picker modal */}
      {showTypePicker && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={() => setShowTypePicker(false)}
        >
          <div
            className="bg-white rounded-[20px] w-full max-w-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 pt-6 pb-4">
              <h2 className="text-[#F97316] font-bold text-[18px] mb-4">
                Choose a question type to add
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-[13px] font-bold text-[#374151] mb-3">
                    Question type
                  </p>
                  {QUESTION_TYPE_META.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => setSelectedType(t.value)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[14px] font-medium transition-all text-left ${
                        selectedType === t.value
                          ? "bg-[#EEF2FF] border-2 border-[#4F46E5] text-[#4F46E5]"
                          : "border-2 border-transparent hover:bg-gray-50 text-[#374151]"
                      }`}
                    >
                      {t.icon}
                      {t.label}
                    </button>
                  ))}
                </div>
                <div className="bg-[#F8F9FF] rounded-xl p-5">
                  <p className="text-[13px] font-bold text-[#374151] mb-3">
                    Description
                  </p>
                  <p className="text-[13px] text-[#6B7280] leading-relaxed">
                    {
                      QUESTION_TYPE_META.find((t) => t.value === selectedType)
                        ?.description
                    }
                  </p>
                </div>
              </div>
            </div>
            <div className="px-6 pb-6 flex justify-end gap-3 mt-2">
              <button
                onClick={() => setShowTypePicker(false)}
                className="px-5 py-2.5 text-[#374151] font-bold border border-[#E5E7EB] hover:bg-gray-50 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handlePickType}
                className="px-6 py-2.5 bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold rounded-xl"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeacherQuizQuestionBank;
