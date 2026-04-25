import { TopicResponse } from '@/services/courseService';
import { useRef, useState } from 'react';
import { topicApi } from '@/services/topicService';
import { toast } from 'sonner';
import { UploadCloud, Paperclip, Loader2 } from 'lucide-react';

import { useRouter } from 'next/navigation';

interface TeacherAssignmentSettingsProps {
  assignment: TopicResponse;
  courseId: string;
  onUpdate?: () => void;
  onTabChange?: (tab: string) => void;
}

export function TeacherAssignmentSettings({ assignment, courseId, onUpdate, onTabChange }: TeacherAssignmentSettingsProps) {
  const router = useRouter();
  const assignmentData = assignment.data || {};
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [form, setForm] = useState({
    title: assignment.title || "",
    description: assignmentData.description || "",
    open: assignmentData.open ? new Date(assignmentData.open).toISOString().slice(0, 16) : "",
    close: assignmentData.close ? new Date(assignmentData.close).toISOString().slice(0, 16) : "",
    remindToGrade: assignmentData.remindToGrade ? new Date(assignmentData.remindToGrade).toISOString().slice(0, 16) : "",
    maximumFile: assignmentData.maximumFile || 1,
    maximumFileSize: assignmentData.maximumFileSize || "1 MB",
    enableOpen: !!assignmentData.open,
    enableClose: !!assignmentData.close,
    enableRemind: !!assignmentData.remindToGrade,
    enableMaxFiles: (assignmentData.maximumFile || 0) > 0,
    enableMaxSize: !!assignmentData.maximumFileSize,
  });

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = {
        id: assignment.id,
        title: form.title,
        type: assignment.type,
        data: {
          description: form.description,
          open: form.enableOpen && form.open ? new Date(form.open).toISOString() : null,
          close: form.enableClose && form.close ? new Date(form.close).toISOString() : null,
          remindToGrade: form.enableRemind && form.remindToGrade ? new Date(form.remindToGrade).toISOString() : null,
          maximumFile: form.enableMaxFiles ? form.maximumFile : 0,
          maximumFileSize: form.enableMaxSize ? form.maximumFileSize : null,
          // Ánh xạ lại danh sách file cho đúng tên CloudinaryFiles mà BE yêu cầu
          CloudinaryFiles: assignmentData.files || assignmentData.CloudinaryFiles || []
        }
      };

      await topicApi.update(courseId, assignment.id, payload);
      toast.success("Settings saved successfully!");
      if (onUpdate) onUpdate();
      router.refresh();
    } catch (error: any) {
      console.error("Save error:", error);
      toast.error(error.response?.data?.message || "Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <div className="bg-white rounded-xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] border border-[#E5E7EB] p-6 mb-12">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-[#F97316] font-bold text-[18px]">Edit Setting</h2>
        <button className="text-[#3B82F6] font-bold text-[14px] hover:underline">Collapse all</button>
      </div>

      {/* General Settings */}
      <div className="mb-8">
        <h3 className="font-bold text-[#374151] flex items-center gap-2 mb-4 bg-gray-50 p-3 rounded-lg cursor-pointer hover:bg-gray-100">
          <span className="bg-white rounded-full p-1 shadow-sm text-gray-500">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
          </span>
          General
        </h3>
        
        <div className="pl-12 pr-4 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <label className="md:w-1/4 text-[14px] font-bold text-[#374151]">Name</label>
            <input 
              type="text" 
              value={form.title} 
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Enter assignment name"
              className="flex-1 border border-[#E5E7EB] rounded-lg px-4 py-2 text-[14px]" 
            />
          </div>
          
          <div className="flex flex-col md:flex-row gap-4">
            <label className="md:w-1/4 text-[14px] font-bold text-[#374151] pt-2">Description</label>
            <textarea 
              value={form.description} 
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Enter assignment description"
              rows={4} 
              className="flex-1 border border-[#E5E7EB] rounded-lg px-4 py-3 text-[14px]" 
            />
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <label className="md:w-1/4 text-[14px] font-bold text-[#374151] pt-2">Additional files</label>
            <div className="flex-1 flex flex-col gap-3">
              <div 
                onClick={handleFileClick}
                className="border-2 border-dashed border-[#E5E7EB] rounded-xl hover:border-blue-300 hover:bg-blue-50/30 transition-all cursor-pointer h-40 flex flex-col items-center justify-center text-center group"
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  multiple 
                  className="hidden" 
                  onChange={handleFileChange}
                />
                <UploadCloud className="w-6 h-6 text-[#374151] mb-2 group-hover:text-blue-500" />
                <p className="text-[14px] font-bold text-[#3B82F6] mb-1">Choose files or drag and drop</p>
                <p className="text-[12px] text-[#9CA3AF] mb-4">Texts, images, videos, audios and pdfs</p>
                <button 
                  type="button"
                  className="flex items-center gap-2 bg-[#3B82F6] hover:bg-blue-600 transition-colors text-white px-4 py-1.5 rounded-lg text-[13px] font-bold shadow-sm"
                >
                  <Paperclip className="w-3.5 h-3.5" /> Attach
                </button>
              </div>

              {selectedFiles.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedFiles.map((file, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-blue-50 border border-blue-100 text-[#3B82F6] px-3 py-1 rounded-full text-[12px] font-medium">
                      <Paperclip className="w-3 h-3" />
                      {file.name}
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFiles(prev => prev.filter((_, i) => i !== idx));
                        }}
                        className="hover:text-red-500 ml-1"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Availability */}
      <div className="mb-8">
        <h3 className="font-bold text-[#374151] flex items-center gap-2 mb-4 bg-gray-50 p-3 rounded-lg cursor-pointer hover:bg-gray-100">
          <span className="bg-white rounded-full p-1 shadow-sm text-gray-500">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
          </span>
          Availability
        </h3>
        
        <div className="pl-12 pr-4 space-y-4">
          <div className="flex items-center gap-6">
            <label className="w-1/3 text-[14px] font-bold text-[#374151]">Allow from</label>
            <div className="flex items-center gap-2 w-32">
              <input 
                type="checkbox" 
                checked={form.enableOpen} 
                onChange={(e) => setForm({ ...form, enableOpen: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded border-gray-300" 
              /> 
              <span className="text-[14px]">Enable</span>
            </div>
            <input 
              type="datetime-local" 
              value={form.open} 
              onChange={(e) => setForm({ ...form, open: e.target.value })}
              disabled={!form.enableOpen}
              className="border border-[#E5E7EB] rounded-lg px-4 py-2 text-[14px] text-gray-600 flex-1 disabled:bg-gray-50 disabled:text-gray-400" 
            />
          </div>

          <div className="flex items-center gap-6">
            <label className="w-1/3 text-[14px] font-bold text-[#374151]">Deadline</label>
            <div className="flex items-center gap-2 w-32">
              <input 
                type="checkbox" 
                checked={form.enableClose} 
                onChange={(e) => setForm({ ...form, enableClose: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded border-gray-300" 
              /> 
              <span className="text-[14px]">Enable</span>
            </div>
            <input 
              type="datetime-local" 
              value={form.close} 
              onChange={(e) => setForm({ ...form, close: e.target.value })}
              disabled={!form.enableClose}
              className="border border-[#E5E7EB] rounded-lg px-4 py-2 text-[14px] text-gray-600 flex-1 disabled:bg-gray-50 disabled:text-gray-400" 
            />
          </div>

          <div className="flex items-center gap-6">
            <label className="w-1/3 text-[14px] font-bold text-[#374151]">Remind grade</label>
            <div className="flex items-center gap-2 w-32">
              <input 
                type="checkbox" 
                checked={form.enableRemind} 
                onChange={(e) => setForm({ ...form, enableRemind: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded border-gray-300" 
              /> 
              <span className="text-[14px]">Enable</span>
            </div>
            <input 
              type="datetime-local" 
              value={form.remindToGrade} 
              onChange={(e) => setForm({ ...form, remindToGrade: e.target.value })}
              disabled={!form.enableRemind}
              className="border border-[#E5E7EB] rounded-lg px-4 py-2 text-[14px] text-gray-600 flex-1 disabled:bg-gray-50 disabled:text-gray-400" 
            />
          </div>
        </div>
      </div>

      {/* Submission types */}
      <div className="mb-8">
        <h3 className="font-bold text-[#374151] flex items-center gap-2 mb-4 bg-gray-50 p-3 rounded-lg cursor-pointer hover:bg-gray-100">
          <span className="bg-white rounded-full p-1 shadow-sm text-gray-500">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
          </span>
          Submission types
        </h3>
        
        <div className="pl-12 pr-4 space-y-4">
          <div className="flex items-center gap-6">
            <label className="w-1/3 text-[14px] font-bold text-[#374151]">Max files</label>
            <div className="flex items-center gap-2 w-32">
              <input 
                type="checkbox" 
                checked={form.enableMaxFiles} 
                onChange={(e) => setForm({ ...form, enableMaxFiles: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded border-gray-300" 
              /> 
              <span className="text-[14px]">Enable</span>
            </div>
            <input 
              type="number" 
              min="1" 
              max="20" 
              value={form.maximumFile} 
              onChange={(e) => setForm({ ...form, maximumFile: parseInt(e.target.value) })}
              disabled={!form.enableMaxFiles}
              className="border border-[#E5E7EB] rounded-lg px-4 py-2 text-[14px] text-gray-600 w-24 disabled:bg-gray-50 disabled:text-gray-400" 
            />
          </div>

          <div className="flex items-center gap-6">
            <label className="w-1/3 text-[14px] font-bold text-[#374151]">Max size</label>
            <div className="flex items-center gap-2 w-32">
              <input 
                type="checkbox" 
                checked={form.enableMaxSize} 
                onChange={(e) => setForm({ ...form, enableMaxSize: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded border-gray-300" 
              /> 
              <span className="text-[14px]">Enable</span>
            </div>
            <select 
              value={form.maximumFileSize} 
              onChange={(e) => setForm({ ...form, maximumFileSize: e.target.value })}
              disabled={!form.enableMaxSize}
              className="border border-[#E5E7EB] rounded-lg px-4 py-2 text-[14px] text-gray-600 w-64 disabled:bg-gray-50 disabled:text-gray-400"
            >
              <option>1 MB</option>
              <option>5 MB</option>
              <option>10 MB</option>
              <option>50 MB</option>
              <option>100 MB</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex justify-center pt-8 border-t border-gray-100 mt-8">
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="bg-purple-600 hover:bg-purple-700 text-white font-black px-10 py-3 rounded-xl shadow-lg shadow-purple-200 transition-all hover:scale-[1.02] active:scale-[0.98] min-w-[140px] flex items-center justify-center gap-2"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {isSaving ? "Saving..." : "Save Settings"}
        </button>
      </div>

    </div>
  );
}
