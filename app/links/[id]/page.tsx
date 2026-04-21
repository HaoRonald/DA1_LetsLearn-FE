'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { courseApi, TopicResponse } from '@/services/courseService';
import { topicApi } from '@/services/topicService';
import MainLayout from '@/components/layout/MainLayout';
import { Loader2, Link as LinkIcon, ChevronRight, ExternalLink } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

export default function LinkTopicPage() {
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
  const [externalUrl, setExternalUrl] = useState('');
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
        if (typeof dataStr === 'string') {
          try {
            const parsed = JSON.parse(dataStr);
            setExternalUrl(parsed.externalUrl || '');
            setDescription(parsed.description || '');
          } catch {
            setExternalUrl(dataStr);
          }
        } else if (typeof dataStr === 'object') {
            setExternalUrl(dataStr?.externalUrl || '');
            setDescription(dataStr?.description || '');
        }
      } catch (err) {
        console.error('Failed to fetch link topic:', err);
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
        externalUrl,
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
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      </MainLayout>
    );
  }

  if (!courseId || !topic) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[500px] text-center px-4">
          <div className="p-4 bg-red-50 rounded-2xl mb-4">
            <p className="text-red-500 font-bold">Link Not Found</p>
          </div>
          <button onClick={() => router.back()} className="mt-6 font-bold text-gray-600 px-6 py-2 border rounded-xl">Go Back</button>
        </div>
      </MainLayout>
    );
  }

  const isTeacher = user?.role === 'Teacher' || user?.role === 'Admin';
  
  const breadcrumbs = (
    <div className="flex items-center text-[14px] font-medium">
      <span className="text-[#6B7280] hidden md:inline cursor-pointer hover:text-emerald-600" onClick={() => router.push("/")}>Home</span>
      <ChevronRight className="w-4 h-4 mx-2 text-[#9CA3AF] hidden md:inline" />
      <span className="text-[#6B7280] cursor-pointer hover:text-emerald-600" onClick={() => router.push(`/courses/${courseId}`)}>Course</span>
      <ChevronRight className="w-4 h-4 mx-2 text-[#9CA3AF]" />
      <span className="font-bold text-[#374151]">{topic.title}</span>
    </div>
  );

  return (
    <MainLayout headerTitle={breadcrumbs}>
      <div className="flex flex-col min-h-screen bg-[#F0FDF4] relative">
        {/* Green Header matching design */}
        <div className="w-full bg-gradient-to-r from-[#10B981] to-[#065F46] pt-10 pb-20 px-6 md:px-10">
          <div className="flex items-center gap-4 mb-8 text-white">
            <LinkIcon className="w-8 h-8 shrink-0" strokeWidth={1.5} />
            <h1 className="text-[32px] font-medium tracking-wide">{topic.title}</h1>
          </div>

          {isTeacher ? (
            <Tabs defaultValue="link" className="w-full">
              <div className="border-b-[1.5px] border-white/20 w-full">
                <TabsList className="bg-transparent p-0 flex justify-start gap-8 w-full h-auto">
                  <TabsTrigger
                    value="link"
                    className="flex-none px-1 py-3 text-[15px] font-medium text-white/70 hover:text-white data-active:text-white data-active:after:bg-white rounded-none transition-all !bg-transparent !shadow-none data-[state=active]:relative data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-[3px] data-[state=active]:font-bold"
                  >
                    Link
                  </TabsTrigger>
                  <TabsTrigger
                    value="settings"
                    className="flex-none px-1 py-3 text-[15px] font-medium text-white/70 hover:text-white data-active:text-white data-active:after:bg-white rounded-none transition-all !bg-transparent !shadow-none data-[state=active]:relative data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-[3px] data-[state=active]:font-bold"
                  >
                    Settings
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="mt-8 -ml-4 -mr-4 md:ml-0 md:mr-0 px-4 md:px-0">
                <TabsContent value="link" className="mt-0 outline-none w-full relative z-10">
                  <div className="bg-white rounded-[12px] shadow-sm border border-[#E5E7EB] p-8 md:p-10 min-h-[500px]">
                    <div className="text-[#374151] text-[15px]">
                      {externalUrl ? (
                        <p>Click on <a href={externalUrl} target="_blank" className="text-emerald-600 hover:underline font-medium">Link</a> to open the resource.</p>
                       ) : (
                        <p>No external URL provided yet.</p>
                       )}
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="settings" className="mt-0 outline-none w-full relative z-10">
                  <div className="bg-white rounded-[12px] shadow-sm border border-[#E5E7EB] p-8 min-h-[500px]">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-[20px] font-bold text-[#F97316]">Edit Setting</h2>
                      <button className="text-[#3B82F6] font-medium text-[13px] hover:underline">Collapse all</button>
                    </div>

                    {/* General Section */}
                    <div className="border border-[#E5E7EB] rounded-xl overflow-hidden mb-8">
                      <div className="w-full flex items-center gap-3 px-6 py-4 bg-[#F9FAFB]">
                        <span className="font-bold text-[#374151] text-[15px]">General</span>
                      </div>
                      <div className="p-6 space-y-6">
                        <div className="flex flex-col md:flex-row gap-3 md:gap-6">
                          <label className="md:w-32 shrink-0 text-[14px] font-medium text-[#374151] pt-3">Name</label>
                          <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="flex-1 w-full border border-[#E5E7EB] rounded-lg px-4 py-3 text-[14px] focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                        <div className="flex flex-col md:flex-row gap-3 md:gap-6">
                          <label className="md:w-32 shrink-0 text-[14px] font-medium text-[#374151] pt-3">External URL</label>
                          <input
                            type="text"
                            placeholder="URL here"
                            value={externalUrl}
                            onChange={e => setExternalUrl(e.target.value)}
                            className="flex-1 w-full border border-[#E5E7EB] rounded-lg px-4 py-3 text-[14px] focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                        <div className="flex flex-col md:flex-row gap-3 md:gap-6">
                          <label className="md:w-32 shrink-0 text-[14px] font-medium text-[#374151] pt-3">Description</label>
                          <input
                            type="text"
                            placeholder="Description for URL here"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            className="flex-1 w-full border border-[#E5E7EB] rounded-lg px-4 py-3 text-[14px] focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-center">
                      <button 
                         onClick={handleSave} 
                         disabled={isSaving}
                         className="px-8 py-2.5 bg-[#8AB4F8] hover:bg-blue-400 text-white font-bold rounded-lg transition-colors flex items-center justify-center min-w-[100px]"
                      >
                         {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save'}
                      </button>
                    </div>

                  </div>
                </TabsContent>
              </div>
            </Tabs>
          ) : (
             <div className="flex gap-8 border-b-[1.5px] border-white/20 text-white w-full">
               <span className="text-[15px] font-bold border-b-[3px] border-white pb-3 -mb-[2px]">
                 Link
               </span>
             </div>
          )}
        </div>

        {/* Content for Learner */}
        {!isTeacher && (
           <div className="px-6 md:px-10 -mt-16 w-full pb-12 relative z-10">
              <div className="bg-white rounded-[12px] shadow-sm border border-[#E5E7EB] p-8 md:p-10 min-h-[500px]">
                 <div className="text-[#374151] text-[15px]">
                    {externalUrl ? (
                      <p>Click on <a href={externalUrl} target="_blank" className="text-emerald-600 hover:underline font-medium">Link</a> to open the resource.</p>
                     ) : (
                      <p>No link available.</p>
                     )}
                 </div>
              </div>
           </div>
        )}
      </div>
    </MainLayout>
  );
}
