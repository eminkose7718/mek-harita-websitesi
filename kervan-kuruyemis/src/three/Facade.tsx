"use client";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { Quality } from "@/lib/store";
import { DIM } from "./layout";
import { sceneState } from "./sceneState";
import {
  awningTexture, blindsTexture, doorStickerTexture, plasterTexture, signTextures, verticalSignTexture,
} from "./textures";
import { PackInstances, type PackItem, PACK_DESIGNS } from "./Packs";
import { mulberry32 } from "./noise";

const ALU = "#b9bcbf";

const ledVertex = /* glsl */ `
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`;
const ledFragment = /* glsl */ `
uniform sampler2D uLeds; uniform float uReveal; uniform float uPower; uniform float uTime;
varying vec2 vUv;
void main(){
  vec4 t = texture2D(uLeds, vUv);
  float edge = uReveal * 1.2 - 0.1;
  float on = 1.0 - smoothstep(edge - 0.08, edge, vUv.x);
  float tw = 0.92 + 0.08 * sin(uTime * 2.4 + vUv.x * 30.0);
  vec3 red = mix(vec3(1.0, 0.1, 0.08), vec3(1.0, 0.62, 0.55), smoothstep(0.55, 0.95, t.r)) * t.r * 3.4;
  vec3 pink = mix(vec3(1.0, 0.25, 0.3), vec3(1.0, 0.8, 0.82), smoothstep(0.55, 0.95, t.b)) * t.b * 3.0;
  vec3 letters = vec3(1.0, 0.94, 0.9) * t.g * 0.35;
  vec3 col = ((red + pink) * tw + letters) * on * uPower;
  gl_FragColor = vec4(col, 1.0);
}`;

function Sign() {
  const tex = useMemo(() => signTextures(), []);
  const ledMat = useRef<THREE.ShaderMaterial>(null);
  const baseMat = useRef<THREE.MeshStandardMaterial>(null);
  const light = useRef<THREE.PointLight>(null);
  const uniforms = useMemo(
    () => ({ uLeds: { value: tex.leds }, uReveal: { value: 0 }, uPower: { value: 0 }, uTime: { value: 0 } }),
    [tex],
  );
  useFrame((st) => {
    const u = ledMat.current?.uniforms ?? uniforms;
    u.uReveal.value = sceneState.signReveal;
    u.uPower.value = sceneState.signPower;
    u.uTime.value = st.clock.elapsedTime;
    if (baseMat.current) baseMat.current.emissiveIntensity = 0.1 + 0.32 * sceneState.signPower;
    if (light.current) light.current.intensity = 2 + 7 * sceneState.signPower;
  });
  const w = DIM.signW, h = DIM.signH;
  const y = DIM.signY0 + h / 2;
  return (
    <group position={[0, y, 0.16]}>
      {/* light box */}
      <mesh position-z={-0.09}>
        <boxGeometry args={[w + 0.06, h + 0.06, 0.18]} />
        <meshStandardMaterial color="#cfd1d2" metalness={0.6} roughness={0.35} />
      </mesh>
      <mesh position-z={0.001}>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial
          ref={baseMat}
          map={tex.base}
          emissiveMap={tex.base}
          emissive="#ffffff"
          emissiveIntensity={0.1}
          roughness={0.7}
          metalness={0}
        />
      </mesh>
      <mesh position-z={0.006}>
        <planeGeometry args={[w, h]} />
        <shaderMaterial
          ref={ledMat}
          vertexShader={ledVertex}
          fragmentShader={ledFragment}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>
      <pointLight ref={light} color="#ff4a3a" intensity={4} distance={6} decay={2} position={[0, -1.1, 1.4]} />
    </group>
  );
}

