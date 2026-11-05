/**
 * Drone haritalama & fotogrametri — KAVRAMSAL demo.
 * Gerçek bir fotogrametrik veri seti kullanılmaz; tüm görüntüler temsili arazi modelinden üretilir.
 */
import * as THREE from 'three';
import { SceneHost, addLights } from '../host.js';
import { createOrbit } from '../controls.js';
import {
  getGrid, buildTerrainGeometry, setTerrainColors, boundsFor, sampleGrid, gridColorAt, drapedGrid, S, YS,
} from '../terrain.js';
import { COLORS, makeLine, makeDrone, makeSegments, setLineProgress, setOpacity } from '../objects.js';
import { polyPath, seg } from '../world.js';
import { createRandom } from '../../lib/noise.js';

export const STAGES = [
  { d: 8, title: 'Görüntü alımı', text: 'Drone, önceden planlanan paralel hatlar boyunca uçarak düzenli aralıklarla hava fotoğrafı çekiyor.' },
  { d: 4.5, title: 'Görüntü bindirmesi', text: 'Ardışık fotoğraflar birbirini örter. Örnek planda ileri bindirme %75, yan bindirme ≈ %64 seçilmiştir.' },
  { d: 4.5, title: 'Seyrek nokta bulutu', text: 'Fotoğraflardaki ortak noktalar eşleştirilerek kamera konumları ve seyrek bir 3D nokta kümesi elde edilir.' },
  { d: 4.5, title: 'Yoğun nokta bulutu', text: 'Görüntü eşleştirme ile yüzeyi ayrıntılı tanımlayan yoğun nokta bulutu üretilir.' },
  { d: 4.5, title: 'Yüzey oluşturma', text: 'Nokta bulutundan üçgen ağlı (TIN) bir yüzey modeli oluşturulur.' },
  { d: 4.5, title: 'Sayısal yüzey modeli', text: 'Yükseklikler renk skalasıyla gösterilir: sayısal yüzey / arazi modeli (SYM / SAM).' },
  { d: 5, title: 'Ortofoto benzeri çıktı', text: 'Görüntüler yüzey modeline göre düzeltilerek ölçekli, tepeden bir ortofoto elde edilir (temsili).' },
];
const PRESETS = [
  [[-15, 17, 19], [0, 6, 0]],
  [[-5, 21, 11], [0, 5, 0]],
  [[11, 10, 13], [0, 5, 0]],
  [[8, 7, 9.5], [0, 5, 0]],
  [[-9.5, 8, 9.5], [0, 5, 0]],
  [[9.5, 11, 9.5], [0, 5, 0]],
  [[0, 21, 0.01], [0, 5, 0]],
];
const AREA = { e0: -60, e1: 60, n0: -45, n1: 45 };

