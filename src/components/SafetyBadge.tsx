import { AlertTriangle, CheckCircle2, ShieldAlert, Loader2 } from 'lucide-react';
import type { SafetyLevel } from '../lib/types';
import { SAFETY_LABEL } from '../lib/exif/safety';

const STYLES: Record<SafetyLevel, string> = {
  safe: 'bg-safe-50 text-safe-700 ring-safe-500/40 dark:bg-safe-500/10 dark:text-safe-500',
  warn: 'bg-warn-50 text-warn-700 ring-warn-500/40 dark:bg-warn-500/10 dark:text-warn-500',
  danger:
    'bg-danger-50 text-danger-700 ring-danger-500/40 dark:bg-danger-500/10 dark:text-danger-500',
  unknown: 'bg-slate-100 text-slate-600 ring-slate-300 dark:bg-slate-800 dark:text-slate-300',
};

export default function SafetyBadge({
  level,
  size = 'md',
}: {
  level: SafetyLevel;
  size?: 'sm' | 'md' | 'lg';
}) {
  const Icon =
    level === 'safe'
      ? CheckCircle2
      : level === 'warn'
        ? AlertTriangle
        : level === 'danger'
          ? ShieldAlert
          : Loader2;

  const sizeClass =
    size === 'lg'
      ? 'px-3 py-1.5 text-sm'
      : size === 'sm'
        ? 'px-1.5 py-0.5 text-[10px]'
        : 'px-2 py-1 text-xs';
  const iconSize = size === 'lg' ? 16 : size === 'sm' ? 10 : 12;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-bold ring-1 ${STYLES[level]} ${sizeClass}`}
    >
      <Icon size={iconSize} className={level === 'unknown' ? 'animate-spin' : ''} />
      {SAFETY_LABEL[level]}
    </span>
  );
}
