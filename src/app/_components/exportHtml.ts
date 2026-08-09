// ============================================================
// HTML Canvas 書き出し
// ------------------------------------------------------------
// カード 1 枚を <canvas> で再現する単体完結の .html を生成する。
// 画像はすべて data URL としてカードデータ内に既に入っているため、
// JSON をそのまま埋め込むだけで自己完結する（外部ファイル参照ゼロ）。
//
// ⚠ 保守上の注意:
//   下の DRAW_SOURCE は CardMaker.tsx の描画処理を写したもの。
//   CardMaker 側の描画を変更したら、ここも合わせて更新すること。
//   （バンドラの minify を経由せず素の JS を出力する必要があるため、
//     アプリ側の関数を再利用せず意図的に複製している）
// ============================================================

import { FONT_PRESETS } from "./fontPresets";

export type HtmlExportInput = {
  cardName: string;
  canvasData: unknown;
  baseData: unknown;
  layers: unknown[];
  /** FONT_PRESETS の id → font-family 文字列 */
  fontMap: Record<string, string>;
};

/** 生成 HTML に埋め込む描画コード（素の JavaScript） */
const DRAW_SOURCE = String.raw`
function getFontFamily(id) {
  return FONT_MAP[id] || "sans-serif";
}

function hexToRGBA(hex, alpha) {
  var h = String(hex || "#000000").replace("#", "");
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  var r = parseInt(h.slice(0, 2), 16);
  var g = parseInt(h.slice(2, 4), 16);
  var b = parseInt(h.slice(4, 6), 16);
  return "rgba(" + r + ", " + g + ", " + b + ", " + (alpha == null ? 1 : alpha) + ")";
}

function drawRoundedRect(ctx, x, y, w, h, r) {
  var radius = Math.max(0, Math.min(r || 0, Math.min(w, h) / 2));
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

function drawBevel(ctx, x, y, w, h, radius, size, intensity, style) {
  if (size <= 0 || intensity <= 0) return;
  var light = "rgba(255, 255, 255, " + intensity + ")";
  var dark = "rgba(0, 0, 0, " + intensity * 0.8 + ")";
  var topLeft = style === "raised" ? light : dark;
  var bottomRight = style === "raised" ? dark : light;

  ctx.save();
  drawRoundedRect(ctx, x, y, w, h, radius);
  ctx.clip();
  ctx.lineWidth = size * 2;
  ctx.filter = "blur(" + Math.max(0.5, size * 0.4) + "px)";

  ctx.strokeStyle = topLeft;
  ctx.beginPath();
  drawRoundedRect(ctx, x + size * 0.5, y + size * 0.5, w, h, radius);
  ctx.stroke();

  ctx.strokeStyle = bottomRight;
  ctx.beginPath();
  drawRoundedRect(ctx, x - size * 0.5, y - size * 0.5, w, h, radius);
  ctx.stroke();

  ctx.filter = "none";
  ctx.restore();
}

function loadImageAsync(src) {
  return new Promise(function (resolve, reject) {
    var img = new Image();
    img.onload = function () { resolve(img); };
    img.onerror = reject;
    img.src = src;
  });
}

function getLayerPosition(preset, baseX, baseY, baseW, baseH) {
  var map = {
    "top-left": [0, 0],
    "top-center": [baseW / 2, 0],
    "top-right": [baseW, 0],
    "center-left": [0, baseH / 2],
    "center": [baseW / 2, baseH / 2],
    "center-right": [baseW, baseH / 2],
    "bottom-left": [0, baseH],
    "bottom-center": [baseW / 2, baseH],
    "bottom-right": [baseW, baseH]
  };
  var rel = map[preset] || map["center"];
  return [baseX + rel[0], baseY + rel[1]];
}

async function drawCard(canvas, canvasData, baseData, layers) {
  var ctx = canvas.getContext("2d");
  canvas.width = canvasData.width;
  canvas.height = canvasData.height;

  // Web フォントを明示的に読み込む。
  // canvas の ctx.font はフォントのダウンロードを発動しないため、
  // document.fonts.load() に「実際に描く文字列」を渡して取得させる。
  // （Google Fonts の日本語は unicode-range で分割されているので、
  //   文字列を渡さないとラテン文字分しか読み込まれない）
  if (document.fonts && document.fonts.load) {
    var fontLoads = [];
    for (var fi = 0; fi < layers.length; fi++) {
      var fl = layers[fi];
      if (fl.type !== "text" || !fl.value || !fl.visible) continue;
      var spec = (fl.fontStyle === "Bold" ? "bold " : "") + fl.fontSize + "px " + getFontFamily(fl.fontFamily);
      try {
        fontLoads.push(document.fonts.load(spec, String(fl.value)).catch(function () { return []; }));
      } catch (e) {}
    }
    try { await Promise.all(fontLoads); } catch (e) {}
  }
  if (document.fonts && document.fonts.ready) {
    try { await document.fonts.ready; } catch (e) {}
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // カード全体を外周の角丸でクリップ（CardMaker と同じ挙動）
  ctx.save();
  drawRoundedRect(ctx, 0, 0, canvas.width, canvas.height, canvasData.radius);
  ctx.clip();

  ctx.fillStyle = canvasData.bgColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  var baseW = canvas.width * (baseData.width / 100);
  var baseH = canvas.height * (baseData.height / 100);
  var baseX = canvas.width / 2 - baseW / 2;
  var baseY = canvas.height / 2 - baseH / 2;

  if (baseData.imageSrc && baseData.imageSrc !== "null") {
    try {
      var bimg = await loadImageAsync(baseData.imageSrc);
      ctx.save();
      drawRoundedRect(ctx, baseX, baseY, baseW, baseH, baseData.radius);
      ctx.clip();
      ctx.drawImage(
        bimg,
        baseX + (baseData.imagePositionX / 100) * baseW - (baseData.imageWidth / 200) * baseW,
        baseY + (baseData.imagePositionY / 100) * baseH - (baseData.imageHight / 200) * baseH,
        (baseData.imageWidth / 100) * baseW,
        (baseData.imageHight / 100) * baseH
      );
      ctx.restore();
    } catch (e) {}
  } else {
    ctx.save();
    drawRoundedRect(ctx, baseX, baseY, baseW, baseH, baseData.radius);
    ctx.clip();
    ctx.fillStyle = baseData.bgColor;
    ctx.fill();
    ctx.restore();
  }

  for (var i = 0; i < layers.length; i++) {
    var layer = layers[i];
    if (!layer.visible) continue;
    var pos = getLayerPosition(layer.PositionPreset, baseX, baseY, baseW, baseH);
    var x = pos[0] + layer.positionAdjX;
    var y = pos[1] + layer.positionAdjY;

    if (layer.type === "text") {
      ctx.save();
      ctx.translate(x, y);
      if (layer.rotation) ctx.rotate((layer.rotation * Math.PI) / 180);

      ctx.font = (layer.fontStyle === "Bold" ? "bold " : "") + layer.fontSize + "px " + getFontFamily(layer.fontFamily);
      ctx.textAlign = layer.textAlign;
      ctx.textBaseline = "middle";

      var lines = String(layer.value).split("\n");
      var lineHeight = layer.fontSize * 1.2;
      var maxLineWidth = 0;
      for (var li = 0; li < lines.length; li++) {
        maxLineWidth = Math.max(maxLineWidth, ctx.measureText(lines[li]).width);
      }
      var textW = maxLineWidth + layer.textPadding * 2;
      var textH = lineHeight * lines.length + layer.textPadding * 2;

      var rectX = 0;
      if (layer.textAlign === "center") rectX = -textW / 2;
      else if (layer.textAlign === "right") rectX = -textW;
      var rectY = -textH / 2;

      if (layer.backGround) {
        ctx.save();
        drawRoundedRect(ctx, rectX, rectY, textW, textH, layer.bgRadius);
        ctx.fillStyle = hexToRGBA(layer.bgColor, layer.bgOpacity);
        ctx.fill();
        ctx.restore();

        if (layer.bevelEnabled) {
          drawBevel(
            ctx, rectX, rectY, textW, textH, layer.bgRadius,
            layer.bevelSize == null ? 4 : layer.bevelSize,
            layer.bevelIntensity == null ? 0.6 : layer.bevelIntensity,
            layer.bevelStyle || "raised"
          );
        }
      }

      if (layer.shadowEnabled) {
        ctx.shadowColor = hexToRGBA(layer.shadowColor || "#000000", layer.shadowOpacity == null ? 0.5 : layer.shadowOpacity);
        ctx.shadowBlur = layer.shadowBlur == null ? 4 : layer.shadowBlur;
        ctx.shadowOffsetX = layer.shadowOffsetX == null ? 2 : layer.shadowOffsetX;
        ctx.shadowOffsetY = layer.shadowOffsetY == null ? 2 : layer.shadowOffsetY;
      }

      ctx.strokeStyle = layer.fontOutline;
      ctx.fillStyle = layer.fontColor;
      ctx.lineWidth = 1;
      for (var lj = 0; lj < lines.length; lj++) {
        var offsetY = (lj - (lines.length - 1) / 2) * lineHeight;
        ctx.strokeText(lines[lj], 0, offsetY);
        ctx.fillText(lines[lj], 0, offsetY);
      }
      ctx.restore();
    }

    if (layer.type === "image" && layer.value) {
      try {
        var img = await loadImageAsync(layer.value);
        var imgW = ((layer.imageWidth == null ? 100 : layer.imageWidth) / 100) * baseW;
        var imgH = ((layer.imageHeight == null ? 100 : layer.imageHeight) / 100) * baseH;
        ctx.save();
        ctx.translate(x, y);
        if (layer.rotation) ctx.rotate((layer.rotation * Math.PI) / 180);

        if (layer.shadowEnabled) {
          ctx.save();
          ctx.shadowColor = hexToRGBA(layer.shadowColor || "#000000", layer.shadowOpacity == null ? 0.5 : layer.shadowOpacity);
          ctx.shadowBlur = layer.shadowBlur == null ? 4 : layer.shadowBlur;
          ctx.shadowOffsetX = layer.shadowOffsetX == null ? 2 : layer.shadowOffsetX;
          ctx.shadowOffsetY = layer.shadowOffsetY == null ? 2 : layer.shadowOffsetY;
          ctx.fillStyle = "rgba(0, 0, 0, 1)";
          drawRoundedRect(ctx, -imgW / 2, -imgH / 2, imgW, imgH, layer.bgRadius);
          ctx.fill();
          ctx.restore();
        }

        drawRoundedRect(ctx, -imgW / 2, -imgH / 2, imgW, imgH, layer.bgRadius);
        ctx.clip();
        ctx.globalAlpha = layer.opacity == null ? 1 : layer.opacity;
        ctx.drawImage(img, -imgW / 2, -imgH / 2, imgW, imgH);
        ctx.globalAlpha = 1;
        ctx.restore();
      } catch (e) {}
    }
  }

  // 外周角丸クリップの解除
  ctx.restore();
}
`;

