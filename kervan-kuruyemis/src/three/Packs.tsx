"use client";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { packAtlasTexture } from "./textures";

export type PackItem = {
  p: [number, number, number];
  s: [number, number, number];
  ry?: number;
  design: number; // 0..15 atlas cell
  tint?: string;
};

/**
 * Renders many packaged products in ONE draw call: an InstancedMesh of boxes (or cylinders)
 * whose label is picked from a 4×4 canvas atlas via a per-instance UV offset attribute.
 */
export function PackInstances({
  items, shape = "box", roughness = 0.55, metalness = 0.0,
}: { items: PackItem[]; shape?: "box" | "cyl"; roughness?: number; metalness?: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const geometry = useMemo(() => {
    const g = shape === "box" ? new THREE.BoxGeometry(1, 1, 1) : new THREE.CylinderGeometry(0.5, 0.5, 1, 20, 1);
    const offs = new Float32Array(items.length * 2);
    items.forEach((it, i) => {
      offs[i * 2] = (it.design % 4) * 0.25;
      offs[i * 2 + 1] = 0.75 - Math.floor(it.design / 4) * 0.25;
    });
    g.setAttribute("aUvOffset", new THREE.InstancedBufferAttribute(offs, 2));
    return g;
  }, [items, shape]);

  const material = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({ map: packAtlasTexture(), roughness, metalness });
    m.onBeforeCompile = (shader) => {
      shader.vertexShader = shader.vertexShader
        .replace("#include <common>", "#include <common>\nattribute vec2 aUvOffset;")
        .replace("#include <uv_vertex>", "#include <uv_vertex>\n#ifdef USE_MAP\nvMapUv = vMapUv * 0.25 + aUvOffset;\n#endif");
    };
    m.customProgramCacheKey = () => "packAtlas";
    return m;
  }, [roughness, metalness]);

  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    const o = new THREE.Object3D();
    const c = new THREE.Color();
    items.forEach((it, i) => {
      o.position.set(...it.p);
      o.rotation.set(0, it.ry ?? 0, 0);
      o.scale.set(...it.s);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
      c.set(it.tint ?? "#ffffff");
      m.setColorAt(i, c);
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
    m.computeBoundingSphere();
  }, [items]);

  return <instancedMesh ref={ref} args={[geometry, material, items.length]} />;
}

/** Fill a shelf run with packs of varied size. */
export function fillShelf(
  out: PackItem[],
  opts: {
    x: number; y: number; z0: number; z1: number; depth: number;
    face: 1 | -1; // +1: faces +x, -1: faces -x
    designs: number[]; h: [number, number]; w: [number, number];
    rnd: () => number; gap?: number; rows?: number;
  },
) {
  const { x, y, z0, z1, depth, face, designs, h, w, rnd, gap = 0.012, rows = 1 } = opts;
  for (let r = 0; r < rows; r++) {
    let z = z0;
    const design = designs[Math.floor(rnd() * designs.length)];
    let runLeft = 3 + Math.floor(rnd() * 5);
    let d = design;
    while (z > z1) {
      if (runLeft-- <= 0) {
        d = designs[Math.floor(rnd() * designs.length)];
        runLeft = 3 + Math.floor(rnd() * 5);
      }
      const ww = w[0] + rnd() * (w[1] - w[0]);
      const hh = h[0] + rnd() * (h[1] - h[0]);
      if (z - ww < z1) break;
      const dd = depth * (0.75 + rnd() * 0.2);
      out.push({
        p: [x - face * (r * depth * 0.9), y + hh / 2, z - ww / 2],
        s: [dd, hh, ww],
        ry: (face === 1 ? 0 : Math.PI) + (rnd() - 0.5) * 0.06,
        design: d,
      });
      z -= ww + gap;
    }
  }
}

/** Atlas cell groups (see PACK in textures.ts). */
export const PACK_DESIGNS = {
  outdoorLeft: [6, 15, 7, 12, 8, 6, 15],
  outdoorRight: [8, 14, 6, 15, 12],
  coffee: [0, 1, 2],
  tea: [3, 4, 5],
  nutBags: [6, 7, 15, 12],
  boxes: [9, 10, 11, 14, 8],
  mixedRetail: [0, 1, 2, 3, 4, 5, 6, 7, 8, 12, 15],
};
