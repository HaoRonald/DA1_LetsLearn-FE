import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Dashboard' };

export default function DashboardPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        {[
          { label: 'Bài học đã hoàn thành', value: '12', color: 'text-blue-600' },
          { label: 'Từ vựng đã học', value: '248', color: 'text-green-600' },
          { label: 'Ngày học liên tiếp', value: '7', color: 'text-orange-600' },
          { label: 'Điểm trung bình', value: '86%', color: 'text-purple-600' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm"
          >
            <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
            <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Bài học gần đây</h2>
        <p className="text-gray-400 text-sm">Chưa có bài học nào. Hãy bắt đầu ngay!</p>
      </div>
    </div>
  );
}
