/**
 * Mühendislik dünyası — Hero sinematiği ve kaydırmalı anlatı tarafından paylaşılan sahne.
 * Katmanların görünürlüğü tek bir durum nesnesiyle (set) kontrol edilir.
 */
import * as THREE from 'three';
import {
  getGrid, buildTerrainGeometry, setTerrainColors, buildContours, drapedGrid, drapePath,
  drapedPolygon, sampleGrid, S, YS,
} from './terrain.js';
import {
  COLORS, makeLine, makeSegments, makeMarker, makeBuilding, makeGNSSReceiver, makeDrone, makeStake,
  setLineProgress, setOpacity, groundPoint,
} from './objects.js';
import { makeLabel, setLabelOpacity } from './labels.js';
import { parcels, mainParcel, parcelVertices, building, surveyPoints, displayYX, fmt } from '../data/geo.js';

const clamp01 = (x) => Math.min(1, Math.max(0, x));
export const seg = (t, a, b) => {
  const x = clamp01((t - a) / (b - a));
  return x * x * (3 - 2 * x);
};

/** Kamera anahtar kareleri arasında yumuşak geçiş: keys = [{t, pos:[x,y,z], tgt:[x,y,z]}] */
export function cameraAt(keys, t, outPos, outTgt) {
  let k = 0;
  while (k < keys.length - 2 && t > keys[k + 1].t) k++;
  const a = keys[k];
  const b = keys[k + 1];
  const x = seg(t, a.t, b.t);
  outPos.set(...a.pos).lerp(new THREE.Vector3(...b.pos), x);
  outTgt.set(...a.tgt).lerp(new THREE.Vector3(...b.tgt), x);
}

/** Noktalardan yay uzunluğuna göre parametrelenmiş yol */
export function polyPath(points) {
  const lengths = [0];
  for (let i = 1; i < points.length; i++) lengths.push(lengths[i - 1] + points[i].distanceTo(points[i - 1]));
  const total = lengths[lengths.length - 1];
  return {
    total,
    at(t, out = new THREE.Vector3()) {
      const d = clamp01(t) * total;
      let i = 1;
      while (i < lengths.length - 1 && lengths[i] < d) i++;
      const f = (d - lengths[i - 1]) / (lengths[i] - lengths[i - 1] || 1);
      return out.copy(points[i - 1]).lerp(points[i], f);
    },
  };
}

