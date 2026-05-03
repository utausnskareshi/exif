import exifr from 'exifr';
import type { ExifField } from '../types';

/**
 * exifr の出力を表示用の ExifField[] に変換する。
 */
export async function readExif(file: File): Promise<{
  fields: ExifField[];
  raw: Record<string, unknown>;
}> {
  // gps: true で緯度経度を 10 進数に展開、xmp / iptc / icc も読む
  const data = (await exifr.parse(file, {
    tiff: true,
    exif: true,
    gps: true,
    xmp: true,
    iptc: true,
    icc: false,
    jfif: true,
    ihdr: true,
    mergeOutput: true,
    sanitize: true,
    translateValues: true,
  }).catch(() => null)) as Record<string, unknown> | null;

  if (!data || typeof data !== 'object') {
    return { fields: [], raw: {} };
  }

  const fields: ExifField[] = [];
  for (const [tag, value] of Object.entries(data)) {
    if (value === undefined || value === null) continue;
    if (typeof value === 'object' && !(value instanceof Date) && !ArrayBuffer.isView(value)) {
      // ネストしたオブジェクトはスキップ (フラットなものだけ表示)
      if (!Array.isArray(value)) continue;
    }
    const meta = classifyTag(tag);
    fields.push({
      category: meta.category,
      tag,
      label: meta.label,
      value: formatValue(value, tag),
      raw: value,
      pii: meta.pii,
    });
  }

  // カテゴリ順 → ラベル順でソート
  const order = { gps: 0, datetime: 1, camera: 2, settings: 3, identity: 4, other: 5 } as const;
  fields.sort((a, b) => {
    if (order[a.category] !== order[b.category]) return order[a.category] - order[b.category];
    return a.label.localeCompare(b.label, 'ja');
  });

  return { fields, raw: data };
}

interface TagMeta {
  category: ExifField['category'];
  label: string;
  pii: boolean;
}

const TAG_DICT: Record<string, TagMeta> = {
  // GPS
  latitude: { category: 'gps', label: '緯度', pii: true },
  longitude: { category: 'gps', label: '経度', pii: true },
  GPSLatitude: { category: 'gps', label: 'GPS 緯度', pii: true },
  GPSLongitude: { category: 'gps', label: 'GPS 経度', pii: true },
  GPSAltitude: { category: 'gps', label: 'GPS 高度', pii: true },
  GPSAltitudeRef: { category: 'gps', label: 'GPS 高度基準', pii: true },
  GPSLatitudeRef: { category: 'gps', label: 'GPS 緯度方向', pii: true },
  GPSLongitudeRef: { category: 'gps', label: 'GPS 経度方向', pii: true },
  GPSTimeStamp: { category: 'gps', label: 'GPS 時刻', pii: true },
  GPSDateStamp: { category: 'gps', label: 'GPS 日付', pii: true },
  GPSSpeed: { category: 'gps', label: 'GPS 速度', pii: true },
  GPSImgDirection: { category: 'gps', label: 'GPS 撮影方向', pii: true },
  GPSDestBearing: { category: 'gps', label: 'GPS 目的方位', pii: true },
  GPSHPositioningError: { category: 'gps', label: 'GPS 測位誤差', pii: true },

  // 日時
  DateTimeOriginal: { category: 'datetime', label: '撮影日時', pii: false },
  CreateDate: { category: 'datetime', label: '作成日時', pii: false },
  ModifyDate: { category: 'datetime', label: '変更日時', pii: false },
  OffsetTime: { category: 'datetime', label: 'タイムゾーン', pii: false },
  OffsetTimeOriginal: { category: 'datetime', label: '撮影タイムゾーン', pii: false },

  // カメラ
  Make: { category: 'camera', label: 'メーカー', pii: false },
  Model: { category: 'camera', label: '機種', pii: false },
  LensMake: { category: 'camera', label: 'レンズメーカー', pii: false },
  LensModel: { category: 'camera', label: 'レンズ', pii: false },
  Software: { category: 'camera', label: 'ソフトウェア', pii: false },

  // 撮影設定
  FNumber: { category: 'settings', label: '絞り値', pii: false },
  ExposureTime: { category: 'settings', label: 'シャッター速度', pii: false },
  ISO: { category: 'settings', label: 'ISO 感度', pii: false },
  FocalLength: { category: 'settings', label: '焦点距離', pii: false },
  FocalLengthIn35mmFormat: { category: 'settings', label: '35mm 換算焦点距離', pii: false },
  Flash: { category: 'settings', label: 'フラッシュ', pii: false },
  WhiteBalance: { category: 'settings', label: 'ホワイトバランス', pii: false },
  ExposureProgram: { category: 'settings', label: '露出プログラム', pii: false },
  MeteringMode: { category: 'settings', label: '測光モード', pii: false },
  ExposureCompensation: { category: 'settings', label: '露出補正', pii: false },
  ImageWidth: { category: 'settings', label: '画像幅', pii: false },
  ImageHeight: { category: 'settings', label: '画像高さ', pii: false },
  ExifImageWidth: { category: 'settings', label: '画像幅 (EXIF)', pii: false },
  ExifImageHeight: { category: 'settings', label: '画像高さ (EXIF)', pii: false },
  Orientation: { category: 'settings', label: '回転情報', pii: false },

  // 個人情報
  Artist: { category: 'identity', label: '撮影者', pii: true },
  Copyright: { category: 'identity', label: '著作権者', pii: true },
  OwnerName: { category: 'identity', label: '所有者', pii: true },
  CameraOwnerName: { category: 'identity', label: 'カメラ所有者', pii: true },
  HostComputer: { category: 'identity', label: '使用 PC', pii: true },
  BodySerialNumber: { category: 'identity', label: 'ボディシリアル番号', pii: true },
  SerialNumber: { category: 'identity', label: 'シリアル番号', pii: true },
  LensSerialNumber: { category: 'identity', label: 'レンズシリアル番号', pii: true },
  InternalSerialNumber: { category: 'identity', label: '内部シリアル番号', pii: true },
  UserComment: { category: 'identity', label: 'ユーザーコメント', pii: true },
  ImageDescription: { category: 'identity', label: '画像説明', pii: false },
};

function classifyTag(tag: string): TagMeta {
  if (TAG_DICT[tag]) return TAG_DICT[tag];
  if (/^GPS/i.test(tag)) return { category: 'gps', label: tag, pii: true };
  if (/Date|Time/.test(tag)) return { category: 'datetime', label: tag, pii: false };
  if (/Serial|Owner|Artist|Copyright/i.test(tag)) {
    return { category: 'identity', label: tag, pii: true };
  }
  return { category: 'other', label: tag, pii: false };
}

function formatValue(value: unknown, tag?: string): string {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toLocaleString('ja-JP');

  // GPS DMS 配列を度分秒形式で表示 (例: 35° 39' 30.96")
  if (Array.isArray(value) && tag && /^GPS(Latitude|Longitude)$/.test(tag) && value.length >= 3) {
    const [d, m, s] = value.map(Number);
    if (!Number.isNaN(d) && !Number.isNaN(m) && !Number.isNaN(s)) {
      return `${d}° ${m}' ${s.toFixed(2)}"`;
    }
  }

  if (Array.isArray(value)) return value.map((v) => formatValue(v)).join(', ');
  if (typeof value === 'number') {
    return Number.isInteger(value) ? String(value) : value.toFixed(6);
  }
  if (typeof value === 'object') {
    if (ArrayBuffer.isView(value)) return `[binary ${(value as ArrayBufferView).byteLength} B]`;
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}
