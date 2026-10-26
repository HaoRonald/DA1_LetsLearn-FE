import { TopicResponse } from '@/services/courseService';
import { useRef, useState, useEffect } from 'react';
import { topicApi } from '@/services/topicService';
import { mediaApi } from '@/services/mediaService';
import { downloadFile } from '@/lib/utils';
import { toast } from 'sonner';
import { UploadCloud, Paperclip, Loader2, Mail, X, FileIcon, Download, Plus, Trash2 } from 'lucide-react';
import { aiAssignmentGradingApi, AssignmentRubric, getAiGradingError } from '@/services/aiAssignmentGradingService';

import { useRouter } from 'next/navigation';

interface TeacherAssignmentSettingsProps {
  assignment: TopicResponse;
  courseId: string;
  onUpdate?: () => void;
  onTabChange?: (tab: string) => void;
}

interface CloudinaryFile {
  id?: string;
  name: string;
  displayUrl: string;
  downloadUrl: string;
}

export function TeacherAssignmentSettings({ assignment, courseId, onUpdate, onTabChange }: TeacherAssignmentSettingsProps) {
  const router = useRouter();
  const assignmentData = assignment.data || {};
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // States for files
  const [existingFiles, setExistingFiles] = useState<CloudinaryFile[]>(() => assignmentData.files || assignmentData.CloudinaryFiles || []);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingNotification, setIsSendingNotification] = useState(false);
  const [rubric, setRubric] = useState<AssignmentRubric | null>(null);
  const [rubricLoading, setRubricLoading] = useState(true);
  const [rubricSaving, setRubricSaving] = useState(false);
  const [rubricMaxScore, setRubricMaxScore] = useState('10');
  const [teacherGuidance, setTeacherGuidance] = useState('');
  const [criteria, setCriteria] = useState<Array<{ name: string; description: string; maxScore: string }>>([]);

  useEffect(() => {
    let active = true;
    aiAssignmentGradingApi.getRubric(assignment.id).then(({ data }) => {
      if (!active) return;
      setRubric(data);
      setRubricMaxScore(String(data.maxScore));
      setTeacherGuidance(data.teacherGuidance ?? '');
      setCriteria(data.criteria.map(({ name, description, maxScore }) => ({ name, description, maxScore: String(maxScore) })));
    }).catch((error: unknown) => {
      const apiError = getAiGradingError(error);
      if (apiError?.status !== 404) toast.error(apiError?.message || 'Không tải được rubric.');
    }).finally(() => { if (active) setRubricLoading(false); });
    return () => { active = false; };
  }, [assignment.id]);

  const handleSaveRubric = async () => {
    const maxScore = Number(rubricMaxScore);
    const normalized = criteria.map((criterion, sortOrder) => ({
      name: criterion.name.trim(), description: criterion.description.trim(), maxScore: Number(criterion.maxScore), sortOrder,
    }));
    if (maxScore !== 10 || normalized.length === 0 || normalized.length > 20 || normalized.some(c => !c.name || c.name.length > 200 || !c.description || c.description.length > 2000 || !Number.isFinite(c.maxScore) || c.maxScore <= 0) ||
      Math.round(normalized.reduce((sum, c) => sum + c.maxScore, 0) * 100) !== 1000) {
      toast.error('Rubric cần có từ 1–20 tiêu chí hợp lệ; mô tả bắt buộc và tổng điểm phải bằng 10.');
      return;
    }
    setRubricSaving(true);
    try {
      const { data } = await aiAssignmentGradingApi.saveRubric(assignment.id, { maxScore, teacherGuidance: teacherGuidance.trim(), criteria: normalized });
      setRubric(data);
      toast.success(`Đã lưu rubric phiên bản ${data.version}.`);
    } catch (error: unknown) {
      toast.error(getAiGradingError(error)?.message || 'Không lưu được rubric.');
    } finally { setRubricSaving(false); }
  };

  // ── Send Email Notification ───────────────────────────────────────
  const handleSendNotification = async () => {
    setIsSendingNotification(true);
    try {
      const res = await topicApi.notifyStudents(courseId, assignment.id);
      const count = res.data?.count ?? 0;
      toast.success(
        count > 0
          ? `Notification sent to ${count} student${count > 1 ? 's' : ''}!`
          : 'Notification sent! (No enrolled students)',
      );
    } catch (err: unknown) {
      console.error('Send notification error:', err);
      toast.error(getAiGradingError(err)?.message || 'Failed to send notification');
    } finally {
      setIsSendingNotification(false);
    }
  };

  // ── Save Settings ────────────────────────────────────────────────
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
      const files = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...files]);
      // Reset input so the same file can be picked again if removed
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeExistingFile = (idx: number) => {
    setExistingFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const removeSelectedFile = (idx: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // 1. Upload new files if any
      let uploadedFiles: CloudinaryFile[] = [];
      if (selectedFiles.length > 0) {
        const uploadPromises = selectedFiles.map(file => mediaApi.upload(file));
        const uploadResults = await Promise.all(uploadPromises);
        uploadedFiles = uploadResults.map(res => res.data);
      }

      // 2. Combine with remaining existing files
      const finalFiles = [...existingFiles, ...uploadedFiles];

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
          CloudinaryFiles: finalFiles
        }
      };

      await topicApi.update(courseId, assignment.id, payload);
      
      // Update local state after success
      setExistingFiles(finalFiles);
      setSelectedFiles([]);
      
      toast.success("Settings saved successfully!");
      if (onUpdate) onUpdate();
      router.refresh();
    } catch (error: unknown) {
      console.error("Save error:", error);
      toast.error(getAiGradingError(error)?.message || "Failed to save settings");
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
            <div className="flex-1 flex flex-col gap-4">
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

              {/* Combined File List */}
              {(existingFiles.length > 0 || selectedFiles.length > 0) && (
                <div className="space-y-2">
                  <p className="text-[12px] font-bold text-gray-500 uppercase tracking-wider">Current Files</p>
                  <div className="flex flex-wrap gap-2">
                    {/* Existing Files */}
                    {existingFiles.map((file, idx) => (
                      <div key={`existing-${idx}`} className="flex items-center gap-2 bg-gray-50 border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg text-[12px] font-medium group">
                        <FileIcon className="w-3.5 h-3.5 text-gray-400" />
                        <span className="max-w-[150px] truncate cursor-default" title={file.name}>{file.name}</span>
                        <div className="flex items-center gap-1 ml-auto">
                          <button 
                            onClick={() => downloadFile(file.downloadUrl || file.displayUrl, file.name)}
                            className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                            title="Download"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => removeExistingFile(idx)}
                            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                            title="Remove"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                    
                    {/* Selected New Files */}
                    {selectedFiles.map((file, idx) => (
                      <div key={`selected-${idx}`} className="flex items-center gap-2 bg-blue-50 border border-blue-100 text-[#3B82F6] px-3 py-1.5 rounded-lg text-[12px] font-medium animate-in fade-in slide-in-from-left-2">
                        <Paperclip className="w-3.5 h-3.5" />
                        <span className="max-w-[150px] truncate">{file.name}</span>
                        <span className="text-[10px] bg-blue-100 px-1 rounded uppercase font-bold">New</span>
                        <button 
                          onClick={() => removeSelectedFile(idx)}
                          className="hover:text-red-500 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
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

      <section className="mb-8 rounded-xl border border-indigo-100 bg-indigo-50/40 p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-gray-800">Rubric chấm bằng AI</h3>
            <p className="mt-1 text-sm text-gray-500">Thêm từng tiêu chí bằng nút “Thêm tiêu chí”; ô hướng dẫn bên dưới không thay thế danh sách tiêu chí. Tổng điểm tiêu chí phải bằng 10.</p>
          </div>
          {rubric && <span className="text-xs font-semibold text-indigo-600">Phiên bản {rubric.version}</span>}
        </div>
        {rubricLoading ? <Loader2 className="h-5 w-5 animate-spin text-indigo-500" /> : <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-[140px_1fr]">
            <label className="text-sm font-semibold text-gray-600">Điểm tối đa
              <input type="number" min="0.1" step="0.1" value={rubricMaxScore} onChange={e => setRubricMaxScore(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2" />
            </label>
            <label className="text-sm font-semibold text-gray-600">Hướng dẫn bổ sung cho AI (không phải tiêu chí)
              <textarea value={teacherGuidance} onChange={e => setTeacherGuidance(e.target.value)} rows={2} className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2" placeholder="Ưu tiên lập luận, độ chính xác..." />
            </label>
          </div>
          {criteria.map((criterion, index) => <div key={index} className="grid gap-2 rounded-lg border border-gray-200 bg-white p-3 md:grid-cols-[1fr_2fr_110px_40px]">
            <input aria-label={`Tên tiêu chí ${index + 1}`} value={criterion.name} onChange={e => setCriteria(items => items.map((item, i) => i === index ? { ...item, name: e.target.value } : item))} placeholder="Tên tiêu chí" className="rounded border border-gray-200 px-2 py-2 text-sm" />
            <input aria-label={`Mô tả tiêu chí ${index + 1}`} value={criterion.description} onChange={e => setCriteria(items => items.map((item, i) => i === index ? { ...item, description: e.target.value } : item))} placeholder="Mô tả / yêu cầu đạt" className="rounded border border-gray-200 px-2 py-2 text-sm" />
            <input aria-label={`Điểm tiêu chí ${index + 1}`} type="number" min="0.1" step="0.1" value={criterion.maxScore} onChange={e => setCriteria(items => items.map((item, i) => i === index ? { ...item, maxScore: e.target.value } : item))} className="rounded border border-gray-200 px-2 py-2 text-sm" />
            <button type="button" aria-label="Xóa tiêu chí" onClick={() => setCriteria(items => items.filter((_, i) => i !== index))} className="text-red-500"><Trash2 className="mx-auto h-4 w-4" /></button>
          </div>)}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button type="button" onClick={() => setCriteria(items => [...items, { name: '', description: '', maxScore: '1' }])} className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600"><Plus className="h-4 w-4" /> Thêm tiêu chí</button>
            <button type="button" onClick={handleSaveRubric} disabled={rubricSaving} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{rubricSaving ? 'Đang lưu...' : rubric ? 'Lưu phiên bản mới' : 'Tạo rubric'}</button>
          </div>
        </div>}
      </section>

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

      <div className="flex justify-center gap-4 pt-8 border-t border-gray-100 mt-8">
        <button
          onClick={handleSendNotification}
          disabled={isSendingNotification}
          className="bg-blue-500 hover:bg-blue-600 text-white font-black px-6 py-3 rounded-xl shadow-md shadow-blue-100 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isSendingNotification ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
          {isSendingNotification ? 'Sending...' : 'Send Email Notification'}
        </button>
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
