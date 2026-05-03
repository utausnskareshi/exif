// 共通型定義

export type SafetyLevel = 'safe' | 'warn' | 'danger' | 'unknown';

export type FileKind = 'jpeg' | 'png' | 'webp' | 'heic' | 'tiff' | 'gif' | 'mp4' | 'mov' | 'unknown';

export interface ExifField {
  /** 表示用カテゴリ */
  category: 'gps' | 'datetime' | 'camera' | 'settings' | 'identity' | 'other';
  /** EXIF タグ名 (例: 'GPSLatitude') */
  tag: string;
  /** ユーザー向け表示名 (日本語) */
  label: string;
  /** 表示値 (人間可読) */
  value: string;
  /** 元の生値 (編集や書き戻し用) */
  raw: unknown;
  /** PII (個人情報) として扱うべきか */
  pii: boolean;
}

export interface SafetyReport {
  level: SafetyLevel;
  reasons: string[];
  hasGps: boolean;
  hasSerial: boolean;
  hasOwner: boolean;
  hasOriginalDate: boolean;
  hasThumbnail: boolean;
  /** GPS 座標 (地図表示用) */
  gps?: { lat: number; lng: number };
}

export interface ProcessedFile {
  id: string;
  file: File;
  kind: FileKind;
  /** プレビュー用 ObjectURL */
  previewUrl?: string;
  /** 解析済みフィールド */
  fields: ExifField[];
  /** 生 EXIF (デバッグ・JSON エクスポート用) */
  rawExif?: Record<string, unknown>;
  /** 安全性評価 */
  safety: SafetyReport;
  /** 処理状態 */
  status: 'analyzing' | 'ready' | 'error';
  error?: string;
}
