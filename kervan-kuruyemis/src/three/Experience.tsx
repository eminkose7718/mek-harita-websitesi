"use client";
import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { AdaptiveDpr, Environment, Html, Lightformer, PerformanceMonitor } from "@react-three/drei";
import { Bloom, DepthOfField, EffectComposer, ToneMapping, Vignette } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import * as THREE from "three";
import { RectAreaLightUniformsLib } from "three/examples/jsm/lights/RectAreaLightUniformsLib.js";
import { productById } from "@/lib/products";
import { useStore, type Quality } from "@/lib/store";
import { CameraRig, focusTarget, walkHandler } from "./CameraRig";
import { Facade } from "./Facade";
import { Interior } from "./Interior";
import { DISPLAYS, type Display } from "./layout";
import { ProductStageHud } from "./Showcase";
import { Street } from "./Street";

const DPR: Record<Quality, [number, number]> = { low: [0.75, 1.25], medium: [1, 1.5], high: [1, 2] };

function SceneEnvironment({ quality }: { quality: Quality }) {
  // Procedural environment (no HDR download): warm shop light + cool night sky for glass reflections.
  return (
    <Environment resolution={quality === "high" ? 256 : 128} frames={1}>
      <color attach="background" args={["#0b0d14"]} />
      <Lightformer form="rect" intensity={2.2} color="#fff1dc" position={[0, 2, -6]} scale={[4, 3, 1]} />
      <Lightformer form="rect" intensity={1.0} color="#9fb6ff" position={[0, 8, 6]} scale={[10, 4, 1]} />
      <Lightformer form="rect" intensity={1.6} color="#ff6a4a" position={[0, 4.4, 3]} scale={[4, 1.4, 1]} />
      <Lightformer form="ring" intensity={2} color="#ffc98a" position={[-5, 5, 4]} scale={1.2} />
    </Environment>
  );
}

function FloorCatcher() {
  const onClick = (e: ThreeEvent<MouseEvent>) => {
    if (useStore.getState().mode !== "explore" || e.delta > 6) return;
    walkHandler.current?.(e.point.x, e.point.z);
  };
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.005, -5.5]} onClick={onClick}>
        <planeGeometry args={[3.8, 11]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.005, 5]} onClick={onClick}>
        <planeGeometry args={[12, 10]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}

function Hotspot({ d }: { d: Display }) {
  const ref = useRef<HTMLButtonElement>(null);
  const camera = useThree((s) => s.camera);
  const open = useStore((s) => s.openProduct);
  const p = productById(d.productId);
  const pos = useMemo(() => new THREE.Vector3(d.anchor[0], d.anchor[1] + 0.16, d.anchor[2]), [d]);
  useFrame(() => {
    const el = ref.current;
    if (!el) return;
    const dist = camera.position.distanceTo(pos);
    const o = dist > 6.5 ? 0 : dist > 4.5 ? (6.5 - dist) / 2 : 1;
    el.style.opacity = String(o);
    el.style.pointerEvents = o > 0.3 ? "auto" : "none";
  });
  if (!p) return null;
  return (
    <Html position={pos} center zIndexRange={[20, 0]}>
      <button
        ref={ref}
        className="hotspot"
        onClick={(e) => {
          e.stopPropagation();
          open(d.productId);
        }}
        aria-label={`${p.name} — 3D incele`}
      >
        <span className="hotspot-dot" />
        <span className="hotspot-label">{p.name}</span>
      </button>
    </Html>
  );
}

function Hotspots() {
  const mode = useStore((s) => s.mode);
  if (mode !== "explore" && mode !== "menu") return null;
  return (
    <>
      {DISPLAYS.map((d) => (
        <Hotspot key={d.productId} d={d} />
      ))}
    </>
  );
}

function Effects({ quality, mode }: { quality: Quality; mode: string }) {
  const dof = quality === "high" && mode === "product";
  return (
    <EffectComposer multisampling={quality === "high" ? 4 : 0} enableNormalPass={false}>
      <Bloom mipmapBlur luminanceThreshold={0.95} luminanceSmoothing={0.2} intensity={quality === "high" ? 1.0 : 0.8} radius={0.75} />
      {dof ? <DepthOfField target={focusTarget} focalLength={0.03} bokehScale={6} height={480} /> : <></>}
      <Vignette offset={0.28} darkness={0.62} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  );
}

function Scene() {
  const quality = useStore((s) => s.quality);
  const mode = useStore((s) => s.mode);
  const productId = useStore((s) => s.productId);
  const reduced = useStore((s) => s.reducedMotion);
  const setQuality = useStore((s) => s.setQuality);
  const kind = productById(productId)?.model ?? null;
  const post = quality !== "low";
  return (
    <>
      <color attach="background" args={["#05060a"]} />
      <fog attach="fog" args={["#0d0b10", 16, 70]} />
      <PerformanceMonitor
        flipflops={2}
        onDecline={() => {
          // an explicit ?q= parameter locks the quality tier (useful for testing / kiosks)
          if (new URLSearchParams(window.location.search).has("q")) return;
          const q = useStore.getState().quality;
          if (q === "high") setQuality("medium");
          else if (q === "medium") setQuality("low");
        }}
      />
      <AdaptiveDpr pixelated={false} />
      <Suspense fallback={null}>
        <SceneEnvironment quality={quality} />
        <hemisphereLight args={["#9fb0d8", "#2a1e18", 0.35]} />
        <directionalLight position={[-6, 12, 10]} intensity={0.35} color="#9fb4ff" />
        <Street quality={quality} />
        <Facade quality={quality} />
        <Interior quality={quality} />
        <FloorCatcher />
        <Hotspots />
      </Suspense>
      <CameraRig />
      {mode === "product" && kind && (
        <ProductStageHud kind={kind} quality={quality} reduced={reduced} renderPriority={post ? 2 : 1} />
      )}
      {post && <Effects quality={quality} mode={mode} />}
    </>
  );
}

export default function Experience() {
  const quality = useStore((s) => s.quality);
  const heroVisible = useStore((s) => s.heroVisible);
  const setMode = useStore((s) => s.setMode);
  useEffect(() => {
    RectAreaLightUniformsLib.init();
  }, []);
  return (
    <Canvas
      className="!absolute inset-0"
      dpr={DPR[quality]}
      frameloop={heroVisible ? "always" : "never"}
      gl={{ antialias: quality === "low", powerPreference: "high-performance", stencil: false, alpha: false }}
      camera={{ position: [0, 4.3, 6.6], fov: 34, near: 0.03, far: 200 }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.0;
        gl.outputColorSpace = THREE.SRGBColorSpace;
        // Start the intro once the first frame is ready
        requestAnimationFrame(() => setMode("intro"));
      }}
    >
      <Scene />
    </Canvas>
  );
}
