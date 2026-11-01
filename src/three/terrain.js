/**
 * TEMSİLİ 3D ARAZİ MODELİ
 *
 * Bu arazi gerçek bir coğrafi veriden değil, tohumlanmış gürültü fonksiyonlarından
 * prosedürel olarak üretilir. Gerçek bir konumu temsil etmez.
 *
 * Koordinat kuralları (karıştırılmaması için):
 *  - Yerel metrik koordinat (e, n): model merkezine göre doğu (e) ve kuzey (n), metre.
 *    Türkiye'deki ölçme pratiğine uygun olarak arayüzde Y = doğu (sağa), X = kuzey (yukarı)
 *    olarak gösterilir; gerçek bir ülke koordinat sistemine (ör. TM/ITRF) bağlı DEĞİLDİR.
 *  - Kot (h): metre, model içi örnek kot.
 *  - Sahne koordinatı (Three.js): x = e·S, y = h·S·EXAG, z = −n·S  (S: ölçek, EXAG: düşey abartma).
 *  - Coğrafi koordinat (enlem/boylam) bu modelde KULLANILMAZ; gerçek veri gelirse
 *    önce projeksiyonlu metrik sisteme dönüştürülmelidir (bkz. data/geo.js).
 */
import * as THREE from 'three';
import { createNoise2D } from '../lib/noise.js';

export const SIZE = 400; // model kenar uzunluğu (m)
export const S = 0.1; // sahne birimi / metre
export const EXAG = 1.5; // düşey abartma
export const YS = S * EXAG;

const { fbm } = createNoise2D(11);
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const smooth = (a, b, x) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

/** Model içi örnek kot (m). e, n ∈ [−200, 200] */
export function elevation(e, n) {
  const nx = e / SIZE;
  const ny = n / SIZE;
  let h = 42 + 26 * fbm(nx * 2.2 + 3.1, ny * 2.2 - 1.7, 5);
  h += 6 * fbm(nx * 7 + 10, ny * 7 + 4, 3);
  h -= 0.11 * n; // kuzeye doğru eğim
  h += 24 * Math.exp(-(((e - 110) ** 2) / (2 * 70 ** 2) + ((n + 120) ** 2) / (2 * 60 ** 2))); // sırt
  const vx = e + 70 - 0.35 * n;
  h -= 13 * Math.exp(-(vx * vx) / (2 * 22 * 22)); // dere vadisi
  h -= 34 * smooth(105, 200, n); // kıyı
  // Örnek parsel çevresinde yumuşak eğimli alan
  const w = 0.85 * Math.exp(-(e * e + n * n) / (2 * 40 * 40));
  const site = 34 - 0.06 * n + 0.02 * e;
  h = h * (1 - w) + site * w;
  // Model kenarlarında deniz seviyesinin altına yumuşak geçiş (kesik kenar görünmesin)
  const edge = SIZE / 2 - Math.max(Math.abs(e), Math.abs(n));
  return -10 + (h + 10) * smooth(0, 120, edge);
}

export function toScene(e, n, h, out = new THREE.Vector3()) {
  return out.set(e * S, h * YS, -n * S);
}
export function fromScene(v) {
  return { e: v.x / S, n: -v.z / S, h: v.y / YS };
}

/* ---------------- Yükseklik ağı ---------------- */
const grids = new Map();

export function getGrid(res) {
  if (grids.has(res)) return grids.get(res);
  const N = res + 1;
  const step = SIZE / res;
  const h = new Float32Array(N * N);
  let min = Infinity;
  let max = -Infinity;
  for (let j = 0; j < N; j++) {
    const n = SIZE / 2 - j * step;
    for (let i = 0; i < N; i++) {
      const v = elevation(-SIZE / 2 + i * step, n);
      h[j * N + i] = v;
      if (v < min) min = v;
      if (v > max) max = v;
    }
  }
  const g = { res, N, step, h, min, max };
  grids.set(res, g);
  return g;
}

/** Ağ üzerindeki (mesh ile birebir aynı üçgenlemeyle) kot */
export function sampleGrid(g, e, n) {
  const fi = (e + SIZE / 2) / g.step;
  const fj = (SIZE / 2 - n) / g.step;
  const i = Math.min(g.res - 1, Math.max(0, Math.floor(fi)));
  const j = Math.min(g.res - 1, Math.max(0, Math.floor(fj)));
  const u = clamp01(fi - i);
  const v = clamp01(fj - j);
  const N = g.N;
  const a = g.h[j * N + i];
  const b = g.h[j * N + i + 1];
  const c = g.h[(j + 1) * N + i];
  const d = g.h[(j + 1) * N + i + 1];
  if (u + v <= 1) return a + (b - a) * u + (c - a) * v;
  return d + (c - d) * (1 - u) + (b - d) * (1 - v);
}

