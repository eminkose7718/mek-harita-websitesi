/** Proje portföyü için basit 3D görüntüleyici: GLB modeller ve GeoJSON parseller */
import * as THREE from 'three';
import { SceneHost, addLights } from '../host.js';
import { createOrbit } from '../controls.js';
import { parseParcels } from '../../data/geo.js';
import { COLORS, extrudeFootprint, lineMaterial } from '../objects.js';

export async function create(container, { quality, model }) {
  const host = new SceneHost(container, { quality, background: '#eef1ec', labels: false, fov: 40 });
  addLights(host, { intensity: 2.2 });
  const root = new THREE.Group();
  host.scene.add(root);

  if (model.type === 'glb') {
    const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
    const gltf = await new GLTFLoader().loadAsync(model.url);
    root.add(gltf.scene);
  } else if (model.type === 'geojson') {
    for (const p of parseParcels(model.data, model.crs)) {
      const corners = p.ring.map(([e, n]) => ({ e, n }));
      const geo = extrudeFootprint(corners, 0, p.main ? 0.25 : 0.08);
      root.add(new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: p.main ? COLORS.greenLight : 0xc9d0c8, roughness: 0.8 })));
      root.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo), lineMaterial(COLORS.green, 0.9)));
    }
  } else {
    throw new Error(`Desteklenmeyen model türü: ${model.type}`);
  }

  // Modeli çerçevele
  const box = new THREE.Box3().setFromObject(root);
  const size = box.getSize(new THREE.Vector3()).length() || 1;
  const center = box.getCenter(new THREE.Vector3());
  const { controls } = createOrbit(host, container.parentElement, { target: center.toArray(), minDistance: size * 0.3, maxDistance: size * 3, panLimit: size });
  host.camera.near = size / 200;
  host.camera.far = size * 20;
  host.camera.position.copy(center).add(new THREE.Vector3(size * 0.6, size * 0.7, size * 0.8));
  host.camera.updateProjectionMatrix();
  controls.update();
  host.start();
  return { dispose: () => host.dispose() };
}
