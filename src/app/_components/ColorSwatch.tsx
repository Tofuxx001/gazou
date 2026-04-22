"use client";
import { Popover } from "@radix-ui/themes";
import { HexColorPicker } from "react-colorful";

type Props = {
  label?: string;
  value: string;
  onChange: (color: string) => void;
};

/**
 * 色のスウォッチを押すとPopover内に HexColorPicker が出る。
 * 縦に長いカラーピッカーを常時展開しないことで画面圧迫を解消。
 */
export function ColorSwatch({ label, value, onChange }: Props) {
  return (
    <div className="flex items-center gap-2">
      {label && (
        <span className="text-xs text-gray-600 select-none">{label}</span>
      )}
      <Popover.Root>
        <Popover.Trigger>
          <button
            type="button"
            aria-label={label ? `${label}を選択` : "色を選択"}
            className="w-8 h-8 rounded-md border border-gray-300 shadow-sm hover:scale-105 active:scale-95 transition-transform"
            style={{ backgroundColor: value }}
          />
        </Popover.Trigger>
        <Popover.Content size="1" className="!p-3">
          <div className="flex flex-col gap-2">
            <HexColorPicker
              color={value}
              onChange={onChange}
              style={{ width: "200px", height: "160px" }}
            />
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="w-full px-2 py-1 text-xs font-mono border border-gray-200 rounded uppercase"
              maxLength={7}
            />
          </div>
        </Popover.Content>
      </Popover.Root>
    </div>
  );
}