function slopeAt(g, i, j) {
  const N = g.N;
  const i0 = Math.max(0, i - 1), i1 = Math.min(g.res, i + 1);
  const j0 = Math.max(0, j - 1), j1 = Math.min(g.res, j + 1);
  const dx = (g.h[j * N + i1] - g.h[j * N + i0]) / ((i1 - i0) * g.step);
  const dy = (g.h[j1 * N + i] - g.h[j0 * N + i]) / ((j1 - j0) * g.step);
  return Math.hypot(dx, dy);
}
function aoAt(g, i, j) {
  // Basit ortam kapanması: komşu ortalamasının altında kalan (çukur) noktalar koyulaşır
  const N = g.N;
  let sum = 0, cnt = 0;
  for (let dj = -2; dj <= 2; dj += 2) {
    for (let di = -2; di <= 2; di += 2) {
      const ii = Math.min(g.res, Math.max(0, i + di));
      const jj = Math.min(g.res, Math.max(0, j + dj));
      sum += g.h[jj * N + ii];
      cnt++;
    }
  }
  const diff = g.h[j * N + i] - sum / cnt;
  return 1 + Math.max(-0.28, Math.min(0.12, diff * 0.06));
}

/* ---------------- Renk modları ---------------- */
const C = (hex) => new THREE.Color(hex);
const RAMPS = {
  elevation: [[-12, C('#1d5670')], [0, C('#2f7a5a')], [15, C('#5c9a4b')], [32, C('#b3b65b')], [50, C('#c99a50')], [68, C('#9c6a48')], [90, C('#ece7dd')]],
  topo: [[-12, C('#7f9c9c')], [0, C('#cfd6c4')], [30, C('#d8d6c2')], [60, C('#cbbfa4')], [90, C('#e9e4d8')]],
  cinematic: [[-12, C('#0d2a2c')], [0, C('#1c3a2b')], [20, C('#2d4c35')], [45, C('#4a5f45')], [70, C('#76735f')], [95, C('#a29d8a')]],
};
function ramp(stops, x, out) {
  if (x <= stops[0][0]) return out.copy(stops[0][1]);
  for (let k = 1; k < stops.length; k++) {
    if (x <= stops[k][0]) {
      const t = (x - stops[k - 1][0]) / (stops[k][0] - stops[k - 1][0]);
      return out.copy(stops[k - 1][1]).lerp(stops[k][1], t);
    }
  }
  return out.copy(stops[stops.length - 1][1]);
}

const detail = createNoise2D(29).fbm;
const SAT = {
  water: C('#123c44'), sand: C('#b9a582'), forest: C('#2f4a26'), grass: C('#5d7438'),
  dry: C('#8f8a57'), soil: C('#8a6f52'), olive: C('#4f5f33'), rock: C('#7d7568'),
};
const tmp = new THREE.Color();
/** Prosedürel "uydu stili" doku — gerçek uydu görüntüsü DEĞİLDİR */
function satelliteColor(e, n, h, slope, out) {
  if (h < 0) return out.copy(SAT.water).lerp(SAT.sand, smooth(-6, 0, h) * 0.35);
  if (h < 2.2) return out.copy(SAT.sand);
  const fx = Math.floor((e + 200) / 46);
  const fy = Math.floor((n + 200) / 34);
  const field = Math.abs(Math.sin(fx * 12.9898 + fy * 78.233) * 43758.5453) % 1;
  const veg = detail(e / 70, n / 70, 3);
  if (slope < 0.18 && field < 0.42) {
    out.copy(field < 0.15 ? SAT.soil : field < 0.3 ? SAT.dry : SAT.olive);
  } else {
    out.copy(SAT.grass).lerp(SAT.forest, clamp01(0.5 + veg * 1.6));
  }
  out.lerp(SAT.rock, smooth(0.45, 0.9, slope));
  const speck = detail(e / 5, n / 5, 2) * 0.18;
  return out.multiplyScalar(1 + speck);
}

/** Tek nokta için renk (nokta bulutu vb.) */
export function colorAt(mode, e, n, h, slope = 0.1, out = new THREE.Color()) {
  if (mode === 'satellite') return satelliteColor(e, n, h, slope, out);
  if (mode === 'paper') return out.set('#f4f5f1');
  if (mode === 'wireframe') return out.set('#0e1916');
  return ramp(RAMPS[mode] ?? RAMPS.topo, h, out);
}

