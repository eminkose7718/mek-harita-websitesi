/**
 * GNSS / arazi ölçümü demosu — kavramsal anlatım.
 * Uydu sinyal yayılımını veya RTK hesaplamasını SİMÜLE ETMEZ; ölçüm iş akışını gösterir.
 */
import * as THREE from 'three';
import { SceneHost, addLights } from '../host.js';
import { createOrbit } from '../controls.js';
import { getGrid, buildTerrainGeometry, setTerrainColors, buildContours, drapePath, sampleGrid, boundsFor } from '../terrain.js';
import {
  COLORS, makeSegments, makeLine, makeMarker, makeGNSSReceiver, makeSatellite, makePulseRing, makeDashed,
  setLineProgress, setOpacity, groundPoint,
} from '../objects.js';
import { makeLabel, setLabelOpacity } from '../labels.js';
import { cameraAt, seg } from '../world.js';
import { parcelVertices, displayYX, fmt } from '../../data/geo.js';

export const STEPS = [
  { t: 0, title: 'Yaklaşım', text: 'Kamera ölçüm alanına ve GNSS alıcısına yaklaşıyor.' },
  { t: 2.5, title: 'Ölçüm cihazı', text: 'Jalon üzerindeki GNSS alıcısı, ölçülecek noktanın tam üzerine kuruluyor.' },
  { t: 4.5, title: 'Nokta ölçümü', text: 'Alıcı uydulardan gelen sinyalleri kullanıyor; düzeltme verisiyle konum belirleniyor. (Kavramsal gösterim — sinyal yayılımı simüle edilmez.)' },
  { t: 7, title: 'Koordinat', text: 'Noktanın Y, X ve kot değerleri kaydediliyor. Gösterilen değerler örnektir.' },
  { t: 9, title: 'Ölçüm dizisi', text: 'Alıcı diğer köşelere taşınarak noktalar sırayla ölçülüyor.' },
  { t: 16, title: 'Veri seti', text: 'Ölçülen noktalar birleşerek koordinatlı bir ölçüm veri seti oluşturuyor.' },
  { t: 18.5, title: 'Teknik çizim', text: 'Veri seti, nokta numaraları ve sınırlarla teknik çizime dönüşüyor (temsili).' },
];
const END = 23;
const MOVE = 1.75;

