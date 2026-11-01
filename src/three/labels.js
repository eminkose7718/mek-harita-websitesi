import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

/** Teknik etiket (DOM). html güvenilir, kod içinde üretilmiş metindir. */
export function makeLabel(html, { variant = '', anchor = 'left' } = {}) {
  const el = document.createElement('div');
  el.className = `scene-label ${variant}`.trim();
  el.innerHTML = html;
  const obj = new CSS2DObject(el);
  if (anchor === 'left') obj.center.set(0, 0.5);
  else if (anchor === 'bottom') obj.center.set(0.5, 1);
  return obj;
}

export function setLabelOpacity(obj, a) {
  obj.element.style.opacity = String(a);
  obj.visible = a > 0.02;
}

export function setLabelHTML(obj, html) {
  if (obj.element.innerHTML !== html) obj.element.innerHTML = html;
}
