/**
 * Arsa & bina oturumu eğitim demosu.
 * Kurgusal veriden yasal imar hakkı, çekme mesafesi veya resmi kadastro ölçüsü HESAPLAMAZ.
 */
import * as THREE from 'three';
import { SceneHost, addLights } from '../host.js';
import { createOrbit } from '../controls.js';
import {
  getGrid, buildTerrainGeometry, setTerrainColors, buildContours, drapePath, drapedPolygon, drapedGrid,
  sampleGrid, boundsFor, S, YS,
} from '../terrain.js';
import {
  COLORS, makeSegments, makeLine, makeMarker, makeBuilding, makeStake, makeDashed, setLineProgress, setOpacity, groundPoint,
} from '../objects.js';
import { makeLabel, setLabelOpacity } from '../labels.js';
import { seg } from '../world.js';
import { parcels, mainParcel, parcelVertices, building, refPoints, displayYX, fmt, ringArea } from '../../data/geo.js';

const SECTION = [[-30, -24], [30, 24]];
const TARGETS = {
  parsel: { parcel: 1, vlabels: 1, neighbors: 1, refs: 0, design: 0, section: 0, grid: 0.7 },
  aplikasyon: { parcel: 0.6, vlabels: 0, neighbors: 0.4, refs: 1, design: 1, section: 0, grid: 0.6 },
  bina: { parcel: 0.8, vlabels: 0, neighbors: 0.5, refs: 0, design: 0, section: 0, grid: 0.15 },
  kot: { parcel: 0.5, vlabels: 0, neighbors: 0.3, refs: 0, design: 0, section: 1, grid: 0.2 },
  '3d': { parcel: 1, vlabels: 0, neighbors: 1, refs: 1, design: 0, section: 0, grid: 0.4 },
};

