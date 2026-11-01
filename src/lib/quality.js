/** Cihaz yeteneklerine göre 3D kalite seviyesi ve erişilebilirlik tercihleri. */
let webgl = null;

export function hasWebGL() {
  if (webgl !== null) return webgl;
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2') || c.getContext('webgl');
    webgl = !!gl;
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
  } catch {
    webgl = false;
  }
  return webgl;
}

export const isCoarsePointer = () => window.matchMedia('(pointer: coarse)').matches;
export const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** 'high' | 'low' — mobil ve zayıf cihazlarda düşük çözünürlüklü arazi, gölgesiz ışık, düşük piksel oranı */
export function detectQuality() {
  const small = window.innerWidth < 768;
  const cores = navigator.hardwareConcurrency ?? 4;
  const mem = navigator.deviceMemory ?? 8;
  if (small || isCoarsePointer() || (cores <= 4 && mem <= 4)) return 'low';
  return 'high';
}

export const maxPixelRatio = (q) => (q === 'high' ? 1.75 : 1.35);
