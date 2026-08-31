/** One user gesture → one file. Pair download is a zip so the second STL is not blocked. */

/** FileSaver-style: long enough for Save As, short enough not to pin megabyte blobs. */
export const LIVE_REVOKE_MS = 60_000;

let liveUrl: string | null = null;
let liveAnchor: HTMLAnchorElement | null = null;
let liveTimer: number | null = null;

function revokeLive() {
  if (liveTimer != null) {
    window.clearTimeout(liveTimer);
    liveTimer = null;
  }
  if (liveAnchor) {
    liveAnchor.remove();
    liveAnchor = null;
  }
  if (liveUrl) {
    URL.revokeObjectURL(liveUrl);
    liveUrl = null;
  }
}

function blobFrom(data: ArrayBuffer | Uint8Array, mime: string) {
  const src = data instanceof Uint8Array ? data : new Uint8Array(data);
  const owned = new ArrayBuffer(src.byteLength);
  new Uint8Array(owned).set(src);
  return new Blob([owned], { type: mime });
}

export function createDownloadObject(
  filename: string,
  data: ArrayBuffer | Uint8Array,
  mime = "application/octet-stream",
) {
  revokeLive();
  const blob = blobFrom(data, mime);
  const url = URL.createObjectURL(blob);
  liveUrl = url;
  return { url, filename };
}

/**
 * Keep the object URL until the next download, a 60s timer, or pagehide.
 * A 4s revoke races Chrome/Safari and yields a 0-byte file. Never-revoking
 * pins the zip Blob for the rest of the session.
 */
export function triggerDownload(filename: string, data: ArrayBuffer | Uint8Array, mime = "application/octet-stream") {
  const { url } = createDownloadObject(filename, data, mime);
  const nav = window.navigator as Navigator & { msSaveOrOpenBlob?: (b: Blob, n: string) => void };
  if (typeof nav.msSaveOrOpenBlob === "function") {
    nav.msSaveOrOpenBlob(blobFrom(data, mime), filename);
    return { url, filename };
  }
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  a.setAttribute("data-stl-download", filename);
  a.style.display = "none";
  document.body.appendChild(a);
  liveAnchor = a;
  a.click();
  liveTimer = window.setTimeout(revokeLive, LIVE_REVOKE_MS);
  return { url, filename };
}

export function disposeDownload() {
  revokeLive();
}

if (typeof window !== "undefined") {
  window.addEventListener("pagehide", disposeDownload);
  window.addEventListener("beforeunload", disposeDownload);
}

function crc32(buf: Uint8Array) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let j = 0; j < 8; j++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return (c ^ 0xffffffff) >>> 0;
}

export function textBytes(text: string): ArrayBuffer {
  const bytes = new TextEncoder().encode(text);
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}

export function zipStore(files: { name: string; data: ArrayBuffer }[]) {
  const locals: Uint8Array[] = [];
  const centrals: Uint8Array[] = [];
  let offset = 0;
  const enc = new TextEncoder();
  for (const file of files) {
    const name = enc.encode(file.name);
    const data = new Uint8Array(file.data);
    const crc = crc32(data);
    const local = new Uint8Array(30 + name.length);
    const lv = new DataView(local.buffer);
    lv.setUint32(0, 0x04034b50, true);
    lv.setUint16(4, 20, true);
    lv.setUint32(14, crc, true);
    lv.setUint32(18, data.length, true);
    lv.setUint32(22, data.length, true);
    lv.setUint16(26, name.length, true);
    local.set(name, 30);
    locals.push(local, data);
    const central = new Uint8Array(46 + name.length);
    const cv = new DataView(central.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true);
    cv.setUint16(6, 20, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, data.length, true);
    cv.setUint32(24, data.length, true);
    cv.setUint16(28, name.length, true);
    cv.setUint32(42, offset, true);
    central.set(name, 46);
    centrals.push(central);
    offset += local.length + data.length;
  }
  const centralSize = centrals.reduce((n, c) => n + c.length, 0);
  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(8, files.length, true);
  ev.setUint16(10, files.length, true);
  ev.setUint32(12, centralSize, true);
  ev.setUint32(16, offset, true);
  const out = new Uint8Array(offset + centralSize + 22);
  let w = 0;
  for (const part of locals) {
    out.set(part, w);
    w += part.length;
  }
  for (const part of centrals) {
    out.set(part, w);
    w += part.length;
  }
  out.set(eocd, w);
  return out;
}
