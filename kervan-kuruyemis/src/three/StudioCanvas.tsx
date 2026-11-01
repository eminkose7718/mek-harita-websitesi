"use client";
import { useEffect, useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { productById } from "@/lib/products";
import { newDrag, ShowcaseCluster, StudioLights } from "./Showcase";
import { PackInstances, PACK_DESIGNS, type PackItem } from "./Packs";

const PACKS: Record<string, number[]> = {
  "turk-kahvesi": PACK_DESIGNS.coffee,
  "meyve-cayi": PACK_DESIGNS.tea,
  lokum: [9, 10, 11],
  "dubai-cikolatasi": [8, 8, 8],
};

function PackStack({ designs }: { designs: number[] }) {
  const items = useMemo<PackItem[]>(
    () => [
      { p: [-0.42, -0.05, 0], s: [0.5, 0.72, 0.22], ry: 0.35, design: designs[0] },
      { p: [0.05, 0.02, 0.18], s: [0.5, 0.82, 0.22], ry: -0.1, design: designs[1 % designs.length] },
      { p: [0.5, -0.08, -0.05], s: [0.5, 0.66, 0.22], ry: -0.4, design: designs[2 % designs.length] },
    ],
    [designs],
  );
  return <PackInstances items={items} roughness={0.45} />;
}

export default function StudioCanvas() {
  const [id, setId] = useState<string | null>(null);
  useEffect(() => setId(new URLSearchParams(window.location.search).get("p")), []);
  const drag = useMemo(() => ({ ...newDrag(1.7), rx: 0.35, ry: 0.6, dragging: true }), []);
  const p = productById(id);
  if (!p) return null;
  return (
    <Canvas
      dpr={1}
      gl={{ alpha: true, antialias: true, preserveDrawingBuffer: true }}
      camera={{ position: [0, 0.05, p.model ? 1.55 : 2.6], fov: 35 }}
      onCreated={({ gl }) => {
        gl.setClearColor(new THREE.Color(0, 0, 0), 0);
        gl.toneMapping = THREE.ACESFilmicToneMapping;
      }}
    >
      <StudioLights envRes={128} />
      {p.model ? <ShowcaseCluster kind={p.model} quality="high" drag={drag} reduced count={11} spread={0.5} /> : <PackStack designs={PACKS[p.id] ?? [14, 14, 14]} />}
    </Canvas>
  );
}
