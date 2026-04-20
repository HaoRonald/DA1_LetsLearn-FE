"use client";

import React, { useEffect, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import MainLayout from "@/components/layout/MainLayout";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/Input";
import { courseApi } from "@/services/courseService";
import { toast } from "sonner";

export default function CreateCoursePage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Academic");
  const [level, setLevel] = useState("Beginner");
  const [visibility, setVisibility] = useState("private");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoading) {
      const role = user?.role;
      if (role !== "Admin" && role !== "Teacher") {
        router.push("/");
      }
    }
  }, [user, isLoading, router]);

  if (isLoading) return null;

  const handleSave = async () => {
    if (!title.trim()) {
      setError("Course name is required");
      return;
    }
    
    setIsSubmitting(true);
    setError("");

    try {
      const id = crypto.randomUUID();
      const isPublished = visibility === "public";
      
      await courseApi.create({
        id,
        title,
        description: "Course description goes here...",
        category,
        level,
        isPublished,
      });
      
      toast.success('Course created successfully!');
      router.push(`/courses/${id}`);
    } catch (err: any) {
      console.error(err);
      const errMsg = err.response?.data?.message || "Failed to create course";
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MainLayout>
      <div className="flex flex-col h-full bg-white relative">
        <div className="w-full flex-1 overflow-y-auto px-6 lg:px-8 py-8 relative">
          
          <Link
            href="/"
            className="absolute top-8 left-6 lg:left-8 w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-[#374151]" />
          </Link>

          <div className="max-w-2xl mx-auto mt-4 px-4">
            <h1 className="text-[28px] font-bold text-[#374151] text-center mb-10">
              Create your course
            </h1>

            <div className="space-y-8 max-w-xl mx-auto">
              <div className="flex flex-col gap-2">
                <label className="text-[16px] font-bold text-[#374151]">Name</label>
                <Input 
                  placeholder="e.g. Introduce to Astronomy" 
                  className="h-12 border-[#E5E7EB] rounded-xl text-[15px]" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
                <p className="text-[13px] text-[#9CA3AF]">What will you teach in this course?</p>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[16px] font-bold text-[#374151]">Category</label>
                <Input 
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="h-12 border-[#E5E7EB] rounded-xl text-[15px]" 
                />
                <p className="text-[13px] text-[#9CA3AF]">What subject area best describes your course?</p>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[16px] font-bold text-[#374151]">Level</label>
                <Input 
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className="h-12 border-[#E5E7EB] rounded-xl text-[15px]" 
                />
                <p className="text-[13px] text-[#9CA3AF]">What level is your course?</p>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[16px] font-bold text-[#374151]">Visibility</label>
                <Select value={visibility} onValueChange={setVisibility}>
                  <SelectTrigger className="w-full h-12 border-[#E5E7EB] rounded-xl text-[15px]">
                    <SelectValue placeholder="Select visibility" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="private">Private</SelectItem>
                    <SelectItem value="public">Public</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[13px] text-[#9CA3AF]">Only participants can access the course</p>
              </div>

              {error && <p className="text-sm text-red-500 font-bold text-center">{error}</p>}

              <div className="flex justify-center pt-4">
                <button 
                  onClick={handleSave}
                  disabled={isSubmitting}
                  className="bg-[#3B82F6] hover:bg-blue-600 transition-colors text-white font-bold px-8 py-3 rounded-lg shadow-sm flex items-center justify-center min-w-[120px]"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save"}
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </MainLayout>
  );
}