function Awning() {
  const tex = useMemo(() => awningTexture(), []);
  const geo = useMemo(() => {
    // sloped canopy with a gentle fabric sag
    const g = new THREE.PlaneGeometry(4.05, 0.95, 24, 6);
    const p = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i);
      const sag = Math.sin(((x + 2.025) / 4.05) * Math.PI * 6) * 0.004 - (0.25 - y * y) * 0.06;
      p.setZ(i, sag);
    }
    g.computeVertexNormals();
    return g;
  }, []);
  return (
    <group position={[0, 3.36, 0]}>
      <mesh geometry={geo} position={[0, -0.18, 0.44]} rotation-x={-Math.PI / 2 + 0.42}>
        <meshStandardMaterial map={tex} color="#c03038" roughness={0.85} side={THREE.DoubleSide} />
      </mesh>
      {/* valance */}
      <mesh position={[0, -0.47, 0.88]}>
        <boxGeometry args={[4.05, 0.26, 0.02]} />
        <meshStandardMaterial color="#9a1d24" roughness={0.8} />
      </mesh>
      <mesh position={[0, -0.6, 0.885]}>
        <boxGeometry args={[4.05, 0.02, 0.025]} />
        <meshStandardMaterial color="#d9d4cc" roughness={0.6} />
      </mesh>
      {/* cassette under the sign */}
      <mesh position={[0, 0.1, 0.08]}>
        <boxGeometry args={[4.1, 0.2, 0.18]} />
        <meshStandardMaterial color="#7d161b" roughness={0.7} />
      </mesh>
    </group>
  );
}

function UpperFloor() {
  const blinds = useMemo(() => blindsTexture(), []);
  const y0 = DIM.upperY0, y1 = DIM.upperY1;
  const w = 3.75;
  const cols = [-w / 2, -w / 6, w / 6, w / 2];
  const rows = [y0, y0 + (y1 - y0) * 0.36, y0 + (y1 - y0) * 0.68, y1];
  const bar = (x: number, y: number, bw: number, bh: number, key: string) => (
    <mesh key={key} position={[x, y, 0.06]}>
      <boxGeometry args={[bw, bh, 0.07]} />
      <meshStandardMaterial color="#e9eaea" metalness={0.4} roughness={0.35} />
    </mesh>
  );
  return (
    <group>
      {/* glass with blinds behind */}
      <mesh position={[0, (y0 + y1) / 2, 0.0]}>
        <planeGeometry args={[w, y1 - y0]} />
        <meshStandardMaterial map={blinds} metalness={0.55} roughness={0.12} color="#9aa0aa" envMapIntensity={1.4} />
      </mesh>
      {cols.map((x, i) => bar(x, (y0 + y1) / 2, 0.07, y1 - y0 + 0.07, `c${i}`))}
      {rows.map((y, i) => bar(0, y, w + 0.07, 0.07, `r${i}`))}
      {/* the smaller framed window in the bottom-middle bay (seen in photo) */}
      {bar(0, rows[0] + 0.62, w / 3 - 0.1, 0.05, "inner-top")}
      {bar(-w / 6 + 0.12, rows[0] + 0.32, 0.05, 0.6, "inner-l")}
      {bar(w / 6 - 0.12, rows[0] + 0.32, 0.05, 0.6, "inner-r")}
      {/* window sill / slab edge */}
      <mesh position={[0, y0 - 0.1, 0.05]}>
        <boxGeometry args={[4.05, 0.2, 0.14]} />
        <meshStandardMaterial color="#7a7672" roughness={0.8} />
      </mesh>
      <mesh position={[0, y1 + 0.35, 0.02]}>
        <boxGeometry args={[4.05, 0.7, 0.1]} />
        <meshStandardMaterial color="#8a837c" roughness={0.9} />
      </mesh>
    </group>
  );
}

