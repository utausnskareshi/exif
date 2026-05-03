import { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

export default function UpdatePrompt() {
  const [show, setShow] = useState(false);

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onNeedRefresh: () => setShow(true),
    onRegisteredSW(swUrl) {
      // eslint-disable-next-line no-console
      console.log('[PWA] Service Worker registered:', swUrl);
    },
  });

  useEffect(() => {
    if (!needRefresh) setShow(false);
  }, [needRefresh]);

  if (!show) return null;

  return (
    <div className="fixed inset-x-0 bottom-20 z-30 mx-auto max-w-sm px-4">
      <div className="card flex items-center justify-between gap-3 p-3 text-sm">
        <span>新しいバージョンが利用可能です。</span>
        <div className="flex gap-2">
          <button
            type="button"
            className="btn btn-secondary !py-1 !text-xs"
            onClick={() => {
              setNeedRefresh(false);
              setShow(false);
            }}
          >
            後で
          </button>
          <button
            type="button"
            className="btn btn-primary !py-1 !text-xs"
            onClick={() => updateServiceWorker(true)}
          >
            更新
          </button>
        </div>
      </div>
    </div>
  );
}
