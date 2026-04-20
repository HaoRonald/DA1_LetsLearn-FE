'use client';

import { useState } from 'react';

const TABS = [
  { id: 'beginner', label: '🟢 Cơ bản' },
  { id: 'intermediate', label: '🟡 Trung cấp' },
  { id: 'advanced', label: '🔴 Nâng cao' },
];

const MOCK_LESSONS: Record<string, { id: string; title: string; desc: string }[]> = {
  beginner: [
    { id: '1', title: 'Basic Greetings', desc: 'Chào hỏi cơ bản' },
    { id: '2', title: 'Numbers & Colors', desc: 'Số và màu sắc' },
  ],
  intermediate: [
    { id: '3', title: 'Daily Conversations', desc: 'Hội thoại hàng ngày' },
    { id: '4', title: 'Travel English', desc: 'Tiếng Anh du lịch' },
  ],
  advanced: [
    { id: '5', title: 'Business English', desc: 'Tiếng Anh thương mại' },
    { id: '6', title: 'Academic Writing', desc: 'Viết học thuật' },
  ],
};

export default function LessonsTabs() {
  const [activeTab, setActiveTab] = useState('beginner');
  const lessons = MOCK_LESSONS[activeTab] ?? [];

  return (
    <div>
      {/* Tab Bar */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={[
              'px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors -mb-px border-b-2',
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-800',
            ].join(' ')}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Lesson Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {lessons.map((lesson) => (
          <div
            key={lesson.id}
            className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
          >
            <h3 className="font-semibold text-gray-900 mb-1">{lesson.title}</h3>
            <p className="text-sm text-gray-500">{lesson.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