function SlidingDoors() {
  const left = useRef<THREE.Group>(null);
  const right = useRef<THREE.Group>(null);
  const sticker = useMemo(() => doorStickerTexture(), []);
  useFrame(() => {
    const o = Math.max(sceneState.doorOpen, sceneState.doorForce);
    const off = o * 0.82;
    if (left.current) left.current.position.x = -DIM.doorHalf / 2 - off;
    if (right.current) right.current.position.x = DIM.doorHalf / 2 + off;
  });
  const leaf = (side: 1 | -1) => (
    <>
      <mesh>
        <boxGeometry args={[DIM.doorHalf, DIM.doorH, 0.012]} />
        <meshPhysicalMaterial color="#cfe3e6" transparent opacity={0.14} roughness={0.04} metalness={0.1} envMapIntensity={1.6} depthWrite={false} />
      </mesh>
      {/* aluminium edge profiles */}
      <mesh position={[side * (DIM.doorHalf / 2 - 0.02), 0, 0]}>
        <boxGeometry args={[0.04, DIM.doorH, 0.04]} />
        <meshStandardMaterial color={ALU} metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[0, -DIM.doorH / 2 + 0.05, 0]}>
        <boxGeometry args={[DIM.doorHalf, 0.1, 0.04]} />
        <meshStandardMaterial color={ALU} metalness={0.8} roughness={0.3} />
      </mesh>
      {side === 1 && (
        <mesh position={[0.08, -0.05, 0.012]}>
          <planeGeometry args={[0.32, 0.2]} />
          <meshStandardMaterial map={sticker} roughness={0.6} />
        </mesh>
      )}
    </>
  );
  return (
    <group position={[0, DIM.doorH / 2, 0.06]}>
      <group ref={left}>{leaf(-1)}</group>
      <group ref={right}>{leaf(1)}</group>
    </group>
  );
}

function Storefront() {
  const frame = (x: number, y: number, w: number, h: number, key: string, z = 0.02) => (
    <mesh key={key} position={[x, y, z]}>
      <boxGeometry args={[w, h, 0.08]} />
      <meshStandardMaterial color={ALU} metalness={0.85} roughness={0.28} />
    </mesh>
  );
  return (
    <group>
      {/* side display glazing */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 1.4, 1.5, 0]}>
          <planeGeometry args={[1.1, 3.0]} />
          <meshPhysicalMaterial color="#dcebee" transparent opacity={0.12} roughness={0.03} metalness={0.2} envMapIntensity={2} depthWrite={false} />
        </mesh>
      ))}
      {/* transom glass above door */}
      <mesh position={[0, (DIM.doorH + 3.0) / 2, 0]}>
        <planeGeometry args={[DIM.doorHalf * 2, 3.0 - DIM.doorH]} />
        <meshPhysicalMaterial color="#dcebee" transparent opacity={0.12} roughness={0.03} metalness={0.2} envMapIntensity={2} depthWrite={false} />
      </mesh>
      {frame(-1.98, 1.52, 0.1, 3.04, "fl")}
      {frame(1.98, 1.52, 0.1, 3.04, "fr")}
      {frame(-DIM.doorHalf, 1.52, 0.07, 3.04, "dl")}
      {frame(DIM.doorHalf, 1.52, 0.07, 3.04, "dr")}
      {frame(0, 3.02, 4.05, 0.08, "top")}
      {frame(0, DIM.doorH + 0.02, DIM.doorHalf * 2, 0.07, "door-head")}
      {/* door operator box */}
      <mesh position={[0, DIM.doorH + 0.12, 0.08]}>
        <boxGeometry args={[DIM.doorHalf * 2.6, 0.16, 0.12]} />
        <meshStandardMaterial color={ALU} metalness={0.8} roughness={0.3} />
      </mesh>
      {/* threshold step */}
      <mesh position={[0, 0.02, 0.2]}>
        <boxGeometry args={[DIM.doorHalf * 2.1, 0.04, 0.4]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.7} />
      </mesh>
      <SlidingDoors />
    </group>
  );
}

