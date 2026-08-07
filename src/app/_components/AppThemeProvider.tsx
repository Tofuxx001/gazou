"use client";
import { Theme } from "@radix-ui/themes";
import { ThemeProvider, useTheme } from "./ThemeProvider";

/**
 * Radix の <Theme appearance> は現在の解決済みテーマを必要とするが、
 * それを知っているのは ThemeProvider の中（クライアント側）だけ。
 * そのため Provider の内側でもう一段コンポーネントを挟んで、
 * useTheme() の値を Theme に渡している。
 */
function RadixThemeBridge({ children }: { children: React.ReactNode }) {
  const { resolved } = useTheme();
  return (
    <Theme appearance={resolved} accentColor="indigo" grayColor="slate">
      {children}
    </Theme>
  );
}

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <RadixThemeBridge>{children}</RadixThemeBridge>
    </ThemeProvider>
  );
}
