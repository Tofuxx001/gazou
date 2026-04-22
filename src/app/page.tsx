"use client";
import { useEffect } from "react";
import { AdMaxSlot } from "./_components/AdMaxSlot";
import Image from "next/image";
import CardMaker from "./_components/CardMaker";
import { trackPageView } from "./_components/analytics";
import logoPng from "../assets/proxyz-logo.png";
import synaplogo from "../assets/SynapStudio.png";

// タブキー → 計測上のページタイトル
const TAB_TITLES: Record<string, string> = {
  edit: "Proxyz / 編集",
  cardlist: "Proxyz / カード一覧",
  howto: "Proxyz / 使い方",
  updates: "Proxyz / お知らせ",
};

function sendTabPageView() {
  const rawHash = window.location.hash.replace(/^#/, "");
  const tabKey = rawHash in TAB_TITLES ? rawHash : "edit";
  trackPageView(tabKey, TAB_TITLES[tabKey]);
}

export default function Home() {
  useEffect(() => {
    // 初回ロード時の自動 page_view は GA4 が送ってくれるので、
    // ここでは明示的にハッシュ付きのタブ PV だけを追加で送る。
    sendTabPageView();
    window.addEventListener("hashchange", sendTabPageView);
    return () => window.removeEventListener("hashchange", sendTabPageView);
  }, []);

  return (
    <>
      <header className="w-full h-20 bg-white px-8 flex items-center justify-between shadow-md">
        <div className="flex items-center space-x-4">
          <Image src={logoPng} alt=" Logo" className="h-20 w-20" />
          <div>
            <h1 className="text-xl font-bold text-gray-800">プロキシーズ</h1>
            <p className="text-sm text-gray-600">
              ボドゲ・TCGプロキシ作成ツール（by SynapStudio） ver.02
            </p>
          </div>
        </div>
        <nav className="item-self-end flex space-x-6 text-sm font-medium text-gray-700 items-center">
          <a href="#edit" className="hover:text-indigo-600">
            編集
          </a>
          <a href="#cardlist" className="hover:text-indigo-600">
            カード一覧
          </a>
          <a href="#howto" className="hover:text-indigo-600">
            使い方
          </a>
          <a href="#updates" className="hover:text-indigo-600">
            お知らせ
          </a>
          <a
            href="https://synapstudio.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-indigo-600 hover:underline font-medium">
            <Image
              src={synaplogo}
              alt="公式サイトへ"
              className="h-20 w-20"></Image>
          </a>
        </nav>
      </header>
      <CardMaker></CardMaker>
      <div id="ad-area" className="h-200">
        <AdMaxSlot
          admaxId="https://adm.shinobi.jp/s/fe837c5d039f86ecd23c137d51ef7dcd"
          type="switch"
        />
      </div>
      <section
        id="updates"
        className="mt-12 px-6 py-10 bg-white shadow-md rounded-lg max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold text-indigo-700 mb-6 flex items-center gap-2">
          <svg
            className="w-6 h-6 text-indigo-600"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          アップデート情報
        </h2>
        <div className="bg-indigo-50 border-l-4 border-indigo-400 p-6 rounded-md">
          <h3 className="text-lg font-semibold text-indigo-800">
            🗓️ 2026年4月 大型アップデート
          </h3>
          <p className="mt-2 text-sm text-gray-700">
            UI全体を刷新し、より直感的に・より速く作れるエディタになりました。
          </p>
          <ul className="list-disc list-inside mt-3 text-gray-800 space-y-1">
            <li>
              🪟 <strong>UIを全面リニューアル</strong>
              。左に設定、中央にプレビュー、右にレイヤーパネルの3ペイン構成に
            </li>
            <li>
              📐 <strong>カードサイズプリセット</strong>
              を搭載。TCG標準・ポーカー・タロット等を一発適用
            </li>
            <li>
              💾 <strong>自動保存</strong>
              に対応。ブラウザを閉じても作業内容が消えません
            </li>
            <li>
              🎨 <strong>カラーピッカーをポップオーバー化</strong>
              。色のスウォッチをクリックすると展開、画面の圧迫感を解消
            </li>
            <li>
              🖼 <strong>カード一覧をサムネイル表示</strong>
              に。保存したカードを画像で見て選べます
            </li>
            <li>
              📑 <strong>レイヤー詳細をセクション分け</strong>
              （コンテンツ／配置／タイポグラフィ／背景）
            </li>
            <li>
              🎯 <strong>位置指定がビジュアル化</strong>
              。3×3のグリッドで基準位置を選べます
            </li>
            <li>
              📤 <strong>「カード保存」と「PNG書き出し」を分離</strong>
              。誤操作で無駄なPNGがダウンロードされなくなりました
            </li>
            <li>
              📱 <strong>スマートフォン対応</strong>
              。狭い画面でも縦スタックで操作可能
            </li>
            <li>
              ✨ <strong>トースト通知</strong>
              。保存・読込時に画面右下で結果を確認できます
            </li>
            <li>
              🛡 <strong>削除前の確認ダイアログ</strong>。誤って消すのを防止
            </li>
            <li>
              ♿ <strong>アクセシビリティ改善</strong>
              。ラベルの関連付け、キーボード操作対応
            </li>
          </ul>
          <details className="mt-4 text-sm text-gray-600">
            <summary className="cursor-pointer hover:text-indigo-700">
              過去のアップデート
            </summary>
            <div className="mt-3 pl-3 border-l-2 border-indigo-200">
              <h4 className="font-semibold text-indigo-800">
                🗓️ 2025年7月 アップデート
              </h4>
              <ul className="list-disc list-inside mt-1 space-y-0.5">
                <li>テキストも画像も自由に追加できる「レイヤー制」に対応</li>
                <li>レイヤーをドラッグで並び替え可能に</li>
                <li>
                  レイヤーごとに色・サイズ・縁取り・背景・不透明度を細かく設定可能
                </li>
                <li>画像レイヤーにサイズ・位置・角丸を指定可能に</li>
                <li>テキスト入力UIを改良、複数行・改行に対応</li>
                <li>カードの状態をJSONで保存／読み込みできるように</li>
                <li>テーブル形式でカード一覧を確認・編集できるように</li>
                <li>「新規保存」「上書き保存」を選べるように</li>
              </ul>
            </div>
          </details>
        </div>
      </section>
      <section
        id="howto"
        className="mt-12 px-6 py-10 bg-gradient-to-br from-indigo-50 to-white shadow-xl rounded-lg  mx-auto">
        <h2 className="text-3xl font-bold text-indigo-700 mb-6 flex items-center gap-2">
          <svg
            className="w-8 h-8 text-indigo-600"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 10h.01M12 10h.01M16 10h.01M21 16c0 2.21-3.582 4-8 4s-8-1.79-8-4m16-4a8 8 0 11-16 0 8 8 0 0116 0z"
            />
          </svg>
          ご利用ガイド
        </h2>

        <div className="grid md:grid-cols-2 gap-8 text-gray-800 text-base leading-relaxed">
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-indigo-600">
              1. カードサイズを決める
            </h3>
            <p>
              左サイドバーの「カードサイズ」プリセットから選ぶか、幅・高さを直接入力。
              <br />
              TCG標準（63×88mm）、ポーカー、タロットなど主要規格を即適用できます。
            </p>

            <h3 className="text-xl font-semibold text-indigo-600">
              2. ベース（カード本体）を整える
            </h3>
            <p>
              カードの土台になる背景色や角丸、必要なら背景画像を設定。
              <br />
              キャンバス全体に対する%指定なので、サイズを変えても比率が保たれます。
            </p>

            <h3 className="text-xl font-semibold text-indigo-600">
              3. レイヤーを追加する
            </h3>
            <p>
              右パネル上部の{" "}
              <code className="px-1.5 py-0.5 bg-indigo-100 rounded text-sm">
                T
              </code>
              （テキスト）と{" "}
              <code className="px-1.5 py-0.5 bg-indigo-100 rounded text-sm">
                画像
              </code>{" "}
              アイコンから追加。
              <br />
              並び替えはドラッグハンドル、表示/非表示はスイッチで切替できます。
            </p>

            <h3 className="text-xl font-semibold text-indigo-600">
              4. レイヤーの詳細を編集
            </h3>
            <p>
              レイヤーをクリックで選択すると、下に「コンテンツ／配置／タイポグラフィ／背景」のセクションが展開。
              <br />
              色のスウォッチをクリックするとピッカーがポップアップします。
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-indigo-600">
              5. カードを保存する
            </h3>
            <p>
              上部ツールバーの「<strong>新規保存</strong>
              」を押すと、カード一覧にサムネイル付きで追加されます。
              <br />
              既存カードを編集中は「<strong>上書き</strong>」で同じIDに反映。
            </p>

            <h3 className="text-xl font-semibold text-indigo-600">
              6. PNGで書き出す
            </h3>
            <p>
              カード画像が単体で欲しいときは「<strong>PNG書き出し</strong>」。
              <br />※
              保存とは独立しているので、誤ってPNGがダウンロードされることはありません。
            </p>

            <h3 className="text-xl font-semibold text-indigo-600">
              7. 同じデザインで量産する
            </h3>
            <p>
              カード一覧の下のテーブルでテキスト値だけを書き換えれば、デザインそのままで複数枚作成可能。
              <br />
              サムネイルをクリックすると過去のカードを呼び出して再編集できます。
            </p>

            <h3 className="text-xl font-semibold text-indigo-600">
              8. 自動保存とプロジェクト書き出し
            </h3>
            <p>
              編集内容は自動でブラウザに保存されるので、タブを閉じても続きから再開できます。
              <br />
              別環境に移したいときは「<strong>JSON保存</strong>
              」でプロジェクト全体を書き出せます。
            </p>
          </div>
        </div>

        <div className="mt-10 p-4 bg-white/70 rounded-md border border-indigo-100">
          <h4 className="font-semibold text-indigo-700 mb-2 text-sm">
            💡 便利なTips
          </h4>
          <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
            <li>
              レイヤーの「スタイルコピー／貼付」で、装飾だけを別レイヤーに引き継げます
            </li>
            <li>
              基準位置は3×3グリッドのボタンでビジュアルに選べます（左上・中央・右下など）
            </li>
            <li>
              スマートフォンからも操作可能。狭い画面では縦スタックに自動切替
            </li>
            <li>自動保存をリセットしたい場合はカード一覧の「リセット」から</li>
          </ul>
        </div>

        <div className="mt-10 text-center text-sm text-gray-500">
          <p>
            プロキシーズは、手軽にボドゲ・TCGのカードをプロクシ印刷できるデザインツールです。
          </p>
          <p className="mt-1">
            改行／縁取り／画像重ねなどの細かい調整までしっかり対応！
          </p>
        </div>
      </section>
      <header className="flex items-center justify-between w-full h-20 bg-white px-6 shadow-md mt-10">
        <div className="flex items-center space-x-4">
          <Image src={logoPng} alt="SynapStudio Logo" className="h-12 w-20" />
          <div>
            <h1 className="text-xl font-bold text-gray-800">プロキシーズ</h1>
            <p className="text-sm text-gray-600">
              ボドゲ・TCGプロキシ作成ツール（by SynapStudio）
            </p>
          </div>
        </div>
        <code className="text-sm">©株式会社SynapStudio 2025</code>
        <a
          href="https://synapstudio.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-indigo-600 hover:underline font-medium">
          <Image
            src={synaplogo}
            alt="公式サイトへ"
            className="h-20 w-20"></Image>
        </a>
      </header>
    </>
  );
}
