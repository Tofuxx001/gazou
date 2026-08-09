// ============================================================
// Unity 書き出し
// ------------------------------------------------------------
// 方式: レイアウト JSON + PNG + C# エディタスクリプト を ZIP で渡し、
//       prefab の組み立ては Unity 内で本物の API に任せる。
//
// prefab の YAML を直接生成する方式は、TextureImporter の
// シリアライズ形式・TextMeshPro のスクリプト GUID・フォントアセットの
// GUID をこちら側で決め打ちする必要があり、Unity / TMP のバージョンが
// 変わると参照が丸ごと壊れる。実際に壊れたのでこの方式に切り替えた。
//
// この方式なら Unity 側が GUID も meta も自前で作るため、
// 参照が壊れる余地がそもそも無い。
// ============================================================

import { createZip, dataUrlToBytes, type ZipEntry } from "./zipWriter";
import { UNITY_IMPORTER_CS } from "./unityImporterScript";

/** 100px = 1 Unity ユニット */
const PPU = 100;

export type UnityMode = "3d" | "2d";

export type UnityComponentKind =
  | "auto" // 通常の表示要素として書き出す（モードに従う）
  | "button" // 押せる UI ボタン（UGUI: Image + Button）として書き出す
  | "skip"; // 書き出さない

export const UNITY_COMPONENTS_FOR_IMAGE: { value: UnityComponentKind; label: string }[] = [
  { value: "auto", label: "画像として書き出す" },
  { value: "button", label: "ボタンにする" },
  { value: "skip", label: "書き出さない" },
];

export const UNITY_COMPONENTS_FOR_TEXT: { value: UnityComponentKind; label: string }[] = [
  { value: "auto", label: "テキストとして書き出す" },
  { value: "button", label: "ボタンにする（テキスト付き）" },
  { value: "skip", label: "書き出さない" },
];

// ------------------------------------------------------------
// JSON スキーマ（C# 側の ProxyzCard / ProxyzLayer と対応）
// フィールド名は JsonUtility が名前一致で読むので変更しないこと
// ------------------------------------------------------------

type JsonLayer = {
  name: string;
  kind: "image" | "text" | "textbg";
  component: string; // "auto" | "button" | "skip"（旧版の "quad" 等も C# 側で解釈される）
  centerX: number;
  centerY: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  image: string;
  text: string;
  fontSize: number;
  bold: boolean;
  align: "left" | "center" | "right";
  colorHex: string;
};

type JsonCard = {
  cardName: string;
  canvasWidth: number;
  canvasHeight: number;
  pixelsPerUnit: number;
  mode: UnityMode;
  layers: JsonLayer[];
};

// ------------------------------------------------------------
// 入力
// ------------------------------------------------------------

export type ExportLayer = {
  id: string;
  type: "text" | "image";
  title: string;
  visible: boolean;
  value: string;
  fontStyle: string;
  fontFamily?: string;
  fontSize: number;
  textAlign: "left" | "center" | "right";
  fontColor: string;
  PositionPreset: string;
  positionAdjX: number;
  positionAdjY: number;
  backGround: boolean;
  textPadding: number;
  bgColor: string;
  bgRadius: number;
  bgOpacity: number;
  imageWidth?: number;
  imageHeight?: number;
  opacity?: number;
  rotation?: number;
  bevelEnabled?: boolean;
  bevelStyle?: "raised" | "inset";
  bevelSize?: number;
  bevelIntensity?: number;
  unityComponent?: UnityComponentKind;
};

export type UnityCardInput = {
  cardName: string;
  canvasData: { width: number; height: number; bgColor: string; radius: number };
  baseData: {
    width: number;
    height: number;
    bgColor: string;
    imageSrc: string;
    radius: number;
    imagePositionX: number;
    imagePositionY: number;
    imageWidth: number;
    imageHight: number; // 本家の綴りに合わせる
  };
  layers: ExportLayer[];
};

export type UnityBulkExportInput = {
  /** カード一覧の全カード（1 件でも可） */
  cards: UnityCardInput[];
  mode: UnityMode;
  /** レイヤーのフォント指定を Canvas の font 文字列に変換する */
  fontOf: (layer: ExportLayer) => string;
};

