'use client';

import { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Loader2, Calendar as CalendarIcon, Clock, MapPin, BookOpen } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { userService, UserWorkTopic } from '@/services/userService';
import { format, startOfWeek, addDays, isSameDay, parseISO, endOfWeek } from 'date-fns';

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [topics, setTopics] = useState<UserWorkTopic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCourseId, setSelectedCourseId] = useState('all');

  // Helper to get dates for the current week (Sun - Sat)
  const weekDates = useMemo(() => {
    const start = startOfWeek(currentDate);
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [currentDate]);

  const fetchTopics = async () => {
    try {
      setIsLoading(true);
      const start = startOfWeek(currentDate).toISOString();
      const end = endOfWeek(currentDate).toISOString();
      
      const res = await userService.getUserWork({ start, end });
      setTopics(res.data);
    } catch (error) {
      console.error('Error fetching calendar topics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTopics();
  }, [currentDate]);

  const courses = useMemo(() => {
    const uniqueCourses = new Map();
    topics.forEach(t => {
      if (t.course) {
        uniqueCourses.set(t.course.id, t.course.title);
      }
    });
    return Array.from(uniqueCourses.entries()).map(([id, title]) => ({ id, title }));
  }, [topics]);

  const filteredTopics = useMemo(() => {
    if (selectedCourseId === 'all') return topics;
    return topics.filter(t => t.course?.id === selectedCourseId);
  }, [topics, selectedCourseId]);

  const navigatePrev = () => {
    setCurrentDate(prev => addDays(prev, -7));
  };

  const navigateNext = () => {
    setCurrentDate(prev => addDays(prev, 7));
  };

  const getTopicColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'meeting': return 'bg-[#312E81] text-white border-none';
      case 'quiz': return 'bg-[#FDF2F8] text-[#DB2777] border-[#DB2777]';
      case 'assignment': return 'bg-[#F5F3FF] text-[#7E22CE] border-[#7E22CE]';
      default: return 'bg-gray-100 text-gray-600 border-gray-300';
    }
  };

  const formatTime = (isoString: string) => {
    try {
      const date = parseISO(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  return (
    <MainLayout>
      <div className="flex flex-col h-full bg-white relative p-6 lg:p-8 overflow-hidden">
        
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
             <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                <CalendarIcon className="w-8 h-8 text-blue-600" />
                Schedule
             </h1>
             <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                <SelectTrigger className="w-[240px] h-11 border-[#E5E7EB] text-[#374151] rounded-xl bg-white font-bold shadow-sm ring-0 focus:ring-2 focus:ring-blue-500/20 transition-all">
                  <SelectValue>
                    {selectedCourseId === 'all' ? 'All courses' : courses.find(c => c.id === selectedCourseId)?.title || 'Loading...'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="rounded-xl border-[#E5E7EB] shadow-xl">
                  <SelectItem value="all" className="font-bold">All courses</SelectItem>
                  {courses.map(c => (
                    <SelectItem key={c.id} value={c.id} className="font-medium">{c.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
          </div>

          <div className="flex items-center gap-6 absolute left-1/2 -translate-x-1/2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/50">
            <button 
              onClick={navigatePrev}
              className="w-10 h-10 flex items-center justify-center text-[#374151] hover:bg-white hover:shadow-sm rounded-xl transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-[14px] font-black text-[#374151] px-4 min-w-[180px] text-center">
              {format(weekDates[0], 'MMM d')} - {format(weekDates[6], 'MMM d, yyyy')}
            </span>
            <button 
              onClick={navigateNext}
              className="w-10 h-10 flex items-center justify-center text-[#374151] hover:bg-white hover:shadow-sm rounded-xl transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          
          <button 
            onClick={() => setCurrentDate(new Date())}
            className="px-6 h-11 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-all shadow-sm active:scale-95"
          >
            Today
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="flex-1 min-h-0 border border-slate-200 rounded-[24px] shadow-sm flex bg-white overflow-hidden">
          {isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-slate-50/50">
               <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
               <p className="font-bold text-slate-500 animate-pulse tracking-widest uppercase text-xs">Syncing Schedule...</p>
            </div>
          ) : (
            weekDates.map((date, index) => {
              const dayTopics = filteredTopics.filter(t => {
                const topicDate = t.data?.open || t.data?.close || t.data?.startTime;
                return topicDate && isSameDay(parseISO(topicDate), date);
              });

              const isToday = isSameDay(date, new Date());

              return (
                <div key={index} className={`flex-1 flex flex-col border-r border-slate-100 last:border-r-0 ${isToday ? 'bg-blue-50/20' : ''}`}>
                  
                  {/* Day Header */}
                  <div className={`h-24 flex flex-col items-center justify-center border-b border-slate-100 ${isToday ? 'bg-blue-50/50' : ''}`}>
                    <span className={`text-[11px] font-black mb-2 uppercase tracking-widest ${isToday ? 'text-blue-600' : 'text-slate-400'}`}>
                      {format(date, 'EEE')}
                    </span>
                    <div className={`w-10 h-10 flex items-center justify-center rounded-xl text-[16px] font-black transition-all ${isToday ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-600 bg-slate-100'}`}>
                      {format(date, 'd')}
                    </div>
                  </div>

                  {/* Day Content Area */}
                  <div className="flex-1 relative overflow-y-auto p-3 space-y-3 custom-scrollbar">
                    {dayTopics.length > 0 ? (
                      dayTopics.map((topic) => (
                        <div 
                          key={topic.id}
                          className={`p-3 rounded-2xl border-l-4 shadow-sm transition-all hover:scale-[1.02] active:scale-95 cursor-pointer ${getTopicColor(topic.type)}`}
                        >
                          <div className="flex items-center gap-1.5 mb-1 opacity-80">
                             {topic.type === 'meeting' && <Clock className="w-3 h-3" />}
                             {topic.type === 'assignment' && <BookOpen className="w-3 h-3" />}
                             {topic.type === 'quiz' && <Clock className="w-3 h-3" />}
                             <span className="text-[9px] font-black uppercase tracking-tighter">{topic.type}</span>
                          </div>
                          <p className="text-[12px] font-black leading-tight mb-2 line-clamp-2">
                            {topic.title}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] font-bold opacity-70">
                             <Clock className="w-3 h-3" />
                             <span>
                               {topic.data?.open ? formatTime(topic.data.open) : 
                                topic.data?.startTime ? formatTime(topic.data.startTime) : 
                                formatTime(topic.data?.close || '')}
                             </span>
                          </div>
                          {topic.course && (
                            <div className="mt-2 pt-2 border-t border-black/5 flex items-center gap-1.5">
                               <div className="w-4 h-4 rounded-md bg-blue-500/20 flex items-center justify-center">
                                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                               </div>
                               <span className="text-[9px] font-bold truncate opacity-60 italic">{topic.course.title}</span>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="h-full flex items-center justify-center opacity-10">
                         <div className="w-full h-px bg-slate-200"></div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </MainLayout>
  );
}
