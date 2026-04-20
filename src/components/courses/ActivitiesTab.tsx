'use client';

import React, { useState } from 'react';
import { FileUp, ListChecks, MoreVertical, Calendar } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CourseResponse } from '@/services/courseService';

interface ActivitiesTabProps {
  course: CourseResponse;
}

export function ActivitiesTab({ course }: ActivitiesTabProps) {
  const [filter, setFilter] = useState('all');

  // Flatten all topics from all sections that are activities
  const allActivities = course.sections?.flatMap(section => 
    (section.topics || []).filter(topic => 
      (topic.type === 'assignment' || topic.type === 'quiz') && 
      (filter === 'all' || topic.type === filter)
    ).map(topic => ({ ...topic, sectionTitle: section.title }))
  ) || [];

  return (
    <div className="w-full max-w-5xl mx-auto py-8">
      
      {/* Dropdown filters */}
      <div className="flex justify-between items-center mb-10 pb-6 border-b border-gray-100">
        <div>
           <h2 className="text-[20px] font-bold text-[#374151]">Course Activities</h2>
           <p className="text-gray-400 text-[14px]">Manage and track your assignments and tests</p>
        </div>
        <Select defaultValue="all" onValueChange={setFilter}>
          <SelectTrigger className="w-[200px] h-11 border-[#E5E7EB] text-[#6B7280] rounded-xl bg-white shadow-sm font-bold">
            <SelectValue placeholder="Select topic" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All activities</SelectItem>
            <SelectItem value="assignment">Assignments</SelectItem>
            <SelectItem value="quiz">Quizzes</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-12">
        {course.sections?.map(section => {
          const sectionActivities = (section.topics || []).filter(t => 
             (t.type === 'assignment' || t.type === 'quiz') && 
             (filter === 'all' || t.type === filter)
          );

          if (sectionActivities.length === 0) return null;

          return (
            <section key={section.id} className="relative">
              <div className="flex items-center justify-between border-b border-[#F3F4F6] pb-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-6 bg-[#3B82F6] rounded-full"></div>
                  <h3 className="text-[18px] font-black text-[#4B5563]">{section.title}</h3>
                </div>
                <button className="text-[#9CA3AF] hover:bg-gray-100 p-2 rounded-xl transition-all">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>
              
              <div className="grid gap-4">
                {sectionActivities.map(activity => (
                  <div key={activity.id} className="flex items-center justify-between p-5 bg-white border border-[#F3F4F6] hover:border-[#3B82F6] rounded-[20px] group cursor-pointer transition-all shadow-sm hover:shadow-md">
                    <div className="flex items-center gap-5">
                      <div className={`p-3 rounded-2xl ${activity.type === 'assignment' ? 'bg-purple-50 text-purple-600' : 'bg-pink-50 text-pink-600'}`}>
                        {activity.type === 'assignment' ? <FileUp className="w-6 h-6" /> : <ListChecks className="w-6 h-6" />}
                      </div>
                      <div>
                        <h4 className="font-bold text-[#1F2937] group-hover:text-[#3B82F6] transition-colors">{activity.title}</h4>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[11px] font-black uppercase tracking-widest text-gray-400">{activity.type}</span>
                          <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                          <div className="flex items-center gap-1.5 text-[12px] text-gray-500 font-medium">
                             <Calendar className="w-3.5 h-3.5" />
                             <span>Due Oct 12, 2024</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right hidden sm:block">
                        <p className="text-[12px] font-bold text-gray-400 mb-0.5 uppercase tracking-tighter">Status</p>
                        <span className={`text-[13px] font-black ${activity.type === 'assignment' ? 'text-[#F97316]' : 'text-gray-400'}`}>
                           {activity.type === 'assignment' ? 'Not Submitted' : 'Not Started'}
                        </span>
                      </div>
                      <div className="h-10 w-[1px] bg-gray-100 hidden sm:block"></div>
                      <button className="bg-[#F9FAFB] group-hover:bg-[#3B82F6] text-[#6B7280] group-hover:text-white px-5 py-2.5 rounded-xl text-[14px] font-bold transition-all">
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })}

        {allActivities.length === 0 && (
          <div className="py-20 flex flex-col items-center justify-center text-center bg-gray-50/50 rounded-[32px] border-2 border-dashed border-gray-200">
             <div className="bg-white p-6 rounded-full shadow-sm mb-4">
               <Calendar className="w-10 h-10 text-gray-300" />
             </div>
             <h3 className="text-[18px] font-bold text-gray-500">No activities found</h3>
             <p className="text-gray-400 text-[14px] mt-1">There are no assignments or quizzes matching your criteria</p>
          </div>
        )}
      </div>
    </div>
  );
}
