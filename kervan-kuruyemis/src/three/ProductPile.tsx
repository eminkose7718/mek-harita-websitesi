"use client";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { ModelKind } from "@/lib/products";
import type { Quality } from "@/lib/store";
import { FLAT_KINDS, KIND_PALETTE, KIND_SCALE, MIXED_KINDS, nutGeometry, nutMaterial, type SimpleKind } from "./nuts";
import { sackTexture } from "./textures";
import { mulberry32 } from "./noise";

const CAP: Record<Quality, number> = { low: 110, medium: 240, high: 420 };

type Props = {
  kind: ModelKind;
  width: number; // local X
  length: number; // local Z
  quality: Quality;
  seed?: number;
  /** mound height at the centre (m) */
  mound?: number;
};

/** A heap of instanced, individually-rotated products sitting on a local XZ plane (y = 0). */
export function ProductPile({ kind, width, length, quality, seed = 1, mound = 0.04 }: Props) {
  const kinds: SimpleKind[] = kind === "mixed" ? MIXED_KINDS : [kind];
  const bedTex = useMemo(() => {
    const palette = kind === "mixed" ? ["#6a4a2a", "#e9d6a8", "#8a5428", "#a6683c", "#d9c29a", "#c29a62"] : KIND_PALETTE[kind];
    const base = sackTexture(palette, seed, false).clone();
    // scale the painted texture so its kernels match the real product size
    const d = (kind === "mixed" ? 0.022 : KIND_SCALE[kind] * 2) * 1.15;
    base.wrapS = base.wrapT = THREE.RepeatWrapping;
    base.repeat.set(Math.max(0.6, width / d / 10.5), Math.max(0.6, length / d / 21));
    base.needsUpdate = true;
    return base;
  }, [kind, seed, width, length]);
  return (
    <group>
      {/* painted bed under the instances: reads as a full heap from any distance */}
      <mesh rotation-x={-Math.PI / 2} position-y={mound * 0.3} receiveShadow>
        <planeGeometry args={[width * 0.98, length * 0.98, 8, 8]} />
        <meshStandardMaterial map={bedTex} roughness={0.7} />
      </mesh>
      {kinds.map((k, i) => (
        <PileInstances
          key={k}
          kind={k}
          width={width}
          length={length}
          quality={quality}
          seed={seed * 31 + i * 7}
          share={1 / kinds.length}
          mound={mound}
        />
      ))}
    </group>
  );
}

function PileInstances({
  kind, width, length, quality, seed, share, mound,
}: { kind: SimpleKind; width: number; length: number; quality: Quality; seed: number; share: number; mound: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const size = KIND_SCALE[kind] * 2;
  const wanted = Math.round(((width * length) / (size * size * 0.85)) * 1.6 * share);
  const cap = Math.round(CAP[quality] * share * (share < 1 ? 1.6 : 1));
  const count = Math.max(8, Math.min(wanted, cap));
  const boost = wanted > cap ? Math.min(1.45, Math.sqrt(wanted / cap)) : 1;

  const geometry = useMemo(() => nutGeometry(kind, quality === "low" ? "low" : "mid", seed % 5), [kind, quality, seed]);
  const material = useMemo(() => nutMaterial(kind, quality), [kind, quality]);

  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    const rnd = mulberry32(seed);
    const o = new THREE.Object3D();
    const col = new THREE.Color();
    const flat = FLAT_KINDS.has(kind);
    for (let i = 0; i < count; i++) {
      const x = (rnd() - 0.5) * (width - size * boost);
      const z = (rnd() - 0.5) * (length - size * boost);
      const nx = (x / width) * 2, nz = (z / length) * 2;
      const dome = Math.max(0, 1 - (nx * nx * 0.7 + nz * nz * 0.7));
      const y = mound * dome + rnd() * size * 0.5 * boost;
      o.position.set(x, y, z);
      if (flat) o.rotation.set((rnd() - 0.5) * 0.6, rnd() * Math.PI * 2, (rnd() - 0.5) * 0.6);
      else o.rotation.set(rnd() * Math.PI * 2, rnd() * Math.PI * 2, rnd() * Math.PI * 2);
      const sc = boost * (0.85 + rnd() * 0.3);
      o.scale.set(sc, sc * (0.9 + rnd() * 0.2), sc);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
      const v = 0.82 + rnd() * 0.3;
      col.setRGB(v, v * (0.97 + rnd() * 0.05), v * (0.95 + rnd() * 0.08));
      m.setColorAt(i, col);
    }
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
    m.computeBoundingSphere();
  }, [count, kind, width, length, size, boost, seed, mound]);

  return <instancedMesh ref={ref} args={[geometry, material, count]} castShadow={false} receiveShadow />;
}
