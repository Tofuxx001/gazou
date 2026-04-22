"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import {
  TextArea,
  Slider,
  Switch,
  Select,
  Button,
  IconButton,
  Callout,
  Tooltip,
  Separator,
} from "@radix-ui/themes";
import {
  Trash2,
  FilePen,
  Download,
  Save,
  Plus,
  Image as ImageIcon,
  Type,
  Settings2,
  Layers,
  AlertCircle,
  RotateCcw,
} from "lucide-react";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { DndContext, DragEndEvent } from "@dnd-kit/core";
import { SortableItem } from "./SortableItem";
import { ColorSwatch } from "./ColorSwatch";
import { NumberField } from "./NumberField";
import { Disclosure } from "./Disclosure";
import { CARD_PRESETS } from "./cardPresets";

const AUTOSAVE_KEY = "proxyz:autosave:v1";

type Color = `#${string}`;

type Layer = {
  id: string;
  type: "text" | "image";
  title: string;
  visible: boolean;
  value: string;
  zIndex: number;
  fontStyle: "thin" | "normal" | "Bold";
  fontSize: number;
  textAlign: "left" | "center" | "right";
  fontColor: Color;
  fontOutline: Color;
  PositionPreset:
    | "top-left"
    | "top-center"
    | "top-right"
    | "center-left"
    | "center"
    | "center-right"
    | "bottom-left"
    | "bottom-center"
    | "bottom-right";
  positionAdjX: number;
  positionAdjY: number;
  backGround: boolean;
  textPadding: number;
  bgColor: Color;
  bgRadius: number;
  bgOpacity: number;
  imageWidth?: number;
  imageHeight?: number;
  fitStyle?: "contain" | "cover";
  opacity?: number;
  // === 効果 ===
  rotation?: number; // degrees, -180..180
  shadowEnabled?: boolean;
  shadowColor?: Color;
  shadowBlur?: number; // px
  shadowOffsetX?: number; // px
  shadowOffsetY?: number; // px
  shadowOpacity?: number; // 0..1
};

type CanvasData = {
  cardID: number;
  width: number;
  height: number;
  bgColor: Color;
  radius: number;
};

type BaseData = {
  width: number;
  height: number;
  bgColor: Color;
  radius: number;
  imageSrc: string;
  imageWidth: number;
  imageHight: number;
  imagePositionX: number;
  imagePositionY: number;
};

type TableRow = {
  id: number;
  name?: string;
  thumbnail?: string;
  values: Record<string, string>;
  layersSnapshot: Layer[];
  canvasSnapshot: CanvasData;
  baseSnapshot: BaseData;
};

const POSITION_PRESETS: Layer["PositionPreset"][] = [
  "top-left",
  "top-center",
  "top-right",
  "center-left",
  "center",
  "center-right",
  "bottom-left",
  "bottom-center",
  "bottom-right",
];

