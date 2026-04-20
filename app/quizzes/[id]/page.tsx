'use client';

import React from 'react';
import { 
  ChevronRight, ListChecks, CornerDownLeft, MoreVertical, Send 
} from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';

export default function QuizDetailPage() {
  const breadcrumbs = (
    <div className="flex items-center text-[14px] font-medium">
      <span className="text-[#6B7280] hidden md:inline">Home</span>
      <ChevronRight className="w-4 h-4 mx-2 text-[#9CA3AF] hidden md:inline" />
      <span className="text-[#6B7280]">Introduce to Astronomy</span>
      <ChevronRight className="w-4 h-4 mx-2 text-[#9CA3AF]" />
      <span className="font-bold text-[#374151]">Review basic Astronomy knowledge</span>
    </div>
  );

  return (
    <MainLayout headerTitle={breadcrumbs}>
      <div className="flex flex-col min-h-full bg-white relative">
        
        {/* Deep Pink/Magenta Top Background */}
        <div className="w-full bg-[#9D174D] pt-10 pb-24 px-6 md:px-10">
          <div className="flex items-center gap-4 mb-8 text-white">
            <div className="bg-white/20 p-2 rounded-lg">
              <ListChecks className="w-6 h-6 shrink-0" />
            </div>
            <h1 className="text-[32px] font-bold">Review basic Astronomy knowledge</h1>
          </div>
          <div className="flex gap-8 border-b-2 border-white/20 text-white pb-3">
            <span className="text-[14px] font-bold border-b-4 border-white pb-[14px] -mb-[18px]">
              Quiz
            </span>
          </div>
        </div>

        {/* Content Box (overlapping the BG) */}
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

            <p className="text-[#6B7280] text-[14px] mb-6">
              This quiz contains a variety of questions to test your basic knowledge of Astronomy. At the end of the quiz you will be given your score with suggestions for improvement.
            </p>

            <button className="bg-[#06B6D4] hover:bg-[#0891b2] transition-colors text-white text-[14px] font-bold px-6 py-2.5 rounded-lg mb-6 shadow-sm w-fit">
              Attempt quiz
            </button>

            <div className="text-[14px] text-[#6B7280] flex flex-col gap-2 mb-6">
              <p>Attempts allowed: 3</p>
              <p>Grading method: Highest grade</p>
              <p className="font-bold text-[#22C55E] text-[16px] mt-2">Highest grade: 90 / 100</p>
            </div>

            <h3 className="text-[16px] font-bold text-[#F97316] mb-4">Your attempts</h3>

            {/* Attempts Table */}
            <div className="w-full border border-[#E5E7EB] rounded-xl overflow-hidden mb-4">
              
              {/* Table Header row */}
              <div className="flex items-center justify-between border-b border-[#E5E7EB] bg-white p-4">
                <div className="font-bold text-[14px] text-[#F97316]">Attempt 1</div>
                <button className="text-[14px] text-[#3B82F6] hover:underline font-medium">Review</button>
              </div>

              {/* Table Body */}
              <div className="grid grid-cols-1 md:grid-cols-4 border-b border-[#E5E7EB] bg-white">
                <div className="p-4 font-bold text-[14px] text-[#374151] md:border-r md:border-[#E5E7EB]">Status</div>
                <div className="p-4 text-[14px] text-[#6B7280] md:col-span-3">Finished</div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 border-b border-[#E5E7EB] bg-[#F9FAFB]">
                <div className="p-4 font-bold text-[14px] text-[#374151] md:border-r md:border-[#E5E7EB]">Started</div>
                <div className="p-4 text-[14px] text-[#6B7280] md:col-span-3">Thursday, 10 October 2024, 2:00:00 PM</div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 border-b border-[#E5E7EB] bg-white">
                <div className="p-4 font-bold text-[14px] text-[#374151] md:border-r md:border-[#E5E7EB]">Completed</div>
                <div className="p-4 text-[14px] text-[#6B7280] md:col-span-3">Thursday, 10 October 2024, 2:01:04 PM</div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 border-b border-[#E5E7EB] bg-[#F9FAFB]">
                <div className="p-4 font-bold text-[14px] text-[#374151] md:border-r md:border-[#E5E7EB]">Duration</div>
                <div className="p-4 text-[14px] text-[#6B7280] md:col-span-3">1 minute 4 seconds</div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 bg-white">
                <div className="p-4 font-bold text-[14px] text-[#374151] md:border-r md:border-[#E5E7EB]">Mark</div>
                <div className="p-4 text-[14px] text-[#6B7280] md:col-span-3">90 / 100</div>
              </div>
              
            </div>

          </div>

          {/* Class Comments Section (Same as Assignment) */}
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
