'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { courseApi, TopicResponse } from '@/services/courseService';
import { topicApi, SaveMeetingHistoryRequest } from '@/services/topicService';
import { commentApi, GetCommentResponse } from '@/services/commentService';
import MainLayout from '@/components/layout/MainLayout';
import { 
  Loader2, Video, ChevronRight, Clock, AlignLeft, 
  Send, MoreVertical, Reply, Calendar as CalendarIcon, 
  ArrowLeft, Users, Download, Play, Settings as SettingsIcon,
  History as HistoryIcon, Info
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { format, isValid } from 'date-fns';

interface MeetingHistory {
  id: string;
  startTime: string;
  endTime?: string;
  attendeeCount: number;
  attendanceCsvUrl?: string;
}

interface MeetingData {
  description?: string;
  open?: string;
  close?: string;
  histories?: MeetingHistory[];
}

export default function MeetingTopicPage() {
  const { id: topicId } = useParams() as { id: string };
  const searchParams = useSearchParams();
  const courseId = searchParams.get('courseId');
  const initialTab = searchParams.get('tab') || 'detail';
  const router = useRouter();
  const { user } = useAuth();
  
  const [topic, setTopic] = useState<TopicResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [activeTab, setActiveTab] = useState(initialTab);
  
  // Comments state
  const [comments, setComments] = useState<GetCommentResponse[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSendingComment, setIsSendingComment] = useState(false);

  // Form states for Settings tab
  const [name, setName] = useState('');
  const [openDate, setOpenDate] = useState('');
  const [closeDate, setCloseDate] = useState('');
  const [description, setDescription] = useState('');

  const isTeacher = user?.role === 'Teacher' || user?.role === 'Admin';

  useEffect(() => {
    if (!courseId || !topicId) {
      setIsLoading(false);
      return;
    }
    fetchTopic();
    fetchComments();
  }, [courseId, topicId]);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const fetchTopic = async () => {
    try {
      setIsLoading(true);
      const res = await courseApi.getTopicById(courseId!, topicId);
      const topicRes = res.data;
      setTopic(topicRes);
      setName(topicRes.title || '');
      
      const meetingData = topicRes.data as MeetingData;
      if (meetingData) {
        setDescription(meetingData.description || '');
        setOpenDate(meetingData.open ? new Date(meetingData.open).toISOString().slice(0, 16) : '');
        setCloseDate(meetingData.close ? new Date(meetingData.close).toISOString().slice(0, 16) : '');
      }
    } catch (err) {
      console.error('Failed to fetch meeting topic:', err);
      toast.error('Failed to load meeting details');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchComments = async () => {
    if (!courseId || !topicId) return;
    try {
      const res = await commentApi.getByTopic(courseId, topicId);
      setComments(res.data);
    } catch (err) {
      console.error('Failed to fetch comments:', err);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !courseId || !topicId) return;
    setIsSendingComment(true);
    try {
      const res = await commentApi.add(courseId, topicId, {
        topicId,
        text: newComment.trim(),
      });
      setComments([...comments, res.data]);
      setNewComment('');
    } catch (err) {
      console.error('Failed to add comment:', err);
      toast.error('Failed to post comment');
    } finally {
      setIsSendingComment(false);
    }
  };

  const handleSave = async () => {
    if (!courseId || !topic) return;
    setIsSaving(true);
    try {
      const updatedData = {
        description,
        open: openDate ? new Date(openDate).toISOString() : null,
        close: closeDate ? new Date(closeDate).toISOString() : null,
      };

      await topicApi.update(courseId, topicId, {
        id: topicId,
        title: name,
        type: 'meeting',
        data: updatedData
      });

      toast.success('Topic updated successfully!');
    } catch (err) {
      console.error('Failed to save meeting settings:', err);
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleJoin = async () => {
    if (!courseId || !topicId) return;
    setIsJoining(true);
    try {
      // Validate access by fetching token
      await topicApi.getMeetingToken(courseId, topicId);
      
      // Navigate to meeting room
      router.push(`/meetings/${topicId}/room?courseId=${courseId}`);
    } catch (err: any) {
      console.error('Failed to join meeting:', err);
      const errorMsg = err.response?.data?.error || 'Failed to join meeting. Please try again.';
      toast.error(errorMsg);
    } finally {
      setIsJoining(false);
    }
  };

  const getDuration = (history: MeetingHistory) => {
    if (!history.endTime || !history.startTime) return 0;
    const start = new Date(history.startTime).getTime();
    const end = new Date(history.endTime).getTime();
    return Math.round((end - start) / 60000); // Duration in minutes
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
            <p className="text-gray-500 font-medium animate-pulse">Loading meeting details...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!courseId || !topic) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[500px] text-center px-4">
          <div className="p-6 bg-red-50 rounded-3xl mb-6 shadow-sm border border-red-100">
            <Info className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-red-600 font-black text-xl">Meeting Not Found</p>
            <p className="text-red-400 mt-2">The requested meeting does not exist or has been removed.</p>
          </div>
          <button 
            onClick={() => router.back()} 
            className="flex items-center gap-2 font-bold text-gray-600 px-8 py-3 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50 transition-all shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
            Go Back
          </button>
        </div>
      </MainLayout>
    );
  }

  const breadcrumbs = (
    <div className="flex items-center text-[14px] font-medium">
      <span className="text-[#6B7280] hidden md:inline ml-2 cursor-pointer hover:text-blue-600 transition-colors" onClick={() => router.push("/")}>Home</span>
      <ChevronRight className="w-4 h-4 mx-2 text-[#9CA3AF] hidden md:inline" />
      <span className="text-[#6B7280] cursor-pointer hover:text-blue-600 transition-colors" onClick={() => router.push(`/courses/${courseId}`)}>Course</span>
      <ChevronRight className="w-4 h-4 mx-2 text-[#9CA3AF]" />
      <span className="font-bold text-[#374151]">{topic.title}</span>
    </div>
  );

  const meetingData = topic.data as MeetingData;
  const histories = meetingData?.histories || [];

  return (
    <MainLayout headerTitle={breadcrumbs}>
      <div className="flex flex-col min-h-screen bg-[#F8FAFC]">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Blue Gradient Header matching other topics */}
          <div className="w-full bg-gradient-to-r from-blue-600 to-blue-800 pt-10 pb-20 px-6 md:px-12 relative overflow-hidden">
            {/* Subtle background elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full -ml-48 -mb-48 blur-3xl"></div>

            <div className="max-w-7xl mx-auto relative z-10">
              <div className="flex flex-col gap-8 text-white">
                <button 
                  onClick={() => router.push(`/courses/${courseId}`)}
                  className="flex items-center gap-2 w-fit px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-xl transition-all text-sm font-bold border border-white/10 group"
                >
                  <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                  Back to course
                </button>
                
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-lg ring-4 ring-white/10">
                      <Video className="w-7 h-7 text-white" strokeWidth={2.5} />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <h1 className="text-[32px] md:text-[40px] font-black tracking-tight leading-none">{topic.title}</h1>
                      <div className="flex items-center gap-3 text-white/70 text-[13px] font-bold mt-2 uppercase tracking-wider">
                         <span className="flex items-center gap-1.5">
                            <CalendarIcon className="w-4 h-4" />
                            {meetingData?.open ? format(new Date(meetingData.open), 'MMM dd, yyyy') : 'No date set'}
                         </span>
                         <span className="w-1 h-1 bg-white/30 rounded-full"></span>
                         <span className="flex items-center gap-1.5">
                            <Users className="w-4 h-4" />
                            {histories.length} sessions
                         </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                     <button 
                      onClick={handleJoin}
                      disabled={isJoining}
                      className="flex items-center gap-2 bg-white text-blue-600 hover:bg-blue-50 disabled:bg-blue-100 font-black px-8 py-3.5 rounded-2xl shadow-xl shadow-black/10 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      {isJoining ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Play className="w-5 h-5 fill-current" />
                      )}
                      {isJoining ? 'Joining...' : 'Enter Meeting Room'}
                    </button>
                  </div>
                </div>

                <div className="border-b-[1.5px] border-white/20 w-full">
                  <TabsList className="bg-transparent p-0 flex justify-start gap-8 w-full h-auto">
                    <TabsTrigger
                      value="detail"
                      className="flex-none px-1 py-3 text-[15px] font-medium text-white/70 hover:text-white transition-all !bg-transparent !shadow-none data-[state=active]:relative data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-[3.5px] data-[state=active]:after:bg-white data-[state=active]:font-black data-[state=active]:text-white"
                    >
                      Details
                    </TabsTrigger>
                    {isTeacher && (
                      <TabsTrigger
                        value="settings"
                        className="flex-none px-1 py-3 text-[15px] font-medium text-white/70 hover:text-white transition-all !bg-transparent !shadow-none data-[state=active]:relative data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-[3.5px] data-[state=active]:after:bg-white data-[state=active]:font-black data-[state=active]:text-white"
                      >
                        Settings
                      </TabsTrigger>
                    )}
                    {isTeacher && (
                      <TabsTrigger
                        value="history"
                        className="flex-none px-1 py-3 text-[15px] font-medium text-white/70 hover:text-white transition-all !bg-transparent !shadow-none data-[state=active]:relative data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-[3.5px] data-[state=active]:after:bg-white data-[state=active]:font-black data-[state=active]:text-white"
                      >
                        History
                      </TabsTrigger>
                    )}
                  </TabsList>
                </div>
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="max-w-7xl mx-auto w-full px-6 md:px-12 mt-12 pb-24 relative z-20">

            <div className="mt-0">
              <TabsContent value="detail" className="mt-0 outline-none space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-8">
                    {/* Description Card */}
                    <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 p-8 md:p-10">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                          <AlignLeft className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-black text-slate-800">About this meeting</h3>
                      </div>
                      <div className="text-slate-600 text-[16px] leading-relaxed whitespace-pre-wrap">
                        {meetingData?.description || 'No description available for this meeting.'}
                      </div>
                    </div>

                    {/* Class Comments Simulation */}
                    <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 p-8">
                      <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                            <MoreVertical className="w-5 h-5 rotate-90" />
                          </div>
                          <h3 className="text-lg font-black text-slate-800">Class comments</h3>
                        </div>
                        <span className="text-xs font-bold bg-slate-100 text-slate-500 px-3 py-1 rounded-full uppercase tracking-wider">
                          Community
                        </span>
                      </div>

                      <div className="space-y-8 mb-10 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin">
                        {comments.length > 0 ? (
                          comments.map((comment) => (
                            <div key={comment.id} className="flex gap-4 animate-in fade-in slide-in-from-left-2 duration-300">
                              <img 
                                src={comment.user?.avatar || `https://ui-avatars.com/api/?name=${comment.user?.username}&background=random`} 
                                className="w-10 h-10 rounded-full border border-slate-100 shadow-sm shrink-0" 
                                alt={comment.user?.username} 
                              />
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-bold text-slate-800 text-[14px]">{comment.user?.username}</span>
                                  <span className="text-[12px] text-slate-400">
                                    {format(new Date(comment.createdAt), 'MMM dd, h:mm a')}
                                  </span>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-2xl rounded-tl-none border border-slate-100/50">
                                   <p className="text-[14px] text-slate-600 leading-relaxed">{comment.text}</p>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-12 bg-slate-50/50 rounded-[24px] border border-dashed border-slate-200">
                            <p className="text-slate-400 font-medium">No comments yet. Start the conversation!</p>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-4 bg-slate-50 border border-slate-100 rounded-[20px] p-2 pr-4 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/5 focus-within:border-blue-500/30 transition-all">
                        <img 
                          src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.username}&background=random`} 
                          className="w-10 h-10 rounded-xl border shadow-sm shrink-0" 
                          alt="User" 
                        />
                        <input 
                          type="text" 
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                          placeholder="Add class comment..." 
                          disabled={isSendingComment}
                          className="flex-1 bg-transparent border-none outline-none text-[14px] font-medium py-2 px-2 disabled:opacity-50"
                        />
                        <button 
                          onClick={handleAddComment}
                          disabled={!newComment.trim() || isSendingComment}
                          className="w-10 h-10 flex items-center justify-center bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/20 disabled:bg-slate-300 disabled:shadow-none"
                        >
                          {isSendingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-8">
                    {/* Quick Info Card */}
                    <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 p-8">
                      <h3 className="text-lg font-black text-slate-800 mb-6">Schedule</h3>
                      
                      <div className="space-y-6">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
                            <Clock className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Opening Time</p>
                            <p className="text-[15px] font-bold text-slate-700">
                              {meetingData?.open ? format(new Date(meetingData.open), 'EEEE, MMM d, h:mm a') : 'Not scheduled'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500 shrink-0">
                            <Clock className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Expected Close</p>
                            <p className="text-[15px] font-bold text-slate-700">
                              {meetingData?.close ? format(new Date(meetingData.close), 'EEEE, MMM d, h:mm a') : 'Indefinite'}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-8 pt-8 border-t border-slate-50">
                        <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex gap-3">
                          <Info className="w-5 h-5 text-blue-500 shrink-0" />
                          <p className="text-xs text-blue-700 font-medium leading-relaxed">
                            Joining the meeting will redirect you to the live classroom. Ensure your camera and microphone are working.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              {isTeacher && (
                <TabsContent value="settings" className="mt-0 outline-none space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 p-8 md:p-10">
                    <div className="flex items-center justify-between mb-8">
                       <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500">
                          <SettingsIcon className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-black text-slate-800">Edit Meeting Settings</h2>
                      </div>
                      <div className="h-1 flex-1 mx-6 bg-slate-50 rounded-full"></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-500 ml-1">Meeting Title</label>
                        <div className="relative group">
                          <Video className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                          <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="e.g. Weekly Sync Meeting"
                            className="w-full border border-slate-200 rounded-[20px] pl-12 pr-4 py-4 text-[15px] font-medium focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/5 transition-all"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-500 ml-1">Open Date & Time</label>
                        <div className="relative group">
                          <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                          <input
                            type="datetime-local"
                            value={openDate}
                            onChange={e => setOpenDate(e.target.value)}
                            className="w-full border border-slate-200 rounded-[20px] pl-12 pr-4 py-4 text-[15px] font-medium focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/5 transition-all"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-500 ml-1">Close Date & Time (Optional)</label>
                        <div className="relative group">
                          <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                          <input
                            type="datetime-local"
                            value={closeDate}
                            onChange={e => setCloseDate(e.target.value)}
                            className="w-full border border-slate-200 rounded-[20px] pl-12 pr-4 py-4 text-[15px] font-medium focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/5 transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 mb-10">
                      <label className="text-sm font-bold text-slate-500 ml-1">Description & Instructions</label>
                      <div className="border border-slate-200 rounded-[24px] overflow-hidden focus-within:border-orange-500 focus-within:ring-4 focus-within:ring-orange-500/5 transition-all">
                         <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex items-center gap-6 text-slate-400">
                            {['File', 'Edit', 'View', 'Format', 'Tools'].map(item => (
                              <span key={item} className="text-[11px] font-black uppercase tracking-wider cursor-default hover:text-slate-600 transition-colors">{item}</span>
                            ))}
                         </div>
                         <textarea
                          rows={6}
                          value={description}
                          onChange={e => setDescription(e.target.value)}
                          placeholder="Provide details about the meeting agenda, required preparation, or links."
                          className="w-full px-6 py-4 text-[15px] font-medium focus:outline-none bg-white resize-none min-h-[200px]"
                        />
                      </div>
                    </div>

                    <div className="flex justify-center mt-10 pt-6 border-t border-slate-100">
                      <button 
                         onClick={handleSave} 
                         disabled={isSaving}
                         className="px-12 py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-[20px] transition-all shadow-xl shadow-blue-500/20 flex items-center justify-center min-w-[160px] hover:scale-[1.02] active:scale-[0.98] gap-3"
                      >
                         {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckIcon className="w-5 h-5" />}
                         Save Settings
                      </button>
                    </div>
                  </div>
                </TabsContent>
              )}

              {isTeacher && (
                <TabsContent value="history" className="mt-0 outline-none space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 p-8 md:p-10">
                    <div className="flex items-center justify-between mb-10">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500">
                          <HistoryIcon className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-black text-slate-800">Meeting History</h2>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-400 bg-slate-50 px-4 py-2 rounded-xl">
                        <Users className="w-4 h-4" />
                        {histories.length} TOTAL SESSIONS
                      </div>
                    </div>

                    <div className="space-y-4">
                      {histories.length > 0 ? (
                        histories.map((session, idx) => (
                          <div key={session.id || idx} className="group flex flex-col md:flex-row items-center justify-between p-6 rounded-[24px] bg-slate-50/50 border border-slate-100 hover:bg-white hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-500/5 transition-all">
                            <div className="flex items-center gap-6 mb-4 md:mb-0">
                              <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-500 group-hover:border-indigo-100 transition-all">
                                <Video className="w-6 h-6" />
                              </div>
                              <div className="flex flex-col gap-1">
                                <span className="text-[16px] font-black text-slate-700">
                                  {format(new Date(session.startTime), 'MMMM d, yyyy')}
                                </span>
                                <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-wider">
                                  <Clock className="w-3 h-3" />
                                  {format(new Date(session.startTime), 'h:mm a')} • {getDuration(session)} mins
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-8">
                              <div className="flex flex-col items-center">
                                <span className="text-lg font-black text-indigo-600">{session.attendeeCount}</span>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Attendees</span>
                              </div>
                              
                              <div className="h-10 w-px bg-slate-200 hidden md:block"></div>
                              
                              <button 
                                onClick={() => session.attendanceCsvUrl && window.open(session.attendanceCsvUrl)}
                                disabled={!session.attendanceCsvUrl}
                                className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-[13px] bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                              >
                                <Download className="w-4 h-4" />
                                CSV Report
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                          <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 mb-4">
                            <HistoryIcon className="w-10 h-10" />
                          </div>
                          <p className="text-slate-800 font-black text-lg">No sessions yet</p>
                          <p className="text-slate-400 max-w-xs mt-1 font-medium">History will appear here once the meeting room is used.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>
              )}
            </div>
          </div>
        </Tabs>
      </div>
    </MainLayout>
  );
}

function CheckIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}
