// ============================================================
// Analytics helper
// ------------------------------------------------------------
// GA4 (gtag) の薄いラッパー。以下を満たす：
//  - SSR / gtag 未読み込み時は黙って no-op
//  - 例外は飲み込む（計測がアプリを落とさない）
//  - window.gtag に直接触るのはこのモジュールだけに集約
// ============================================================

declare global {
    interface Window {
      gtag?: (...args: unknown[]) => void;
    }
  }
  
  type EventParams = Record<string, string | number | boolean | undefined>;
  
  function isGtagAvailable(): boolean {
    return typeof window !== "undefined" && typeof window.gtag === "function";
  }
  
  /**
   * カスタムイベントを送信する。
   * @param name  例: "card_saved", "png_exported"
   * @param params イベントパラメータ（GA4 で custom dimension として参照可能）
   */
  export function trackEvent(name: string, params?: EventParams): void {
    if (!isGtagAvailable()) return;
    try {
      window.gtag!("event", name, params ?? {});
    } catch {
      // 計測失敗はアプリの挙動に影響させない
    }
  }
  
  /**
   * 仮想ページビュー。Proxyz ではハッシュタブ切り替えで発火させる。
   */
  export function trackPageView(tabKey: string, title: string): void {
    if (!isGtagAvailable()) return;
    try {
      const path = `${window.location.pathname}#${tabKey}`;
      window.gtag!("event", "page_view", {
        page_title: title,
        page_location: `${window.location.origin}${path}`,
        page_path: path,
      });
    } catch {
      // noop
    }
  }
  
  /**
   * セッション内で同名イベントを 1 回だけ送る。
   * 機能の初回使用（例: 回転・シャドウ）を計測したい場合に使う。
   * sessionStorage を用いるのでタブを閉じるとリセットされる。
   */
  const onceFiredInMemory = new Set<string>();
  
  export function trackOnce(name: string, params?: EventParams): void {
    if (typeof window === "undefined") return;
    const storageKey = `proxyz:analytics:once:${name}`;
    if (onceFiredInMemory.has(name)) return;
    try {
      if (sessionStorage.getItem(storageKey)) {
        onceFiredInMemory.add(name);
        return;
      }
      sessionStorage.setItem(storageKey, "1");
    } catch {
      // sessionStorage が使えない環境では in-memory のみでガード
    }
    onceFiredInMemory.add(name);
    trackEvent(name, params);
  }