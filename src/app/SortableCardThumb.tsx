"use client";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

type Props = {
  id: number;
  name?: string;
  thumbnail?: string;
  onLoad: () => void;
};

/**
 * カード一覧のサムネイル 1 枚。
 * つまみ（GripVertical）をドラッグしたときだけ並び替えが始まるようにして、
 * サムネイル本体のクリック＝カード読み込みと競合しないようにしている。
 */
export function SortableCardThumb({ id, name, thumbnail, onLoad }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative aspect-[3/4] rounded-md overflow-hidden border border-gray-200 hover:border-indigo-400 hover:shadow-md transition-all bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
      {/* ドラッグつまみ — ここだけがドラッグ開始点 */}
      <div
        {...attributes}
        {...listeners}
        aria-label={`${name ?? `カード#${id}`} を並び替え`}
        className="absolute top-0.5 left-0.5 z-10 p-0.5 rounded bg-white/80 dark:bg-black/60 text-gray-600 dark:text-gray-300 opacity-0 group-hover:opacity-100 focus:opacity-100 transition cursor-grab active:cursor-grabbing touch-none">
        <GripVertical size={12} />
      </div>

      {/* 本体クリックで読み込み */}
      <button
        type="button"
        onClick={onLoad}
        className="w-full h-full"
        aria-label={`${name ?? `カード#${id}`} を読み込む`}>
        {thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumbnail} alt={name ?? `カード#${id}`} className="w-full h-full object-contain" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
            #{id}
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent text-white text-[10px] px-1 py-0.5 truncate text-left">
          {name ?? `カード#${id}`}
        </div>
      </button>
    </div>
  );
}