export function buildWorld(host) {
  const { scene } = host;
  const high = host.quality === 'high';
  const grid = getGrid(high ? 256 : 128);

  // Arazi
  const geo = buildTerrainGeometry(grid);
  setTerrainColors(geo, grid, 'cinematic');
  const terrain = new THREE.Mesh(
    geo,
    new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 }),
  );
  terrain.receiveShadow = true;
  const sea = new THREE.Mesh(
    new THREE.PlaneGeometry(400, 400),
    new THREE.MeshStandardMaterial({ color: 0x0c2f35, roughness: 0.25, metalness: 0.2, transparent: true, opacity: 0.88 }),
  );
  sea.rotation.x = -Math.PI / 2;
  sea.position.y = 0.01;
  scene.add(terrain, sea);

  // Ölçü ağı ve konturlar
  const gridLines = makeSegments(drapedGrid(grid, { spacing: 25, step: high ? 4 : 8 }), COLORS.cyan, 0.32);
  const c = buildContours(grid, { interval: 5, major: 25 });
  const contourMinor = makeSegments(c.minor, 0xdfe8e1, 0.22);
  const contourMajor = makeSegments(c.major, COLORS.cyan, 0.6);
  scene.add(gridLines, contourMinor, contourMajor);

  // Örnek ölçüm noktaları
  const points = new THREE.Group();
  const pointLabels = [];
  surveyPoints.slice(0, 6).forEach((p, i) => {
    const h = sampleGrid(grid, p.e, p.n);
    const m = makeMarker(COLORS.cyan, { radius: 0.16, height: 0.9 });
    m.position.copy(groundPoint(grid, p.e, p.n));
    points.add(m);
    if (i < 3) {
      const lbl = makeLabel(`<b>Ölçüm noktası ${p.id}</b><br>Kot ≈ ${fmt(h, 1)} m · örnek`);
      lbl.position.set(m.position.x, m.position.y + 0.95, m.position.z);
      pointLabels.push(lbl);
      scene.add(lbl);
    }
  });
  scene.add(points);

  // Parseller
  const neighbors = new THREE.Group();
  for (const p of parcels.filter((x) => !x.main)) {
    neighbors.add(makeLine(drapePath(grid, p.ring, { closed: true, step: 1.5, lift: 0.05 }), 0xdfe8e1, 0.55));
  }
  const boundary = makeLine(drapePath(grid, mainParcel.ring, { closed: true, step: 0.4, lift: 0.07 }), COLORS.cyan, 1);
  const fill = new THREE.Mesh(
    drapedPolygon(grid, mainParcel.ring, { cell: 1, lift: 0.045 }),
    new THREE.MeshBasicMaterial({ color: COLORS.cyan, transparent: true, opacity: 0.18, depthWrite: false, side: THREE.DoubleSide }),
  );
  const vertexMarkers = parcelVertices.map((v) => {
    const m = makeMarker(COLORS.warm, { radius: 0.07, height: 0.32 });
    m.position.copy(groundPoint(grid, v.e, v.n));
    return m;
  });
  const vertexLabels = parcelVertices.map((v) => {
    const yx = displayYX(v.e, v.n);
    const lbl = makeLabel(`<b>${v.id}</b> Y ${yx.Y} · X ${yx.X}`);
    const p = groundPoint(grid, v.e, v.n, 0.4);
    lbl.position.copy(p);
    return lbl;
  });
  const parcelTitle = makeLabel('<b>Parsel sınırı</b> · örnek veri');
  parcelTitle.position.copy(groundPoint(grid, mainParcel.ring[3][0], mainParcel.ring[3][1] + 4, 0.7));
  scene.add(neighbors, boundary, fill, ...vertexMarkers, ...vertexLabels, parcelTitle);

  // Bina
  const bld = makeBuilding(grid, building);
  scene.add(bld.group);

  // Aplikasyon kazıkları
  const stakes = building.corners.map((cn) => {
    const s = makeStake(3);
    s.position.copy(groundPoint(grid, cn.e, cn.n));
    scene.add(s);
    return s;
  });

  // GNSS alıcısı (K1 üzerinde)
  const gnss = makeGNSSReceiver(3);
  gnss.position.copy(groundPoint(grid, parcelVertices[0].e, parcelVertices[0].n));
  const gnssLabel = makeLabel('<b>GNSS alıcısı</b> · şematik');
  gnssLabel.position.copy(gnss.position).add(new THREE.Vector3(0, gnss.userData.antennaHeight + 0.15, 0));
  scene.add(gnss, gnssLabel);

  // Drone ve uçuş planı
  const flightAlt = 86 * YS;
  const flightPts = [];
  for (let k = 0, n = -40; n <= 40; n += 16, k++) {
    const xs = k % 2 === 0 ? [-52, 52] : [52, -52];
    flightPts.push(new THREE.Vector3(xs[0] * S, flightAlt, -n * S), new THREE.Vector3(xs[1] * S, flightAlt, -n * S));
  }
  const flight = polyPath(flightPts);
  const flightLine = makeLine(new Float32Array(flightPts.flatMap((p) => [p.x, p.y, p.z])), COLORS.orange, 0.9);
  const drone = makeDrone(9);
  scene.add(flightLine, drone);

  const tmp = new THREE.Vector3();
  const tmp2 = new THREE.Vector3();
  let droneT = 0;

  function set(s) {
    setOpacity(gridLines, s.grid ?? 0);
    setOpacity(contourMinor, s.contours ?? 0);
    setOpacity(contourMajor, s.contours ?? 0);
    const pv = s.points ?? 0;
    points.children.forEach((m, i) => {
      const a = clamp01(pv * points.children.length - i);
      m.visible = a > 0.01;
      m.scale.setScalar(Math.max(0.001, a));
    });
    pointLabels.forEach((l) => setLabelOpacity(l, s.pointLabels ?? 0));
    setOpacity(neighbors, s.neighbors ?? 0);
    setLineProgress(boundary, s.parcel ?? 0);
    setOpacity(fill, s.fill ?? 0);
    const vv = s.vertices ?? 0;
    vertexMarkers.forEach((m, i) => {
      const a = clamp01(vv * vertexMarkers.length - i);
      m.visible = a > 0.01;
      m.scale.setScalar(Math.max(0.001, a));
    });
    vertexLabels.forEach((l, i) => setLabelOpacity(l, (s.parcelLabels ?? 0) * clamp01(vv * vertexLabels.length - i)));
    setLabelOpacity(parcelTitle, s.parcelLabels ?? 0);
    bld.setStage(s.building ?? 0);
    const st = s.stakes ?? 0;
    stakes.forEach((k, i) => {
      const a = clamp01(st * stakes.length - i);
      k.visible = a > 0.01;
      k.scale.setScalar(Math.max(0.001, a));
    });
    gnss.visible = (s.gnss ?? 0) > 0.01;
    gnss.scale.setScalar(Math.max(0.001, s.gnss ?? 0));
    setLabelOpacity(gnssLabel, s.gnss ?? 0);
    setOpacity(flightLine, s.flightPath ?? 0);
    drone.visible = (s.drone ?? -1) >= 0;
    if (drone.visible) droneT = s.drone;
  }

  function update(dt, elapsed) {
    if (drone.visible) {
      flight.at(droneT, tmp);
      flight.at(Math.min(1, droneT + 0.01), tmp2);
      drone.position.copy(tmp).add(new THREE.Vector3(0, Math.sin(elapsed * 2) * 0.05, 0));
      if (tmp2.distanceToSquared(tmp) > 1e-6) drone.rotation.y = Math.atan2(-(tmp2.z - tmp.z), tmp2.x - tmp.x);
      drone.userData.rotors.forEach((r, i) => (r.rotation.y += dt * (i % 2 ? 40 : -40)));
    }
  }

  return { grid, terrain, set, update, parcelCenter: groundPoint(grid, building.center[0], building.center[1]) };
}
