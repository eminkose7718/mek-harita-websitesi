/**
 * Sinematik giriş (Hero): 5 sahne — arazi, ölçü ağı, parsel, bina, firma.
 * Ziyaretçi "Animasyonu Atla" ile beklemeden geçebilir; giriş oturum başına bir kez oynar.
 */
import * as THREE from 'three';
import { SceneHost, addLights } from '../host.js';
import { buildWorld, cameraAt, seg } from '../world.js';

const DURATION = 14; // saniye
const SCENES = [
  { at: 0, title: 'Arazi Modeli', text: 'Temsili 3D arazi modeli, topoğrafya ve yükseklik farklarıyla beliriyor.' },
  { at: 0.18, title: 'Ölçü Ağı ve Eş Yükselti Eğrileri', text: 'Karelaj, kontur çizgileri ve örnek ölçüm noktaları arazinin üzerine yerleşiyor.' },
  { at: 0.38, title: 'Parsel Sınırı', text: 'Örnek parsel köşeleri sırayla ölçülüyor; noktalar birleşerek sınırı oluşturuyor.' },
  { at: 0.58, title: 'Bina Oturumu', text: 'Taban izi, temel, taşıyıcı sistem ve bina hacmi — ölçümden yapıya geçiş.' },
  { at: 0.84, title: 'MEK Harita & Mühendislik', text: 'Ölçüde Hassas, Çözümde Güçlü.' },
];

const KEYS = [
  { t: 0, pos: [8, 64, 92], tgt: [0, 2, 0] },
  { t: 0.18, pos: [-20, 27, 40], tgt: [0, 3, 0] },
  { t: 0.38, pos: [-9, 15, 21], tgt: [0, 4.5, 0] },
  { t: 0.58, pos: [5.5, 9.5, 11.5], tgt: [-0.1, 5.2, 0] },
  { t: 0.84, pos: [8.5, 7.2, 8], tgt: [-0.1, 5.6, 0] },
  { t: 1, pos: [-21, 19, 27], tgt: [0, 4, -2] },
];

function stateAt(t) {
  const end = 1 - seg(t, 0.84, 0.96);
  return {
    grid: seg(t, 0.18, 0.28) * (1 - seg(t, 0.84, 0.96) * 0.55),
    contours: seg(t, 0.2, 0.34),
    points: seg(t, 0.24, 0.36),
    pointLabels: seg(t, 0.28, 0.34) * (1 - seg(t, 0.4, 0.46)),
    neighbors: seg(t, 0.44, 0.56),
    parcel: seg(t, 0.4, 0.52),
    vertices: seg(t, 0.4, 0.54),
    fill: seg(t, 0.5, 0.58),
    parcelLabels: seg(t, 0.44, 0.52) * (1 - seg(t, 0.62, 0.68)) * end,
    building: seg(t, 0.6, 0.82) * 4,
    drone: -1,
  };
}

export async function create(root, { quality, playIntro, onIntroEnd }) {
  const container = root.querySelector('[data-scene]');
  const host = new SceneHost(container, { quality, background: '#0c1411', fog: 0.011, shadows: true, fov: 38 });
  const lights = addLights(host, { shadows: true, extent: 26, sun: [-26, 34, 18] });
  lights.dir.target.position.set(0, 5, 0);
  host.scene.add(lights.dir.target);
  const world = buildWorld(host);

  const caption = root.querySelector('[data-hero-caption]');
  const capTitle = root.querySelector('[data-hero-caption-title]');
  const capText = root.querySelector('[data-hero-caption-text]');
  const capIndex = root.querySelector('[data-hero-caption-index]');
  const progress = root.querySelector('[data-hero-progress]');

  let t = playIntro ? 0 : 1;
  let playing = playIntro;
  let sceneIdx = -1;
  let orbit = 0;
  const pos = new THREE.Vector3();
  const tgt = new THREE.Vector3();
  const curTgt = new THREE.Vector3();
  cameraAt(KEYS, t, pos, tgt);
  host.camera.position.copy(pos);
  curTgt.copy(tgt);

  function finish() {
    if (!playing) return;
    playing = false;
    t = 1;
    onIntroEnd?.();
  }

  host.onFrame((dt, elapsed) => {
    if (playing) {
      t = Math.min(1, t + dt / DURATION);
      if (t >= 1) finish();
    }
    const idx = SCENES.reduce((acc, s, i) => (t >= s.at ? i : acc), 0);
    if (idx !== sceneIdx && caption) {
      sceneIdx = idx;
      capTitle.textContent = SCENES[idx].title;
      capText.textContent = SCENES[idx].text;
      capIndex.textContent = `0${idx + 1} / 05`;
    }
    if (progress) progress.style.transform = `scaleX(${t})`;

    world.set(stateAt(t));
    world.update(dt, elapsed);

    cameraAt(KEYS, t, pos, tgt);
    if (t >= 1 && !host.reduced) {
      // Bekleme animasyonu: hedef etrafında çok yavaş dönüş
      orbit += dt * 0.035;
      pos.sub(tgt).applyAxisAngle(new THREE.Vector3(0, 1, 0), orbit).add(tgt);
    }
    const k = playing ? 1 : 1 - Math.pow(0.02, dt); // atlamada yumuşak süzülme
    host.camera.position.lerp(pos, k);
    curTgt.lerp(tgt, k);
    host.camera.lookAt(curTgt);
    return playing || !host.reduced;
  });

  return {
    skip: finish,
    replay() {
      t = 0;
      orbit = 0;
      playing = true;
    },
    dispose: () => host.dispose(),
  };
}
