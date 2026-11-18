/**
 * Gerçek Yalova bölge sahnesi (Copernicus DEM GLO-30, TUREF/TM30).
 * Hero sinematiğinin açılış/kapanışında kullanılır.
 */
import * as THREE from 'three';
import { buildTerrainGeometry, setTerrainColors, buildContours, drapedGrid, sampleGrid } from './terrain.js';
import { COLORS, makeSegments, setOpacity } from './objects.js';
import { makeLabel, setLabelOpacity } from './labels.js';
import { YALOVA } from './dem.js';

export function regionLights(scene) {
  const hemi = new THREE.HemisphereLight('#c9dde3', '#1c2a22', 0.8);
  const dir = new THREE.DirectionalLight('#ffe9cc', 2.6);
  dir.position.set(-30, 26, 18);
  scene.add(hemi, dir);
}

/** Bölge katmanlarını sahneye ekler; set() ile görünürlükleri ayarlanır */
export function buildRegion(scene, grid, { colorMode = 'cinematic', labels = true } = {}) {
  const group = new THREE.Group();
  const geo = buildTerrainGeometry(grid);
  setTerrainColors(geo, grid, colorMode);
  const terrainMat = new THREE.MeshStandardMaterial({
    vertexColors: true, roughness: 0.95, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1,
  });
  const terrain = new THREE.Mesh(geo, terrainMat);
  const sea = new THREE.Mesh(
    new THREE.PlaneGeometry(400, 400),
    new THREE.MeshStandardMaterial({ color: 0x0c2f35, roughness: 0.25, metalness: 0.2, transparent: true, opacity: 0.9 }),
  );
  sea.rotation.x = -Math.PI / 2;
  sea.position.y = grid.sea * grid.ys;

  // TM30 kilometre karelajı (ağ başlangıcı km'ye hizalı olduğu için çizgiler gerçek TM30 km çizgileridir)
  const kmGrid = makeSegments(drapedGrid(grid, { spacing: 1000, extent: 8000, step: 250, lift: 0.02 }), COLORS.cyan, 0.3);
  // Eş yükselti eğrileri: 25 m aralık, 100 m ana eğri
  const c = buildContours(grid, { interval: 25, major: 100, lift: 0.012 });
  const contourMinor = makeSegments(c.minor, 0xdfe8e1, 0.2);
  const contourMajor = makeSegments(c.major, COLORS.cyan, 0.55);
  group.add(terrain, sea, kmGrid, contourMinor, contourMajor);
  scene.add(group);

  const placeLabels = [];
  if (labels) {
    for (const p of YALOVA.places) {
      const l = makeLabel(`<b>${p.name}</b> · şehir merkezi`);
      l.position.set(p.e * grid.s, sampleGrid(grid, p.e, p.n) * grid.ys + 0.35, -p.n * grid.s);
      scene.add(l);
      placeLabels.push(l);
    }
  }

  function set({ grid: gridO = 0, contours = 0, places = 0 } = {}) {
    setOpacity(kmGrid, gridO);
    setOpacity(contourMinor, contours);
    setOpacity(contourMajor, contours);
    placeLabels.forEach((l) => setLabelOpacity(l, places));
  }
  set();
  return { group, terrain, terrainMat, geo, set, kmGrid, contours: [contourMinor, contourMajor] };
}

/** Bir sahnedeki tüm CSS2D etiketlerini gizler (başka sahneye geçerken eski etiketler ekranda kalmasın) */
export function hideLabels(scene) {
  scene.traverse((o) => {
    if (o.isCSS2DObject) o.element.style.display = 'none';
  });
}
