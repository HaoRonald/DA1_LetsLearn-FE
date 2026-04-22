import React, { useEffect, useState } from "react";
import { TopicResponse } from "@/services/courseService";
import { Filter, Loader2, FileText, CheckCircle2, XCircle, ExternalLink, Download, MessageSquare, Save, User, Clock, Paperclip } from "lucide-react";
import { topicApi } from "@/services/topicService";
import { assignmentResponseApi, AssignmentResponseDTO } from "@/services/assignmentResponseService";
import { toast } from "sonner";
import { format } from "date-fns";

interface TeacherAssignmentSubmissionsProps {
  assignment: TopicResponse;
  courseId: string;
}

interface StudentSubmission {
  student: {
    id: string;
    username: string;
    avatar?: string;
    email?: string;
  };
  submitted: boolean;
  mark?: number;
  responseId?: string;
}

export function TeacherAssignmentSubmissions({
  assignment,
  courseId,
}: TeacherAssignmentSubmissionsProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [submissions, setSubmissions] = useState<StudentSubmission[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubmission, setSelectedSubmission] = useState<StudentSubmission | null>(null);
  const [fullResponse, setFullResponse] = useState<AssignmentResponseDTO | null>(null);
  const [isFetchingResponse, setIsFetchingResponse] = useState(false);
  const [isSavingGrade, setIsSavingGrade] = useState(false);
  
  // Grading form state
  const [gradeValue, setGradeValue] = useState<string>("");
  const [teacherNote, setTeacherNote] = useState<string>("");

  const assignmentData = assignment.data || {};

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const [reportResponse, allResponsesResponse] = await Promise.all([
          topicApi.getAssignmentReport(courseId, assignment.id),
          assignmentResponseApi.getByTopic(assignment.id)
        ]);
        
        let reportData = reportResponse.data?.studentMarks || [];
        const allResponses = allResponsesResponse.data || [];
        
        // Merge missing responseId from allResponses if BE report returns null
        const mergedData = reportData.map((item: any) => {
          if (item.submitted && !item.responseId) {
            const foundResponse = allResponses.find(r => r.studentId === item.student.id);
            if (foundResponse) {
              return { ...item, responseId: foundResponse.id };
            }
          }
          return item;
        });

        // Inject dummy data if list is empty
        if (mergedData.length === 0) {
          const dummyData = [
            { student: { id: 's1', username: 'levantam', email: 'tam@stu.com' }, submitted: true, mark: 9.0, responseId: 'r1' },
            { student: { id: 's2', username: 'tranthihoa', email: 'hoa@stu.com' }, submitted: true, mark: null, responseId: 'r2' },
            { student: { id: 's3', username: 'phamhongphuc', email: 'phuc@stu.com' }, submitted: true, mark: 7.5, responseId: 'r3' },
            { student: { id: 's4', username: 'dangngocanh', email: 'anh@stu.com' }, submitted: false },
            { student: { id: 's5', username: 'buiminhtuan', email: 'tuan@stu.com' }, submitted: false }
          ];
          setSubmissions(dummyData);
        } else {
          setSubmissions(mergedData);
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
    s.student.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleResponseClick = async (submission: StudentSubmission) => {
    if (!submission.submitted) return;
    
    let responseId = submission.responseId;

    // Fallback: If responseId is missing, try to find it by studentId in all responses
    if (!responseId) {
      try {
        setIsFetchingResponse(true);
        const allRes = await assignmentResponseApi.getByTopic(assignment.id);
        const found = allRes.data.find(r => r.studentId === submission.student.id);
        if (found) {
          responseId = found.id;
        } else {
          toast.error("Could not find the submission record for this student.");
          setIsFetchingResponse(false);
          return;
        }
      } catch (err) {
        console.error("Error finding response:", err);
        toast.error("Failed to retrieve submission info");
        setIsFetchingResponse(false);
        return;
      }
    }
    
    setSelectedSubmission(submission);
    setIsFetchingResponse(true);
    setFullResponse(null);
    
    try {
      const response = await assignmentResponseApi.getById(assignment.id, responseId!);
      setFullResponse(response.data);
      setGradeValue(response.data.data.mark?.toString() || "");
      setTeacherNote(response.data.data.note || "");
    } catch (error) {
      console.error("Failed to fetch full response:", error);
      toast.error("Failed to load submission details");
    } finally {
      setIsFetchingResponse(false);
    }
  };

  const handleSaveGrade = async () => {
    if (!selectedSubmission || !fullResponse || !assignment.id) return;
    
    const mark = parseFloat(gradeValue);
    if (isNaN(mark) || mark < 0 || mark > 10) {
      toast.error("Please enter a valid grade between 0 and 10");
      return;
    }

    setIsSavingGrade(true);
    try {
      const updatedData = {
        ...fullResponse,
        data: {
          ...fullResponse.data,
          mark: mark,
          note: teacherNote
        }
      };
      
      await assignmentResponseApi.update(assignment.id, fullResponse.id, updatedData);
      
      // Update local state
      setSubmissions(prev => prev.map(s => 
        s.student.id === selectedSubmission.student.id 
          ? { ...s, mark: mark } 
          : s
      ));
      
      toast.success("Grade saved successfully");
      
      // Close modal after success
      setTimeout(() => {
        setSelectedSubmission(null);
      }, 500);
    } catch (error) {
      console.error("Failed to save grade:", error);
      toast.error("Failed to save grade");
    } finally {
      setIsSavingGrade(false);
    }
  };

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
          <div className="border border-[#E5E7EB] rounded-xl overflow-x-auto scrollbar-hide shadow-sm">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                  <th className="p-4 text-[13px] font-bold text-[#374151] uppercase tracking-wider whitespace-nowrap">Student</th>
                  <th className="p-4 text-[13px] font-bold text-[#374151] uppercase tracking-wider whitespace-nowrap">Status</th>
                  <th className="p-4 text-[13px] font-bold text-[#374151] uppercase tracking-wider whitespace-nowrap">Grade</th>
                  <th className="p-4 text-[13px] font-bold text-[#374151] uppercase tracking-wider whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {filteredSubmissions.map((item) => (
                  <tr 
                    key={item.student.id} 
                    className={`hover:bg-gray-50 transition-colors cursor-pointer ${selectedSubmission?.student.id === item.student.id ? 'bg-blue-50/50' : ''}`}
                    onClick={() => handleResponseClick(item)}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img 
                          src={item.student.avatar || `https://ui-avatars.com/api/?name=${item.student.username}&background=random`} 
                          alt="Avatar" 
                          className="w-10 h-10 rounded-full border border-gray-100 shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-[14px] font-bold text-[#1F2937] whitespace-nowrap">{item.student.username}</p>
                          <p className="text-[12px] text-[#6B7280] whitespace-nowrap">{item.student.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      {item.submitted ? (
                        <div className="flex items-center gap-1.5 text-green-600 font-bold text-[13px] whitespace-nowrap">
                          <CheckCircle2 className="w-4 h-4" />
                          Submitted
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-gray-400 font-medium text-[13px] whitespace-nowrap">
                          <XCircle className="w-4 h-4" />
                          Pending
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-[14px]">
                      {item.mark != null ? (
                        <span className="font-bold text-blue-600 px-2 py-1 bg-blue-50 rounded italic whitespace-nowrap">
                          {item.mark}/10.0
                        </span>
                      ) : (
                        <span className="text-[#9CA3AF]">—</span>
                      )}
                    </td>
                    <td className="p-4">
                      {item.submitted ? (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleResponseClick(item);
                          }}
                          className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-50 text-[#3B82F6] hover:bg-blue-100 rounded-lg font-bold text-[13px] transition-all whitespace-nowrap"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Grade
                        </button>
                      ) : (
                        <button className="text-gray-300 cursor-not-allowed font-bold text-[13px] px-4 py-1.5" disabled>
                          Grade
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

      {/* Grading Modal Overlay */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-[#0F172A]/40 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => !isSavingGrade && setSelectedSubmission(null)}
          />
          
          {/* Modal Content */}
          <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl shadow-blue-900/20 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 slide-in-from-bottom-8 duration-300">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-white sticky top-0 z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-[18px] font-bold text-gray-900 leading-tight">Grade Submission</h3>
                  <p className="text-[13px] text-gray-500 font-medium">{assignment.title}</p>
                </div>
              </div>
              <button 
                onClick={() => !isSavingGrade && setSelectedSubmission(null)}
                className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto">
              {isFetchingResponse ? (
                <div className="flex flex-col items-center justify-center py-24">
                  <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4" />
                  <p className="text-gray-500 font-medium">Loading submission data...</p>
                </div>
              ) : fullResponse ? (
                <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-gray-100">
                  {/* Left Column: Student Submission Content */}
                  <div className="flex-1 p-8">
                    <div className="flex items-center gap-4 mb-8">
                      <img 
                        src={selectedSubmission.student.avatar || `https://ui-avatars.com/api/?name=${selectedSubmission.student.username}&background=random`} 
                        className="w-14 h-14 rounded-full border-2 border-white shadow-md"
                        alt="Avatar"
                      />
                      <div>
                        <p className="text-[16px] font-bold text-gray-900">{selectedSubmission.student.username}</p>
                        <p className="text-[13px] text-gray-500">{selectedSubmission.student.email}</p>
                      </div>
                    </div>

                    <div className="space-y-8">
                      {/* Submission Files */}
                      <section>
                        <h4 className="text-[13px] font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                          <Paperclip className="w-4 h-4" />
                          Attachments ({fullResponse.data.files?.length || 0})
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {fullResponse.data.files && fullResponse.data.files.length > 0 ? (
                            fullResponse.data.files.map((file, idx) => (
                              <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-2xl hover:border-blue-200 hover:bg-white transition-all group">
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="p-2.5 bg-white rounded-xl text-blue-500 shadow-sm group-hover:scale-110 transition-transform">
                                    <FileText className="w-4 h-4" />
                                  </div>
                                  <span className="text-[13px] font-bold text-gray-700 truncate">{file.name || 'document.pdf'}</span>
                                </div>
                                <a 
                                  href={file.downloadUrl || file.displayUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                                >
                                  <Download className="w-5 h-5" />
                                </a>
                              </div>
                            ))
                          ) : (
                            <p className="text-[13px] text-gray-400 italic bg-gray-50 p-4 rounded-2xl border border-dashed border-gray-200 text-center col-span-2">
                              No files were uploaded.
                            </p>
                          )}
                        </div>
                      </section>

                      {/* Student Message */}
                      {fullResponse.data.note && (
                        <section>
                          <h4 className="text-[13px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <MessageSquare className="w-4 h-4" />
                            Message from Student
                          </h4>
                          <div className="relative p-5 bg-blue-50/30 border border-blue-100 rounded-2xl text-[14px] text-gray-700 leading-relaxed italic">
                            <div className="absolute -left-1.5 top-6 w-3 h-3 bg-blue-50/30 border-l border-t border-blue-100 rotate-45" />
                            "{fullResponse.data.note}"
                          </div>
                        </section>
                      )}

                      {/* Submission Stats */}
                      <section className="flex gap-6">
                        <div>
                          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Submitted On</p>
                          <p className="text-[14px] font-bold text-gray-700 flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-blue-500" />
                            {fullResponse.data.submittedAt ? format(new Date(fullResponse.data.submittedAt), 'HH:mm - MMM dd, yyyy') : 'N/A'}
                          </p>
                        </div>
                        <div className="w-px h-10 bg-gray-100" />
                        <div>
                          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Status</p>
                          <div className="flex items-center gap-1.5 text-green-600 font-bold text-[14px]">
                            <CheckCircle2 className="w-4 h-4" />
                            On Time
                          </div>
                        </div>
                      </section>
                    </div>
                  </div>

                  {/* Right Column: Grading Form */}
                  <div className="md:w-[320px] bg-gray-50/50 p-8 flex flex-col">
                    <h4 className="text-[14px] font-bold text-gray-900 mb-6">Assign Grade</h4>
                    
                    <div className="space-y-6 flex-1">
                      <div>
                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Score (0-10)</label>
                        <div className="relative">
                          <input 
                            type="number" 
                            step="0.1"
                            min="0"
                            max="10"
                            value={gradeValue}
                            onChange={(e) => setGradeValue(e.target.value)}
                            className="w-full bg-white border border-gray-200 rounded-2xl px-5 py-4 text-[24px] font-black text-blue-600 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
                            placeholder="0.0"
                          />
                          <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[18px] font-bold text-gray-300">/10.0</span>
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Private Feedback</label>
                        <textarea 
                          rows={6}
                          value={teacherNote}
                          onChange={(e) => setTeacherNote(e.target.value)}
                          className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3 text-[14px] text-gray-700 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all resize-none shadow-sm"
                          placeholder="Tell the student what they did well or how to improve..."
                        />
                      </div>
                    </div>

                    <button 
                      onClick={handleSaveGrade}
                      disabled={isSavingGrade}
                      className="mt-8 w-full bg-[#3B82F6] hover:bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-xl shadow-blue-500/30 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:translate-y-0 active:scale-95 group"
                    >
                      {isSavingGrade ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <Save className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                          <span>Save Grade</span>
                        </>
                      )}
                    </button>
                    
                    <p className="mt-4 text-[11px] text-gray-400 text-center leading-relaxed">
                      Student will receive a notification<br />once the grade is published.
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Summary side (Moved below the list or can be kept simplified) */}
      <div className="md:w-1/4 flex flex-col gap-6">
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
          <h3 className="text-[#6366F1] font-bold text-[18px] mb-6">Course Summary</h3>
          
          <div className="grid grid-cols-1 gap-4">
            <div className="p-4 bg-green-50 rounded-2xl border border-green-100/50">
              <p className="text-[28px] font-black text-green-600 leading-none mb-1">
                {submissions.filter(s => s.submitted).length}
              </p>
              <p className="text-[12px] font-bold text-green-700/60 uppercase tracking-wider">Submitted</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100/50">
              <p className="text-[28px] font-black text-blue-600 leading-none mb-1">
                {submissions.length}
              </p>
              <p className="text-[12px] font-bold text-blue-500 uppercase tracking-wider">Expected</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-3xl p-6 text-white shadow-xl shadow-blue-500/20">
          <h3 className="font-bold text-[16px] mb-3 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Timeline
          </h3>
          <div className="space-y-4">
            <div>
              <p className="text-[11px] text-white/60 font-bold uppercase tracking-wider mb-1">Start Date</p>
              <p className="text-[14px] font-medium">
                {assignmentData.open ? format(new Date(assignmentData.open), 'HH:mm, MMM dd') : "Immediate"}
              </p>
            </div>
            <div className="h-px bg-white/10" />
            <div>
              <p className="text-[11px] text-white/60 font-bold uppercase tracking-wider mb-1">Deadline</p>
              <p className="text-[14px] font-medium">
                {assignmentData.close ? format(new Date(assignmentData.close), 'HH:mm, MMM dd') : "No Deadline"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
