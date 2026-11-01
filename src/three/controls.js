/** Yörünge kontrolleri: fare/dokunma, klavye, mobilde kaydırmayı engellememe ve yumuşak kamera uçuşu */
import * as THREE from 'three';
import { gsap } from 'gsap';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { isCoarsePointer } from '../lib/quality.js';

export function createOrbit(host, root, { target = [0, 4, 0], minDistance = 5, maxDistance = 80, maxPolar = 1.38, panLimit = 19 } = {}) {
  const { camera, renderer, container } = { ...host, container: host.container };
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = minDistance;
  controls.maxDistance = maxDistance;
  controls.maxPolarAngle = maxPolar;
  controls.target.set(...target);
  controls.screenSpacePanning = false;
  controls.addEventListener('change', () => {
    controls.target.x = THREE.MathUtils.clamp(controls.target.x, -panLimit, panLimit);
    controls.target.z = THREE.MathUtils.clamp(controls.target.z, -panLimit, panLimit);
  });
  host.onFrame(() => controls.update());

  // Klavye: oklar döndürür, Shift+oklar kaydırır, + / − yakınlaştırır
  container.addEventListener('keydown', (e) => {
    const off = camera.position.clone().sub(controls.target);
    const sph = new THREE.Spherical().setFromVector3(off);
    let handled = true;
    const pan = (dx, dz) => {
      const dir = new THREE.Vector3(-off.x, 0, -off.z).normalize();
      const right = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 1, 0));
      const delta = right.multiplyScalar(dx).add(dir.multiplyScalar(dz));
      controls.target.add(delta);
      camera.position.add(delta);
    };
    const step = sph.radius * 0.06;
    switch (e.key) {
      case 'ArrowLeft': e.shiftKey ? pan(-step, 0) : (sph.theta -= 0.12); break;
      case 'ArrowRight': e.shiftKey ? pan(step, 0) : (sph.theta += 0.12); break;
      case 'ArrowUp': e.shiftKey ? pan(0, step) : (sph.phi = Math.max(0.15, sph.phi - 0.08)); break;
      case 'ArrowDown': e.shiftKey ? pan(0, -step) : (sph.phi = Math.min(maxPolar, sph.phi + 0.08)); break;
      case '+': case '=': sph.radius = Math.max(minDistance, sph.radius * 0.85); break;
      case '-': case '_': sph.radius = Math.min(maxDistance, sph.radius * 1.15); break;
      default: handled = false;
    }
    if (!handled) return;
    e.preventDefault();
    if (!e.shiftKey || e.key === '+' || e.key === '-' || e.key === '=') {
      camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(sph));
    }
    controls.update();
  });

  // Dokunmatik cihazlarda 3D etkileşimi açıkça başlatılır; böylece sayfa kaydırması engellenmez
  const gate = root.querySelector('[data-gate]');
  const gateOff = root.querySelector('[data-gate-off]');
  function setGated(on) {
    controls.enabled = !on;
    container.classList.toggle('is-gated', on);
    gate?.toggleAttribute('hidden', !on);
    gateOff?.toggleAttribute('hidden', on);
  }
  if (isCoarsePointer() && gate) {
    setGated(true);
    root.querySelector('[data-gate-on]')?.addEventListener('click', () => setGated(false));
    gateOff?.addEventListener('click', () => setGated(true));
    host.io && new IntersectionObserver(([en]) => !en.isIntersecting && setGated(true)).observe(container);
  }

  function flyTo(pos, tgt, duration = 1.4) {
    gsap.killTweensOf([camera.position, controls.target]);
    const d = host.reduced ? 0 : duration;
    gsap.to(camera.position, { x: pos[0], y: pos[1], z: pos[2], duration: d, ease: 'power2.inOut' });
    gsap.to(controls.target, { x: tgt[0], y: tgt[1], z: tgt[2], duration: d, ease: 'power2.inOut' });
  }

  return { controls, flyTo };
}

/** Tıklama ile sürükleme ayrımı yapan seçim yardımcısı */
export function onCanvasClick(host, handler) {
  const el = host.renderer.domElement;
  let down = null;
  el.addEventListener('pointerdown', (e) => (down = [e.clientX, e.clientY]));
  el.addEventListener('pointerup', (e) => {
    if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 6) return;
    const r = el.getBoundingClientRect();
    const ndc = new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    const ray = new THREE.Raycaster();
    ray.setFromCamera(ndc, host.camera);
    handler(ray);
  });
}
