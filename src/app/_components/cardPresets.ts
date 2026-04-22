// 印刷想定の300DPIで mm → px に換算
// 1mm = 11.811px (300dpi)
const MM_TO_PX_300DPI = 11.811;
const mm = (n: number) => Math.round(n * MM_TO_PX_300DPI);

export type CardPreset = {
  id: string;
  label: string;
  category: "TCGサイズ" | "ボドゲサイズ" | "その他";
  width: number;
  height: number;
  description?: string;
};

/**
 * 商標を避け、サイズ寸法と一般的な呼称のみで構成。
 * 「ブリッジサイズ」「ポーカーサイズ」等は ISO/業界一般名称。
 */
export const CARD_PRESETS: CardPreset[] = [
  // === TCG（一般呼称） ===
  {
    id: "tcg-standard",
    label: "TCG 標準 (63×88mm)",
    category: "TCGサイズ",
    width: mm(63),
    height: mm(88),
    description: "国内外の主要TCGで広く使われる標準サイズ",
  },
  {
    id: "tcg-japanese",
    label: "TCG 日本小型 (59×86mm)",
    category: "TCGサイズ",
    width: mm(59),
    height: mm(86),
    description: "日本の一部TCGで採用される小型サイズ",
  },
  {
    id: "tcg-mini",
    label: "TCG ミニ (43×65mm)",
    category: "TCGサイズ",
    width: mm(43),
    height: mm(65),
  },

  // === ボドゲ（業界一般呼称） ===
  {
    id: "poker",
    label: "ポーカーサイズ (63×88mm)",
    category: "ボドゲサイズ",
    width: mm(63),
    height: mm(88),
    description: "トランプ標準",
  },
  {
    id: "bridge",
    label: "ブリッジサイズ (57×89mm)",
    category: "ボドゲサイズ",
    width: mm(57),
    height: mm(89),
    description: "細身のトランプ規格",
  },
  {
    id: "mini-american",
    label: "ミニアメリカン (41×63mm)",
    category: "ボドゲサイズ",
    width: mm(41),
    height: mm(63),
    description: "デッキビルディング系で多用",
  },
  {
    id: "mini-european",
    label: "ミニユーロ (44×68mm)",
    category: "ボドゲサイズ",
    width: mm(44),
    height: mm(68),
  },
  {
    id: "tarot",
    label: "タロットサイズ (70×120mm)",
    category: "ボドゲサイズ",
    width: mm(70),
    height: mm(120),
  },

  // === その他 ===
  {
    id: "square-large",
    label: "正方形 大 (70×70mm)",
    category: "その他",
    width: mm(70),
    height: mm(70),
  },
  {
    id: "square-small",
    label: "正方形 小 (45×45mm)",
    category: "その他",
    width: mm(45),
    height: mm(45),
  },
  {
    id: "business-card",
    label: "名刺サイズ (55×91mm)",
    category: "その他",
    width: mm(55),
    height: mm(91),
  },
];