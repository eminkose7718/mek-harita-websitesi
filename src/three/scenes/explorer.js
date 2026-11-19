/**
 * Etkileşimli 3D Arazi Gezgini (WebGL).
 * İki arazi verisi:
 *  - "Yalova": GERÇEK arazi (Copernicus DEM GLO-30, TUREF/TM30). Tıklanan noktada TM30 Y/X,
 *    enlem/boylam ve DEM yüzey yüksekliği gösterilir.
 *  - "Örnek proje alanı": temsili arazi; örnek parseller ve ölçüm noktaları yalnızca burada,
 *    yerel demo koordinatlarıyla gösterilir (gerçek bir konuma karşılık gelmez).
 * Modlar: Doğal renk, Topografik, Tel kafes, Yükseklik, Parsel.
 */
import * as THREE from 'three';
import { SceneHost, addLights } from '../host.js';
import { createOrbit, onCanvasClick } from '../controls.js';
import {
  getGrid, buildTerrainGeometry, setTerrainColors, buildContours, drapedGrid, drapePath, drapedPolygon,
  sampleGrid, pointInPolygon,
} from '../terrain.js';
import { COLORS, makeSegments, makeLine, makeMarker, setOpacity, groundPoint } from '../objects.js';
import { makeLabel, setLabelOpacity } from '../labels.js';
import { parcels, surveyPoints, displayYX, fmt } from '../../data/geo.js';
import { loadYalova, toTM30, toLatLon, YALOVA, REGION_EXAG } from '../dem.js';

const NOTES = {
  region: {
    satellite: 'Yükseklik ve eğime göre üretilmiş doğal renk görünümü — gerçek uydu fotoğrafı değildir.',
    topo: 'Gölgeli rölyef ve eş yükselti eğrileri (25 m aralık, 100 m ana eğri). Koordinat ağı: TM30 kilometre çizgileri.',
    wireframe: 'Arazi yüzeyinin üçgen ağı (yaklaşık 47 m aralık).',
    elevation: 'Yüksekliğe göre renk skalası (hipsometrik gösterim), deniz seviyesinden zirveye.',
  },
  site: {
    satellite: 'Prosedürel doğal renk dokusu — temsili arazi, gerçek uydu fotoğrafı değildir.',
    topo: 'Temsili arazi: gölgeli rölyef ve eş yükselti eğrileri (5 m aralık, 25 m ana eğri).',
    wireframe: 'Temsili arazinin üçgen ağı (TIN) yapısı.',
    elevation: 'Temsili arazi: yüksekliğe göre renk skalası.',
    parcel: 'Örnek parsel sınırları ve köşe noktaları — resmi kadastro verisi değildir.',
  },
};
const DATASET_NOTES = {
  region: '18 km × 18 km, Copernicus DEM GLO-30 uydu yükseklik verisi. Binalar ve bitki örtüsü dahil yüzey modelidir.',
  site: 'Temsili 400 m × 400 m arazi. Parseller, noktalar ve koordinatlar örnektir; gerçek bir konuma karşılık gelmez.',
};
const BADGES = {
  region: `Yalova · Copernicus DEM · düşey abartma ${String(REGION_EXAG).replace('.', ',')}×`,
  site: 'Örnek proje alanı · temsili arazi',
};
const HOME = {
  region: { pos: [-15, 15, -25], tgt: [1, 1, -1] },
  site: { pos: [26, 26, 34], tgt: [0, 3.5, 0] },
};

