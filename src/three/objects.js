/** Ortak 3D nesneler: çizgiler, işaretler, GNSS alıcısı, drone, uydu, bina aşamaları */
import * as THREE from 'three';
import { S, YS, drapePath, sampleGrid } from './terrain.js';

export const COLORS = {
  cyan: 0x4cb8c4,
  warm: 0xf7f8f5,
  green: 0x113f28,
  greenLight: 0x2f7a52,
  brown: 0x5d4037,
  orange: 0xe39a4a,
  cut: 0xc8553d,
  fill: 0x3a86c8,
  graphite: 0x151a18,
};

export function lineMaterial(color, opacity = 1, extra = {}) {
  return new THREE.LineBasicMaterial({ color, transparent: true, opacity, depthWrite: false, ...extra });
}

export function makeLine(positions, color, opacity = 1) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const line = new THREE.Line(geo, lineMaterial(color, opacity));
  line.userData.count = positions.length / 3;
  line.renderOrder = 2;
  return line;
}

export function makeSegments(positions, color, opacity = 1) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const seg = new THREE.LineSegments(geo, lineMaterial(color, opacity));
  seg.renderOrder = 1;
  return seg;
}

export function makeDashed(points, color, { dash = 0.18, gap = 0.12, opacity = 0.9 } = {}) {
  const geo = new THREE.BufferGeometry().setFromPoints(points);
  const mat = new THREE.LineDashedMaterial({ color, dashSize: dash, gapSize: gap, transparent: true, opacity, depthWrite: false });
  const line = new THREE.Line(geo, mat);
  line.computeLineDistances();
  line.renderOrder = 3;
  return line;
}

/** Çizginin ilk t (0..1) kısmını göster */
export function setLineProgress(line, t) {
  const n = line.userData.count ?? line.geometry.getAttribute('position').count;
  line.geometry.setDrawRange(0, Math.max(0, Math.round(n * t)));
  line.visible = t > 0.001;
}

export function setOpacity(obj, a) {
  obj.traverse((o) => {
    if (!o.material) return;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    for (const m of mats) {
      if (m.userData.baseOpacity === undefined) m.userData.baseOpacity = m.opacity;
      m.transparent = true;
      m.opacity = m.userData.baseOpacity * a;
    }
  });
  obj.visible = a > 0.01;
}

/** Ölçüm noktası işareti: zemin halkası + gövde + baş */
export function makeMarker(color = COLORS.cyan, { radius = 0.11, height = 0.55 } = {}) {
  const g = new THREE.Group();
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 16, 12),
    new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.6, roughness: 0.4 }),
  );
  head.position.y = height;
  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.18, radius * 0.18, height, 6),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.8 }),
  );
  stem.position.y = height / 2;
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(radius * 1.3, radius * 1.9, 24),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.75, side: THREE.DoubleSide, depthWrite: false }),
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.02;
  g.add(head, stem, ring);
  g.userData.head = head;
  g.userData.ring = ring;
  return g;
}

export function makePulseRing(color = COLORS.cyan, r = 0.6) {
  const m = new THREE.Mesh(
    new THREE.RingGeometry(r * 0.86, r, 48),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.8, side: THREE.DoubleSide, depthWrite: false }),
  );
  m.rotation.x = -Math.PI / 2;
  return m;
}

/** Yere yapışık bir noktanın sahne konumu */
export function groundPoint(g, e, n, lift = 0) {
  return new THREE.Vector3(e * S, sampleGrid(g, e, n) * YS + lift, -n * S);
}

/** Şematik GNSS alıcısı (jalon + anten + kontrol ünitesi + bipod). Ölçeksiz gösterim. */
export function makeGNSSReceiver(scale = 1) {
  const g = new THREE.Group();
  const u = S * scale; // metre → sahne
  const yellow = new THREE.MeshStandardMaterial({ color: 0xe0b23a, roughness: 0.5, metalness: 0.2 });
  const white = new THREE.MeshStandardMaterial({ color: 0xf2f2ee, roughness: 0.45 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x23292a, roughness: 0.6, metalness: 0.3 });

  const lower = new THREE.Mesh(new THREE.CylinderGeometry(0.02 * u, 0.02 * u, 1 * u, 10), yellow);
  lower.position.y = 0.5 * u;
  const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.018 * u, 0.018 * u, 1 * u, 10), white);
  upper.position.y = 1.5 * u;
  const antennaBase = new THREE.Mesh(new THREE.CylinderGeometry(0.13 * u, 0.12 * u, 0.06 * u, 28), dark);
  antennaBase.position.y = 2.03 * u;
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.12 * u, 28, 12, 0, Math.PI * 2, 0, Math.PI / 2), white);
  dome.position.y = 2.06 * u;
  const ctrl = new THREE.Mesh(new THREE.BoxGeometry(0.09 * u, 0.16 * u, 0.035 * u), dark);
  ctrl.position.set(0.05 * u, 1.3 * u, 0.03 * u);
  ctrl.rotation.x = -0.4;
  g.add(lower, upper, antennaBase, dome, ctrl);

  // bipod bacakları
  for (const a of [Math.PI * 0.75, Math.PI * 1.25]) {
    const top = new THREE.Vector3(0, 1.2 * u, 0);
    const foot = new THREE.Vector3(Math.cos(a) * 0.7 * u, 0, Math.sin(a) * 0.7 * u);
    const len = top.distanceTo(foot);
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.01 * u, 0.012 * u, len, 6), dark);
    leg.position.copy(top).add(foot).multiplyScalar(0.5);
    leg.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), top.clone().sub(foot).normalize());
    g.add(leg);
  }
  g.traverse((o) => o.isMesh && (o.castShadow = true));
  g.userData.antennaHeight = 2.1 * u;
  return g;
}

