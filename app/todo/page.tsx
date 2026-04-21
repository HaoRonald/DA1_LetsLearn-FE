'use client';

import { ChevronDown, FileUp, ListChecks, Loader2 } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { courseApi, CourseResponse, TopicResponse } from '@/services/courseService';
import { assignmentResponseApi } from '@/services/assignmentResponseService';
import { quizResponseApi } from '@/services/quizResponseService';
import { useRouter } from 'next/navigation';

// --- Types ---
interface TodoItemData {
  id: string;
  title: string;
  type: 'assignment' | 'quiz';
  courseId: string;
  courseTitle: string;
  openDate?: Date;
  dueDate?: Date;
  hasSubmission: boolean;
}

interface GroupedTodos {
  [key: string]: TodoItemData[];
}

// --- Reusable Section Component ---
function TodoSection({ title, count, children }: { title: string, count: number, children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <section className="mb-8">
      <div 
        className="flex items-center justify-between border-b border-[#E5E7EB] pb-3 mb-2 cursor-pointer group"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2">
          <h2 className="text-[20px] font-medium text-[#6B7280]">{title}</h2>
          <span className="bg-gray-100 text-gray-500 text-[12px] px-2 py-0.5 rounded-full font-bold">
            {count}
          </span>
        </div>
        <button className={`text-[#9CA3AF] group-hover:text-[#374151] p-1 rounded-full transition-transform ${isOpen ? '' : '-rotate-90'}`}>
          <ChevronDown className="w-5 h-5" />
        </button>
      </div>
      {isOpen && (
        <div className="flex flex-col">
          {children}
        </div>
      )}
    </section>
  );
}