export async function create(root, { quality }) {
  const container = root.querySelector('[data-scene]');
  const host = new SceneHost(container, { quality, background: '#101815', fog: 0.008, fov: 42 });
  addLights(host, { intensity: 2.6 });
  const high = quality === 'high';
  const yalova = await loadYalova(quality);
  const siteGrid = getGrid(high ? 256 : 128);

  function buildDataset(kind, grid) {
    const group = new THREE.Group();
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
    sea.position.y = kind === 'region' ? grid.sea * grid.ys : 0.01;
    const c = kind === 'region'
      ? buildContours(grid, { interval: 25, major: 100, lift: 0.012 })
      : buildContours(grid, { interval: 5, major: 25 });
    const contours = new THREE.Group();
    contours.add(makeSegments(c.minor, 0x1d2a24, 0.55), makeSegments(c.major, 0x0f1a15, 0.9));
    const gridLines = kind === 'region'
      ? makeSegments(drapedGrid(grid, { spacing: 1000, extent: 8000, step: 250, lift: 0.02 }), COLORS.cyan, 0.45)
      : makeSegments(drapedGrid(grid, { spacing: 20, step: high ? 4 : 8 }), COLORS.cyan, 0.4);
    group.add(terrain, wire, sea, contours, gridLines);
    host.scene.add(group);
    return { kind, grid, group, geo, terrain, terrainMat, wire, contours, gridLines, labels: [] };
  }

  const region = buildDataset('region', yalova);
  const site = buildDataset('site', siteGrid);

  // Gerçek bölge: yer adı
  for (const p of YALOVA.places) {
    const l = makeLabel(`<b>${p.name}</b> · şehir merkezi`);
    l.position.set(p.e * yalova.s, sampleGrid(yalova, p.e, p.n) * yalova.ys + 0.3, -p.n * yalova.s);
    host.scene.add(l);
    region.labels.push(l);
  }

  // Örnek proje alanı: parseller
  const parcelGroup = new THREE.Group();
  const parcelLabels = [];
  for (const p of parcels) {
    parcelGroup.add(makeLine(drapePath(siteGrid, p.ring, { closed: true, step: 0.6, lift: 0.06 }), p.main ? COLORS.cyan : 0xf7f8f5, 1));
    parcelGroup.add(new THREE.Mesh(
      drapedPolygon(siteGrid, p.ring, { cell: 1.2, lift: 0.045 }),
      new THREE.MeshBasicMaterial({ color: p.main ? COLORS.cyan : 0xf7f8f5, transparent: true, opacity: p.main ? 0.22 : 0.08, depthWrite: false, side: THREE.DoubleSide }),
    ));
    for (const [e, n] of p.ring) {
      const m = makeMarker(0xf7f8f5, { radius: 0.05, height: 0.22 });
      m.position.copy(groundPoint(siteGrid, e, n));
      parcelGroup.add(m);
    }
    const ce = p.ring.reduce((s, q) => s + q[0], 0) / p.ring.length;
    const cn = p.ring.reduce((s, q) => s + q[1], 0) / p.ring.length;
    const lbl = makeLabel(`<b>${p.label}</b><br>Alan ≈ ${fmt(p.area, 0)} m² · örnek`, { anchor: 'bottom' });
    lbl.position.copy(groundPoint(siteGrid, ce, cn, 0.5));
    parcelLabels.push(lbl);
    host.scene.add(lbl);
  }
  site.group.add(parcelGroup);

  // Örnek proje alanı: ölçüm noktaları
  const pointGroup = new THREE.Group();
  const heads = [];
  for (const p of surveyPoints) {
    const m = makeMarker(COLORS.orange, { radius: 0.2, height: 1.1 });
    m.position.copy(groundPoint(siteGrid, p.e, p.n));
    m.userData.head.userData.point = p;
    m.userData.head.scale.setScalar(1.4); // dokunma hedefi
    heads.push(m.userData.head);
    pointGroup.add(m);
  }
  site.group.add(pointGroup);

  const pick = makeMarker(0xffffff, { radius: 0.14, height: 0.8 });
  pick.visible = false;
  host.scene.add(pick);

  const { flyTo, controls } = createOrbit(host, root, { target: HOME.region.tgt, minDistance: 3, maxDistance: 70 });
  host.camera.position.set(...HOME.region.pos);
  controls.update();

  // Arayüz bağlantıları
  const $ = (s) => root.querySelector(s);
  const info = {
    title: $('[data-info-title]'), y: $('[data-info-y]'), x: $('[data-info-x]'), h: $('[data-info-h]'), note: $('[data-info-note]'),
    geo: $('[data-info-geo]'), geoRow: $('[data-info-geo-row]'),
    ly: $('[data-info-label-y]'), lx: $('[data-info-label-x]'), lh: $('[data-info-label-h]'),
  };
  const legend = $('[data-legend]');

  const layers = { contours: true, grid: false, parcels: false, points: true };
  let ds = region;
  let mode = 'topo';

  function resetInfo() {
    const real = ds === region;
    pick.visible = false;
    info.title.textContent = 'Bir nokta seçin';
    info.ly.textContent = real ? 'Y (TM30, doğu)' : 'Yerel Y (örnek)';
    info.lx.textContent = real ? 'X (TM30, kuzey)' : 'Yerel X (örnek)';
    info.lh.textContent = real ? 'Yükseklik (DEM)' : 'Kot (örnek)';
    info.geoRow.hidden = !real;
    info.y.textContent = info.x.textContent = info.h.textContent = info.geo.textContent = '—';
    info.note.textContent = real
      ? 'Araziye tıklayın. Yükseklik, uydu verisinden okunan yaklaşık yüzey yüksekliğidir; arazi ölçümü değildir.'
      : 'Araziye veya turuncu ölçüm noktalarına tıklayın. Değerler temsili modelden okunan örneklerdir.';
  }

  function applyLayers() {
    const isSite = ds === site;
    for (const d of [region, site]) {
      d.contours.visible = layers.contours;
      d.gridLines.visible = layers.grid;
    }
    parcelGroup.visible = isSite && layers.parcels;
    pointGroup.visible = isSite && layers.points;
    parcelLabels.forEach((l) => setLabelOpacity(l, isSite && layers.parcels ? 1 : 0));
    region.labels.forEach((l) => setLabelOpacity(l, isSite ? 0 : 1));
    root.querySelectorAll('[data-layer]').forEach((b) => {
      const k = b.dataset.layer;
      const siteOnly = k === 'parcels' || k === 'points';
      const disabled = siteOnly && !isSite;
      b.setAttribute('aria-pressed', String(layers[k] && !disabled));
      b.disabled = disabled;
      b.title = disabled ? 'Yalnızca örnek proje alanında' : '';
    });
    host.invalidate();
  }

  function setDataset(kind, { fly = true } = {}) {
    ds = kind === 'site' ? site : region;
    region.group.visible = ds === region;
    site.group.visible = ds === site;
    if (ds === region && mode === 'parcel') mode = 'topo';
    root.querySelectorAll('[data-dataset]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.dataset === ds.kind)));
    $('[data-dataset-note]').textContent = DATASET_NOTES[ds.kind];
    $('[data-dataset-badge]').textContent = BADGES[ds.kind];
    $('[data-legend-min]').textContent = `${fmt(Math.max(ds.grid.min, 0), 0)} m`;
    $('[data-legend-max]').textContent = `${fmt(ds.grid.max, 0)} m`;
    resetInfo();
    if (fly) flyTo(HOME[ds.kind].pos, HOME[ds.kind].tgt);
    setMode(mode, { fly: false });
  }

  function setMode(m, { fly = true } = {}) {
    if (m === 'parcel' && ds !== site) {
      mode = 'parcel';
      layers.parcels = true;
      setDataset('site', { fly: false });
      flyTo([4, 14, 9], [0, 4.8, 0]);
      return;
    }
    mode = m;
    const colorMode = m === 'parcel' ? 'topo' : m;
    setTerrainColors(ds.geo, ds.grid, colorMode);
    ds.wire.visible = m === 'wireframe';
    ds.terrainMat.roughness = m === 'satellite' ? 0.98 : 0.9;
    ds.contours.children.forEach((s) => s.material.color.set(m === 'elevation' || m === 'wireframe' || m === 'satellite' ? 0xf7f8f5 : 0x1d2a24));
    setOpacity(ds.contours, m === 'satellite' ? 0.5 : 1);
    if (m === 'parcel') {
      layers.parcels = true;
      if (fly) flyTo([4, 14, 9], [0, 4.8, 0]);
    }
    legend.hidden = m !== 'elevation';
    $('[data-mode-note]').textContent = NOTES[ds.kind][m] ?? '';
    root.querySelectorAll('[data-mode]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === m)));
    applyLayers();
  }

  root.querySelectorAll('[data-dataset]').forEach((b) => b.addEventListener('click', () => setDataset(b.dataset.dataset)));
  root.querySelectorAll('[data-mode]').forEach((b) => b.addEventListener('click', () => setMode(b.dataset.mode)));
  root.querySelectorAll('[data-layer]').forEach((b) =>
    b.addEventListener('click', () => {
      layers[b.dataset.layer] = !layers[b.dataset.layer];
      applyLayers();
    }),
  );
  $('[data-action="reset"]').addEventListener('click', () => flyTo(HOME[ds.kind].pos, HOME[ds.kind].tgt));
  const zoom = (f) => {
    const off = host.camera.position.clone().sub(controls.target).multiplyScalar(f);
    const len = THREE.MathUtils.clamp(off.length(), controls.minDistance, controls.maxDistance);
    off.setLength(len);
    const p = controls.target.clone().add(off);
    flyTo([p.x, p.y, p.z], controls.target.toArray(), 0.5);
  };
  $('[data-action="zoom-in"]').addEventListener('click', () => zoom(0.7));
  $('[data-action="zoom-out"]').addEventListener('click', () => zoom(1.4));

  function placePick(e, n) {
    const g = ds.grid;
    pick.position.set(e * g.s, sampleGrid(g, e, n) * g.ys, -n * g.s);
    pick.visible = true;
    host.invalidate();
  }

  function showRegionInfo(e, n) {
    const h = sampleGrid(yalova, e, n);
    const tm = toTM30(e, n);
    const geo = toLatLon(e, n);
    info.title.textContent = h <= yalova.sea ? 'Seçilen konum (deniz)' : 'Seçilen konum';
    // DEM ağ aralığı ~47 m olduğundan konum metre, yükseklik metre hassasiyetinde gösterilir
    info.y.textContent = `${fmt(tm.Y, 0)} m`;
    info.x.textContent = `${fmt(tm.X, 0)} m`;
    info.geo.textContent = `${geo.lat.toFixed(5)}° K, ${geo.lon.toFixed(5)}° D`;
    info.h.textContent = h <= yalova.sea ? 'deniz' : `≈ ${fmt(h, 0)} m`;
    info.note.textContent = 'TUREF/TM30 koordinatı ve Copernicus DEM yüzey yüksekliği (EGM2008, bina ve ağaçlar dahil). Bilgi amaçlıdır; arazi ölçümü veya resmi kot değildir.';
    placePick(e, n);
  }

  function showSiteInfo(title, e, n, note) {
    const yx = displayYX(e, n);
    info.title.textContent = title;
    info.y.textContent = `${yx.Y} m`;
    info.x.textContent = `${yx.X} m`;
    info.h.textContent = `${fmt(sampleGrid(siteGrid, e, n))} m`;
    info.note.textContent = note;
    placePick(e, n);
  }

  onCanvasClick(host, (ray) => {
    if (ds === site && layers.points) {
      const hit = ray.intersectObjects(heads, false)[0];
      if (hit) {
        const p = hit.object.userData.point;
        showSiteInfo(`Ölçüm noktası ${p.id}`, p.e, p.n, 'Örnek ölçüm noktası — değerler temsili modelden okunmuştur.');
        return;
      }
    }
    const hit = ray.intersectObject(ds.terrain, false)[0];
    if (!hit) return;
    const e = hit.point.x / ds.grid.s;
    const n = -hit.point.z / ds.grid.s;
    if (ds === region) {
      showRegionInfo(e, n);
      return;
    }
    let note = 'Seçilen konum — değerler temsili arazi modelinden okunmuştur.';
    if (layers.parcels) {
      const p = parcels.find((q) => pointInPolygon(e, n, q.ring));
      if (p) note = `${p.label}: alan ≈ ${fmt(p.area, 1)} m², çevre ≈ ${fmt(p.perimeter, 1)} m (örnek, yatay düzlemde).`;
    }
    showSiteInfo('Seçilen konum', e, n, note);
  });

  setDataset('region', { fly: false });
  return { dispose: () => host.dispose() };
}