// ------------------------------------------------------------
// ユーティリティ
// ------------------------------------------------------------

function safeName(name: string, fallback: string): string {
  const cleaned = (name || "")
    // 濁点・半濁点が結合文字（NFD）で入っていると、Unity 側で
    // AssetDatabase のパス照合に失敗する。書き出し時点で NFC に統一する
    .normalize("NFC")
    .replace(/[\\/:*?"<>|]/g, "_")
    .replace(/\s+/g, "_")
    .trim();
  return cleaned.length > 0 ? cleaned.slice(0, 48) : fallback;
}

function hexToRgba(hex: string, alpha: number): string {
  let h = String(hex || "#000000").replace("#", "");
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function roundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  const radius = Math.max(0, Math.min(r, Math.min(w, h) / 2));
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function positionOf(
  preset: string, baseX: number, baseY: number, baseW: number, baseH: number
): [number, number] {
  const map: Record<string, [number, number]> = {
    "top-left": [0, 0],
    "top-center": [baseW / 2, 0],
    "top-right": [baseW, 0],
    "center-left": [0, baseH / 2],
    center: [baseW / 2, baseH / 2],
    "center-right": [baseW, baseH / 2],
    "bottom-left": [0, baseH],
    "bottom-center": [baseW / 2, baseH],
    "bottom-right": [baseW, baseH],
  };
  const rel = map[preset] ?? map.center;
  return [baseX + rel[0], baseY + rel[1]];
}

/**
 * テキスト背景を PNG に焼く。
 * 角丸とベベルは Unity のコンポーネントでは再現できないため、
 * 見た目そのままの画像にしてスプライトとして扱う。
 */
function renderTextBackground(layer: ExportLayer, w: number, h: number): string {
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.ceil(w));
  c.height = Math.max(1, Math.ceil(h));
  const ctx = c.getContext("2d");
  if (!ctx) return "";

  roundedRectPath(ctx, 0, 0, c.width, c.height, layer.bgRadius);
  ctx.fillStyle = hexToRgba(layer.bgColor, layer.bgOpacity ?? 1);
  ctx.fill();

  if (layer.bevelEnabled) {
    const size = layer.bevelSize ?? 4;
    const intensity = layer.bevelIntensity ?? 0.6;
    const style = layer.bevelStyle ?? "raised";
    const light = `rgba(255, 255, 255, ${intensity})`;
    const dark = `rgba(0, 0, 0, ${intensity * 0.8})`;
    const topLeft = style === "raised" ? light : dark;
    const bottomRight = style === "raised" ? dark : light;

    ctx.save();
    roundedRectPath(ctx, 0, 0, c.width, c.height, layer.bgRadius);
    ctx.clip();
    ctx.lineWidth = size * 2;
    ctx.filter = `blur(${Math.max(0.5, size * 0.4)}px)`;

    ctx.strokeStyle = topLeft;
    ctx.beginPath();
    roundedRectPath(ctx, size * 0.5, size * 0.5, c.width, c.height, layer.bgRadius);
    ctx.stroke();

    ctx.strokeStyle = bottomRight;
    ctx.beginPath();
    roundedRectPath(ctx, -size * 0.5, -size * 0.5, c.width, c.height, layer.bgRadius);
    ctx.stroke();

    ctx.filter = "none";
    ctx.restore();
  }

  return c.toDataURL("image/png");
}

/** Canvas と同じ指定でテキストを実測する */
function measureText(layer: ExportLayer, font: string) {
  const c = document.createElement("canvas");
  const ctx = c.getContext("2d");
  const lines = String(layer.value).split("\n");
  const lineHeight = layer.fontSize * 1.2;
  if (!ctx) {
    return { textW: layer.fontSize * 4, textH: lineHeight * lines.length, lineHeight, lines };
  }
  ctx.font = font;
  const textW = Math.max(...lines.map((l) => ctx.measureText(l).width), 1);
  return { textW, textH: lineHeight * lines.length, lineHeight, lines };
}

/**
 * 画像ソースを「本物の PNG バイト列」に正規化する。
 *
 * アプリ内の画像は data URL だが、中身は JPEG や WebP のことがある
 * （ユーザーが .jpg をアップロードすれば data:image/jpeg;... になる）。
 * それを .png という拡張子で ZIP に入れると、Unity が拡張子と中身の
 * 不一致でインポートに失敗し、画像レイヤーが丸ごと消える。
 * canvas を経由して再エンコードすることで、形式を問わず必ず
 * 正しい PNG として書き出す。
 */
async function imageToPngBytes(src: string): Promise<Uint8Array> {
  // 既に PNG の data URL なら再エンコード不要
  if (src.startsWith("data:image/png")) return dataUrlToBytes(src);

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = src;
    });
    const c = document.createElement("canvas");
    c.width = Math.max(1, img.naturalWidth);
    c.height = Math.max(1, img.naturalHeight);
    const ctx = c.getContext("2d");
    if (!ctx) return dataUrlToBytes(src);
    ctx.drawImage(img, 0, 0);
    return dataUrlToBytes(c.toDataURL("image/png"));
  } catch {
    // 読めない画像はそのままのバイトを返す（無いよりまし）
    return dataUrlToBytes(src);
  }
}

