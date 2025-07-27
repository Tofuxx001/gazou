import Image from "next/image";
import CardMaker from "./component/CardMaker";
import logoPng from "../assets/proxyz-logo.png";
import synaplogo from "../assets/SynapStudio.png";

export default function Home() {
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
            🗓️ 2025年7月 アップデート
          </h3>
          <ul className="list-disc list-inside mt-2 text-gray-800 space-y-1">
            <li>🧱 テキストも画像も自由に追加できる「レイヤー制」に完全対応</li>
            <li>
              🔀 レイヤーはドラッグで並び替えできる（表示順をカンタン調整）
            </li>
            <li>
              🎨
              各レイヤーに個別で「色・サイズ・縁取り・背景・不透明度」など細かく設定可能
            </li>
            <li>🖼️ 画像レイヤーには「サイズ」「位置」「角丸」なども指定OK</li>
            <li>✍️ テキスト入力UIを改良、複数行や改行にも対応</li>
            <li>🪄 カードの状態をそのままJSONで保存／読み込みできるように</li>
            <li>📋 テーブル形式でカード一覧を確認・編集・再読み込みが可能に</li>
            <li>📦 保存は「新規保存」「上書き保存」から選べて管理がラクに</li>
          </ul>
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
              1. カード入力
            </h3>
            <p>
              タイトルや各テキスト内容を入力します。
              <br />
              テキストは複数行もOK！
            </p>

            <h3 className="text-xl font-semibold text-indigo-600">
              2. デザイン調整
            </h3>
            <p>
              背景色・文字色・角丸・余白・文字サイズ・位置を自在に設定可能。
              <br />
              テキストごとに縁取りや背景、不透明度など細かく設定できます。
            </p>

            <h3 className="text-xl font-semibold text-indigo-600">
              3. プレビューで確認
            </h3>
            <p>
              プレビュー領域で即時反映！改行やレイアウト、画像との重なり順も確認しながら調整できます。
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-indigo-600">
              4. JSON保存 / 読み込み
            </h3>
            <p>
              作成済みのカードをエクスポートしてバックアップ！
              <br />
              別の環境でもJSONをインポートすればそのまま再編集可能です。
            </p>

            <h3 className="text-xl font-semibold text-indigo-600">
              5. カード保存
            </h3>
            <p>
              「作成してキャプチャ！」でPNG画像を即保存。
              <br />
              一覧に自動追加されます。
            </p>

            <h3 className="text-xl font-semibold text-indigo-600">
              6. A4並べて出力
            </h3>
            <p>
              複数カードをまとめてA4サイズに整列してPNG出力可能。
              <br />
              印刷用プロキシカードを一気に作れます。
            </p>
          </div>
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
