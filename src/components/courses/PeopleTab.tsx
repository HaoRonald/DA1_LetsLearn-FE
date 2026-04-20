'use client';

import { Users, ShieldCheck, Mail, MessageSquare } from 'lucide-react';
import { CourseResponse } from '@/services/courseService';

interface PeopleTabProps {
  course: CourseResponse;
}

export function PeopleTab({ course }: PeopleTabProps) {
  return (
    <div className="w-full max-w-5xl mx-auto py-8">
      
      {/* Instructors Section */}
      <section className="mb-16">
        <div className="flex items-center justify-between border-b border-[#F3F4F6] pb-4 mb-8">
          <div className="flex items-center gap-3">
             <ShieldCheck className="w-6 h-6 text-[#3B82F6]" />
             <h2 className="text-[20px] font-black text-[#374151]">Instructors</h2>
          </div>
          <span className="bg-blue-50 text-[#3B82F6] px-3 py-1 rounded-full text-[12px] font-black uppercase">1 Profile</span>
        </div>
        
        <div className="grid gap-4">
          {course.creator && (
            <div className="flex items-center justify-between p-4 bg-white border border-[#F3F4F6] rounded-[24px] hover:shadow-md transition-all group">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0 border-2 border-[#3B82F6]/20">
                  <img 
                    src={course.creator.avatar || `https://ui-avatars.com/api/?name=${course.creator.username}&background=3B82F6&color=fff`} 
                    alt={course.creator.username} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                   <span className="font-black text-[#1F2937] text-[18px] block group-hover:text-[#3B82F6] transition-colors">{course.creator.username}</span>
                   <span className="text-[13px] text-gray-400 font-medium">Main Instructor</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                 <button className="p-3 bg-gray-50 text-gray-400 hover:bg-blue-50 hover:text-[#3B82F6] rounded-2xl transition-all">
                    <Mail className="w-5 h-5" />
                 </button>
                 <button className="p-3 bg-gray-50 text-gray-400 hover:bg-blue-50 hover:text-[#3B82F6] rounded-2xl transition-all">
                    <MessageSquare className="w-5 h-5" />
                 </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Members Section */}
      <section>
        <div className="flex items-center justify-between border-b border-[#F3F4F6] pb-4 mb-8">
          <div className="flex items-center gap-3">
             <Users className="w-6 h-6 text-[#F97316]" />
             <h2 className="text-[20px] font-black text-[#374151]">Classmates</h2>
          </div>
          <span className="bg-orange-50 text-[#F97316] px-3 py-1 rounded-full text-[12px] font-black uppercase">
            {course.students?.length || 0} Members
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {course.students && course.students.length > 0 ? (
            course.students.map((student) => (
              <div key={student.id} className="flex items-center justify-between p-4 bg-white border border-[#F3F4F6] rounded-[24px] hover:shadow-sm transition-all group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl overflow-hidden shrink-0 border border-gray-100">
                    <img 
                      src={student.avatar || `https://ui-avatars.com/api/?name=${student.username}&background=random`} 
                      alt={student.username} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="font-bold text-[#4B5563] text-[16px] group-hover:text-[#3B82F6] transition-colors">{student.username}</span>
                </div>
                <button className="p-2 text-gray-300 hover:text-gray-600 transition-colors">
                   <MessageSquare className="w-4 h-4" />
                </button>
              </div>
            ))
          ) : (
            <div className="col-span-full py-12 text-center bg-gray-50 rounded-[32px] border-2 border-dashed border-gray-100">
               <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
               <p className="text-gray-400 font-medium">No students joined yet</p>
            </div>
          )}
        </div>
      </section>

    </div>
  );
}
