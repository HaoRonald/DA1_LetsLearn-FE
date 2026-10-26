'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { CheckCircle2, Circle, Loader2 } from 'lucide-react';
import { learningProgressApi, TopicProgressDto } from '@/services/learningProgressService';
import { toast } from 'sonner';

interface TopicLearningStatusProps {
  topicId: string;
  completionSource: string;
}

export function TopicLearningStatus({ topicId, completionSource }: TopicLearningStatusProps) {
  const [progress, setProgress] = useState<TopicProgressDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const lastTrackedTopicId = useRef<string | null>(null);

  const markViewed = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await learningProgressApi.markTopicViewed(topicId);
      setProgress(response.data);
    } catch (error) {
      console.error('Failed to record topic view:', error);
    } finally {
      setIsLoading(false);
    }
  }, [topicId]);

  useEffect(() => {
    if (lastTrackedTopicId.current === topicId) return;
    lastTrackedTopicId.current = topicId;
    setProgress(null);
    void markViewed();
  }, [markViewed, topicId]);

  const markCompleted = async () => {
    if (isSaving || progress?.status === 'completed') return;
    setIsSaving(true);
    try {
      const response = await learningProgressApi.markTopicCompleted(topicId, completionSource);
      setProgress(response.data);
      toast.success('Đã cập nhật tiến độ học của bạn.');
    } catch (error) {
      console.error('Failed to complete topic:', error);
      toast.error('Chưa thể cập nhật tiến độ. Vui lòng thử lại.');
    } finally {
      setIsSaving(false);
    }
  };

  const isCompleted = progress?.status === 'completed';

  return (
    <div className="mb-5 flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${isCompleted ? 'bg-emerald-100 text-emerald-700' : 'bg-white text-slate-500'}`}>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : isCompleted ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
        </span>
        <div>
          <p className="text-sm font-semibold text-slate-800">
            {isLoading ? 'Đang cập nhật tiến độ…' : isCompleted ? 'Bạn đã hoàn thành nội dung này' : progress ? 'Đã ghi nhận bạn đang học nội dung này' : 'Chưa ghi nhận được tiến độ'}
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
            Khi học xong, hãy đánh dấu để cập nhật lộ trình của bạn.
          </p>
        </div>
      </div>
      {!isCompleted && (
        <button
          type="button"
          onClick={markCompleted}
          disabled={isSaving || isLoading}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
          Đánh dấu đã học xong
        </button>
      )}
    </div>
  );
}
