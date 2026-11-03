/**
 * Kaydırmalı anlatı: sayfa kaydırıldıkça kamera ve katmanlar 5 bölüm boyunca ilerler.
 * Kaydırma kullanıcı kontrolündedir; normal sayfa kaydırmasını engellemez.
 */
import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SceneHost, addLights } from '../host.js';
import { buildWorld, cameraAt, seg } from '../world.js';

gsap.registerPlugin(ScrollTrigger);

const KEYS = [
  { t: 0, pos: [30, 32, 44], tgt: [0, 3, 0] },
  { t: 0.16, pos: [-24, 24, 34], tgt: [0, 4, 0] },
  { t: 0.3, pos: [0.8, 7.1, 4.6], tgt: [-1.8, 5.3, 1.4] },
  { t: 0.5, pos: [3, 14, 13], tgt: [0, 4.8, 0] },
  { t: 0.7, pos: [7, 10, 9.5], tgt: [-0.1, 5.4, 0] },
  { t: 0.86, pos: [-16, 19, 22], tgt: [0, 9, 0] },
  { t: 1, pos: [-20, 22, 26], tgt: [0, 8, 0] },
];

function stateAt(p) {
  return {
    grid: seg(p, 0.02, 0.12) * (1 - seg(p, 0.52, 0.62) * 0.75),
    contours: seg(p, 0.04, 0.16),
    points: seg(p, 0.2, 0.3),
    pointLabels: 0, // bu bölümde odak GNSS alıcısında; etiketler metin kartıyla çakışmasın
    gnss: seg(p, 0.24, 0.3) * (1 - seg(p, 0.44, 0.48)),
    neighbors: seg(p, 0.42, 0.52),
    parcel: seg(p, 0.4, 0.5),
    vertices: seg(p, 0.4, 0.5),
    fill: seg(p, 0.48, 0.56),
    parcelLabels: seg(p, 0.44, 0.5) * (1 - seg(p, 0.58, 0.62)),
    stakes: seg(p, 0.52, 0.6) * (1 - seg(p, 0.66, 0.7)),
    building: seg(p, 0.6, 0.78) * 4,
    flightPath: seg(p, 0.8, 0.86),
    drone: p >= 0.8 ? seg(p, 0.84, 1) : -1,
  };
}

export async function create(root, { quality }) {
  const container = root.querySelector('[data-scene]');
  const host = new SceneHost(container, { quality, background: '#0c1411', fog: 0.012, shadows: true, fov: 40 });
  const lights = addLights(host, { shadows: true, extent: 26 });
  lights.dir.target.position.set(0, 5, 0);
  host.scene.add(lights.dir.target);
  const world = buildWorld(host);

  const chapters = [...root.querySelectorAll('[data-chapter]')];
  const dots = [...root.querySelectorAll('[data-chapter-dot]')];
  let target = 0;
  let p = 0;
  let active = -1;
  const pos = new THREE.Vector3();
  const tgt = new THREE.Vector3();

  const trigger = ScrollTrigger.create({
    trigger: root,
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: (self) => (target = self.progress),
  });
  target = trigger.progress;
  p = target;

  let lastP = -1;
  host.onFrame((dt, elapsed) => {
    p = host.reduced ? target : p + (target - p) * (1 - Math.pow(0.001, dt));
    if (Math.abs(target - p) < 1e-4) p = target;
    const changed = p !== lastP;
    lastP = p;
    const idx = Math.min(4, Math.floor(p * 5));
    if (idx !== active) {
      active = idx;
      chapters.forEach((c, i) => c.classList.toggle('is-active', i === idx));
      dots.forEach((d, i) => d.classList.toggle('is-active', i === idx));
    }
    world.set(stateAt(p));
    world.update(dt, elapsed);
    cameraAt(KEYS, p, pos, tgt);
    host.camera.position.copy(pos);
    host.camera.lookAt(tgt);
    return changed || p >= 0.8; // son bölümde drone pervaneleri döner
  });

  return {
    dispose() {
      trigger.kill();
      host.dispose();
    },
  };
}