/**
 * カード地 + ベース画像を Web 版とまったく同じ手順で 1 枚の PNG に合成する。
 * これにより以下が Unity 側でも見た目どおり再現される：
 *  - カード地の色（縁）
 *  - ベースの角丸クリップ（baseData.radius）
 *  - ベース画像のズーム・位置調整（imageWidth / imagePosition）
 *  - カード外周の角丸（canvasData.radius — 角丸の外は透明）
 * 注意: Unity ではテキストや画像レイヤーが別オブジェクトになるため、
 * カードの角にレイヤーがかかっている場合、その部分は Web と違い
 * 切り落とされない（通常の配置では実害なし）。
 */
async function renderBaseComposite(
  canvasData: UnityCardInput["canvasData"],
  baseData: UnityCardInput["baseData"]
): Promise<Uint8Array | null> {
  const cw = canvasData.width;
  const ch = canvasData.height;
  const c = document.createElement("canvas");
  c.width = Math.max(1, cw);
  c.height = Math.max(1, ch);
  const ctx = c.getContext("2d");
  if (!ctx) return null;

  // カード全体を外周の角丸でクリップしてからカード地を塗る
  // （Web 版の描画と同じ挙動。角丸の外は透明）
  ctx.save();
  roundedRectPath(ctx, 0, 0, cw, ch, canvasData.radius);
  ctx.clip();
  ctx.fillStyle = canvasData.bgColor;
  ctx.fillRect(0, 0, cw, ch);

  const baseW = cw * (baseData.width / 100);
  const baseH = ch * (baseData.height / 100);
  const baseX = cw / 2 - baseW / 2;
  const baseY = ch / 2 - baseH / 2;

  if (baseData.imageSrc && baseData.imageSrc !== "null") {
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const i = new Image();
        i.onload = () => resolve(i);
        i.onerror = reject;
        i.src = baseData.imageSrc;
      });
      ctx.save();
      roundedRectPath(ctx, baseX, baseY, baseW, baseH, baseData.radius);
      ctx.clip();
      ctx.drawImage(
        img,
        baseX + (baseData.imagePositionX / 100) * baseW - (baseData.imageWidth / 200) * baseW,
        baseY + (baseData.imagePositionY / 100) * baseH - (baseData.imageHight / 200) * baseH,
        (baseData.imageWidth / 100) * baseW,
        (baseData.imageHight / 100) * baseH
      );
      ctx.restore();
    } catch {
      // 画像が読めなければカード地のまま出す
    }
  } else {
    ctx.save();
    roundedRectPath(ctx, baseX, baseY, baseW, baseH, baseData.radius);
    ctx.fillStyle = baseData.bgColor;
    ctx.fill();
    ctx.restore();
  }

  // 外周角丸クリップの解除
  ctx.restore();
  return dataUrlToBytes(c.toDataURL("image/png"));
}

// ------------------------------------------------------------
// 本体
// ------------------------------------------------------------

/** ZIP 内の親フォルダ名。Unity にはこのフォルダごと 1 回でドロップできる */
const PARENT_DIR = "ProxyzCards";

