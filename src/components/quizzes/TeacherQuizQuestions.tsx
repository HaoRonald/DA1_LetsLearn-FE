'use client';

import React, { useState } from 'react';
import {
  ListChecks, Type, FileText, LayoutGrid,
  Trash2, Plus, Check, X, Loader2, ChevronDown, ChevronUp, ArrowLeft,
} from 'lucide-react';
import { TopicResponse } from '@/services/courseService';
import { topicApi, TopicQuizData, TopicQuizQuestion } from '@/services/topicService';
import { questionService, CreateQuestionRequest } from '@/services/questionService';
import { toast } from 'sonner';

interface TeacherQuizQuestionsProps {
  quiz: TopicResponse;
  courseId: string;
}

type QuizQuestionType = 'Multiple Choice' | 'True/False' | 'Short Answer';
type BankQuestionType = 'Choices Answer' | 'True/False' | 'Short Answer';

const QUESTION_TYPES = [
  {
    value: 'True/False' as QuizQuestionType,
    bankType: 'True/False' as BankQuestionType,
    label: 'True/False',
    formTitle: 'Adding a True/False question',
    icon: <LayoutGrid className="w-5 h-5 text-[#8B5CF6]" />,
    description: "A simple form of multiple choice question with just the two choices 'True' and 'False'.",
  },
  {
    value: 'Short Answer' as QuizQuestionType,
    bankType: 'Short Answer' as BankQuestionType,
    label: 'Short Answer',
    formTitle: 'Adding a Short answer question',
    icon: <Type className="w-5 h-5 text-[#F59E0B]" />,
    description: 'Students type a short text response. Grade percent can be assigned per accepted answer.',
  },
  {
    value: 'Multiple Choice' as QuizQuestionType,
    bankType: 'Choices Answer' as BankQuestionType,
    label: 'Choice Answer',
    formTitle: 'Adding a Multiple or Single choice question',
    icon: <ListChecks className="w-5 h-5 text-[#06B6D4]" />,
    description: 'Allows selection of a single or multiple responses from a pre-defined list.',
  },
];

const GRADE_OPTIONS = [
  { label: 'None', value: 0 },
  { label: '10%', value: 10 },
  { label: '20%', value: 20 },
  { label: '25%', value: 25 },
  { label: '33.333%', value: 33.333 },
  { label: '50%', value: 50 },
  { label: '66.667%', value: 66.667 },
  { label: '75%', value: 75 },
  { label: '100%', value: 100 },
];

interface ChoiceState {
  text: string;
  gradePercent: number;
  feedback: string;
}

interface FormState {
  questionName: string;
  questionText: string;
  status: string;
  defaultMark: number;
  type: QuizQuestionType;
  multiple: boolean;
  correctAnswer: boolean;
  feedbackOfTrue: string;
  feedbackOfFalse: string;
  choices: ChoiceState[];
}

const emptyChoice = (): ChoiceState => ({ text: '', gradePercent: 100, feedback: '' });

const emptyForm = (type: QuizQuestionType): FormState => ({
  questionName: '',
  questionText: '',
  status: 'Ready',
  defaultMark: 10,
  type,
  multiple: false,
  correctAnswer: true,
  feedbackOfTrue: '',
  feedbackOfFalse: '',
  choices: type === 'Multiple Choice'
    ? [emptyChoice(), emptyChoice(), emptyChoice()]
    : type === 'Short Answer'
      ? [emptyChoice(), emptyChoice()]
      : [],
});

function getIcon(type?: string) {
  switch (type) {
    case 'Multiple Choice': return <ListChecks className="w-5 h-5 text-[#06B6D4]" />;
    case 'True/False': return <LayoutGrid className="w-5 h-5 text-[#8B5CF6]" />;
    case 'Short Answer': return <Type className="w-5 h-5 text-[#F59E0B]" />;
    default: return <FileText className="w-5 h-5 text-[#6B7280]" />;
  }
}

