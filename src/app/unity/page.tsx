import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import logoPng from "../../assets/proxyz-logo.png";

export const metadata: Metadata = {
  title: "Unity書き出しマニュアル | Proxyz",
  description:
    "Proxyzで作ったカードをUnityのPrefabとして書き出す手順。初回セットアップ、一括取り込み、ボタン化、トラブルシューティングまで。",
};

/** 見出し付きセクションの共通枠 */
function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="mt-10">
      <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 border-b-2 border-indigo-300 pb-2">
        {title}
      </h2>
      <div className="mt-4 space-y-3 text-sm leading-relaxed text-gray-700 dark:text-gray-200">
        {children}
      </div>
    </section>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-500 text-white text-xs font-bold flex items-center justify-center mt-0.5">
        {n}
      </span>
      <span>{children}</span>
    </li>
  );
}

export default function UnityManualPage() {
  return (
    <>
      <header className="w-full h-20 bg-white dark:bg-gray-900 px-8 flex items-center justify-between shadow-md">
        <Link href="/" className="flex items-center space-x-4">
          <Image src={logoPng} alt="Proxyz" className="h-16 w-16" />
          <div>
            <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">
              プロキシーズ
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Unity書き出しマニュアル
            </p>
          </div>
        </Link>
        <Link
          href="/"
          className="text-sm text-indigo-600 hover:underline font-medium">
          ← エディタに戻る
        </Link>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
          🧊 Unity書き出しマニュアル
        </h1>
        <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
          Proxyzで作ったカードを、UnityのPrefab（プレハブ）として取り込めます。
          デジタルカードゲームの開発で、カードのビジュアルをそのままUnityの
          シーンに持ち込みたいときに使ってください。
        </p>

        {/* 目次 */}
        <nav className="mt-6 bg-indigo-50 dark:bg-gray-800 rounded-md p-4 text-sm">
          <p className="font-semibold text-indigo-800 dark:text-indigo-300 mb-2">
            目次
          </p>
          <ol className="list-decimal list-inside space-y-1 text-indigo-700 dark:text-indigo-300">
            <li>
              <a className="hover:underline" href="#requirements">
                必要なもの
              </a>
            </li>
            <li>
              <a className="hover:underline" href="#setup">
                初回セットアップ（取込ツール）
              </a>
            </li>
            <li>
              <a className="hover:underline" href="#export">
                カードを書き出す
              </a>
            </li>
            <li>
              <a className="hover:underline" href="#import">
                Unityに取り込む
              </a>
            </li>
            <li>
              <a className="hover:underline" href="#layers">
                レイヤーごとの書き出し設定
              </a>
            </li>
            <li>
              <a className="hover:underline" href="#modes">
                2Dモードと3Dモード
              </a>
            </li>
            <li>
              <a className="hover:underline" href="#coverage">
                再現される要素・されない要素
              </a>
            </li>
            <li>
              <a className="hover:underline" href="#troubleshooting">
                トラブルシューティング
              </a>
            </li>
          </ol>
        </nav>

        <Section id="requirements" title="1. 必要なもの">
          <ul className="list-disc list-inside space-y-1">
            <li>
              <strong>Unity 6</strong>（6000.x）で動作確認しています。Unity 2022
              LTS 以降でも概ね動作します
            </li>
            <li>
              <strong>TextMeshPro</strong> — Unity 6 では標準搭載です
            </li>
            <li>
              <strong>日本語対応の TMP フォントアセット</strong> —
              日本語テキストを表示する場合に必要です。標準の LiberationSans SDF
              には日本語が含まれません。 作り方:{" "}
              <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">
                Window &gt; TextMeshPro &gt; Font Asset Creator
              </code>{" "}
              で日本語フォント（Noto Sans JP 等）から生成
            </li>
          </ul>
        </Section>

        <Section id="setup" title="2. 初回セットアップ（取込ツール）">
          <p>
            最初に一度だけ、Prefab生成ツール「ProxyzImporter」をUnityプロジェクトに入れます。
          </p>
          <ol className="space-y-3 mt-3">
            <Step n={1}>
              エディタ上部の「<strong>🔧 取込ツール</strong>」ボタンから{" "}
              <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">
                ProxyzImporter.zip
              </code>{" "}
              をダウンロード
            </Step>
            <Step n={2}>
              ZIPを展開して、<strong>ProxyzImporter フォルダごと</strong>{" "}
              Unityプロジェクトの{" "}
              <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">
                Assets/
              </code>{" "}
              にドラッグ＆ドロップ
            </Step>
            <Step n={3}>
              コンパイルが終わると、メニューに{" "}
              <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">
                Tools &gt; Proxyz
              </code>{" "}
              が追加されます
            </Step>
          </ol>
          <div className="bg-amber-50 dark:bg-amber-950 border-l-4 border-amber-400 p-3 rounded-md mt-3">
            <p className="text-amber-800 dark:text-amber-200">
              ⚠️ <strong>ProxyzImporter は 1 プロジェクトに 1 つだけ</strong>
              入れてください。
              二重に入れるとクラスの重複でコンパイルエラーになります。
              ツールを更新するときは、古い ProxyzImporter
              フォルダを削除してから新しいものを入れてください。
            </p>
          </div>
        </Section>

        <Section id="export" title="3. カードを書き出す">
          <ol className="space-y-3">
            <Step n={1}>
              エディタ上部の「<strong>Unity</strong>
              」ボタンの隣で、書き出しモード （<strong>2D</strong> /{" "}
              <strong>3D</strong>）を選択
            </Step>
            <Step n={2}>
              「<strong>Unity</strong>」ボタンを押すと、
              <strong>カード一覧の全カード</strong>が
              1つのZIP（proxyz-cards-unity.zip）にまとめて書き出されます
            </Step>
          </ol>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            💡
            カード一覧が空のときは、いま編集中のカードが1枚として書き出されます。
          </p>
        </Section>

        <Section id="import" title="4. Unityに取り込む">
          <ol className="space-y-3">
            <Step n={1}>
              ZIPを展開して、<strong>ProxyzCards フォルダごと</strong>{" "}
              <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">
                Assets/
              </code>{" "}
              にドラッグ＆ドロップ
            </Step>
            <Step n={2}>
              <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">
                Tools &gt; Proxyz &gt; カードを Prefab にする
              </code>{" "}
              を開く
            </Step>
            <Step n={3}>
              「<strong>カードフォルダ（一括）</strong>」に ProxyzCards
              フォルダをドラッグ＆ドロップ
            </Step>
            <Step n={4}>
              「<strong>TMP フォントアセット</strong>
              」に日本語対応のフォントアセットを指定
            </Step>
            <Step n={5}>
              「<strong>Prefab を生成</strong>」を押すと、各カードフォルダの{" "}
              <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">
                Prefabs/
              </code>{" "}
              に 全カードのPrefabが一括生成されます
            </Step>
          </ol>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            💡 1枚だけ作り直したいときは「レイアウト
            JSON（単体）」にそのカードの card.json を指定してください。
          </p>
        </Section>

        <Section id="layers" title="5. レイヤーごとの書き出し設定">
          <p>
            エディタ右パネルの「<strong>Unity 書き出し</strong>」セクションで、
            レイヤーごとにUnity上での扱いを選べます。
          </p>
          <div className="overflow-x-auto mt-3">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-indigo-200">
                  <th className="py-2 pr-4">選択肢</th>
                  <th className="py-2">Unityでの生成物</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                <tr>
                  <td className="py-2 pr-4 font-medium">
                    画像／テキストとして書き出す
                  </td>
                  <td className="py-2">
                    通常の表示要素（モードに応じて Sprite / Quad / TextMeshPro）
                  </td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-medium">ボタンにする</td>
                  <td className="py-2">
                    UIボタン（Image +
                    Button）。テキストレイヤーは子にTMPラベル付き。
                    テキスト背景を設定していれば、それがボタンの見た目になります。
                    クリック時の処理（OnClick）はUnity側で設定してください
                  </td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-medium">書き出さない</td>
                  <td className="py-2">
                    このレイヤーをPrefabに含めません（Web上の見た目専用の装飾などに）
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Section>

        <Section id="modes" title="6. 2Dモードと3Dモード">
          <ul className="list-disc list-inside space-y-1">
            <li>
              <strong>2D（Sprite + Canvas）</strong> — 画像は
              SpriteRenderer、テキストは ワールド空間Canvas上の
              TextMeshProUGUI。2Dゲーム・カードUI向け
            </li>
            <li>
              <strong>3D（Quad + TMP）</strong> — 画像は Quad +
              マテリアル、テキストは 3D
              TextMeshPro。3D空間にカードを置きたいとき向け
            </li>
          </ul>
          <p className="mt-2">
            スケールはどちらも <strong>100ピクセル = 1 Unityユニット</strong>{" "}
            です。 サイズを変えたいときはルートの Transform の Scale
            を調整してください。
          </p>
        </Section>

        <Section id="coverage" title="7. 再現される要素・されない要素">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-green-50 dark:bg-green-950 rounded-md p-4">
              <p className="font-semibold text-green-800 dark:text-green-300">
                ✅ 再現される
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1 text-green-900 dark:text-green-200">
                <li>レイヤーの配置・サイズ・回転</li>
                <li>画像レイヤー</li>
                <li>テキストの内容・サイズ・色・太字・寄せ</li>
                <li>テキスト背景（角丸・ベベルは画像として焼き込み）</li>
                <li>カード外周の角丸（Base画像に焼き込み）</li>
                <li>ベース画像のズーム・位置調整</li>
              </ul>
            </div>
            <div className="bg-red-50 dark:bg-red-950 rounded-md p-4">
              <p className="font-semibold text-red-800 dark:text-red-300">
                ❌ 再現されない
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1 text-red-900 dark:text-red-200">
                <li>ドロップシャドウ</li>
                <li>文字のアウトライン</li>
                <li>テキストの動的な折り返し（実測サイズで固定）</li>
                <li>
                  カードの角にかかったレイヤーの切り落とし（Baseのみ角丸）
                </li>
              </ul>
              <p className="mt-2 text-xs text-red-800 dark:text-red-300">
                これらが必要な場合はPNG書き出しをご利用ください
              </p>
            </div>
          </div>
        </Section>

        <Section id="troubleshooting" title="8. トラブルシューティング">
          <div className="space-y-4">
            <details className="bg-gray-50 dark:bg-gray-800 rounded-md p-4">
              <summary className="cursor-pointer font-medium hover:text-indigo-600">
                メニューに Tools &gt; Proxyz が出ない
              </summary>
              <div className="mt-2 pl-2 space-y-1">
                <p>
                  コンパイルエラーでツールが登録されていない可能性があります。
                </p>
                <ul className="list-disc list-inside">
                  <li>
                    Consoleウィンドウ（Window &gt; General &gt;
                    Console）に赤いエラーが無いか確認
                  </li>
                  <li>
                    ProxyzImporter
                    フォルダが複数入っていないか確認（1つだけにする）
                  </li>
                </ul>
              </div>
            </details>
            <details className="bg-gray-50 dark:bg-gray-800 rounded-md p-4">
              <summary className="cursor-pointer font-medium hover:text-indigo-600">
                画像が表示されない・スキップされる
              </summary>
              <div className="mt-2 pl-2 space-y-1">
                <p>
                  Consoleに{" "}
                  <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">
                    [Proxyz]
                  </code>{" "}
                  で始まる警告・エラーが出ています。
                  原因（ファイル欠落・インポート失敗など）が具体的に書かれているので確認してください。
                </p>
                <p>
                  古いZIPを使い回している場合は、Proxyzから書き出し直して
                  ProxyzCards
                  フォルダを丸ごと入れ替えると解決することがあります。
                </p>
              </div>
            </details>
            <details className="bg-gray-50 dark:bg-gray-800 rounded-md p-4">
              <summary className="cursor-pointer font-medium hover:text-indigo-600">
                日本語が □（豆腐）になる
              </summary>
              <div className="mt-2 pl-2">
                <p>
                  TMPフォントアセットに日本語が含まれていません。日本語フォントから
                  フォントアセットを作成して、インポータの「TMP
                  フォントアセット」欄に指定してください。
                </p>
              </div>
            </details>
            <details className="bg-gray-50 dark:bg-gray-800 rounded-md p-4">
              <summary className="cursor-pointer font-medium hover:text-indigo-600">
                ボタンがクリックに反応しない
              </summary>
              <div className="mt-2 pl-2 space-y-1">
                <ul className="list-disc list-inside">
                  <li>
                    シーンに EventSystem が必要です（Hierarchy右クリック &gt; UI
                    &gt; Event System）
                  </li>
                  <li>
                    ワールド空間Canvasのため、Canvas の Event Camera
                    の設定が必要な場合があります
                  </li>
                  <li>
                    OnClick
                    の処理が未設定だと、押せても何も起きません（仕様です）
                  </li>
                </ul>
              </div>
            </details>
            <details className="bg-gray-50 dark:bg-gray-800 rounded-md p-4">
              <summary className="cursor-pointer font-medium hover:text-indigo-600">
                px_ で始まる画像ファイルが生成されている
              </summary>
              <div className="mt-2 pl-2">
                <p>
                  ファイル名の文字コードの問題を自動回避した痕跡です。動作に問題はありません。
                  気になる場合は、Proxyz側でカードを書き出し直すと発生しなくなります。
                </p>
              </div>
            </details>
          </div>
        </Section>

        <div className="mt-12 text-center">
          <Link
            href="/"
            className="inline-block bg-indigo-500 hover:bg-indigo-600 text-white font-medium px-6 py-3 rounded-md transition">
            エディタに戻ってカードを作る
          </Link>
        </div>
      </main>

      <footer className="mt-16 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
        ©株式会社SynapStudio 2025-2026 —{" "}
        <a
          href="https://proxyz.synapstudio.com"
          className="text-indigo-600 hover:underline">
          Proxyz
        </a>
      </footer>
    </>
  );
}
