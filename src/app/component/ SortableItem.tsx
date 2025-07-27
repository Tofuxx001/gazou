"use client";
import { useSortable } from "@dnd-kit/sortable";
import type { UniqueIdentifier } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { ReactNode } from "react";
import { GripVertical } from "lucide-react"; // ← ハンドル用アイコン

type Props = {
  id: UniqueIdentifier;
  children: ReactNode;
};

export function SortableItem({ id, children }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="flex items-center gap-2 p-2 border rounded bg-white">
      {/* 👇 ここがドラッグ専用ハンドル！ */}
      <span
        {...listeners}
        className="cursor-grab text-gray-400 cursor-grab select-none">
        <GripVertical size={16} />
      </span>

      <div className="flex-1">{children}</div>
    </div>
  );
}
