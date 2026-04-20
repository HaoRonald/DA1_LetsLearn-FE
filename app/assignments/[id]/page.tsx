'use client';

import React, { useState } from 'react';
import { 
  ChevronRight, FileText, CornerDownLeft, MoreVertical, 
  Send, UploadCloud, Paperclip 
} from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';

export default function AssignmentDetailPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const breadcrumbs = (
    <div className="flex items-center text-[14px] font-medium">
      <span className="text-[#6B7280] hidden md:inline">Home</span>
      <ChevronRight className="w-4 h-4 mx-2 text-[#9CA3AF] hidden md:inline" />
      <span className="text-[#6B7280]">Introduce to Astronomy</span>
      <ChevronRight className="w-4 h-4 mx-2 text-[#9CA3AF]" />
      <span className="font-bold text-[#374151]">Final project</span>
    </div>
  );

  return (
    <MainLayout headerTitle={breadcrumbs}>
      <div className="flex flex-col min-h-full bg-white relative">
        
        {/* Purple Top Background */}
        <div className="w-full bg-[#7E22CE] pt-10 pb-24 px-6 md:px-10">
          <div className="flex items-center gap-4 mb-8 text-white">
            <div className="bg-white/20 p-2 rounded-lg">
              <FileText className="w-6 h-6 shrink-0" />
            </div>
            <h1 className="text-[32px] font-bold">Final project</h1>
          </div>
          <div className="flex gap-8 border-b-2 border-white/20 text-white pb-3">
            <span className="text-[14px] font-bold border-b-4 border-white pb-[14px] -mb-[18px]">
              Assignment
            </span>
          </div>
        </div>

        {/* Content Box (overlapping the purple BG) */}
        <div className="px-6 md:px-10 -mt-16 w-full max-w-5xl">
          
          {/* Main Card */}
          <div className="bg-white rounded-xl shadow-md border border-[#E5E7EB] p-6 mb-6">
            
            <div className="flex flex-col gap-2 mb-6">
              <p className="text-[14px] text-[#6B7280]">
                <span className="font-bold text-[#374151]">Open:</span> Monday 10 October, 2024 1:00 PM
              </p>
              <p className="text-[14px] text-[#6B7280]">
                <span className="font-bold text-[#374151]">Due:</span> Friday 15 October, 2024 11:59 PM
              </p>
            </div>
            <hr className="border-[#E5E7EB] mb-6" />

            <p className="text-[#6B7280] text-[14px] mb-8">
              Write a minimum of 500 words on what you would need to take into consideration if you were to spend a night in the Alps. Justify your choices.
            </p>

            <div className="flex items-center gap-4 mb-8">
              {!isSubmitting ? (
                <>
                  <button 
                    onClick={() => setIsSubmitting(true)}
                    className="bg-[#06B6D4] hover:bg-[#0891b2] transition-colors text-white text-[14px] font-bold px-4 py-2.5 rounded-lg"
                  >
                    Add submission
                  </button>
                  <button 
                    className="bg-[#ECFEFF] hover:bg-[#cffafe] transition-colors text-[#06B6D4] text-[14px] font-bold px-4 py-2.5 rounded-lg"
                  >
                    Mark as completed
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => setIsSubmitting(false)}
                  className="bg-[#06B6D4] hover:bg-[#0891b2] transition-colors text-white text-[14px] font-bold px-6 py-2.5 rounded-lg shadow-sm w-fit"
                >
                  Save
                </button>
              )}
            </div>

            <h3 className="text-[16px] font-bold text-[#F97316] mb-4">Submission status</h3>

            {!isSubmitting ? (
              /* Status Table */
              <div className="w-full border border-[#E5E7EB] rounded-xl overflow-hidden mb-4">
                <div className="grid grid-cols-1 md:grid-cols-3 border-b border-[#E5E7EB] bg-white">
                  <div className="p-4 font-bold text-[14px] text-[#374151] md:border-r md:border-[#E5E7EB]">Submission status</div>
                  <div className="p-4 text-[14px] text-[#6B7280] md:col-span-2">Not submitted</div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 border-b border-[#E5E7EB] bg-[#F9FAFB]">
                  <div className="p-4 font-bold text-[14px] text-[#374151] md:border-r md:border-[#E5E7EB]">Grading status</div>
                  <div className="p-4 text-[14px] text-[#6B7280] md:col-span-2">Not graded</div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 border-b border-[#E5E7EB] bg-white">
                  <div className="p-4 font-bold text-[14px] text-[#374151] md:border-r md:border-[#E5E7EB]">Time remaining</div>
                  <div className="p-4 text-[14px] text-[#6B7280] md:col-span-2">3 days 4 hours</div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 border-b border-[#E5E7EB] bg-[#F9FAFB]">
                  <div className="p-4 font-bold text-[14px] text-[#374151] md:border-r md:border-[#E5E7EB]">Last modified</div>
                  <div className="p-4 text-[14px] text-[#6B7280] md:col-span-2">Not modified</div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 bg-white">
                  <div className="p-4 font-bold text-[14px] text-[#374151] md:border-r md:border-[#E5E7EB]">File(s) submitted</div>
                  <div className="p-4 text-[14px] text-[#6B7280] md:col-span-2">No file submitted</div>
                </div>
              </div>
            ) : (
              /* File Upload Area */
              <div className="flex flex-col md:flex-row gap-6">
                <p className="text-[14px] font-bold text-[#6B7280] md:w-1/4 shrink-0">File submissions</p>
                
                <div className="flex-1 w-full border-2 border-dashed border-[#E5E7EB] rounded-xl hover:border-blue-300 hover:bg-blue-50/30 transition-all cursor-pointer h-64 flex flex-col items-center justify-center p-6 text-center group">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
                    <UploadCloud className="w-6 h-6 text-[#374151] group-hover:text-blue-500" />
                  </div>
                  <p className="text-[14px] font-bold text-[#3B82F6] mb-1">Choose files or drag and drop</p>
                  <p className="text-[12px] text-[#9CA3AF] mb-6">Texts, images, videos, audios and pdfs</p>
                  <button className="flex items-center gap-2 bg-[#3B82F6] hover:bg-blue-600 transition-colors text-white px-5 py-2 rounded-lg text-[14px] font-bold shadow-sm">
                    <Paperclip className="w-4 h-4" />
                    Attach
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Class Comments Section */}
          <div className="bg-white rounded-xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-[#E5E7EB] p-5 pb-6 mb-12">
            
            <div className="flex items-center gap-3 border-b border-[#E5E7EB] pb-3 mb-6">
              <div className="text-[#6B7280] flex items-center gap-2 font-bold text-[14px]">
                {/* Custom users icon looking like Figma */}
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

              {/* Comment 2 */}
              <div className="flex gap-4 group">
                <img 
                  src="https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=150&q=80" 
                  alt="John Doe" 
                  className="w-10 h-10 rounded-full object-cover shrink-0 border border-gray-200"
                />
                <div className="flex-1">
                  <div className="flex items-end gap-2 mb-1">
                    <span className="font-bold text-[#06B6D4] text-[14px]">John Doe</span>
                    <span className="text-[12px] text-[#9CA3AF] font-medium leading-[14px] pb-[1px]">Yesterday</span>
                  </div>
                  <p className="text-[14px] text-[#374151]">
                    <span className="text-[#7E22CE] font-bold cursor-pointer hover:underline mr-1">Emilia</span> 
                    Thanks for your comment, I'll check it soon.
                  </p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-1 hover:bg-gray-100 rounded-full text-[#6B7280]">
                    <CornerDownLeft className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Comment Input */}
            <div className="flex gap-3 mt-8 items-center">
              <img 
                src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80" 
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

      </div>
    </MainLayout>
  );
}
