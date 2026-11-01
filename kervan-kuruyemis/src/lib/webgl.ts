export function hasWebGL(): boolean {
  try {
    const c = document.createElement("canvas");
    const gl = (c.getContext("webgl2") || c.getContext("webgl")) as WebGLRenderingContext | null;
    if (!gl) return false;
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}

export function detectQuality(): "low" | "medium" | "high" {
  const q = new URLSearchParams(window.location.search).get("q");
  if (q === "low" || q === "medium" || q === "high") return q;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const small = Math.min(window.innerWidth, window.innerHeight) < 600;
  const cores = navigator.hardwareConcurrency || 4;
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;
  if (coarse || small) return cores >= 8 && mem >= 6 && !small ? "medium" : "low";
  return cores >= 8 && mem >= 8 ? "high" : "medium";
}
