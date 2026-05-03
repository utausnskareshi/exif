import { ArrowRight, ShieldCheck, MapPinOff, Lock, Wifi } from 'lucide-react';
import InstallGuide from '../components/InstallGuide';

export default function HomePage({ onStart }: { onStart: () => void }) {
  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h1 className="text-2xl font-bold">EXIF プライバシーツール</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          写真や動画に埋め込まれた EXIF
          メタデータを、端末内だけで確認・編集・削除できる PWA
          (Progressive Web App) です。SNS 投稿前の
          <strong>位置情報の除去</strong>に。
        </p>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <Feature
          icon={<Lock size={18} />}
          title="完全に端末内で処理"
          desc="サーバーに一切送信しません。"
        />
        <Feature
          icon={<Wifi size={18} />}
          title="オフラインで動作"
          desc="ホーム画面追加後はネット不要。"
        />
        <Feature
          icon={<ShieldCheck size={18} />}
          title="一目で安全判定"
          desc="取り込んだ瞬間に「安全/要注意/危険」を表示。"
        />
        <Feature
          icon={<MapPinOff size={18} />}
          title="位置情報の一括削除"
          desc="複数ファイルをまとめて処理。"
        />
      </section>

      <section className="flex justify-center">
        <button type="button" className="btn btn-primary px-6 py-3 text-base" onClick={onStart}>
          使ってみる
          <ArrowRight size={18} />
        </button>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">ホーム画面に追加する</h2>
        <InstallGuide />
      </section>

      <section className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-900 dark:border-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-100">
        <p className="font-semibold">プライバシーについて</p>
        <p className="mt-1">
          このアプリは <strong>すべての処理をあなたの端末内</strong> で行います。
          選択した写真や動画は、当アプリのサーバーや第三者に送信されません。
          コードは MIT ライセンスで公開されており、誰でも検証できます。
        </p>
      </section>
    </div>
  );
}

function Feature({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="card p-3">
      <div className="mb-1 flex items-center gap-2 font-semibold">{icon}{title}</div>
      <p className="text-xs text-slate-600 dark:text-slate-300">{desc}</p>
    </div>
  );
}
