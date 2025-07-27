"use client";
import { useState, useRef, useEffect } from "react";
import { HexColorPicker } from "react-colorful";
import { Tabs, TextArea, Slider, Switch, Select } from "@radix-ui/themes";
import { Trash2, FilePen, Save } from "lucide-react";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { DndContext, DragEndEvent } from "@dnd-kit/core";
import { SortableItem } from "./ SortableItem";

export default function CardMaker() {
  //
  async function SaveCard() {
    const canvas = document.getElementById("myCanvas") as HTMLCanvasElement;
    if (!canvas) {
      console.error("Canvas 要素が見つかりません");
      return;
    }

    // toBlobは非同期なので Promise化
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), "image/png");
    });

    if (!blob) {
      console.error("Canvas の blob 変換に失敗しました");
      return;
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "card.png";
    a.click();

    // メモリ解放
    URL.revokeObjectURL(url);
  }
  //セーブ
  function saveCardDataAsJSON() {
    const data = {
      canvasData,
      baseData,
      layers,
      tableRows, // ← 各 row に cardId 含まれている
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "card_table_state.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function loadCardDataFromJSON(event: React.ChangeEvent<HTMLInputElement>) {
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
        } else {
          alert("ファイル形式が正しくありません");
        }
      } catch (e) {
        alert("JSONの読み込みに失敗しました");
      }
    };

    reader.readAsText(file);
  }

  //以下変数用変数
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

  type Color = `#${string}`;
  const [color, setColor] = useState<Color>("#000000");
  type Layer = {
    id: string;
    type: "text" | "image";
    title: string;
    visible: boolean;
    value: string;
    zIndex: number;
    fontStyle: "thin" | "normal" | "Bold";
    fontSize: number;
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
    // 画像用
    imageWidth?: number; // %
    imageHeight?: number; // %
    fitStyle?: "contain" | "cover"; // objectFit に使う
    opacity?: number; // 透明度
  };
  //表用
  type TableRow = {
    id: number;
    name?: string;

    values: Record<string, string>;
    layersSnapshot: Layer[];
    canvasSnapshot: typeof canvasData;
    baseSnapshot: typeof baseData;
  };

  const [tableRows, setTableRows] = useState<TableRow[]>([]);
  const [layers, setLayers] = useState<Layer[]>([]);
  //表用
  type CardData = {
    id: string;
    name: string;
    canvas: typeof canvasData;
    base: typeof baseData;
    layers: Layer[];
  };
  const [savedCards, setSavedCards] = useState<CardData[]>([]);
  //以下基本処理用関数
  //これは不透明度管理で使う
  function hexToRGBA(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
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

      // zIndexはそのまま、配列順に付け直す
      return updated.map((layer, index) => ({
        ...layer,
        zIndex: index,
      }));
    });
  };
  //これはレイヤー描画
  //これは画像の変換
  const handleImageUpload =
    <T extends { imageSrc: string }>(
      setFn: React.Dispatch<React.SetStateAction<T>>
    ) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;

        setFn((prev) => ({
          ...prev,
          imageSrc: base64,
        }));
      };

      reader.readAsDataURL(file);
    };
  const handleImageTrash =
    <T extends { imageSrc: string }>(
      setFn: React.Dispatch<React.SetStateAction<T>>
    ) =>
    (e: React.MouseEvent<HTMLButtonElement>) => {
      setFn((prev) => ({
        ...prev,
        imageSrc: "null",
      }));
    };
  //以下カード用変数
  //
  const [canvasData, setCanvasData] = useState<{
    cardID: number;
    width: number;
    height: number;
    bgColor: Color;
    radius: number;
  }>({
    cardID: -1,
    width: 300,
    height: 200,
    bgColor: color,
    radius: 0,
  });
  const [baseData, setBaseData] = useState<{
    width: number;
    height: number;
    bgColor: Color;
    radius: number;
    imageSrc: string;
    imageWidth: number;
    imageHight: number;
    imagePositionX: number;
    imagePositionY: number;
  }>({
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

  //Canvas
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 背景（塗りつぶし）
    ctx.fillStyle = canvasData.bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // ベース画像 or 色
    const baseW = canvas.width * (baseData.width / 100);
    const baseH = canvas.height * (baseData.height / 100);
    const baseX = canvas.width / 2 - baseW / 2;
    const baseY = canvas.height / 2 - baseH / 2;

    if (baseData.imageSrc !== "null") {
      const img = new Image();
      img.src = baseData.imageSrc;
      img.onload = () => {
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

        drawLayers(ctx, baseX, baseY, baseW, baseH);
      };
    } else {
      ctx.save();
      drawRoundedRect(ctx, baseX, baseY, baseW, baseH, baseData.radius);
      ctx.clip();
      ctx.fillStyle = baseData.bgColor;
      ctx.fill();
      ctx.restore();

      drawLayers(ctx, baseX, baseY, baseW, baseH);
    }
  }, [canvasData, baseData, layers]);
  function drawLayers(
    ctx: CanvasRenderingContext2D,
    baseX: number,
    baseY: number,
    baseW: number,
    baseH: number
  ) {
    layers
      .filter((layer) => layer.visible !== false)
      .forEach((layer) => {
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
          ctx.font = `${layer.fontStyle === "Bold" ? "bold " : ""}${
            layer.fontSize
          }px sans-serif`;
          ctx.fillStyle = layer.fontColor;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";

          if (layer.backGround) {
            const textMetrics = ctx.measureText(layer.value);
            const textW = textMetrics.width + layer.textPadding * 2;
            const textH = layer.fontSize + layer.textPadding * 2;

            const rectX = x - textW / 2;
            const rectY = y - textH / 2;

            ctx.save();
            drawRoundedRect(ctx, rectX, rectY, textW, textH, layer.bgRadius);
            ctx.fillStyle = hexToRGBA(layer.bgColor, layer.bgOpacity);
            ctx.fill();
            ctx.restore();
          }

          ctx.fillStyle = layer.fontColor;
          ctx.strokeStyle = layer.fontOutline;
          ctx.lineWidth = 1;
          ctx.strokeText(layer.value, x, y);
          ctx.fillText(layer.value, x, y);
        }

        if (layer.type === "image" && layer.value) {
          const img = new Image();
          img.src = layer.value;
          img.onload = () => {
            const imgW = ((layer.imageWidth ?? 100) / 100) * baseW;
            const imgH = ((layer.imageHeight ?? 100) / 100) * baseH;
            ctx.save();
            drawRoundedRect(
              ctx,
              x - imgW / 2,
              y - imgH / 2,
              imgW,
              imgH,
              layer.bgRadius
            );
            ctx.clip();
            ctx.globalAlpha = layer.opacity ?? 1;
            ctx.drawImage(img, x - imgW / 2, y - imgH / 2, imgW, imgH);
            ctx.globalAlpha = 1;
            ctx.restore();
          };
        }
      });
  }
  const [copiedStyle, setCopiedStyle] = useState<Partial<Layer> | null>(null);
  function getLayerPosition(
    preset: Layer["PositionPreset"],
    baseX: number,
    baseY: number,
    baseW: number,
    baseH: number
  ): [number, number] {
    const posMap = {
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
  return (
    <>
      <div className="grid grid-cols-3 gap-2">
        <div id="controller" className="m-3 border-1 rounded-xl p-2 ">
          <Tabs.Root defaultValue="Master" className="">
            <Tabs.List className=" flex gap-2 mb-2">
              <Tabs.Trigger value="Master">キャンバス</Tabs.Trigger>
              <Tabs.Trigger value="Base">ベース</Tabs.Trigger>

              {layers.map((layer) => (
                <Tabs.Trigger key={layer.id} value={layer.title}>
                  {layer.title}
                </Tabs.Trigger>
              ))}
            </Tabs.List>
            <Tabs.Content value="Master">
              <div className="grid grid-cols-2 gap-5 content-center">
                <div className="flex items-center">
                  <h2>横幅</h2>
                  <input
                    type="number"
                    value={canvasData.width}
                    onChange={(e) =>
                      setCanvasData((prev) => ({
                        ...prev,
                        width: e.target.valueAsNumber,
                      }))
                    }
                    className="border px-2 py-1 rounded w-24"
                  />
                  <h2>(px)</h2>
                </div>
                <div className="flex items-center">
                  <h2>高さ</h2>
                  <input
                    type="number"
                    value={canvasData.height}
                    onChange={(e) =>
                      setCanvasData((prev) => ({
                        ...prev,
                        height: e.target.valueAsNumber,
                      }))
                    }
                    className="border px-2 py-1 rounded w-24"
                  />
                  <h2>(px)</h2>
                </div>
                <div>
                  <h2>背景色</h2>
                  <HexColorPicker
                    color={canvasData.bgColor}
                    onChange={(newColor) =>
                      setCanvasData((prev) => ({
                        ...prev,
                        bgColor: newColor as Color,
                      }))
                    }
                    style={{ height: "150px", width: "100%" }}
                  />
                </div>
                <div className="flex items-center">
                  <h2>角丸</h2>
                  <input
                    type="number"
                    value={canvasData.radius}
                    onChange={(e) =>
                      setCanvasData((prev) => ({
                        ...prev,
                        radius: e.target.valueAsNumber,
                      }))
                    }
                    className="border px-2 py-1 rounded w-24"
                  />
                  <h2>(px)</h2>
                </div>
              </div>
            </Tabs.Content>

            <Tabs.Content value="Base">
              <div>
                <div className="grid grid-cols-2  content-center">
                  <div className="flex items-center">
                    <h2>横幅</h2>
                    <input
                      type="number"
                      value={baseData.width}
                      onChange={(e) =>
                        setBaseData((prev) => ({
                          ...prev,
                          width: e.target.valueAsNumber,
                        }))
                      }
                      className="border px-2 py-1 rounded w-24"
                    />
                    <h2>(%)</h2>
                  </div>
                  <div className="flex items-center">
                    <h2>高さ</h2>
                    <input
                      type="number"
                      value={baseData.height}
                      onChange={(e) =>
                        setBaseData((prev) => ({
                          ...prev,
                          height: e.target.valueAsNumber,
                        }))
                      }
                      className="border px-2 py-1 rounded w-24"
                    />
                    <h2>(%)</h2>
                  </div>

                  <div className="flex items-center">
                    <h2>角丸</h2>
                    <input
                      type="number"
                      value={baseData.radius}
                      onChange={(e) =>
                        setBaseData((prev) => ({
                          ...prev,
                          radius: e.target.valueAsNumber,
                        }))
                      }
                      className="border px-2 py-1 rounded w-24"
                    />
                    <h2>(px)</h2>
                  </div>
                </div>
                <div className="flex grid grid-cols-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload(setBaseData)}
                  />
                  {baseData.imageSrc !== "null" ? (
                    <div>
                      <button onClick={handleImageTrash(setBaseData)}>
                        <Trash2 />
                      </button>
                      <div className="flex grid grid-cols-2 gap-4">
                        <div className="flex items-center">
                          <h2>背景画像サイズ(横幅）</h2>
                          <input
                            type="number"
                            value={baseData.imageWidth}
                            onChange={(e) =>
                              setBaseData((prev) => ({
                                ...prev,
                                imageWidth: e.target.valueAsNumber,
                              }))
                            }
                            className="border px-2 py-1 rounded w-24"
                          />
                          <h2>(%)</h2>
                        </div>
                        <div className="flex items-center">
                          <h2>背景画像サイズ(高さ）</h2>
                          <input
                            type="number"
                            value={baseData.imageHight}
                            onChange={(e) =>
                              setBaseData((prev) => ({
                                ...prev,
                                imageHight: e.target.valueAsNumber,
                              }))
                            }
                            className="border px-2 py-1 rounded w-24"
                          />
                          <h2>(%)</h2>
                        </div>
                        <div className="flex items-center">
                          <h2>背景画像位置横</h2>
                          <input
                            type="number"
                            value={baseData.imagePositionX}
                            onChange={(e) =>
                              setBaseData((prev) => ({
                                ...prev,
                                imagePositionX: e.target.valueAsNumber,
                              }))
                            }
                            className="border px-2 py-1 rounded w-24"
                          />
                          <h2>(%)</h2>
                        </div>
                        <div className="flex items-center">
                          <h2>背景画像位置縦</h2>
                          <input
                            type="number"
                            value={baseData.imagePositionY}
                            onChange={(e) =>
                              setBaseData((prev) => ({
                                ...prev,
                                imagePositionY: e.target.valueAsNumber,
                              }))
                            }
                            className="border px-2 py-1 rounded w-24"
                          />
                          <h2>(%)</h2>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h2>背景色</h2>
                      <HexColorPicker
                        color={baseData.bgColor}
                        onChange={(newColor) =>
                          setBaseData((prev) => ({
                            ...prev,
                            bgColor: newColor as Color,
                          }))
                        }
                        style={{ height: "150px", width: "100%" }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </Tabs.Content>
            {layers.map((layer) => (
              <Tabs.Content key={layer.id} value={layer.title}>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 items-center">
                    <div>配置位置</div>
                    <Select.Root
                      value={layer.PositionPreset}
                      onValueChange={(val) =>
                        setLayers((prev) =>
                          prev.map((l) =>
                            l.id === layer.id
                              ? {
                                  ...l,
                                  PositionPreset:
                                    val as Layer["PositionPreset"],
                                }
                              : l
                          )
                        )
                      }>
                      <Select.Trigger />
                      <Select.Content>
                        {[
                          "top-left",
                          "top-center",
                          "top-right",
                          "center-left",
                          "center",
                          "center-right",
                          "bottom-left",
                          "bottom-center",
                          "bottom-right",
                        ].map((pos) => (
                          <Select.Item key={pos} value={pos}>
                            {pos}
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select.Root>

                    <div>横位置微調整</div>
                    <input
                      type="number"
                      value={layer.positionAdjX}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setLayers((prev) =>
                          prev.map((l) =>
                            l.id === layer.id
                              ? { ...l, positionAdjX: Number(e.target.value) }
                              : l
                          )
                        )
                      }
                    />

                    <div>縦位置微調整</div>
                    <input
                      type="number"
                      value={layer.positionAdjY}
                      onChange={(e) =>
                        setLayers((prev) =>
                          prev.map((l) =>
                            l.id === layer.id
                              ? { ...l, positionAdjY: Number(e.target.value) }
                              : l
                          )
                        )
                      }
                    />
                  </div>
                  {layer.type === "image" && (
                    <div className="space-y-4">
                      <div>
                        <label>画像の再設定</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onload = () => {
                              const base64 = reader.result as string;
                              setLayers((prev) =>
                                prev.map((l) =>
                                  l.id === layer.id
                                    ? { ...l, value: base64 }
                                    : l
                                )
                              );
                            };
                            reader.readAsDataURL(file);
                          }}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4 items-center">
                        <label>画像横幅 (%)</label>
                        <input
                          type="number"
                          value={layer.imageWidth || 100}
                          onChange={(e) => {
                            const val = e.target.valueAsNumber;
                            setLayers((prev) =>
                              prev.map((l) =>
                                l.id === layer.id
                                  ? { ...l, imageWidth: val }
                                  : l
                              )
                            );
                          }}
                          min={0}
                          max={999}
                          step={1}
                        />

                        <label>画像高さ (%)</label>
                        <input
                          type="number"
                          value={layer.imageHeight || 100}
                          onChange={(e) =>
                            setLayers((prev) =>
                              prev.map((l) =>
                                l.id === layer.id
                                  ? {
                                      ...l,
                                      imageHeight: e.target.valueAsNumber,
                                    }
                                  : l
                              )
                            )
                          }
                        />

                        <label>横位置補正</label>
                        <input
                          type="number"
                          value={layer.positionAdjX}
                          onChange={(e) =>
                            setLayers((prev) =>
                              prev.map((l) =>
                                l.id === layer.id
                                  ? {
                                      ...l,
                                      positionAdjX: e.target.valueAsNumber,
                                    }
                                  : l
                              )
                            )
                          }
                        />

                        <label>縦位置補正</label>
                        <input
                          type="number"
                          value={layer.positionAdjY}
                          onChange={(e) =>
                            setLayers((prev) =>
                              prev.map((l) =>
                                l.id === layer.id
                                  ? {
                                      ...l,
                                      positionAdjY: e.target.valueAsNumber,
                                    }
                                  : l
                              )
                            )
                          }
                        />

                        <label>角丸</label>
                        <input
                          type="number"
                          value={layer.bgRadius}
                          onChange={(e) =>
                            setLayers((prev) =>
                              prev.map((l) =>
                                l.id === layer.id
                                  ? { ...l, bgRadius: e.target.valueAsNumber }
                                  : l
                              )
                            )
                          }
                        />
                      </div>
                    </div>
                  )}
                  {layer.type === "text" && (
                    <div>
                      <div>フォントサイズ</div>
                      <Slider
                        value={[layer.fontSize]}
                        min={8}
                        max={64}
                        step={1}
                        onValueChange={([val]) =>
                          setLayers((prev) =>
                            prev.map((l) =>
                              l.id === layer.id ? { ...l, fontSize: val } : l
                            )
                          )
                        }
                      />

                      <div>フォントスタイル</div>
                      <Select.Root
                        value={layer.fontStyle}
                        onValueChange={(val) =>
                          setLayers((prev) =>
                            prev.map((l) =>
                              l.id === layer.id
                                ? { ...l, fontStyle: val as Layer["fontStyle"] }
                                : l
                            )
                          )
                        }>
                        <Select.Trigger />
                        <Select.Content>
                          <Select.Item value="thin">Thin</Select.Item>
                          <Select.Item value="normal">Normal</Select.Item>
                          <Select.Item value="Bold">Bold</Select.Item>
                        </Select.Content>
                      </Select.Root>

                      <div className="grid grid-cols-2">
                        <div>
                          <div>フォント色</div>
                          <HexColorPicker
                            color={layer.fontColor}
                            onChange={(c) =>
                              setLayers((prev) =>
                                prev.map((l) =>
                                  l.id === layer.id
                                    ? { ...l, fontColor: c as Color }
                                    : l
                                )
                              )
                            }
                          />
                        </div>
                        <div>
                          <div>縁取り色</div>
                          <HexColorPicker
                            color={layer.fontOutline}
                            onChange={(c) =>
                              setLayers((prev) =>
                                prev.map((l) =>
                                  l.id === layer.id
                                    ? { ...l, fontOutline: c as Color }
                                    : l
                                )
                              )
                            }
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div>背景有効</div>
                        <Switch
                          checked={layer.backGround}
                          onCheckedChange={(checked) =>
                            setLayers((prev) =>
                              prev.map((l) =>
                                l.id === layer.id
                                  ? { ...l, backGround: checked }
                                  : l
                              )
                            )
                          }
                        />
                      </div>

                      <div className="grid grid-cols-2">
                        <div>
                          <div>背景色</div>
                          <HexColorPicker
                            color={layer.bgColor}
                            onChange={(c) =>
                              setLayers((prev) =>
                                prev.map((l) =>
                                  l.id === layer.id
                                    ? { ...l, bgColor: c as Color }
                                    : l
                                )
                              )
                            }
                          />
                        </div>
                        <div>
                          <label>背景不透明度</label>
                          <Slider
                            value={[layer.bgOpacity * 100]} // スライダーは0〜100表示
                            min={0}
                            max={100}
                            step={1}
                            onValueChange={([val]) =>
                              setLayers((prev) =>
                                prev.map((l) =>
                                  l.id === layer.id
                                    ? { ...l, bgOpacity: val / 100 }
                                    : l
                                )
                              )
                            }
                          />
                        </div>
                        <div className="grid grid-cols-1 gap-4 items-center">
                          <div>
                            <div>背景角丸</div>
                            <Slider
                              value={[layer.bgRadius]}
                              min={0}
                              max={32}
                              step={1}
                              onValueChange={([val]) =>
                                setLayers((prev) =>
                                  prev.map((l) =>
                                    l.id === layer.id
                                      ? { ...l, bgRadius: val }
                                      : l
                                  )
                                )
                              }
                            />
                          </div>
                          <div>
                            <div>テキスト余白</div>
                            <Slider
                              value={[layer.textPadding]}
                              min={0}
                              max={40}
                              step={1}
                              onValueChange={([val]) =>
                                setLayers((prev) =>
                                  prev.map((l) =>
                                    l.id === layer.id
                                      ? { ...l, textPadding: val }
                                      : l
                                  )
                                )
                              }
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </Tabs.Content>
            ))}
          </Tabs.Root>
        </div>
        <canvas
          id="myCanvas"
          ref={canvasRef}
          width={canvasData.width}
          height={canvasData.height}
          style={{
            borderRadius: `${canvasData.radius}px`,
            backgroundColor: canvasData.bgColor,
            imageRendering: "pixelated",
          }}
        />
        <div id="TextEditor" className="m-3 border-1 rounded-xl p-2 ">
          <h1>編集中のカード名：{}</h1>
          <Tabs.Root defaultValue="Text" className="">
            <Tabs.List className=" flex gap-2 mb-2">
              <Tabs.Trigger value="Text">タイトル</Tabs.Trigger>
            </Tabs.List>
            <Tabs.Content value="Text">
              <DndContext onDragEnd={handleDragEnd}>
                <SortableContext
                  items={layers.map((l) => l.id)}
                  strategy={verticalListSortingStrategy}>
                  {layers.map((layer) => (
                    <SortableItem key={layer.id} id={layer.id}>
                      <label className="flex items-center gap-2">
                        <Switch
                          checked={layer.visible !== false}
                          onCheckedChange={(checked) =>
                            setLayers((prev) =>
                              prev.map((l) =>
                                l.id === layer.id
                                  ? { ...l, visible: checked }
                                  : l
                              )
                            )
                          }
                        />
                        表示
                      </label>
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => setCopiedStyle({ ...layer })}
                          className="bg-gray-200 text-sm px-2 py-1 rounded">
                          スタイルコピー
                        </button>
                        <button
                          disabled={!copiedStyle}
                          onClick={() =>
                            setLayers((prev) =>
                              prev.map((l) =>
                                l.id === layer.id
                                  ? {
                                      ...l,
                                      ...copiedStyle,
                                      id: l.id, // IDと値は上書きしない
                                      title: l.title,
                                      value: l.value,
                                    }
                                  : l
                              )
                            )
                          }
                          className="bg-blue-200 text-sm px-2 py-1 rounded disabled:opacity-50">
                          スタイル貼り付け
                        </button>
                      </div>

                      <input
                        type="text"
                        className="border px-2 py-1 rounded w-full"
                        value={layer.title}
                        onChange={(e) =>
                          setLayers((prev) =>
                            prev.map((l) =>
                              l.id === layer.id
                                ? { ...l, title: e.target.value }
                                : l
                            )
                          )
                        }
                      />

                      {layer.type === "text" && (
                        <TextArea
                          placeholder="Reply to comment…"
                          onChange={(e) =>
                            setLayers((prev) =>
                              prev.map((l) =>
                                l.id === layer.id
                                  ? { ...l, value: e.target.value }
                                  : l
                              )
                            )
                          }
                        />
                      )}
                      {layer.type === "image" && (
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;

                            const reader = new FileReader();
                            reader.onload = () => {
                              const base64 = reader.result as string;
                              setLayers((prev) =>
                                prev.map((l) =>
                                  l.id === layer.id
                                    ? { ...l, value: base64 }
                                    : l
                                )
                              );
                            };
                            reader.readAsDataURL(file);
                          }}
                        />
                      )}
                      <button
                        onClick={() =>
                          setLayers((prev) =>
                            prev.filter((l) => l.id !== layer.id)
                          )
                        }
                        className="text-red-600 hover:text-red-800 ml-2 self-end">
                        <Trash2 />
                      </button>
                    </SortableItem>
                  ))}
                </SortableContext>
              </DndContext>
              <button
                onClick={() => {
                  setLayers((prev) => {
                    const nextId = `${Date.now()}`;
                    const maxZ = Math.max(...prev.map((l) => l.zIndex), 0);
                    const newLayer: Layer = {
                      id: nextId,
                      type: "text",
                      title: `レイヤー${layers.length + 1}`,
                      value: "",
                      visible: true,
                      zIndex: maxZ + 1,
                      fontStyle: "normal",
                      fontSize: 20,
                      fontColor: "#000000",
                      fontOutline: "#000000",
                      PositionPreset: "center",
                      positionAdjX: 0,
                      positionAdjY: 0,
                      backGround: false,
                      textPadding: 10,
                      bgColor: "#ffffff",
                      bgOpacity: 1,
                      bgRadius: 0,
                    };
                    return [...prev, newLayer];
                  });
                }}
                className="bg-blue-500 text-white px-4 py-1 rounded mb-2">
                + レイヤー追加
              </button>
              <button
                onClick={() => {
                  setLayers((prev) => {
                    const nextId = `${Date.now()}`;
                    const maxZ = Math.max(...prev.map((l) => l.zIndex), 0);
                    const newLayer: Layer = {
                      id: nextId,
                      type: "image",
                      title: `画像レイヤー${prev.length + 1}`,
                      value: "",
                      visible: true,
                      zIndex: maxZ + 1,
                      fontStyle: "normal", // 使わないけど型のため一応
                      fontSize: 20,
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
                      imageWidth: 100,
                      imageHeight: 100,
                      fitStyle: "contain",
                      opacity: 1,
                    };
                    return [...prev, newLayer];
                  });
                }}
                className="bg-purple-500 text-white px-4 py-1 rounded">
                + 画像レイヤー追加
              </button>
              <button
                onClick={async () => {
                  await SaveCard();

                  const existingId = canvasData.cardID;

                  const currentValues = Object.fromEntries(
                    layers
                      .filter((l) => l.type === "text")
                      .map((l) => [l.title, l.value])
                  );

                  const updatedRow: TableRow = {
                    id: existingId,
                    name: `カード${tableRows.length + 1}`, // 必要なら元の名前を保持してもOK
                    values: currentValues,
                    layersSnapshot: JSON.parse(JSON.stringify(layers)),
                    canvasSnapshot: JSON.parse(JSON.stringify(canvasData)),
                    baseSnapshot: JSON.parse(JSON.stringify(baseData)),
                  };

                  setTableRows((prev) => {
                    const index = prev.findIndex((r) => r.id === existingId);
                    if (index !== -1) {
                      const updated = [...prev];
                      updated[index] = updatedRow;
                      return updated;
                    } else {
                      console.warn("上書き対象のカードIDが見つかりません");
                      return prev;
                    }
                  });
                }}
                className="mt-2 ml-2 bg-green-600 text-white px-3 py-1 rounded">
                上書き保存
              </button>
              <button
                onClick={async () => {
                  await SaveCard();

                  // 最大のIDを調べて +1（0スタートで連番管理するスタイル）
                  const nextId =
                    tableRows.reduce(
                      (max, row) => Math.max(max, Number(row.id)),
                      0
                    ) + 1;

                  // canvasData にも新しい cardID をセット
                  setCanvasData((prev) => ({ ...prev, cardID: nextId }));

                  const currentValues = Object.fromEntries(
                    layers
                      .filter((l) => l.type === "text")
                      .map((l) => [l.title, l.value])
                  );

                  const newRow: TableRow = {
                    id: nextId,
                    name: `カード${tableRows.length + 1}`,
                    values: currentValues,
                    layersSnapshot: JSON.parse(JSON.stringify(layers)),
                    canvasSnapshot: JSON.parse(
                      JSON.stringify({
                        ...canvasData,
                        cardID: nextId,
                      })
                    ),
                    baseSnapshot: JSON.parse(JSON.stringify(baseData)),
                  };

                  setTableRows((prev) => [...prev, newRow]);
                }}
                className="mt-2 ml-2 bg-blue-600 text-white px-3 py-1 rounded">
                新規保存
              </button>
            </Tabs.Content>
          </Tabs.Root>
        </div>
      </div>
      <div className="mt-4">
        <h2 className="font-bold mb-2">テーブル編集</h2>
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr>
              <th className="border border-gray-300 px-2 py-1">読み込み</th>
              {layers
                .filter((l) => l.type === "text")
                .map((l) => (
                  <th key={l.id} className="border border-gray-300 px-2 py-1">
                    {l.title}
                  </th>
                ))}
              <th className="border border-gray-300 px-2 py-1">削除</th>
            </tr>
          </thead>
          <tbody>
            {tableRows.map((row, rowIndex) => (
              <tr key={row.id}>
                <td>
                  <button
                    onClick={() => {
                      const matchedRow = tableRows[rowIndex];
                      setCanvasData(matchedRow.canvasSnapshot);
                      setBaseData(matchedRow.baseSnapshot);
                      setLayers(matchedRow.layersSnapshot);
                    }}
                    className="text-blue-600 hover:text-blue-800 mr-2">
                    <FilePen />
                  </button>
                </td>
                {layers
                  .filter((l) => l.type === "text")
                  .map((layer) => (
                    <td
                      key={layer.id}
                      className="border border-gray-300 px-2 py-1">
                      <input
                        type="text"
                        value={row.values[layer.title] || ""}
                        onChange={(e) => {
                          const updatedRows = [...tableRows];
                          updatedRows[rowIndex].values[layer.title] =
                            e.target.value;
                          setTableRows(updatedRows);
                        }}
                        className="w-full px-1 py-0.5 border rounded"
                      />
                    </td>
                  ))}
                <td>
                  <input
                    value={row.id}
                    onChange={(e) => {
                      const updatedRows = [...tableRows];
                      updatedRows[rowIndex].id = Number(e.target.value);
                      setTableRows(updatedRows);
                    }}
                  />
                </td>
                <td className="border border-gray-300 px-2 py-1 text-center">
                  <button
                    onClick={() =>
                      setTableRows((prev) =>
                        prev.filter((r) => r.id !== row.id)
                      )
                    }
                    className="text-red-600 hover:text-red-800">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex gap-2 mt-4">
          <button
            onClick={saveCardDataAsJSON}
            className="bg-indigo-500 text-white px-4 py-2 rounded">
            JSON保存
          </button>
          <label className="bg-gray-200 px-4 py-2 rounded cursor-pointer">
            JSON読み込み
            <input
              type="file"
              accept="application/json"
              onChange={loadCardDataFromJSON}
              className="hidden"
            />
          </label>
        </div>
      </div>
    </>
  );
}