export async function create(root, { quality }) {
  const container = root.querySelector('[data-scene]');
  const bg = new THREE.Color('#0f1714');
  const paperBg = new THREE.Color('#eceee8');
  const host = new SceneHost(container, { quality, background: '#0f1714', fog: 0.02, shadows: true, fov: 40 });
  const lights = addLights(host, { shadows: true, extent: 22 });
  lights.dir.target.position.set(0, 5, 0);
  host.scene.add(lights.dir.target);
  const grid = getGrid(quality === 'high' ? 256 : 128);

  const geo = buildTerrainGeometry(grid);
  setTerrainColors(geo, grid, 'satellite');
  const terrainMat = new THREE.MeshStandardMaterial({
    vertexColors: true, roughness: 0.95, emissive: 0xffffff, emissiveIntensity: 0, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1,
  });
  const terrain = new THREE.Mesh(geo, terrainMat);
  terrain.receiveShadow = true;
  host.scene.add(terrain);

  const c = buildContours(grid, { interval: 1, major: 5, lift: 0.03, bounds: boundsFor(grid, -70, 70, -60, 60) });
  const contours = new THREE.Group();
  contours.add(makeSegments(c.minor, 0x31403a, 0.0), makeSegments(c.major, 0x31403a, 0.0));
  host.scene.add(contours);

  const V = parcelVertices.map((v) => ({ ...v, h: sampleGrid(grid, v.e, v.n), p: groundPoint(grid, v.e, v.n) }));
  const center = V.reduce((s, v) => s.add(v.p), new THREE.Vector3()).divideScalar(V.length);

  const receiver = makeGNSSReceiver(3);
  host.scene.add(receiver);
  const halo = makePulseRing(COLORS.cyan, 0.32);
  const pulse = makePulseRing(COLORS.cyan, 0.5);
  host.scene.add(halo, pulse);

  // Uydular ve kavramsal sinyal çizgileri
  const sats = new THREE.Group();
  const satPos = [[-9, 18, -6], [6, 20, -10], [12, 16, 4], [-4, 21, 9], [-13, 15, 2]].map((p) => new THREE.Vector3(...p).add(new THREE.Vector3(center.x, 0, center.z)));
  satPos.forEach((p) => {
    const s = makeSatellite(0.45);
    s.position.copy(p);
    s.lookAt(center);
    sats.add(s);
  });
  host.scene.add(sats);
  let signalLines = new THREE.Group();
  host.scene.add(signalLines);

  const markers = V.map((v) => {
    const m = makeMarker(COLORS.orange, { radius: 0.06, height: 0.28 });
    m.position.copy(v.p);
    host.scene.add(m);
    return m;
  });
  const labels = V.map((v) => {
    const yx = displayYX(v.e, v.n);
    const l = makeLabel(`<b>${v.id}</b> Y ${yx.Y}<br>X ${yx.X} · Kot ${fmt(v.h)}`);
    l.position.copy(v.p).add(new THREE.Vector3(0, 0.35, 0));
    host.scene.add(l);
    return l;
  });
  const boundary = makeLine(drapePath(grid, V.map((v) => [v.e, v.n]), { closed: true, step: 0.3, lift: 0.05 }), COLORS.cyan, 1);
  host.scene.add(boundary);
  const status = makeLabel('<b>Ölçülüyor…</b> örnek', { anchor: 'left' });
  host.scene.add(status);

  // Kamera izi (K1'e göre)
  const k1 = V[0].p;
  const KEYS = [
    { t: 0, pos: [k1.x - 10, k1.y + 9, k1.z + 14], tgt: [k1.x, k1.y + 0.4, k1.z] },
    { t: 2.5, pos: [k1.x - 2.6, k1.y + 1.5, k1.z + 2.6], tgt: [k1.x, k1.y + 0.45, k1.z] },
    { t: 4.5, pos: [k1.x - 2.9, k1.y + 2.4, k1.z + 2.2], tgt: [k1.x, k1.y + 0.7, k1.z] },
    { t: 7, pos: [k1.x - 2.2, k1.y + 1.6, k1.z + 3], tgt: [k1.x + 0.2, k1.y + 0.5, k1.z] },
    { t: 9, pos: [center.x - 3, center.y + 7.5, center.z + 7.5], tgt: [center.x, center.y, center.z] },
    { t: 16, pos: [center.x + 3, center.y + 7, center.z + 6.5], tgt: [center.x, center.y, center.z] },
    { t: 18.5, pos: [center.x, center.y + 8.5, center.z + 2], tgt: [center.x, center.y, center.z] },
    { t: END, pos: [center.x, center.y + 9.5, center.z + 0.05], tgt: [center.x, center.y, center.z] },
  ];

  const measuredAt = [6, ...[1, 2, 3, 4].map((i) => 9 + (i - 1) * MOVE + 1.0 + 0.45)];
  function receiverPosAt(t, out) {
    if (t < 9) return out.copy(V[0].p);
    const k = Math.min(3, Math.floor((t - 9) / MOVE));
    const local = t - 9 - k * MOVE;
    const a = V[k].p;
    const b = V[k + 1].p;
    const f = seg(local, 0, 1.0);
    out.copy(a).lerp(b, f);
    out.y += Math.sin(f * Math.PI) * 0.25;
    if (t > 9 + 4 * MOVE) out.copy(V[4].p);
    return out;
  }

  // Arayüz
  const $ = (s) => root.querySelector(s);
  const titleEl = $('[data-gnss-title]');
  const textEl = $('[data-gnss-text]');
  const playBtn = $('[data-gnss-play]');
  const table = $('[data-gnss-table]');
  const chips = [...root.querySelectorAll('[data-gnss-step]')];

  let t = host.reduced ? END : 0;
  let playing = !host.reduced;
  let userControl = false;
  let stepIdx = -1;
  let rows = -1;
  const { controls } = createOrbit(host, root, { target: KEYS[0].tgt, minDistance: 1.5, maxDistance: 40 });
  controls.addEventListener('start', () => {
    userControl = true;
    setPlaying(false);
  });

  function setPlaying(v) {
    playing = v;
    playBtn.setAttribute('aria-pressed', String(v));
    playBtn.querySelector('[data-label]').textContent = v ? 'Duraklat' : 'Oynat';
    playBtn.querySelector('[data-icon-play]')?.classList.toggle('hidden', v);
    playBtn.querySelector('[data-icon-pause]')?.classList.toggle('hidden', !v);
    if (v) userControl = false;
  }
  playBtn.addEventListener('click', () => {
    if (!playing && t >= END) t = 0;
    setPlaying(!playing);
  });
  $('[data-gnss-replay]').addEventListener('click', () => {
    t = 0;
    setPlaying(true);
  });
  chips.forEach((ch, i) =>
    ch.addEventListener('click', () => {
      t = STEPS[i].t + 0.01;
      userControl = false;
      setPlaying(true);
    }),
  );
  setPlaying(playing);

  function renderTable(count) {
    table.innerHTML = V.slice(0, count)
      .map((v) => {
        const yx = displayYX(v.e, v.n);
        return `<tr><th scope="row">${v.id}</th><td>${yx.Y}</td><td>${yx.X}</td><td>${fmt(v.h)}</td></tr>`;
      })
      .join('') || '<tr><td colspan="4" class="empty">Henüz ölçülen nokta yok</td></tr>';
  }

  const rp = new THREE.Vector3();
  const pos = new THREE.Vector3();
  const tgt = new THREE.Vector3();
  let lastSignalKey = '';

  host.onFrame((dt, elapsed) => {
    if (playing) {
      t += dt;
      if (t >= END) {
        t = END;
        setPlaying(false);
      }
    }
    const idx = STEPS.reduce((acc, s, i) => (t >= s.t ? i : acc), 0);
    if (idx !== stepIdx) {
      stepIdx = idx;
      titleEl.textContent = `${idx + 1}. ${STEPS[idx].title}`;
      textEl.textContent = STEPS[idx].text;
      chips.forEach((ch, i) => ch.setAttribute('aria-current', i === idx ? 'step' : 'false'));
    }
    const measured = measuredAt.filter((m) => t >= m).length;
    if (measured !== rows) {
      rows = measured;
      renderTable(measured);
    }

    const paper = seg(t, 18.5, 20.5);
    const meas = seg(t, 4.5, 5.2) * (1 - seg(t, 16, 16.8));

    receiverPosAt(t, rp);
    receiver.position.copy(rp);
    const showRx = 1 - seg(t, 17.5, 18.5);
    receiver.visible = showRx > 0.01;
    receiver.scale.setScalar(Math.max(0.001, showRx));
    halo.position.copy(rp).add(new THREE.Vector3(0, 0.02, 0));
    halo.scale.setScalar(1 + Math.sin(elapsed * 4) * 0.08);
    setOpacity(halo, seg(t, 2.5, 3.2) * (1 - seg(t, 4.5, 5)) * 0.9);
    // her ölçümde yayılan halka
    const sinceMeasure = Math.min(...measuredAt.map((m) => (t >= m - 0.5 ? t - (m - 0.5) : 99)));
    const pulseOn = sinceMeasure < 1.2 && t < 16.5;
    pulse.visible = pulseOn;
    if (pulseOn) {
      pulse.position.copy(rp).add(new THREE.Vector3(0, 0.03, 0));
      pulse.scale.setScalar(0.4 + sinceMeasure * 1.4);
      pulse.material.opacity = 0.9 * (1 - sinceMeasure / 1.2);
    }

    setOpacity(sats, meas);
    const key = `${meas > 0.01}-${rp.x.toFixed(2)}-${rp.z.toFixed(2)}`;
    if (key !== lastSignalKey) {
      lastSignalKey = key;
      host.scene.remove(signalLines);
      signalLines.traverse((o) => { o.geometry?.dispose(); o.material?.dispose(); });
      signalLines = new THREE.Group();
      if (meas > 0.01) {
        const ant = rp.clone().add(new THREE.Vector3(0, receiver.userData.antennaHeight, 0));
        satPos.forEach((p) => signalLines.add(makeDashed([p, ant], COLORS.cyan, { opacity: 0.55, dash: 0.3, gap: 0.2 })));
      }
      host.scene.add(signalLines);
    }
    signalLines.children.forEach((l) => (l.material.opacity = 0.55 * meas));

    markers.forEach((m, i) => {
      const a = seg(t, measuredAt[i], measuredAt[i] + 0.3);
      m.visible = a > 0.01;
      m.scale.setScalar(Math.max(0.001, a));
    });
    labels.forEach((l, i) => {
      const show = i === 0 ? seg(t, 7, 7.5) : seg(t, measuredAt[i], measuredAt[i] + 0.3);
      setLabelOpacity(l, show);
      l.element.classList.toggle('is-paper', paper > 0.5);
    });
    const statusOn = sinceMeasure < 0.9 && t < 16;
    setLabelOpacity(status, statusOn ? 1 : 0);
    status.position.copy(rp).add(new THREE.Vector3(0.12, receiver.userData.antennaHeight + 0.1, 0));
    setLineProgress(boundary, seg(t, 16, 18));
    boundary.material.color.set(paper > 0.5 ? COLORS.green : COLORS.cyan);

    terrainMat.emissiveIntensity = paper * 0.92;
    contours.children.forEach((s, i) => (s.material.opacity = paper * (i ? 0.8 : 0.35)));
    host.scene.background.copy(bg).lerp(paperBg, paper);
    host.scene.fog.color.copy(host.scene.background);
    root.classList.toggle('is-paper', paper > 0.5);

    if (!userControl) {
      cameraAt(KEYS, t, pos, tgt);
      host.camera.position.lerp(pos, playing ? 1 : 1 - Math.pow(0.01, dt));
      controls.target.lerp(tgt, playing ? 1 : 1 - Math.pow(0.01, dt));
      host.camera.lookAt(controls.target);
    }
    return playing || pulse.visible || halo.visible;
  });

  return { dispose: () => host.dispose() };
}
