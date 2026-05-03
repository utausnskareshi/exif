import { useEffect, useState } from 'react';
import { ArrowLeft, Download, MapPinOff, Trash2, UserMinus, RotateCcw } from 'lucide-react';
import type { ProcessedFile, ExifField } from '../lib/types';
import { isVideo } from '../lib/fileKind';
import { applyEdit, type EditMode } from '../lib/exif/write';
import { stripVideoLocation } from '../lib/video/strip';
import { readExif } from '../lib/exif/read';
import { evaluateSafety } from '../lib/exif/safety';
import { downloadBlob, suffixFilename } from '../lib/download';
import SafetyBadge from './SafetyBadge';
import ExifTable from './ExifTable';
import MapPreview from './MapPreview';
import BeforeAfter from './BeforeAfter';

export default function FileDetail({
  file,
  onClose,
  onUpdated,
}: {
  file: ProcessedFile;
  onClose: () => void;
  onUpdated: (next: ProcessedFile) => void;
}) {
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [previewAfter, setPreviewAfter] = useState<{
    fields: ExifField[];
    blob: Blob;
    note?: string;
  } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setEdits({});
    setPreviewAfter(null);
  }, [file.id]);

  const onEditChange = (tag: string, value: string) => {
    setEdits((e) => ({ ...e, [tag]: value }));
  };

  const runEdit = async (mode: EditMode) => {
    setBusy(true);
    try {
      let blob: Blob;
      let note: string | undefined;
      if (isVideo(file.kind)) {
        const r = await stripVideoLocation(file.file);
        blob = r.blob;
        note = r.note;
      } else {
        const r = await applyEdit(file.file, file.kind, mode);
        blob = r.blob;
        note = r.note;
      }
      const f = new File([blob], file.file.name, { type: blob.type || file.file.type });
      const { fields } = await readExif(f);
      setPreviewAfter({ fields, blob, note });
    } finally {
      setBusy(false);
    }
  };

  const apply = () => {
    if (!previewAfter) return;
    const safety = evaluateSafety(previewAfter.fields);
    const newFile = new File([previewAfter.blob], file.file.name, {
      type: previewAfter.blob.type || file.file.type,
    });
    const next: ProcessedFile = {
      ...file,
      file: newFile,
      fields: previewAfter.fields,
      safety,
      previewUrl: file.previewUrl, // プレビュー画像は流用
    };
    onUpdated(next);
    setPreviewAfter(null);
    setEdits({});
  };

  const downloadCurrent = () => {
    downloadBlob(file.file, suffixFilename(file.file.name));
  };

  const downloadPreview = () => {
    if (!previewAfter) return;
    downloadBlob(previewAfter.blob, suffixFilename(file.file.name));
  };

  const hasEdits = Object.keys(edits).length > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800"
          onClick={onClose}
          aria-label="戻る"
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className="flex-1 truncate text-lg font-bold">{file.file.name}</h2>
        <SafetyBadge level={file.safety.level} size="md" />
      </div>

      {file.previewUrl && !isVideo(file.kind) && (
        <img
          src={file.previewUrl}
          alt=""
          className="max-h-64 w-full rounded-lg object-contain"
        />
      )}

      {file.safety.gps && (
        <MapPreview lat={file.safety.gps.lat} lng={file.safety.gps.lng} />
      )}

      <section>
        <h3 className="mb-2 font-semibold">ワンタッチ操作</h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <button
            type="button"
            disabled={busy}
            className="btn btn-warn"
            onClick={() => runEdit({ type: 'stripGpsOnly' })}
          >
            <MapPinOff size={16} />
            位置情報のみ削除
          </button>
          <button
            type="button"
            disabled={busy}
            className="btn btn-secondary"
            onClick={() => runEdit({ type: 'stripIdentity' })}
          >
            <UserMinus size={16} />
            個人情報のみ削除
          </button>
          <button
            type="button"
            disabled={busy}
            className="btn btn-danger col-span-2 sm:col-span-1"
            onClick={() => runEdit({ type: 'stripAll' })}
          >
            <Trash2 size={16} />
            すべて削除
          </button>
        </div>
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-semibold">メタデータ</h3>
          <div className="flex gap-2">
            <button
              type="button"
              className="btn btn-secondary !py-1 !text-xs"
              disabled={!hasEdits || busy}
              onClick={() => runEdit({ type: 'patch', updates: edits })}
            >
              編集を反映 (プレビュー)
            </button>
            <button
              type="button"
              className="btn btn-secondary !py-1 !text-xs"
              disabled={!hasEdits}
              onClick={() => setEdits({})}
              aria-label="編集をリセット"
            >
              <RotateCcw size={12} />
            </button>
          </div>
        </div>
        <ExifTable fields={file.fields} edits={edits} onChangeEdit={onEditChange} />
      </section>

      {previewAfter && (
        <section className="space-y-2">
          <h3 className="font-semibold">変更プレビュー (適用前)</h3>
          {previewAfter.note && (
            <p className="rounded bg-slate-100 p-2 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {previewAfter.note}
            </p>
          )}
          <BeforeAfter before={file.fields} after={previewAfter.fields} />
          <div className="flex gap-2">
            <button type="button" className="btn btn-primary" onClick={apply}>
              この内容で確定
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={downloadPreview}
            >
              <Download size={16} />
              ダウンロード
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setPreviewAfter(null)}
            >
              キャンセル
            </button>
          </div>
        </section>
      )}

      <section className="border-t border-slate-200 pt-4 dark:border-slate-700">
        <button
          type="button"
          className="btn btn-secondary w-full"
          onClick={downloadCurrent}
        >
          <Download size={16} />
          現在の状態でダウンロード
        </button>
      </section>
    </div>
  );
}
