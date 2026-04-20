'use client';

import React from 'react';
import { 
  Check, X, CheckCircle2, Circle, Flag
} from 'lucide-react';

export default function QuizAttemptPage() {
  return (
    <div className="min-h-screen bg-white p-6 md:p-8 font-sans">
      <div className="max-w-[1400px] mx-auto flex flex-col lg:flex-row gap-6">
        
        {/* LEFT COLUMN: Annotation Table */}
        <div className="w-full lg:w-[280px] shrink-0 border border-[#E5E7EB] rounded-xl p-5 h-fit shadow-sm">
          <h2 className="text-[18px] font-bold text-[#F97316] mb-4">Annotation table</h2>
          
          <h3 className="text-[14px] font-bold text-[#DB2777] mb-3 text-center">Symbol</h3>
          <div className="space-y-3 mb-6">
            <div className="flex gap-3 items-start">
              <Check className="w-4 h-4 text-[#22C55E] shrink-0 mt-0.5" />
              <span className="text-[13px] text-[#6B7280]">You selected the correct answer!</span>
            </div>
            <div className="flex gap-3 items-start">
              <Check className="w-4 h-4 text-[#EAB308] shrink-0 mt-0.5" />
              <span className="text-[13px] text-[#6B7280]">You didn't select this correct answer!</span>
            </div>
            <div className="flex gap-3 items-start">
              <X className="w-4 h-4 text-[#EF4444] shrink-0 mt-0.5" />
              <span className="text-[13px] text-[#6B7280]">You selected the incorrect answer!</span>
            </div>
            <div className="flex gap-3 items-start">
              <CheckCircle2 className="w-4 h-4 text-[#06B6D4] shrink-0 mt-0.5" />
              <span className="text-[13px] text-[#6B7280]">You selected this answer!</span>
            </div>
            <div className="flex gap-3 items-start">
              <Circle className="w-4 h-4 text-[#06B6D4] shrink-0 mt-0.5" />
              <span className="text-[13px] text-[#6B7280]">You didn't select this answer!</span>
            </div>
            <div className="flex gap-3 items-start">
              <Flag className="w-4 h-4 text-[#22C55E] shrink-0 mt-0.5 fill-[#22C55E]" />
              <span className="text-[13px] text-[#6B7280]">The question is unflagged!</span>
            </div>
            <div className="flex gap-3 items-start">
              <Flag className="w-4 h-4 text-[#EF4444] shrink-0 mt-0.5 fill-[#EF4444]" />
              <span className="text-[13px] text-[#6B7280]">The question is flagged!</span>
            </div>
          </div>

          <h3 className="text-[14px] font-bold text-[#06B6D4] mb-3 text-center">Color</h3>
          <div className="space-y-4">
            <div className="flex gap-3 items-center">
              <div className="w-4 h-4 bg-[#06B6D4] shrink-0"></div>
              <span className="text-[13px] text-[#6B7280] leading-tight">This color represents the default answer!</span>
            </div>
            <div className="flex gap-3 items-center">
              <div className="w-4 h-4 bg-[#22C55E] shrink-0"></div>
              <span className="text-[13px] text-[#6B7280] leading-tight">This color represents the correct answer!</span>
            </div>
            <div className="flex gap-3 items-center">
              <div className="w-4 h-4 bg-[#EF4444] shrink-0"></div>
              <span className="text-[13px] text-[#6B7280] leading-tight">This color represents the incorrect answer!</span>
            </div>
            <div className="flex gap-3 items-center">
              <div className="w-4 h-4 bg-[#EAB308] shrink-0"></div>
              <span className="text-[13px] text-[#6B7280] leading-tight">This color represents the missing answer!</span>
            </div>
          </div>
        </div>

        {/* MIDDLE COLUMN: Questions */}
        <div className="flex-1 flex flex-col gap-10">
          
          {/* Question 1 */}
          <div>
            <div className="relative border border-[#E5E7EB] rounded-xl p-6 pt-8 mb-4 shadow-sm">
              <div className="absolute -top-4 left-6 bg-gradient-to-r from-[#6366F1] to-[#06B6D4] text-white px-4 py-2 rounded-lg font-bold text-[14px] flex items-center gap-2 shadow-sm">
                <Flag className="w-4 h-4 fill-[#22C55E] text-[#22C55E]" />
                Question 1 / 6
              </div>
              <p className="text-[16px] text-[#374151]">Which is the tallest animal?</p>
            </div>
            <p className="text-[13px] text-[#9CA3AF] mb-3 ml-2">Select the correct answer:</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#F3F4F6] rounded-xl px-4 py-3 cursor-pointer hover:bg-gray-200 transition-colors flex items-center gap-4">
                <span className="text-[#6B7280] font-bold">A</span>
                <span className="text-[#374151]">Chicken</span>
              </div>
              <div className="bg-[#06B6D4] rounded-xl px-4 py-3 cursor-pointer flex items-center gap-4 shadow-sm">
                <span className="text-white font-bold bg-white/20 px-2 py-0.5 rounded">B</span>
                <span className="text-white">Monkey</span>
              </div>
              <div className="bg-[#F3F4F6] rounded-xl px-4 py-3 cursor-pointer hover:bg-gray-200 transition-colors flex items-center gap-4">
                <span className="text-[#6B7280] font-bold">C</span>
                <span className="text-[#374151]">Lion</span>
              </div>
              <div className="bg-[#F3F4F6] rounded-xl px-4 py-3 cursor-pointer hover:bg-gray-200 transition-colors flex items-center gap-4">
                <span className="text-[#6B7280] font-bold">D</span>
                <span className="text-[#374151]">Giraffe</span>
              </div>
            </div>
          </div>

          {/* Question 2 */}
          <div>
            <div className="relative border border-[#E5E7EB] rounded-xl p-6 pt-8 mb-4 shadow-sm">
              <div className="absolute -top-4 left-6 bg-gradient-to-r from-[#6366F1] to-[#06B6D4] text-white px-4 py-2 rounded-lg font-bold text-[14px] flex items-center gap-2 shadow-sm">
                <Flag className="w-4 h-4 fill-[#22C55E] text-[#22C55E]" />
                Question 2 / 6
              </div>
              <p className="text-[16px] text-[#374151]">What is your hobby?</p>
            </div>
            <p className="text-[13px] text-[#9CA3AF] mb-3 ml-2">Select the correct answers:</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#F3F4F6] rounded-xl px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-gray-200 transition-colors">
                <Circle className="w-5 h-5 text-[#06B6D4]" />
                <span className="text-[#374151]">Music</span>
              </div>
              <div className="bg-[#06B6D4] rounded-xl px-4 py-3 flex items-center gap-3 cursor-pointer shadow-sm">
                <CheckCircle2 className="w-5 h-5 text-white" />
                <span className="text-white">Reading</span>
              </div>
              <div className="bg-[#06B6D4] rounded-xl px-4 py-3 flex items-center gap-3 cursor-pointer shadow-sm">
                <CheckCircle2 className="w-5 h-5 text-white" />
                <span className="text-white">Playing</span>
              </div>
              <div className="bg-[#F3F4F6] rounded-xl px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-gray-200 transition-colors">
                <Circle className="w-5 h-5 text-[#06B6D4]" />
                <span className="text-[#374151]">Writing</span>
              </div>
            </div>
          </div>

          {/* Question 3 */}
          <div>
            <div className="relative border border-[#E5E7EB] rounded-xl p-6 pt-8 mb-4 shadow-sm">
              <div className="absolute -top-4 left-6 bg-gradient-to-r from-[#6366F1] to-[#06B6D4] text-white px-4 py-2 rounded-lg font-bold text-[14px] flex items-center gap-2 shadow-sm">
                <Flag className="w-4 h-4 fill-[#EF4444] text-[#EF4444]" />
                Question 3 / 6
              </div>
              <p className="text-[16px] text-[#374151]">Which is the tallest animal?</p>
            </div>
            <p className="text-[13px] text-[#9CA3AF] mb-3 ml-2">Select the correct answer:</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#F3F4F6] rounded-xl px-4 py-3 text-center cursor-pointer hover:bg-gray-200 transition-colors">
                <span className="text-[#6B7280] font-medium">False</span>
              </div>
              <div className="bg-[#06B6D4] rounded-xl px-4 py-3 text-center cursor-pointer shadow-sm flex items-center justify-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-white" />
                <span className="text-white font-medium">True</span>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Navigation */}
        <div className="w-full lg:w-[260px] shrink-0">
          <div className="border border-[#E5E7EB] rounded-xl p-5 shadow-sm sticky top-6">
            <h2 className="text-[18px] font-bold text-[#F97316] mb-4">Quiz navigation</h2>
            
            <div className="grid grid-cols-7 gap-2 mb-6">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map((num) => (
                <div 
                  key={num} 
                  className={`relative w-full aspect-square flex items-center justify-center rounded text-[12px] font-bold cursor-pointer transition-colors
                    ${[3, 4].includes(num) ? 'bg-[#F3F4F6] text-[#374151]' : 'bg-[#F3F4F6] text-[#374151] hover:bg-gray-200'}
                  `}
                >
                  {num}
                  {/* Red Triangle for flagged questions */}
                  {[3, 4].includes(num) && (
                    <div className="absolute top-0 right-0 w-0 h-0 border-l-[10px] border-l-transparent border-t-[10px] border-t-[#EF4444]"></div>
                  )}
                </div>
              ))}
            </div>

            <button className="w-full bg-[#4F46E5] hover:bg-[#4338CA] transition-colors text-white font-bold py-2.5 rounded-lg text-[14px]">
              Finish attempt
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
