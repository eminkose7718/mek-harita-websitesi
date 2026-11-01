"use client";
import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import gsap from "gsap";
import * as THREE from "three";
import { useStore } from "@/lib/store";
import { displayFor, moveWithCollision, nearestWalkable } from "./layout";
import { sceneState } from "./sceneState";

type V3 = [number, number, number];
type Key = { p: V3; t: V3; fov?: number; d: number };

/** Intro: street → sign → storefront → automatic door → aisle → macro on the apricot bin. (~10 s) */
export const INTRO: Key[] = [
  { p: [0, 4.3, 6.6], t: [0, 4.35, 0], fov: 34, d: 0 },
  { p: [0.6, 4.0, 5.6], t: [0, 4.25, 0], d: 2.2 },
  { p: [0.3, 2.4, 6.6], t: [0, 2.2, 0], fov: 42, d: 1.4 },
  { p: [0, 1.7, 4.4], t: [0, 1.5, 0], d: 1.3 },
  { p: [0, 1.62, 1.3], t: [0, 1.45, -3], fov: 50, d: 1.3 },
  { p: [0.05, 1.6, -1.2], t: [0.2, 1.3, -5], d: 1.2 },
  { p: [0.1, 1.55, -3.2], t: [-0.3, 1.0, -8.5], d: 1.5 },
  { p: [0.5, 1.4, -5.35], t: [1.25, 0.95, -4.35], fov: 38, d: 1.4 },
];

/** Cinematic tour (~42 s). */
export const TOUR: Key[] = [
  { p: [-3.5, 2.2, 8.0], t: [0, 2.5, 0], fov: 45, d: 0 },
  { p: [3.2, 1.9, 6.5], t: [0, 2.2, 0], d: 4 },
  { p: [0, 4.1, 4.4], t: [0, 4.3, 0], fov: 40, d: 3.2 },
  { p: [0, 1.65, 3.0], t: [0, 1.5, 0], fov: 50, d: 3 },
  { p: [0, 1.6, 0.3], t: [0, 1.5, -3], d: 2.4 },
  { p: [0.2, 1.6, -1.5], t: [1.4, 1.7, -3.4], d: 2.6 },
  { p: [0.35, 1.35, -3.0], t: [1.3, 0.95, -2.3], d: 3 },
  { p: [0.45, 1.4, -5.2], t: [1.3, 0.95, -6.3], d: 3 },
  { p: [0.2, 1.5, -5.6], t: [-1.2, 0.95, -6.1], d: 3 },
  { p: [0.1, 1.45, -7.6], t: [-1.15, 0.85, -8.9], d: 3 },
  { p: [0.2, 1.6, -9.0], t: [0.2, 1.5, -11], d: 3 },
  { p: [0.3, 1.65, -8.6], t: [0, 1.5, 0], d: 3.2 },
  { p: [0, 1.65, -3.0], t: [0, 1.4, 3], d: 3.2 },
  { p: [1.4, 1.9, 4.6], t: [0, 2.0, 0], d: 4 },
  { p: [0, 2.4, 8.0], t: [0, 2.6, 0], fov: 45, d: 3.4 },
];

export const focusTarget = new THREE.Vector3(1.29, 0.97, -4.25);

/** Keep horizontal framing on portrait screens: widen vertical FOV when aspect < 1.25. */
function fitFov(fov: number, aspect: number) {
  const k = Math.max(1, 1.25 / aspect);
  if (k === 1) return fov;
  const f = (2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(fov) / 2) * Math.pow(k, 0.8)) * 180) / Math.PI;
  return Math.min(f, 88);
}

/** Shared mutable input for on-screen joystick buttons (mobile). */
export const exploreInput = { fwd: 0, strafe: 0 };

const v = (a: V3) => new THREE.Vector3(...a);

