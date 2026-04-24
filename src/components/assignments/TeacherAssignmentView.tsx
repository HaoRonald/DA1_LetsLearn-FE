'use client';

import React from 'react';
import { 
  CornerDownLeft, MoreVertical, Send, UploadCloud, Paperclip, Calendar, Filter, Loader2, XCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { commentApi, GetCommentResponse } from '@/services/commentService';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { TopicResponse } from '@/services/courseService';

interface TeacherAssignmentViewProps {
  assignment: TopicResponse;
  courseId: string;
  onTabChange?: (value: string) => void;
}

export function TeacherAssignmentView({ assignment, courseId, onTabChange }: TeacherAssignmentViewProps) {
  const { user } = useAuth();
  const assignmentData = assignment.data || {};
  
  // Comments state
  const [comments, setComments] = useState<GetCommentResponse[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [isFetchingComments, setIsFetchingComments] = useState(true);

  useEffect(() => {
    fetchComments();
  }, [assignment.id, courseId]);

  const fetchComments = async () => {
    try {
      const response = await commentApi.getByTopic(courseId, assignment.id);
      setComments(response.data);
    } catch (error) {
      console.error("Failed to fetch comments:", error);
    } finally {
      setIsFetchingComments(false);
    }
  };

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
  
  return (
    <div className="bg-transparent w-full">
      {/* Assignment Tab */}
      <div className="bg-white rounded-xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] border border-[#E5E7EB] p-6 mb-6">
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

        <button 
          onClick={() => onTabChange?.("submissions")}
          className="bg-[#06B6D4] hover:bg-[#0891b2] transition-colors text-white text-[14px] font-bold px-6 py-2.5 rounded-lg shadow-sm w-fit mb-8"
        >
          Grade
        </button>

        <h3 className="text-[16px] font-bold text-[#F97316] mb-4">Grading summary</h3>

        <div className="w-full border border-[#E5E7EB] rounded-xl overflow-hidden mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 border-b border-[#E5E7EB] bg-white">
            <div className="p-4 font-bold text-[14px] text-[#374151] md:border-r md:border-[#E5E7EB]">Hidden from students</div>
            <div className="p-4 text-[14px] text-[#6B7280] md:col-span-2">No</div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 border-b border-[#E5E7EB] bg-[#F9FAFB]">
            <div className="p-4 font-bold text-[14px] text-[#374151] md:border-r md:border-[#E5E7EB]">Assigned</div>
            <div className="p-4 text-[14px] text-[#6B7280] md:col-span-2">{assignmentData.assignedCount || 0}</div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 border-b border-[#E5E7EB] bg-white">
            <div className="p-4 font-bold text-[14px] text-[#374151] md:border-r md:border-[#E5E7EB]">Submitted</div>
            <div className="p-4 text-[14px] text-[#6B7280] md:col-span-2">{assignmentData.submittedCount || 0}</div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 bg-[#F9FAFB]">
            <div className="p-4 font-bold text-[14px] text-[#374151] md:border-r md:border-[#E5E7EB]">Need grading</div>
            <div className="p-4 text-[14px] text-[#6B7280] md:col-span-2">{assignmentData.needGradingCount || 0}</div>
          </div>
        </div>
      </div>

      {/* Class Comments Section */}
      <div className="bg-white rounded-xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] border border-[#E5E7EB] p-5 pb-6 mb-12">
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
                  className="w-10 h-10 rounded-full object-cover shrink-0 border border-gray-200"
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
            <p className="text-center text-gray-400 text-[14px] py-4 italic">No comments yet.</p>
          )}
        </div>

        {/* Comment Input */}
        <form onSubmit={handleAddComment} className="flex gap-3 mt-8 items-center">
          <img 
            src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.username || 'T'}&background=random`} 
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
