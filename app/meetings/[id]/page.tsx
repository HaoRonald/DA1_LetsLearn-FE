'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { courseApi, TopicResponse } from '@/services/courseService';
import { topicApi } from '@/services/topicService';
import MainLayout from '@/components/layout/MainLayout';
import { Loader2, Video, ChevronRight, Clock, AlignLeft, Send, MoreVertical, Reply, Calendar as CalendarIcon, ArrowLeft } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function MeetingTopicPage() {
  const { id: topicId } = useParams() as { id: string };
  const searchParams = useSearchParams();
  const courseId = searchParams.get('courseId');
  const router = useRouter();
  const { user } = useAuth();
  
  const [topic, setTopic] = useState<TopicResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form states for Settings tab
  const [name, setName] = useState('');
  const [meetingDate, setMeetingDate] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (!courseId || !topicId) {
      setIsLoading(false);
      return;
    }
    const fetchTopic = async () => {
      try {
        const res = await courseApi.getTopicById(courseId, topicId);
        setTopic(res.data);
        setName(res.data.title || '');
        
        const dataStr = res.data.data;
        if (dataStr) {
          try {
            const parsed = typeof dataStr === 'string' ? JSON.parse(dataStr) : dataStr;
            setMeetingDate(parsed.meetingDate || '');
            setDescription(parsed.description || '');
          } catch {
            setDescription(typeof dataStr === 'string' ? dataStr : '');
          }
        }
      } catch (err) {
        console.error('Failed to fetch meeting topic:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTopic();
  }, [courseId, topicId]);

  const handleSave = async () => {
    if (!courseId || !topic) return;
    setIsSaving(true);
    try {
      const updatedData = {
        meetingDate,
        description
      };
      await topicApi.update(courseId, topicId, {
        id: topicId,
        title: name,
        type: topic.type,
        data: updatedData
      });
      setTopic(prev => prev ? { ...prev, title: name, data: updatedData } : null);
      toast.success('Settings saved successfully');
    } catch (err) {
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      </MainLayout>
    );
  }

  if (!courseId || !topic) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[500px] text-center px-4">
          <div className="p-4 bg-red-50 rounded-2xl mb-4">
            <p className="text-red-500 font-bold">Meeting Not Found</p>
          </div>
          <button onClick={() => router.back()} className="mt-6 font-bold text-gray-600 px-6 py-2 border rounded-xl">Go Back</button>
        </div>
      </MainLayout>
    );
  }

  const isTeacher = user?.role === 'Teacher' || user?.role === 'Admin';
  
  const breadcrumbs = (
    <div className="flex items-center text-[14px] font-medium">
      <span className="text-[#6B7280] hidden md:inline ml-2 cursor-pointer hover:text-indigo-600" onClick={() => router.push("/")}>Home</span>
      <ChevronRight className="w-4 h-4 mx-2 text-[#9CA3AF] hidden md:inline" />
      <span className="text-[#6B7280] cursor-pointer hover:text-indigo-600" onClick={() => router.push(`/courses/${courseId}`)}>Course</span>
      <ChevronRight className="w-4 h-4 mx-2 text-[#9CA3AF]" />
      <span className="font-bold text-[#374151]">{topic.title}</span>
    </div>
  );

  return (
    <MainLayout headerTitle={breadcrumbs}>
      <div className="flex flex-col min-h-screen bg-[#F0F2F5] relative">
        {/* Dark Blue Header */}
        <div className="w-full bg-gradient-to-r from-[#211C64] to-[#1A164D] pt-10 pb-20 px-6 md:px-10">
          <div className="flex flex-col gap-6 mb-8 text-white">
            <button 
              onClick={() => router.push(`/courses/${courseId}`)}
              className="flex items-center gap-2 w-fit px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-sm font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to course
            </button>
            <div className="flex items-center gap-4 text-white">
              <Video className="w-8 h-8 shrink-0" strokeWidth={1.5} />
              <h1 className="text-[32px] font-medium tracking-wide">{topic.title}</h1>
            </div>
          </div>

          <Tabs defaultValue="detail" className="w-full">
            <div className="border-b-[1.5px] border-white/10 w-full">
              <TabsList className="bg-transparent p-0 flex justify-start gap-8 w-full h-auto">
                <TabsTrigger
                  value="detail"
                  className="flex-none px-1 py-3 text-[15px] font-medium text-white/70 hover:text-white data-[state=active]:text-white rounded-none transition-all !bg-transparent !shadow-none data-[state=active]:relative data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-[3px] data-[state=active]:after:bg-white data-[state=active]:font-bold"
                >
                  Detail
                </TabsTrigger>
                {isTeacher && (
                  <TabsTrigger
                    value="settings"
                    className="flex-none px-1 py-3 text-[15px] font-medium text-white/70 hover:text-white data-[state=active]:text-white rounded-none transition-all !bg-transparent !shadow-none data-[state=active]:relative data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-[3px] data-[state=active]:after:bg-white data-[state=active]:font-bold"
                  >
                    Settings
                  </TabsTrigger>
                )}
              </TabsList>
            </div>

            <div className="mt-8">
              <TabsContent value="detail" className="mt-0 outline-none w-full space-y-6">
                <div className="bg-white rounded-[12px] shadow-sm border border-[#E5E7EB] p-8 md:p-10">
                  <div className="flex flex-col gap-6">
                    <div className="flex items-start gap-4">
                      <Clock className="w-6 h-6 text-[#6B7280] mt-1 shrink-0" />
                      <div className="flex flex-col">
                        <span className="text-[16px] font-bold text-[#1F2937]">
                          {meetingDate ? format(new Date(meetingDate), 'EEEE, MMMM d, yyyy h:mm a') : 'No date set'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-4">
                      <AlignLeft className="w-6 h-6 text-[#6B7280] mt-1 shrink-0" />
                      <div className="flex-1 text-[#4B5563] text-[15px] leading-relaxed">
                        {description || 'No description available for this meeting.'}
                      </div>
                    </div>

                    <div className="flex justify-center md:justify-end mt-4">
                      <button className="bg-[#06B6D4] hover:bg-cyan-600 text-white font-bold px-10 py-2.5 rounded-lg shadow-sm transition-all">
                        Join
                      </button>
                    </div>
                  </div>
                </div>

                {/* Comments Section */}
                <div className="bg-white rounded-[12px] shadow-sm border border-[#E5E7EB] p-6 lg:p-8">
                  <div className="flex items-center gap-3 mb-8">
                    <MoreVertical className="w-5 h-5 text-gray-400 rotate-90" />
                    <h3 className="text-[14px] font-bold text-[#6B7280]">Class comments</h3>
                  </div>

                  <div className="space-y-8 mb-10">
                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-gray-100">
                        <img src="https://ui-avatars.com/api/?name=Emilia&background=FF85C0&color=fff" alt="User" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-[#374151] text-[14px]">Emilia</span>
                          <span className="text-[12px] text-gray-400">8:11 AM</span>
                        </div>
                        <p className="text-[14px] text-[#4B5563]">I won't be able to attend class today due to illness.</p>
                        <div className="flex items-center gap-4 mt-3">
                          <button className="text-gray-400 hover:text-indigo-600"><Reply className="w-4 h-4" /></button>
                          <button className="text-gray-400 hover:text-red-500"><MoreVertical className="w-4 h-4" /></button>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-4 pl-14">
                      <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-gray-100">
                        <img src="https://ui-avatars.com/api/?name=John+Doe&background=3B82F6&color=fff" alt="User" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-[#374151] text-[14px]">John Doe</span>
                          <span className="text-[12px] text-gray-400">Yesterday</span>
                        </div>
                        <p className="text-[14px] text-[#4B5563]">
                          <span className="text-indigo-600 font-bold mr-1">@Emilia</span>
                          Thanks for let me know. Hope you go well soon!
                        </p>
                        <div className="flex items-center justify-end">
                           <button className="text-gray-400 hover:text-indigo-600"><Reply className="w-4 h-4" /></button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 bg-white border border-[#E5E7EB] rounded-full px-6 py-2 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
                    <img src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.username}&background=random`} className="w-8 h-8 rounded-full border" alt="User" />
                    <input 
                      type="text" 
                      placeholder="Add class comment" 
                      className="flex-1 bg-transparent border-none outline-none text-[14px] py-2"
                    />
                    <button className="text-gray-400 hover:text-indigo-600 transition-colors">
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </TabsContent>
              
              {isTeacher && (
                <TabsContent value="settings" className="mt-0 outline-none w-full">
                  <div className="bg-white rounded-[12px] shadow-sm border border-[#E5E7EB] p-8 md:p-10 min-h-[500px]">
                    <div className="mb-6">
                      <h2 className="text-[20px] font-bold text-[#F97316]">Edit Setting</h2>
                    </div>

                    <div className="space-y-6">
                      <div className="flex items-center gap-4 px-1">
                        <Video className="w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          value={name}
                          onChange={e => setName(e.target.value)}
                          placeholder="Meeting title"
                          className="flex-1 w-full border border-[#E5E7EB] rounded-lg px-4 py-3 text-[14px] focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div className="flex items-center gap-4 px-1">
                        <Clock className="w-5 h-5 text-gray-400" />
                        <div className="flex-1 relative">
                          <input
                            type="datetime-local"
                            value={meetingDate}
                            onChange={e => setMeetingDate(e.target.value)}
                            className="w-full border border-[#E5E7EB] rounded-lg px-4 py-3 text-[14px] focus:outline-none focus:border-indigo-500 appearance-none"
                          />
                        </div>
                      </div>

                      <div className="flex items-start gap-4 px-1">
                        <AlignLeft className="w-5 h-5 text-gray-400 mt-3" />
                        <div className="flex-1 border border-[#E5E7EB] rounded-lg overflow-hidden">
                           <div className="bg-[#F9FAFB] border-b border-[#E5E7EB] px-4 py-2 flex items-center gap-4 text-[#6B7280]">
                              <span className="text-[12px] font-bold">File</span>
                              <span className="text-[12px] font-bold">Edit</span>
                              <span className="text-[12px] font-bold">View</span>
                              <span className="text-[12px] font-bold">Format</span>
                           </div>
                           <textarea
                            rows={8}
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Write details for this meeting"
                            className="w-full px-4 py-3 text-[14px] focus:outline-none bg-white resize-none"
                          />
                        </div>
                      </div>

                      <div className="flex justify-center mt-8">
                        <button 
                          onClick={handleSave} 
                          disabled={isSaving}
                          className="bg-[#06B6D4] hover:bg-cyan-600 text-white font-bold px-12 py-2.5 rounded-lg shadow-sm transition-all flex items-center gap-2"
                        >
                          {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                          Save
                        </button>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              )}
            </div>
          </Tabs>
        </div>
      </div>
    </MainLayout>
  );
}
