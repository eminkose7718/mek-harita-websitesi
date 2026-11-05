/** Veri odaklı proje vitrini + detay penceresi (önce/sonra karşılaştırma, 3D model) */
import { projects } from '../data/projects.js';
import { illustrations, projectArt } from './illustrations.js';
import { hasWebGL, detectQuality } from '../lib/quality.js';

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const media = (src, alt = '') =>
  projectArt[src] ?? illustrations[src] ?? `<img src="${esc(src)}" alt="${esc(alt)}" loading="lazy" decoding="async" />`;

export function initProjects(refreshIcons) {
  const grid = document.querySelector('[data-projects]');
  const dialog = document.querySelector('[data-project-dialog]');
  if (!grid || !dialog) return;

  grid.innerHTML = projects
    .map(
      (p) => `
    <button type="button" class="project-card group" data-project="${esc(p.id)}">
      <div class="project-cover">${p.cover ? media(p.cover, p.title) : media(p.illustration)}
        ${p.demo ? '<span class="demo-badge absolute left-2 top-2">Temsili örnek</span>' : ''}</div>
      <div class="p-5 flex-1 flex flex-col">
        <p class="eyebrow text-accent">${esc(p.category)}</p>
        <h3 class="mt-2 font-bold text-lg leading-snug">${esc(p.title)}</h3>
        <p class="mt-2 text-sm text-graphite/70 flex-1">${esc(p.summary)}</p>
        <p class="mt-4 text-sm font-bold text-primary">Detayları gör →</p>
      </div>
    </button>`,
    )
    .join('');

  let viewer = null;
  const body = dialog.querySelector('[data-pd-body]');
  const close = () => dialog.close();
  dialog.querySelector('[data-pd-close]').addEventListener('click', close);
  dialog.addEventListener('click', (e) => e.target === dialog && close());
  dialog.addEventListener('close', () => {
    viewer?.dispose();
    viewer = null;
  });

  grid.addEventListener('click', (e) => {
    const card = e.target.closest('[data-project]');
    if (!card) return;
    const p = projects.find((x) => x.id === card.dataset.project);
    dialog.querySelector('[data-pd-title]').textContent = p.title;
    dialog.querySelector('[data-pd-meta]').textContent = `${p.category} · ${p.location}${p.year ? ` · ${p.year}` : ''}`;
    dialog.querySelector('[data-pd-badge]').hidden = !p.demo;
    let html = p.details.map((d) => `<p class="text-graphite/80 leading-relaxed">${esc(d)}</p>`).join('');
    if (p.beforeAfter) {
      const ba = p.beforeAfter;
      html += `<figure>
        <div class="compare" data-compare>
          <div class="before">${media(ba.before)}</div><div class="after">${media(ba.after)}</div>
          <span class="compare-label left-2">${esc(ba.beforeLabel ?? 'Önce')}</span>
          <span class="compare-label right-2">${esc(ba.afterLabel ?? 'Sonra')}</span>
          <span class="divider"></span>
        </div>
        <label class="block mt-2 text-sm text-graphite/70">Karşılaştırma kaydırıcısı
          <input type="range" min="0" max="100" value="50" class="w-full accent-primary" data-compare-range /></label>
      </figure>`;
    }
    if (p.images?.length) {
      html += `<div class="grid grid-cols-2 gap-3">${p.images.map((src) => `<img src="${esc(src)}" alt="" loading="lazy" class="w-full border border-gray-200" />`).join('')}</div>`;
    }
    if (p.model) {
      html += `<div><button type="button" class="btn btn-outline !py-2 !px-3 text-sm" data-load-model>3D modeli görüntüle</button>
        <div class="model-box mt-3" data-model-box hidden></div></div>`;
    }
    if (p.demo) html += '<p class="note">Bu kart temsili bir örnektir; gerçek bir proje, müşteri veya ölçüm sonucunu göstermez.</p>';
    body.innerHTML = html;

    const range = body.querySelector('[data-compare-range]');
    range?.addEventListener('input', () => body.querySelector('[data-compare]').style.setProperty('--split', `${range.value}%`));
    body.querySelector('[data-load-model]')?.addEventListener('click', async (ev) => {
      const box = body.querySelector('[data-model-box]');
      box.hidden = false;
      ev.currentTarget.disabled = true;
      if (!hasWebGL()) {
        box.innerHTML = '<p class="p-4 text-sm">Bu cihazda 3D görünüm kullanılamıyor.</p>';
        return;
      }
      try {
        const mod = await import('../three/scenes/model-viewer.js');
        viewer = await mod.create(box, { quality: detectQuality(), model: p.model });
      } catch (err) {
        console.error(err);
        box.innerHTML = '<p class="p-4 text-sm">3D model yüklenemedi.</p>';
      }
    });
    dialog.showModal();
    refreshIcons?.();
  });
}
