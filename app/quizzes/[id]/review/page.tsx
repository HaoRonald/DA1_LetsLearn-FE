'use client';

import React from 'react';
import { 
  Check, X, CheckCircle2, Circle, Flag
} from 'lucide-react';

export default function QuizReviewPage() {
  return (
    <div className="min-h-screen bg-white p-6 md:p-8 font-sans">
      <div className="max-w-[1400px] mx-auto flex flex-col lg:flex-row gap-6">
        
        {/* LEFT COLUMN: Annotation Table */}
        <div className="w-full lg:w-[280px] shrink-0 border border-[#E5E7EB] rounded-xl p-5 h-fit shadow-sm">
          <h2 className="text-[18px] font-bold text-[#F97316] mb-4">Annotation table</h2>
          
          <h3 className="text-[14px] font-bold text-[#DB2777] mb-3 text-center">Symbol</h3>
          <div className="space-y-3 mb-6">
            <div className="flex gap-3 items-start">
              <Check className="w-4 h-4 text-[#22C55E] shrink-0 mt-0.5" strokeWidth={3} />
              <span className="text-[13px] text-[#6B7280]">You selected the correct answer!</span>
            </div>
            <div className="flex gap-3 items-start">
              <Check className="w-4 h-4 text-[#EAB308] shrink-0 mt-0.5" strokeWidth={3} />
              <span className="text-[13px] text-[#6B7280]">You didn't select this correct answer!</span>
            </div>
            <div className="flex gap-3 items-start">
              <X className="w-4 h-4 text-[#EF4444] shrink-0 mt-0.5" strokeWidth={3} />
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
              <div className="w-4 h-4 bg-[#06B6D4] shrink-0 rounded-sm"></div>
              <span className="text-[13px] text-[#6B7280] leading-tight">This color represents the default answer!</span>
            </div>
            <div className="flex gap-3 items-center">
              <div className="w-4 h-4 bg-[#22C55E] shrink-0 rounded-sm"></div>
              <span className="text-[13px] text-[#6B7280] leading-tight">This color represents the correct answer!</span>
            </div>
            <div className="flex gap-3 items-center">
              <div className="w-4 h-4 bg-[#EF4444] shrink-0 rounded-sm"></div>
              <span className="text-[13px] text-[#6B7280] leading-tight">This color represents the incorrect answer!</span>
            </div>
            <div className="flex gap-3 items-center">
              <div className="w-4 h-4 bg-[#EAB308] shrink-0 rounded-sm"></div>
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
              
              {/* Mark floating top-right */}
              <div className="absolute -top-4 right-6 bg-gradient-to-r from-[#10B981] to-[#22C55E] text-white px-4 py-2 rounded-lg font-bold text-[14px] shadow-sm">
                Mark: 10 / 10
              </div>

              <p className="text-[16px] text-[#374151]">Which is the tallest animal?</p>
            </div>
            <p className="text-[13px] text-[#9CA3AF] mb-3 ml-2">Select the correct answer:</p>
            <div className="grid grid-cols-2 gap-3">
              {/* Correctly Selected Answer */}
              <div className="border border-[#22C55E] bg-white rounded-xl px-4 py-3 flex items-center justify-between gap-4 shadow-sm">
                <div className="flex items-center gap-4">
                  <span className="text-white font-bold bg-[#06B6D4] px-2.5 py-1 rounded">A</span>
                  <span className="text-[#374151]">Chicken</span>
                </div>
                <Check className="w-5 h-5 text-[#22C55E]" strokeWidth={3} />
              </div>

              {/* Other Options */}
              <div className="border border-[#E5E7EB] bg-white rounded-xl px-4 py-3 flex items-center gap-4 shadow-sm">
                <span className="text-[#6B7280] font-bold">B</span>
                <span className="text-[#374151]">Monkey</span>
              </div>
              <div className="border border-[#E5E7EB] bg-white rounded-xl px-4 py-3 flex items-center gap-4 shadow-sm">
                <span className="text-[#6B7280] font-bold">C</span>
                <span className="text-[#374151]">Lion</span>
              </div>
              <div className="border border-[#E5E7EB] bg-white rounded-xl px-4 py-3 flex items-center gap-4 shadow-sm">
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

              <div className="absolute -top-4 right-6 bg-gradient-to-r from-[#F97316] to-[#F59E0B] text-white px-4 py-2 rounded-lg font-bold text-[14px] shadow-sm">
                Mark: 6 / 10
              </div>

              <p className="text-[16px] text-[#374151]">What is your hobby?</p>
            </div>
            <p className="text-[13px] text-[#9CA3AF] mb-3 ml-2">Select the correct answers:</p>
            <div className="grid grid-cols-2 gap-3">
              {/* Selected correctly */}
              <div className="border border-[#22C55E] bg-white rounded-xl px-4 py-3 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#06B6D4]" />
                  <span className="text-[#374151]">Music</span>
                </div>
                <Check className="w-5 h-5 text-[#22C55E]" strokeWidth={3} />
              </div>

              {/* Selected incorrectly */}
              <div className="border border-[#EF4444] bg-[#FFF5F5]/30 rounded-xl px-4 py-3 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#06B6D4]" />
                  <span className="text-[#374151]">Reading</span>
                </div>
                <X className="w-5 h-5 text-[#EF4444]" strokeWidth={3} />
              </div>

              {/* Missed correct answer */}
              <div className="border border-[#EAB308] bg-white rounded-xl px-4 py-3 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                  <Circle className="w-5 h-5 text-[#06B6D4]" />
                  <span className="text-[#374151]">Playing</span>
                </div>
                <Check className="w-5 h-5 text-[#EAB308]" strokeWidth={3} />
              </div>

              {/* Did not select, incorrect anyway */}
              <div className="border border-[#E5E7EB] bg-white rounded-xl px-4 py-3 flex items-center gap-3 shadow-sm">
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

              <div className="absolute -top-4 right-6 bg-gradient-to-r from-[#10B981] to-[#22C55E] text-white px-4 py-2 rounded-lg font-bold text-[14px] shadow-sm">
                Mark: 10 / 10
              </div>

              <p className="text-[16px] text-[#374151]">Which is the tallest animal?</p>
            </div>
            <p className="text-[13px] text-[#9CA3AF] mb-3 ml-2">Select the correct answer:</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="border border-[#E5E7EB] bg-white rounded-xl px-4 py-3 flex items-center justify-center gap-3 shadow-sm">
                <Circle className="w-5 h-5 text-[#06B6D4]" />
                <span className="text-[#374151] font-medium">False</span>
              </div>
              <div className="border border-[#22C55E] bg-white rounded-xl px-4 py-3 flex items-center justify-center gap-3 shadow-sm relative">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-[#06B6D4]" />
                  <span className="text-[#374151] font-medium">True</span>
                </div>
                <Check className="absolute right-4 w-5 h-5 text-[#22C55E]" strokeWidth={3} />
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Navigation */}
        <div className="w-full lg:w-[260px] shrink-0">
          <div className="border border-[#E5E7EB] rounded-xl p-5 shadow-sm sticky top-6">
            <h2 className="text-[18px] font-bold text-[#F97316] mb-4">Quiz navigation</h2>
            
            <div className="grid grid-cols-7 gap-2 mb-6">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map((num) => {
                let colorClass = "border-[#EAB308] text-[#EAB308]"; // yellow default for 4,5,6..
                if (num === 1 || num === 3) colorClass = "border-[#22C55E] text-[#22C55E]"; // Green
                if (num === 2) colorClass = "border-[#EF4444] text-[#EF4444]"; // Red
                
                return (
                  <div 
                    key={num} 
                    className={`relative w-full aspect-square flex items-center justify-center rounded text-[12px] font-bold cursor-pointer transition-all border shadow-sm hover:opacity-80 bg-white ${colorClass}`}
                  >
                    {num}
                    {/* Red Triangle for flagged questions */}
                    {[3, 4].includes(num) && (
                      <div className="absolute top-0 right-0 w-0 h-0 border-l-[10px] border-l-transparent border-t-[10px] border-t-[#EF4444]"></div>
                    )}
                  </div>
                );
              })}
            </div>

            <button className="w-full bg-[#4F46E5] hover:bg-[#4338CA] transition-colors text-white font-bold py-2.5 rounded-lg text-[14px]">
              Finish review
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
