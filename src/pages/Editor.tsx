import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Download, FolderOpen, ImagePlus, Loader2, Trash2 } from 'lucide-react';
import type { ProcessedFile } from '../lib/types';
import { detectKind, isImage, isVideo } from '../lib/fileKind';
import { readExif } from '../lib/exif/read';
import { evaluateSafety, summarizeSafety } from '../lib/exif/safety';
import { applyEdit } from '../lib/exif/write';
import { stripVideoLocation } from '../lib/video/strip';
import { downloadAsZip, downloadBlob, suffixFilename } from '../lib/download';
import FileCard from '../components/FileCard';
import FileDetail from '../components/FileDetail';
import SafetyBanner from '../components/SafetyBanner';
import TemplatePicker, { loadTemplates, type Template } from '../components/TemplatePicker';

const FRAME_CLASS = {
  safe: 'frame-safe',
  warn: 'frame-warn',
  danger: 'frame-danger',
  unknown: '',
} as const;

export default function EditorPage({ initialFiles }: { initialFiles?: File[] }) {
  const [files, setFiles] = useState<ProcessedFile[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [openId, setOpenId] = useState<string | null>(null);
  const [batchBusy, setBatchBusy] = useState(false);
  const [template, setTemplate] = useState<Template>(() => loadTemplates()[0]);
  const inputRef = useRef<HTMLInputElement>(null);
  const dirInputRef = useRef<HTMLInputElement>(null);

  // 解析: ファイルから ProcessedFile を作る
  const analyze = useCallback(async (f: File): Promise<ProcessedFile> => {
    const id = `${f.name}-${f.size}-${f.lastModified}-${Math.random().toString(36).slice(2, 8)}`;
    const kind = detectKind(f);
    const previewUrl = isImage(kind) ? URL.createObjectURL(f) : undefined;
    try {
      const { fields, raw } = await readExif(f);
      const safety = evaluateSafety(fields);
      return { id, file: f, kind, previewUrl, fields, rawExif: raw, safety, status: 'ready' };
    } catch (e) {
      return {
        id,
        file: f,
        kind,
        previewUrl,
        fields: [],
        safety: {
          level: 'unknown',
          reasons: ['解析に失敗しました'],
          hasGps: false,
          hasSerial: false,
          hasOwner: false,
          hasOriginalDate: false,
          hasThumbnail: false,
        },
        status: 'error',
        error: e instanceof Error ? e.message : String(e),
      };
    }
  }, []);

  const addFiles = useCallback(
    async (list: FileList | File[]) => {
      const arr = Array.from(list);
      // プレースホルダで先に表示
      const placeholders: ProcessedFile[] = arr.map((f) => ({
        id: `${f.name}-${f.size}-${Math.random().toString(36).slice(2, 8)}`,
        file: f,
        kind: detectKind(f),
        previewUrl: isImage(detectKind(f)) ? URL.createObjectURL(f) : undefined,
        fields: [],
        safety: {
          level: 'unknown',
          reasons: [],
          hasGps: false,
          hasSerial: false,
          hasOwner: false,
          hasOriginalDate: false,
          hasThumbnail: false,
        },
        status: 'analyzing',
      }));
      setFiles((prev) => [...prev, ...placeholders]);

      // 並列で解析 (上限 3 並列)
      const concurrency = 3;
      for (let i = 0; i < arr.length; i += concurrency) {
        const slice = arr.slice(i, i + concurrency);
        const results = await Promise.all(slice.map((f) => analyze(f)));
        setFiles((prev) => {
          const next = [...prev];
          results.forEach((r, j) => {
            const idx = next.findIndex((x) => x.id === placeholders[i + j].id);
            if (idx >= 0) next[idx] = r;
          });
          return next;
        });
      }
    },
    [analyze],
  );

  // 共有ターゲットからの初期ファイル
  useEffect(() => {
    if (initialFiles && initialFiles.length > 0) {
      void addFiles(initialFiles);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFiles]);

  // ドラッグ&ドロップ (デスクトップ用)
  useEffect(() => {
    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        void addFiles(e.dataTransfer.files);
      }
    };
    const onDragOver = (e: DragEvent) => e.preventDefault();
    window.addEventListener('drop', onDrop);
    window.addEventListener('dragover', onDragOver);
    return () => {
      window.removeEventListener('drop', onDrop);
      window.removeEventListener('dragover', onDragOver);
    };
  }, [addFiles]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      files.forEach((f) => f.previewUrl && URL.revokeObjectURL(f.previewUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onPick = () => inputRef.current?.click();
  const onPickFolder = () => dirInputRef.current?.click();

  const onInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fl = e.target.files;
    if (fl) void addFiles(fl);
    e.target.value = '';
  };

  const onSelect = (id: string, sel: boolean) => {
    setSelected((s) => {
      const ns = new Set(s);
      if (sel) ns.add(id);
      else ns.delete(id);
      return ns;
    });
  };

  const onRemove = (id: string) => {
    setFiles((prev) => {
      const target = prev.find((f) => f.id === id);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((f) => f.id !== id);
    });
    setSelected((s) => {
      const ns = new Set(s);
      ns.delete(id);
      return ns;
    });
  };

  const clearAll = () => {
    files.forEach((f) => f.previewUrl && URL.revokeObjectURL(f.previewUrl));
    setFiles([]);
    setSelected(new Set());
  };

  const selectAll = () => setSelected(new Set(files.map((f) => f.id)));
  const deselectAll = () => setSelected(new Set());

  const onUpdated = (next: ProcessedFile) => {
    setFiles((prev) => prev.map((f) => (f.id === next.id ? next : f)));
  };

  const summary = useMemo(
    () => summarizeSafety(files.filter((f) => f.status === 'ready').map((f) => f.safety)),
    [files],
  );

  const targets = files.filter((f) =>
    selected.size > 0 ? selected.has(f.id) : true,
  );

  const runBatch = async () => {
    if (targets.length === 0) return;
    setBatchBusy(true);
    try {
      const results: Array<{ blob: Blob; filename: string }> = [];
      const updated: ProcessedFile[] = [];
      for (const f of targets) {
        try {
          let blob: Blob;
          if (isVideo(f.kind)) {
            const r = await stripVideoLocation(f.file);
            blob = r.blob;
          } else {
            const r = await applyEdit(f.file, f.kind, template.mode);
            blob = r.blob;
          }
          results.push({ blob, filename: suffixFilename(f.file.name) });
          // 状態も更新
          const newFile = new File([blob], f.file.name, { type: blob.type || f.file.type });
          const { fields } = await readExif(newFile);
          const safety = evaluateSafety(fields);
          updated.push({ ...f, file: newFile, fields, safety });
        } catch {
          // 失敗してもスキップ
        }
      }
      // ファイル一覧を更新
      setFiles((prev) => prev.map((f) => updated.find((u) => u.id === f.id) ?? f));
      // 1 件なら直接 DL、複数なら ZIP
      if (results.length === 1) {
        downloadBlob(results[0].blob, results[0].filename);
      } else if (results.length > 1) {
        await downloadAsZip(results);
      }
    } finally {
      setBatchBusy(false);
    }
  };

  const opened = openId ? files.find((f) => f.id === openId) ?? null : null;

  if (opened) {
    return (
      <div className={`-mx-4 min-h-[calc(100vh-8rem)] px-4 ${FRAME_CLASS[opened.safety.level]}`}>
        <FileDetail
          file={opened}
          onClose={() => setOpenId(null)}
          onUpdated={(n) => onUpdated(n)}
        />
      </div>
    );
  }

  return (
    <div
      className={`-mx-4 min-h-[calc(100vh-8rem)] px-4 ${FRAME_CLASS[summary.level]} transition-shadow`}
    >
      <div className="space-y-4 py-2">
        <SafetyBanner summary={summary} count={files.filter((f) => f.status === 'ready').length} />

        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-primary" onClick={onPick}>
            <ImagePlus size={16} />
            写真を選択
          </button>
          <button type="button" className="btn btn-secondary" onClick={onPickFolder}>
            <FolderOpen size={16} />
            フォルダ
          </button>
          {files.length > 0 && (
            <button type="button" className="btn btn-secondary" onClick={clearAll}>
              <Trash2 size={16} />
              全消去
            </button>
          )}
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/*,video/mp4,video/quicktime"
            className="hidden"
            onChange={onInput}
          />
          <input
            ref={dirInputRef}
            type="file"
            multiple
            // @ts-expect-error non-standard but supported
            webkitdirectory=""
            className="hidden"
            onChange={onInput}
          />
        </div>

        {files.length === 0 && (
          <div className="card p-8 text-center text-sm text-slate-500">
            <p>「写真を選択」からカメラロールの画像を取り込んでください。</p>
            <p className="mt-1 text-xs">
              ファイルはアプリ外に送信されません。
            </p>
          </div>
        )}

        {files.length > 0 && (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-500">
                {selected.size > 0
                  ? `${selected.size} 件選択中`
                  : `${files.length} 件すべてが対象`}
              </span>
              {selected.size === 0 ? (
                <button
                  type="button"
                  className="btn btn-secondary !py-1 !text-xs"
                  onClick={selectAll}
                >
                  全選択
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-secondary !py-1 !text-xs"
                  onClick={deselectAll}
                >
                  選択解除
                </button>
              )}
              <div className="ml-auto flex items-center gap-2">
                <TemplatePicker value={template} onChange={setTemplate} />
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={batchBusy || targets.length === 0}
                  onClick={runBatch}
                >
                  {batchBusy ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Download size={16} />
                  )}
                  {batchBusy ? '処理中…' : '一括処理&DL'}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {files.map((f) => (
                <FileCard
                  key={f.id}
                  file={f}
                  selected={selected.has(f.id)}
                  onSelect={onSelect}
                  onRemove={onRemove}
                  onOpen={(id) => setOpenId(id)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
