"use client";
import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Environment, Hud, Lightformer, PerspectiveCamera, Sparkles } from "@react-three/drei";
import gsap from "gsap";
import * as THREE from "three";
import type { ModelKind } from "@/lib/products";
import type { Quality } from "@/lib/store";
import { KIND_SCALE, MIXED_KINDS, nutGeometry, nutMaterial, type SimpleKind } from "./nuts";
import { mulberry32 } from "./noise";

/** Mutable rotation/zoom state driven by pointer drag (works for mouse & touch). */
export type DragState = { rx: number; ry: number; vx: number; vy: number; zoom: number; dragging: boolean; idle: number };
export const newDrag = (zoom = 1.7): DragState => ({ rx: 0.25, ry: 0, vx: 0, vy: 0, zoom, dragging: false, idle: 0 });

export function useDragRotate(el: HTMLElement | null, state: DragState, enabled: boolean, zoomRange: [number, number] = [0.95, 2.6]) {
  useEffect(() => {
    if (!el || !enabled) return;
    const pts = new Map<number, { x: number; y: number }>();
    let pinch = 0;
    const down = (e: PointerEvent) => {
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      state.dragging = true;
      state.idle = 0;
    };
    const move = (e: PointerEvent) => {
      const p = pts.get(e.pointerId);
      if (!p) return;
      const dx = e.clientX - p.x, dy = e.clientY - p.y;
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pts.size === 1) {
        state.vy = dx * 0.006;
        state.vx = dy * 0.006;
        state.ry += state.vy;
        state.rx = Math.max(-1.2, Math.min(1.2, state.rx + state.vx));
      } else if (pts.size === 2) {
        const [a, b] = [...pts.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinch) state.zoom = Math.max(zoomRange[0], Math.min(zoomRange[1], state.zoom * (pinch / d)));
        pinch = d;
      }
    };
    const up = (e: PointerEvent) => {
      pts.delete(e.pointerId);
      if (pts.size < 2) pinch = 0;
      if (pts.size === 0) state.dragging = false;
    };
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      state.zoom = Math.max(zoomRange[0], Math.min(zoomRange[1], state.zoom + e.deltaY * 0.0015));
    };
    el.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    el.addEventListener("wheel", wheel, { passive: false });
    const prevTA = el.style.touchAction;
    el.style.touchAction = "none";
    return () => {
      el.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      el.removeEventListener("wheel", wheel);
      el.style.touchAction = prevTA;
    };
  }, [el, state, enabled, zoomRange]);
}

const displayScale = (k: SimpleKind) => {
  const rel = KIND_SCALE[k] / KIND_SCALE.apricot;
  return 0.115 / Math.pow(rel, 0.75);
};

type Piece = { kind: SimpleKind; seed: number; spread: THREE.Vector3; rot: THREE.Euler; spin: THREE.Vector3; phase: number; scale: number };

/**
 * "Product explosion": a packed cluster of hi-detail kernels that blooms apart and floats,
 * slowly tumbling. The hero piece stays in the centre for the macro shot.
 */