// --- Reusable Item Component ---
function TodoItem({
  item
}: {
  item: TodoItemData
}) {
  const router = useRouter();
  const Icon = item.type === 'assignment' ? FileUp : ListChecks;
  const iconColor = item.type === 'assignment' ? "text-[#7E22CE]" : "text-[#DB2777]";

  const formatDueDate = (date?: Date) => {
    if (!date) return null;
    return `Due ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  };

  const getStatusInfo = () => {
    if (item.hasSubmission) return { text: "done", color: "text-[#22C55E]" };
    
    const now = new Date();
    if (item.dueDate && item.dueDate < now) return { text: "missing", color: "text-[#EF4444]" };
    
    if (item.dueDate) {
      const diff = item.dueDate.getTime() - now.getTime();
      const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
      // In the image, it shows "1 day left". We can show it for <= 7 days.
      if (days <= 7 && days > 0) return { text: `${days} day${days > 1 ? 's' : ''} left`, color: "text-[#F97316]" };
    }
    
    return null;
  };

  const status = getStatusInfo();

  const handleClick = () => {
    const route = item.type === 'assignment' ? 'assignments' : 'quizzes';
    router.push(`/${route}/${item.id}?courseId=${item.courseId}`);
  };

  return (
    <div 
      onClick={handleClick}
      className="flex items-center justify-between py-4 group cursor-pointer hover:bg-gray-50/50 px-2 rounded-lg transition-colors border-b border-gray-50 last:border-0"
    >
      <div className="flex items-center gap-4 min-w-0">
        <Icon className={`w-5 h-5 shrink-0 ${iconColor}`} />
        <div className="flex flex-col truncate">
          <span className="font-bold text-[#06B6D4] text-[14px] truncate group-hover:underline">{item.title}</span>
          <span className="text-[11px] text-[#9CA3AF] truncate">{item.courseTitle}</span>
        </div>
      </div>
      <div className="text-[13px] text-[#6B7280] flex items-center gap-1.5 shrink-0 ml-4 font-medium">
        {(item.dueDate || status) && (
          <span>
            {item.dueDate && formatDueDate(item.dueDate)}
            {status && (
              <span className={`ml-1.5 ${status.color} font-normal`}>
                ({status.text})
              </span>
            )}
          </span>
        )}
      </div>
    </div>
  );
}

export default function TodoPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<CourseResponse[]>([]);
  const [todos, setTodos] = useState<TodoItemData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterCourseId, setFilterCourseId] = useState<string>("all");

  const isAdminOrTeacher = user?.role === "Admin" || user?.role === "Teacher";

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      setIsLoading(true);
      try {
        // 1. Fetch Courses
        let fetchedCourses: CourseResponse[] = [];
        if (isAdminOrTeacher) {
          const res = await courseApi.getAll(user.id);
          fetchedCourses = res.data;
        } else {
          const res = await courseApi.getAll();
          // Filter enrolled courses for learners
          fetchedCourses = res.data.filter(c => 
            c.students?.some(s => s.id === user.id) || 
            user.enrollments?.some(e => e.courseId === c.id)
          );
        }
        setCourses(fetchedCourses);

        // 2. Fetch Works (Assignments/Quizzes) for each course
        const allTodos: TodoItemData[] = [];
        const workFetches: Promise<void>[] = [];

        for (const course of fetchedCourses) {
          workFetches.push((async () => {
            try {
              const worksRes = await courseApi.getWorks(course.id);
              // Assumption: worksRes.data is an array of topics with full data
              const works = Array.isArray(worksRes.data) ? worksRes.data : [];
              
              const submissionChecks: Promise<void>[] = [];
              
              for (const topic of works) {
                if (topic.type === 'assignment' || topic.type === 'quiz') {
                  let data: any = {};
                  try {
                    data = typeof topic.data === 'string' ? JSON.parse(topic.data) : (topic.data || {});
                  } catch (e) {
                    console.error("Failed to parse topic data:", topic.id, e);
                  }
                  
                  const todo: TodoItemData = {
                    id: topic.id,
                    title: topic.title || "Untitled",
                    type: topic.type as any,
                    courseId: course.id,
                    courseTitle: course.title,
                    openDate: (data.open || data.startDate) ? new Date(data.open || data.startDate) : undefined,
                    dueDate: (data.close || data.dueDate || data.deadline || data.expiry) ? new Date(data.close || data.dueDate || data.deadline || data.expiry) : undefined,
                    hasSubmission: false
                  };

                  submissionChecks.push((async () => {
                    try {
                      const api = topic.type === 'assignment' ? assignmentResponseApi : quizResponseApi;
                      const res = await api.getByTopic(topic.id);
                      if (Array.isArray(res.data)) {
                        const hasUserSubmission = res.data.some(r => r.studentId === user.id);
                        if (hasUserSubmission) {
                          todo.hasSubmission = true;
                        }
                      }
                    } catch (err) {
                      console.error(`Status check failed for ${topic.id}:`, err);
                    }
                  })());

                  allTodos.push(todo);
                }
              }
              await Promise.all(submissionChecks);
            } catch (err) {
              console.error(`Failed to fetch works for course ${course.id}:`, err);
            }
          })());
        }

        await Promise.all(workFetches);
        setTodos([...allTodos]);
      } catch (error) {
        console.error("Failed to load todo data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user, isAdminOrTeacher]);

  const filteredTodos = useMemo(() => {
    if (filterCourseId === "all") return todos;
    return todos.filter(t => t.courseId === filterCourseId);
  }, [todos, filterCourseId]);

  const categorizedData = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0,0,0,0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    const nextEndOfWeek = new Date(endOfWeek);
    nextEndOfWeek.setDate(endOfWeek.getDate() + 7);

    const lastStartOfWeek = new Date(startOfWeek);
    lastStartOfWeek.setDate(startOfWeek.getDate() - 7);

    const result = {
      assigned: {
        "No due date": [] as TodoItemData[],
        "This week": [] as TodoItemData[],
        "Next week": [] as TodoItemData[],
        "Later": [] as TodoItemData[]
      },
      overdue: {
        "This week": [] as TodoItemData[],
        "Last week": [] as TodoItemData[],
        "Sooner": [] as TodoItemData[]
      },
      done: {
        "No due date": [] as TodoItemData[],
        "Complete early": [] as TodoItemData[],
        "This week": [] as TodoItemData[],
        "Last week": [] as TodoItemData[],
        "Sooner": [] as TodoItemData[]
      }
    };

    filteredTodos.forEach(item => {
      const isDone = item.hasSubmission;
      const isOverdue = !isDone && item.dueDate && item.dueDate < now;
      const isAssigned = !isDone && !isOverdue;

      if (isDone) {
        if (!item.dueDate) result.done["No due date"].push(item);
        else if (item.dueDate > now) result.done["Complete early"].push(item);
        else if (item.dueDate >= startOfWeek) result.done["This week"].push(item);
        else if (item.dueDate >= lastStartOfWeek) result.done["Last week"].push(item);
        else result.done["Sooner"].push(item);
      } else if (isOverdue) {
        if (item.dueDate! >= startOfWeek) result.overdue["This week"].push(item);
        else if (item.dueDate! >= lastStartOfWeek) result.overdue["Last week"].push(item);
        else result.overdue["Sooner"].push(item);
      } else if (isAssigned) {
        if (!item.dueDate) result.assigned["No due date"].push(item);
        else if (item.dueDate < endOfWeek) result.assigned["This week"].push(item);
        else if (item.dueDate < nextEndOfWeek) result.assigned["Next week"].push(item);
        else result.assigned["Later"].push(item);
      }
    });

    return result;
  }, [filteredTodos]);

  const hasAnyData = (category: keyof typeof categorizedData) => {
    return Object.values(categorizedData[category]).some(arr => arr.length > 0);
  };

  return (
    <MainLayout headerTitle={isAdminOrTeacher ? "To review" : "To-do"}>
      <div className="flex flex-col h-full bg-white relative">
        <Tabs defaultValue="assigned" className="w-full flex-1 flex flex-col">
          
          <div className="w-full border-b border-[#E5E7EB] bg-white sticky top-0 z-10 pt-2 px-6 lg:px-8">
            <TabsList className="bg-transparent h-auto p-0 flex gap-8 justify-start">
              <TabsTrigger 
                value="assigned" 
                className="flex-none w-auto bg-transparent h-auto px-2 pb-1.5 pt-1 text-[14px] font-bold text-[#9CA3AF] hover:text-[#6B7280] data-[state=active]:text-[#3B82F6] data-[state=active]:bg-transparent data-[state=active]:border-b-[3px] data-[state=active]:border-[#3B82F6] shadow-none rounded-sm transition-all"
              >
                {user?.role === 'Learner' ? 'Assigned' : 'To review'}
              </TabsTrigger>
              <TabsTrigger 
                value="overdue" 
                className="flex-none w-auto bg-transparent h-auto px-2 pb-1.5 pt-1 text-[14px] font-bold text-[#9CA3AF] hover:text-[#6B7280] data-[state=active]:text-[#3B82F6] data-[state=active]:bg-transparent data-[state=active]:border-b-[3px] data-[state=active]:border-[#3B82F6] shadow-none rounded-sm transition-all"
              >
                Overdue
              </TabsTrigger>
              <TabsTrigger 
                value="done" 
                className="flex-none w-auto bg-transparent h-auto px-2 pb-1.5 pt-1 text-[14px] font-bold text-[#9CA3AF] hover:text-[#6B7280] data-[state=active]:text-[#3B82F6] data-[state=active]:bg-transparent data-[state=active]:border-b-[3px] data-[state=active]:border-[#3B82F6] shadow-none rounded-sm transition-all"
              >
                Done
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto px-6 lg:px-8 py-8">
            <div className="max-w-4xl mx-auto">
              
              <div className="mb-10">
                <Select value={filterCourseId} onValueChange={(val) => val && setFilterCourseId(val)}>
                  <SelectTrigger className="w-[320px] h-10 border-[#E5E7EB] text-[#6B7280] rounded-xl bg-white shadow-sm font-medium focus:ring-1 focus:ring-[#3B82F6] focus:border-[#3B82F6]">
                    <SelectValue>
                      {filterCourseId === 'all' ? 'All courses' : (courses.find(c => c.id === filterCourseId)?.title || filterCourseId)}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-[#E5E7EB] shadow-xl">
                    <SelectItem value="all" className="font-medium text-[#4B5563]">All courses</SelectItem>
                    {courses.map(course => (
                      <SelectItem key={course.id} value={course.id} className="text-[#6B7280]">
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <Loader2 className="w-10 h-10 animate-spin text-[#3B82F6]" />
                  <p className="text-[#9CA3AF] font-medium animate-pulse">Loading your tasks...</p>
                </div>
              ) : (
                <>
                  <TabsContent value="assigned" className="mt-0 outline-none">
                    {!hasAnyData('assigned') ? (
                      <EmptyState message={user?.role === 'Learner' ? "No assigned tasks found." : "No tasks to review found."} />
                    ) : (
                      Object.entries(categorizedData.assigned).map(([title, items]) => (
                        items.length > 0 && <TodoSection key={title} title={title} count={items.length}>
                          {items.map(item => <TodoItem key={item.id} item={item} />)}
                        </TodoSection>
                      ))
                    )}
                  </TabsContent>
                  
                  <TabsContent value="overdue" className="mt-0 outline-none">
                    {!hasAnyData('overdue') ? (
                      <EmptyState message="Nothing overdue. Good job!" />
                    ) : (
                      Object.entries(categorizedData.overdue).map(([title, items]) => (
                        items.length > 0 && <TodoSection key={title} title={title} count={items.length}>
                          {items.map(item => <TodoItem key={item.id} item={item} />)}
                        </TodoSection>
                      ))
                    )}
                  </TabsContent>

                  <TabsContent value="done" className="mt-0 outline-none">
                    {!hasAnyData('done') ? (
                      <EmptyState message="No completed tasks yet." />
                    ) : (
                      Object.entries(categorizedData.done).map(([title, items]) => (
                        items.length > 0 && <TodoSection key={title} title={title} count={items.length}>
                          {items.map(item => <TodoItem key={item.id} item={item} />)}
                        </TodoSection>
                      ))
                    )}
                  </TabsContent>
                </>
              )}
            </div>
          </div>
        </Tabs>
      </div>
    </MainLayout>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
      <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4">
        <ListChecks className="w-8 h-8 text-gray-300" />
      </div>
      <p className="text-[#6B7280] font-medium text-center">{message}</p>
    </div>
  );
}
