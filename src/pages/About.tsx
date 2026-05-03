import InstallGuide from '../components/InstallGuide';

export default function AboutPage() {
  return (
    <div className="space-y-6">
      <section>
        <h2 className="mb-2 text-xl font-bold">使い方</h2>
        <ol className="ml-5 list-decimal space-y-1 text-sm">
          <li>下部のメニューから「エディタ」を開きます。</li>
          <li>
            「写真を選択」をタップしてカメラロールから 1 枚以上の写真 (または動画)
            を選びます。
          </li>
          <li>
            画面上部に「<strong>安全</strong> / <strong>要注意</strong> /
            <strong>危険</strong>」のいずれかが大きく表示されます。
            画面のふちの色も連動します。
          </li>
          <li>
            個別カードをタップすると、含まれているメタデータの詳細を確認できます。
            位置情報がある場合は地図でも確認できます。
          </li>
          <li>
            目的に応じて「位置情報のみ削除」「すべて削除」などを選び、
            ダウンロードして SNS にアップロードしてください。
          </li>
        </ol>
      </section>

      <section>
        <h2 className="mb-2 text-xl font-bold">対応形式</h2>
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-slate-500">
            <tr>
              <th className="py-1">形式</th>
              <th className="py-1">読取</th>
              <th className="py-1">削除/編集</th>
            </tr>
          </thead>
          <tbody className="[&_td]:py-1 [&_tr]:border-t [&_tr]:border-slate-200 dark:[&_tr]:border-slate-700">
            <Row name="JPEG (.jpg/.jpeg)" read="○" edit="○ (完全)" />
            <Row name="PNG" read="○" edit="○ (再エンコード)" />
            <Row name="WebP" read="○" edit="○ (再エンコード)" />
            <Row name="HEIC/HEIF" read="△" edit="× (読取のみ)" />
            <Row name="TIFF/DNG" read="○" edit="× (読取のみ)" />
            <Row name="MP4" read="△" edit="○ (GPS のみ)" />
            <Row name="MOV (QuickTime)" read="△" edit="○ (GPS のみ)" />
          </tbody>
        </table>
        <p className="mt-2 text-xs text-slate-500">
          動画はクライアント実装の制約上、コンテナ内の GPS atom
          を 0 埋めする簡易処理のみ対応しています。
          再エンコードは行いません。
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-xl font-bold">安全性の判定基準</h2>
        <ul className="ml-5 list-disc space-y-1 text-sm">
          <li>
            <strong className="text-danger-600 dark:text-danger-500">危険</strong> :
            位置情報 (GPS 緯度経度・高度・撮影方位など) が含まれる
          </li>
          <li>
            <strong className="text-warn-600 dark:text-warn-500">要注意</strong> :
            機材のシリアル番号、所有者名、著作権者名、編集前サムネイルなどが含まれる
          </li>
          <li>
            <strong className="text-safe-600 dark:text-safe-500">安全</strong> :
            上記が含まれない (撮影日時や機種名のみなど)
          </li>
        </ul>
      </section>

      <section>
        <h2 className="mb-2 text-xl font-bold">ホーム画面への追加</h2>
        <InstallGuide />
      </section>

      <section>
        <h2 className="mb-2 text-xl font-bold">このアプリについて</h2>
        <p className="text-sm">
          MIT ライセンスのオープンソースです。
          すべての処理は端末内で完結し、いかなるデータも外部送信しません。
        </p>
      </section>
    </div>
  );
}

function Row({ name, read, edit }: { name: string; read: string; edit: string }) {
  return (
    <tr>
      <td>{name}</td>
      <td>{read}</td>
      <td>{edit}</td>
    </tr>
  );
}
