import { useEffect, useState } from 'react';
import { Wifi, WifiOff } from 'lucide-react';

export default function OfflineIndicator() {
  const [online, setOnline] = useState<boolean>(navigator.onLine);

  useEffect(() => {
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () => {
      window.removeEventListener('online', up);
      window.removeEventListener('offline', down);
    };
  }, []);

  return (
    <span
      className={`chip ${
        online
          ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200'
      }`}
      title={online ? 'オンライン' : 'オフライン (端末内で動作中)'}
    >
      {online ? <Wifi size={12} /> : <WifiOff size={12} />}
      {online ? 'ONLINE' : 'OFFLINE'}
    </span>
  );
}
