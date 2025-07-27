"use client";
import { use, useState, useRef } from "react";
import { HexColorPicker } from "react-colorful";
import {
  Tabs,
  TextArea,
  Slider,
  Switch,
  TextField,
  Select,
} from "@radix-ui/themes";
import { Trash2, FilePen, Save } from "lucide-react";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { DndContext, DragEndEvent } from "@dnd-kit/core";
import { SortableItem } from "./ SortableItem";

export default function CardMaker() {
  async function SaveCard() {
    const target = document.getElementById("myCanvas");
    if (!target) return;

    const html = target.outerHTML;

    const response = await fetch("/api/convert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        html,
        width: canvasData.width,
        height: canvasData.height,
      }),
    });

    if (!response.ok) {
      console.error("画像保存API失敗:", await response.text());
      return;
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "card.png";
    a.click();
    URL.revokeObjectURL(url);
  }
  //以下変数用変数

  type Color = `#${string}`;
  const [color, setColor] = useState<Color>("#000000");
  type Layer = {
    id: string;
    type: "text" | "image";
    title: string;
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
    id: string;
    values: Record<string, string>; // title => value マッピング
  };
  const [tableRows, setTableRows] = useState<TableRow[]>([]);
  const [layers, setLayers] = useState<Layer[]>([
    {
      id: "1",
      type: "text",
      value: "",
      title: "タイトル",
      zIndex: 3,
      fontStyle: "normal",
      fontSize: 20,
      fontColor: "#000000",
      fontOutline: "#000000",
      PositionPreset: "center",
      positionAdjX: 0,
      positionAdjY: 0,
      backGround: false,
      textPadding: 10,
      bgColor: "#111111",
      bgRadius: 0,
      bgOpacity: 1,
    },
    {
      id: "2",
      type: "text",
      value: "説明文2",
      title: "タイトル２",
      zIndex: 2,
      fontStyle: "normal",
      fontSize: 20,
      fontColor: "#000000",
      fontOutline: "#000000",
      PositionPreset: "center",
      positionAdjX: 0,
      positionAdjY: 0,
      backGround: false,
      textPadding: 10,
      bgColor: "#111111",
      bgRadius: 0,
      bgOpacity: 1,
    },
    {
      id: "3",
      type: "text",
      value: "注釈3",
      title: "タイトル３",
      zIndex: 1,
      fontStyle: "normal",
      fontSize: 20,
      fontColor: "#000000",
      fontOutline: "#000000",
      PositionPreset: "center",
      positionAdjX: 0,
      positionAdjY: 0,
      backGround: false,
      textPadding: 10,
      bgColor: "#111111",
      bgRadius: 0,
      bgOpacity: 1,
    },
  ]);
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
      const newArr = [...prev];
      const [moved] = newArr.splice(oldIndex, 1);
      newArr.splice(newIndex, 0, moved);

      // zIndexを上から順に再設定（後ろが下）
      const zUpdated = newArr.map((layer, i, arr) => ({
        ...layer,
        zIndex: arr.length - i,
      }));

      return zUpdated;
    });
  };
  //これはレイヤー描画
  const transformWithFontFix = (
    preset: Layer["PositionPreset"],
    fontSize: number
  ): string => {
    const presetTransforms: Record<Layer["PositionPreset"], string> = {
      "top-left": "translate(0%, 0%)",
      "top-center": "translate(-50%, 0%)",
      "top-right": "translate(-100%, 0%)",
      "center-left": "translate(0%, -50%)",
      center: "translate(-50%, -50%)",
      "center-right": "translate(-100%, -50%)",
      "bottom-left": "translate(0%, -100%)",
      "bottom-center": "translate(-50%, -100%)",
      "bottom-right": "translate(-100%, -100%)",
    };

    let transform = presetTransforms[preset];

    // 補正（大文字フォントサイズが極端に大きいときのY方向ズレ対策）
    const offsetY = fontSize * 0.5; // ※調整可能（だいたい良いのは 0.12〜0.18）
    transform += ` translateY(-${offsetY}px)`;
    return transform;
  };
  const getLayerStyle = (layer: Layer): React.CSSProperties => {
    // ベースの実ピクセルサイズ（キャンバスサイズに対する割合）
    const baseW = canvasData.width * (baseData.width / 100);
    const baseH = canvasData.height * (baseData.height / 100);

    // 各位置プリセットごとのオフセットとtransform
    const presetOffsets: Record<
      Layer["PositionPreset"],
      [string, string, string]
    > = {
      "top-left": ["0%", "0%", "translate(0%, 0%)"],
      "top-center": ["50%", "0%", "translate(-50%, 0%)"],
      "top-right": ["100%", "0%", "translate(-100%, 0%)"],
      "center-left": ["0%", "50%", "translate(0%, -50%)"],
      center: ["50%", "50%", "translate(-50%, -50%)"],
      "center-right": ["100%", "50%", "translate(-100%, -50%)"],
      "bottom-left": ["0%", "100%", "translate(0%, -100%)"],
      "bottom-center": ["50%", "100%", "translate(-50%, -100%)"],
      "bottom-right": ["100%", "100%", "translate(-100%, -100%)"],
    };

    const [left, top, transform] = presetOffsets[layer.PositionPreset];

    const style: React.CSSProperties = {
      position: "absolute",
      left: `calc(${left} + ${layer.positionAdjX}px)`,
      top: `calc(${top} + ${layer.positionAdjY}px)`,
      transform,
      zIndex: layer.zIndex,
      borderRadius: `${layer.bgRadius}px`,
      overflow: "visible",
      whiteSpace: "pre-line",
    };

    if (layer.type === "text") {
      style.transform = transformWithFontFix(
        layer.PositionPreset,
        layer.fontSize
      );

      style.fontSize = `${layer.fontSize}px`;
      style.lineHeight = `${layer.fontSize}px`; // ← 🎯 これ追加

      style.fontWeight =
        layer.fontStyle === "Bold"
          ? "bold"
          : layer.fontStyle === "thin"
          ? "200"
          : "normal";

      style.color = layer.fontColor;
      style.textShadow = `0 0 2px ${layer.fontOutline}`;
      style.padding = `${layer.textPadding}px`;
      style.whiteSpace = "pre-line";

      style.backgroundColor = layer.backGround
        ? hexToRGBA(layer.bgColor, layer.bgOpacity)
        : "transparent";

      // 🎯 追加スタイル
      style.WebkitFontSmoothing = "antialiased";
      style.MozOsxFontSmoothing = "grayscale";
    }

    if (layer.type === "image") {
      style.width = `${layer.imageWidth}px`;
      style.height = `${layer.imageHeight}px`;
      style.objectFit = layer.fitStyle ?? "contain";
      style.opacity = layer.opacity ?? 1;
    }

    return style;
  };

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
    width: number;
    height: number;
    bgColor: Color;
    radius: number;
  }>({
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
        <div
          id="myCanvas"
          className=""
          style={{
            position: "relative",
            width: canvasData.width,
            height: canvasData.height,
            backgroundColor: canvasData.bgColor,
            borderRadius: canvasData.radius,
            imageRendering: "pixelated", // オプション
            transform: "scale(1)", // debug用に明示的に拡大縮小を抑止
          }}>
          <div
            id="base"
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: canvasData.width * baseData.width * 0.01,
              height: canvasData.height * baseData.height * 0.01,
              ...(baseData.imageSrc != "null"
                ? {
                    backgroundImage: `url(${baseData.imageSrc})`,
                    backgroundSize: `${baseData.imageHight}% ${baseData.imageWidth}%`,
                    backgroundPosition: `${baseData.imagePositionX}% ${baseData.imagePositionY}%`,
                  }
                : {}),
              ...(baseData.imageSrc == "null"
                ? { backgroundColor: baseData.bgColor }
                : {}),
              overflow: "visible",
              borderRadius: baseData.radius,
            }}>
            {layers.map((layer) => (
              <div key={layer.id} style={getLayerStyle(layer)}>
                {layer.type === "text" && layer.value}
                {layer.type === "image" && layer.value && (
                  <img
                    src={layer.value}
                    style={{
                      width: `${layer.imageWidth}px`,
                      height: `${layer.imageHeight}px`,
                      borderRadius: `${layer.bgRadius}px`,
                      objectFit: "contain",
                      pointerEvents: "none",
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
        <div id="TextEditor" className="m-3 border-1 rounded-xl p-2 ">
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
                      title: `レイヤー${savedCards.length + 1}`,
                      value: "",
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
                  const nextId = `${Date.now()}`;
                  const maxZ = Math.max(...layers.map((l) => l.zIndex), 0);
                  const newImageLayer: Layer = {
                    id: nextId,
                    type: "image",
                    title: `レイヤー${savedCards.length + 1}`,
                    value: "", // 空の状態（画像未設定）
                    zIndex: maxZ + 1,
                    fontStyle: "normal",
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
                  };
                  setLayers((prev) => [...prev, newImageLayer]);
                }}
                className="bg-green-500 text-white px-4 py-1 rounded">
                + 画像レイヤー追加
              </button>
              <button
                onClick={async () => {
                  await SaveCard(); // ← まずキャンバス画像を保存
                  const newId = `${Date.now()}`;
                  const currentValues = Object.fromEntries(
                    layers
                      .filter((l) => l.type === "text")
                      .map((l) => [l.title, l.value])
                  );

                  const existingIndex = tableRows.findIndex(
                    (r) => r.id === newId
                  );

                  const newRow: TableRow = {
                    id: newId,
                    values: currentValues,
                  };

                  setTableRows((prev) => {
                    if (existingIndex !== -1) {
                      // 上書き
                      const updated = [...prev];
                      updated[existingIndex] = newRow;
                      return updated;
                    } else {
                      // 追加
                      return [...prev, newRow];
                    }
                  });
                }}
                className="mt-2 ml-2 bg-green-600 text-white px-3 py-1 rounded">
                <Save />
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
                      // values を元に、各 title に対応するレイヤーの value を更新
                      const updatedLayers = layers.map((layer) => {
                        if (
                          layer.type === "text" &&
                          row.values[layer.title] !== undefined
                        ) {
                          return { ...layer, value: row.values[layer.title] };
                        }
                        return layer;
                      });
                      setLayers(updatedLayers);
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
      </div>
    </>
  );
}