/** Bir köşe-renk dizisini (Float32Array, doğrusal renk uzayı) belirtilen moda göre doldurur */
export function colorize(g, mode, out, bounds) {
  const { i0, i1, j0, j1 } = bounds ?? { i0: 0, i1: g.res, j0: 0, j1: g.res };
  let k = 0;
  for (let j = j0; j <= j1; j++) {
    for (let i = i0; i <= i1; i++) {
      const e = -SIZE / 2 + i * g.step;
      const n = SIZE / 2 - j * g.step;
      const h = g.h[j * g.N + i];
      colorAt(mode, e, n, h, slopeAt(g, i, j), tmp);
      if (mode !== 'paper' && mode !== 'wireframe') tmp.multiplyScalar(aoAt(g, i, j));
      out[k++] = tmp.r;
      out[k++] = tmp.g;
      out[k++] = tmp.b;
    }
  }
  return out;
}

/** Metrik sınırlar → ağ indeksleri */
export function boundsFor(g, eMin, eMax, nMin, nMax) {
  const toI = (e) => Math.round((e + SIZE / 2) / g.step);
  const toJ = (n) => Math.round((SIZE / 2 - n) / g.step);
  return { i0: toI(eMin), i1: toI(eMax), j0: toJ(nMax), j1: toJ(nMin) };
}

/* ---------------- Geometri ---------------- */
export function buildTerrainGeometry(g, bounds) {
  const { i0, i1, j0, j1 } = bounds ?? { i0: 0, i1: g.res, j0: 0, j1: g.res };
  const W = i1 - i0 + 1;
  const H = j1 - j0 + 1;
  const pos = new Float32Array(W * H * 3);
  const uv = new Float32Array(W * H * 2);
  let p = 0, q = 0;
  for (let j = j0; j <= j1; j++) {
    for (let i = i0; i <= i1; i++) {
      pos[p++] = (-SIZE / 2 + i * g.step) * S;
      pos[p++] = g.h[j * g.N + i] * YS;
      pos[p++] = -(SIZE / 2 - j * g.step) * S;
      uv[q++] = (i - i0) / (W - 1);
      uv[q++] = 1 - (j - j0) / (H - 1);
    }
  }
  const idx = new Uint32Array((W - 1) * (H - 1) * 6);
  let t = 0;
  for (let j = 0; j < H - 1; j++) {
    for (let i = 0; i < W - 1; i++) {
      const a = j * W + i, b = a + 1, c = a + W, d = c + 1;
      idx[t++] = a; idx[t++] = c; idx[t++] = b;
      idx[t++] = b; idx[t++] = c; idx[t++] = d;
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(W * H * 3), 3));
  geo.setIndex(new THREE.BufferAttribute(idx, 1));
  geo.computeVertexNormals();
  geo.userData.bounds = { i0, i1, j0, j1 };
  return geo;
}

export function setTerrainColors(geo, g, mode) {
  const attr = geo.getAttribute('color');
  colorize(g, mode, attr.array, geo.userData.bounds);
  attr.needsUpdate = true;
}

/* ---------------- Eş yükselti eğrileri (marching squares) ---------------- */
// Kenarlar: 0 üst (TL-TR), 1 sağ (TR-BR), 2 alt (BL-BR), 3 sol (TL-BL)
const CASES = {
  1: [[3, 2]], 2: [[2, 1]], 3: [[3, 1]], 4: [[0, 1]], 6: [[0, 2]], 7: [[3, 0]],
  8: [[3, 0]], 9: [[0, 2]], 11: [[0, 1]], 12: [[3, 1]], 13: [[2, 1]], 14: [[3, 2]],
};

