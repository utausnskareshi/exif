# EXIF プライバシーツール

写真や動画に埋め込まれた **EXIF / メタデータ** を端末内だけで確認・編集・削除できる
PWA (Progressive Web App) です。SNS 投稿前に **位置情報を除去** する用途を主眼にしています。

- 🛡️ **完全クライアントサイド** — 選択したファイルは外部サーバーに一切送信しません
- 📡 **オフライン動作** — ホーム画面追加後はネット接続不要
- 👀 **一目で安全判定** — 取り込んだ瞬間に「**安全 / 要注意 / 危険**」を表示し、画面のふちも色で警告
- 📍 **位置情報の除去** — ワンタップで GPS のみ削除 / 全削除 / 個人情報のみ削除を選択
- 🗂️ **バッチ処理 + ZIP 一括ダウンロード**
- 🌓 **ダークモード**
- 📤 **Web Share Target** — Android なら写真アプリの「共有」から直接受け取り
- 🗺️ **オフライン地図対応** — オンライン時のみ OpenStreetMap で位置を可視化、オフライン時は警告表示

## 公開 URL

GitHub Pages で配信:

```
https://utausnskareshi.github.io/exif/
```

スマートフォンの Safari (iPhone) または Chrome (Android) でアクセスし、
画面に表示される手順に従って **ホーム画面に追加** してください。

## 対応形式

| 形式               | 読取 | 削除/編集               |
| ------------------ | ---- | ----------------------- |
| JPEG (.jpg/.jpeg) | ○    | ○ (完全)                |
| PNG                | ○    | ○ (再エンコードで除去)  |
| WebP               | ○    | ○ (再エンコードで除去)  |
| HEIC/HEIF          | △    | × (読取のみ)            |
| TIFF/DNG           | ○    | × (読取のみ)            |
| MP4                | △    | ○ (GPS atom のみ 0 埋め) |
| MOV (QuickTime)    | △    | ○ (GPS atom のみ 0 埋め) |

> 動画はクライアント実装の制約上、コンテナ内の GPS atom を 0 埋めする簡易処理のみ対応しています。再エンコードは行いません。

## 安全性の判定基準

| レベル | 条件 |
| ------ | ---- |
| 🛡️ **安全 (緑)** | 位置情報・シリアル番号・所有者名・著作権者名のいずれも含まれない |
| ⚠️ **要注意 (黄)** | 機材のシリアル番号 / 所有者名 / 著作権者名 / 編集前サムネイルが含まれる |
| 🚨 **危険 (赤)** | 位置情報 (GPS) が含まれる |

画面上部のバナー、画面のふちの色、各ファイルカードのバッジ、すべてに反映されます。

## 開発

```bash
# Node 18+ 推奨
npm install
npm run dev          # ローカル開発 (http://localhost:5173/)
npm run build        # ビルド (dist/)
npm run preview      # ビルド成果物を確認

# アイコン再生成 (依存ゼロ・純 Node)
npm run gen:icons
```

## ディレクトリ構成

```
exif/
├── public/
│   ├── icons/                # PWA 用アイコン (生成物)
│   ├── apple-touch-icon.png  # iOS 用 (生成物)
│   └── favicon.svg
├── scripts/
│   └── gen-icons.mjs         # アイコン生成 (依存ゼロ)
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── sw.ts                 # Service Worker (Share Target POST 受信含む)
│   ├── pages/                # Home / Editor / About
│   ├── components/           # SafetyBadge, FileCard, MapPreview, ...
│   ├── hooks/                # useDarkMode, useShareTargetFiles
│   └── lib/
│       ├── exif/             # 読取 (read), 編集/削除 (write), 安全性判定 (safety)
│       ├── video/            # MP4/MOV GPS atom 0 埋め
│       ├── download.ts
│       ├── fileKind.ts
│       └── types.ts
├── index.html
├── vite.config.ts
├── tailwind.config.js
└── .github/workflows/deploy.yml
```

## 主要ライブラリ

- [exifr](https://github.com/MikeKovarik/exifr) — EXIF 読取
- [piexifjs](https://github.com/hMatoba/piexifjs) — JPEG EXIF 読み書き
- [Workbox](https://developer.chrome.com/docs/workbox/) (vite-plugin-pwa 経由) — Service Worker
- [JSZip](https://stuk.github.io/jszip/) — 一括ダウンロード ZIP 生成
- [Leaflet](https://leafletjs.com/) — GPS の地図表示
- [lucide-react](https://lucide.dev/) — アイコン

## 既知の制限

- HEIC は iOS Safari 上で `<input type="file">` 経由で取得すると JPEG として渡されることが多く、
  この場合は通常通り編集可能です。HEIC のまま編集して書き戻すことはクライアントだけでは難しく、
  本アプリは「読取のみ」または「JPEG として保存」の挙動になります。
- 動画 (MP4/MOV) は GPS atom の 0 埋めのみ対応。完全な再多重化は行わないため、
  プレイヤーによっては警告が出る可能性があります。
- 大容量ファイル (数百 MB の動画など) はメモリ制約でブラウザがクラッシュする可能性があります。
- iOS では PWA からの Web Share Target (POST) は未対応です (Android 対応)。
  iOS では「ファイルから選択」または写真アプリで「コピー → アプリで開く」などをご利用ください。

## ライセンス

[MIT](./LICENSE)
