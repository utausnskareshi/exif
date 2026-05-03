import { AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
import type { SafetyReport, SafetyLevel } from '../lib/types';
import { SAFETY_DESC, SAFETY_LABEL } from '../lib/exif/safety';

/**
 * 画面上部に大きく表示する「一目で安全/危険がわかる」バナー。
 * 加えて App ルートでふちの色も変える (frame-* クラス)。
 */
export default function SafetyBanner({
  summary,
  count,
}: {
  summary: SafetyReport;
  count: number;
}) {
  if (count === 0) return null;

  const level: SafetyLevel = summary.level;
  const Icon =
    level === 'safe' ? CheckCircle2 : level === 'warn' ? AlertTriangle : ShieldAlert;

  const containerClass =
    level === 'safe'
      ? 'border-safe-500 bg-safe-50 text-safe-700 dark:bg-safe-500/10 dark:text-safe-500'
      : level === 'warn'
        ? 'border-warn-500 bg-warn-50 text-warn-700 dark:bg-warn-500/10 dark:text-warn-500'
        : level === 'danger'
          ? 'border-danger-500 bg-danger-50 text-danger-700 dark:bg-danger-500/10 dark:text-danger-500'
          : 'border-slate-300 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300';

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-start gap-3 rounded-xl border-2 p-4 ${containerClass}`}
    >
      <Icon size={28} className="mt-0.5 shrink-0" />
      <div className="flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold">{SAFETY_LABEL[level]}</span>
          <span className="text-xs opacity-80">({count} 件のファイル)</span>
        </div>
        <p className="mt-0.5 text-sm">{SAFETY_DESC[level]}</p>
        {summary.reasons.length > 0 && (
          <ul className="mt-1 text-xs opacity-90">
            {summary.reasons.map((r) => (
              <li key={r}>・{r}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
