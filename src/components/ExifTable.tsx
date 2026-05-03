import { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Pencil } from 'lucide-react';
import type { ExifField } from '../lib/types';

const CATEGORY_LABEL: Record<ExifField['category'], string> = {
  gps: '📍 位置情報',
  datetime: '📅 日時',
  camera: '📷 カメラ・機材',
  settings: '⚙️ 撮影設定',
  identity: '👤 個人情報',
  other: '📝 その他',
};

const EDITABLE_TAGS = new Set([
  'Make',
  'Model',
  'Software',
  'Artist',
  'Copyright',
  'ImageDescription',
  'DateTimeOriginal',
  'UserComment',
]);

export default function ExifTable({
  fields,
  edits,
  onChangeEdit,
}: {
  fields: ExifField[];
  edits: Record<string, string>;
  onChangeEdit: (tag: string, value: string) => void;
}) {
  const grouped = useMemo(() => {
    const map = new Map<ExifField['category'], ExifField[]>();
    for (const f of fields) {
      if (!map.has(f.category)) map.set(f.category, []);
      map.get(f.category)!.push(f);
    }
    return [...map.entries()];
  }, [fields]);

  if (fields.length === 0) {
    return (
      <p className="text-sm text-slate-500">メタデータは検出されませんでした。</p>
    );
  }

  return (
    <div className="space-y-3">
      {grouped.map(([cat, items]) => (
        <CategoryGroup
          key={cat}
          title={CATEGORY_LABEL[cat]}
          items={items}
          edits={edits}
          onChangeEdit={onChangeEdit}
        />
      ))}
    </div>
  );
}

function CategoryGroup({
  title,
  items,
  edits,
  onChangeEdit,
}: {
  title: string;
  items: ExifField[];
  edits: Record<string, string>;
  onChangeEdit: (tag: string, value: string) => void;
}) {
  const [open, setOpen] = useState(true);
  const piiCount = items.filter((i) => i.pii).length;

  return (
    <section className="card overflow-hidden">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="font-semibold">
          {title}
          <span className="ml-2 text-xs font-normal text-slate-500">
            {items.length} 件
            {piiCount > 0 ? ` (PII ${piiCount} 件)` : ''}
          </span>
        </span>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      {open && (
        <div className="border-t border-slate-200 dark:border-slate-700">
          <table className="w-full text-sm">
            <tbody>
              {items.map((f) => {
                const editable = EDITABLE_TAGS.has(f.tag);
                const editingValue = edits[f.tag];
                return (
                  <tr
                    key={f.tag}
                    className={`border-t border-slate-100 dark:border-slate-700/50 ${
                      f.pii ? 'bg-warn-50/40 dark:bg-warn-500/5' : ''
                    }`}
                  >
                    <th className="w-1/3 px-3 py-2 text-left align-top text-xs font-medium text-slate-500">
                      {f.label}
                      {f.pii && (
                        <span className="ml-1 inline-block rounded bg-warn-500 px-1 text-[9px] font-bold text-white">
                          PII
                        </span>
                      )}
                    </th>
                    <td className="px-3 py-2 align-top">
                      {editable ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={editingValue ?? f.value}
                            onChange={(e) => onChangeEdit(f.tag, e.target.value)}
                            className="w-full rounded border border-slate-300 bg-white px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-700"
                          />
                          <Pencil size={12} className="shrink-0 text-slate-400" />
                        </div>
                      ) : (
                        <span className="break-all">{f.value || '—'}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
