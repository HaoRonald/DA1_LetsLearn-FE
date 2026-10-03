"use client";

import { Dialog } from '@base-ui/react/dialog';
import { BrainCircuit, Copy, Download, Loader2, RefreshCw, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { toast } from 'sonner';
import { chatFontFamily } from './chatTypography';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  summary: string;
  loading: boolean;
  error: string;
  onRetry: () => void;
}

export function ChatSummaryDialog({ open, onOpenChange, title, summary, loading, error, onRetry }: Props) {
  const copySummary = async () => {
    try {
      await navigator.clipboard.writeText(summary);
      toast.success('Đã sao chép bản tóm tắt.');
    } catch {
      toast.error('Không sao chép được. Bạn có thể chọn và sao chép nội dung trực tiếp.');
    }
  };

  const downloadSummary = () => {
    const url = URL.createObjectURL(new Blob([summary], { type: 'text/markdown;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'tom-tat-hoi-thoai.md';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-[10000] bg-slate-950/60 backdrop-blur-sm" />
        <Dialog.Popup style={{ fontFamily: chatFontFamily }} className="chat-surface fixed left-1/2 top-1/2 z-[10001] flex max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-3xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[26px] border border-white/50 bg-white text-slate-800 shadow-2xl outline-none">
          <header className="flex shrink-0 items-start gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-900 px-5 py-5 text-white sm:px-8 sm:py-6">
            <div className="rounded-2xl border border-white/20 bg-white/10 p-3 text-violet-200"><BrainCircuit className="h-6 w-6" /></div>
            <div className="min-w-0 flex-1">
              <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.18em] text-indigo-200">LetsLearn AI</p>
              <Dialog.Title className="text-xl font-bold leading-snug tracking-tight sm:text-[22px]">Tóm tắt hội thoại</Dialog.Title>
              <Dialog.Description className="mt-1 text-xs leading-5 text-slate-200 sm:text-sm">{title} · Tối đa 50 tin nhắn gần nhất</Dialog.Description>
            </div>
            <Dialog.Close aria-label="Đóng tóm tắt" className="rounded-xl p-2 text-white/80 hover:bg-white/15 hover:text-white focus-visible:outline-2 focus-visible:outline-white"><X className="h-5 w-5" /></Dialog.Close>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-[#F5F7FC] px-4 py-5 sm:px-8 sm:py-7" aria-busy={loading}>
            {loading ? (
              <div role="status" className="flex min-h-60 flex-col items-center justify-center gap-4 text-center">
                <Loader2 className="h-7 w-7 animate-spin text-indigo-500" />
                <p className="text-base font-semibold">Đang tổng hợp cuộc trò chuyện…</p>
                <p className="max-w-sm text-sm leading-6 text-slate-500">AI đang xem các chủ đề, quyết định và việc cần làm. Bạn có thể đóng cửa sổ trong lúc chờ.</p>
              </div>
            ) : error ? (
              <div role="alert" className="rounded-2xl border border-red-200 bg-white p-5 text-sm leading-6 text-red-700 shadow-sm">{error}</div>
            ) : (
              <article className="chat-summary-content select-text rounded-2xl border border-slate-200 bg-white px-5 py-6 text-[15px] leading-[1.85] text-slate-700 shadow-sm [overflow-wrap:anywhere] sm:px-7 sm:text-base">
                <ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml components={{
                  h1: ({ children }) => <h3 className="mb-4 mt-7 rounded-xl border-l-4 border-indigo-500 bg-indigo-50 px-4 py-2.5 text-lg font-bold text-indigo-950 first:mt-0">{children}</h3>,
                  h2: ({ children }) => <h3 className="mb-4 mt-8 rounded-xl border-l-4 border-indigo-500 bg-indigo-50 px-4 py-2.5 text-base font-bold text-indigo-950 first:mt-0">{children}</h3>,
                  h3: ({ children }) => <h4 className="mb-2 mt-5 font-bold text-slate-900">{children}</h4>,
                  p: ({ children }) => <p className="mb-4 last:mb-0">{children}</p>,
                  ul: ({ children }) => <ul className="mb-5 list-disc space-y-2.5 pl-5 marker:text-indigo-500">{children}</ul>,
                  ol: ({ children }) => <ol className="mb-5 list-decimal space-y-2.5 pl-5 marker:font-bold marker:text-indigo-600">{children}</ol>,
                  strong: ({ children }) => <strong className="font-bold text-slate-900">{children}</strong>,
                  blockquote: ({ children }) => <blockquote className="my-4 border-l-2 border-indigo-300 bg-slate-50 px-4 py-2 text-slate-600">{children}</blockquote>,
                  a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline underline-offset-2">{children}</a>,
                  img: ({ alt }) => <span className="text-slate-500">[{alt || 'Hình ảnh'}]</span>,
                  table: ({ children }) => <div className="my-5 overflow-x-auto rounded-xl border border-slate-200"><table className="w-full border-collapse text-left text-sm">{children}</table></div>,
                  th: ({ children }) => <th className="border-b border-slate-200 bg-indigo-50 px-3 py-2 font-bold text-indigo-950">{children}</th>,
                  td: ({ children }) => <td className="border-b border-slate-100 px-3 py-2 align-top">{children}</td>,
                  pre: ({ children }) => <pre className="my-3 overflow-x-auto rounded-lg bg-slate-100 p-4 text-sm">{children}</pre>,
                  code: ({ children }) => <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[0.9em]">{children}</code>,
                }}>{summary}</ReactMarkdown>
              </article>
            )}
          </div>

          <footer className="shrink-0 border-t border-slate-200 bg-white px-5 py-4 sm:px-8">
            <p className="mb-3 text-xs leading-5 text-slate-500">Bản tóm tắt do AI tạo. Hãy đối chiếu thời hạn và phân công với tin nhắn gốc.</p>
            <div className="flex flex-wrap items-center gap-2 text-sm font-medium">
              <button type="button" onClick={copySummary} disabled={loading || !!error || !summary} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 hover:bg-slate-100 disabled:opacity-40"><Copy className="h-4 w-4" />Sao chép</button>
              <button type="button" onClick={downloadSummary} disabled={loading || !!error || !summary} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 hover:bg-slate-100 disabled:opacity-40"><Download className="h-4 w-4" />Lưu .md</button>
              <button type="button" onClick={onRetry} disabled={loading} className="ml-auto flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-white hover:bg-indigo-700 disabled:opacity-40"><RefreshCw className="h-4 w-4" />{error ? 'Thử lại' : 'Tóm tắt lại'}</button>
            </div>
          </footer>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
