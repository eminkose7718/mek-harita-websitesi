/** Kübaj hesap örneği — WebGL'den bağımsız çalışan hesap arayüzü */
import { computeCutFill, EXAMPLE_SURVEY } from '../lib/cubature.js';

const f = (v, d = 1) => v.toLocaleString('tr-TR', { minimumFractionDigits: d, maximumFractionDigits: d });

export function initCubature(root) {
  if (!root) return;
  const slider = root.querySelector('[data-cub-level]');
  const out = (s) => root.querySelector(s);
  const { z, spacing } = EXAMPLE_SURVEY;

  out('[data-cub-table]').innerHTML =
    `<thead><tr><th scope="col"><span class="sr-only">Satır</span></th>${z[0].map((_, c) => `<th scope="col">${c * spacing} m</th>`).join('')}</tr></thead>` +
    `<tbody>${z.map((row, r) => `<tr><th scope="row">${r * spacing} m</th>${row.map((v) => `<td>${f(v, 2)}</td>`).join('')}</tr>`).join('')}</tbody>`;

  function update() {
    const level = parseFloat(slider.value);
    const r = computeCutFill(z, spacing, level);
    out('[data-cub-level-out]').textContent = `${f(level, 2)} m`;
    out('[data-cub-cut]').textContent = `${f(r.cut)} m³`;
    out('[data-cub-fill]').textContent = `${f(r.fill)} m³`;
    out('[data-cub-net]').textContent = `${r.net >= 0 ? '+' : '−'}${f(Math.abs(r.net))} m³ ${r.net >= 0 ? '(fazla kazı)' : '(dolgu ihtiyacı)'}`;
    out('[data-cub-area]').textContent = `${f(r.area, 0)} m²`;
  }
  slider.addEventListener('input', update);
  update();
}