/** JSON を <script> 内に安全に埋め込む */
function safeJson(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildStandaloneHtml(input: HtmlExportInput): string {
  const { cardName, canvasData, baseData, layers, fontMap } = input;

  // 使われている Web フォントだけを読み込む
  const usedFontIds = new Set<string>(
    (layers as { fontFamily?: string }[])
      .map((l) => l.fontFamily ?? "sans")
      .filter(Boolean)
  );
  const needsWebFont = FONT_PRESETS.some(
    (f) => f.isWebFont && usedFontIds.has(f.id)
  );
  const fontLink = needsWebFont
    ? `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c:wght@400;700&family=Noto+Serif+JP:wght@400;700&family=Dela+Gothic+One&display=block">`
    : "";

  const title = escapeHtml(cardName || "Proxyz Card");

  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
${fontLink}
<style>
  :root { color-scheme: light dark; }
  body {
    margin: 0;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    background: #1a1c20;
    color: #e8e8ea;
    font-family: system-ui, sans-serif;
  }
  canvas {
    max-width: min(90vw, 480px);
    height: auto;
    border-radius: 8px;
    box-shadow: 0 8px 32px rgba(0,0,0,.5);
  }
  .bar { display: flex; gap: 8px; align-items: center; }
  button {
    font: inherit;
    padding: 8px 16px;
    border-radius: 6px;
    border: 1px solid #4b4f57;
    background: #2a2d33;
    color: inherit;
    cursor: pointer;
  }
  button:hover { background: #343840; }
  .credit { font-size: 12px; opacity: .55; }
  .credit a { color: inherit; }
</style>
</head>
<body>
<canvas id="card"></canvas>
<div class="bar">
  <button id="save">PNGで保存</button>
</div>
<p class="credit">Generated by <a href="https://proxyz.synapstudio.com" target="_blank" rel="noopener">Proxyz</a></p>

<script>
var FONT_MAP = ${safeJson(fontMap)};
var CANVAS_DATA = ${safeJson(canvasData)};
var BASE_DATA = ${safeJson(baseData)};
var LAYERS = ${safeJson(layers)};
${DRAW_SOURCE}

var canvas = document.getElementById("card");
drawCard(canvas, CANVAS_DATA, BASE_DATA, LAYERS);

document.getElementById("save").addEventListener("click", function () {
  canvas.toBlob(function (blob) {
    if (!blob) return;
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = ${safeJson((cardName || "card") + ".png")};
    a.click();
    URL.revokeObjectURL(url);
  }, "image/png");
});
</script>
</body>
</html>
`;
}

/** FONT_PRESETS から id→family のマップを作る */
export function buildFontMap(): Record<string, string> {
  const map: Record<string, string> = {};
  for (const f of FONT_PRESETS) map[f.id] = f.family;
  return map;
}