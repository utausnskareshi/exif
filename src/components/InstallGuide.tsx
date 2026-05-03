import { Smartphone, Share, Plus, MoreVertical } from 'lucide-react';

export default function InstallGuide() {
  return (
    <div className="space-y-4">
      <Section
        title="iPhone (Safari)"
        icon={<Smartphone size={20} />}
        steps={[
          <>
            Safari でこのページを開きます (Chrome アプリでは PWA 化できません)。
          </>,
          <>
            画面下中央の <Inline icon={<Share size={14} />}>共有</Inline> ボタンをタップ。
          </>,
          <>
            メニューを下にスクロールし「
            <strong>ホーム画面に追加</strong>」を選択。
          </>,
          <>右上の「追加」をタップしてホーム画面にアイコンを設置。</>,
          <>ホーム画面のアイコンから起動 — 以降オフラインで動作します。</>,
        ]}
      />
      <Section
        title="Android (Chrome)"
        icon={<Smartphone size={20} />}
        steps={[
          <>Chrome でこのページを開きます。</>,
          <>
            アドレスバー右の <Inline icon={<MoreVertical size={14} />}>︙</Inline> メニューをタップ。
          </>,
          <>
            「<strong>ホーム画面に追加</strong>」または「アプリをインストール」を選択。
          </>,
          <>確認画面で「インストール」または「追加」をタップ。</>,
          <>
            ホーム画面のアイコンから起動 — 以降オフラインで動作します。
            <br />
            <span className="text-xs opacity-80">
              ※ Android では「他のアプリから共有」もできます (写真アプリの共有先に表示)。
            </span>
          </>,
        ]}
      />

      <div className="card p-4 text-sm">
        <div className="mb-1 flex items-center gap-2 font-semibold">
          <Plus size={16} />
          初回インストール後について
        </div>
        <p className="text-slate-600 dark:text-slate-300">
          1 度ホーム画面から起動すれば、
          <strong>必要なファイルが端末にキャッシュ</strong>
          され、以後はインターネット接続なしで動作します。SNS
          投稿前に機内モードでも安心して使えます。
        </p>
      </div>
    </div>
  );
}

function Section({
  title,
  icon,
  steps,
}: {
  title: string;
  icon: React.ReactNode;
  steps: React.ReactNode[];
}) {
  return (
    <section className="card p-4">
      <h3 className="mb-3 flex items-center gap-2 text-base font-bold">
        {icon}
        {title}
      </h3>
      <ol className="space-y-2 text-sm">
        {steps.map((step, i) => (
          <li key={i} className="flex gap-3">
            <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-bold dark:bg-slate-700">
              {i + 1}
            </span>
            <div className="flex-1">{step}</div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Inline({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-0.5 rounded bg-slate-200 px-1.5 py-0.5 text-xs dark:bg-slate-700">
      {icon}
      {children}
    </span>
  );
}
