'use client';

import { useEffect, useState } from 'react';
import { ChevronRight, FileText, Loader2 } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { courseApi, TopicResponse } from '@/services/courseService';

import { LearnerAssignmentView } from '@/components/assignments/LearnerAssignmentView';
import { TeacherAssignmentView } from '@/components/assignments/TeacherAssignmentView';
import { TeacherAssignmentSettings } from '@/components/assignments/TeacherAssignmentSettings';
import { TeacherAssignmentSubmissions } from '@/components/assignments/TeacherAssignmentSubmissions';
import { TeacherAssignmentDashboard } from '@/components/assignments/TeacherAssignmentDashboard';

export default function AssignmentDetailPage() {
  const { user } = useAuth();
  const { id: topicId } = useParams() as { id: string };
  const searchParams = useSearchParams();
  const courseId = searchParams.get('courseId');
  const router = useRouter();

  const [assignment, setAssignment] = useState<TopicResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!courseId || !topicId) {
      setLoading(false);
      return;
    }

    const fetchAssignment = async () => {
      try {
        const response = await courseApi.getTopicById(courseId, topicId);
        setAssignment(response.data);
      } catch (error) {
        console.error("Failed to fetch assignment:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAssignment();
  }, [courseId, topicId]);

  const isTeacher = user?.role === 'Teacher' || user?.role === 'Admin';
  // If the user's role allows editing, or if we verify they are the creator of this assignment's course

  if (loading) {
    return (
      <MainLayout headerTitle={<span className="text-[#6B7280]">Loading...</span>}>
        <div className="flex items-center justify-center min-h-[500px]">
          <Loader2 className="w-8 h-8 animate-spin text-[#7E22CE]" />
        </div>
      </MainLayout>
    );
  }

  if (!courseId) {
    return (
      <MainLayout headerTitle={<span className="text-[#6B7280]">Error</span>}>
        <div className="flex flex-col items-center justify-center min-h-[500px] text-center px-4">
          <div className="p-4 bg-red-50 rounded-2xl mb-4">
            <p className="text-red-500 font-bold">Missing Course ID</p>
          </div>
          <p className="text-gray-500 max-w-md">The URL is missing the parent course context. Please navigate to this assignment through the course page.</p>
          <button onClick={() => router.push('/')} className="mt-6 bg-[#7E22CE] text-white px-6 py-2 rounded-xl font-bold">Go Home</button>
        </div>
      </MainLayout>
    );
  }

  if (!assignment) {
    return (
      <MainLayout headerTitle={<span className="text-[#6B7280]">Error</span>}>
        <div className="flex flex-col items-center justify-center min-h-[500px] text-center px-4">
          <div className="p-4 bg-red-50 rounded-2xl mb-4">
            <p className="text-red-500 font-bold">Assignment Not Found</p>
          </div>
          <p className="text-gray-500 max-w-md">We couldn't retrieve the assignment details. The assignment might have been deleted or you don't have permission to view it.</p>
          <button onClick={() => router.back()} className="mt-6 border border-gray-200 text-gray-600 px-6 py-2 rounded-xl font-bold">Go Back</button>
        </div>
      </MainLayout>
    );
  }

  const breadcrumbs = (
    <div className="flex items-center text-[14px] font-medium">
      <span className="text-[#6B7280] hidden md:inline cursor-pointer" onClick={() => router.push('/')}>Home</span>
      <ChevronRight className="w-4 h-4 mx-2 text-[#9CA3AF] hidden md:inline" />
      <span className="text-[#6B7280] cursor-pointer" onClick={() => router.push(`/courses/${courseId}`)}>Course</span>
      <ChevronRight className="w-4 h-4 mx-2 text-[#9CA3AF]" />
      <span className="font-bold text-[#374151]">{assignment.title}</span>
    </div>
  );

  return (
    <MainLayout headerTitle={breadcrumbs}>
      <div className="flex flex-col min-h-full bg-[#f9fafb] relative">
        <Tabs defaultValue="assignment" className="w-full flex-1 flex flex-col">
          
          {/* Purple Top Background */}
          <div className="w-full bg-[#7E22CE] pt-10 pb-20 px-8 md:px-12">
            <div className="flex items-center gap-4 mb-8 text-white">
              <div className="bg-white/20 p-2 rounded-lg">
                <FileText className="w-6 h-6 shrink-0" />
              </div>
              <h1 className="text-[32px] font-bold">{assignment.title}</h1>
            </div>
            
            {/* Tabs List matches the design exactly */}
            {isTeacher ? (
              <div className="border-b-[2px] border-white/20 w-full overflow-hidden">
                <TabsList variant="line" className="bg-transparent p-0 flex h-auto overflow-x-auto overflow-y-hidden gap-8 justify-start w-full">
                  
                  <TabsTrigger 
                    value="assignment" 
                    className="flex-none px-1 py-3 text-[14px] font-bold text-white/70 hover:text-white data-active:text-white data-active:after:bg-white rounded-none transition-all !bg-transparent !shadow-none"
                  >
                    Assignment
                  </TabsTrigger>
                  
                  <TabsTrigger 
                    value="settings" 
                    className="flex-none px-1 py-3 text-[14px] font-bold text-white/70 hover:text-white data-active:text-white data-active:after:bg-white rounded-none transition-all !bg-transparent !shadow-none"
                  >
                    Settings
                  </TabsTrigger>
                  
                  <TabsTrigger 
                    value="submissions" 
                    className="flex-none px-1 py-3 text-[14px] font-bold text-white/70 hover:text-white data-active:text-white data-active:after:bg-white rounded-none transition-all !bg-transparent !shadow-none"
                  >
                    Submissions
                  </TabsTrigger>

                  <TabsTrigger 
                    value="dashboard" 
                    className="flex-none px-1 py-3 text-[14px] font-bold text-white/70 hover:text-white data-active:text-white data-active:after:bg-white rounded-none transition-all !bg-transparent !shadow-none"
                  >
                    Dashboard
                  </TabsTrigger>
                </TabsList>
              </div>
            ) : (
              <div className="flex gap-8 border-b-[2px] border-white/20 text-white w-full">
                <span className="text-[14px] font-bold border-b-[2px] border-white pb-3 -mb-[2px]">
                  Assignment
                </span>
              </div>
            )}
          </div>

          {/* Remove max-w and let it stretch to full width, with less padding on the left to pull it leftward */}
          <div className="w-full px-4 md:px-6 -mt-10 pb-12 flex-1">
            {!isTeacher ? (
              <TabsContent value="assignment" className="mt-0 outline-none w-full" forceMount>
                <LearnerAssignmentView assignment={assignment} />
              </TabsContent>
            ) : (
              <>
                <TabsContent value="assignment" className="mt-0 outline-none w-full">
                  <TeacherAssignmentView assignment={assignment} />
                </TabsContent>
                <TabsContent value="settings" className="mt-0 outline-none w-full">
                  <TeacherAssignmentSettings assignment={assignment} courseId={courseId!} />
                </TabsContent>
                <TabsContent value="submissions" className="mt-0 outline-none w-full">
                  <TeacherAssignmentSubmissions assignment={assignment} courseId={courseId!} />
                </TabsContent>
                <TabsContent value="dashboard" className="mt-0 outline-none w-full">
                  <TeacherAssignmentDashboard assignment={assignment} />
                </TabsContent>
              </>
            )}
          </div>
        </Tabs>
      </div>
    </MainLayout>
  );
}