/** Şematik çok rotorlu drone. Ölçeksiz gösterim. */
export function makeDrone(scale = 1) {
  const g = new THREE.Group();
  const u = S * scale;
  const body = new THREE.MeshStandardMaterial({ color: 0x2a3230, roughness: 0.5, metalness: 0.4 });
  const accent = new THREE.MeshStandardMaterial({ color: 0xf2f2ee, roughness: 0.4 });
  const core = new THREE.Mesh(new THREE.BoxGeometry(0.32 * u, 0.09 * u, 0.24 * u), body);
  const top = new THREE.Mesh(new THREE.BoxGeometry(0.2 * u, 0.04 * u, 0.16 * u), accent);
  top.position.y = 0.06 * u;
  const cam = new THREE.Mesh(new THREE.SphereGeometry(0.05 * u, 12, 10), body);
  cam.position.set(0.1 * u, -0.08 * u, 0);
  g.add(core, top, cam);
  const rotors = [];
  const rotorMat = new THREE.MeshBasicMaterial({ color: 0xcfd8d4, transparent: true, opacity: 0.35, side: THREE.DoubleSide });
  for (let k = 0; k < 4; k++) {
    const a = Math.PI / 4 + (k * Math.PI) / 2;
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.34 * u, 0.025 * u, 0.03 * u), body);
    arm.position.set(Math.cos(a) * 0.2 * u, 0.02 * u, Math.sin(a) * 0.2 * u);
    arm.rotation.y = -a;
    const rotor = new THREE.Mesh(new THREE.CircleGeometry(0.14 * u, 20), rotorMat);
    rotor.rotation.x = -Math.PI / 2;
    rotor.position.set(Math.cos(a) * 0.36 * u, 0.06 * u, Math.sin(a) * 0.36 * u);
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.26 * u, 0.006 * u, 0.025 * u), accent);
    blade.position.copy(rotor.position);
    rotors.push(blade);
    g.add(arm, rotor, blade);
  }
  g.userData.rotors = rotors;
  return g;
}

/** Şematik uydu */
export function makeSatellite(size = 0.5) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(size, size * 0.8, size * 0.8),
    new THREE.MeshStandardMaterial({ color: 0xd9d4c4, metalness: 0.6, roughness: 0.35 }),
  );
  const panelMat = new THREE.MeshStandardMaterial({ color: 0x1f4f7a, metalness: 0.5, roughness: 0.3, emissive: 0x0a2236 });
  for (const s of [-1, 1]) {
    const p = new THREE.Mesh(new THREE.BoxGeometry(size * 1.8, size * 0.04, size * 0.7), panelMat);
    p.position.x = s * size * 1.4;
    g.add(p);
  }
  g.add(body);
  return g;
}

/** Aplikasyon kazığı */
export function makeStake(scale = 1) {
  const u = S * scale;
  const g = new THREE.Group();
  const post = new THREE.Mesh(
    new THREE.CylinderGeometry(0.035 * u, 0.02 * u, 0.9 * u, 8),
    new THREE.MeshStandardMaterial({ color: 0xc9a46a, roughness: 0.8 }),
  );
  post.position.y = 0.45 * u;
  const flag = new THREE.Mesh(
    new THREE.BoxGeometry(0.2 * u, 0.12 * u, 0.01 * u),
    new THREE.MeshStandardMaterial({ color: COLORS.orange, emissive: COLORS.orange, emissiveIntensity: 0.35 }),
  );
  flag.position.set(0.1 * u, 0.82 * u, 0);
  g.add(post, flag);
  return g;
}