/**
 * インポータ単体の ZIP。
 * カード ZIP とは別配布にする（初回に 1 度だけ取り込めばよく、
 * 毎回同梱するとクラス二重定義でコンパイルエラーになるため）。
 */
export function buildImporterZip(): Blob {
  return createZip([
    { path: "ProxyzImporter/Editor/ProxyzCardImporter.cs", data: UNITY_IMPORTER_CS },
    { path: "ProxyzImporter/README.txt", data: buildImporterReadme() },
  ]);
}

/** カード一覧まるごとの Unity 書き出し ZIP を作る */
export async function buildUnityCardsPackage(input: UnityBulkExportInput): Promise<Blob> {
  const { cards, mode, fontOf } = input;

  // テキスト実測の前に、全カードで使う Web フォントを確実に読み込む。
  // 未読込のままだと measureText がフォールバックフォントで測られ、
  // Unity 側のサイズ・配置が実際の見た目とズレる。
  if (typeof document !== "undefined" && document.fonts) {
    try {
      await Promise.all(
        cards.flatMap((c) =>
          c.layers
            .filter((l) => l.visible && l.type === "text" && l.value)
            .map((l) => document.fonts.load(fontOf(l), l.value).catch(() => []))
        )
      );
    } catch {
      // フォント API 未対応環境ではそのまま続行
    }
  }

  const files: ZipEntry[] = [];
  const usedRootNames = new Set<string>();
  for (const card of cards) {
    await emitCardFiles(files, card, mode, fontOf, usedRootNames);
  }
  files.push({ path: `${PARENT_DIR}/README.txt`, data: buildReadme(mode, cards.length) });
  return createZip(files);
}

