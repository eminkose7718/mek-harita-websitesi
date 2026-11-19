/**
 * Sinematik giriş (Hero): 5 sahne.
 *  1–2: GERÇEK Yalova arazisi (Copernicus DEM GLO-30), TM30 km karelajı ve eş yükselti eğrileri.
 *  3–4: Parsel ölçeğine geçiş — bu ölçekte arazi, parsel ve bina TEMSİLİDİR (gerçek bir konum değildir).
 *  5:   Gerçek Yalova arazisine geri dönüş ve firma tanıtımı.
 * İki ölçek arasında kısa bir kararma ile geçilir. "Animasyonu Atla" ile beklemeden geçilebilir;
 * giriş oturum başına bir kez oynar.
 */
import * as THREE from 'three';
import { SceneHost, addLights } from '../host.js';
import { buildWorld, cameraAt, seg } from '../world.js';
import { loadYalova } from '../dem.js';
import { buildRegion, regionLights, hideLabels } from '../region.js';

const DURATION = 15; // saniye
const SCENES = [
  { at: 0, title: 'Yalova Topoğrafyası', text: 'Copernicus uydu yükseklik verisinden üretilmiş gerçek Yalova arazisi (yüzey modeli).' },
  { at: 0.17, title: 'TM30 Karelajı ve Eş Yükselti Eğrileri', text: 'Arazinin üzerine TUREF/TM30 kilometre ağı ve 25 m aralıklı konturlar yerleşiyor.' },
  { at: 0.36, title: 'Parsel Sınırı', text: 'Örnek bir parsel ölçeğine geçiliyor. Bu ölçekteki arazi, parsel ve bina temsilidir.' },
  { at: 0.58, title: 'Bina Oturumu', text: 'Taban izi, temel, taşıyıcı sistem ve bina hacmi — ölçümden yapıya geçiş.' },
  { at: 0.84, title: 'MEK Harita & Mühendislik', text: 'Ölçüde Hassas, Çözümde Güçlü.' },
];

// Ölçek geçişleri (kararma ortası)
const TO_SITE = 0.38;
const TO_REGION = 0.86;

// Gerçek bölge: denizden (kuzeyden) güneye, kıyıya ve tepelere bakış
const REGION_IN = [
  { t: 0, pos: [-4, 44, -58], tgt: [0, 0.5, -2] },
  { t: 0.17, pos: [-7, 15, -31], tgt: [3, 0.8, -4] },
  { t: 0.33, pos: [-3, 6.5, -14], tgt: [0, 1.4, 1] },
  { t: TO_SITE, pos: [-0.5, 3.6, -5.5], tgt: [0, 1.6, 2] },
];
const SITE = [
  { t: TO_SITE, pos: [-11, 17, 23], tgt: [0, 4.5, 0] },
  { t: 0.58, pos: [5.5, 9.5, 11.5], tgt: [-0.1, 5.2, 0] },
  { t: 0.82, pos: [8.5, 7.2, 8], tgt: [-0.1, 5.6, 0] },
  { t: TO_REGION, pos: [10, 8.5, 9.5], tgt: [-0.1, 5.4, 0] },
];
const REGION_OUT = [
  { t: TO_REGION, pos: [-7, 7, -18], tgt: [2, 1, -2] },
  { t: 1, pos: [-21, 13, -27], tgt: [3, 1.2, -1] },
];

// Dikey ekran (telefon): kıyı, ova ve dağları birlikte gösteren daha yüksek bakış
const REGION_OUT_PORTRAIT = [
  { t: TO_REGION, pos: [-4, 14, -26], tgt: [2, 0.6, -5] },
  { t: 1, pos: [-6, 26, -34], tgt: [2, 0.4, -3] },
];

function siteState(t) {
  return {
    grid: 0.8,
    contours: 1,
    points: 1,
    pointLabels: 0,
    neighbors: seg(t, 0.44, 0.56),
    parcel: seg(t, 0.42, 0.53),
    vertices: seg(t, 0.42, 0.55),
    fill: seg(t, 0.5, 0.58),
    parcelLabels: seg(t, 0.45, 0.52) * (1 - seg(t, 0.62, 0.68)),
    building: seg(t, 0.6, 0.82) * 4,
    drone: -1,
  };
}

