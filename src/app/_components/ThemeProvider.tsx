"use client";
import { createContext, useContext, useEffect, useState, useCallback } from "react";

export type ThemeMode = "light" | "dark" | "system";

const STORAGE_KEY = "proxyz:theme:v1";

type ThemeContextValue = {
  /** ユーザーの選択（system を含む） */
  mode: ThemeMode;
  /** 実際に適用されている外観（system を解決した結果） */
  resolved: "light" | "dark";
  setMode: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  mode: "system",
  resolved: "light",
  setMode: () => {},
});

export const useTheme = () => useContext(ThemeContext);

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // SSR とクライアントで初期値を揃えるため、初回は必ず "system" から始める。
  // 実際の復元は下の useEffect で行う（ハイドレーション不一致を避けるため）。
  const [mode, setModeState] = useState<ThemeMode>("system");
  const [resolved, setResolved] = useState<"light" | "dark">("light");

  // 保存済みの選択を復元
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
      if (saved === "light" || saved === "dark" || saved === "system") {
        setModeState(saved);
      }
    } catch {
      // localStorage が使えない環境ではデフォルトのまま
    }
  }, []);

  // mode → resolved の解決と、OS 設定変更への追従
  useEffect(() => {
    const apply = () => {
      const next = mode === "system" ? getSystemTheme() : mode;
      setResolved(next);
      // Tailwind の dark: バリアント用に html へクラスを付与
      const root = document.documentElement;
      root.classList.toggle("dark", next === "dark");
      root.style.colorScheme = next;
    };

    apply();

    if (mode !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [mode]);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // 保存に失敗してもテーマ切り替え自体は動かす
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ mode, resolved, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}
