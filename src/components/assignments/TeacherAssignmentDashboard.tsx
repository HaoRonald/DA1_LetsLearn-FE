import { TopicResponse } from "@/services/courseService";
import { Filter } from "lucide-react";
import { Activity } from "react";

interface TeacherAssignmentDashboardProps {
  assignment: TopicResponse;
}

export function TeacherAssignmentDashboard({
  assignment,
}: TeacherAssignmentDashboardProps) {
  const assignmentData = assignment.data || {};
  const completionRate =
    assignmentData.assignedCount > 0
      ? Math.round(
          (assignmentData.submittedCount / assignmentData.assignedCount) * 100,
        )
      : 0;

  return (
    <div className="bg-white rounded-xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] border border-[#E5E7EB] p-6 mb-12">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
            <Activity className="w-5 h-5" />
          </div>
          <h2 className="text-[#374151] font-bold text-[22px]">Dashboard</h2>
        </div>

        <div className="flex items-center gap-4 border border-[#E5E7EB] rounded-full px-4 py-1.5 shadow-sm">
          <span className="text-[13px] font-bold text-gray-500">Students</span>
          <span className="bg-gray-100 text-gray-600 px-2 rounded font-bold text-[12px]">
            {assignmentData.assignedCount || 0}
          </span>
          <div className="flex -space-x-2 ml-2">
            {[1, 2, 3, 4].map((i) => (
              <img
                key={i}
                src={`https://ui-avatars.com/api/?name=${i}&background=random`}
                className="w-6 h-6 rounded-full border-2 border-white"
                alt=""
              />
            ))}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-6 border-b border-[#E5E7EB] pb-8 mb-8">
        <div className="text-center">
          <p className="text-[12px] font-bold text-gray-500 uppercase tracking-wider mb-2">
            Submissions
          </p>
          <p className="text-[32px] font-black text-[#374151] leading-none">
            {assignmentData.submittedCount || 0}
          </p>
        </div>
        <div className="text-center">
          <p className="text-[12px] font-bold text-gray-500 uppercase tracking-wider mb-2">
            Graded
          </p>
          <p className="text-[32px] font-black text-[#374151] leading-none">
            {assignmentData.gradedCount || 0}
          </p>
        </div>
        <div className="text-center">
          <p className="text-[12px] font-bold text-gray-500 uppercase tracking-wider mb-2">
            Total files
          </p>
          <p className="text-[32px] font-black text-[#374151] leading-none">
            {assignmentData.totalFiles || 0}
          </p>
        </div>
        <div className="text-center">
          <p className="text-[12px] font-bold text-gray-500 uppercase tracking-wider mb-2">
            Avg mark
          </p>
          <p className="text-[32px] font-black text-[#374151] leading-none">
            {assignmentData.avgMark || 0}
          </p>
        </div>
        <div className="text-center">
          <p className="text-[12px] font-bold text-gray-500 uppercase tracking-wider mb-2">
            Top mark
          </p>
          <p className="text-[32px] font-black text-[#374151] leading-none">
            {assignmentData.topMark || 0}
          </p>
        </div>
        <div className="text-center">
          <p className="text-[12px] font-bold text-gray-500 uppercase tracking-wider mb-2">
            Completion
          </p>
          <p className="text-[32px] font-black text-[#374151] leading-none">
            {completionRate}%
          </p>
        </div>
      </div>

      {/* Charts placeholder */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <div className="border border-[#E5E7EB] rounded-2xl p-6 flex flex-col items-center justify-center h-64 bg-gray-50/50">
          <h3 className="text-[#F97316] font-bold mb-4 self-start">
            File type submission
          </h3>
          <div className="flex-1 flex items-center justify-center text-gray-400 italic font-medium">
            [Donut Chart Placeholder: .zip, .docx, .pdf]
          </div>
        </div>
        <div className="border border-[#E5E7EB] rounded-2xl p-6 flex flex-col items-center justify-center h-64 bg-gray-50/50">
          <h3 className="text-[#F97316] font-bold mb-4 self-start">
            Graded assignments
          </h3>
          <div className="flex-1 flex items-center justify-center text-gray-400 italic font-medium">
            [Donut Chart Placeholder: Points Distribution]
          </div>
        </div>
      </div>

      {/* Grading table */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[#F97316] font-bold">Grading</h3>
          <button className="p-2 border border-[#E5E7EB] text-gray-500 rounded-lg hover:bg-gray-50">
            <Filter className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 border border-[#E5E7EB] rounded-xl">
            <div className="flex items-center gap-4">
              <span className="w-8 h-8 rounded bg-green-100 text-green-600 flex items-center justify-center font-bold text-[14px]">
                S
              </span>
              <span className="w-24 text-[14px] font-bold text-green-500">
                80 - 100%
              </span>
              <span className="text-gray-300 border-l border-gray-200 pl-4 py-1 text-[14px]">
                <span className="text-gray-600 bg-gray-100 px-2 py-0.5 rounded mr-1 font-bold">
                  5
                </span>{" "}
                Students
              </span>
            </div>
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map((i) => (
                <img
                  key={i}
                  src={`https://ui-avatars.com/api/?name=St${i}&background=random`}
                  className="w-8 h-8 rounded-full border-2 border-white"
                  alt=""
                />
              ))}
              <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-500 border-2 border-white flex flex-col items-center justify-center text-[11px] font-bold">
                +1
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 border border-[#E5E7EB] rounded-xl">
            <div className="flex items-center gap-4">
              <span className="w-8 h-8 rounded bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-[14px]">
                A
              </span>
              <span className="w-24 text-[14px] font-bold text-blue-500">
                50 - 79%
              </span>
              <span className="text-gray-300 border-l border-gray-200 pl-4 py-1 text-[14px]">
                <span className="text-gray-600 bg-gray-100 px-2 py-0.5 rounded mr-1 font-bold">
                  15
                </span>{" "}
                Students
              </span>
            </div>
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map((i) => (
                <img
                  key={i}
                  src={`https://ui-avatars.com/api/?name=St${i}&background=random`}
                  className="w-8 h-8 rounded-full border-2 border-white"
                  alt=""
                />
              ))}
              <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-500 border-2 border-white flex flex-col items-center justify-center text-[11px] font-bold">
                +16
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