export default function CardMaker() {
  // ============================================================
  // State
  // ============================================================
  const [canvasData, setCanvasData] = useState<CanvasData>({
    cardID: -1,
    width: 744, // 63mm @ 300dpi
    height: 1039, // 88mm @ 300dpi
    bgColor: "#ffffff",
    radius: 24,
  });

  const [baseData, setBaseData] = useState<BaseData>({
    width: 90,
    height: 90,
    bgColor: "#ffffff",
    radius: 0,
    imageSrc: "null",
    imageWidth: 100,
    imageHight: 100,
    imagePositionX: 50,
    imagePositionY: 50,
  });

  const [layers, setLayers] = useState<Layer[]>([]);
  const [tableRows, setTableRows] = useState<TableRow[]>([]);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [copiedStyle, setCopiedStyle] = useState<Partial<Layer> | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [toast, setToast] = useState<{
    msg: string;
    type: "ok" | "err";
  } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // ============================================================
  // Helpers
  // ============================================================
  function showToast(msg: string, type: "ok" | "err" = "ok") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2200);
  }

  function hexToRGBA(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  function drawRoundedRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ) {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + width, y, x + width, y + height, r);
    ctx.arcTo(x + width, y + height, x, y + height, r);
    ctx.arcTo(x, y + height, x, y, r);
    ctx.arcTo(x, y, x + width, y, r);
    ctx.closePath();
  }

  function loadImageAsync(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  function getLayerPosition(
    preset: Layer["PositionPreset"],
    baseX: number,
    baseY: number,
    baseW: number,
    baseH: number
  ): [number, number] {
    const posMap: Record<Layer["PositionPreset"], [number, number]> = {
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
    const [relX, relY] = posMap[preset];
    return [baseX + relX, baseY + relY];
  }

  // ============================================================
  // Persistence (localStorage autosave)
  // ============================================================
  useEffect(() => {
    try {
      const raw = localStorage.getItem(AUTOSAVE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved.canvasData) setCanvasData(saved.canvasData);
        if (saved.baseData) setBaseData(saved.baseData);
        if (Array.isArray(saved.layers)) setLayers(saved.layers);
        if (Array.isArray(saved.tableRows)) setTableRows(saved.tableRows);
      }
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const handle = setTimeout(() => {
      try {
        localStorage.setItem(
          AUTOSAVE_KEY,
          JSON.stringify({ canvasData, baseData, layers, tableRows })
        );
      } catch {}
    }, 500);
    return () => clearTimeout(handle);
  }, [canvasData, baseData, layers, tableRows, hydrated]);

  // ============================================================
  // Canvas rendering
  // ============================================================
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const drawAll = async () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = canvasData.bgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const baseW = canvas.width * (baseData.width / 100);
      const baseH = canvas.height * (baseData.height / 100);
      const baseX = canvas.width / 2 - baseW / 2;
      const baseY = canvas.height / 2 - baseH / 2;

      if (baseData.imageSrc !== "null") {
        try {
          const img = await loadImageAsync(baseData.imageSrc);
          ctx.save();
          drawRoundedRect(ctx, baseX, baseY, baseW, baseH, baseData.radius);
          ctx.clip();
          ctx.drawImage(
            img,
            baseX +
              (baseData.imagePositionX / 100) * baseW -
              (baseData.imageWidth / 200) * baseW,
            baseY +
              (baseData.imagePositionY / 100) * baseH -
              (baseData.imageHight / 200) * baseH,
            (baseData.imageWidth / 100) * baseW,
            (baseData.imageHight / 100) * baseH
          );
          ctx.restore();
        } catch {}
      } else {
        ctx.save();
        drawRoundedRect(ctx, baseX, baseY, baseW, baseH, baseData.radius);
        ctx.clip();
        ctx.fillStyle = baseData.bgColor;
        ctx.fill();
        ctx.restore();
      }

      for (const layer of layers) {
        if (!layer.visible) continue;
        const [posX, posY] = getLayerPosition(
          layer.PositionPreset,
          baseX,
          baseY,
          baseW,
          baseH
        );
        const x = posX + layer.positionAdjX;
        const y = posY + layer.positionAdjY;

        if (layer.type === "text") {
          ctx.save();
          // 回転と移動 — 描画は (0,0) を中心とした座標系で行う
          ctx.translate(x, y);
          if (layer.rotation) {
            ctx.rotate((layer.rotation * Math.PI) / 180);
          }

          ctx.font = `${layer.fontStyle === "Bold" ? "bold " : ""}${
            layer.fontSize
          }px sans-serif`;
          ctx.textAlign = layer.textAlign;
          ctx.textBaseline = "middle";
          const lines = layer.value.split("\n");
          const lineHeight = layer.fontSize * 1.2;
          const maxLineWidth = Math.max(
            ...lines.map((line) => ctx.measureText(line).width)
          );
          const textW = maxLineWidth + layer.textPadding * 2;
          const textH = lineHeight * lines.length + layer.textPadding * 2;

          let rectX = 0;
          if (layer.textAlign === "center") rectX = -textW / 2;
          else if (layer.textAlign === "right") rectX = -textW;
          const rectY = -textH / 2;

          // 背景 — 影は付けない
          if (layer.backGround) {
            ctx.save();
            drawRoundedRect(ctx, rectX, rectY, textW, textH, layer.bgRadius);
            ctx.fillStyle = hexToRGBA(layer.bgColor, layer.bgOpacity);
            ctx.fill();
            ctx.restore();
          }

          // 文字 — 影を適用
          if (layer.shadowEnabled) {
            ctx.shadowColor = hexToRGBA(
              layer.shadowColor ?? "#000000",
              layer.shadowOpacity ?? 0.5
            );
            ctx.shadowBlur = layer.shadowBlur ?? 4;
            ctx.shadowOffsetX = layer.shadowOffsetX ?? 2;
            ctx.shadowOffsetY = layer.shadowOffsetY ?? 2;
          }

          ctx.strokeStyle = layer.fontOutline;
          ctx.fillStyle = layer.fontColor;
          ctx.lineWidth = 1;
          lines.forEach((line, i) => {
            const offsetY = (i - (lines.length - 1) / 2) * lineHeight;
            ctx.strokeText(line, 0, offsetY);
            ctx.fillText(line, 0, offsetY);
          });
          ctx.restore();
        }

        if (layer.type === "image" && layer.value) {
          try {
            const img = await loadImageAsync(layer.value);
            const imgW = ((layer.imageWidth ?? 100) / 100) * baseW;
            const imgH = ((layer.imageHeight ?? 100) / 100) * baseH;
            ctx.save();
            // 回転と移動 — 画像中心を原点に
            ctx.translate(x, y);
            if (layer.rotation) {
              ctx.rotate((layer.rotation * Math.PI) / 180);
            }

            // 影を別レイヤーとして先に描く（クリップ前）
            // クリップ後だと影がクリップ範囲で切れてしまうため
            if (layer.shadowEnabled) {
              ctx.save();
              ctx.shadowColor = hexToRGBA(
                layer.shadowColor ?? "#000000",
                layer.shadowOpacity ?? 0.5
              );
              ctx.shadowBlur = layer.shadowBlur ?? 4;
              ctx.shadowOffsetX = layer.shadowOffsetX ?? 2;
              ctx.shadowOffsetY = layer.shadowOffsetY ?? 2;
              ctx.fillStyle = "rgba(0, 0, 0, 1)";
              drawRoundedRect(
                ctx,
                -imgW / 2,
                -imgH / 2,
                imgW,
                imgH,
                layer.bgRadius
              );
              ctx.fill();
              ctx.restore();
            }

            // 画像本体（角丸クリップ付き）
            drawRoundedRect(
              ctx,
              -imgW / 2,
              -imgH / 2,
              imgW,
              imgH,
              layer.bgRadius
            );
            ctx.clip();
            ctx.globalAlpha = layer.opacity ?? 1;
            ctx.drawImage(img, -imgW / 2, -imgH / 2, imgW, imgH);
            ctx.globalAlpha = 1;
            ctx.restore();
          } catch {}
        }
      }
    };

    drawAll();
  }, [canvasData, baseData, layers]);

  // ============================================================
  // Actions
  // ============================================================
  const exportCanvasPNG = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/png")
    );
    if (!blob) {
      showToast("PNG書き出しに失敗しました", "err");
      return;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `card-${
      canvasData.cardID === -1 ? "draft" : canvasData.cardID
    }.png`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("PNGを書き出しました");
  }, [canvasData.cardID]);

  function getThumbnail(): string | undefined {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    try {
      // 小さめのサムネイル(maxW=120)を別Canvasで生成
      const maxW = 120;
      const ratio = maxW / canvas.width;
      const tmp = document.createElement("canvas");
      tmp.width = Math.round(canvas.width * ratio);
      tmp.height = Math.round(canvas.height * ratio);
      const tctx = tmp.getContext("2d");
      if (!tctx) return undefined;
      tctx.drawImage(canvas, 0, 0, tmp.width, tmp.height);
      return tmp.toDataURL("image/png");
    } catch {
      return undefined;
    }
  }

  function saveAsNew() {
    const nextId =
      tableRows.reduce((max, row) => Math.max(max, Number(row.id)), 0) + 1;
    const newCanvas = { ...canvasData, cardID: nextId };
    setCanvasData(newCanvas);

    const currentValues = Object.fromEntries(
      layers.filter((l) => l.type === "text").map((l) => [l.title, l.value])
    );

    const newRow: TableRow = {
      id: nextId,
      name: `カード${tableRows.length + 1}`,
      thumbnail: getThumbnail(),
      values: currentValues,
      layersSnapshot: structuredClone(layers),
      canvasSnapshot: structuredClone(newCanvas),
      baseSnapshot: structuredClone(baseData),
    };
    setTableRows((prev) => [...prev, newRow]);
    showToast("新規保存しました");
  }

  function saveOverwrite() {
    const existingId = canvasData.cardID;
    if (existingId === -1) return;

    const currentValues = Object.fromEntries(
      layers.filter((l) => l.type === "text").map((l) => [l.title, l.value])
    );

    const updatedRow: TableRow = {
      id: existingId,
      name:
        tableRows.find((r) => r.id === existingId)?.name ??
        `カード${existingId}`,
      thumbnail: getThumbnail(),
      values: currentValues,
      layersSnapshot: structuredClone(layers),
      canvasSnapshot: structuredClone(canvasData),
      baseSnapshot: structuredClone(baseData),
    };
    setTableRows((prev) => {
      const index = prev.findIndex((r) => r.id === existingId);
      if (index === -1) return prev;
      const updated = [...prev];
      updated[index] = updatedRow;
      return updated;
    });
    showToast("上書き保存しました");
  }

  function loadCard(row: TableRow) {
    setCanvasData(row.canvasSnapshot);
    setBaseData(row.baseSnapshot);
    setLayers(row.layersSnapshot);
    setSelectedLayerId(null);
    showToast(`「${row.name}」を読み込みました`);
  }

  function saveJSON() {
    const data = { canvasData, baseData, layers, tableRows };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "proxyz-project.json";
    a.click();
    URL.revokeObjectURL(url);
    showToast("プロジェクトを書き出しました");
  }

  function loadJSON(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const json = JSON.parse(reader.result as string);
        if (
          json.canvasData &&
          json.baseData &&
          Array.isArray(json.layers) &&
          Array.isArray(json.tableRows)
        ) {
          setCanvasData(json.canvasData);
          setBaseData(json.baseData);
          setLayers(json.layers);
          setTableRows(json.tableRows);
          showToast("プロジェクトを読み込みました");
        } else {
          showToast("ファイル形式が正しくありません", "err");
        }
      } catch {
        showToast("JSONの読み込みに失敗しました", "err");
      }
    };
    reader.readAsText(file);
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setLayers((prev) => {
      const oldIndex = prev.findIndex((l) => l.id === active.id);
      const newIndex = prev.findIndex((l) => l.id === over.id);
      const updated = [...prev];
      const [moved] = updated.splice(oldIndex, 1);
      updated.splice(newIndex, 0, moved);
      return updated.map((layer, index) => ({ ...layer, zIndex: index }));
    });
  };

  function handleBaseImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () =>
      setBaseData((prev) => ({ ...prev, imageSrc: reader.result as string }));
    reader.readAsDataURL(file);
  }

  function addTextLayer() {
    setLayers((prev) => {
      const nextId = `${Date.now()}`;
      const maxZ = Math.max(...prev.map((l) => l.zIndex), 0);
      const newLayer: Layer = {
        id: nextId,
        type: "text",
        title: `テキスト${prev.filter((l) => l.type === "text").length + 1}`,
        value: "",
        visible: true,
        zIndex: maxZ + 1,
        fontStyle: "normal",
        fontSize: 32,
        textAlign: "center",
        fontColor: "#1a1a1a",
        fontOutline: "#ffffff",
        PositionPreset: "center",
        positionAdjX: 0,
        positionAdjY: 0,
        backGround: false,
        textPadding: 10,
        bgColor: "#ffffff",
        bgOpacity: 1,
        bgRadius: 4,
        rotation: 0,
        shadowEnabled: false,
        shadowColor: "#000000",
        shadowBlur: 4,
        shadowOffsetX: 2,
        shadowOffsetY: 2,
        shadowOpacity: 0.5,
      };
      setSelectedLayerId(nextId);
      return [...prev, newLayer];
    });
  }

  function addImageLayer() {
    setLayers((prev) => {
      const nextId = `${Date.now()}`;
      const maxZ = Math.max(...prev.map((l) => l.zIndex), 0);
      const newLayer: Layer = {
        id: nextId,
        type: "image",
        title: `画像${prev.filter((l) => l.type === "image").length + 1}`,
        value: "",
        visible: true,
        zIndex: maxZ + 1,
        fontStyle: "normal",
        fontSize: 20,
        textAlign: "left",
        fontColor: "#000000",
        fontOutline: "#000000",
        PositionPreset: "center",
        positionAdjX: 0,
        positionAdjY: 0,
        backGround: false,
        textPadding: 0,
        bgColor: "#ffffff",
        bgOpacity: 1,
        bgRadius: 0,
        imageWidth: 60,
        imageHeight: 60,
        fitStyle: "contain",
        opacity: 1,
        rotation: 0,
        shadowEnabled: false,
        shadowColor: "#000000",
        shadowBlur: 8,
        shadowOffsetX: 4,
        shadowOffsetY: 4,
        shadowOpacity: 0.4,
      };
      setSelectedLayerId(nextId);
      return [...prev, newLayer];
    });
  }

  function applyPreset(presetId: string) {
    const preset = CARD_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setCanvasData((prev) => ({
      ...prev,
      width: preset.width,
      height: preset.height,
    }));
    showToast(`「${preset.label}」を適用しました`);
  }

  // ============================================================
  // Derived state
  // ============================================================
  const canOverwrite = canvasData.cardID !== -1;
  const selectedLayer = layers.find((l) => l.id === selectedLayerId) ?? null;
  const updateSelectedLayer = (patch: Partial<Layer>) => {
    if (!selectedLayerId) return;
    setLayers((prev) =>
      prev.map((l) => (l.id === selectedLayerId ? { ...l, ...patch } : l))
    );
  };

  // ============================================================
  // Render
  // ============================================================
  return (
    <div className="bg-gray-50 min-h-screen">
      {/* ===== Top toolbar — プロジェクト操作 ===== */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-gray-200 px-4 py-2 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Settings2 size={14} />
          <span>編集中: </span>
          <span className="font-mono font-medium text-gray-900">
            {canOverwrite ? `カード #${canvasData.cardID}` : "未保存の下書き"}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Tooltip content="現在のカードをカード一覧に保存">
            <Button size="2" variant="solid" color="indigo" onClick={saveAsNew}>
              <Save size={14} /> 新規保存
            </Button>
          </Tooltip>
          <Tooltip
            content={
              canOverwrite
                ? "カード一覧の同IDを上書き"
                : "新規保存してから上書き可能"
            }>
            <Button
              size="2"
              variant="soft"
              color="indigo"
              disabled={!canOverwrite}
              onClick={saveOverwrite}>
              上書き
            </Button>
          </Tooltip>
          <Separator orientation="vertical" size="2" />
          <Tooltip content="現在のカードをPNG画像でダウンロード">
            <Button size="2" variant="surface" onClick={exportCanvasPNG}>
              <Download size={14} /> PNG書き出し
            </Button>
          </Tooltip>
          <Separator orientation="vertical" size="2" />
          <Tooltip content="プロジェクト全体をJSONで保存">
            <IconButton
              size="2"
              variant="ghost"
              onClick={saveJSON}
              aria-label="JSON保存">
              <Save size={14} />
            </IconButton>
          </Tooltip>
          <Tooltip content="JSONプロジェクトを読み込み">
            <label className="inline-flex items-center gap-1 px-2.5 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded cursor-pointer transition">
              JSON読込
              <input
                type="file"
                accept="application/json"
                onChange={loadJSON}
                className="hidden"
              />
            </label>
          </Tooltip>
        </div>
      </div>

      {/* ===== Main split — モバイルは縦, デスクトップは [sidebar | canvas | layers] ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_320px] gap-4 p-4">
        {/* ========== Left sidebar: プロジェクト設定 ========== */}
        <aside className="bg-white rounded-xl border border-gray-200 p-4 space-y-5 lg:max-h-[calc(100vh-120px)] lg:overflow-y-auto">
          <div>
            <h3 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-3 flex items-center gap-1.5">
              <Settings2 size={12} /> カードサイズ
            </h3>
            <Select.Root onValueChange={applyPreset}>
              <Select.Trigger
                placeholder="プリセットから選ぶ…"
                className="w-full"
              />
              <Select.Content>
                <Select.Group>
                  <Select.Label>TCGサイズ</Select.Label>
                  {CARD_PRESETS.filter((p) => p.category === "TCGサイズ").map(
                    (p) => (
                      <Select.Item key={p.id} value={p.id}>
                        {p.label}
                      </Select.Item>
                    )
                  )}
                </Select.Group>
                <Select.Group>
                  <Select.Label>ボドゲサイズ</Select.Label>
                  {CARD_PRESETS.filter(
                    (p) => p.category === "ボドゲサイズ"
                  ).map((p) => (
                    <Select.Item key={p.id} value={p.id}>
                      {p.label}
                    </Select.Item>
                  ))}
                </Select.Group>
                <Select.Group>
                  <Select.Label>その他</Select.Label>
                  {CARD_PRESETS.filter((p) => p.category === "その他").map(
                    (p) => (
                      <Select.Item key={p.id} value={p.id}>
                        {p.label}
                      </Select.Item>
                    )
                  )}
                </Select.Group>
              </Select.Content>
            </Select.Root>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <NumberField
                label="幅"
                unit="px"
                value={canvasData.width}
                onChange={(n) => setCanvasData((p) => ({ ...p, width: n }))}
              />
              <NumberField
                label="高さ"
                unit="px"
                value={canvasData.height}
                onChange={(n) => setCanvasData((p) => ({ ...p, height: n }))}
              />
              <NumberField
                label="角丸"
                unit="px"
                value={canvasData.radius}
                onChange={(n) => setCanvasData((p) => ({ ...p, radius: n }))}
              />
              <div className="flex flex-col gap-1">
                <span className="text-xs text-gray-600">背景色</span>
                <ColorSwatch
                  value={canvasData.bgColor}
                  onChange={(c) =>
                    setCanvasData((p) => ({ ...p, bgColor: c as Color }))
                  }
                />
              </div>
            </div>
          </div>

          <Separator size="4" />

          <div>
            <h3 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-3">
              ベース（カード本体）
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <NumberField
                label="幅"
                unit="%"
                value={baseData.width}
                min={0}
                max={100}
                onChange={(n) => setBaseData((p) => ({ ...p, width: n }))}
              />
              <NumberField
                label="高さ"
                unit="%"
                value={baseData.height}
                min={0}
                max={100}
                onChange={(n) => setBaseData((p) => ({ ...p, height: n }))}
              />
              <NumberField
                label="角丸"
                unit="px"
                value={baseData.radius}
                onChange={(n) => setBaseData((p) => ({ ...p, radius: n }))}
              />
              <div className="flex flex-col gap-1">
                <span className="text-xs text-gray-600">背景色</span>
                <ColorSwatch
                  value={baseData.bgColor}
                  onChange={(c) =>
                    setBaseData((p) => ({ ...p, bgColor: c as Color }))
                  }
                />
              </div>
            </div>

            <div className="mt-3 space-y-2">
              <label className="block">
                <span className="text-xs text-gray-600 block mb-1">
                  背景画像
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleBaseImageUpload}
                  className="text-xs file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 file:cursor-pointer"
                />
              </label>
              {baseData.imageSrc !== "null" && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <NumberField
                      label="画像幅"
                      unit="%"
                      value={baseData.imageWidth}
                      onChange={(n) =>
                        setBaseData((p) => ({ ...p, imageWidth: n }))
                      }
                    />
                    <NumberField
                      label="画像高さ"
                      unit="%"
                      value={baseData.imageHight}
                      onChange={(n) =>
                        setBaseData((p) => ({ ...p, imageHight: n }))
                      }
                    />
                    <NumberField
                      label="位置X"
                      unit="%"
                      value={baseData.imagePositionX}
                      onChange={(n) =>
                        setBaseData((p) => ({ ...p, imagePositionX: n }))
                      }
                    />
                    <NumberField
                      label="位置Y"
                      unit="%"
                      value={baseData.imagePositionY}
                      onChange={(n) =>
                        setBaseData((p) => ({ ...p, imagePositionY: n }))
                      }
                    />
                  </div>
                  <Button
                    size="1"
                    color="red"
                    variant="soft"
                    onClick={() =>
                      setBaseData((p) => ({ ...p, imageSrc: "null" }))
                    }>
                    <Trash2 size={12} /> 背景画像を外す
                  </Button>
                </>
              )}
            </div>
          </div>
        </aside>

        {/* ========== Center: Canvas stage ========== */}
        <main className="flex flex-col items-center justify-start gap-4">
          <div
            className="rounded-xl p-6 w-full flex items-center justify-center"
            style={{
              backgroundColor: "#e9eaee",
              backgroundImage: `linear-gradient(45deg, #d9dade 25%, transparent 25%),
                                linear-gradient(-45deg, #d9dade 25%, transparent 25%),
                                linear-gradient(45deg, transparent 75%, #d9dade 75%),
                                linear-gradient(-45deg, transparent 75%, #d9dade 75%)`,
              backgroundSize: "20px 20px",
              backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
              minHeight: "400px",
            }}>
            <canvas
              id="myCanvas"
              ref={canvasRef}
              width={canvasData.width}
              height={canvasData.height}
              className="shadow-2xl max-w-full max-h-[70vh] object-contain"
              style={{
                borderRadius: `${
                  canvasData.radius * Math.min(1, 600 / canvasData.width)
                }px`,
                backgroundColor: canvasData.bgColor,
                width: "auto",
                height: "auto",
                maxWidth: "100%",
              }}
            />
          </div>
          <div className="text-xs text-gray-500 text-center">
            実寸 {canvasData.width} × {canvasData.height} px
            （表示はコンテナに合わせて縮小されます）
          </div>

          {/* ===== カード一覧 — サムネイル + テーブル ===== */}
          <section className="w-full bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Layers size={14} /> カード一覧
                <span className="text-xs font-normal text-gray-500">
                  （全 {tableRows.length} 枚）
                </span>
              </h3>
              {tableRows.length > 0 && (
                <Button
                  size="1"
                  variant="ghost"
                  color="red"
                  onClick={() => {
                    if (
                      confirm("自動保存データを消去して初期状態に戻しますか？")
                    ) {
                      try {
                        localStorage.removeItem(AUTOSAVE_KEY);
                      } catch {}
                      location.reload();
                    }
                  }}>
                  <RotateCcw size={12} /> リセット
                </Button>
              )}
            </div>

            {tableRows.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-sm">
                <Layers size={32} className="mx-auto mb-2 opacity-30" />
                まだカードが保存されていません
                <div className="mt-1 text-xs">
                  「新規保存」を押すとここに追加されます
                </div>
              </div>
            ) : (
              <>
                {/* サムネイルグリッド */}
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 mb-4">
                  {tableRows.map((row) => (
                    <button
                      key={row.id}
                      onClick={() => loadCard(row)}
                      className="group relative aspect-[3/4] rounded-md overflow-hidden border border-gray-200 hover:border-indigo-400 hover:shadow-md transition-all bg-gray-50">
                      {row.thumbnail ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={row.thumbnail}
                          alt={row.name}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                          #{row.id}
                        </div>
                      )}
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent text-white text-[10px] px-1 py-0.5 truncate text-left">
                        {row.name}
                      </div>
                    </button>
                  ))}
                </div>

                {/* テキスト値の編集テーブル */}
                {layers.filter((l) => l.type === "text").length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border border-gray-200 px-2 py-1.5 font-medium text-gray-600 text-left">
                            読込
                          </th>
                          <th className="border border-gray-200 px-2 py-1.5 font-medium text-gray-600 text-left">
                            ID
                          </th>
                          {layers
                            .filter((l) => l.type === "text")
                            .map((l) => (
                              <th
                                key={l.id}
                                className="border border-gray-200 px-2 py-1.5 font-medium text-gray-600 text-left">
                                {l.title}
                              </th>
                            ))}
                          <th className="border border-gray-200 px-2 py-1.5 font-medium text-gray-600 text-left">
                            削除
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {tableRows.map((row, rowIndex) => (
                          <tr key={row.id} className="hover:bg-gray-50">
                            <td className="border border-gray-200 px-1 py-1 text-center">
                              <IconButton
                                size="1"
                                variant="ghost"
                                onClick={() => loadCard(row)}
                                aria-label="読み込み">
                                <FilePen size={14} />
                              </IconButton>
                            </td>
                            <td className="border border-gray-200 px-2 py-1 font-mono text-gray-500">
                              #{row.id}
                            </td>
                            {layers
                              .filter((l) => l.type === "text")
                              .map((layer) => (
                                <td
                                  key={layer.id}
                                  className="border border-gray-200 px-1 py-1">
                                  <input
                                    type="text"
                                    value={row.values[layer.title] || ""}
                                    onChange={(e) => {
                                      const updated = [...tableRows];
                                      updated[rowIndex].values[layer.title] =
                                        e.target.value;
                                      setTableRows(updated);
                                    }}
                                    className="w-full px-1 py-0.5 border border-transparent hover:border-gray-200 focus:border-indigo-300 rounded transition"
                                  />
                                </td>
                              ))}
                            <td className="border border-gray-200 px-1 py-1 text-center">
                              <IconButton
                                size="1"
                                variant="ghost"
                                color="red"
                                onClick={() => {
                                  if (
                                    confirm(`「${row.name}」を削除しますか？`)
                                  ) {
                                    setTableRows((prev) =>
                                      prev.filter((r) => r.id !== row.id)
                                    );
                                  }
                                }}
                                aria-label="削除">
                                <Trash2 size={12} />
                              </IconButton>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </section>
        </main>

        {/* ========== Right: Layer panel ========== */}
        <aside className="bg-white rounded-xl border border-gray-200 p-4 space-y-3 lg:max-h-[calc(100vh-120px)] lg:overflow-y-auto">
          <div className="flex items-center justify-between">
            <h3 className="text-xs uppercase tracking-wider text-gray-500 font-semibold flex items-center gap-1.5">
              <Layers size={12} /> レイヤー
            </h3>
            <div className="flex gap-1">
              <Tooltip content="テキストを追加">
                <IconButton
                  size="1"
                  variant="soft"
                  onClick={addTextLayer}
                  aria-label="テキスト追加">
                  <Type size={12} />
                </IconButton>
              </Tooltip>
              <Tooltip content="画像を追加">
                <IconButton
                  size="1"
                  variant="soft"
                  onClick={addImageLayer}
                  aria-label="画像追加">
                  <ImageIcon size={12} />
                </IconButton>
              </Tooltip>
            </div>
          </div>

          {layers.length === 0 && (
            <div className="text-center py-8 text-gray-400 text-xs">
              <Plus size={20} className="mx-auto mb-1 opacity-40" />
              レイヤーを追加してください
            </div>
          )}

          {/* レイヤーリスト（ドラッグ並び替え） */}
          <DndContext onDragEnd={handleDragEnd}>
            <SortableContext
              items={layers.map((l) => l.id)}
              strategy={verticalListSortingStrategy}>
              <div className="space-y-1.5">
                {layers.map((layer) => (
                  <SortableItem key={layer.id} id={layer.id}>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedLayerId(layer.id)}
                        className={`flex items-center gap-1.5 flex-1 text-left text-sm truncate ${
                          selectedLayerId === layer.id
                            ? "font-semibold text-indigo-600"
                            : "text-gray-700"
                        }`}>
                        {layer.type === "text" ? (
                          <Type size={12} />
                        ) : (
                          <ImageIcon size={12} />
                        )}
                        <span className="truncate">{layer.title}</span>
                      </button>
                      <Switch
                        size="1"
                        checked={layer.visible}
                        onCheckedChange={(checked) =>
                          setLayers((prev) =>
                            prev.map((l) =>
                              l.id === layer.id ? { ...l, visible: checked } : l
                            )
                          )
                        }
                      />
                      <IconButton
                        size="1"
                        variant="ghost"
                        color="red"
                        onClick={() => {
                          setLayers((prev) =>
                            prev.filter((l) => l.id !== layer.id)
                          );
                          if (selectedLayerId === layer.id)
                            setSelectedLayerId(null);
                        }}
                        aria-label="削除">
                        <Trash2 size={11} />
                      </IconButton>
                    </div>
                  </SortableItem>
                ))}
              </div>
            </SortableContext>
          </DndContext>

          {/* 選択中レイヤーの詳細設定 */}
          {selectedLayer && (
            <>
              <Separator size="4" />
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-gray-700">
                    詳細設定: {selectedLayer.title}
                  </h4>
                  <div className="flex gap-1">
                    <Tooltip content="スタイルをコピー">
                      <Button
                        size="1"
                        variant="ghost"
                        onClick={() => setCopiedStyle({ ...selectedLayer })}>
                        コピー
                      </Button>
                    </Tooltip>
                    <Tooltip
                      content={
                        copiedStyle
                          ? "コピーしたスタイルを貼り付け"
                          : "先にコピーしてください"
                      }>
                      <Button
                        size="1"
                        variant="ghost"
                        disabled={!copiedStyle}
                        onClick={() =>
                          updateSelectedLayer({
                            ...copiedStyle,
                            id: selectedLayer.id,
                            title: selectedLayer.title,
                            value: selectedLayer.value,
                          })
                        }>
                        貼付
                      </Button>
                    </Tooltip>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg px-3">
                  {/* コンテンツ */}
                  <Disclosure title="コンテンツ" defaultOpen>
                    <div className="space-y-2">
                      <div>
                        <label className="text-xs text-gray-600 mb-1 block">
                          名前
                        </label>
                        <input
                          type="text"
                          value={selectedLayer.title}
                          onChange={(e) =>
                            updateSelectedLayer({ title: e.target.value })
                          }
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        />
                      </div>
                      {selectedLayer.type === "text" && (
                        <div>
                          <label className="text-xs text-gray-600 mb-1 block">
                            テキスト
                          </label>
                          <TextArea
                            placeholder="テキストを入力…"
                            value={selectedLayer.value}
                            onChange={(e) =>
                              updateSelectedLayer({ value: e.target.value })
                            }
                            rows={3}
                          />
                        </div>
                      )}
                      {selectedLayer.type === "image" && (
                        <div>
                          <label className="text-xs text-gray-600 mb-1 block">
                            画像
                          </label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              const reader = new FileReader();
                              reader.onload = () =>
                                updateSelectedLayer({
                                  value: reader.result as string,
                                });
                              reader.readAsDataURL(file);
                            }}
                            className="text-xs file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 file:cursor-pointer"
                          />
                        </div>
                      )}
                    </div>
                  </Disclosure>

                  {/* 配置 */}
                  <Disclosure title="配置">
                    <div className="space-y-2">
                      <div>
                        <label className="text-xs text-gray-600 mb-1 block">
                          基準位置
                        </label>
                        <div className="grid grid-cols-3 gap-1">
                          {POSITION_PRESETS.map((pos) => (
                            <button
                              key={pos}
                              onClick={() =>
                                updateSelectedLayer({ PositionPreset: pos })
                              }
                              className={`h-8 rounded border transition ${
                                selectedLayer.PositionPreset === pos
                                  ? "bg-indigo-500 border-indigo-500"
                                  : "bg-white border-gray-300 hover:border-gray-400"
                              }`}
                              aria-label={pos}>
                              <span
                                className={`block w-1.5 h-1.5 rounded-full mx-auto ${
                                  selectedLayer.PositionPreset === pos
                                    ? "bg-white"
                                    : "bg-gray-400"
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <NumberField
                          label="位置X調整"
                          unit="px"
                          value={selectedLayer.positionAdjX}
                          onChange={(n) =>
                            updateSelectedLayer({ positionAdjX: n })
                          }
                        />
                        <NumberField
                          label="位置Y調整"
                          unit="px"
                          value={selectedLayer.positionAdjY}
                          onChange={(n) =>
                            updateSelectedLayer({ positionAdjY: n })
                          }
                        />
                      </div>
                    </div>
                  </Disclosure>

                  {/* 効果（角度 / ドロップシャドウ） */}
                  <Disclosure title="効果">
                    <div className="space-y-3">
                      {/* 角度 */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs text-gray-600">
                            角度: {selectedLayer.rotation ?? 0}°
                          </label>
                          <button
                            onClick={() => updateSelectedLayer({ rotation: 0 })}
                            className="text-[10px] text-gray-400 hover:text-indigo-600 transition"
                            aria-label="角度をリセット">
                            リセット
                          </button>
                        </div>
                        <Slider
                          value={[selectedLayer.rotation ?? 0]}
                          min={-180}
                          max={180}
                          step={1}
                          onValueChange={([val]) =>
                            updateSelectedLayer({ rotation: val })
                          }
                        />
                        <div className="flex gap-1 mt-1.5">
                          {[-90, -45, 0, 45, 90].map((deg) => (
                            <button
                              key={deg}
                              onClick={() =>
                                updateSelectedLayer({ rotation: deg })
                              }
                              className={`flex-1 text-[10px] py-1 rounded border transition ${
                                (selectedLayer.rotation ?? 0) === deg
                                  ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                                  : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
                              }`}>
                              {deg > 0 ? `+${deg}` : deg}°
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* ドロップシャドウ */}
                      <div className="pt-2 border-t border-gray-100">
                        <label className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                          <Switch
                            size="1"
                            checked={selectedLayer.shadowEnabled ?? false}
                            onCheckedChange={(checked) =>
                              updateSelectedLayer({ shadowEnabled: checked })
                            }
                          />
                          ドロップシャドウ
                        </label>
                        {selectedLayer.shadowEnabled && (
                          <div className="space-y-3 pl-1">
                            <ColorSwatch
                              label="影の色"
                              value={selectedLayer.shadowColor ?? "#000000"}
                              onChange={(c) =>
                                updateSelectedLayer({ shadowColor: c as Color })
                              }
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <NumberField
                                label="X方向"
                                unit="px"
                                value={selectedLayer.shadowOffsetX ?? 2}
                                onChange={(n) =>
                                  updateSelectedLayer({ shadowOffsetX: n })
                                }
                              />
                              <NumberField
                                label="Y方向"
                                unit="px"
                                value={selectedLayer.shadowOffsetY ?? 2}
                                onChange={(n) =>
                                  updateSelectedLayer({ shadowOffsetY: n })
                                }
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-600 mb-1 block">
                                ぼかし: {selectedLayer.shadowBlur ?? 4}px
                              </label>
                              <Slider
                                value={[selectedLayer.shadowBlur ?? 4]}
                                min={0}
                                max={50}
                                step={1}
                                onValueChange={([val]) =>
                                  updateSelectedLayer({ shadowBlur: val })
                                }
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-600 mb-1 block">
                                不透明度:{" "}
                                {Math.round(
                                  (selectedLayer.shadowOpacity ?? 0.5) * 100
                                )}
                                %
                              </label>
                              <Slider
                                value={[
                                  (selectedLayer.shadowOpacity ?? 0.5) * 100,
                                ]}
                                min={0}
                                max={100}
                                step={1}
                                onValueChange={([val]) =>
                                  updateSelectedLayer({
                                    shadowOpacity: val / 100,
                                  })
                                }
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </Disclosure>

                  {/* テキスト固有 */}
                  {selectedLayer.type === "text" && (
                    <Disclosure title="タイポグラフィ">
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs text-gray-600 mb-1 block">
                            サイズ: {selectedLayer.fontSize}px
                          </label>
                          <Slider
                            value={[selectedLayer.fontSize]}
                            min={8}
                            max={120}
                            step={1}
                            onValueChange={([val]) =>
                              updateSelectedLayer({ fontSize: val })
                            }
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs text-gray-600 mb-1 block">
                              ウェイト
                            </label>
                            <Select.Root
                              value={selectedLayer.fontStyle}
                              onValueChange={(val) =>
                                updateSelectedLayer({
                                  fontStyle: val as Layer["fontStyle"],
                                })
                              }>
                              <Select.Trigger className="w-full" />
                              <Select.Content>
                                <Select.Item value="thin">Thin</Select.Item>
                                <Select.Item value="normal">Normal</Select.Item>
                                <Select.Item value="Bold">Bold</Select.Item>
                              </Select.Content>
                            </Select.Root>
                          </div>
                          <div>
                            <label className="text-xs text-gray-600 mb-1 block">
                              揃え
                            </label>
                            <Select.Root
                              value={selectedLayer.textAlign}
                              onValueChange={(val) =>
                                updateSelectedLayer({
                                  textAlign: val as "left" | "center" | "right",
                                })
                              }>
                              <Select.Trigger className="w-full" />
                              <Select.Content>
                                <Select.Item value="left">左揃え</Select.Item>
                                <Select.Item value="center">中央</Select.Item>
                                <Select.Item value="right">右揃え</Select.Item>
                              </Select.Content>
                            </Select.Root>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <ColorSwatch
                            label="文字色"
                            value={selectedLayer.fontColor}
                            onChange={(c) =>
                              updateSelectedLayer({ fontColor: c as Color })
                            }
                          />
                          <ColorSwatch
                            label="縁取り"
                            value={selectedLayer.fontOutline}
                            onChange={(c) =>
                              updateSelectedLayer({ fontOutline: c as Color })
                            }
                          />
                        </div>
                      </div>
                    </Disclosure>
                  )}

                  {/* テキストの背景 */}
                  {selectedLayer.type === "text" && (
                    <Disclosure title="テキスト背景">
                      <div className="space-y-3">
                        <label className="flex items-center gap-2 text-xs text-gray-600">
                          <Switch
                            size="1"
                            checked={selectedLayer.backGround}
                            onCheckedChange={(checked) =>
                              updateSelectedLayer({ backGround: checked })
                            }
                          />
                          背景を有効化
                        </label>
                        {selectedLayer.backGround && (
                          <>
                            <ColorSwatch
                              label="背景色"
                              value={selectedLayer.bgColor}
                              onChange={(c) =>
                                updateSelectedLayer({ bgColor: c as Color })
                              }
                            />
                            <div>
                              <label className="text-xs text-gray-600 mb-1 block">
                                不透明度:{" "}
                                {Math.round(selectedLayer.bgOpacity * 100)}%
                              </label>
                              <Slider
                                value={[selectedLayer.bgOpacity * 100]}
                                min={0}
                                max={100}
                                step={1}
                                onValueChange={([val]) =>
                                  updateSelectedLayer({ bgOpacity: val / 100 })
                                }
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-600 mb-1 block">
                                角丸: {selectedLayer.bgRadius}px
                              </label>
                              <Slider
                                value={[selectedLayer.bgRadius]}
                                min={0}
                                max={32}
                                step={1}
                                onValueChange={([val]) =>
                                  updateSelectedLayer({ bgRadius: val })
                                }
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-600 mb-1 block">
                                余白: {selectedLayer.textPadding}px
                              </label>
                              <Slider
                                value={[selectedLayer.textPadding]}
                                min={0}
                                max={40}
                                step={1}
                                onValueChange={([val]) =>
                                  updateSelectedLayer({ textPadding: val })
                                }
                              />
                            </div>
                          </>
                        )}
                      </div>
                    </Disclosure>
                  )}

                  {/* 画像固有 */}
                  {selectedLayer.type === "image" && (
                    <Disclosure title="画像設定">
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <NumberField
                            label="幅"
                            unit="%"
                            value={selectedLayer.imageWidth ?? 100}
                            onChange={(n) =>
                              updateSelectedLayer({ imageWidth: n })
                            }
                          />
                          <NumberField
                            label="高さ"
                            unit="%"
                            value={selectedLayer.imageHeight ?? 100}
                            onChange={(n) =>
                              updateSelectedLayer({ imageHeight: n })
                            }
                          />
                        </div>
                        <NumberField
                          label="角丸"
                          unit="px"
                          value={selectedLayer.bgRadius}
                          onChange={(n) => updateSelectedLayer({ bgRadius: n })}
                        />
                        <div>
                          <label className="text-xs text-gray-600 mb-1 block">
                            不透明度:{" "}
                            {Math.round((selectedLayer.opacity ?? 1) * 100)}%
                          </label>
                          <Slider
                            value={[(selectedLayer.opacity ?? 1) * 100]}
                            min={0}
                            max={100}
                            step={1}
                            onValueChange={([val]) =>
                              updateSelectedLayer({ opacity: val / 100 })
                            }
                          />
                        </div>
                      </div>
                    </Disclosure>
                  )}
                </div>
              </div>
            </>
          )}
        </aside>
      </div>

      {/* ===== トースト ===== */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-2">
          <Callout.Root color={toast.type === "ok" ? "green" : "red"} size="1">
            <Callout.Icon>
              <AlertCircle size={14} />
            </Callout.Icon>
            <Callout.Text>{toast.msg}</Callout.Text>
          </Callout.Root>
        </div>
      )}
    </div>
  );
}
