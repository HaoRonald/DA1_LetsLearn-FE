'use client';

import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { courseApi } from '@/services/courseService';
import { Activity, Award, CheckCircle, Clock, TrendingUp } from 'lucide-react';

interface DashboardTabProps {
  course: any;
}

function MetricCard({ title, value, subValue, icon: Icon, color }: { title: string, value: string | number, subValue?: string, icon: any, color: string }) {
  return (
    <div className="bg-white border border-[#F3F4F6] rounded-[24px] p-6 shadow-sm hover:shadow-md transition-all group">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-2xl ${color} bg-opacity-10 transition-colors group-hover:bg-opacity-20`}>
          <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
        </div>
        {subValue && (
          <span className="text-[12px] font-bold text-[#22C55E] bg-[#F0FDF4] px-2 py-0.5 rounded-lg">
            {subValue}
          </span>
        )}
      </div>
      <p className="text-[12px] font-bold text-[#9CA3AF] uppercase tracking-wider mb-1">{title}</p>
      <h3 className="text-[28px] font-black text-[#1F2937]">{value}</h3>
    </div>
  );
}

export function DashboardTab({ course }: DashboardTabProps) {
  const [assignmentReport, setAssignmentReport] = useState<any>(null);
  const [quizReport, setQuizReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const [assignRes, quizRes] = await Promise.all([
          courseApi.getAssignmentReport(course.id),
          courseApi.getQuizReport(course.id)
        ]);
        setAssignmentReport(assignRes.data);
        setQuizReport(quizRes.data);
      } catch (error) {
        console.error('Failed to fetch reports:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, [course.id]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-40 bg-gray-100 rounded-[24px] animate-pulse"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="w-full pb-12">
      
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard 
          title="Quiz Completion" 
          value={`${Math.round(quizReport?.avgCompletionPercentage || 0)}%`} 
          icon={CheckCircle} 
          color="bg-pink-600" 
        />
        <MetricCard 
          title="Avg Quiz Score" 
          value={(quizReport?.avgStudentScoreBase10 || 0).toFixed(1)} 
          subValue="+2.4%" 
          icon={Award} 
          color="bg-blue-600" 
        />
        <MetricCard 
          title="Avg Assignment" 
          value={(assignmentReport?.avgMark || 0).toFixed(1)} 
          icon={TrendingUp} 
          color="bg-purple-600" 
        />
        <MetricCard 
          title="Assign. Completion" 
          value={`${Math.round((assignmentReport?.avgCompletionRate || 0) * 100)}%`} 
          icon={Activity} 
          color="bg-cyan-600" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Quiz Progress */}
        <div className="bg-white border border-[#F3F4F6] rounded-[32px] p-8 shadow-sm">
           <div className="flex justify-between items-center mb-8">
              <h3 className="text-[18px] font-black text-[#1F2937]">Quiz Performance</h3>
              <div className="flex items-center gap-2 text-[12px] font-bold text-gray-400 capitalize bg-gray-50 px-3 py-1 rounded-lg">
                <Clock className="w-3.5 h-3.5" /> Recent 5 Units
              </div>
           </div>
           <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                 <LineChart data={quizReport?.singleQuizReports?.slice(0, 6).map((r: any) => ({ name: r.name, value: r.avgStudentMarkBase10 * 10 }))}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 11, fontWeight: 700 }} dy={15} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 11, fontWeight: 700 }} unit="%" />
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                      itemStyle={{ fontWeight: '800', color: '#DB2777' }}
                    />
                    <Line type="monotone" dataKey="value" stroke="#DB2777" strokeWidth={4} dot={{ r: 4, fill: '#DB2777', strokeWidth: 2, stroke: '#fff' }} />
                 </LineChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* Assignment Progress */}
        <div className="bg-white border border-[#F3F4F6] rounded-[32px] p-8 shadow-sm">
           <div className="flex justify-between items-center mb-8">
              <h3 className="text-[18px] font-black text-[#1F2937]">Assignment Success</h3>
              <div className="flex items-center gap-2 text-[12px] font-bold text-gray-400 capitalize bg-gray-50 px-3 py-1 rounded-lg">
                 <Clock className="w-3.5 h-3.5" /> Last Submissions
              </div>
           </div>
           <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                 <LineChart data={assignmentReport?.singleAssignmentReports?.slice(0, 6).map((r: any) => ({ name: r.name, value: r.avgMark * 10 }))}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 11, fontWeight: 700 }} dy={15} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 11, fontWeight: 700 }} unit="%" />
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                      itemStyle={{ fontWeight: '800', color: '#7E22CE' }}
                    />
                    <Line type="monotone" dataKey="value" stroke="#7E22CE" strokeWidth={4} dot={{ r: 4, fill: '#7E22CE', strokeWidth: 2, stroke: '#fff' }} />
                 </LineChart>
              </ResponsiveContainer>
           </div>
        </div>
      </div>

      {/* Breakdown Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         <div className="bg-white border border-[#F3F4F6] rounded-[32px] p-8 shadow-sm">
            <h3 className="text-[16px] font-black text-[#1F2937] mb-6">Course Statistics</h3>
            <div className="space-y-6">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                     <span className="text-[14px] font-bold text-gray-500">Total Assignments</span>
                  </div>
                  <span className="font-black text-[#1F2937]">{assignmentReport?.assignmentCount || 0}</span>
               </div>
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <div className="w-2 h-2 rounded-full bg-pink-500"></div>
                     <span className="text-[14px] font-bold text-gray-500">Total Quizzes</span>
                  </div>
                  <span className="font-black text-[#1F2937]">{quizReport?.quizCount || 0}</span>
               </div>
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                     <span className="text-[14px] font-bold text-gray-500">Students in Class</span>
                  </div>
                  <span className="font-black text-[#1F2937]">{course.totalJoined || 0}</span>
               </div>
            </div>
         </div>

         <div className="bg-[#1F2937] rounded-[32px] p-8 shadow-lg text-white relative overflow-hidden">
            <div className="relative z-10">
               <h3 className="text-[20px] font-black mb-2">Ready for Next Lesson?</h3>
               <p className="text-gray-400 text-[14px] mb-8 max-w-[200px]">Keep consistency to reach your learning goals faster!</p>
               <button className="bg-[#3B82F6] hover:bg-blue-600 text-white font-black px-8 py-3 rounded-2xl transition-all shadow-lg hover:shadow-blue-500/20">
                  Continue Learning
               </button>
            </div>
            <TrendingUp className="absolute -bottom-6 -right-6 w-48 h-48 text-white/5" />
         </div>
      </div>

    </div>
  );
}
