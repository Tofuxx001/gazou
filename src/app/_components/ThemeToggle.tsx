"use client";
import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme, type ThemeMode } from "./ThemeProvider";
import { trackEvent } from "./analytics";

const OPTIONS: { mode: ThemeMode; icon: typeof Sun; label: string }[] = [
  { mode: "light", icon: Sun, label: "ライト" },
  { mode: "dark", icon: Moon, label: "ダーク" },
  { mode: "system", icon: Monitor, label: "OS設定に合わせる" },
];

/**
 * ライト / ダーク / OS設定 の 3 択トグル。
 * セグメント型にしているのは、「今どれが選ばれているか」が
 * 一目で分かるようにするため（単純なトグルだと system が表現できない）。
 */
export function ThemeToggle() {
  const { mode, setMode } = useTheme();

  return (
    <div
      role="group"
      aria-label="表示テーマ"
      className="inline-flex items-center rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 p-0.5">
      {OPTIONS.map(({ mode: m, icon: Icon, label }) => (
        <button
          key={m}
          type="button"
          onClick={() => {
            setMode(m);
            trackEvent("theme_changed", { mode: m });
          }}
          title={label}
          aria-label={label}
          aria-pressed={mode === m}
          className={`p-1.5 rounded-md transition ${
            mode === m
              ? "bg-indigo-500 text-white"
              : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
          }`}>
          <Icon size={14} />
        </button>
      ))}
    </div>
  );
}