export function buildContours(g, { interval = 5, major = 25, lift = 0.035, bounds } = {}) {
  const { i0, i1, j0, j1 } = bounds ?? { i0: 0, i1: g.res, j0: 0, j1: g.res };
  const minor = [];
  const majorArr = [];
  const N = g.N;
  const H = g.h;
  const start = Math.ceil(Math.max(g.min, 0) / interval) * interval;
  for (let L = start; L <= g.max; L += interval) {
    const arr = L % major === 0 ? majorArr : minor;
    const y = L * YS + lift;
    for (let j = j0; j < j1; j++) {
      for (let i = i0; i < i1; i++) {
        const v0 = H[j * N + i], v1 = H[j * N + i + 1];
        const v2 = H[(j + 1) * N + i + 1], v3 = H[(j + 1) * N + i];
        const idx = (v0 > L ? 8 : 0) | (v1 > L ? 4 : 0) | (v2 > L ? 2 : 0) | (v3 > L ? 1 : 0);
        if (idx === 0 || idx === 15) continue;
        let segs = CASES[idx];
        if (idx === 5 || idx === 10) {
          const center = (v0 + v1 + v2 + v3) / 4 > L;
          if (idx === 5) segs = center ? [[3, 0], [2, 1]] : [[3, 2], [0, 1]];
          else segs = center ? [[0, 1], [3, 2]] : [[3, 0], [2, 1]];
        }
        for (const [ea, eb] of segs) {
          for (const edge of [ea, eb]) {
            let fi, fj;
            if (edge === 0) { fi = i + (L - v0) / (v1 - v0); fj = j; }
            else if (edge === 1) { fi = i + 1; fj = j + (L - v1) / (v2 - v1); }
            else if (edge === 2) { fi = i + (L - v3) / (v2 - v3); fj = j + 1; }
            else { fi = i; fj = j + (L - v0) / (v3 - v0); }
            arr.push((-SIZE / 2 + fi * g.step) * S, y, -(SIZE / 2 - fj * g.step) * S);
          }
        }
      }
    }
  }
  return { minor: new Float32Array(minor), major: new Float32Array(majorArr) };
}

/* ---------------- Araziye yapışık çizgiler ---------------- */
/** Kapalı/açık poligon noktalarını [[e,n],...] araziye yapıştırır → sürekli çizgi konumları */
export function drapePath(g, pts, { step = 1, lift = 0.05, closed = false } = {}) {
  const out = [];
  const list = closed ? [...pts, pts[0]] : pts;
  for (let k = 0; k < list.length - 1; k++) {
    const [e0, n0] = list[k];
    const [e1, n1] = list[k + 1];
    const len = Math.hypot(e1 - e0, n1 - n0);
    const steps = Math.max(1, Math.ceil(len / step));
    for (let s = 0; s < steps; s++) {
      const t = s / steps;
      const e = e0 + (e1 - e0) * t;
      const n = n0 + (n1 - n0) * t;
      out.push(e * S, sampleGrid(g, e, n) * YS + lift, -n * S);
    }
  }
  const [el, nl] = list[list.length - 1];
  out.push(el * S, sampleGrid(g, el, nl) * YS + lift, -nl * S);
  return new Float32Array(out);
}

/** Araziye yapışık kareaj (ölçü ağı) çizgileri */
export function drapedGrid(g, { spacing = 25, extent = 190, step = 4, lift = 0.05 } = {}) {
  const out = [];
  for (let v = -extent; v <= extent + 1e-6; v += spacing) {
    for (let t = -extent; t < extent - 1e-6; t += step) {
      const t2 = Math.min(extent, t + step);
      // doğu-batı çizgisi (n = v) ve kuzey-güney çizgisi (e = v)
      out.push(t * S, sampleGrid(g, t, v) * YS + lift, -v * S, t2 * S, sampleGrid(g, t2, v) * YS + lift, -v * S);
      out.push(v * S, sampleGrid(g, v, t) * YS + lift, -t * S, v * S, sampleGrid(g, v, t2) * YS + lift, -t2 * S);
    }
  }
  return new Float32Array(out);
}

export function pointInPolygon(e, n, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > n !== yj > n && e < ((xj - xi) * (n - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** Poligonu araziye yapışık ince bir yüzey olarak üretir (parsel dolgusu vb.) */
export function drapedPolygon(g, ring, { cell = 1, lift = 0.04 } = {}) {
  const es = ring.map((p) => p[0]);
  const ns = ring.map((p) => p[1]);
  const eMin = Math.min(...es), eMax = Math.max(...es);
  const nMin = Math.min(...ns), nMax = Math.max(...ns);
  const pos = [];
  const v = (e, n) => pos.push(e * S, sampleGrid(g, e, n) * YS + lift, -n * S);
  for (let e = eMin; e < eMax; e += cell) {
    for (let n = nMin; n < nMax; n += cell) {
      if (!pointInPolygon(e + cell / 2, n + cell / 2, ring)) continue;
      v(e, n); v(e + cell, n); v(e, n + cell);
      v(e + cell, n); v(e + cell, n + cell); v(e, n + cell);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3));
  geo.computeVertexNormals();
  return geo;
}
