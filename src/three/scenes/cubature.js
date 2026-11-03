/**
 * Kazı / dolgu görselleştirmesi — örnek geometri (20 m × 20 m, 5 m karelaj).
 * Hacim değerleri src/lib/cubature.js'teki TIN yöntemiyle hesaplanır.
 */
import * as THREE from 'three';
import { SceneHost, addLights } from '../host.js';
import { createOrbit } from '../controls.js';
import { COLORS } from '../objects.js';
import { makeLabel } from '../labels.js';
import { EXAMPLE_SURVEY } from '../../lib/cubature.js';

const EX = 1.5; // düşey abartma (yalnızca görsel)
const BASE = 98; // m

export async function create(root, { quality }) {
  const container = root.querySelector('[data-scene]');
  const host = new SceneHost(container, { quality, background: '#f1f3ef', fov: 38 });
  addLights(host, { intensity: 2.2, sun: [-14, 22, 12] });
  const { z, spacing } = EXAMPLE_SURVEY;
  const R = z.length - 1;
  const Cn = z[0].length - 1;
  const W = Cn * spacing;
  const D = R * spacing;

  // Yöntemle aynı üçgenleme; görsel renk geçişi için her üçgen 4×4 alt üçgene bölünür (yüzey aynı kalır)
  const SUB = 4;
  const tris = [];
  const P = (r, c) => ({ x: c * spacing - W / 2, zz: r * spacing - D / 2, h: z[r][c] });
  for (let r = 0; r < R; r++) {
    for (let c = 0; c < Cn; c++) {
      tris.push([P(r, c), P(r, c + 1), P(r + 1, c)], [P(r, c + 1), P(r + 1, c + 1), P(r + 1, c)]);
    }
  }
  const verts = [];
  for (const [a, b, cc] of tris) {
    const bary = (i, j) => {
      const u = i / SUB, v = j / SUB, w = 1 - u - v;
      return { x: a.x * w + b.x * u + cc.x * v, zz: a.zz * w + b.zz * u + cc.zz * v, h: a.h * w + b.h * u + cc.h * v };
    };
    for (let i = 0; i < SUB; i++) {
      for (let j = 0; j < SUB - i; j++) {
        verts.push(bary(i, j), bary(i + 1, j), bary(i, j + 1));
        if (i + j < SUB - 1) verts.push(bary(i + 1, j), bary(i + 1, j + 1), bary(i, j + 1));
      }
    }
  }
  const n = verts.length;
  const mk = () => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    return g;
  };
  const surfGeo = mk();
  const planeGeo = mk();
  verts.forEach((v, i) => surfGeo.attributes.position.array.set([v.x, (v.h - BASE) * EX, v.zz], i * 3));
  surfGeo.computeVertexNormals();
  const surface = new THREE.Mesh(surfGeo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8, side: THREE.DoubleSide }));
  const plane = new THREE.Mesh(planeGeo, new THREE.MeshStandardMaterial({ vertexColors: true, transparent: true, opacity: 0.42, side: THREE.DoubleSide, depthWrite: false, roughness: 0.4 }));
  const wire = new THREE.LineSegments(new THREE.WireframeGeometry(new THREE.PlaneGeometry(W, D, Cn, R).rotateX(-Math.PI / 2)), new THREE.LineBasicMaterial({ color: 0x113f28, transparent: true, opacity: 0.25 }));
  wire.position.y = 0;
  host.scene.add(surface, plane, wire);

  // Karelaj noktalarında yüzey ile platform arasındaki dikey çizgiler
  const nodeLines = new THREE.LineSegments(
    new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(new Float32Array((R + 1) * (Cn + 1) * 6), 3))
      .setAttribute('color', new THREE.BufferAttribute(new Float32Array((R + 1) * (Cn + 1) * 6), 3)),
    new THREE.LineBasicMaterial({ vertexColors: true }),
  );
  host.scene.add(nodeLines);

  const box = new THREE.Box3(new THREE.Vector3(-W / 2, 0, -D / 2), new THREE.Vector3(W / 2, 7, D / 2));
  host.scene.add(new THREE.Box3Helper(box, 0x9aa69f));
  const lx = makeLabel(`<b>${W} m</b>`, { variant: 'is-paper', anchor: 'bottom' });
  lx.position.set(0, 0, D / 2 + 1.2);
  const lz = makeLabel(`<b>${D} m</b>`, { variant: 'is-paper', anchor: 'bottom' });
  lz.position.set(W / 2 + 1.4, 0, 0);
  host.scene.add(lx, lz);

  const cut = new THREE.Color(COLORS.cut);
  const fill = new THREE.Color(COLORS.fill);
  const neutral = new THREE.Color('#c9cfc4');
  const tmp = new THREE.Color();

  function update(level) {
    const y = (level - BASE) * EX;
    const sc = surfGeo.attributes.color.array;
    const pp = planeGeo.attributes.position.array;
    const pc = planeGeo.attributes.color.array;
    verts.forEach((v, i) => {
      const d = v.h - level;
      tmp.copy(neutral).lerp(d > 0 ? cut : fill, Math.min(1, Math.abs(d) / 0.6) * 0.9 + 0.1);
      sc.set([tmp.r, tmp.g, tmp.b], i * 3);
      pp.set([v.x, y, v.zz], i * 3);
      pc.set([tmp.r, tmp.g, tmp.b], i * 3);
    });
    surfGeo.attributes.color.needsUpdate = true;
    planeGeo.attributes.position.needsUpdate = true;
    planeGeo.attributes.color.needsUpdate = true;
    planeGeo.computeVertexNormals();
    const lp = nodeLines.geometry.attributes.position.array;
    const lc = nodeLines.geometry.attributes.color.array;
    let k = 0;
    for (let r = 0; r <= R; r++) {
      for (let c = 0; c <= Cn; c++) {
        const p = P(r, c);
        const col = p.h > level ? cut : fill;
        lp.set([p.x, (p.h - BASE) * EX, p.zz, p.x, y, p.zz], k * 6);
        lc.set([col.r, col.g, col.b, col.r, col.g, col.b], k * 6);
        k++;
      }
    }
    nodeLines.geometry.attributes.position.needsUpdate = true;
    nodeLines.geometry.attributes.color.needsUpdate = true;
    host.invalidate();
  }

  const slider = root.querySelector('[data-cub-level]');
  const onInput = () => update(parseFloat(slider.value));
  slider.addEventListener('input', onInput);
  update(parseFloat(slider.value));

  createOrbit(host, root, { target: [0, 3, 0], minDistance: 12, maxDistance: 60, panLimit: 12 });
  host.camera.position.set(27, 23, 32);

  return {
    dispose() {
      slider.removeEventListener('input', onInput);
      host.dispose();
    },
  };
}
