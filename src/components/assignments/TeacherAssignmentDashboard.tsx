import { TopicResponse } from "@/services/courseService";
import { Filter, Activity, Users } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface TeacherAssignmentDashboardProps {
  assignment: TopicResponse;
}

export function TeacherAssignmentDashboard({
  assignment,
}: TeacherAssignmentDashboardProps) {
  // Use real data from topic, but fall back to rich dummy data for better visualization
  const assignmentData = {
    assignedCount: 25,
    submittedCount: 18,
    gradedCount: 12,
    totalFiles: 32,
    avgMark: 8.4,
    topMark: 10,
    ...(assignment.data || {})
  };

  const completionRate =
    assignmentData.assignedCount > 0
      ? Math.round(
          (assignmentData.submittedCount / assignmentData.assignedCount) * 100,
        )
      : 0;

  // Mock data for charts
  const fileTypeData = [
    { name: 'PDF', value: 12, color: '#EF4444' },
    { name: 'DOCX', value: 8, color: '#3B82F6' },
    { name: 'ZIP', value: 12, color: '#F97316' },
  ];

  const gradeDistributionData = [
    { name: 'S (80-100%)', value: 5, color: '#22C55E', badge: 'S', range: '80 - 100%' },
    { name: 'A (50-79%)', value: 13, color: '#3B82F6', badge: 'A', range: '50 - 79%' },
    { name: 'B (20-49%)', value: 4, color: '#F97316', badge: 'B', range: '20 - 49%' },
    { name: 'C (0-19%)', value: 3, color: '#EF4444', badge: 'C', range: '0 - 19%' },
  ];

  return (
    <div className="bg-white rounded-xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] border border-[#E5E7EB] p-4 md:p-8 mb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-600 shrink-0">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-[#1F2937] font-black text-[20px] md:text-[24px]">Statistics</h2>
            <p className="text-[13px] md:text-[14px] text-gray-400 font-medium tracking-tight">Student progression</p>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-start gap-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl px-4 md:px-6 py-3">
          <div className="flex flex-col">
             <span className="text-[10px] md:text-[11px] font-black text-gray-400 uppercase">Subscribers</span>
             <span className="text-[14px] md:text-[16px] font-black text-[#374151] whitespace-nowrap">{assignmentData.assignedCount || 0} Students</span>
          </div>
          <div className="flex -space-x-3 ml-2 shrink-0">
            {[1, 2, 3, 4].map((i) => (
              <img
                key={i}
                src={`https://ui-avatars.com/api/?name=Stu${i}&background=random`}
                className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 md:border-4 border-white shadow-sm object-cover"
                alt=""
              />
            ))}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 md:gap-8 border-b border-[#F3F4F6] pb-10 mb-10">
        {[
          { label: 'Submissions', value: assignmentData.submittedCount, color: 'text-blue-600' },
          { label: 'Graded', value: assignmentData.gradedCount, color: 'text-purple-600' },
          { label: 'Files', value: assignmentData.totalFiles, color: 'text-orange-500' },
          { label: 'Avg Mark', value: (assignmentData.avgMark || 0).toFixed(1), color: 'text-green-600' },
          { label: 'Top Mark', value: (assignmentData.topMark || 0).toFixed(1), color: 'text-pink-600' },
          { label: 'Completion', value: `${completionRate}%`, color: 'text-indigo-600' }
        ].map((kpi, idx) => (
          <div key={idx} className="flex flex-col items-center bg-gray-50/50 p-4 rounded-3xl md:bg-transparent md:p-0">
            <p className="text-[10px] md:text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 md:mb-3">
              {kpi.label}
            </p>
            <p className={`text-[24px] md:text-[36px] font-black leading-none ${kpi.color}`}>
              {kpi.value}
            </p>
          </div>
        ))}
      </div>

      {/* Charts Implementation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10 mb-12">
        {/* File Type Chart */}
        <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6 md:p-8 shadow-sm">
          <h3 className="text-[#374151] font-black text-[16px] md:text-[18px] mb-8">
            Submission Formats
          </h3>
          <div className="flex flex-col sm:flex-row items-center gap-6">
             <div className="w-[180px] h-[180px] relative shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={fileTypeData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={5} dataKey="value">
                      {fileTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                   <p className="text-[9px] text-gray-400 font-bold uppercase">Files</p>
                   <p className="text-[18px] font-black text-[#1F2937]">{assignmentData.totalFiles}</p>
                </div>
             </div>
             <div className="w-full space-y-4">
                {fileTypeData.map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                       <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                       <span className="text-[13px] font-bold text-gray-500">{item.name}</span>
                    </div>
                    <span className="text-[14px] font-black text-[#374151]">{item.value}</span>
                  </div>
                ))}
             </div>
          </div>
        </div>

        {/* Grading Chart */}
        <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6 md:p-8 shadow-sm">
          <h3 className="text-[#374151] font-black text-[16px] md:text-[18px] mb-8">
            Grade Distribution
          </h3>
          <div className="flex flex-col sm:flex-row items-center gap-6">
             <div className="w-[180px] h-[180px] relative shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={gradeDistributionData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={5} dataKey="value">
                      {gradeDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center text-[#1F2937] pointer-events-none">
                   <p className="text-[9px] text-gray-400 font-bold uppercase">Students</p>
                   <p className="text-[18px] font-black">{assignmentData.assignedCount}</p>
                </div>
             </div>
             <div className="w-full space-y-3">
                {gradeDistributionData.map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                       <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                       <span className="text-[13px] font-bold text-gray-500">{item.name.split(' ')[0]}</span>
                    </div>
                    <span className="text-[14px] font-black text-[#374151]">{item.value}</span>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </div>

      {/* Grading Detail List */}
      <div className="pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-[#1F2937] font-black text-[18px] md:text-[20px]">Performance Breakdown</h3>
          <button className="p-2 md:p-3 bg-[#F9FAFB] border border-[#E5E7EB] text-gray-500 rounded-xl hover:bg-gray-100 transition-all">
            <Filter className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-4">
          {gradeDistributionData.map((item, i) => (
            <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 md:p-5 bg-white border border-[#F3F4F6] rounded-2xl hover:border-gray-300 transition-all shadow-sm gap-4">
              <div className="flex items-center gap-4 md:gap-8">
                <div className="flex items-center gap-4 w-auto sm:w-[180px] shrink-0">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center text-white font-black text-[14px] md:text-[16px] shadow-sm shrink-0" style={{ backgroundColor: item.color }}>
                    {item.badge}
                  </div>
                  <div>
                    <span className="text-[14px] md:text-[15px] font-black block leading-none mb-1" style={{ color: item.color }}>{item.range}</span>
                    <span className="text-[11px] text-gray-400 font-bold uppercase leading-none">Group</span>
                  </div>
                </div>
                <div className="hidden sm:block w-px h-8 bg-gray-100" />
                <div className="flex items-center gap-2">
                  <span className="text-[16px] md:text-[18px] font-black text-[#1F2937] leading-none">{item.value}</span>
                  <span className="text-[13px] md:text-[14px] text-gray-400 font-bold">Students</span>
                </div>
              </div>
              <div className="flex -space-x-3 self-end sm:self-auto">
                {[1, 2, 3, 4].slice(0, Math.min(4, item.value)).map((i) => (
                  <img
                    key={i}
                    src={`https://ui-avatars.com/api/?name=Stu${i}&background=random`}
                    className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 md:border-4 border-white shadow-sm object-cover"
                    alt=""
                  />
                ))}
                {item.value > 4 && (
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-[#EFF6FF] text-[#3B82F6] border-2 md:border-4 border-white flex items-center justify-center text-[10px] md:text-[12px] font-black">
                    +{item.value - 4}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
