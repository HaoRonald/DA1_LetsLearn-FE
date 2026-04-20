import React, { useEffect, useState } from "react";
import { TopicResponse } from "@/services/courseService";
import { Filter, Loader2, FileText, CheckCircle2, XCircle, ExternalLink } from "lucide-react";
import { topicApi } from "@/services/topicService";

interface TeacherAssignmentSubmissionsProps {
  assignment: TopicResponse;
  courseId: string;
}

interface StudentSubmission {
  student: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
    email?: string;
  };
  submitted: boolean;
  mark?: number;
  responseId?: string;
  // We can enrich this with more data if needed
}

export function TeacherAssignmentSubmissions({
  assignment,
  courseId,
}: TeacherAssignmentSubmissionsProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [submissions, setSubmissions] = useState<StudentSubmission[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const assignmentData = assignment.data || {};

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const response = await topicApi.getAssignmentReport(courseId, assignment.id);
        if (response.data && response.data.studentMarks) {
          setSubmissions(response.data.studentMarks);
        }
      } catch (error) {
        console.error("Failed to fetch submissions:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubmissions();
  }, [courseId, assignment.id]);

  const filteredSubmissions = submissions.filter(s => 
    `${s.student.firstName} ${s.student.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white rounded-xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] border border-[#E5E7EB] p-6 mb-12 flex flex-col md:flex-row gap-8 min-h-[500px]">
      {/* Left side: Student List */}
      <div className="flex-1">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-[#F97316] font-bold text-[20px]">
            Submissions
          </h2>
          <span className="text-[14px] text-[#6B7280]">
            Total students: <span className="font-bold text-[#374151]">{submissions.length}</span>
          </span>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <input
            type="text"
            placeholder="Search student name"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 border border-[#E5E7EB] rounded-lg px-4 py-2 text-[14px] focus:outline-none focus:border-[#F97316]"
          />
          <button className="flex items-center gap-2 border border-[#E5E7EB] bg-gray-50 hover:bg-gray-100 text-[#374151] font-bold text-[14px] px-4 py-2 rounded-lg">
            <Filter className="w-4 h-4" /> Filter
          </button>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#F97316] mb-4" />
            <p className="text-[#6B7280] text-[14px]">Loading submissions...</p>
          </div>
        ) : filteredSubmissions.length > 0 ? (
          <div className="border border-[#E5E7EB] rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                  <th className="p-4 text-[13px] font-bold text-[#374151] uppercase tracking-wider">Student</th>
                  <th className="p-4 text-[13px] font-bold text-[#374151] uppercase tracking-wider">Status</th>
                  <th className="p-4 text-[13px] font-bold text-[#374151] uppercase tracking-wider">Grade</th>
                  <th className="p-4 text-[13px] font-bold text-[#374151] uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {filteredSubmissions.map((item) => (
                  <tr key={item.student.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img 
                          src={item.student.avatarUrl || `https://ui-avatars.com/api/?name=${item.student.firstName}+${item.student.lastName}&background=random`} 
                          alt="Avatar" 
                          className="w-10 h-10 rounded-full border border-gray-100"
                        />
                        <div>
                          <p className="text-[14px] font-bold text-[#1F2937]">{item.student.firstName} {item.student.lastName}</p>
                          <p className="text-[12px] text-[#6B7280]">{item.student.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      {item.submitted ? (
                        <div className="flex items-center gap-1.5 text-green-600 font-bold text-[13px]">
                          <CheckCircle2 className="w-4 h-4" />
                          Submitted
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-gray-400 font-medium text-[13px]">
                          <XCircle className="w-4 h-4" />
                          Not submitted
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-[14px]">
                      {item.mark != null ? (
                        <span className="font-bold text-blue-600 px-2 py-1 bg-blue-50 rounded italic">
                          {item.mark}/10.0
                        </span>
                      ) : (
                        <span className="text-[#9CA3AF]">—</span>
                      )}
                    </td>
                    <td className="p-4">
                      {item.submitted ? (
                        <button className="flex items-center gap-1.5 text-[#3B82F6] hover:text-blue-700 font-bold text-[13px]">
                          <ExternalLink className="w-4 h-4" />
                          View
                        </button>
                      ) : (
                        <button className="text-gray-300 cursor-not-allowed font-bold text-[13px]" disabled>
                          View
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="border border-[#E5E7EB] rounded-xl overflow-hidden p-20 text-center">
            <FileText className="w-12 h-12 text-[#E5E7EB] mx-auto mb-4" />
            <p className="text-[#9CA3AF] text-[15px]">No submissions found.</p>
          </div>
        )}
      </div>

      {/* Right side: Status info */}
      <div className="md:w-1/3 border-l border-[#E5E7EB] pl-0 md:pl-8">
        <div className="mb-8">
          <p className="text-[14px] text-[#6B7280] mb-2">
            <span className="font-bold text-[#374151]">Open:</span>{" "}
            {assignmentData.open
              ? new Date(assignmentData.open).toLocaleString()
              : "Not set"}
          </p>
          <p className="text-[14px] text-[#6B7280]">
            <span className="font-bold text-[#374151]">Due:</span>{" "}
            {assignmentData.close
              ? new Date(assignmentData.close).toLocaleString()
              : "Not set"}
          </p>
        </div>

        <hr className="border-[#E5E7EB] mb-6" />

        <h3 className="text-[#6366F1] font-bold text-[18px] mb-4">Status</h3>
        <div className="flex gap-8 mb-8">
          <div>
            <p className="text-[24px] font-bold text-[#1F2937] leading-none mb-1">
              {submissions.filter(s => s.submitted).length}
            </p>
            <p className="text-[14px] text-[#6B7280]">Submitted</p>
          </div>
          <div>
            <p className="text-[24px] font-bold text-[#1F2937] leading-none mb-1">
              {submissions.length}
            </p>
            <p className="text-[14px] text-[#6B7280]">Total</p>
          </div>
        </div>

        <h3 className="text-[#6366F1] font-bold text-[18px] mb-2">
          Assignment Description
        </h3>
        <p className="text-[14px] text-[#4B5563]">
          {assignmentData.description || "No description provided."}
        </p>
      </div>
    </div>
  );
}