export async function create(root, { quality }) {
  const container = root.querySelector('[data-scene]');
  const host = new SceneHost(container, { quality, background: '#dfe5e0', fog: 0.016, shadows: true, fov: 40 });
  const lights = addLights(host, { shadows: true, extent: 24 });
  lights.dir.target.position.set(0, 5, 0);
  host.scene.add(lights.dir.target);
  const grid = getGrid(quality === 'high' ? 256 : 128);
  const local = boundsFor(grid, -80, 80, -70, 70);

  const geo = buildTerrainGeometry(grid);
  setTerrainColors(geo, grid, 'topo');
  const terrain = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.92, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 }));
  terrain.receiveShadow = true;
  host.scene.add(terrain);
  const c = buildContours(grid, { interval: 1, major: 5, lift: 0.025, bounds: local });
  host.scene.add(makeSegments(c.minor, 0x46524c, 0.35), makeSegments(c.major, 0x2e3833, 0.7));
  const refGrid = makeSegments(drapedGrid(grid, { spacing: 10, extent: 40, step: 2, lift: 0.04 }), COLORS.cyan, 0.35);
  host.scene.add(refGrid);

  const center = groundPoint(grid, building.center[0], building.center[1]);

  // Parseller
  const neighbors = new THREE.Group();
  parcels.filter((p) => !p.main).forEach((p) => neighbors.add(makeLine(drapePath(grid, p.ring, { closed: true, step: 1, lift: 0.05 }), 0x56645d, 1)));
  const parcelGroup = new THREE.Group();
  parcelGroup.add(
    makeLine(drapePath(grid, mainParcel.ring, { closed: true, step: 0.3, lift: 0.06 }), COLORS.green, 1),
    new THREE.Mesh(drapedPolygon(grid, mainParcel.ring, { cell: 0.8 }), new THREE.MeshBasicMaterial({ color: COLORS.greenLight, transparent: true, opacity: 0.2, depthWrite: false, side: THREE.DoubleSide })),
  );
  const V = parcelVertices.map((v) => ({ ...v, h: sampleGrid(grid, v.e, v.n) }));
  V.forEach((v) => {
    const m = makeMarker(COLORS.green, { radius: 0.06, height: 0.3 });
    m.position.copy(groundPoint(grid, v.e, v.n));
    parcelGroup.add(m);
  });
  const vLabels = V.map((v) => {
    const yx = displayYX(v.e, v.n);
    const l = makeLabel(`<b>${v.id}</b> Y ${yx.Y} · X ${yx.X}`);
    l.position.copy(groundPoint(grid, v.e, v.n, 0.38));
    host.scene.add(l);
    return l;
  });
  host.scene.add(neighbors, parcelGroup);

  // Referans noktaları
  const refs = new THREE.Group();
  const refLabels = refPoints.map((r) => {
    const m = makeMarker(COLORS.brown, { radius: 0.09, height: 0.55 });
    m.position.copy(groundPoint(grid, r.e, r.n));
    refs.add(m);
    const l = makeLabel(`<b>${r.id}</b> referans noktası · örnek`);
    l.position.copy(groundPoint(grid, r.e, r.n, 0.65));
    host.scene.add(l);
    return l;
  });
  host.scene.add(refs);

  // Bina
  const bld = makeBuilding(grid, building);
  host.scene.add(bld.group);

  // Aplikasyon: tasarım koordinatlarından zemine aktarım
  const design = new THREE.Group();
  const designY = bld.baseY + 1.6;
  const designMarks = building.corners.map((cn) => {
    const g = new THREE.Group();
    const top = new THREE.Vector3(cn.e * S, designY, -cn.n * S);
    const ground = groundPoint(grid, cn.e, cn.n);
    const cube = new THREE.Mesh(new THREE.OctahedronGeometry(0.09), new THREE.MeshStandardMaterial({ color: COLORS.cyan, emissive: COLORS.cyan, emissiveIntensity: 0.5 }));
    cube.position.copy(top);
    const drop = makeDashed([top, ground], COLORS.cyan, { dash: 0.08, gap: 0.06 });
    const stake = makeStake(3);
    stake.position.copy(ground);
    const ray = makeDashed([groundPoint(grid, refPoints[0].e, refPoints[0].n, 0.12), ground.clone().add(new THREE.Vector3(0, 0.12, 0))], COLORS.orange, { dash: 0.15, gap: 0.08 });
    const travel = cube.clone();
    g.add(cube, drop, stake, ray, travel);
    design.add(g);
    return { cube, drop, stake, ray, travel, top, ground };
  });
  const designFrame = makeLine(new Float32Array([...building.corners, building.corners[0]].flatMap((cn) => [cn.e * S, designY, -cn.n * S])), COLORS.cyan, 0.9);
  design.add(designFrame);
  host.scene.add(design);

  // Kot analizi: kesit perdesi + istasyonlar
  const sectionGroup = new THREE.Group();
  const [A, B] = SECTION;
  const L = Math.hypot(B[0] - A[0], B[1] - A[1]);
  const samples = [];
  for (let d = 0; d <= L + 1e-6; d += 0.5) {
    const f = d / L;
    const e = A[0] + (B[0] - A[0]) * f;
    const n = A[1] + (B[1] - A[1]) * f;
    samples.push({ d, e, n, h: sampleGrid(grid, e, n) });
  }
  const hMin = Math.min(...samples.map((s) => s.h));
  const hMax = Math.max(...samples.map((s) => s.h));
  const curtainPos = [];
  const bottomY = (hMin - 4) * YS;
  for (let i = 0; i < samples.length - 1; i++) {
    const a = samples[i], b = samples[i + 1];
    const ax = a.e * S, az = -a.n * S, bx = b.e * S, bz = -b.n * S;
    const ay = a.h * YS + 0.02, by = b.h * YS + 0.02;
    curtainPos.push(ax, bottomY, az, bx, bottomY, bz, ax, ay, az, bx, bottomY, bz, bx, by, bz, ax, ay, az);
  }
  const curtainGeo = new THREE.BufferGeometry();
  curtainGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(curtainPos), 3));
  sectionGroup.add(
    new THREE.Mesh(curtainGeo, new THREE.MeshBasicMaterial({ color: COLORS.cyan, transparent: true, opacity: 0.28, side: THREE.DoubleSide, depthWrite: false })),
    makeLine(new Float32Array(samples.flatMap((s) => [s.e * S, s.h * YS + 0.05, -s.n * S])), COLORS.orange, 1),
  );
  const stations = samples.filter((s) => Math.abs(s.d % 10) < 1e-6);
  if (samples[samples.length - 1].d - stations[stations.length - 1].d > 3) stations.push(samples[samples.length - 1]);
  const h0 = stations[0].h;
  const stationLabels = stations.map((s, i) => {
    const m = makeMarker(COLORS.orange, { radius: 0.05, height: 0.45 });
    m.position.copy(groundPoint(grid, s.e, s.n));
    sectionGroup.add(m);
    const l = makeLabel(`<b>${fmt(s.d, 0)} m</b> · ${fmt(s.h)} m<br>Δh ${s.h - h0 >= 0 ? '+' : ''}${fmt(s.h - h0)} m`);
    l.position.copy(groundPoint(grid, s.e, s.n, 0.55));
    host.scene.add(l);
    l.userData.i = i;
    return l;
  });
  host.scene.add(sectionGroup);

  const { controls, flyTo } = createOrbit(host, root, { target: center.toArray(), minDistance: 2, maxDistance: 45 });
  const perp = new THREE.Vector3((B[1] - A[1]) * S, 0, (B[0] - A[0]) * S).normalize();
  const PRESETS = {
    parsel: [[center.x + 0.4, center.y + 9, center.z + 4.5], center.toArray()],
    aplikasyon: [[center.x - 6, center.y + 5.5, center.z + 7], center.toArray()],
    bina: [[center.x + 6.5, center.y + 3.2, center.z + 6], [center.x, center.y + 0.7, center.z]],
    kot: [[center.x + perp.x * 9, center.y + 2.2, center.z + perp.z * 9], [center.x, center.y - 0.3, center.z]],
    '3d': [[center.x + 8, center.y + 6, center.z + 8], center.toArray()],
  };
  host.camera.position.set(...PRESETS.parsel[0]);
  controls.update();

  // Arayüz verileri
  const $ = (s) => root.querySelector(s);
  $('[data-parcel-area]').textContent = `${fmt(mainParcel.area, 1)} m²`;
  $('[data-parcel-perimeter]').textContent = `${fmt(mainParcel.perimeter, 1)} m`;
  $('[data-parcel-vertices]').innerHTML = V.map((v) => {
    const yx = displayYX(v.e, v.n);
    return `<tr><th scope="row">${v.id}</th><td>${yx.Y}</td><td>${yx.X}</td></tr>`;
  }).join('');
  $('[data-apl-table]').innerHTML = building.corners.map((cn) => {
    const yx = displayYX(cn.e, cn.n);
    return `<tr><th scope="row">${cn.id}</th><td>${yx.Y}</td><td>${yx.X}</td></tr>`;
  }).join('');
  const bArea = ringArea(building.corners.map((cn) => [cn.e, cn.n]));
  $('[data-bld-area]').textContent = `${fmt(bArea, 0)} m²`;
  $('[data-bld-level]').textContent = `${fmt(bld.baseLevel)} m`;
  $('[data-bld-height]').textContent = `${building.floors} kat × ${building.floorHeight} m`;
  $('[data-kot-table]').innerHTML = stations.map((s) => `<tr><th scope="row">${fmt(s.d, 1)}</th><td>${fmt(s.h)}</td><td>${s.h - h0 >= 0 ? '+' : ''}${fmt(s.h - h0)}</td></tr>`).join('');
  $('[data-kot-svg]').innerHTML = profileSVG(samples, stations, hMin, hMax, L);

  // Mod yönetimi
  const cur = { parcel: 1, vlabels: 1, neighbors: 1, refs: 0, design: 0, section: 0, grid: 0.7 };
  let mode = 'parsel';
  let modeTime = 0;
  let bldStage = 0;
  function setMode(m) {
    mode = m;
    modeTime = 0;
    flyTo(...PRESETS[m]);
    controls.autoRotate = m === '3d' && !host.reduced;
    controls.autoRotateSpeed = 0.6;
    root.querySelectorAll('[data-parcel-mode]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.parcelMode === m)));
    root.querySelectorAll('[data-parcel-panel]').forEach((p) => (p.hidden = p.dataset.parcelPanel !== m));
  }
  root.querySelectorAll('[data-parcel-mode]').forEach((b) => b.addEventListener('click', () => setMode(b.dataset.parcelMode)));
  $('[data-parcel-replay]')?.addEventListener('click', () => (modeTime = 0));

  host.onFrame((dt) => {
    modeTime += dt;
    const k = 1 - Math.pow(0.004, dt);
    const tgt = TARGETS[mode];
    for (const key of Object.keys(cur)) cur[key] += (tgt[key] - cur[key]) * k;
    setOpacity(parcelGroup, cur.parcel);
    setOpacity(neighbors, cur.neighbors);
    setOpacity(refGrid, cur.grid);
    vLabels.forEach((l) => setLabelOpacity(l, cur.vlabels > 0.5 ? cur.vlabels : 0));
    setOpacity(refs, cur.refs);
    refLabels.forEach((l) => setLabelOpacity(l, cur.refs > 0.5 ? cur.refs : 0));
    setOpacity(sectionGroup, cur.section);
    stationLabels.forEach((l) => setLabelOpacity(l, cur.section > 0.6 ? seg(modeTime, 0.6 + l.userData.i * 0.25, 0.9 + l.userData.i * 0.25) : 0));

    // Aplikasyon animasyonu: tasarım noktaları zemine aktarılır
    const at = host.reduced ? 99 : modeTime;
    design.visible = cur.design > 0.01;
    setOpacity(designFrame, cur.design);
    designMarks.forEach((d, i) => {
      const t0 = 0.8 + i * 0.55;
      const f = seg(at, t0, t0 + 0.6);
      setOpacity(d.cube, cur.design);
      setOpacity(d.drop, cur.design * 0.8);
      d.travel.visible = mode === 'aplikasyon' && f > 0 && f < 1;
      d.travel.position.copy(d.top).lerp(d.ground, f);
      const st = mode === 'aplikasyon' ? seg(at, t0 + 0.5, t0 + 0.8) : mode === '3d' ? 1 : 0;
      d.stake.visible = st > 0.01;
      d.stake.scale.setScalar(Math.max(0.001, st));
      setOpacity(d.ray, (mode === 'aplikasyon' ? seg(at, t0 + 0.6, t0 + 1) : 0) * 0.9);
    });

    // Bina aşamaları
    const targetStage = mode === 'bina' ? (host.reduced ? 4 : Math.min(4, modeTime * 1.1)) : mode === '3d' ? 4 : mode === 'aplikasyon' ? seg(at, 3.2, 3.8) : 0;
    bldStage += (targetStage - bldStage) * (mode === 'bina' ? 1 : k);
    bld.setStage(bldStage);
  });

  setMode(root.dataset.initialMode || 'parsel');
  root.addEventListener('parcel:mode', (e) => setMode(e.detail));
  return { dispose: () => host.dispose() };
}

