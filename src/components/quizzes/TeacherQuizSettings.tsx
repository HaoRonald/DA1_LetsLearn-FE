'use client';

import React, { useState } from 'react';
import {
  Plus, Trash2, Save, Loader2,
  ListChecks, ToggleLeft, ToggleRight, FileQuestion,
  Check, X,
} from 'lucide-react';
import { TopicResponse } from '@/services/courseService';
import { topicApi, TopicQuizData, TopicQuizQuestion } from '@/services/topicService';
import { toast } from 'sonner';

interface TeacherQuizSettingsProps {
  quiz: TopicResponse;
  courseId: string;
}

export function TeacherQuizSettings({ quiz, courseId }: TeacherQuizSettingsProps) {
  const quizData: TopicQuizData = quiz.data || {};

  const [form, setForm] = useState({
    title: quiz.title || '',
    description: quizData.description || '',
    open: quizData.open ? new Date(quizData.open).toISOString().slice(0, 16) : '',
    close: quizData.close ? new Date(quizData.close).toISOString().slice(0, 16) : '',
    enableOpen: !!quizData.open,
    enableClose: !!quizData.close,
    timeLimit: quizData.timeLimit || '',
    timeLimitUnit: quizData.timeLimitUnit || 'minutes',
    enableTimeLimit: !!quizData.timeLimit,
    gradeToPass: quizData.gradeToPass || '',
    gradingMethod: quizData.gradingMethod || 'Highest Grade',
    attemptAllowed: quizData.attemptAllowed?.toString() || '',
    enableAttempt: !!quizData.attemptAllowed,
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = {
        id: quiz.id,
        title: form.title,
        type: quiz.type,
        data: {
          description: form.description,
          open: form.enableOpen && form.open ? new Date(form.open).toISOString() : null,
          close: form.enableClose && form.close ? new Date(form.close).toISOString() : null,
          timeLimit: form.enableTimeLimit && form.timeLimit ? Number(form.timeLimit) : null,
          timeLimitUnit: form.enableTimeLimit ? form.timeLimitUnit : null,
          gradeToPass: form.gradeToPass ? Number(form.gradeToPass) : null,
          gradingMethod: form.gradingMethod,
          attemptAllowed: form.enableAttempt && form.attemptAllowed ? form.attemptAllowed : null,
          questions: quizData.questions || [],
        },
      };
      await topicApi.update(courseId, quiz.id, payload);
      toast.success('Quiz settings saved!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 mb-12">
      {/* ── General Settings ──────────────────────────────────── */}
      <div className="bg-white rounded-xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] border border-[#E5E7EB] p-6">
        <h2 className="text-[#DB2777] font-bold text-[18px] mb-6">Edit Quiz</h2>
        <div className="space-y-5">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <label className="md:w-1/4 text-[14px] font-bold text-[#374151]">Name</label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="Enter quiz name"
              className="flex-1 border border-[#E5E7EB] rounded-lg px-4 py-2 text-[14px] focus:outline-none focus:border-[#DB2777]"
            />
          </div>
          <div className="flex flex-col md:flex-row gap-4">
            <label className="md:w-1/4 text-[14px] font-bold text-[#374151] pt-2">Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Enter quiz description"
              rows={3}
              className="flex-1 border border-[#E5E7EB] rounded-lg px-4 py-3 text-[14px] focus:outline-none focus:border-[#DB2777]"
            />
          </div>
        </div>
      </div>

      {/* ── Availability ────────────────────────────────────────── */}
      <div className="bg-white rounded-xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] border border-[#E5E7EB] p-6">
        <h3 className="font-bold text-[#374151] text-[16px] mb-4">Availability</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <label className="w-1/3 text-[14px] font-bold text-[#374151]">Open quiz</label>
            <button onClick={() => setForm({ ...form, enableOpen: !form.enableOpen })} className="flex items-center gap-2 text-[14px] font-medium">
              {form.enableOpen ? <ToggleRight className="w-8 h-8 text-[#22C55E]" /> : <ToggleLeft className="w-8 h-8 text-gray-300" />}
              <span className="text-[#6B7280]">{form.enableOpen ? 'Yes' : 'No'}</span>
            </button>
            <input type="datetime-local" value={form.open} onChange={e => setForm({ ...form, open: e.target.value })}
              disabled={!form.enableOpen}
              className="flex-1 border border-[#E5E7EB] rounded-lg px-4 py-2 text-[14px] disabled:bg-gray-50" />
          </div>
          <div className="flex items-center gap-4">
            <label className="w-1/3 text-[14px] font-bold text-[#374151]">Close quiz</label>
            <button onClick={() => setForm({ ...form, enableClose: !form.enableClose })} className="flex items-center gap-2 text-[14px] font-medium">
              {form.enableClose ? <ToggleRight className="w-8 h-8 text-[#22C55E]" /> : <ToggleLeft className="w-8 h-8 text-gray-300" />}
              <span className="text-[#6B7280]">{form.enableClose ? 'Yes' : 'No'}</span>
            </button>
            <input type="datetime-local" value={form.close} onChange={e => setForm({ ...form, close: e.target.value })}
              disabled={!form.enableClose}
              className="flex-1 border border-[#E5E7EB] rounded-lg px-4 py-2 text-[14px] disabled:bg-gray-50" />
          </div>
        </div>
      </div>

      {/* ── Attempt Settings ─────────────────────────────────────── */}
      <div className="bg-white rounded-xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] border border-[#E5E7EB] p-6">
        <h3 className="font-bold text-[#374151] text-[16px] mb-4">Attempts</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <label className="w-1/3 text-[14px] font-bold text-[#374151]">Time limit</label>
            <button onClick={() => setForm({ ...form, enableTimeLimit: !form.enableTimeLimit })} className="flex items-center gap-2 text-[14px] font-medium">
              {form.enableTimeLimit ? <ToggleRight className="w-8 h-8 text-[#22C55E]" /> : <ToggleLeft className="w-8 h-8 text-gray-300" />}
              <span className="text-[#6B7280]">{form.enableTimeLimit ? 'Yes' : 'No'}</span>
            </button>
            <div className="flex-1 flex gap-2">
              <input type="number" min="1" value={form.timeLimit} onChange={e => setForm({ ...form, timeLimit: e.target.value })}
                disabled={!form.enableTimeLimit} placeholder="30"
                className="w-24 border border-[#E5E7EB] rounded-lg px-4 py-2 text-[14px] disabled:bg-gray-50" />
              <select value={form.timeLimitUnit} onChange={e => setForm({ ...form, timeLimitUnit: e.target.value as any })}
                disabled={!form.enableTimeLimit}
                className="border border-[#E5E7EB] rounded-lg px-4 py-2 text-[14px] disabled:bg-gray-50">
                <option value="minutes">Minutes</option>
                <option value="hours">Hours</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="w-1/3 text-[14px] font-bold text-[#374151]">Attempts allowed</label>
            <button onClick={() => setForm({ ...form, enableAttempt: !form.enableAttempt })} className="flex items-center gap-2 text-[14px] font-medium">
              {form.enableAttempt ? <ToggleRight className="w-8 h-8 text-[#22C55E]" /> : <ToggleLeft className="w-8 h-8 text-gray-300" />}
              <span className="text-[#6B7280]">{form.enableAttempt ? 'Limited' : 'Unlimited'}</span>
            </button>
            <input type="number" min="1" value={form.attemptAllowed} onChange={e => setForm({ ...form, attemptAllowed: e.target.value })}
              disabled={!form.enableAttempt} placeholder="3"
              className="flex-1 border border-[#E5E7EB] rounded-lg px-4 py-2 text-[14px] disabled:bg-gray-50" />
          </div>

          <div className="flex items-center gap-4">
            <label className="w-1/3 text-[14px] font-bold text-[#374151]">Grading method</label>
            <select value={form.gradingMethod} onChange={e => setForm({ ...form, gradingMethod: e.target.value })}
              className="flex-1 border border-[#E5E7EB] rounded-lg px-4 py-2 text-[14px]">
              <option value="Highest Grade">Highest Grade</option>
              <option value="Average Grade">Average Grade</option>
              <option value="First Grade">First Grade</option>
              <option value="Last Grade">Last Grade</option>
            </select>
          </div>

          <div className="flex items-center gap-4">
            <label className="w-1/3 text-[14px] font-bold text-[#374151]">Grade to pass</label>
            <input type="number" min="0" max="100" value={form.gradeToPass} onChange={e => setForm({ ...form, gradeToPass: e.target.value })}
              placeholder="50"
              className="flex-1 border border-[#E5E7EB] rounded-lg px-4 py-2 text-[14px]" />
          </div>
        </div>
      </div>

      {/* ── Save Button ─────────────────────────────────────────── */}
      <div className="flex justify-center pt-4">
        <button onClick={handleSave} disabled={isSaving}
          className="bg-[#DB2777] hover:bg-pink-700 transition-colors text-white text-[14px] font-bold px-8 py-2.5 rounded-lg shadow-sm disabled:opacity-50 flex items-center gap-2">
          {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
          {isSaving ? 'Saving...' : 'Save settings'}
        </button>
      </div>
    </div>
  );
}

export default TeacherQuizSettings;