/** カード 1 枚ぶんのファイル群（card.json + Textures）を files に追加する */
async function emitCardFiles(
  files: ZipEntry[],
  input: UnityCardInput,
  mode: UnityMode,
  fontOf: (layer: ExportLayer) => string,
  usedRootNames: Set<string>
): Promise<void> {
  const { cardName, canvasData, baseData, layers } = input;

  // カードフォルダ名。カード名が重複していてもフォルダは分ける
  let rootName = safeName(cardName, "ProxyzCard");
  let suffix = 2;
  while (usedRootNames.has(rootName)) rootName = `${safeName(cardName, "ProxyzCard")}_${suffix++}`;
  usedRootNames.add(rootName);
  const rootPath = `${PARENT_DIR}/${rootName}`;

  const jsonLayers: JsonLayer[] = [];

  const cw = canvasData.width;
  const ch = canvasData.height;
  const baseW = cw * (baseData.width / 100);
  const baseH = ch * (baseData.height / 100);
  const baseX = cw / 2 - baseW / 2;
  const baseY = ch / 2 - baseH / 2;

  const usedNames = new Set<string>();
  const uniqueName = (base: string) => {
    let name = base;
    let i = 2;
    while (usedNames.has(name)) name = `${base}_${i++}`;
    usedNames.add(name);
    return name;
  };

  const emptyLayer = (): JsonLayer => ({
    name: "",
    kind: "image",
    component: "auto",
    centerX: 0,
    centerY: 0,
    width: 0,
    height: 0,
    rotation: 0,
    opacity: 1,
    image: "",
    text: "",
    fontSize: 0,
    bold: false,
    align: "center",
    colorHex: "#ffffff",
  });

  // ---- ベース（カード地 + カード本体の合成 1 枚）----
  // 角丸クリップ・ズーム・カード地の色を Web 版と同じ見た目で焼き込む
  {
    const composite = await renderBaseComposite(canvasData, baseData);
    if (composite) {
      const name = uniqueName("Base");
      const rel = `Textures/${name}.png`;
      files.push({ path: `${rootPath}/${rel}`, data: composite });
      jsonLayers.push({
        ...emptyLayer(),
        name,
        kind: "image",
        component: "auto",
        centerX: cw / 2,
        centerY: ch / 2,
        width: cw,
        height: ch,
        image: rel,
      });
    }
  }

  // ---- 各レイヤー ----
  for (let i = 0; i < layers.length; i++) {
    const layer = layers[i];
    if (!layer.visible) continue;
    if (layer.unityComponent === "skip") continue;

    const [posX, posY] = positionOf(layer.PositionPreset, baseX, baseY, baseW, baseH);
    const x = posX + layer.positionAdjX;
    const y = posY + layer.positionAdjY;
    const rotation = layer.rotation ?? 0;

    // ---------- 画像レイヤー ----------
    if (layer.type === "image") {
      if (!layer.value) continue;
      const name = uniqueName(safeName(layer.title, `Layer_${i + 1}`));
      const rel = `Textures/${name}.png`;
      files.push({ path: `${rootPath}/${rel}`, data: await imageToPngBytes(layer.value) });
      jsonLayers.push({
        ...emptyLayer(),
        name,
        kind: "image",
        component: layer.unityComponent ?? "auto",
        centerX: x,
        centerY: y,
        width: ((layer.imageWidth ?? 100) / 100) * baseW,
        height: ((layer.imageHeight ?? 100) / 100) * baseH,
        rotation,
        opacity: layer.opacity ?? 1,
        image: rel,
      });
      continue;
    }

    // ---------- テキストレイヤー ----------
    const font = fontOf(layer);
    const { textW, textH } = measureText(layer, font);
    const boxW = textW + layer.textPadding * 2;
    const boxH = textH + layer.textPadding * 2;

    // Canvas はアンカー点 (x, y) を軸に回転させるが、Unity 側は
    // 中心ピボットで回転する。中心座標を出すときにアンカーからの
    // オフセットを回転させておけば、両者の最終位置は完全に一致する。
    const rad = (rotation * Math.PI) / 180;
    const rotatedCenter = (offsetX: number): { cx: number; cy: number } => ({
      cx: x + offsetX * Math.cos(rad),
      cy: y + offsetX * Math.sin(rad), // canvas 座標系（y 下向き・時計回り正）
    });

    const isButton = layer.unityComponent === "button";

    // 背景（角丸・ベベル込みで PNG に焼く）
    // 通常テキスト: 独立した表示レイヤーとして出す
    // ボタン: 独立レイヤーにせず、ボタン本体の見た目として統合する
    let buttonBgRel = "";
    if (layer.backGround) {
      // Canvas 側は textAlign によって背景の左端位置が変わる
      const bgOffsetX =
        layer.textAlign === "center" ? 0 : layer.textAlign === "right" ? -boxW / 2 : boxW / 2;
      const dataUrl = renderTextBackground(layer, boxW, boxH);
      // 壊れた canvas は "data:," を返すことがあるので、正当な PNG のときだけ採用
      if (dataUrl && dataUrl.startsWith("data:image/png")) {
        const name = uniqueName(`${safeName(layer.title, `Layer_${i + 1}`)}_BG`);
        const rel = `Textures/${name}.png`;
        const bgCenter = rotatedCenter(bgOffsetX);
        files.push({ path: `${rootPath}/${rel}`, data: dataUrlToBytes(dataUrl) });
        if (isButton) {
          buttonBgRel = rel;
        } else {
          jsonLayers.push({
            ...emptyLayer(),
            name,
            kind: "textbg",
            component: "auto",
            centerX: bgCenter.cx,
            centerY: bgCenter.cy,
            width: boxW,
            height: boxH,
            rotation,
            image: rel,
          });
        }
      }
    }

    // テキスト本体。Canvas は textAlign を基準に x を解釈するので、
    // 中心座標に直してから渡す
    const textOffsetX =
      layer.textAlign === "center" ? 0 : layer.textAlign === "right" ? -textW / 2 : textW / 2;
    const textCenter = rotatedCenter(textOffsetX);

    // ボタンの場合、当たり判定の矩形は背景ボックス全体にする
    // （背景なしボタンはテキストの実寸が当たり判定になる）
    const useBox = isButton && buttonBgRel !== "";
    const bgOffsetXForBtn =
      layer.textAlign === "center" ? 0 : layer.textAlign === "right" ? -boxW / 2 : boxW / 2;
    const btnCenter = rotatedCenter(bgOffsetXForBtn);

    jsonLayers.push({
      ...emptyLayer(),
      name: uniqueName(safeName(layer.title, `Text_${i + 1}`)),
      kind: "text",
      component: layer.unityComponent ?? "auto",
      centerX: useBox ? btnCenter.cx : textCenter.cx,
      centerY: useBox ? btnCenter.cy : textCenter.cy,
      width: useBox ? boxW : textW,
      height: useBox ? boxH : textH,
      rotation,
      opacity: 1,
      image: buttonBgRel,
      text: layer.value,
      fontSize: layer.fontSize,
      bold: layer.fontStyle === "Bold",
      align: layer.textAlign,
      colorHex: layer.fontColor,
    });
  }

  const card: JsonCard = {
    cardName: rootName,
    canvasWidth: cw,
    canvasHeight: ch,
    pixelsPerUnit: PPU,
    mode,
    layers: jsonLayers,
  };

  files.push({ path: `${rootPath}/card.json`, data: JSON.stringify(card, null, 2) });
}

