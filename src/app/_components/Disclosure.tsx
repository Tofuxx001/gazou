"use client";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

type Props = {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
};

/**
 * 軽量な開閉セクション。<details>/<summary> ベースで a11y も自動。
 * Radix Themes にはAccordionが無いため、依存を増やさず自作。
 */
export function Disclosure({ title, defaultOpen = false, children }: Props) {
  return (
    <details
      open={defaultOpen}
      className="group border-b border-gray-100 last:border-b-0">
      <summary className="cursor-pointer list-none flex items-center gap-1.5 py-2 text-xs font-medium text-gray-600 hover:text-gray-900 select-none">
        <ChevronRight
          size={12}
          className="transition-transform duration-200 group-open:rotate-90"
        />
        {title}
      </summary>
      <div className="pb-3 pl-4">{children}</div>
    </details>
  );
}
