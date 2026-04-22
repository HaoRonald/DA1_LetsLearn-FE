'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { courseApi, TopicResponse } from '@/services/courseService';
import { topicApi } from '@/services/topicService';
import { mediaApi } from '@/services/mediaService';
import MainLayout from '@/components/layout/MainLayout';
import { Loader2, FileText, ChevronRight, UploadCloud, Paperclip, ArrowLeft } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

export default function FileTopicPage() {
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
  const [description, setDescription] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileUrl, setFileUrl] = useState('');

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
            setDescription(parsed.description || '');
            setFileName(parsed.fileName || '');
            setFileUrl(parsed.fileUrl || '');
          } catch {
             // raw fallback
             setFileUrl(dataStr);
          }
        } else if (typeof dataStr === 'object') {
            setDescription(dataStr?.description || '');
            setFileName(dataStr?.fileName || '');
            setFileUrl(dataStr?.fileUrl || '');
        }
      } catch (err) {
        console.error('Failed to fetch file topic:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTopic();
  }, [courseId, topicId]);

  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const response = await mediaApi.upload(file);
      // Backend returns data: { name, displayUrl, downloadUrl }
      const uploadedData = response.data;
      setFileName(uploadedData.name);
      setFileUrl(uploadedData.downloadUrl);
      toast.success('File uploaded successfully!');
    } catch (err) {
      console.error('Upload failed:', err);
      toast.error('Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!courseId || !topic) return;
    setIsSaving(true);
    try {
      const updatedData = {
        description,
        fileName,
        fileUrl
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
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </MainLayout>
    );
  }

  if (!courseId || !topic) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[500px] text-center px-4">
          <div className="p-4 bg-red-50 rounded-2xl mb-4">
            <p className="text-red-500 font-bold">File Not Found</p>
          </div>
          <button onClick={() => router.back()} className="mt-6 font-bold text-gray-600 px-6 py-2 border rounded-xl">Go Back</button>
        </div>
      </MainLayout>
    );
  }

  const isTeacher = user?.role === 'Teacher' || user?.role === 'Admin';
  
  const breadcrumbs = (
    <div className="flex items-center text-[14px] font-medium">
      <span className="text-[#6B7280] hidden md:inline cursor-pointer hover:text-blue-600" onClick={() => router.push("/")}>Home</span>
      <ChevronRight className="w-4 h-4 mx-2 text-[#9CA3AF] hidden md:inline" />
      <span className="text-[#6B7280] cursor-pointer hover:text-blue-600" onClick={() => router.push(`/courses/${courseId}`)}>Course</span>
      <ChevronRight className="w-4 h-4 mx-2 text-[#9CA3AF]" />
      <span className="font-bold text-[#374151]">{topic.title}</span>
    </div>
  );

  return (
    <MainLayout headerTitle={breadcrumbs}>
      <div className="flex flex-col min-h-screen bg-[#F4F9FD] relative pb-10">
        {/* Blue Header matching design */}
        <div className="w-full bg-gradient-to-r from-[#4A8DEF] to-[#245DAB] pt-8 md:pt-10 pb-16 md:pb-20 px-4 md:px-10">
          <div className="flex flex-col gap-6 mb-6 md:mb-8 text-white">
            <button 
              onClick={() => router.push(`/courses/${courseId}`)}
              className="flex items-center gap-2 w-fit px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-sm font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to course
            </button>
            <div className="flex items-center gap-3 md:gap-4">
              <div className="p-2 bg-white/10 rounded-xl shrink-0">
                 <FileText className="w-6 h-6 md:w-8 md:h-8" strokeWidth={1.5} />
              </div>
              <h1 className="text-[24px] md:text-[32px] font-bold tracking-tight line-clamp-1">{topic.title}</h1>
            </div>
          </div>

          {isTeacher ? (
            <Tabs defaultValue="file" className="w-full">
              <div className="border-b-[1.5px] border-white/20 w-full overflow-x-auto scrollbar-hide">
                <TabsList className="bg-transparent p-0 flex justify-start gap-6 md:gap-8 min-w-max h-auto">
                  <TabsTrigger
                    value="file"
                    className="flex-none px-1 py-3 text-[14px] md:text-[15px] font-medium text-white/70 hover:text-white data-active:text-white data-active:after:bg-white rounded-none transition-all !bg-transparent !shadow-none data-[state=active]:relative data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-[3px] data-[state=active]:font-bold"
                  >
                    File
                  </TabsTrigger>
                  <TabsTrigger
                    value="settings"
                    className="flex-none px-1 py-3 text-[14px] md:text-[15px] font-medium text-white/70 hover:text-white data-active:text-white data-active:after:bg-white rounded-none transition-all !bg-transparent !shadow-none data-[state=active]:relative data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-[3px] data-[state=active]:font-bold"
                  >
                    Settings
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="mt-8 -mx-4 md:mx-0 px-4 md:px-0">
                <TabsContent value="file" className="mt-0 outline-none w-full relative z-10">
                  <div className="bg-white rounded-[12px] shadow-sm border border-[#E5E7EB] p-6 md:p-10 min-h-[400px] md:min-h-[500px]">
                    <div className="text-[#374151] text-[15px]">
                      {fileName ? (
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4 bg-blue-50/50 p-6 rounded-2xl border border-blue-100">
                           <div className="bg-white p-4 rounded-xl shadow-sm self-start sm:self-auto">
                             <Paperclip className="w-6 h-6 text-blue-500" />
                           </div>
                           <div className="flex-1">
                              <p className="text-[14px] text-gray-500 font-medium mb-1 uppercase tracking-wider">Attached File</p>
                              <a href={fileUrl} target="_blank" className="text-[18px] font-bold text-[#1F2937] hover:text-blue-600 transition-colors break-all">
                                {fileName}
                              </a>
                           </div>
                           <a 
                             href={fileUrl} 
                             download 
                             target="_blank"
                             className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl shadow-sm transition-all text-center"
                           >
                             Download
                           </a>
                        </div>
                       ) : (
                        <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                          <p className="text-gray-400 italic">No file attached yet.</p>
                        </div>
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
                            className="flex-1 w-full border border-[#E5E7EB] rounded-lg px-4 py-3 text-[14px] focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div className="flex flex-col md:flex-row gap-3 md:gap-6">
                          <label className="md:w-32 shrink-0 text-[14px] font-medium text-[#374151] pt-3">Description</label>
                          <input
                            type="text"
                            placeholder="Description for file here"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            className="flex-1 w-full border border-[#E5E7EB] rounded-lg px-4 py-3 text-[14px] focus:outline-none focus:border-blue-500"
                          />
                        </div>

                         <div className="flex flex-col md:flex-row gap-3 md:gap-6">
                            <label className="md:w-32 shrink-0 text-[14px] font-medium text-[#374151] pt-3">File upload</label>
                            <div className="flex-1 w-full border-2 border-dashed border-[#E5E7EB] rounded-2xl flex flex-col items-center justify-center py-10 bg-[#FAFAFA] hover:bg-gray-50 transition-all relative">
                               <input 
                                 type="file" 
                                 className="hidden" 
                                 ref={fileInputRef} 
                                 onChange={handleFileUpload} 
                               />
                               <UploadCloud className="w-8 h-8 text-gray-400 mb-3" />
                               <p className="text-[15px] font-bold text-[#3B82F6] mb-1">Choose files or drag and drop</p>
                               <p className="text-[12px] text-gray-500 mb-5">Texts, images, videos, audios and pdfs</p>
                               <button 
                                  disabled={isUploading}
                                  className="px-5 py-2 bg-[#3B82F6] hover:bg-blue-600 rounded-lg text-white font-medium text-[13px] flex items-center gap-2 disabled:opacity-50 transition-all"
                                  onClick={(e) => {
                                     e.preventDefault();
                                     fileInputRef.current?.click();
                                  }}
                               >
                                  {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
                                  {isUploading ? 'Uploading...' : 'Attach'}
                               </button>

                              {fileName && (
                                <p className="mt-4 text-sm text-green-600 font-medium">Attached: {fileName}</p>
                              )}
                           </div>
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
                 File
               </span>
             </div>
          )}
        </div>

        {/* Content for Learner */}
        {!isTeacher && (
           <div className="px-6 md:px-10 -mt-16 w-full pb-12 relative z-10">
              <div className="bg-white rounded-[12px] shadow-sm border border-[#E5E7EB] p-8 md:p-10 min-h-[500px]">
                 <div className="text-[#374151] text-[15px]">
                    {fileName ? (
                      <p>Click on <a href={fileUrl} target="_blank" className="text-blue-500 hover:underline font-medium">{fileName}</a> to view/download the file uploaded.</p>
                     ) : (
                      <p>No file attached yet.</p>
                     )}
                 </div>
              </div>
           </div>
        )}
      </div>
    </MainLayout>
  );
}
