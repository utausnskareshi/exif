// PWA 用アイコンを依存ゼロで生成する。
// - 角丸の濃紺背景 (#0f172a)
// - 中央に EXIF 風の緑の円 (#10b981)
// - 斜めに走る赤い禁止線 (#ef4444)
// 完全な絵ではないが「プライバシー保護」アプリのプレースホルダとして十分。
//
// 出力:
//   public/icons/icon-192.png        (Android)
//   public/icons/icon-512.png        (Android)
//   public/icons/maskable-512.png    (Android maskable)
//   public/apple-touch-icon.png      (iOS, 180x180)

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// ---------- 描画 ----------
function makeCanvas(w, h) {
  return new Uint8Array(w * h * 4);
}
function setPixel(buf, w, x, y, r, g, b, a) {
  const i = (y * w + x) * 4;
  // alpha blend over existing
  const aa = a / 255;
  const ba = buf[i + 3] / 255;
  const outA = aa + ba * (1 - aa);
  if (outA === 0) return;
  buf[i] = Math.round((r * aa + buf[i] * ba * (1 - aa)) / outA);
  buf[i + 1] = Math.round((g * aa + buf[i + 1] * ba * (1 - aa)) / outA);
  buf[i + 2] = Math.round((b * aa + buf[i + 2] * ba * (1 - aa)) / outA);
  buf[i + 3] = Math.round(outA * 255);
}

function drawRoundedRect(buf, w, h, x0, y0, x1, y1, r, color) {
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      // 角の外側を判定
      const corners = [
        [x0 + r, y0 + r],
        [x1 - r - 1, y0 + r],
        [x0 + r, y1 - r - 1],
        [x1 - r - 1, y1 - r - 1],
      ];
      let inside = true;
      if (x < x0 + r && y < y0 + r) {
        const [cx, cy] = corners[0];
        if ((x - cx) ** 2 + (y - cy) ** 2 > r * r) inside = false;
      } else if (x >= x1 - r && y < y0 + r) {
        const [cx, cy] = corners[1];
        if ((x - cx) ** 2 + (y - cy) ** 2 > r * r) inside = false;
      } else if (x < x0 + r && y >= y1 - r) {
        const [cx, cy] = corners[2];
        if ((x - cx) ** 2 + (y - cy) ** 2 > r * r) inside = false;
      } else if (x >= x1 - r && y >= y1 - r) {
        const [cx, cy] = corners[3];
        if ((x - cx) ** 2 + (y - cy) ** 2 > r * r) inside = false;
      }
      if (inside) setPixel(buf, w, x, y, color[0], color[1], color[2], color[3]);
    }
  }
}

function drawCircle(buf, w, h, cx, cy, r, thickness, color) {
  const r2outer = r * r;
  const r2inner = (r - thickness) ** 2;
  const x0 = Math.max(0, Math.floor(cx - r - 1));
  const x1 = Math.min(w, Math.ceil(cx + r + 1));
  const y0 = Math.max(0, Math.floor(cy - r - 1));
  const y1 = Math.min(h, Math.ceil(cy + r + 1));
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const d2 = (x - cx) ** 2 + (y - cy) ** 2;
      if (d2 <= r2outer && d2 >= r2inner) {
        // アンチエイリアス相当: 縁に近いほど薄く
        const edge = Math.min(Math.sqrt(r2outer) - Math.sqrt(d2), Math.sqrt(d2) - Math.sqrt(r2inner));
        const a = Math.min(1, Math.max(0, edge)) * (color[3] / 255);
        setPixel(buf, w, x, y, color[0], color[1], color[2], Math.round(a * 255));
      }
    }
  }
}

function drawLine(buf, w, h, x0, y0, x1, y1, thickness, color) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy);
  const ux = dx / len;
  const uy = dy / len;
  // 法線
  const nx = -uy;
  const ny = ux;
  for (let t = 0; t <= len; t++) {
    const px = x0 + ux * t;
    const py = y0 + uy * t;
    for (let s = -thickness / 2; s <= thickness / 2; s += 0.5) {
      const x = Math.round(px + nx * s);
      const y = Math.round(py + ny * s);
      if (x >= 0 && x < w && y >= 0 && y < h) {
        setPixel(buf, w, x, y, color[0], color[1], color[2], color[3]);
      }
    }
  }
}

function renderIcon(size, { maskable = false } = {}) {
  const buf = makeCanvas(size, size);

  const bg = [15, 23, 42, 255]; // slate-900
  const green = [16, 185, 129, 255]; // emerald-500
  const red = [239, 68, 68, 255];

  if (maskable) {
    // maskable は端まで塗る
    drawRoundedRect(buf, size, size, 0, 0, size, size, 0, bg);
  } else {
    const r = Math.floor(size * 0.22);
    drawRoundedRect(buf, size, size, 0, 0, size, size, r, bg);
  }

  const cx = size / 2;
  const cy = size / 2;
  // 内側 safe zone (maskable の場合は中央 80% に収める)
  const safe = maskable ? size * 0.4 : size * 0.42;
  const ringThickness = Math.max(2, Math.round(size * 0.06));
  drawCircle(buf, size, size, cx, cy, safe, ringThickness, green);
  // 中央のレンズ点
  drawCircle(buf, size, size, cx, cy, safe * 0.45, ringThickness, green);
  // 禁止線
  const lineLen = safe * 1.4;
  const lineThick = Math.max(3, Math.round(size * 0.08));
  drawLine(
    buf,
    size,
    size,
    cx - lineLen / Math.SQRT2,
    cy - lineLen / Math.SQRT2,
    cx + lineLen / Math.SQRT2,
    cy + lineLen / Math.SQRT2,
    lineThick,
    red,
  );

  return buf;
}

// ---------- PNG エンコード ----------
function crc32(buf) {
  let c;
  const table = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}
function encodePng(width, height, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8); // bit depth
  ihdr.writeUInt8(6, 9); // color RGBA
  ihdr.writeUInt8(0, 10);
  ihdr.writeUInt8(0, 11);
  ihdr.writeUInt8(0, 12);
  const stride = width * 4;
  const raw = Buffer.alloc(height * (stride + 1));
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0; // filter: none
    Buffer.from(rgba.buffer, rgba.byteOffset + y * stride, stride).copy(raw, y * (stride + 1) + 1);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

function ensureDir(p) {
  mkdirSync(p, { recursive: true });
}
function write(name, size, opts) {
  const px = renderIcon(size, opts);
  const png = encodePng(size, size, px);
  const out = resolve(ROOT, name);
  ensureDir(dirname(out));
  writeFileSync(out, png);
  console.log('wrote', out, png.length, 'bytes');
}

write('public/icons/icon-192.png', 192);
write('public/icons/icon-512.png', 512);
write('public/icons/maskable-512.png', 512, { maskable: true });
write('public/apple-touch-icon.png', 180);