export function ShowcaseCluster({
  kind, quality, drag, reduced = false, count, spread = 1,
}: { kind: ModelKind; quality: Quality; drag: DragState; reduced?: boolean; count?: number; spread?: number }) {
  const group = useRef<THREE.Group>(null);
  const meshes = useRef<(THREE.Mesh | null)[]>([]);
  const explode = useRef({ v: reduced ? 1 : 0 });
  const n = count ?? (quality === "low" ? 12 : quality === "medium" ? 18 : 24);

  const pieces = useMemo<Piece[]>(() => {
    const rnd = mulberry32(kind.length * 97 + 3);
    const kinds: SimpleKind[] = kind === "mixed" ? MIXED_KINDS : [kind];
    const out: Piece[] = [];
    for (let i = 0; i < n; i++) {
      const k = kinds[i % kinds.length];
      let spread: THREE.Vector3;
      if (i === 0) spread = new THREE.Vector3(0, 0, 0);
      else {
        // fibonacci sphere shell with jitter
        const t = (i + 0.5) / n;
        const inc = Math.acos(1 - 2 * t);
        const az = Math.PI * (1 + Math.sqrt(5)) * i;
        const r = 0.55 + rnd() * 0.45;
        spread = new THREE.Vector3(Math.sin(inc) * Math.cos(az) * 1.3, Math.cos(inc) * 0.75, Math.sin(inc) * Math.sin(az) * 0.55).multiplyScalar(r);
      }
      out.push({
        kind: k,
        seed: (i % 4) + 1,
        spread,
        rot: new THREE.Euler(rnd() * 6.28, rnd() * 6.28, rnd() * 6.28),
        spin: new THREE.Vector3((rnd() - 0.5) * 0.5, (rnd() - 0.5) * 0.6, (rnd() - 0.5) * 0.4),
        phase: rnd() * 6.28,
        scale: (i === 0 ? 1.7 : 0.75 + rnd() * 0.4) * displayScale(k),
      });
    }
    return out;
  }, [kind, n]);

  const detail = quality === "low" ? "mid" : "high";
  const geos = useMemo(() => pieces.map((p) => nutGeometry(p.kind, detail, p.seed, true)), [pieces, detail]);
  const mats = useMemo(() => pieces.map((p) => nutMaterial(p.kind, quality === "low" ? "medium" : quality)), [pieces, quality]);

  useEffect(() => {
    explode.current.v = reduced ? 1 : 0;
    if (reduced) return;
    const tw = gsap.to(explode.current, { v: 1, duration: 1.8, ease: "expo.out", delay: 0.25 });
    return () => {
      tw.kill();
    };
  }, [kind, reduced]);

  useFrame((st, dt) => {
    const t = st.clock.elapsedTime;
    const e = explode.current.v;
    pieces.forEach((p, i) => {
      const m = meshes.current[i];
      if (!m) return;
      const bob = reduced ? 0 : Math.sin(t * 0.7 + p.phase) * 0.035;
      const f = (0.12 + 0.88 * e) * spread;
      m.position.set(p.spread.x * f, p.spread.y * f + bob, p.spread.z * f);
      if (!reduced) {
        m.rotation.x = p.rot.x + t * p.spin.x * (i === 0 ? 0.3 : 1);
        m.rotation.y = p.rot.y + t * p.spin.y * (i === 0 ? 0.3 : 1);
        m.rotation.z = p.rot.z + t * p.spin.z * (i === 0 ? 0.3 : 1);
      }
      const s = p.scale * (0.6 + 0.4 * Math.min(1, e * 1.4));
      m.scale.setScalar(s);
    });
    const g = group.current;
    if (g) {
      if (!drag.dragging) {
        drag.idle += dt;
        drag.vy *= 0.94;
        drag.vx *= 0.94;
        drag.ry += drag.vy + (drag.idle > 1.2 && !reduced ? dt * 0.18 : 0);
        drag.rx = Math.max(-1.2, Math.min(1.2, drag.rx + drag.vx));
      }
      g.rotation.y += (drag.ry - g.rotation.y) * Math.min(1, dt * 10);
      g.rotation.x += (drag.rx - g.rotation.x) * Math.min(1, dt * 10);
    }
  });

  return (
    <group ref={group}>
      {pieces.map((p, i) => (
        <mesh
          key={i}
          ref={(m) => {
            meshes.current[i] = m;
          }}
          geometry={geos[i]}
          material={mats[i]}
          castShadow={false}
        />
      ))}
    </group>
  );
}

