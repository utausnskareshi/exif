import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// GitHub Pages 配信時はリポジトリ名がパスに入る (https://<user>.github.io/exif/)
// 環境変数 BASE_PATH で上書き可能。ローカル `npm run dev` では '/' を使う。
const base = process.env.BASE_PATH ?? '/exif/';

export default defineConfig(({ command }) => ({
  base: command === 'serve' ? '/' : base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      injectRegister: 'auto',
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,webmanifest}'],
      },
      includeAssets: [
        'favicon.svg',
        'apple-touch-icon.png',
        'icons/icon-192.png',
        'icons/icon-512.png',
        'icons/maskable-512.png',
      ],
      manifest: {
        name: 'EXIF プライバシーツール',
        short_name: 'EXIF Tool',
        description:
          '写真や動画に埋め込まれた EXIF などのメタデータを、端末内だけで確認・編集・削除できる PWA。SNS 投稿前の位置情報除去に。',
        lang: 'ja',
        dir: 'ltr',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'any',
        start_url: command === 'serve' ? '/' : base,
        scope: command === 'serve' ? '/' : base,
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icons/maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
        share_target: {
          action: command === 'serve' ? '/share-target/' : `${base}share-target/`,
          method: 'POST',
          enctype: 'multipart/form-data',
          params: {
            title: 'title',
            text: 'text',
            url: 'url',
            files: [
              {
                name: 'shared_files',
                accept: ['image/*', 'video/mp4', 'video/quicktime'],
              },
            ],
          },
        },
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  optimizeDeps: {
    exclude: ['mp4box'],
  },
  build: {
    target: 'es2022',
    sourcemap: false,
  },
}));
