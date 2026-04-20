'use client';

import React from 'react';
import { 
  CornerDownLeft, MoreVertical, Send, UploadCloud, Paperclip, Calendar, Filter
} from 'lucide-react';

import { TopicResponse } from '@/services/courseService';

interface TeacherAssignmentViewProps {
  assignment: TopicResponse;
}

export function TeacherAssignmentView({ assignment }: TeacherAssignmentViewProps) {
  const assignmentData = assignment.data || {};
  
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

        <button className="bg-[#06B6D4] hover:bg-[#0891b2] transition-colors text-white text-[14px] font-bold px-6 py-2.5 rounded-lg shadow-sm w-fit mb-8">
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
            src="https://ui-avatars.com/api/?name=Teacher&background=random" 
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