/** Yatay bir taban poligonunu (e,n köşeleri) bottomY'den itibaren height kadar yükseltir */
export function extrudeFootprint(corners, bottomY, height) {
  const shape = new THREE.Shape(corners.map((c) => new THREE.Vector2(c.e * S, c.n * S)));
  const geo = new THREE.ExtrudeGeometry(shape, { depth: height, bevelEnabled: false });
  geo.rotateX(-Math.PI / 2);
  geo.translate(0, bottomY, 0);
  return geo;
}

/**
 * Kavramsal bina: 1 taban izi → 2 temel → 3 taşıyıcı sistem → 4 bina hacmi.
 * setStage(v) v ∈ [0, 4]
 */
export function makeBuilding(grid, b) {
  const group = new THREE.Group();
  const hs = b.corners.map((c) => sampleGrid(grid, c.e, c.n));
  const base = Math.max(...hs) + 0.3; // ±0.00 kotu (örnek)
  const baseY = base * YS;
  const bottomY = (Math.min(...hs) - 1.6) * YS;
  const H = b.floors * b.floorHeight * YS;

  const footprint = new THREE.Group();
  const outline = makeLine(drapePath(grid, b.corners.map((c) => [c.e, c.n]), { closed: true, step: 0.5, lift: 0.07 }), COLORS.orange, 1);
  const pad = new THREE.Mesh(
    extrudeFootprint(b.corners, baseY - 0.01, 0.015),
    new THREE.MeshBasicMaterial({ color: COLORS.orange, transparent: true, opacity: 0.22, depthWrite: false }),
  );
  footprint.add(outline, pad);

  const foundation = new THREE.Mesh(
    extrudeFootprint(b.corners, 0, baseY - bottomY),
    new THREE.MeshStandardMaterial({ color: 0x9b9a90, roughness: 0.9 }),
  );
  foundation.position.y = bottomY;
  foundation.castShadow = foundation.receiveShadow = true;

  // taşıyıcı sistem: kolonlar + kat döşemeleri
  const structure = new THREE.Group();
  const colMat = new THREE.MeshStandardMaterial({ color: 0xd8d6cf, roughness: 0.7 });
  const columns = [];
  const lerp2 = (a, c, t) => ({ e: a.e + (c.e - a.e) * t, n: a.n + (c.n - a.n) * t });
  const [c1, c2, c3, c4] = b.corners;
  for (const tx of [0.04, 0.5, 0.96]) {
    for (const ty of [0.05, 0.5, 0.95]) {
      const p = lerp2(lerp2(c1, c2, tx), lerp2(c4, c3, tx), ty);
      const col = new THREE.Mesh(new THREE.BoxGeometry(0.05, H, 0.05), colMat);
      col.geometry.translate(0, H / 2, 0);
      col.position.set(p.e * S, baseY, -p.n * S);
      col.rotation.y = b.angle;
      col.castShadow = true;
      columns.push(col);
      structure.add(col);
    }
  }
  const slabs = [];
  for (let f = 1; f <= b.floors; f++) {
    const slab = new THREE.Mesh(extrudeFootprint(b.corners, baseY + f * b.floorHeight * YS - 0.03, 0.03), colMat);
    slab.castShadow = true;
    slabs.push(slab);
    structure.add(slab);
  }

  const volume = new THREE.Group();
  const volGeo = extrudeFootprint(b.corners, baseY, H);
  const shell = new THREE.Mesh(
    volGeo,
    new THREE.MeshStandardMaterial({ color: 0xeef3f1, roughness: 0.25, metalness: 0.1, transparent: true, opacity: 0.55 }),
  );
  shell.castShadow = true;
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(volGeo), lineMaterial(COLORS.cyan, 0.9));
  volume.add(shell, edges);

  group.add(footprint, foundation, structure, volume);

  const clamp01 = (x) => Math.min(1, Math.max(0, x));
  function setStage(v) {
    const s1 = clamp01(v), s2 = clamp01(v - 1), s3 = clamp01(v - 2), s4 = clamp01(v - 3);
    setOpacity(footprint, s1 * (1 - s4 * 0.6));
    foundation.visible = s2 > 0.01;
    foundation.scale.y = Math.max(0.001, s2);
    structure.visible = s3 > 0.01;
    columns.forEach((c, k) => (c.scale.y = Math.max(0.001, clamp01(s3 * 1.6 - k * 0.07))));
    slabs.forEach((sl, k) => (sl.visible = s3 > (k + 1) / (slabs.length + 1)));
    setOpacity(volume, s4);
  }
  setStage(0);
  return { group, setStage, baseLevel: base, baseY, height: H };
}
