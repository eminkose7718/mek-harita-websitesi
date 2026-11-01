"use client";
import { useMemo, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";
import * as THREE from "three";
import type { ModelKind } from "@/lib/products";
import { useStore } from "@/lib/store";
import { newDrag, ShowcaseCluster, StudioLights, useDragRotate, type DragState } from "./Showcase";

/** Standalone canvas for the "3D Vitrin" page section (mounted only while in view). */
export default function ShowcaseCanvas({ kind }: { kind: ModelKind }) {
  const quality = useStore((s) => s.quality);
  const reduced = useStore((s) => s.reducedMotion);
  const drag = useMemo(() => newDrag(2.4), []);
  const [el, setEl] = useState<HTMLCanvasElement | null>(null);
  useDragRotate(el, drag, true, [1.3, 3.2]);
  return (
    <Canvas
      dpr={quality === "high" ? [1, 2] : [1, 1.5]}
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      camera={{ position: [0, 0.05, 2.4], fov: 35 }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        setEl(gl.domElement);
      }}
    >
      <CameraZoom drag={drag} />
      <StudioLights envRes={quality === "low" ? 64 : 128} />
      <ShowcaseCluster kind={kind} quality={quality === "low" ? "medium" : quality} drag={drag} reduced={reduced} count={quality === "low" ? 12 : 18} />
      {!reduced && <Sparkles count={30} scale={[4, 2.5, 2]} size={2} speed={0.2} opacity={0.4} color="#ffcf8a" />}
    </Canvas>
  );
}

function CameraZoom({ drag }: { drag: DragState }) {
  useFrame(({ camera }, dt) => {
    camera.position.z += (drag.zoom - camera.position.z) * Math.min(1, dt * 6);
  });
  return null;
}
