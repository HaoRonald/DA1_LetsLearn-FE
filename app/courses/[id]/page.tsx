'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { courseApi, CourseResponse } from '@/services/courseService';

// Import our custom tab components
import { CourseTab } from '@/components/courses/CourseTab';
import { ActivitiesTab } from '@/components/courses/ActivitiesTab';
import { PeopleTab } from '@/components/courses/PeopleTab';
import { DashboardTab } from '@/components/courses/DashboardTab';

export default function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = React.use(params);
  const router = useRouter();
  const [course, setCourse] = useState<CourseResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const response = await courseApi.getById(unwrappedParams.id);
        setCourse(response.data);
      } catch (err) {
        console.error('Failed to fetch course:', err);
        setError('Course not found or access denied');
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [unwrappedParams.id]);

  if (loading) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3B82F6]"></div>
        </div>
      </MainLayout>
    );
  }

  if (error || !course) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-full text-center px-4">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Oops!</h2>
          <p className="text-gray-600 mb-6">{error || 'Something went wrong'}</p>
          <button 
            onClick={() => window.location.href = '/'}
            className="bg-[#3B82F6] text-white px-6 py-2 rounded-lg font-bold"
          >
            Back to Home
          </button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="flex flex-col h-full bg-white relative">
        <Tabs defaultValue="course" className="w-full flex-1 flex flex-col">
          
          {/* Header sticky block for the tabs */}
          <div className="w-full border-b border-[#E5E7EB] bg-white sticky top-0 z-10 pt-2 px-4 md:px-6 lg:px-8 overflow-x-auto scrollbar-hide flex items-center gap-4">
            <TabsList className="bg-transparent h-auto p-0 flex gap-4 md:gap-8 justify-start min-w-max">
              
              <TabsTrigger 
                value="course" 
                className="flex-none w-auto bg-transparent h-auto px-2 pb-1.5 pt-1 text-[13px] md:text-[14px] font-bold text-[#9CA3AF] hover:text-[#6B7280] data-[state=active]:text-[#3B82F6] data-[state=active]:bg-transparent data-[state=active]:border-b-[3px] data-[state=active]:border-[#3B82F6] data-[state=active]:shadow-none rounded-sm transition-all"
              >
                Course
              </TabsTrigger>
              
              <TabsTrigger 
                value="activities" 
                className="flex-none w-auto bg-transparent h-auto px-2 pb-1.5 pt-1 text-[13px] md:text-[14px] font-bold text-[#9CA3AF] hover:text-[#6B7280] data-[state=active]:text-[#3B82F6] data-[state=active]:bg-transparent data-[state=active]:border-b-[3px] data-[state=active]:border-[#3B82F6] data-[state=active]:shadow-none rounded-sm transition-all"
              >
                Activities
              </TabsTrigger>
              
              <TabsTrigger 
                value="people" 
                className="flex-none w-auto bg-transparent h-auto px-2 pb-1.5 pt-1 text-[13px] md:text-[14px] font-bold text-[#9CA3AF] hover:text-[#6B7280] data-[state=active]:text-[#3B82F6] data-[state=active]:bg-transparent data-[state=active]:border-b-[3px] data-[state=active]:border-[#3B82F6] data-[state=active]:shadow-none rounded-sm transition-all"
              >
                People
              </TabsTrigger>

              <TabsTrigger 
                value="dashboard" 
                className="flex-none w-auto bg-transparent h-auto px-2 pb-1.5 pt-1 text-[13px] md:text-[14px] font-bold text-[#9CA3AF] hover:text-[#6B7280] data-[state=active]:text-[#3B82F6] data-[state=active]:bg-transparent data-[state=active]:border-b-[3px] data-[state=active]:border-[#3B82F6] data-[state=active]:shadow-none rounded-sm transition-all"
              >
                Dashboard
              </TabsTrigger>

            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto px-4 md:px-6 lg:px-8 py-6">
            <TabsContent value="course" className="mt-0 outline-none">
              <CourseTab course={course} />
            </TabsContent>
            
            <TabsContent value="activities" className="mt-0 outline-none">
              <ActivitiesTab course={course} />
            </TabsContent>

            <TabsContent value="people" className="mt-0 outline-none">
              <PeopleTab course={course} />
            </TabsContent>

            <TabsContent value="dashboard" className="mt-0 outline-none">
              <DashboardTab course={course} />
            </TabsContent>
          </div>

        </Tabs>
      </div>
    </MainLayout>
  );
}