export function StudioLights({ envRes = 128 }: { envRes?: number }) {
  return (
    <>
      <ambientLight intensity={0.25} color="#ffe9d2" />
      <spotLight position={[2.2, 3.0, 2.6]} angle={0.5} penumbra={0.9} intensity={60} color="#ffe2bf" />
      <directionalLight position={[-3, 1.5, -2.5]} intensity={2.2} color="#b9d4ff" />
      <pointLight position={[0, -2, 1.5]} intensity={3} color="#e9a044" />
      <Environment resolution={envRes} frames={1}>
        <Lightformer form="rect" intensity={2.4} color="#fff3e0" position={[3, 3, 3]} scale={[4, 2, 1]} />
        <Lightformer form="rect" intensity={1.2} color="#ffd8a8" position={[-4, 1, 2]} scale={[2, 4, 1]} />
        <Lightformer form="ring" intensity={1.5} color="#cfe0ff" position={[0, 2, -4]} scale={2} />
      </Environment>
    </>
  );
}

const backdropFrag = /* glsl */ `
uniform float uFade; varying vec2 vUv;
void main(){
  float d = distance(vUv, vec2(0.5, 0.52));
  vec3 c = mix(vec3(0.16, 0.085, 0.05), vec3(0.012, 0.01, 0.012), smoothstep(0.0, 0.42, d));
  gl_FragColor = vec4(c, uFade * mix(0.86, 0.97, smoothstep(0.1, 0.45, d)));
}`;
const backdropVert = /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`;

/** Overlay stage rendered on top of the store (camera dolly-in + darkened background). */
export function ProductStageHud({ kind, quality, reduced, renderPriority }: { kind: ModelKind; quality: Quality; reduced: boolean; renderPriority: number }) {
  const gl = useThree((s) => s.gl);
  const size = useThree((s) => s.size);
  const offset: [number, number, number] = size.width >= 1024 ? [-0.42, 0, 0] : [0, 0.3, 0];
  const drag = useMemo(() => newDrag(2.6), []);
  const uniforms = useMemo(() => ({ uFade: { value: 0 } }), []);
  const backdrop = useRef<THREE.ShaderMaterial>(null);
  const cam = useRef<THREE.PerspectiveCamera>(null);
  useDragRotate(gl.domElement, drag, true, [1.05, 2.8]);
  useEffect(() => {
    drag.zoom = 2.6;
    drag.ry = 0;
    drag.rx = 0.25;
    uniforms.uFade.value = reduced ? 1 : 0;
    if (reduced) {
      drag.zoom = 1.95;
      return;
    }
    const tl = gsap.timeline({ delay: 0.5 });
    tl.to(uniforms.uFade, { value: 1, duration: 1.0, ease: "power2.out" });
    tl.to(drag, { zoom: 1.95, duration: 2.2, ease: "power3.inOut" }, 0.4); // macro dolly
    return () => {
      tl.kill();
    };
  }, [kind, drag, uniforms, reduced]);
  useFrame((_, dt) => {
    if (cam.current) cam.current.position.z += (drag.zoom - cam.current.position.z) * Math.min(1, dt * 6);
    // R3F may copy the uniforms object → write through the material ref
    if (backdrop.current) backdrop.current.uniforms.uFade.value = uniforms.uFade.value;
  });
  return (
    <Hud renderPriority={renderPriority}>
      <PerspectiveCamera ref={cam} makeDefault position={[0, 0, 2.6]} fov={35} near={0.05} far={20} />
      <mesh position={[0, 0, -4]} renderOrder={-1}>
        <planeGeometry args={[30, 30]} />
        <shaderMaterial ref={backdrop} vertexShader={backdropVert} fragmentShader={backdropFrag} uniforms={uniforms} transparent depthWrite={false} />
      </mesh>
      <StudioLights envRes={quality === "high" ? 128 : 64} />
      <group position={offset}>
        <ShowcaseCluster kind={kind} quality={quality} drag={drag} reduced={reduced} />
      </group>
      {quality !== "low" && !reduced && <Sparkles count={40} scale={[4, 2.5, 2]} size={2} speed={0.2} opacity={0.5} color="#ffcf8a" />}
    </Hud>
  );
}