function regionState(t) {
  if (t < TO_SITE) {
    return { grid: seg(t, 0.17, 0.27), contours: seg(t, 0.19, 0.32), places: seg(t, 0.22, 0.28) * (1 - seg(t, 0.31, 0.34)) };
  }
  return { grid: 0.35, contours: 0.8, places: 0 }; // kapanışta etiket, hero metniyle çakışmasın
}

/** 0 → 1 → 0 tepe: kararma perdesi */
const bump = (t, a, m, b) => (t < m ? seg(t, a, m) : 1 - seg(t, m, b));

export async function create(root, { quality, playIntro, onIntroEnd }) {
  const container = root.querySelector('[data-scene]');
  const host = new SceneHost(container, { quality, background: '#0c1411', fog: 0.011, shadows: true, fov: 38 });

  // Temsili parsel ölçeği sahnesi
  const lights = addLights(host, { shadows: true, extent: 26, sun: [-26, 34, 18] });
  lights.dir.target.position.set(0, 5, 0);
  host.scene.add(lights.dir.target);
  const siteScene = host.scene;
  const world = buildWorld(host);

  // Gerçek Yalova bölge sahnesi
  const yalova = await loadYalova(quality);
  const regionScene = new THREE.Scene();
  regionScene.background = new THREE.Color('#0c1411');
  regionScene.fog = new THREE.FogExp2('#0c1411', 0.012);
  regionLights(regionScene);
  const region = buildRegion(regionScene, yalova);
  host.extraScenes.push(siteScene, regionScene);

  // Ölçek geçişi için kararma perdesi
  const fade = document.createElement('div');
  fade.className = 'scene-fade';
  container.append(fade);

  const caption = root.querySelector('[data-hero-caption]');
  const capTitle = root.querySelector('[data-hero-caption-title]');
  const capText = root.querySelector('[data-hero-caption-text]');
  const capIndex = root.querySelector('[data-hero-caption-index]');
  const progress = root.querySelector('[data-hero-progress]');

  let t = playIntro ? 0 : 1;
  let playing = playIntro;
  let sceneIdx = -1;
  let orbit = 0;
  let active = null;
  const pos = new THREE.Vector3();
  const tgt = new THREE.Vector3();
  const curTgt = new THREE.Vector3();

  const isSite = (tt) => tt >= TO_SITE && tt < TO_REGION;
  function cameraFor(tt) {
    if (tt < TO_SITE) cameraAt(REGION_IN, tt, pos, tgt);
    else if (tt < TO_REGION) cameraAt(SITE, tt, pos, tgt);
    else cameraAt(host.camera.aspect < 1 ? REGION_OUT_PORTRAIT : REGION_OUT, tt, pos, tgt);
  }
  function useScene(sc) {
    if (active === sc) return false;
    if (active) hideLabels(active);
    active = sc;
    host.scene = sc;
    return true;
  }

  cameraFor(t);
  useScene(isSite(t) ? siteScene : regionScene);
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

    const switched = useScene(isSite(t) ? siteScene : regionScene);
    if (active === siteScene) {
      world.set(siteState(t));
      world.update(dt, elapsed);
    } else {
      region.set(regionState(t));
    }
    fade.style.opacity = String(Math.max(bump(t, 0.335, TO_SITE, 0.425), bump(t, 0.815, TO_REGION, 0.9)));

    cameraFor(t);
    // Dikey ekranlarda (telefon) görüş alanı dar olduğundan kamera geri çekilir
    if (host.camera.aspect < 1 && isSite(t)) pos.sub(tgt).multiplyScalar(1 + (1 - host.camera.aspect) * 0.9).add(tgt);
    if (t >= 1 && !host.reduced) {
      // Bekleme animasyonu: hedef etrafında çok yavaş dönüş
      orbit += dt * 0.03;
      pos.sub(tgt).applyAxisAngle(new THREE.Vector3(0, 1, 0), orbit).add(tgt);
    }
    // Oynarken kamerayı doğrudan izle; atlamada yumuşak süzül, ölçek değişiminde ise anında geç
    const k = playing || switched ? 1 : 1 - Math.pow(0.02, dt);
    host.camera.position.lerp(pos, k);
    curTgt.lerp(tgt, k);
    host.camera.lookAt(curTgt);
    return playing || !host.reduced || switched;
  });

  return {
    skip: finish,
    replay() {
      t = 0;
      orbit = 0;
      playing = true;
    },
    dispose() {
      fade.remove();
      host.dispose();
    },
  };
}
