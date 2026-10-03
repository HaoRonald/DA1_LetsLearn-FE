import React, { useCallback, useEffect, useRef, useState } from 'react';
import { 
  Send, UploadCloud, Paperclip, FileArchive, Loader2, CheckCircle2, XCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { commentApi, GetCommentResponse } from '@/services/commentService';
import { useAuth } from '@/contexts/AuthContext';

import { downloadFile } from '@/lib/utils';
import { TopicResponse } from '@/services/courseService';
import { assignmentResponseApi, AssignmentResponseDTO, CloudinaryFile } from '@/services/assignmentResponseService';
import { formatFileSize, isArchive, uploadMedia, uploadError, validateUpload } from '@/lib/mediaUpload';

interface LearnerAssignmentViewProps {
  assignment: TopicResponse;
  courseId: string;
}

export function StudentAssignmentView(props: LearnerAssignmentViewProps) {
  return <StudentAssignmentSession key={`${props.courseId}:${props.assignment.id}`} {...props} />;
}

function StudentAssignmentSession({ assignment, courseId }: LearnerAssignmentViewProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [myResponse, setMyResponse] = useState<AssignmentResponseDTO | null>(null);
  
  // Selection state
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [retainedFiles, setRetainedFiles] = useState<CloudinaryFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ completed: 0, total: 0, percent: 0 });
  const uploadedCache = useRef(new Map<File, CloudinaryFile>());
  const [note, setNote] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { user } = useAuth();
  
  // Comments state
  const [comments, setComments] = useState<GetCommentResponse[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [isFetchingComments, setIsFetchingComments] = useState(true);

  const assignmentData = assignment.data || {};

  const fetchComments = useCallback(() => commentApi.getByTopic(courseId, assignment.id)
    .then(response => setComments(response.data))
    .catch(error => console.error("Failed to fetch comments:", error))
    .finally(() => setIsFetchingComments(false)), [courseId, assignment.id]);

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
    fetchComments();
  }, [assignment.id, fetchComments]);

  const handleAddComment = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newComment.trim()) return;

    setIsAddingComment(true);
    try {
      await commentApi.add(courseId, assignment.id, {
        topicId: assignment.id,
        text: newComment
      });
      setNewComment("");
      await fetchComments();
      toast.success("Comment added");
    } catch (error) {
      console.error("Failed to add comment:", error);
      toast.error("Failed to post comment");
    } finally {
      setIsAddingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await commentApi.delete(courseId, assignment.id, commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
      toast.success("Comment deleted");
    } catch (error) {
      console.error("Failed to delete comment:", error);
      toast.error("Failed to delete comment");
    }
  };

  const handleFileClick = () => {
    if (isSaving) return;
    fileInputRef.current?.click();
  };

  const addFiles = (files: File[]) => {
    if (isSaving) return;
    const validFiles = files.filter(file => {
      const error = validateUpload(file);
      if (error) toast.error(error);
      return !error;
    });
    setSelectedFiles(previous => [...previous, ...validFiles.filter((file, index) =>
      ![...previous, ...validFiles.slice(0, index)].some(item =>
        item.name === file.name && item.size === file.size && item.lastModified === file.lastModified))]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(Array.from(e.target.files));
    e.target.value = '';
  };

  const startEditing = () => {
    setRetainedFiles(myResponse?.data.files ?? []);
    setNote(myResponse?.data.note ?? '');
    setSelectedFiles([]);
    uploadedCache.current.clear();
    setIsSubmitting(true);
  };

  const handleSubmit = async () => {
    if (isSaving) return;
    if (!selectedFiles.length && !retainedFiles.length) {
      toast.error('Vui lòng đính kèm ít nhất một file bài làm.');
      return;
    }
    setIsSaving(true);
    setUploadProgress({ completed: 0, total: selectedFiles.length, percent: 0 });
    try {
      const uploadedFiles: CloudinaryFile[] = [];
      // Keep successful uploads when a later file fails, so retry does not upload them again.
      for (const [index, file] of selectedFiles.entries()) {
        const uploaded = uploadedCache.current.get(file) ?? await uploadMedia(file, percent => {
          setUploadProgress({ completed: index, total: selectedFiles.length, percent });
        });
        uploadedCache.current.set(file, uploaded);
        uploadedFiles.push(uploaded);
        setUploadProgress({ completed: index + 1, total: selectedFiles.length, percent: 0 });
      }

      const payload = {
        topicId: assignment.id,
        submittedAt: new Date().toISOString(),
        cloudinaryFiles: [...retainedFiles, ...uploadedFiles],
        note: note
      };

      const saved = myResponse
        ? await assignmentResponseApi.update(assignment.id, myResponse.id, {
            topicId: assignment.id,
            studentId: myResponse.studentId,
            data: { submittedAt: payload.submittedAt, files: payload.cloudinaryFiles, note },
          })
        : await assignmentResponseApi.create(assignment.id, payload);
      setMyResponse(saved.data);
      toast.success("Assignment submitted successfully!");
      setSelectedFiles([]);
      uploadedCache.current.clear();
      setIsSubmitting(false);
    } catch (error: unknown) {
      toast.error(uploadError(error));
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

        <p className="text-[#6B7280] text-[14px] mb-6">
          {assignmentData.description || "No description provided."}
        </p>

        {/* Teacher's Additional Files */}
        {(assignmentData.files || assignmentData.CloudinaryFiles) && (assignmentData.files?.length > 0 || assignmentData.CloudinaryFiles?.length > 0) && (
          <div className="mb-8">
            <h4 className="text-[13px] font-bold text-gray-400 uppercase tracking-wider mb-3">Additional materials</h4>
            <div className="flex flex-wrap gap-2">
              {(assignmentData.files || assignmentData.CloudinaryFiles).map((file: CloudinaryFile, idx: number) => (
                <button 
                  key={idx} 
                  onClick={() => downloadFile(file.downloadUrl || file.displayUrl, file.name)}
                  className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors group"
                >
                  <Paperclip className="w-4 h-4 text-gray-400 group-hover:text-[#3B82F6]" />
                  {file.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-4 mb-8">
          {!isSubmitting ? (
            <>
              <button 
                onClick={startEditing}
                disabled={myResponse?.data.mark != null}
                className="bg-[#06B6D4] hover:bg-[#0891b2] transition-colors text-white text-[14px] font-bold px-4 py-2.5 rounded-lg"
              >
                {myResponse?.data.mark != null ? "Bài đã chấm điểm" : myResponse ? "Edit submission" : "Add submission"}
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
                disabled={isSaving}
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
                  <span className="font-bold text-blue-600">Graded: {myResponse.data.mark} / 10</span>
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
                      <button 
                        key={idx} 
                        onClick={() => downloadFile(f.downloadUrl || f.displayUrl, f.name)}
                        className="flex items-center gap-1 bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors px-2 py-1 rounded text-[12px] font-medium border border-blue-100"
                      >
                        <Paperclip className="w-3 h-3" /> {f.name}
                      </button>
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
                  onDragOver={e => { e.preventDefault(); if (!isSaving) setIsDragging(true); }}
                  onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragging(false); }}
                  onDrop={e => { e.preventDefault(); setIsDragging(false); addFiles(Array.from(e.dataTransfer.files)); }}
                  className={`border-2 border-dashed rounded-xl transition-colors min-h-56 flex flex-col items-center justify-center p-6 text-center group ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-slate-50/50'} ${isSaving ? 'opacity-60' : ''}`}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    multiple 
                    disabled={isSaving}
                    aria-label="Chọn file bài nộp"
                    className="hidden" 
                    onChange={handleFileChange}
                  />
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
                    <UploadCloud className="w-6 h-6 text-[#374151] group-hover:text-blue-500" />
                  </div>
                  <p className="text-[15px] font-semibold text-slate-800 mb-2">Kéo thả bài làm vào đây</p>
                  <p className="text-sm text-slate-600">Hỗ trợ file nén ZIP, RAR, 7z và tài liệu, hình ảnh, video.</p>
                  <p className="text-xs text-slate-500 mt-1 mb-5">Tối đa 50 MB mỗi file. Có thể chọn nhiều file.</p>
                  <button type="button" onClick={handleFileClick} disabled={isSaving} className="flex items-center gap-2 bg-[#3B82F6] hover:bg-blue-600 transition-colors text-white px-5 py-2 rounded-lg text-[14px] font-semibold shadow-sm disabled:opacity-50">
                    <Paperclip className="w-4 h-4" />
                    Chọn file
                  </button>
                </div>

                {retainedFiles.map((file, index) => (
                  <div key={`${file.downloadUrl}-${index}`} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 text-sm">
                    {isArchive(file.name) ? <FileArchive className="h-5 w-5 shrink-0 text-amber-600" /> : <Paperclip className="h-5 w-5 shrink-0 text-blue-600" />}
                    <span className="min-w-0 flex-1 break-all">{file.name} <span className="text-xs text-slate-500">· Đã nộp</span></span>
                    <button type="button" disabled={isSaving} aria-label={`Bỏ file ${file.name}`} onClick={() => setRetainedFiles(files => files.filter((_, i) => i !== index))} className="p-1 text-slate-500 hover:text-red-600"><XCircle className="h-4 w-4" /></button>
                  </div>
                ))}

                {isSaving && (
                  <div role="status" className="space-y-2 text-sm text-blue-700">
                    <p>{uploadProgress.completed < uploadProgress.total ? `Đang tải file ${uploadProgress.completed + 1}/${uploadProgress.total} · ${uploadProgress.percent}%` : 'Đang lưu bài nộp…'}</p>
                    <progress aria-label="Tiến độ tải file" max={Math.max(1, uploadProgress.total) * 100} value={uploadProgress.completed * 100 + uploadProgress.percent} className="h-2 w-full accent-blue-600" />
                  </div>
                )}

                {selectedFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-blue-50 text-[#3B82F6] px-3 py-1.5 rounded-lg text-[13px] font-medium border border-blue-100">
                        {isArchive(file.name) ? <FileArchive className="w-4 h-4 shrink-0 text-amber-600" /> : <Paperclip className="w-3.5 h-3.5 shrink-0" />}
                        <span className="break-all">{file.name} <span className="text-xs text-slate-500">({formatFileSize(file.size)})</span></span>
                        <button 
                          disabled={isSaving}
                          aria-label={`Bỏ file ${file.name}`}
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
                disabled={isSaving}
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
            Class comments ({comments.length})
          </div>
        </div>

        <div className="space-y-6">
          {isFetchingComments ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-gray-300" />
            </div>
          ) : comments.length > 0 ? (
            comments.map((cmt) => (
              <div key={cmt.id} className="flex gap-4 group">
                <img 
                  src={cmt.user.avatar || `https://ui-avatars.com/api/?name=${cmt.user.username}&background=random`} 
                  alt={cmt.user.username} 
                  className="w-10 h-10 rounded-full object-cover shrink-0 border border-gray-100"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-[#06B6D4] text-[14px]">{cmt.user.username}</span>
                    <span className="text-[12px] text-[#9CA3AF] font-medium">
                      {new Date(cmt.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[14px] text-[#374151] whitespace-pre-wrap">{cmt.text}</p>
                </div>
                {(user?.id === cmt.user.id || user?.role === 'Teacher' || user?.role === 'Admin') && (
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleDeleteComment(cmt.id)}
                      className="p-1 hover:bg-red-50 rounded-full text-[#9CA3AF] hover:text-red-500 transition-colors"
                      title="Delete comment"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))
          ) : (
            <p className="text-center text-gray-400 text-[14px] py-4 italic">No comments yet. Be the first to say something!</p>
          )}
        </div>

        {/* Comment Input */}
        <form onSubmit={handleAddComment} className="flex gap-3 mt-8 items-center">
          <img 
            src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.username || 'U'}&background=random`} 
            alt="Your Avatar" 
            className="w-8 h-8 rounded-full object-cover shrink-0 border border-gray-200"
          />
          <div className="flex-1 relative flex items-center">
            <input 
              type="text" 
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              disabled={isAddingComment}
              placeholder="Add class comment" 
              className="w-full border border-[#E5E7EB] rounded-full px-5 py-2.5 text-[14px] font-medium text-[#374151] placeholder-[#9CA3AF] focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] transition-all bg-[#F9FAFB] focus:bg-white disabled:opacity-50"
            />
            <button 
              type="submit"
              disabled={isAddingComment || !newComment.trim()}
              className="absolute right-3 text-[#6B7280] hover:text-[#3B82F6] transition-colors p-1 disabled:opacity-30"
            >
              {isAddingComment ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
