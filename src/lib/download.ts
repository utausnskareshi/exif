import JSZip from 'jszip';

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function downloadAsZip(
  files: Array<{ blob: Blob; filename: string }>,
  zipName = 'exif-cleaned.zip',
): Promise<void> {
  const zip = new JSZip();
  for (const f of files) {
    zip.file(f.filename, f.blob);
  }
  const blob = await zip.generateAsync({ type: 'blob' });
  downloadBlob(blob, zipName);
}

/** 元ファイル名にサフィックスを付ける ("photo.jpg" → "photo_clean.jpg") */
export function suffixFilename(name: string, suffix = '_clean'): string {
  const dot = name.lastIndexOf('.');
  if (dot < 0) return name + suffix;
  return name.slice(0, dot) + suffix + name.slice(dot);
}
