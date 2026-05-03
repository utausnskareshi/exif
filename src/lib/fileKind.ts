import type { FileKind } from './types';

export function detectKind(file: File): FileKind {
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();

  if (type === 'image/jpeg' || /\.(jpe?g)$/.test(name)) return 'jpeg';
  if (type === 'image/png' || /\.png$/.test(name)) return 'png';
  if (type === 'image/webp' || /\.webp$/.test(name)) return 'webp';
  if (type === 'image/heic' || type === 'image/heif' || /\.(heic|heif)$/.test(name)) return 'heic';
  if (type === 'image/tiff' || /\.(tiff?|dng)$/.test(name)) return 'tiff';
  if (type === 'image/gif' || /\.gif$/.test(name)) return 'gif';
  if (type === 'video/mp4' || /\.mp4$/.test(name)) return 'mp4';
  if (type === 'video/quicktime' || /\.mov$/.test(name)) return 'mov';
  return 'unknown';
}

export function isImage(kind: FileKind): boolean {
  return ['jpeg', 'png', 'webp', 'heic', 'tiff', 'gif'].includes(kind);
}

export function isVideo(kind: FileKind): boolean {
  return ['mp4', 'mov'].includes(kind);
}

export function isWritableImage(kind: FileKind): boolean {
  // 現状クライアントで安全に書き戻せるのは JPEG のみ
  // PNG / WebP は「メタデータを除いた再エンコード」で対応
  return ['jpeg', 'png', 'webp'].includes(kind);
}
