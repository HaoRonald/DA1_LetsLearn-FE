'use client';

import { ChevronDown, FileUp, ListChecks } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import React from 'react';

// Reusable Section Component
function TodoSection({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3 mb-2">
        <h2 className="text-[20px] font-medium text-[#6B7280]">{title}</h2>
        <button className="text-[#9CA3AF] hover:text-[#374151] p-1 rounded-full">
          <ChevronDown className="w-5 h-5" />
        </button>
      </div>
      <div className="flex flex-col">
        {children}
      </div>
    </section>
  );
}

// Reusable Item Component
function TodoItem({
  icon: Icon,
  iconColor,
  title,
  dueDate,
  statusText,
  statusColor
}: {
  icon: any,
  iconColor: string,
  title: string,
  dueDate?: string,
  statusText?: string,
  statusColor?: string
}) {
  return (
    <div className="flex items-center justify-between py-4 group cursor-pointer hover:bg-gray-50/50 px-2 rounded-lg transition-colors">
      <div className="flex items-center gap-4">
        <Icon className={`w-5 h-5 ${iconColor}`} />
        <span className="font-bold text-[#06B6D4] text-[14px]">{title}</span>
      </div>
      <div className="text-[12px] text-[#6B7280] font-medium flex gap-1">
        {dueDate && <span>{dueDate}</span>}
        {statusText && <span className={`${statusColor} italic`}>({statusText})</span>}
      </div>
    </div>
  );
}

export default function TodoPage() {
  return (
    <MainLayout>
      <div className="flex flex-col h-full bg-white relative">
        <Tabs defaultValue="assigned" className="w-full flex-1 flex flex-col">
          
          {/* Header sticky block for the tabs */}
          <div className="w-full border-b border-[#E5E7EB] bg-white sticky top-0 z-10 pt-2 px-6 lg:px-8">
            <TabsList className="bg-transparent h-auto p-0 flex gap-8 justify-start">
              
              <TabsTrigger 
                value="assigned" 
                className="flex-none w-auto bg-transparent h-auto px-2 pb-1.5 pt-1 text-[14px] font-bold text-[#9CA3AF] hover:text-[#6B7280] data-[state=active]:text-[#3B82F6] data-[state=active]:bg-transparent data-[state=active]:border-b-[3px] data-[state=active]:border-[#3B82F6] data-[state=active]:shadow-none rounded-sm transition-all"
              >
                Assigned
              </TabsTrigger>
              
              <TabsTrigger 
                value="overdue" 
                className="flex-none w-auto bg-transparent h-auto px-2 pb-1.5 pt-1 text-[14px] font-bold text-[#9CA3AF] hover:text-[#6B7280] data-[state=active]:text-[#3B82F6] data-[state=active]:bg-transparent data-[state=active]:border-b-[3px] data-[state=active]:border-[#3B82F6] data-[state=active]:shadow-none rounded-sm transition-all"
              >
                Overdue
              </TabsTrigger>
              
              <TabsTrigger 
                value="done" 
                className="flex-none w-auto bg-transparent h-auto px-2 pb-1.5 pt-1 text-[14px] font-bold text-[#9CA3AF] hover:text-[#6B7280] data-[state=active]:text-[#3B82F6] data-[state=active]:bg-transparent data-[state=active]:border-b-[3px] data-[state=active]:border-[#3B82F6] data-[state=active]:shadow-none rounded-sm transition-all"
              >
                Done
              </TabsTrigger>

            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto px-6 lg:px-8 py-8">
            <div className="max-w-4xl mx-auto">
              
              {/* Common Select Filter */}
              <div className="mb-10">
                <Select defaultValue="all">
                  <SelectTrigger className="w-[320px] h-10 border-[#E5E7EB] text-[#6B7280] rounded-xl bg-white shadow-sm font-medium">
                    <SelectValue placeholder="All courses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All courses</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* TABS CONTENT */}
              <TabsContent value="assigned" className="mt-0 outline-none">
                <TodoSection title="No due date">
                  <TodoItem 
                    icon={FileUp} iconColor="text-[#7E22CE]" 
                    title="Assignment for the first lesson" 
                  />
                </TodoSection>

                <TodoSection title="This week">
                  <TodoItem 
                    icon={ListChecks} iconColor="text-[#DB2777]" 
                    title="Review basic Astronomy Knowledge" 
                    dueDate="Due Oct 1" statusText="1 day left" statusColor="text-[#F97316]"
                  />
                </TodoSection>

                <TodoSection title="Next week">
                  <TodoItem 
                    icon={FileUp} iconColor="text-[#7E22CE]" 
                    title="Semifinal Project" 
                    dueDate="Due Oct 2"
                  />
                </TodoSection>

                <TodoSection title="Later">
                  <TodoItem 
                    icon={FileUp} iconColor="text-[#7E22CE]" 
                    title="Final Project" 
                    dueDate="Due Dec 12"
                  />
                </TodoSection>
              </TabsContent>
              
              <TabsContent value="overdue" className="mt-0 outline-none">
                <TodoSection title="This week">
                  <TodoItem 
                    icon={ListChecks} iconColor="text-[#DB2777]" 
                    title="Review basic Astronomy Knowledge" 
                    dueDate="Due Sep 1" statusText="missing" statusColor="text-[#EF4444]"
                  />
                </TodoSection>

                <TodoSection title="Last week">
                  <TodoItem 
                    icon={FileUp} iconColor="text-[#7E22CE]" 
                    title="Semifinal Project" 
                    dueDate="Due Oct 2" statusText="missing" statusColor="text-[#EF4444]"
                  />
                </TodoSection>

                <TodoSection title="Sooner">
                  <TodoItem 
                    icon={FileUp} iconColor="text-[#7E22CE]" 
                    title="Final Project" 
                    dueDate="Due Dec 12" statusText="missing" statusColor="text-[#EF4444]"
                  />
                </TodoSection>
              </TabsContent>

              <TabsContent value="done" className="mt-0 outline-none">
                <TodoSection title="No due date">
                  <TodoItem 
                    icon={ListChecks} iconColor="text-[#DB2777]" 
                    title="Review basic Astronomy Knowledge" 
                    dueDate="Due Sep 1" statusText="done" statusColor="text-[#22C55E]"
                  />
                </TodoSection>
                
                <TodoSection title="Completed early">
                  <TodoItem 
                    icon={ListChecks} iconColor="text-[#DB2777]" 
                    title="Review basic Astronomy Knowledge" 
                    dueDate="Due Sep 1" statusText="done" statusColor="text-[#22C55E]"
                  />
                </TodoSection>

                <TodoSection title="This week">
                  <TodoItem 
                    icon={ListChecks} iconColor="text-[#DB2777]" 
                    title="Review basic Astronomy Knowledge" 
                    dueDate="Due Sep 1" statusText="done" statusColor="text-[#22C55E]"
                  />
                </TodoSection>

                <TodoSection title="Last week">
                  <TodoItem 
                    icon={FileUp} iconColor="text-[#7E22CE]" 
                    title="Semifinal Project" 
                    dueDate="Due Oct 1" statusText="done" statusColor="text-[#22C55E]"
                  />
                </TodoSection>

                <TodoSection title="Sooner">
                  <TodoItem 
                    icon={FileUp} iconColor="text-[#7E22CE]" 
                    title="Final Project" 
                    dueDate="Due Nov 1" statusText="done" statusColor="text-[#22C55E]"
                  />
                </TodoSection>
              </TabsContent>

            </div>
          </div>
        </Tabs>
      </div>
    </MainLayout>
  );
}
