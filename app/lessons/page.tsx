import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Bài học' };

// Tab interface mẫu dùng URL search params (server-side friendly)
export default function LessonsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  // Trong Next.js app router, searchParams là Promise — unwrap trong client component
  // Tại đây dùng 'use client' tab component riêng
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Bài học</h1>
      <p className="text-gray-500 mb-8">Chọn bài học phù hợp với trình độ của bạn</p>
      <LessonsTabSection />
    </div>
  );
}

// Separated to demonstrate tab pattern
function LessonsTabSection() {
  // Đây là Server Component — import TabsClient nếu cần interactivity
  return (
    <div>
      {/* Tabs sẽ implement ở LessonsTabsClient (Client Component) */}
      <p className="text-sm text-gray-400">
        👉 Xem <code>app/lessons/_components/LessonsTabs.tsx</code> để học cách làm tab với
        &quot;use client&quot;.
      </p>
    </div>
  );
}
