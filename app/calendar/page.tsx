'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function CalendarPage() {
  const days = [
    { day: 'Sun', date: '1', current: false },
    { day: 'Mon', date: '2', current: false },
    { day: 'Tue', date: '3', current: false },
    { day: 'Wed', date: '4', current: true },
    { day: 'Thu', date: '5', current: false },
    { day: 'Fri', date: '6', current: false },
    { day: 'Sat', date: '7', current: false },
  ];

  return (
    <MainLayout>
      <div className="flex flex-col h-full bg-white relative p-6 lg:p-8 overflow-hidden">
        
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-6">
          <Select defaultValue="all">
            <SelectTrigger className="w-[200px] h-10 border-[#E5E7EB] text-[#6B7280] rounded-xl bg-white font-medium shadow-sm">
              <SelectValue placeholder="All courses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All courses</SelectItem>
              <SelectItem value="astronomy">Introduce to Astronomy</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-6 absolute left-1/2 -translate-x-1/2">
            <button className="text-[#374151] hover:bg-gray-100 p-1 rounded-full transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-[15px] font-bold text-[#374151]">Nov 3 - Nov 9, 2024</span>
            <button className="text-[#374151] hover:bg-gray-100 p-1 rounded-full transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          
          {/* Empty div for right side flex balance if needed, or just let absolute positioning handle the center */}
          <div className="w-[200px]"></div>
        </div>

        {/* Calendar Grid */}
        <div className="flex-1 min-h-0 border border-[#E5E7EB] rounded-[16px] shadow-sm flex bg-white overflow-hidden">
          
          {days.map((d, index) => (
            <div key={index} className={`flex-1 flex flex-col border-r border-[#E5E7EB] last:border-r-0`}>
              
              {/* Day Header */}
              <div className="h-20 flex flex-col items-center justify-center border-b border-[#E5E7EB]">
                <span className={`text-[12px] font-bold mb-1 ${d.current ? 'text-[#3B82F6]' : 'text-[#9CA3AF]'}`}>
                  {d.day}
                </span>
                <div className={`w-8 h-8 flex items-center justify-center rounded-full text-[18px] font-bold ${d.current ? 'bg-[#312E81] text-white' : 'text-[#6B7280]'}`}>
                  {d.date}
                </div>
              </div>

              {/* Day Content Area */}
              <div className="flex-1 relative overflow-y-auto">
                
                {/* Thursday 5 */}
                {d.date === '5' && (
                  <div className="bg-[#F5F3FF] border-l-4 border-[#7E22CE] p-2 h-[80px] w-full flex flex-col justify-center">
                    <p className="text-[12px] font-bold text-[#7E22CE] leading-tight mb-1 truncate">Assignment for first week</p>
                    <p className="text-[11px] font-medium text-[#7E22CE]">11:50 PM</p>
                  </div>
                )}

                {/* Friday 6 */}
                {d.date === '6' && (
                  <>
                    <div className="bg-[#312E81] p-2 h-[80px] w-full flex flex-col justify-center">
                      <p className="text-[12px] font-bold text-white leading-tight mb-1 truncate">Meeting</p>
                      <p className="text-[11px] font-medium text-white/80">09:00 AM - 09:30 AM</p>
                    </div>
                    <div className="bg-[#FDF2F8] border-l-4 border-[#DB2777] p-2 h-[80px] w-full flex flex-col justify-center">
                      <p className="text-[12px] font-bold text-[#DB2777] leading-tight mb-1 truncate">Review basic Astronomy...</p>
                      <p className="text-[11px] font-medium text-[#DB2777]">2:00 PM</p>
                    </div>
                  </>
                )}

                {/* Saturday 7 */}
                {d.date === '7' && (
                  <div className="bg-[#FDF2F8] border-l-4 border-[#DB2777] p-2 h-[80px] w-full flex flex-col justify-center">
                    <p className="text-[12px] font-bold text-[#DB2777] leading-tight mb-1 truncate">Review basic Astronomy...</p>
                    <p className="text-[11px] font-medium text-[#DB2777]">2:00 PM</p>
                  </div>
                )}

              </div>
            </div>
          ))}

        </div>

      </div>
    </MainLayout>
  );
}
