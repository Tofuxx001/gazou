"use client";
import { useId } from "react";

type Props = {
  label: string;
  value: number;
  onChange: (n: number) => void;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
};

/**
 * <label> と <input> を htmlFor で正しく関連付け、
 * 単位を input の右側に内包する数値フィールド。
 */
export function NumberField({
  label,
  value,
  onChange,
  unit,
  min,
  max,
  step = 1,
  className = "",
}: Props) {
  const id = useId();
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label htmlFor={id} className="text-xs text-gray-600 select-none">
        {label}
      </label>
      <div className="relative flex items-center">
        <input
          id={id}
          type="number"
          value={Number.isFinite(value) ? value : 0}
          min={min}
          max={max}
          step={step}
          onChange={(e) => {
            const n = e.target.valueAsNumber;
            if (Number.isFinite(n)) onChange(n);
          }}
          className={`w-full px-2 py-1.5 ${
            unit ? "pr-9" : ""
          } text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition`}
        />
        {unit && (
          <span className="absolute right-2 text-xs text-gray-400 pointer-events-none select-none">
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}
