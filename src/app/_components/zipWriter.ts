// ============================================================
// 最小構成の ZIP ライター
// ------------------------------------------------------------
// Unity 書き出しは .prefab / .mat / .png / .meta と複数ファイルに
// なるため ZIP でまとめる必要がある。JSZip 等を入れると依存が増える
// ので、無圧縮（STORE 方式）の ZIP を自前で組み立てている。
// PNG は既に圧縮済みなので、STORE でもサイズ的な不利はほぼ無い。
// ============================================================

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(data: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    c = CRC_TABLE[(c ^ data[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

/** ZIP は MS-DOS 形式の日時を持つ */
function dosDateTime(d: Date) {
  const time = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
  const date = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
  return { time, date };
}

export type ZipEntry = {
  /** ZIP 内のパス。区切りは常に "/" */
  path: string;
  data: Uint8Array | string;
};

export function createZip(entries: ZipEntry[]): Blob {
  const encoder = new TextEncoder();
  const parts: Uint8Array[] = [];
  const centralRecords: Uint8Array[] = [];
  const { time, date } = dosDateTime(new Date());
  let offset = 0;

  for (const entry of entries) {
    const nameBytes = encoder.encode(entry.path);
    const data =
      typeof entry.data === "string" ? encoder.encode(entry.data) : entry.data;
    const crc = crc32(data);

    // --- ローカルファイルヘッダ ---
    const local = new Uint8Array(30 + nameBytes.length);
    const lv = new DataView(local.buffer);
    lv.setUint32(0, 0x04034b50, true); // signature
    lv.setUint16(4, 20, true); // version needed
    lv.setUint16(6, 0x0800, true); // フラグ: ファイル名は UTF-8
    lv.setUint16(8, 0, true); // 圧縮方式 0 = store
    lv.setUint16(10, time, true);
    lv.setUint16(12, date, true);
    lv.setUint32(14, crc, true);
    lv.setUint32(18, data.length, true); // 圧縮後サイズ
    lv.setUint32(22, data.length, true); // 元サイズ
    lv.setUint16(26, nameBytes.length, true);
    lv.setUint16(28, 0, true); // extra field 長
    local.set(nameBytes, 30);

    parts.push(local, data);

    // --- セントラルディレクトリ ---
    const central = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(central.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true); // version made by
    cv.setUint16(6, 20, true); // version needed
    cv.setUint16(8, 0x0800, true);
    cv.setUint16(10, 0, true);
    cv.setUint16(12, time, true);
    cv.setUint16(14, date, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, data.length, true);
    cv.setUint32(24, data.length, true);
    cv.setUint16(28, nameBytes.length, true);
    cv.setUint16(30, 0, true); // extra
    cv.setUint16(32, 0, true); // comment
    cv.setUint16(34, 0, true); // disk number
    cv.setUint16(36, 0, true); // internal attrs
    cv.setUint32(38, 0, true); // external attrs
    cv.setUint32(42, offset, true); // ローカルヘッダの位置
    central.set(nameBytes, 46);
    centralRecords.push(central);

    offset += local.length + data.length;
  }

  const centralSize = centralRecords.reduce((sum, r) => sum + r.length, 0);

  // --- End of central directory ---
  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(4, 0, true); // このディスク番号
  ev.setUint16(6, 0, true); // セントラルディレクトリ開始ディスク
  ev.setUint16(8, entries.length, true);
  ev.setUint16(10, entries.length, true);
  ev.setUint32(12, centralSize, true);
  ev.setUint32(16, offset, true);
  ev.setUint16(20, 0, true); // コメント長

  const blobParts: BlobPart[] = [
    ...parts.map((p) => p.slice().buffer as ArrayBuffer),
    ...centralRecords.map((c) => c.slice().buffer as ArrayBuffer),
    eocd.slice().buffer as ArrayBuffer,
  ];
  return new Blob(blobParts, { type: "application/zip" });
}

/** data URL ("data:image/png;base64,...") をバイト列に変換する */
export function dataUrlToBytes(dataUrl: string): Uint8Array {
  const comma = dataUrl.indexOf(",");
  if (comma === -1) return new Uint8Array(0);
  const base64 = dataUrl.slice(comma + 1);
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/** Blob をダウンロードさせる */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
