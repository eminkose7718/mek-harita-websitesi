/**
 * Etkileşimli 3D Arazi Gezgini (WebGL).
 * Modlar: Uydu stili (prosedürel), Topografik, Tel kafes, Yükseklik, Parsel.
 */
import * as THREE from 'three';
import { SceneHost, addLights } from '../host.js';
import { createOrbit, onCanvasClick } from '../controls.js';
import {
  getGrid, buildTerrainGeometry, setTerrainColors, buildContours, drapedGrid, drapePath, drapedPolygon,
  sampleGrid, pointInPolygon, S,
} from '../terrain.js';
import { COLORS, makeSegments, makeLine, makeMarker, setOpacity, groundPoint } from '../objects.js';
import { makeLabel, setLabelOpacity } from '../labels.js';
import { parcels, surveyPoints, displayYX, fmt } from '../../data/geo.js';

const MODE_NOTES = {
  satellite: 'Prosedürel uydu stili doku — gerçek uydu görüntüsü değildir.',
  topo: 'Gölgeli rölyef ve eş yükselti eğrileri (5 m aralık, 25 m ana eğri).',
  wireframe: 'Üçgen ağ (TIN) yapısı: arazi yüzeyinin geometrisi.',
  elevation: 'Yüksekliğe göre renk skalası (hipsometrik gösterim).',
  parcel: 'Örnek parsel sınırları ve köşe noktaları — resmi kadastro verisi değildir.',
};
const HOME = { pos: [26, 26, 34], tgt: [0, 3.5, 0] };

