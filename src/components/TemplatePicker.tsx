import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { EditMode } from '../lib/exif/write';

const KEY = 'exif-tool:templates';

export interface Template {
  id: string;
  name: string;
  mode: EditMode;
}

const DEFAULTS: Template[] = [
  { id: 'sns', name: 'SNS 投稿用 (位置情報のみ削除)', mode: { type: 'stripGpsOnly' } },
  { id: 'all', name: '完全削除 (すべてのメタデータ)', mode: { type: 'stripAll' } },
  { id: 'identity', name: '個人情報のみ削除 (シリアル番号など)', mode: { type: 'stripIdentity' } },
];

export function loadTemplates(): Template[] {
  try {
    const json = localStorage.getItem(KEY);
    if (!json) return DEFAULTS;
    const arr = JSON.parse(json) as Template[];
    return arr.length ? arr : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

export function saveTemplates(t: Template[]): void {
  localStorage.setItem(KEY, JSON.stringify(t));
}

export default function TemplatePicker({
  value,
  onChange,
}: {
  value: Template;
  onChange: (t: Template) => void;
}) {
  const [templates] = useState<Template[]>(loadTemplates());
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        className="btn btn-secondary !py-1.5 !text-xs"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
      >
        テンプレ: {value.name}
        <ChevronDown size={12} />
      </button>
      {open && (
        <ul
          role="listbox"
          className="absolute z-10 mt-1 max-h-64 w-72 overflow-auto rounded-lg border border-slate-200 bg-white p-1 shadow-lg dark:border-slate-700 dark:bg-slate-800"
        >
          {templates.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                className={`w-full rounded px-2 py-1.5 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 ${
                  t.id === value.id ? 'bg-slate-100 dark:bg-slate-700' : ''
                }`}
                onClick={() => {
                  onChange(t);
                  setOpen(false);
                }}
              >
                {t.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
