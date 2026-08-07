// ============================================================
// フォントプリセット
// ------------------------------------------------------------
// Canvas の ctx.font に渡す family 名と、UI 表示用のラベルを保持する。
// Web フォントは globals.css で @import 済み（Google Fonts）。
// 描画前に document.fonts.ready を待つことで、初回描画のフォント
// 未適用（いわゆる FOUT）を防いでいる。
// ============================================================

export type FontPreset = {
  id: string;
  label: string;
  /** ctx.font に渡す font-family 文字列。フォールバックまで含める */
  family: string;
  /** Web フォント読み込みが必要か（ローカル総称ファミリーなら false） */
  isWebFont: boolean;
};

export const FONT_PRESETS: FontPreset[] = [
  {
    id: "sans",
    label: "標準ゴシック",
    family: "sans-serif",
    isWebFont: false,
  },
  {
    id: "rounded",
    label: "丸ゴシック",
    family: '"M PLUS Rounded 1c", sans-serif',
    isWebFont: true,
  },
  {
    id: "serif",
    label: "明朝",
    family: '"Noto Serif JP", serif',
    isWebFont: true,
  },
  {
    id: "impact",
    label: "極太ゴシック",
    family: '"Dela Gothic One", sans-serif',
    isWebFont: true,
  },
];

export const DEFAULT_FONT_ID = "sans";

export function getFontFamily(fontId: string | undefined): string {
  const preset = FONT_PRESETS.find((f) => f.id === fontId);
  return preset ? preset.family : "sans-serif";
}