function buildReadme(mode: UnityMode, cardCount: number): string {
  return `Proxyz - Unity 書き出し（カード ${cardCount} 枚）
================================

書き出しモード: ${mode === "3d" ? "3D（Quad + TextMeshPro）" : "2D（Sprite + Canvas UI）"}

■ 事前準備（初回のみ）
Prefab 生成ツール「ProxyzImporter」が必要です。
Proxyz の「取込ツール」ボタンからダウンロードして、
ProxyzImporter フォルダを Assets/ に入れておいてください。
（メニューに Tools > Proxyz が見えていれば導入済みです）

■ 使い方
1. この「ProxyzCards」フォルダごと Assets/ にドラッグ＆ドロップします。
2. メニューの Tools > Proxyz > カードを Prefab にする を開きます。
3. 「カードフォルダ（一括）」に ProxyzCards フォルダを D&D します。
4. 「TMP フォントアセット」に日本語対応のフォントアセットを指定します。
5. 「Prefab を生成」を押すと、各カードフォルダの Prefabs/ に
   全カードの Prefab が一括生成されます。

1 枚だけ生成したい場合は「レイアウト JSON（単体）」に
そのカードの card.json を指定してください。

■ スケール
100 ピクセル = 1 Unity ユニット で生成します。

■ 日本語について
TextMeshPro の既定フォントには日本語が含まれません。
日本語フォントから作成した TMP フォントアセットを指定してください。

■ 再現される要素
- レイヤーの配置・サイズ・回転
- 画像レイヤー（スプライト / Quad）
- テキストの内容・サイズ・色・太字・寄せ
- テキスト背景（角丸とベベルは画像として焼き込み済み）
- カード外周の角丸（Base 画像に焼き込み。角丸の外は透明）
- ボタン指定したレイヤー（UGUI の Image + Button として生成、
  テキストは子の TMP ラベルになります）

■ ボタンについて
「ボタンにする」を指定したレイヤーは Canvas 配下の UI ボタンとして
生成されます。クリック時の処理（OnClick）は Unity 側で設定してください。
実行時にボタンを反応させるには、シーンに EventSystem が必要です
（Hierarchy 右クリック > UI > Event System）。

■ 再現されない要素
- ドロップシャドウ / 文字のアウトライン / テキストの動的な折り返し
これらが必要な場合は PNG 書き出しをご利用ください。

Generated by Proxyz - https://proxyz.synapstudio.com
`;
}

function buildImporterReadme(): string {
  return `Proxyz - Unity 取込ツール
==========================

■ 導入（初回のみ）
この「ProxyzImporter」フォルダごと、Unity プロジェクトの
Assets/ 配下にドラッグ＆ドロップしてください。
コンパイル後、メニューに Tools > Proxyz が追加されます。

■ 注意
このフォルダは 1 プロジェクトに 1 つだけ入れてください。
二重に入れるとクラスの重複でコンパイルエラーになります。
（ツールを更新するときは、古い ProxyzImporter フォルダを
削除してから新しいものを入れてください）

カードデータ本体は Proxyz の「Unity」ボタンから
別途書き出してください。

Generated by Proxyz - https://proxyz.synapstudio.com
`;
}