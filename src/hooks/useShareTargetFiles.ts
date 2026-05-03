import { useEffect, useState } from 'react';

/**
 * Web Share Target API で受け取ったファイルを取得する。
 *
 * Service Worker 側 (src/sw.ts) で POST /share-target/ を捕捉して
 * pendingFiles に保存し、URL に ?shared=1 を付けてアプリへリダイレクトする。
 * アプリ起動後、SW に「ファイルを送って」と postMessage する。
 */
export function useShareTargetFiles(): File[] | null {
  const [files, setFiles] = useState<File[] | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const isShared = params.get('shared') === '1';

    const onMessage = (e: MessageEvent) => {
      if (e.data?.type === 'shared-files' && Array.isArray(e.data.files)) {
        if (e.data.files.length > 0) setFiles(e.data.files as File[]);
      }
    };
    navigator.serviceWorker?.addEventListener('message', onMessage);

    if (isShared) {
      navigator.serviceWorker?.ready.then((reg) => {
        reg.active?.postMessage({ type: 'request-shared-files' });
      });
      // クエリパラメータを除去 (ブラウザバックを邪魔しないように)
      const cleanUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, '', cleanUrl);
    }

    return () => navigator.serviceWorker?.removeEventListener('message', onMessage);
  }, []);

  return files;
}
