import type { ExifField } from '../lib/types';

/**
 * 編集前 vs 編集後のフィールド差分を表示。
 */
export default function BeforeAfter({
  before,
  after,
}: {
  before: ExifField[];
  after: ExifField[];
}) {
  const beforeMap = new Map(before.map((f) => [f.tag, f]));
  const afterMap = new Map(after.map((f) => [f.tag, f]));
  const allTags = new Set<string>([...beforeMap.keys(), ...afterMap.keys()]);

  const rows: Array<{
    tag: string;
    label: string;
    beforeVal: string | null;
    afterVal: string | null;
    state: 'removed' | 'added' | 'changed' | 'same';
  }> = [];

  for (const tag of allTags) {
    const b = beforeMap.get(tag);
    const a = afterMap.get(tag);
    const beforeVal = b ? b.value : null;
    const afterVal = a ? a.value : null;
    let state: 'removed' | 'added' | 'changed' | 'same' = 'same';
    if (b && !a) state = 'removed';
    else if (!b && a) state = 'added';
    else if (b && a && b.value !== a.value) state = 'changed';
    if (state === 'same') continue;
    rows.push({
      tag,
      label: b?.label ?? a?.label ?? tag,
      beforeVal,
      afterVal,
      state,
    });
  }

  if (rows.length === 0) {
    return (
      <p className="text-sm text-slate-500">変更はありません。</p>
    );
  }

  rows.sort((x, y) => x.label.localeCompare(y.label, 'ja'));

  return (
    <div className="card overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-xs text-slate-500 dark:bg-slate-800/50">
          <tr>
            <th className="px-3 py-2">項目</th>
            <th className="px-3 py-2">変更前</th>
            <th className="px-3 py-2">変更後</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.tag}
              className="border-t border-slate-100 dark:border-slate-700/50"
            >
              <td className="px-3 py-2 align-top text-xs">{r.label}</td>
              <td
                className={`px-3 py-2 align-top break-all ${
                  r.state === 'removed' || r.state === 'changed'
                    ? 'bg-danger-50 text-danger-700 line-through dark:bg-danger-500/10 dark:text-danger-500'
                    : ''
                }`}
              >
                {r.beforeVal ?? <span className="text-slate-400">—</span>}
              </td>
              <td
                className={`px-3 py-2 align-top break-all ${
                  r.state === 'added' || r.state === 'changed'
                    ? 'bg-safe-50 text-safe-700 dark:bg-safe-500/10 dark:text-safe-500'
                    : ''
                }`}
              >
                {r.afterVal ?? <span className="text-slate-400">—</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
