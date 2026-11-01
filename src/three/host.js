/**
 * SceneHost — her 3D bölüm için tek bir WebGL bağlamı yönetir:
 * boyutlandırma, görünürlüğe göre döngüyü durdurma, uyarlanabilir piksel oranı,
 * etiket katmanı (CSS2D) ve tam bellek temizliği.
 */
import * as THREE from 'three';
import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { maxPixelRatio, prefersReducedMotion } from '../lib/quality.js';

export class SceneHost {
  constructor(container, { quality = 'high', background = '#0d1512', fov = 40, labels = true, shadows = false, fog = 0 } = {}) {
    this.container = container;
    this.quality = quality;
    this.reduced = prefersReducedMotion();
    this.handlers = [];
    this.elapsed = 0;
    this.visible = false;
    this.running = false;
    this.disposed = false;

    const renderer = new THREE.WebGLRenderer({ antialias: quality === 'high', powerPreference: 'high-performance' });
    this.pixelRatio = Math.min(window.devicePixelRatio || 1, maxPixelRatio(quality));
    renderer.setPixelRatio(this.pixelRatio);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.shadowMap.enabled = shadows && quality === 'high';
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.className = 'scene-canvas';
    renderer.domElement.setAttribute('aria-hidden', 'true');
    container.prepend(renderer.domElement);
    this.renderer = renderer;
    container.__sceneHost = this; // test ve hata ayıklama için

    if (labels) {
      this.labelRenderer = new CSS2DRenderer();
      this.labelRenderer.domElement.className = 'scene-labels';
      this.labelRenderer.domElement.setAttribute('aria-hidden', 'true');
      container.insertBefore(this.labelRenderer.domElement, renderer.domElement.nextSibling);
    }

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(background);
    if (fog) this.scene.fog = new THREE.FogExp2(background, fog);
    this.camera = new THREE.PerspectiveCamera(fov, 1, 0.1, 500);
    this.clock = new THREE.Clock(false);

    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(container);
    this.resize();

    this.io = new IntersectionObserver(([entry]) => {
      this.visible = entry.isIntersecting;
      if (this.visible) this.start();
      else this.stop();
    }, { threshold: 0 });
    this.io.observe(container);

    this.onVisibility = () => (document.hidden ? this.stop() : this.visible && this.start());
    document.addEventListener('visibilitychange', this.onVisibility);

    this.frameTimes = [];
  }

  resize() {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    this.labelRenderer?.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    if (!this.running) this.render();
  }

  onFrame(fn) {
    this.handlers.push(fn);
  }

  start() {
    if (this.running || this.disposed) return;
    this.running = true;
    this.clock.start();
    this.renderer.setAnimationLoop(() => this.tick());
  }

  stop() {
    if (!this.running) return;
    this.running = false;
    this.renderer.setAnimationLoop(null);
    this.clock.stop();
  }

  render() {
    this.renderer.render(this.scene, this.camera);
    this.labelRenderer?.render(this.scene, this.camera);
  }

  tick() {
    const dt = Math.min(this.clock.getDelta(), 0.1);
    this.elapsed += dt;
    for (const fn of this.handlers) fn(dt, this.elapsed);
    this.render();
    this.adapt(dt);
  }

  /** Kare süresi uzunsa piksel oranını düşürerek akıcılığı korur */
  adapt(dt) {
    this.frameTimes.push(dt);
    if (this.frameTimes.length < 90) return;
    const avg = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
    this.frameTimes.length = 0;
    if (avg > 1 / 38 && this.pixelRatio > 0.8) {
      this.pixelRatio = Math.max(0.8, this.pixelRatio - 0.2);
      this.renderer.setPixelRatio(this.pixelRatio);
      this.resize();
    }
  }

  dispose() {
    if (this.disposed) return;
    this.stop();
    this.disposed = true;
    this.ro.disconnect();
    this.io.disconnect();
    document.removeEventListener('visibilitychange', this.onVisibility);
    this.scene.traverse((obj) => {
      obj.geometry?.dispose();
      const mats = Array.isArray(obj.material) ? obj.material : obj.material ? [obj.material] : [];
      for (const m of mats) {
        for (const v of Object.values(m)) if (v?.isTexture) v.dispose();
        m.dispose();
      }
    });
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    this.renderer.domElement.remove();
    this.labelRenderer?.domElement.remove();
  }
}

/** Sahnelerde ortak ışık kurulumu */
export function addLights(host, { shadows = false, sun = [-30, 42, 22], intensity = 2.4, extent = 26 } = {}) {
  const hemi = new THREE.HemisphereLight('#c9dde3', '#1c2a22', 0.85);
  const dir = new THREE.DirectionalLight('#ffe9cc', intensity);
  dir.position.set(...sun);
  if (shadows && host.renderer.shadowMap.enabled) {
    dir.castShadow = true;
    dir.shadow.mapSize.set(2048, 2048);
    dir.shadow.radius = 2;
    const c = dir.shadow.camera;
    c.left = c.bottom = -extent;
    c.right = c.top = extent;
    c.near = 1;
    c.far = 140;
    dir.shadow.bias = -0.0006;
    dir.shadow.normalBias = 0.03;
  }
  host.scene.add(hemi, dir);
  return { hemi, dir };
}
