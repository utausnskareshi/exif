// @ts-expect-error piexifjs has no types
import piexif from 'piexifjs';
import type { FileKind } from '../types';

/**
 * 編集モード
 *   stripAll      : 全 EXIF 削除 (SNS 投稿用の主要ユースケース)
 *   stripGpsOnly  : GPS のみ削除 (撮影日時/機種は残す)
 *   stripIdentity : 所有者・シリアル番号など個人情報のみ削除
 *   patch         : 任意フィールドの編集 (key: 値)
 */
export type EditMode =
  | { type: 'stripAll' }
  | { type: 'stripGpsOnly' }
  | { type: 'stripIdentity' }
  | { type: 'patch'; updates: Record<string, string> };

/**
 * 画像から EXIF を編集／削除した新しい Blob を返す。
 *
 * - JPEG: piexifjs で安全に編集
 * - PNG/WebP: Canvas で再エンコードしメタデータをすべて落とす (= stripAll 相当)
 *   PNG/WebP の編集 (patch) は未対応
 * - HEIC/その他: 未対応 (Blob をそのまま返し flag を返す)
 */
export async function applyEdit(
  file: File,
  kind: FileKind,
  mode: EditMode,
): Promise<{ blob: Blob; supported: boolean; note?: string }> {
  if (kind === 'jpeg') {
    return { blob: await editJpeg(file, mode), supported: true };
  }
  if (kind === 'png' || kind === 'webp') {
    if (mode.type === 'stripAll' || mode.type === 'stripGpsOnly' || mode.type === 'stripIdentity') {
      return {
        blob: await reencodeImage(file, kind),
        supported: true,
        note: 'PNG/WebP は再エンコードによりメタデータを除去しました',
      };
    }
    return {
      blob: file,
      supported: false,
      note: 'PNG/WebP の個別フィールド編集は未対応です',
    };
  }
  return {
    blob: file,
    supported: false,
    note: `${kind.toUpperCase()} はクライアントでの編集に未対応です`,
  };
}

async function editJpeg(file: File, mode: EditMode): Promise<Blob> {
  const dataUrl = await readAsDataURL(file);
  let exifObj: Record<string, Record<number, unknown>>;
  try {
    exifObj = piexif.load(dataUrl);
  } catch {
    exifObj = { '0th': {}, Exif: {}, GPS: {}, Interop: {}, '1st': {}, thumbnail: null as never };
  }

  if (mode.type === 'stripAll') {
    const stripped = piexif.remove(dataUrl);
    return dataUrlToBlob(stripped);
  }

  if (mode.type === 'stripGpsOnly') {
    exifObj.GPS = {};
  }

  if (mode.type === 'stripIdentity') {
    // 0th IFD の Artist, Copyright, HostComputer
    delete exifObj['0th'][piexif.ImageIFD.Artist];
    delete exifObj['0th'][piexif.ImageIFD.Copyright];
    delete exifObj['0th'][piexif.ImageIFD.HostComputer];
    // ExifIFD のシリアル系
    delete exifObj['Exif'][piexif.ExifIFD.BodySerialNumber];
    delete exifObj['Exif'][piexif.ExifIFD.LensSerialNumber];
    delete exifObj['Exif'][piexif.ExifIFD.CameraOwnerName];
    delete exifObj['Exif'][piexif.ExifIFD.UserComment];
  }

  if (mode.type === 'patch') {
    applyPatch(exifObj, mode.updates);
  }

  const exifBytes = piexif.dump(exifObj);
  const inserted = piexif.insert(exifBytes, dataUrl);
  return dataUrlToBlob(inserted);
}

function applyPatch(exifObj: Record<string, Record<number, unknown>>, updates: Record<string, string>): void {
  // 主要フィールドのみ編集対応 (タグ名 → IFD/番号 解決)
  const mapping: Record<string, { ifd: '0th' | 'Exif' | 'GPS'; key: number; type?: 'ascii' }> = {
    Make: { ifd: '0th', key: piexif.ImageIFD.Make, type: 'ascii' },
    Model: { ifd: '0th', key: piexif.ImageIFD.Model, type: 'ascii' },
    Software: { ifd: '0th', key: piexif.ImageIFD.Software, type: 'ascii' },
    Artist: { ifd: '0th', key: piexif.ImageIFD.Artist, type: 'ascii' },
    Copyright: { ifd: '0th', key: piexif.ImageIFD.Copyright, type: 'ascii' },
    ImageDescription: { ifd: '0th', key: piexif.ImageIFD.ImageDescription, type: 'ascii' },
    DateTimeOriginal: { ifd: 'Exif', key: piexif.ExifIFD.DateTimeOriginal, type: 'ascii' },
    UserComment: { ifd: 'Exif', key: piexif.ExifIFD.UserComment, type: 'ascii' },
  };
  for (const [tag, val] of Object.entries(updates)) {
    const m = mapping[tag];
    if (!m) continue;
    if (val === '') {
      delete exifObj[m.ifd][m.key];
    } else {
      exifObj[m.ifd][m.key] = val;
    }
  }
}

/**
 * Canvas で再エンコード - メタデータをすべて落とす方法。
 */
async function reencodeImage(file: File, kind: FileKind): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context が取れません');
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();
  const mime = kind === 'png' ? 'image/png' : 'image/webp';
  const quality = kind === 'webp' ? 0.95 : undefined;
  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('再エンコード失敗'))),
      mime,
      quality,
    );
  });
}

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [head, data] = dataUrl.split(',');
  const mime = head.match(/:([^;]+);/)?.[1] ?? 'application/octet-stream';
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}
