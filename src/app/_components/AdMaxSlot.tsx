"use client";

import { useEffect, useId } from "react";
import { usePathname } from "next/navigation";

declare global {
  interface Window {
    admaxads?: Array<{ admax_id: string; type?: string }>;
  }
}

const ADMAX_SDK_SRC = "https://adm.shinobi.jp/st/t.js";
const ADMAX_SCRIPT_ID = "admax-sdk";

function ensureAdmaxSdkLoaded() {
  // 二重読み込み防止
  if (document.getElementById(ADMAX_SCRIPT_ID)) return;

  const s = document.createElement("script");
  s.id = ADMAX_SCRIPT_ID;
  s.src = ADMAX_SDK_SRC;
  s.async = true;
  s.charset = "utf-8";
  document.body.appendChild(s);
}

type Props = {
  admaxId: string;
  /** PC/SP切替なら "switch" がよく使われる */
  type?: string;
  className?: string;
  style?: React.CSSProperties;
};

export function AdMaxSlot({
  admaxId,
  type = "switch",
  className = "admax-switch",
  style,
}: Props) {
  const pathname = usePathname();
  const uid = useId(); // 同ページ内に複数置くときの衝突回避用

  useEffect(() => {
    // キューを先に積む（SDKが後から来ても拾える想定）
    window.admaxads = window.admaxads || [];
    window.admaxads.push({ admax_id: admaxId, type });

    // SDKロード（未ロードなら）
    ensureAdmaxSdkLoaded();
  }, [pathname, admaxId, type]);

  return (
    <div
      key={`${pathname}-${uid}`} // ルート遷移でDOMを作り直してもらう
      className={className}
      data-admax-id={admaxId}
      style={{ display: "inline-block", ...style }}
    />
  );
}
