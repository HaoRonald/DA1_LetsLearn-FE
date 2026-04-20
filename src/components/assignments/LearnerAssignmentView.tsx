import React, { useEffect, useRef, useState } from 'react';
import { 
  CornerDownLeft, MoreVertical, Send, UploadCloud, Paperclip, Loader2, CheckCircle2 
} from 'lucide-react';
import { toast } from 'sonner';

import { TopicResponse } from '@/services/courseService';
import { assignmentResponseApi, AssignmentResponseDTO } from '@/services/assignmentResponseService';

interface LearnerAssignmentViewProps {
  assignment: TopicResponse;
}

export function LearnerAssignmentView({ assignment }: LearnerAssignmentViewProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [myResponse, setMyResponse] = useState<AssignmentResponseDTO | null>(null);
  
  // Selection state
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [note, setNote] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSaving, setIsSaving] = useState(false);

  const assignmentData = assignment.data || {};

  useEffect(() => {
    const fetchMySubmission = async () => {
      try {
        const response = await assignmentResponseApi.getByTopic(assignment.id);
        // Backend might return a list, usually one for the current student
        if (Array.isArray(response.data) && response.data.length > 0) {
          setMyResponse(response.data[0]);
        }
      } catch (error) {
        console.error("Failed to fetch submission:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMySubmission();
  }, [assignment.id]);

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = async () => {
    setIsSaving(true);
    try {
      // For now, we simulate file upload results or use mock data
      // In a real app, you'd upload to Cloudinary/S3 first
      const mockFiles = selectedFiles.map(f => ({
        name: f.name,
        displayUrl: "#", // Placeholder
        downloadUrl: "#" // Placeholder
      }));

      const payload = {
        topicId: assignment.id,
        submittedAt: new Date().toISOString(),
        cloudinaryFiles: mockFiles,
        note: note
      };

      await assignmentResponseApi.create(assignment.id, payload);
      toast.success("Assignment submitted successfully!");
      
      // Refresh state
      const refreshed = await assignmentResponseApi.getByTopic(assignment.id);
      if (Array.isArray(refreshed.data) && refreshed.data.length > 0) {
        setMyResponse(refreshed.data[0]);
      }
      setIsSubmitting(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to submit assignment");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#06B6D4]" />
      </div>
    );
  }

  return (
    <div className="bg-transparent w-full">
      {/* Main Card */}
      <div className="bg-white rounded-xl shadow-md border border-[#E5E7EB] p-6 mb-6">
        
        <div className="flex flex-col gap-2 mb-6">
          <p className="text-[14px] text-[#6B7280]">
            <span className="font-bold text-[#374151]">Open:</span> {assignmentData.open ? new Date(assignmentData.open).toLocaleString() : 'Not set'}
          </p>
          <p className="text-[14px] text-[#6B7280]">
            <span className="font-bold text-[#374151]">Due:</span> {assignmentData.close ? new Date(assignmentData.close).toLocaleString() : 'Not set'}
          </p>
        </div>
        <hr className="border-[#E5E7EB] mb-6" />

        <p className="text-[#6B7280] text-[14px] mb-8">
          {assignmentData.description || "No description provided."}
        </p>

        <div className="flex items-center gap-4 mb-8">
          {!isSubmitting ? (
            <>
              <button 
                onClick={() => setIsSubmitting(true)}
                className="bg-[#06B6D4] hover:bg-[#0891b2] transition-colors text-white text-[14px] font-bold px-4 py-2.5 rounded-lg"
              >
                {myResponse ? "Edit submission" : "Add submission"}
              </button>
            </>
          ) : (
            <div className="flex gap-3">
              <button 
                onClick={handleSubmit}
                disabled={isSaving}
                className="bg-[#06B6D4] hover:bg-[#0891b2] transition-colors text-white text-[14px] font-bold px-6 py-2.5 rounded-lg shadow-sm flex items-center gap-2"
              >
                {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                Save changes
              </button>
              <button 
                onClick={() => setIsSubmitting(false)}
                className="bg-white border border-gray-200 text-gray-500 text-[14px] font-bold px-6 py-2.5 rounded-lg"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        <h3 className="text-[16px] font-bold text-[#F97316] mb-4">Submission status</h3>

        {!isSubmitting ? (
          /* Status Table */
          <div className="w-full border border-[#E5E7EB] rounded-xl overflow-hidden mb-4">
            <div className="grid grid-cols-1 md:grid-cols-3 border-b border-[#E5E7EB] bg-white">
              <div className="p-4 font-bold text-[14px] text-[#374151] md:border-r md:border-[#E5E7EB]">Submission status</div>
              <div className="p-4 text-[14px] md:col-span-2">
                {myResponse ? (
                  <span className="flex items-center gap-1.5 text-green-600 font-bold">
                    <CheckCircle2 className="w-4 h-4" /> Submitted for grading
                  </span>
                ) : (
                  <span className="text-gray-500">Not submitted</span>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 border-b border-[#E5E7EB] bg-[#F9FAFB]">
              <div className="p-4 font-bold text-[14px] text-[#374151] md:border-r md:border-[#E5E7EB]">Grading status</div>
              <div className="p-4 text-[14px] text-[#6B7280] md:col-span-2">
                {myResponse?.data?.mark != null ? (
                  <span className="font-bold text-blue-600">Graded: {myResponse.data.mark} / 100</span>
                ) : (
                  "Not graded"
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 border-b border-[#E5E7EB] bg-white">
              <div className="p-4 font-bold text-[14px] text-[#374151] md:border-r md:border-[#E5E7EB]">Last modified</div>
              <div className="p-4 text-[14px] text-[#6B7280] md:col-span-2">
                {myResponse?.data?.submittedAt ? new Date(myResponse.data.submittedAt).toLocaleString() : "Not modified"}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 bg-white">
              <div className="p-4 font-bold text-[14px] text-[#374151] md:border-r md:border-[#E5E7EB]">File(s) submitted</div>
              <div className="p-4 text-[14px] text-[#6B7280] md:col-span-2">
                {myResponse?.data?.files && myResponse.data.files.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {myResponse.data.files.map((f, idx) => (
                      <div key={idx} className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded text-[12px]">
                        <Paperclip className="w-3 h-3" /> {f.name}
                      </div>
                    ))}
                  </div>
                ) : "No file submitted"}
              </div>
            </div>
          </div>
        ) : (
          /* File Upload Area */
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-6">
              <p className="text-[14px] font-bold text-[#6B7280] md:w-1/4 shrink-0">File submissions</p>
              
              <div className="flex-1 w-full space-y-4">
                <div 
                  onClick={handleFileClick}
                  className="border-2 border-dashed border-[#E5E7EB] rounded-xl hover:border-blue-300 hover:bg-blue-50/30 transition-all cursor-pointer h-64 flex flex-col items-center justify-center p-6 text-center group"
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    multiple 
                    className="hidden" 
                    onChange={handleFileChange}
                  />
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
                    <UploadCloud className="w-6 h-6 text-[#374151] group-hover:text-blue-500" />
                  </div>
                  <p className="text-[14px] font-bold text-[#3B82F6] mb-1">Choose files or drag and drop</p>
                  <p className="text-[12px] text-[#9CA3AF] mb-6">Texts, images, videos, audios and pdfs</p>
                  <button type="button" className="flex items-center gap-2 bg-[#3B82F6] hover:bg-blue-600 transition-colors text-white px-5 py-2 rounded-lg text-[14px] font-bold shadow-sm">
                    <Paperclip className="w-4 h-4" />
                    Attach
                  </button>
                </div>

                {selectedFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-blue-50 text-[#3B82F6] px-3 py-1.5 rounded-lg text-[13px] font-medium border border-blue-100">
                        <Paperclip className="w-3.5 h-3.5" />
                        {file.name}
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFiles(prev => prev.filter((_, i) => i !== idx));
                          }}
                          className="ml-2 hover:text-red-500 text-gray-400"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6">
              <label className="text-[14px] font-bold text-[#6B7280] md:w-1/4 shrink-0">Note</label>
              <textarea 
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a note to your teacher..."
                className="flex-1 border border-[#E5E7EB] rounded-xl px-4 py-3 text-[14px] focus:outline-none focus:border-[#06B6D4]"
                rows={3}
              />
            </div>
          </div>
        )}
      </div>

      {/* Class Comments Section */}
      <div className="bg-white rounded-xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-[#E5E7EB] p-5 pb-6 mb-12">
        <div className="flex items-center gap-3 border-b border-[#E5E7EB] pb-3 mb-6">
          <div className="text-[#6B7280] flex items-center gap-2 font-bold text-[14px]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            Class comments
          </div>
        </div>

        <div className="space-y-6">
          {/* Comment 1 */}
          <div className="flex gap-4 group">
            <img 
              src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80" 
              alt="Emilia" 
              className="w-10 h-10 rounded-full object-cover shrink-0 border border-gray-200"
            />
            <div className="flex-1">
              <div className="flex items-end gap-2 mb-1">
                <span className="font-bold text-[#06B6D4] text-[14px]">Emilia</span>
                <span className="text-[12px] text-[#9CA3AF] font-medium leading-[14px] pb-[1px]">8:11 AM</span>
              </div>
              <p className="text-[14px] text-[#374151]">Hello teacher! My submission was lost, can you help me ?</p>
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button className="p-1 hover:bg-gray-100 rounded-full text-[#6B7280]">
                <CornerDownLeft className="w-5 h-5" />
              </button>
              <button className="p-1 hover:bg-gray-100 rounded-full text-[#6B7280]">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Comment Input */}
        <div className="flex gap-3 mt-8 items-center">
          <img 
            src="https://ui-avatars.com/api/?name=St&background=random" 
            alt="Your Avatar" 
            className="w-8 h-8 rounded-full object-cover shrink-0 border border-gray-200"
          />
          <div className="flex-1 relative flex items-center">
            <input 
              type="text" 
              placeholder="Add class comment" 
              className="w-full border border-[#E5E7EB] rounded-full px-5 py-2.5 text-[14px] font-medium text-[#374151] placeholder-[#9CA3AF] focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] transition-all bg-[#F9FAFB] focus:bg-white"
            />
            <button className="absolute right-3 text-[#6B7280] hover:text-[#3B82F6] transition-colors p-1">
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
