export type WebGlProbe = {
  ok: boolean;
  api: "webgl2" | "webgl" | "none";
  software: boolean;
};

export const WEBGL_CTX_OPTS: WebGLContextAttributes = {
  alpha: true,
  depth: true,
  stencil: false,
  antialias: false,
  powerPreference: "default",
  failIfMajorPerformanceCaveat: false,
  premultipliedAlpha: true,
  preserveDrawingBuffer: false,
};

/**
 * Brave Shields / fingerprinting can return null for WebGL, or only WebGL1,
 * or SwiftShader. Probe a throwaway canvas and drop that context so we do
 * not spend the browser's (often tiny) WebGL context budget.
 */
export function probeWebGL(): WebGlProbe {
  if (typeof document === "undefined") return { ok: false, api: "none", software: false };
  const canvas = document.createElement("canvas");
  let gl: WebGLRenderingContext | WebGL2RenderingContext | null = null;
  let api: WebGlProbe["api"] = "none";
  try {
    gl = canvas.getContext("webgl2", WEBGL_CTX_OPTS) as WebGL2RenderingContext | null;
    if (gl) api = "webgl2";
    else {
      gl = (canvas.getContext("webgl", WEBGL_CTX_OPTS) ||
        canvas.getContext("experimental-webgl", WEBGL_CTX_OPTS)) as WebGLRenderingContext | null;
      if (gl) api = "webgl";
    }
  } catch {
    return { ok: false, api: "none", software: false };
  }
  if (!gl) return { ok: false, api: "none", software: false };
  let renderer = "";
  try {
    renderer = String(gl.getParameter(gl.RENDERER) || "");
  } catch {
    renderer = "";
  }
  const software = /swiftshader|llvmpipe|softpipe|microsoft basic render/i.test(renderer);
  try {
    gl.getExtension("WEBGL_lose_context")?.loseContext();
  } catch {
    /* Brave may block the extension; the probe canvas is discarded either way. */
  }
  return { ok: true, api, software };
}

export function getWebGlContext(canvas: HTMLCanvasElement, antialias: boolean): WebGLRenderingContext {
  const opts: WebGLContextAttributes = { ...WEBGL_CTX_OPTS, antialias };
  const context =
    (canvas.getContext("webgl2", opts) as WebGLRenderingContext | null) ||
    (canvas.getContext("webgl", opts) as WebGLRenderingContext | null) ||
    (canvas.getContext("experimental-webgl", opts) as WebGLRenderingContext | null);
  if (!context) throw new Error("WEBGL_BLOCKED");
  return context;
}
