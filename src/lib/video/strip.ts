/**
 * MP4 / MOV から GPS atom を除去する簡易実装。
 *
 * クライアントだけで動画メタデータを安全に編集するのは難しいため、
 * 本実装は ISOBMFF コンテナを線形に走査し、以下を 0 埋めする最小限の対応に留める:
 *   - moov/udta/©xyz   : Apple QuickTime 形式の GPS 座標
 *   - moov/meta/keys   配下の "com.apple.quicktime.location.ISO6709"
 *
 * 完全な再多重化は行わないため、プレイヤーによっては警告が出る可能性がある。
 * 「位置情報を抹消する」目的としては十分だが、保証はしない。
 */
export async function stripVideoLocation(file: File): Promise<{
  blob: Blob;
  removedAtoms: string[];
  note: string;
}> {
  const buf = await file.arrayBuffer();
  const view = new DataView(buf);
  const bytes = new Uint8Array(buf);
  const removed: string[] = [];

  // ISOBMFF: 連続する [size:4][type:4][...payload] を走査
  function walk(start: number, end: number, path: string): void {
    let p = start;
    while (p + 8 <= end) {
      const size = view.getUint32(p);
      const type = String.fromCharCode(bytes[p + 4], bytes[p + 5], bytes[p + 6], bytes[p + 7]);
      let boxStart = p + 8;
      let boxEnd = p + size;
      if (size === 1) {
        // largesize
        const high = view.getUint32(p + 8);
        const low = view.getUint32(p + 12);
        boxEnd = p + high * 0x100000000 + low;
        boxStart = p + 16;
      } else if (size === 0) {
        boxEnd = end;
      }
      if (boxEnd > end || boxEnd <= p) break;

      const here = `${path}/${type}`;

      // 子コンテナを再帰的に走査
      if (['moov', 'udta', 'meta', 'trak', 'mdia', 'minf', 'stbl', 'ilst'].includes(type)) {
        // meta は version+flags が先頭 4byte (moov/meta のみ)
        const childStart = type === 'meta' ? boxStart + 4 : boxStart;
        walk(childStart, boxEnd, here);
      }

      // GPS 関連 atom を 0 埋め (free atom 化はしないが、内容は破壊)
      const isGpsAtom =
        type === '©xyz' ||
        type === 'xyz ' ||
        /location/i.test(type) ||
        /gps/i.test(type);
      if (isGpsAtom) {
        for (let i = boxStart; i < boxEnd; i++) bytes[i] = 0;
        removed.push(here);
      }

      // meta/keys/ilst/data 内の文字列キーで GPS を含むもの
      if (type === 'data' && path.includes('ilst')) {
        const text = new TextDecoder('utf-8', { fatal: false }).decode(
          bytes.subarray(boxStart, boxEnd),
        );
        if (/location|gps|iso6709/i.test(text)) {
          for (let i = boxStart; i < boxEnd; i++) bytes[i] = 0;
          removed.push(here);
        }
      }

      p = boxEnd;
    }
  }

  walk(0, bytes.length, '');

  return {
    blob: new Blob([bytes], { type: file.type || 'video/mp4' }),
    removedAtoms: removed,
    note:
      removed.length === 0
        ? 'GPS atom は検出されませんでした (元のファイルをそのまま返します)'
        : `${removed.length} 個の GPS atom を 0 埋めしました`,
  };
}
