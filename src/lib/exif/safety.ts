import type { ExifField, SafetyLevel, SafetyReport } from '../types';

/**
 * EXIF フィールドから安全性を総合判定する。
 *
 * 判定基準:
 *   danger : GPS 位置情報が含まれる (SNS で住所が割れる最大の脅威)
 *   warn   : シリアル番号 / 所有者名 / 著作権者名など個人特定につながる情報
 *   safe   : 上記なし (撮影日時や機種名のみ)
 */
export function evaluateSafety(fields: ExifField[]): SafetyReport {
  const reasons: string[] = [];
  let hasGps = false;
  let hasSerial = false;
  let hasOwner = false;
  let hasOriginalDate = false;
  let hasThumbnail = false;
  let gps: { lat: number; lng: number } | undefined;

  for (const f of fields) {
    if (f.category === 'gps') {
      hasGps = true;
    }
    if (
      /serial/i.test(f.tag) &&
      f.raw !== undefined &&
      f.raw !== null &&
      String(f.raw).trim() !== ''
    ) {
      hasSerial = true;
    }
    if (
      /^(Owner|CameraOwnerName|Artist|Copyright|HostComputer)$/i.test(f.tag) &&
      f.raw !== undefined &&
      f.raw !== null &&
      String(f.raw).trim() !== ''
    ) {
      hasOwner = true;
    }
    if (/DateTimeOriginal/i.test(f.tag)) {
      hasOriginalDate = true;
    }
    // 「埋め込みサムネイル画像」のみを検出する。
    // ThumbnailHeight / ThumbnailWidth / ThumbnailOffset などのメタデータ寸法ではなく、
    // 実際に画像データ (binary または ThumbnailOffset+Length が両方 >0) があるときのみ警告。
    if (f.tag === 'thumbnail' && f.raw) {
      hasThumbnail = true;
    }
    if (f.tag === 'ThumbnailLength' && Number(f.raw) > 0) {
      hasThumbnail = true;
    }
  }

  // GPS 座標を取り出す (地図表示用)
  // exifr は decimal (latitude/longitude) と DMS 配列 (GPSLatitude/GPSLongitude) の両方を返す。
  // 1) 優先: decimal
  // 2) フォールバック: DMS [deg, min, sec] と Ref ('S'/'W' で符号反転)
  const latDeg = fields.find((f) => f.tag === 'latitude');
  const lngDeg = fields.find((f) => f.tag === 'longitude');
  if (latDeg && lngDeg && typeof latDeg.raw === 'number' && typeof lngDeg.raw === 'number') {
    gps = { lat: latDeg.raw, lng: lngDeg.raw };
  } else {
    const latDms = fields.find((f) => f.tag === 'GPSLatitude');
    const lngDms = fields.find((f) => f.tag === 'GPSLongitude');
    const latRef = fields.find((f) => f.tag === 'GPSLatitudeRef');
    const lngRef = fields.find((f) => f.tag === 'GPSLongitudeRef');
    const lat = dmsToDecimal(latDms?.raw, latRef?.raw);
    const lng = dmsToDecimal(lngDms?.raw, lngRef?.raw);
    if (lat !== null && lng !== null) gps = { lat, lng };
  }

  if (hasGps) reasons.push('位置情報 (GPS) が含まれています');
  if (hasSerial) reasons.push('機材のシリアル番号が含まれています');
  if (hasOwner) reasons.push('所有者・撮影者名が含まれています');
  if (hasThumbnail) reasons.push('編集前のサムネイル画像が埋め込まれています');

  let level: SafetyLevel;
  if (hasGps) level = 'danger';
  else if (hasSerial || hasOwner || hasThumbnail) level = 'warn';
  else level = 'safe';

  if (level === 'safe') {
    reasons.push('プライバシーに関わる情報は検出されませんでした');
  }

  return {
    level,
    reasons,
    hasGps,
    hasSerial,
    hasOwner,
    hasOriginalDate,
    hasThumbnail,
    gps,
  };
}

export function summarizeSafety(reports: SafetyReport[]): SafetyReport {
  if (reports.length === 0) {
    return {
      level: 'unknown',
      reasons: [],
      hasGps: false,
      hasSerial: false,
      hasOwner: false,
      hasOriginalDate: false,
      hasThumbnail: false,
    };
  }
  const hasGps = reports.some((r) => r.hasGps);
  const hasSerial = reports.some((r) => r.hasSerial);
  const hasOwner = reports.some((r) => r.hasOwner);
  const hasThumbnail = reports.some((r) => r.hasThumbnail);
  const hasOriginalDate = reports.some((r) => r.hasOriginalDate);

  const dangerCount = reports.filter((r) => r.level === 'danger').length;
  const warnCount = reports.filter((r) => r.level === 'warn').length;
  const safeCount = reports.filter((r) => r.level === 'safe').length;

  let level: SafetyLevel = 'safe';
  if (dangerCount > 0) level = 'danger';
  else if (warnCount > 0) level = 'warn';

  const reasons: string[] = [];
  if (dangerCount > 0) reasons.push(`${dangerCount} 件に位置情報あり`);
  if (warnCount > 0) reasons.push(`${warnCount} 件に個人特定情報あり`);
  if (safeCount > 0) reasons.push(`${safeCount} 件は安全`);

  return {
    level,
    reasons,
    hasGps,
    hasSerial,
    hasOwner,
    hasOriginalDate,
    hasThumbnail,
  };
}

function dmsToDecimal(dms: unknown, ref: unknown): number | null {
  if (!Array.isArray(dms) || dms.length < 3) return null;
  const [d, m, s] = dms.map(Number);
  if (Number.isNaN(d) || Number.isNaN(m) || Number.isNaN(s)) return null;
  let dec = Math.abs(d) + m / 60 + s / 3600;
  const r = typeof ref === 'string' ? ref.toUpperCase() : '';
  if (r === 'S' || r === 'W') dec = -dec;
  return dec;
}

export const SAFETY_LABEL: Record<SafetyLevel, string> = {
  safe: '安全',
  warn: '要注意',
  danger: '危険',
  unknown: '未解析',
};

export const SAFETY_DESC: Record<SafetyLevel, string> = {
  safe: 'プライバシーに関わる情報は見つかりませんでした。SNS への投稿に問題ありません。',
  warn: '個人特定につながる可能性のある情報が含まれています。',
  danger: '位置情報 (GPS) が含まれています。SNS に投稿する前に削除を推奨します。',
  unknown: '解析中です。',
};