function profileSVG(samples, stations, hMin, hMax, L) {
  const W = 560, H = 200, pl = 46, pr = 12, pt = 14, pb = 30;
  const lo = Math.floor(hMin - 1), hi = Math.ceil(hMax + 1);
  const x = (d) => pl + (d / L) * (W - pl - pr);
  const y = (h) => pt + (1 - (h - lo) / (hi - lo)) * (H - pt - pb);
  const line = samples.map((s, i) => `${i ? 'L' : 'M'}${x(s.d).toFixed(1)},${y(s.h).toFixed(1)}`).join('');
  const area = `${line}L${x(L).toFixed(1)},${H - pb}L${pl},${H - pb}Z`;
  const yTicks = [];
  for (let v = lo; v <= hi; v += Math.max(1, Math.round((hi - lo) / 4))) yTicks.push(v);
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Örnek arazi kesiti: mesafeye göre kot profili">
    <title>Örnek arazi kesiti (temsili veriden)</title>
    ${yTicks.map((v) => `<line x1="${pl}" x2="${W - pr}" y1="${y(v)}" y2="${y(v)}" class="grid"/><text x="${pl - 6}" y="${y(v) + 3}" text-anchor="end">${v}</text>`).join('')}
    <path d="${area}" class="area"/><path d="${line}" class="line"/>
    ${stations.map((s) => `<circle cx="${x(s.d)}" cy="${y(s.h)}" r="3.2" class="pt"/><text x="${x(s.d)}" y="${H - pb + 16}" text-anchor="middle">${Math.round(s.d)}</text>`).join('')}
    <text x="${W - pr}" y="${H - 4}" text-anchor="end" class="axis">mesafe (m)</text>
    <text x="4" y="${pt - 2}" class="axis">kot (m)</text>
  </svg>`;
}