export async function create(root, { quality }) {
  const container = root.querySelector('[data-scene]');
  const host = new SceneHost(container, { quality, background: '#101815', fog: 0.008, fov: 42 });
  addLights(host, { intensity: 2.6 });
  const high = quality === 'high';
  const grid = getGrid(high ? 256 : 128);

  const geo = buildTerrainGeometry(grid);
  const terrainMat = new THREE.MeshStandardMaterial({
    vertexColors: true, roughness: 0.92, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1,
  });
  const terrain = new THREE.Mesh(geo, terrainMat);
  const wire = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: COLORS.cyan, wireframe: true, transparent: true, opacity: 0.32 }));
  const sea = new THREE.Mesh(
    new THREE.PlaneGeometry(400, 400),
    new THREE.MeshStandardMaterial({ color: 0x15474f, roughness: 0.3, transparent: true, opacity: 0.8 }),
  );
  sea.rotation.x = -Math.PI / 2;
  sea.position.y = 0.01;
  host.scene.add(terrain, wire, sea);

  const c = buildContours(grid, { interval: 5, major: 25 });
  const contours = new THREE.Group();
  contours.add(makeSegments(c.minor, 0x1d2a24, 0.55), makeSegments(c.major, 0x0f1a15, 0.9));
  const gridLines = makeSegments(drapedGrid(grid, { spacing: 20, step: high ? 4 : 8 }), COLORS.cyan, 0.4);
  host.scene.add(contours, gridLines);

  // Parseller
  const parcelGroup = new THREE.Group();
  const parcelLabels = [];
  for (const p of parcels) {
    parcelGroup.add(makeLine(drapePath(grid, p.ring, { closed: true, step: 0.6, lift: 0.06 }), p.main ? COLORS.cyan : 0xf7f8f5, 1));
    parcelGroup.add(new THREE.Mesh(
      drapedPolygon(grid, p.ring, { cell: 1.2, lift: 0.045 }),
      new THREE.MeshBasicMaterial({ color: p.main ? COLORS.cyan : 0xf7f8f5, transparent: true, opacity: p.main ? 0.22 : 0.08, depthWrite: false, side: THREE.DoubleSide }),
    ));
    for (const [e, n] of p.ring) {
      const m = makeMarker(0xf7f8f5, { radius: 0.05, height: 0.22 });
      m.position.copy(groundPoint(grid, e, n));
      parcelGroup.add(m);
    }
    const ce = p.ring.reduce((s, q) => s + q[0], 0) / p.ring.length;
    const cn = p.ring.reduce((s, q) => s + q[1], 0) / p.ring.length;
    const lbl = makeLabel(`<b>${p.label}</b><br>Alan ≈ ${fmt(p.area, 0)} m² · örnek`, { anchor: 'bottom' });
    lbl.position.copy(groundPoint(grid, ce, cn, 0.5));
    parcelLabels.push(lbl);
    host.scene.add(lbl);
  }
  host.scene.add(parcelGroup);

  // Örnek ölçüm noktaları
  const pointGroup = new THREE.Group();
  const heads = [];
  for (const p of surveyPoints) {
    const m = makeMarker(COLORS.orange, { radius: 0.2, height: 1.1 });
    m.position.copy(groundPoint(grid, p.e, p.n));
    m.userData.head.userData.point = p;
    m.userData.head.scale.setScalar(1.4); // dokunma hedefi
    heads.push(m.userData.head);
    pointGroup.add(m);
  }
  host.scene.add(pointGroup);

  const pick = makeMarker(0xffffff, { radius: 0.14, height: 0.8 });
  pick.visible = false;
  host.scene.add(pick);

  const { flyTo, controls } = createOrbit(host, root, { target: HOME.tgt, minDistance: 4, maxDistance: 70 });
  host.camera.position.set(...HOME.pos);
  controls.update();

  // Arayüz bağlantıları
  const $ = (s) => root.querySelector(s);
  const info = {
    title: $('[data-info-title]'), y: $('[data-info-y]'), x: $('[data-info-x]'), h: $('[data-info-h]'), note: $('[data-info-note]'),
  };
  const legend = $('[data-legend]');
  $('[data-legend-min]').textContent = `${fmt(Math.max(grid.min, -12), 0)} m`;
  $('[data-legend-max]').textContent = `${fmt(grid.max, 0)} m`;

  const layers = { contours: true, grid: false, parcels: false, points: true };
  let mode = 'topo';

  function applyLayers() {
    contours.visible = layers.contours;
    gridLines.visible = layers.grid;
    parcelGroup.visible = layers.parcels;
    parcelLabels.forEach((l) => setLabelOpacity(l, layers.parcels ? 1 : 0));
    pointGroup.visible = layers.points;
    root.querySelectorAll('[data-layer]').forEach((b) => b.setAttribute('aria-pressed', String(layers[b.dataset.layer])));
    host.invalidate();
  }

  function setMode(m) {
    mode = m;
    const colorMode = m === 'parcel' ? 'topo' : m;
    setTerrainColors(geo, grid, colorMode);
    wire.visible = m === 'wireframe';
    terrainMat.roughness = m === 'satellite' ? 0.98 : 0.9;
    contours.children.forEach((s) => s.material.color.set(m === 'elevation' || m === 'wireframe' || m === 'satellite' ? 0xf7f8f5 : 0x1d2a24));
    setOpacity(contours, m === 'satellite' ? 0.5 : 1);
    if (m === 'parcel') {
      layers.parcels = true;
      flyTo([4, 14, 9], [0, 4.8, 0]);
    }
    legend.hidden = m !== 'elevation';
    $('[data-mode-note]').textContent = MODE_NOTES[m];
    root.querySelectorAll('[data-mode]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === m)));
    applyLayers();
  }

  root.querySelectorAll('[data-mode]').forEach((b) => b.addEventListener('click', () => setMode(b.dataset.mode)));
  root.querySelectorAll('[data-layer]').forEach((b) =>
    b.addEventListener('click', () => {
      layers[b.dataset.layer] = !layers[b.dataset.layer];
      applyLayers();
    }),
  );
  $('[data-action="reset"]').addEventListener('click', () => flyTo(HOME.pos, HOME.tgt));
  const zoom = (f) => {
    const off = host.camera.position.clone().sub(controls.target).multiplyScalar(f);
    const len = THREE.MathUtils.clamp(off.length(), controls.minDistance, controls.maxDistance);
    off.setLength(len);
    const p = controls.target.clone().add(off);
    flyTo([p.x, p.y, p.z], controls.target.toArray(), 0.5);
  };
  $('[data-action="zoom-in"]').addEventListener('click', () => zoom(0.7));
  $('[data-action="zoom-out"]').addEventListener('click', () => zoom(1.4));

  function showInfo(title, e, n, note) {
    const h = sampleGrid(grid, e, n);
    const yx = displayYX(e, n);
    info.title.textContent = title;
    info.y.textContent = `${yx.Y} m`;
    info.x.textContent = `${yx.X} m`;
    info.h.textContent = `${fmt(h)} m`;
    info.note.textContent = note;
    pick.position.copy(groundPoint(grid, e, n));
    pick.visible = true;
    host.invalidate();
  }

  onCanvasClick(host, (ray) => {
    if (layers.points) {
      const hit = ray.intersectObjects(heads, false)[0];
      if (hit) {
        const p = hit.object.userData.point;
        showInfo(`Ölçüm noktası ${p.id}`, p.e, p.n, 'Örnek ölçüm noktası — değerler temsili modelden okunmuştur.');
        return;
      }
    }
    const hit = ray.intersectObject(terrain, false)[0];
    if (!hit) return;
    const e = hit.point.x / S;
    const n = -hit.point.z / S;
    let note = 'Seçilen konum — değerler temsili arazi modelinden okunmuştur.';
    if (layers.parcels) {
      const p = parcels.find((q) => pointInPolygon(e, n, q.ring));
      if (p) note = `${p.label}: alan ≈ ${fmt(p.area, 1)} m², çevre ≈ ${fmt(p.perimeter, 1)} m (örnek, yatay düzlemde).`;
    }
    showInfo('Seçilen konum', e, n, note);
  });

  setMode('topo');
  return { dispose: () => host.dispose() };
}