// ── Section collapsible wrapper ────────────────────────────────────────────────
function Section({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-[#E5E7EB] rounded-xl overflow-hidden mb-6">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-6 py-4 bg-[#F9FAFB] hover:bg-gray-100 transition-colors text-left"
      >
        {open ? <ChevronDown className="w-4 h-4 text-[#6B7280]" /> : <ChevronUp className="w-4 h-4 text-[#6B7280]" />}
        <span className="font-bold text-[#374151] text-[15px]">{title}</span>
      </button>
      {open && <div className="p-6 space-y-5">{children}</div>}
    </div>
  );
}

// ── Field row layout ────────────────────────────────────────────────────────────
function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col md:flex-row gap-3 md:gap-6">
      <label className="md:w-48 shrink-0 text-[14px] font-medium text-[#374151] pt-2">{label}</label>
      <div className="flex-1">{children}</div>
    </div>
  );
}

export function TeacherQuizQuestions({ quiz, courseId }: TeacherQuizQuestionsProps) {
  const quizData: TopicQuizData = quiz.data || {};
  const [questions, setQuestions] = useState<TopicQuizQuestion[]>(quizData.questions || []);
  const [isSaving, setIsSaving] = useState(false);

  // Step 1 – pick type
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [selectedType, setSelectedType] = useState<QuizQuestionType>('True/False');

  // Step 2 – full form view
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm('True/False'));
  const [isCreating, setIsCreating] = useState(false);

  // Section collapse state
  const [generalOpen, setGeneralOpen] = useState(true);
  const [answerOpen, setAnswerOpen] = useState(true);

  const totalMark = questions.reduce((sum, q) => sum + (q.defaultMark || 10), 0);
  const formTitle = QUESTION_TYPES.find(t => t.value === form.type)?.formTitle || '';

  // ── Step 1 ──────────────────────────────────────────────────────────────────
  const openTypePicker = () => { setSelectedType('True/False'); setShowTypePicker(true); };

  // ── Step 2 ──────────────────────────────────────────────────────────────────
  const handlePickType = () => {
    setForm(emptyForm(selectedType));
    setGeneralOpen(true);
    setAnswerOpen(true);
    setShowTypePicker(false);
    setShowForm(true);
  };

  const handleCancelForm = () => { setShowForm(false); };

  // ── Create ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.questionText.trim() && !form.questionName.trim()) {
      toast.error('Question name or question text is required');
      return;
    }

    setIsCreating(true);
    try {
      const typeConfig = QUESTION_TYPES.find(t => t.value === form.type)!;
      const bankPayload: CreateQuestionRequest = {
        courseId,
        questionName: form.questionName || `Q - ${form.questionText.slice(0, 40)}`,
        questionText: form.questionText,
        status: form.status,
        type: typeConfig.bankType,
        defaultMark: form.defaultMark,
        multiple: form.multiple,
        correctAnswer: form.type === 'True/False' ? form.correctAnswer : undefined,
        feedbackOfTrue: form.type === 'True/False' ? form.feedbackOfTrue : undefined,
        feedbackOfFalse: form.type === 'True/False' ? form.feedbackOfFalse : undefined,
        choices: (form.type === 'Multiple Choice' || form.type === 'Short Answer')
          ? form.choices.filter(c => c.text.trim()).map(c => ({
              text: c.text,
              gradePercent: c.gradePercent,
              feedback: c.feedback || undefined,
            }))
          : undefined,
      };

      const bankRes = await questionService.create(bankPayload);
      const bankQuestion = bankRes.data;

      const quizQuestion: TopicQuizQuestion = {
        id: bankQuestion.id,
        questionName: bankQuestion.questionName,
        questionText: form.questionText,
        type: form.type,
        defaultMark: form.defaultMark,
        multiple: form.multiple,
        correctAnswer: form.type === 'True/False' ? form.correctAnswer : undefined,
        feedbackOfTrue: form.feedbackOfTrue || undefined,
        feedbackOfFalse: form.feedbackOfFalse || undefined,
        choices: bankQuestion.choices?.map(c => ({
          id: c.id,
          text: c.text || '',
          gradePercent: c.gradePercent,
          feedback: c.feedback,
        })),
      };

      const updatedQuestions = [...questions, quizQuestion];
      setQuestions(updatedQuestions);

      await topicApi.update(courseId, quiz.id, {
        id: quiz.id,
        title: quiz.title,
        type: quiz.type,
        data: { ...quizData, questions: updatedQuestions },
      });

      toast.success('Question created and added to quiz!');
      setShowForm(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create question');
    } finally {
      setIsCreating(false);
    }
  };

  // ── Delete ──────────────────────────────────────────────────────────────────
  const handleDelete = async (idx: number) => {
    const updated = questions.filter((_, i) => i !== idx);
    setQuestions(updated);
    setIsSaving(true);
    try {
      await topicApi.update(courseId, quiz.id, {
        id: quiz.id, title: quiz.title, type: quiz.type,
        data: { ...quizData, questions: updated },
      });
      toast.success('Question removed');
    } catch {
      setQuestions(questions);
      toast.error('Failed to remove question');
    } finally { setIsSaving(false); }
  };

  // ── Choice helpers ──────────────────────────────────────────────────────────
  const addChoice = () => setForm(p => ({ ...p, choices: [...p.choices, emptyChoice()] }));
  const removeChoice = (i: number) => setForm(p => ({ ...p, choices: p.choices.filter((_, ci) => ci !== i) }));
  const updateChoice = (i: number, field: keyof ChoiceState, val: any) =>
    setForm(p => ({ ...p, choices: p.choices.map((c, ci) => ci === i ? { ...c, [field]: val } : c) }));

  // ── If showing form, render full-page form ──────────────────────────────────
  if (showForm) {
    return (
      <div className="bg-white min-h-[600px] rounded-[24px] shadow-sm border border-[#E5E7EB] p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setShowForm(false); setShowTypePicker(true); }}
              className="flex items-center gap-1.5 text-[#6B7280] hover:text-[#374151] font-medium text-[14px] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <span className="text-[#D1D5DB]">/</span>
            <h2 className="text-[20px] font-bold text-[#F97316]">{formTitle}</h2>
          </div>
          <button
            onClick={() => { setGeneralOpen(!generalOpen); setAnswerOpen(!answerOpen); }}
            className="text-[#3B82F6] text-[13px] font-medium hover:underline"
          >
            {generalOpen && answerOpen ? 'Collapse all' : 'Expand all'}
          </button>
        </div>

        {/* ── General Section ───────────────────────────────────────────────── */}
        <div className="border border-[#E5E7EB] rounded-xl overflow-hidden mb-6">
          <button
            onClick={() => setGeneralOpen(!generalOpen)}
            className="w-full flex items-center gap-3 px-6 py-4 bg-[#F9FAFB] hover:bg-gray-100 transition-colors text-left"
          >
            {generalOpen ? <ChevronDown className="w-4 h-4 text-[#6B7280]" /> : <ChevronUp className="w-4 h-4 text-[#6B7280]" />}
            <span className="font-bold text-[#374151] text-[15px]">General</span>
          </button>
          {generalOpen && (
            <div className="p-6 space-y-5">
              <FieldRow label="Question name">
                <input
                  type="text"
                  placeholder="Enter a name"
                  value={form.questionName}
                  onChange={e => setForm(p => ({ ...p, questionName: e.target.value }))}
                  className="w-full border border-[#E5E7EB] rounded-lg px-4 py-2 text-[14px] focus:outline-none focus:border-[#F97316]"
                />
              </FieldRow>

              <FieldRow label="Question text">
                <textarea
                  placeholder="Enter the question text..."
                  value={form.questionText}
                  onChange={e => setForm(p => ({ ...p, questionText: e.target.value }))}
                  rows={4}
                  className="w-full border border-[#E5E7EB] rounded-lg px-4 py-3 text-[14px] focus:outline-none focus:border-[#F97316] resize-none"
                />
              </FieldRow>

              <FieldRow label="Question status">
                <select
                  value={form.status}
                  onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                  className="border border-[#3B82F6] text-[#3B82F6] rounded-lg px-4 py-2 text-[14px] focus:outline-none focus:border-[#F97316] min-w-[160px] bg-white"
                >
                  <option value="Ready">Ready</option>
                  <option value="Draft">Draft</option>
                </select>
              </FieldRow>

              <FieldRow label="Default mark">
                <input
                  type="number"
                  min="0"
                  value={form.defaultMark}
                  onChange={e => setForm(p => ({ ...p, defaultMark: parseFloat(e.target.value) || 0 }))}
                  className="border border-[#E5E7EB] rounded-lg px-4 py-2 text-[14px] w-32 focus:outline-none focus:border-[#F97316]"
                />
              </FieldRow>
            </div>
          )}
        </div>

        {/* ── Answer Section ────────────────────────────────────────────────── */}
        <div className="border border-[#E5E7EB] rounded-xl overflow-hidden mb-8">
          <button
            onClick={() => setAnswerOpen(!answerOpen)}
            className="w-full flex items-center gap-3 px-6 py-4 bg-[#F9FAFB] hover:bg-gray-100 transition-colors text-left"
          >
            {answerOpen ? <ChevronDown className="w-4 h-4 text-[#6B7280]" /> : <ChevronUp className="w-4 h-4 text-[#6B7280]" />}
            <span className="font-bold text-[#374151] text-[15px]">Answer</span>
          </button>
          {answerOpen && (
            <div className="p-6 space-y-6">

              {/* ── TRUE / FALSE ─────────────────────────────────────────── */}
              {form.type === 'True/False' && (
                <>
                  <FieldRow label="Correct answer">
                    <select
                      value={form.correctAnswer ? 'True' : 'False'}
                      onChange={e => setForm(p => ({ ...p, correctAnswer: e.target.value === 'True' }))}
                      className="border border-[#3B82F6] text-[#3B82F6] rounded-lg px-4 py-2 text-[14px] focus:outline-none min-w-[160px] bg-white"
                    >
                      <option value="True">True</option>
                      <option value="False">False</option>
                    </select>
                  </FieldRow>

                  <FieldRow label="Feedback for the response 'True'">
                    <textarea
                      value={form.feedbackOfTrue}
                      onChange={e => setForm(p => ({ ...p, feedbackOfTrue: e.target.value }))}
                      placeholder="Optional feedback when student answers True..."
                      rows={3}
                      className="w-full border border-[#E5E7EB] rounded-lg px-4 py-3 text-[14px] focus:outline-none focus:border-[#F97316] resize-none"
                    />
                  </FieldRow>

                  <FieldRow label="Feedback for the response 'False'">
                    <textarea
                      value={form.feedbackOfFalse}
                      onChange={e => setForm(p => ({ ...p, feedbackOfFalse: e.target.value }))}
                      placeholder="Optional feedback when student answers False..."
                      rows={3}
                      className="w-full border border-[#E5E7EB] rounded-lg px-4 py-3 text-[14px] focus:outline-none focus:border-[#F97316] resize-none"
                    />
                  </FieldRow>
                </>
              )}

              {/* ── MULTIPLE CHOICE ──────────────────────────────────────── */}
              {form.type === 'Multiple Choice' && (
                <>
                  {form.choices.map((choice, i) => (
                    <div key={i} className="bg-[#F9FAFB] rounded-xl p-5 space-y-4 border border-[#E5E7EB]">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#374151] text-[14px]">Answer {i + 1}</span>
                        <button onClick={() => removeChoice(i)} disabled={form.choices.length <= 2}
                          className="text-gray-300 hover:text-red-500 disabled:cursor-not-allowed p-1 transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <textarea
                        value={choice.text}
                        onChange={e => updateChoice(i, 'text', e.target.value)}
                        placeholder={`Choice ${i + 1}`}
                        rows={2}
                        className="w-full border border-[#E5E7EB] rounded-lg px-4 py-2 text-[14px] bg-white focus:outline-none focus:border-[#F97316] resize-none"
                      />
                      <div className="flex items-center gap-4">
                        <label className="text-[14px] font-medium text-[#374151] w-32 shrink-0">Grade percent</label>
                        <select
                          value={choice.gradePercent}
                          onChange={e => updateChoice(i, 'gradePercent', parseFloat(e.target.value))}
                          className="border border-[#3B82F6] text-[#3B82F6] rounded-lg px-4 py-2 text-[14px] bg-white focus:outline-none min-w-[140px]"
                        >
                          {GRADE_OPTIONS.map(g => (
                            <option key={g.value} value={g.value}>{g.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[14px] font-medium text-[#374151] block mb-2">Feedback</label>
                        <textarea
                          value={choice.feedback}
                          onChange={e => updateChoice(i, 'feedback', e.target.value)}
                          placeholder="Optional feedback for this choice..."
                          rows={2}
                          className="w-full border border-[#E5E7EB] rounded-lg px-4 py-2 text-[14px] bg-white focus:outline-none focus:border-[#F97316] resize-none"
                        />
                      </div>
                    </div>
                  ))}
                  <button onClick={addChoice}
                    className="flex items-center gap-2 text-[#F97316] font-bold text-[14px] hover:underline mt-2">
                    <Plus className="w-4 h-4" /> Add blank choice
                  </button>
                </>
              )}

              {/* ── SHORT ANSWER ─────────────────────────────────────────── */}
              {form.type === 'Short Answer' && (
                <>
                  {form.choices.map((choice, i) => (
                    <div key={i} className="bg-[#F9FAFB] rounded-xl p-5 space-y-4 border border-[#E5E7EB]">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#374151] text-[14px]">Answer {i + 1}</span>
                        <button onClick={() => removeChoice(i)} disabled={form.choices.length <= 1}
                          className="text-gray-300 hover:text-red-500 disabled:cursor-not-allowed p-1 transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex items-center gap-4">
                        <input
                          type="text"
                          value={choice.text}
                          onChange={e => updateChoice(i, 'text', e.target.value)}
                          placeholder="Enter an answer"
                          className="flex-1 border border-[#E5E7EB] rounded-lg px-4 py-2 text-[14px] bg-white focus:outline-none focus:border-[#F97316]"
                        />
                        <label className="text-[14px] font-medium text-[#374151] shrink-0">Grade percent</label>
                        <select
                          value={choice.gradePercent}
                          onChange={e => updateChoice(i, 'gradePercent', parseFloat(e.target.value))}
                          className="border border-[#3B82F6] text-[#3B82F6] rounded-lg px-4 py-2 text-[14px] bg-white focus:outline-none min-w-[140px]"
                        >
                          {GRADE_OPTIONS.map(g => (
                            <option key={g.value} value={g.value}>{g.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[14px] font-medium text-[#374151] block mb-2">Feedback</label>
                        <textarea
                          value={choice.feedback}
                          onChange={e => updateChoice(i, 'feedback', e.target.value)}
                          placeholder="Optional feedback for this answer..."
                          rows={2}
                          className="w-full border border-[#E5E7EB] rounded-lg px-4 py-2 text-[14px] bg-white focus:outline-none focus:border-[#F97316] resize-none"
                        />
                      </div>
                    </div>
                  ))}
                  <button onClick={addChoice}
                    className="flex items-center gap-2 text-[#F97316] font-bold text-[14px] hover:underline mt-2">
                    <Plus className="w-4 h-4" /> Add blank answer
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* ── Footer ───────────────────────────────────────────────────────── */}
        <div className="flex justify-between items-center">
          <button onClick={handleCancelForm}
            className="px-6 py-2.5 border border-[#E5E7EB] text-[#374151] font-bold rounded-xl hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} disabled={isCreating}
            className="px-8 py-2.5 bg-[#3B82F6] hover:bg-blue-700 text-white font-bold rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50">
            {isCreating && <Loader2 className="w-4 h-4 animate-spin" />}
            Save
          </button>
        </div>
      </div>
    );
  }

  // ── Main questions list view ───────────────────────────────────────────────
  return (
    <div className="bg-white rounded-[24px] shadow-sm border border-[#E5E7EB] overflow-hidden">
      <div className="p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <h2 className="text-[28px] font-bold text-[#F97316]">Questions</h2>
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-[14px] text-[#6B7280]">
              {questions.length} question{questions.length !== 1 ? 's' : ''} · Total mark: <strong>{totalMark}</strong>
            </span>
            {isSaving && (
              <span className="flex items-center gap-1 text-[13px] text-[#9CA3AF]">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />Saving...
              </span>
            )}
          </div>
        </div>

        {questions.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-gray-100 rounded-[24px] mb-6">
            <FileText className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-400 font-medium">No questions yet.</p>
            <p className="text-gray-400 text-[14px]">Click "New question" to create your first question.</p>
          </div>
        ) : (
          <div className="border border-[#F3F4F6] rounded-[20px] overflow-hidden mb-6">
            <table className="w-full text-[14px]">
              <thead className="bg-[#F9FAFB] border-b border-[#F3F4F6]">
                <tr>
                  <th className="p-4 w-10"><input type="checkbox" className="w-4 h-4 rounded accent-[#F97316]" /></th>
                  <th className="p-4 text-left font-bold text-[#374151]">#</th>
                  <th className="p-4 text-left font-bold text-[#374151]">Type</th>
                  <th className="p-4 text-left font-bold text-[#374151]">Question</th>
                  <th className="p-4 text-left font-bold text-[#374151]">Points</th>
                  <th className="p-4 text-left font-bold text-[#374151]">Status</th>
                  <th className="p-4 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F4F6]">
                {questions.map((q, idx) => (
                  <tr key={q.id || idx} className="hover:bg-[#FFF7F0] transition-colors group">
                    <td className="p-4"><input type="checkbox" className="w-4 h-4 rounded accent-[#F97316]" /></td>
                    <td className="p-4 text-[#6B7280]">{idx + 1}</td>
                    <td className="p-4">
                      <div className="p-1.5 bg-white rounded-lg shadow-sm inline-flex border border-gray-100">
                        {getIcon(q.type)}
                      </div>
                    </td>
                    <td className="p-4 font-medium text-[#374151] max-w-xs">
                      <span className="line-clamp-2">{q.questionText || q.questionName}</span>
                    </td>
                    <td className="p-4 font-bold text-[#374151]">{q.defaultMark || 10}</td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" /> Ready
                      </span>
                    </td>
                    <td className="p-4">
                      <button onClick={() => handleDelete(idx)}
                        className="text-gray-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-4 py-3 bg-[#F9FAFB] border-t border-[#F3F4F6] flex items-center justify-between text-[13px] text-[#6B7280]">
              <span>0 of {questions.length} row(s) selected</span>
              <span>Page 1 of 1</span>
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <button onClick={openTypePicker}
            className="flex items-center gap-2 bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold text-[14px] px-5 py-2.5 rounded-xl transition-all shadow-sm">
            <Plus className="w-4 h-4" /> New question
          </button>
        </div>
      </div>

      {/* ══ Modal: Choose type ══════════════════════════════════════════════ */}
      {showTypePicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={() => setShowTypePicker(false)}>
          <div className="bg-white rounded-[20px] w-full max-w-2xl shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}>
            <div className="px-6 pt-6 pb-4">
              <h2 className="text-[#F97316] font-bold text-[18px] mb-4">Choose a question type to add</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-[13px] font-bold text-[#374151] mb-3">Question</p>
                  {QUESTION_TYPES.map(t => (
                    <button key={t.value} onClick={() => setSelectedType(t.value)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[14px] font-medium transition-all text-left ${
                        selectedType === t.value
                          ? 'bg-[#EEF2FF] border-2 border-[#4F46E5] text-[#4F46E5]'
                          : 'border-2 border-transparent hover:bg-gray-50 text-[#374151]'
                      }`}>
                      {t.icon}{t.label}
                    </button>
                  ))}
                </div>
                <div className="bg-[#F8F9FF] rounded-xl p-5">
                  <p className="text-[13px] font-bold text-[#374151] mb-3">Description</p>
                  <p className="text-[13px] text-[#6B7280] leading-relaxed">
                    {QUESTION_TYPES.find(t => t.value === selectedType)?.description}
                  </p>
                </div>
              </div>
            </div>
            <div className="px-6 pb-6 flex justify-end gap-3 mt-2">
              <button onClick={() => setShowTypePicker(false)}
                className="px-5 py-2.5 text-[#374151] font-bold border border-[#E5E7EB] hover:bg-gray-50 rounded-xl transition-colors">
                Cancel
              </button>
              <button onClick={handlePickType}
                className="px-6 py-2.5 bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold rounded-xl transition-colors">
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeacherQuizQuestions;
