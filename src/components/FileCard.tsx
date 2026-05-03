import { ChevronRight, X, FileVideo } from 'lucide-react';
import type { ProcessedFile } from '../lib/types';
import SafetyBadge from './SafetyBadge';
import { isVideo } from '../lib/fileKind';

const FRAME_CLASS = {
  safe: 'frame-safe',
  warn: 'frame-warn',
  danger: 'frame-danger',
  unknown: '',
} as const;

export default function FileCard({
  file,
  selected,
  onSelect,
  onRemove,
  onOpen,
}: {
  file: ProcessedFile;
  selected: boolean;
  onSelect: (id: string, selected: boolean) => void;
  onRemove: (id: string) => void;
  onOpen: (id: string) => void;
}) {
  return (
    <div className={`card relative overflow-hidden ${FRAME_CLASS[file.safety.level]}`}>
      <div className="flex items-center gap-3 p-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={(e) => onSelect(file.id, e.target.checked)}
          className="h-4 w-4 shrink-0"
          aria-label="選択"
        />
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-200 dark:bg-slate-700">
          {file.previewUrl && !isVideo(file.kind) ? (
            <img
              src={file.previewUrl}
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-slate-500">
              <FileVideo size={24} />
            </div>
          )}
        </div>
        <button
          type="button"
          className="flex-1 text-left"
          onClick={() => onOpen(file.id)}
          aria-label={`${file.file.name} の詳細を開く`}
        >
          <div className="flex items-center gap-2">
            <SafetyBadge level={file.safety.level} size="sm" />
            <span className="truncate text-xs text-slate-500">{formatSize(file.file.size)}</span>
          </div>
          <div className="mt-1 truncate text-sm font-medium">{file.file.name}</div>
          <div className="mt-0.5 truncate text-xs text-slate-500">
            {file.status === 'analyzing'
              ? '解析中…'
              : file.status === 'error'
                ? `エラー: ${file.error ?? '解析失敗'}`
                : file.safety.reasons[0] ?? '解析完了'}
          </div>
        </button>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onOpen(file.id)}
            className="rounded p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
            aria-label="詳細"
          >
            <ChevronRight size={18} />
          </button>
          <button
            type="button"
            onClick={() => onRemove(file.id)}
            className="rounded p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
            aria-label="削除"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