/** Black wire racks with bagged dried fruit outside the shop (left & right of the door). */
function OutdoorRacks({ quality }: { quality: Quality }) {
  const { items, frames } = useMemo(() => {
    const rnd = mulberry32(77);
    const items: PackItem[] = [];
    const frames: { p: [number, number, number]; s: [number, number, number] }[] = [];
    const racks = [
      { x0: -1.9, x1: -0.98, levels: [0.12, 0.5, 0.88, 1.26, 1.64], designs: PACK_DESIGNS.outdoorLeft },
      { x0: 0.98, x1: 1.9, levels: [0.45, 0.82, 1.2, 1.58], designs: PACK_DESIGNS.outdoorRight },
    ];
    const z = 0.32;
    for (const r of racks) {
      const w = r.x1 - r.x0;
      frames.push({ p: [r.x0, 1.0, z], s: [0.025, 2.0, 0.025] }, { p: [r.x1, 1.0, z], s: [0.025, 2.0, 0.025] });
      for (const y of r.levels) {
        frames.push({ p: [(r.x0 + r.x1) / 2, y, z], s: [w, 0.02, 0.36] });
        let x = r.x0 + 0.03;
        while (x < r.x1 - 0.1) {
          const bw = 0.11 + rnd() * 0.05;
          const bh = 0.2 + rnd() * 0.1;
          items.push({
            p: [x + bw / 2, y + bh / 2 + 0.01, z + 0.04],
            s: [bw, bh, 0.06 + rnd() * 0.04],
            design: r.designs[Math.floor(rnd() * r.designs.length)],
            ry: (rnd() - 0.5) * 0.15,
          });
          x += bw + 0.015;
        }
      }
    }
    // red base platform on the right (as in the photo)
    frames.push({ p: [1.44, 0.2, 0.36], s: [0.95, 0.4, 0.45] });
    // round tins on the platform
    for (let i = 0; i < 4; i++) items.push({ p: [1.08 + i * 0.13, 0.46, 0.34], s: [0.11, 0.08, 0.11], design: 13 });
    return { items, frames };
  }, []);
  void quality;
  return (
    <group>
      {frames.map((f, i) => (
        <mesh key={i} position={f.p}>
          <boxGeometry args={f.s} />
          <meshStandardMaterial color={i === frames.length - 1 ? "#a3141c" : "#151515"} metalness={0.4} roughness={0.5} />
        </mesh>
      ))}
      <PackInstances items={items} roughness={0.32} />
    </group>
  );
}

function Neighbours() {
  const stucco = useMemo(() => plasterTexture("#8a7865", 2), []);
  const vsign = useMemo(() => verticalSignTexture(), []);
  return (
    <group>
      {/* this building's upper wall + parapet */}
      <mesh position={[0, (3.05 + 9.2) / 2 + 0.0, -0.06]}>
        <planeGeometry args={[4.1, 9.2 - 3.05]} />
        <meshStandardMaterial color="#5f5a55" roughness={0.9} />
      </mesh>
      {/* red cladding pilaster on the right */}
      <mesh position={[2.17, 4.6, 0.12]}>
        <boxGeometry args={[0.34, 9.2, 0.3]} />
        <meshStandardMaterial color="#b0242c" roughness={0.55} metalness={0.15} />
      </mesh>
      <mesh position={[2.1, 1.65, 0.3]}>
        <planeGeometry args={[0.2, 1.75]} />
        <meshStandardMaterial map={vsign} emissiveMap={vsign} emissive="#ffffff" emissiveIntensity={0.35} roughness={0.5} />
      </mesh>
      {/* left neighbour: brown stucco */}
      <mesh position={[-2.3, 5.2, 0.05]}>
        <boxGeometry args={[0.55, 10.4, 0.3]} />
        <meshStandardMaterial map={stucco} roughness={0.95} />
      </mesh>
      {/* outdoor AC unit next to the sign (seen in photo) */}
      <mesh position={[-2.25, 4.0, 0.42]}>
        <boxGeometry args={[0.42, 0.5, 0.3]} />
        <meshStandardMaterial color="#e6e6e2" roughness={0.6} />
      </mesh>
    </group>
  );
}

export function Facade({ quality }: { quality: Quality }) {
  return (
    <group>
      <Storefront />
      <Awning />
      <Sign />
      <UpperFloor />
      <Neighbours />
      <OutdoorRacks quality={quality} />
    </group>
  );
}