export async function create(root, { quality }) {
  const container = root.querySelector('[data-scene]');
  const high = quality === 'high';
  const host = new SceneHost(container, { quality, background: '#0e1613', fog: 0.014, fov: 40 });
  addLights(host, { intensity: 2.5 });
  const grid = getGrid(high ? 256 : 128);
  const bounds = boundsFor(grid, AREA.e0, AREA.e1, AREA.n0, AREA.n1);

  const geo = buildTerrainGeometry(grid);
  setTerrainColors(geo, grid, 'satellite');
  const terrainMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, transparent: true });
  const terrain = new THREE.Mesh(geo, terrainMat);
  host.scene.add(terrain);

  // Alan yüzeyleri (yeniden yapılandırma, SYM, ortofoto)
  const areaGeo = buildTerrainGeometry(grid, bounds);
  const dsmGeo = buildTerrainGeometry(grid, bounds);
  setTerrainColors(dsmGeo, grid, 'elevation');
  const orthoGeo = buildTerrainGeometry(grid, bounds);
  setTerrainColors(orthoGeo, grid, 'satellite');
  const wire = new THREE.Mesh(areaGeo, new THREE.MeshBasicMaterial({ color: COLORS.cyan, wireframe: true, transparent: true }));
  const solid = new THREE.Mesh(areaGeo, new THREE.MeshStandardMaterial({ color: 0xb8bdb4, roughness: 0.8, flatShading: true, transparent: true }));
  const dsm = new THREE.Mesh(dsmGeo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, transparent: true }));
  const ortho = new THREE.Mesh(orthoGeo, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true }));
  const orthoGrid = makeSegments(drapedGrid(grid, { spacing: 10, extent: 45, step: 2, lift: 0.04 }), 0xffffff, 0.35);
  host.scene.add(wire, solid, dsm, ortho, orthoGrid);

  // Uçuş planı
  let maxH = -Infinity;
  for (let e = AREA.e0; e <= AREA.e1; e += 5) for (let n = AREA.n0; n <= AREA.n1; n += 5) maxH = Math.max(maxH, sampleGrid(grid, e, n));
  const altY = (maxH + 45) * YS;
  const pts = [];
  const captures = [];
  const strips = [];
  for (let k = 0, n = AREA.n0; n <= AREA.n1 + 1e-6; n += 15, k++) {
    const dir = k % 2 === 0 ? 1 : -1;
    const [ea, eb] = dir > 0 ? [AREA.e0, AREA.e1] : [AREA.e1, AREA.e0];
    pts.push(new THREE.Vector3(ea * S, altY, -n * S), new THREE.Vector3(eb * S, altY, -n * S));
    const strip = [];
    for (let e = AREA.e0; e <= AREA.e1 + 1e-6; e += 7) strip.push({ e, n, k });
    if (dir < 0) strip.reverse();
    strips.push(strip);
    captures.push(...strip);
  }
  const path = polyPath(pts);
  const pathLine = makeLine(new Float32Array(pts.flatMap((p) => [p.x, p.y, p.z])), COLORS.orange, 0.95);
  const drone = makeDrone(10);
  host.scene.add(pathLine, drone);

  // Çekim noktaları ve görüntü izdüşümleri
  const capGeo = new THREE.BufferGeometry();
  capGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(captures.flatMap((c) => [c.e * S, altY, -c.n * S])), 3));
  const capPoints = new THREE.Points(capGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.16, transparent: true }));
  host.scene.add(capPoints);
  // Her çekim noktasının yol üzerindeki parametresi
  const capT = [];
  {
    let acc = 0;
    const stripLen = (AREA.e1 - AREA.e0) * S;
    const turn = 15 * S;
    strips.forEach((st, k) => {
      st.forEach((c) => {
        const along = (k % 2 === 0 ? c.e - AREA.e0 : AREA.e1 - c.e) * S;
        capT.push((acc + along) / path.total);
      });
      acc += stripLen + turn;
    });
  }

  const fpY = (maxH + 1.5) * YS;
  const footprints = new THREE.Group();
  const fpGeo = new THREE.PlaneGeometry(28 * S, 42 * S);
  fpGeo.rotateX(-Math.PI / 2);
  const fpMat = new THREE.MeshBasicMaterial({ color: COLORS.cyan, transparent: true, opacity: 0.035, depthWrite: false, side: THREE.DoubleSide });
  const hiMat = new THREE.MeshBasicMaterial({ color: COLORS.orange, transparent: true, opacity: 0.22, depthWrite: false, side: THREE.DoubleSide });
  const highlight = new Set();
  [3, 4].forEach((k) => [7, 8, 9].forEach((i) => highlight.add(`${k}-${i}`)));
  strips.forEach((st, k) => st.forEach((c, i) => {
    const hi = highlight.has(`${k}-${i}`);
    const m = new THREE.Mesh(fpGeo, hi ? hiMat : fpMat);
    m.position.set(c.e * S, fpY + (hi ? 0.02 + i * 0.002 : 0), -c.n * S);
    footprints.add(m);
    if (hi) {
      const edge = new THREE.LineSegments(new THREE.EdgesGeometry(fpGeo), new THREE.LineBasicMaterial({ color: COLORS.orange, transparent: true, opacity: 0.9 }));
      edge.position.copy(m.position);
      footprints.add(edge);
    }
  }));
  host.scene.add(footprints);

  // Nokta bulutları
  const rand = createRandom(5);
  const tmpC = new THREE.Color();
  function cloud(count, noise, colorMode) {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const e = AREA.e0 + rand() * (AREA.e1 - AREA.e0);
      const n = AREA.n0 + rand() * (AREA.n1 - AREA.n0);
      const h = sampleGrid(grid, e, n) + (rand() - 0.5) * noise;
      pos.set([e * S, h * YS + 0.03, -n * S], i * 3);
      if (colorMode) gridColorAt(grid, colorMode, e, n, tmpC);
      else tmpC.setRGB(0.75 + rand() * 0.25, 0.9, 0.95);
      col.set([tmpC.r, tmpC.g, tmpC.b], i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    return g;
  }
  const sparse = new THREE.Points(cloud(high ? 1800 : 900, 1.2, null), new THREE.PointsMaterial({ size: 0.09, vertexColors: true, transparent: true }));
  const dense = new THREE.Points(cloud(high ? 36000 : 12000, 0.25, 'satellite'), new THREE.PointsMaterial({ size: high ? 0.06 : 0.08, vertexColors: true, transparent: true }));
  host.scene.add(sparse, dense);

  const { flyTo } = createOrbit(host, root, { target: PRESETS[0][1], minDistance: 4, maxDistance: 50 });
  host.camera.position.set(...PRESETS[0][0]);

  // Zaman çizelgesi
  const starts = STAGES.reduce((acc, s, i) => (acc.push(i ? acc[i - 1] + STAGES[i - 1].d : 0), acc), []);
  const END = starts[starts.length - 1] + STAGES[STAGES.length - 1].d;
  const $ = (s) => root.querySelector(s);
  const titleEl = $('[data-drone-title]');
  const textEl = $('[data-drone-text]');
  const legend = $('[data-drone-legend]');
  const playBtn = $('[data-drone-play]');
  const chips = [...root.querySelectorAll('[data-drone-step]')];
  let t = host.reduced ? starts[6] + 0.01 : 0;
  let playing = !host.reduced;
  let stage = -1;

  function setPlaying(v) {
    playing = v;
    playBtn.setAttribute('aria-pressed', String(v));
    playBtn.querySelector('[data-label]').textContent = v ? 'Duraklat' : 'Oynat';
    playBtn.querySelector('[data-icon-play]')?.classList.toggle('hidden', v);
    playBtn.querySelector('[data-icon-pause]')?.classList.toggle('hidden', !v);
  }
  playBtn.addEventListener('click', () => {
    if (!playing && t >= END) t = 0;
    setPlaying(!playing);
  });
  chips.forEach((c, i) => c.addEventListener('click', () => {
    t = starts[i] + 0.01;
    setPlaying(!host.reduced);
    host.invalidate();
  }));
  setPlaying(playing);

  const tmp = new THREE.Vector3();
  const tmp2 = new THREE.Vector3();
  host.onFrame((dt, elapsed) => {
    if (playing) {
      t += dt;
      if (t >= END) {
        t = END;
        setPlaying(false);
      }
    }
    const idx = starts.reduce((acc, s, i) => (t >= s ? i : acc), 0);
    if (idx !== stage) {
      stage = idx;
      titleEl.textContent = `${idx + 1}. ${STAGES[idx].title}`;
      textEl.textContent = STAGES[idx].text;
      chips.forEach((c, i) => c.setAttribute('aria-current', i === idx ? 'step' : 'false'));
      legend.hidden = idx !== 5;
      flyTo(...PRESETS[idx], 1.6);
    }
    const s = (i, a = 0, b = 0.9) => seg(t, starts[i] + a, starts[i] + b);
    const flightP = seg(t, 0, STAGES[0].d - 0.3);

    // Uçuş
    const flying = idx <= 1;
    drone.visible = idx <= 2;
    path.at(flightP, tmp);
    path.at(Math.min(1, flightP + 0.004), tmp2);
    drone.position.copy(tmp).add(new THREE.Vector3(0, Math.sin(elapsed * 2.2) * 0.06, 0));
    if (tmp2.distanceToSquared(tmp) > 1e-8) drone.rotation.y = Math.atan2(-(tmp2.z - tmp.z), tmp2.x - tmp.x);
    drone.userData.rotors.forEach((r, i) => (r.rotation.y += dt * (i % 2 ? 45 : -45)));
    setLineProgress(pathLine, idx === 0 ? flightP : 1);
    setOpacity(pathLine, 1 - s(2, 0, 0.8));
    const shown = capT.filter((ct) => ct <= flightP).length;
    capGeo.setDrawRange(0, idx === 0 ? shown : captures.length);
    setOpacity(capPoints, flying ? 1 : 1 - s(2, 0, 0.8));

    setOpacity(footprints, s(1, 0, 0.8) * (1 - s(2, 0, 0.8)));
    const terrainFade = 1 - s(2, 0, 1.2);
    terrainMat.opacity = Math.max(0.12, terrainFade);
    terrainMat.depthWrite = terrainFade > 0.5;
    setOpacity(sparse, s(2, 0.2, 1.2) * (1 - s(3, 0.4, 1.2)));
    dense.geometry.setDrawRange(0, Math.round(dense.geometry.getAttribute('position').count * s(3, 0, 1.6)));
    setOpacity(dense, s(3, 0, 0.6) * (1 - s(4, 0.6, 1.6)));
    setOpacity(wire, s(4, 0, 0.8) * (1 - s(4, 1.6, 2.6)) * 0.6);
    setOpacity(solid, s(4, 1.4, 2.6) * (1 - s(5, 0, 0.8)));
    setOpacity(dsm, s(5, 0, 0.9) * (1 - s(6, 0, 0.9)));
    setOpacity(ortho, s(6, 0, 0.9));
    setOpacity(orthoGrid, s(6, 0.6, 1.4) * 0.35);
    return playing || drone.visible;
  });

  return { dispose: () => host.dispose() };
}
