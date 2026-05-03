/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

declare const self: ServiceWorkerGlobalScope;

// Workbox: precache 注入ポイント
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

self.skipWaiting();

// OpenStreetMap タイル (オンライン時のみ取得・キャッシュ)
registerRoute(
  ({ url }) => /^https:\/\/[abc]\.tile\.openstreetmap\.org\//.test(url.href),
  new CacheFirst({
    cacheName: 'osm-tiles',
    plugins: [new ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 7 })],
  }),
);

/**
 * Web Share Target (POST) ハンドラ。
 *
 * manifest の share_target.action = `${base}share-target/` に POST が来るので、
 * SW で受け取り、ファイルを一時保存してからアプリ画面にリダイレクト。
 * アプリ起動後に postMessage でファイルを渡す。
 */
let pendingFiles: File[] = [];

self.addEventListener('fetch', (event: FetchEvent) => {
  const url = new URL(event.request.url);
  if (event.request.method === 'POST' && url.pathname.endsWith('/share-target/')) {
    event.respondWith(handleShare(event.request, url));
  }
});

async function handleShare(request: Request, url: URL): Promise<Response> {
  try {
    const formData = await request.formData();
    const files = formData.getAll('shared_files').filter((v): v is File => v instanceof File);
    pendingFiles = files;
  } catch {
    pendingFiles = [];
  }
  // 元のスコープのトップへリダイレクト → アプリ起動 → postMessage で受け渡し
  const base = url.pathname.replace(/share-target\/$/, '');
  return Response.redirect(base + '?shared=1', 303);
}

self.addEventListener('message', (event: ExtendableMessageEvent) => {
  if (event.data?.type === 'request-shared-files') {
    if (pendingFiles.length === 0) {
      event.source?.postMessage({ type: 'shared-files', files: [] });
      return;
    }
    event.source?.postMessage({ type: 'shared-files', files: pendingFiles });
    pendingFiles = [];
  }
});

self.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(self.clients.claim());
});