function buildPathTimeline(keys: Key[], rig: { pos: THREE.Vector3; tgt: THREE.Vector3; fov: number }, onUpdate?: (p: number) => void) {
  const pc = new THREE.CatmullRomCurve3(keys.map((k) => v(k.p)), false, "centripetal");
  const tc = new THREE.CatmullRomCurve3(keys.map((k) => v(k.t)), false, "centripetal");
  const prog = { p: 0 };
  const n = keys.length - 1;
  const tl = gsap.timeline();
  const total = keys.reduce((s, k) => s + k.d, 0);
  let fov = keys[0].fov ?? 50;
  const apply = () => {
    pc.getPoint(prog.p, rig.pos);
    tc.getPoint(prog.p, rig.tgt);
    onUpdate?.(prog.p);
  };
  for (let i = 1; i <= n; i++) {
    const ease = i === 1 ? "power1.in" : i === n ? "power2.out" : "none";
    tl.to(prog, { p: i / n, duration: keys[i].d, ease, onUpdate: apply });
    if (keys[i].fov !== undefined && keys[i].fov !== fov) {
      tl.to(rig, { fov: keys[i].fov, duration: keys[i].d, ease: "sine.inOut" }, "<");
      fov = keys[i].fov!;
    }
  }
  apply();
  return { tl, total };
}

