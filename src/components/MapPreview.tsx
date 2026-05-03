import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

/**
 * GPS 座標を OpenStreetMap で表示。
 * オフライン時はタイル取得不可なので警告を出す。
 */
export default function MapPreview({ lat, lng }: { lat: number; lng: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [online, setOnline] = useState(navigator.onLine);

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

  useEffect(() => {
    if (!ref.current) return;
    const map = L.map(ref.current, {
      center: [lat, lng],
      zoom: 15,
      attributionControl: true,
      zoomControl: true,
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap',
    }).addTo(map);
    L.marker([lat, lng]).addTo(map);
    return () => {
      map.remove();
    };
  }, [lat, lng]);

  return (
    <div className="space-y-2">
      <div className="rounded-lg bg-amber-50 p-2 text-xs text-amber-900 dark:bg-amber-900/30 dark:text-amber-100">
        ⚠️ この場所がインターネット上に共有される可能性があります。SNS 投稿前に削除を推奨します。
      </div>
      {!online && (
        <div className="rounded-lg bg-slate-100 p-2 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          オフラインのため地図タイルを表示できません (座標は読み取り済みです)。
        </div>
      )}
      <div ref={ref} className="h-56 w-full" />
      <p className="text-xs text-slate-500">
        緯度: {lat.toFixed(6)} / 経度: {lng.toFixed(6)}
      </p>
    </div>
  );
}