export function CameraRig() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const gl = useThree((s) => s.gl);
  const mode = useStore((s) => s.mode);
  const productId = useStore((s) => s.productId);
  const prevMode = useStore((s) => s.prevMode);
  const reduced = useStore((s) => s.reducedMotion);
  const skip = useStore((s) => s.introSkipRequested);

  const rig = useRef({ pos: v(INTRO[0].p), tgt: v(INTRO[0].t), fov: INTRO[0].fov ?? 50 });
  const cur = useRef({ pos: v(INTRO[0].p), tgt: v(INTRO[0].t) });
  const saved = useRef<{ pos: THREE.Vector3; tgt: THREE.Vector3; fov: number } | null>(null);
  const ex = useRef({ x: 0, z: -1.2, y: 1.6, yaw: 0, pitch: -0.08, fov: 58, walkTo: null as null | [number, number] });
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const lastMode = useRef(mode);

  // ---- mode transitions -------------------------------------------------
  useEffect(() => {
    const st = useStore.getState();
    const from = lastMode.current;
    lastMode.current = mode;
    tlRef.current?.kill();
    tlRef.current = null;

    if (mode === "loading") {
      sceneState.signPower = 0;
      sceneState.signReveal = 0;
      return;
    }

    if (mode === "intro") {
      sceneState.signPower = 0;
      sceneState.signReveal = 0;
      const { tl } = buildPathTimeline(INTRO, rig.current);
      tl.to(sceneState, { signPower: 1, duration: 1.4, ease: "power2.out" }, 0.5);
      tl.to(sceneState, { signReveal: 1, duration: 2.0, ease: "power1.inOut" }, 0.4);
      tl.eventCallback("onComplete", () => useStore.getState().setMode("menu"));
      cur.current.pos.copy(rig.current.pos);
      cur.current.tgt.copy(rig.current.tgt);
      if (st.reducedMotion) tl.progress(1);
      tlRef.current = tl;
      return;
    }

    sceneState.signPower = 1;
    sceneState.signReveal = 1;

    if (mode === "tour") {
      const { tl } = buildPathTimeline(TOUR, rig.current, (p) => useStore.getState().setTourProgress(p));
      tl.eventCallback("onComplete", () => useStore.getState().setMode("menu"));
      // glide from where we are to the first key
      tl.pause();
      const start = gsap.timeline();
      start.to(rig.current.pos, { x: TOUR[0].p[0], y: TOUR[0].p[1], z: TOUR[0].p[2], duration: 2.2, ease: "power2.inOut" });
      start.to(rig.current.tgt, { x: TOUR[0].t[0], y: TOUR[0].t[1], z: TOUR[0].t[2], duration: 2.2, ease: "power2.inOut" }, 0);
      start.to(rig.current, { fov: TOUR[0].fov ?? 45, duration: 2.2 }, 0);
      start.add(tl.play(), ">");
      tlRef.current = start;
      return;
    }

    if (mode === "explore") {
      if (from === "product") return; // resume where the visitor was standing
      const e = ex.current;
      const dir = new THREE.Vector3().subVectors(cur.current.tgt, cur.current.pos).normalize();
      const [nx, nz] = nearestWalkable(cur.current.pos.x, cur.current.pos.z);
      e.x = nx;
      e.z = nz;
      e.y = cur.current.pos.y;
      e.yaw = Math.atan2(-dir.x, -dir.z);
      e.pitch = Math.max(-0.9, Math.min(0.6, Math.asin(dir.y)));
      e.fov = 58;
      e.walkTo = null;
      return;
    }

    if (mode === "product" && productId) {
      const d = displayFor(productId);
      saved.current = { pos: cur.current.pos.clone(), tgt: cur.current.tgt.clone(), fov: rig.current.fov };
      if (prevMode === "explore") {
        // remember explore pose as the return point
        saved.current = null;
      }
      if (d) {
        const a = v(d.anchor);
        const n = v(d.normal).normalize();
        const p = a.clone().addScaledVector(n, 0.62).add(new THREE.Vector3(0, 0.2, 0));
        p.x = Math.max(-0.55, Math.min(0.75, p.x));
        // pose rig from the current camera, then dolly in
        rig.current.pos.copy(cur.current.pos);
        rig.current.tgt.copy(cur.current.tgt);
        const tl = gsap.timeline();
        tl.to(rig.current.pos, { x: p.x, y: p.y, z: p.z, duration: st.reducedMotion ? 0 : 1.4, ease: "power3.inOut" });
        tl.to(rig.current.tgt, { x: a.x, y: a.y, z: a.z, duration: st.reducedMotion ? 0 : 1.4, ease: "power3.inOut" }, 0);
        tl.to(rig.current, { fov: 40, duration: st.reducedMotion ? 0 : 1.4 }, 0);
        tlRef.current = tl;
        focusTarget.copy(a);
      }
      return;
    }

    if (mode === "menu") {
      if (saved.current) {
        const s = saved.current;
        const tl = gsap.timeline();
        tl.to(rig.current.pos, { x: s.pos.x, y: s.pos.y, z: s.pos.z, duration: st.reducedMotion ? 0 : 1.2, ease: "power2.inOut" });
        tl.to(rig.current.tgt, { x: s.tgt.x, y: s.tgt.y, z: s.tgt.z, duration: st.reducedMotion ? 0 : 1.2, ease: "power2.inOut" }, 0);
        tl.to(rig.current, { fov: s.fov, duration: 1.2 }, 0);
        tlRef.current = tl;
        saved.current = null;
      } else {
        rig.current.pos.copy(cur.current.pos);
        rig.current.tgt.copy(cur.current.tgt);
      }
    }
    return () => {
      tlRef.current?.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, productId]);

  // Skip intro
  useEffect(() => {
    if (skip && mode === "intro" && tlRef.current) {
      tlRef.current.progress(1);
      cur.current.pos.copy(rig.current.pos);
      cur.current.tgt.copy(rig.current.tgt);
    }
  }, [skip, mode]);

  // ---- Free Explore input -----------------------------------------------
  useEffect(() => {
    if (mode !== "explore") return;
    const el = gl.domElement;
    const pointers = new Map<number, { x: number; y: number }>();
    let pinch = 0;
    const down = (e: PointerEvent) => {
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      el.setPointerCapture?.(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      const prev = pointers.get(e.pointerId);
      if (!prev) return;
      const dx = e.clientX - prev.x, dy = e.clientY - prev.y;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const ex_ = ex.current;
      if (pointers.size === 1) {
        const k = (ex_.fov / 60) * (e.pointerType === "touch" ? 0.006 : 0.0045);
        ex_.yaw += dx * k;
        ex_.pitch = Math.max(-1.0, Math.min(0.8, ex_.pitch + dy * k));
        if (Math.abs(dx) + Math.abs(dy) > 2) ex_.walkTo = null;
      } else if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinch) ex_.fov = Math.max(28, Math.min(75, ex_.fov * (pinch / dist)));
        pinch = dist;
      }
    };
    const up = (e: PointerEvent) => {
      pointers.delete(e.pointerId);
      if (pointers.size < 2) pinch = 0;
    };
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      ex.current.fov = Math.max(28, Math.min(75, ex.current.fov + e.deltaY * 0.03));
    };
    const keys = new Set<string>();
    const kd = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT") return;
      const k = e.key.toLowerCase();
      if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(k)) {
        keys.add(k);
        if (k.startsWith("arrow")) e.preventDefault();
        ex.current.walkTo = null;
      }
    };
    const ku = (e: KeyboardEvent) => keys.delete(e.key.toLowerCase());
    el.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    el.addEventListener("wheel", wheel, { passive: false });
    window.addEventListener("keydown", kd);
    window.addEventListener("keyup", ku);
    keyState.current = keys;
    el.style.touchAction = "none";
    el.style.cursor = "grab";
    return () => {
      el.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      el.removeEventListener("wheel", wheel);
      window.removeEventListener("keydown", kd);
      window.removeEventListener("keyup", ku);
      el.style.touchAction = "";
      el.style.cursor = "";
      keyState.current = new Set();
    };
  }, [mode, gl]);
  const keyState = useRef<Set<string>>(new Set());

  // Click-to-walk target (set by the floor catcher in Experience)
  useEffect(() => {
    walkHandler.current = (x: number, z: number) => {
      if (useStore.getState().mode !== "explore") return;
      ex.current.walkTo = nearestWalkable(x, z);
    };
  }, []);

  // ---- per frame ---------------------------------------------------------
  const tmpDir = useRef(new THREE.Vector3());
  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.1);
    const reducedK = reduced ? 30 : 1;
    if (mode === "explore") {
      const e = ex.current;
      const keys = keyState.current;
      let f = exploreInput.fwd, s = exploreInput.strafe;
      if (keys.has("w") || keys.has("arrowup")) f += 1;
      if (keys.has("s") || keys.has("arrowdown")) f -= 1;
      if (keys.has("d")) s += 1;
      if (keys.has("a")) s -= 1;
      if (keys.has("arrowleft")) e.yaw += dt * 1.6;
      if (keys.has("arrowright")) e.yaw -= dt * 1.6;
      const speed = 1.7;
      const fx = -Math.sin(e.yaw), fz = -Math.cos(e.yaw);
      let dx = (fx * f + -fz * s) * speed * dt;
      let dz = (fz * f + fx * s) * speed * dt;
      if (e.walkTo) {
        const wx = e.walkTo[0] - e.x, wz = e.walkTo[1] - e.z;
        const dist = Math.hypot(wx, wz);
        if (dist < 0.04) e.walkTo = null;
        else {
          const st = Math.min(dist, speed * dt * 1.2);
          dx = (wx / dist) * st;
          dz = (wz / dist) * st;
        }
      }
      if (dx || dz) {
        const [nx, nz] = moveWithCollision(e.x, e.z, dx, dz);
        if (e.walkTo && nx === e.x && nz === e.z) e.walkTo = null;
        e.x = nx;
        e.z = nz;
      }
      e.y += (1.62 - e.y) * (1 - Math.exp(-dt * 3));
      const target = new THREE.Vector3(e.x, e.y, e.z);
      const k = 1 - Math.exp(-dt * 14 * reducedK);
      cur.current.pos.lerp(target, k);
      tmpDir.current.set(-Math.sin(e.yaw) * Math.cos(e.pitch), Math.sin(e.pitch), -Math.cos(e.yaw) * Math.cos(e.pitch));
      cur.current.tgt.copy(cur.current.pos).add(tmpDir.current);
      camera.fov += (fitFov(e.fov, camera.aspect) - camera.fov) * (1 - Math.exp(-dt * 8));
    } else {
      const k = 1 - Math.exp(-dt * 4.5 * reducedK);
      cur.current.pos.lerp(rig.current.pos, k);
      cur.current.tgt.lerp(rig.current.tgt, k);
      camera.fov += (fitFov(rig.current.fov, camera.aspect) - camera.fov) * k;
    }
    camera.position.copy(cur.current.pos);
    camera.lookAt(cur.current.tgt);
    camera.updateProjectionMatrix();
    if (mode !== "product") focusTarget.copy(cur.current.tgt);

    // automatic sliding doors open when the camera approaches
    const p = cur.current.pos;
    const near = p.z > -2.4 && p.z < 2.8 && Math.abs(p.x) < 2.6 ? 1 : 0;
    sceneState.doorOpen += (near - sceneState.doorOpen) * (1 - Math.exp(-dt * 2.6));
  });

  return null;
}

export const walkHandler: { current: ((x: number, z: number) => void) | null } = { current: null };
