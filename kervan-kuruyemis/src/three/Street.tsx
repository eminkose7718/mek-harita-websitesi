"use client";
import { useMemo } from "react";
import { Sparkles } from "@react-three/drei";
import * as THREE from "three";
import type { Quality } from "@/lib/store";
import { asphaltTexture, plasterTexture, sidewalkTexture, windowsTexture } from "./textures";
import { mulberry32 } from "./noise";

const skyVertex = /* glsl */ `
varying vec3 vPos;
void main(){ vPos = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`;
const skyFragment = /* glsl */ `
varying vec3 vPos;
void main(){
  float h = normalize(vPos).y;
  vec3 top = vec3(0.018, 0.024, 0.06);
  vec3 mid = vec3(0.07, 0.06, 0.12);
  vec3 hor = vec3(0.32, 0.17, 0.12);
  vec3 c = mix(hor, mid, smoothstep(-0.02, 0.18, h));
  c = mix(c, top, smoothstep(0.18, 0.7, h));
  gl_FragColor = vec4(c, 1.0);
}`;

function Building({ x, z, w, h, d, seed, base, facing = 1 }: { x: number; z: number; w: number; h: number; d: number; seed: number; base: string; facing?: 1 | -1 }) {
  const win = useMemo(() => {
    const t = windowsTexture(seed, 0.3).clone();
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(Math.max(1, Math.round(w / 3)), Math.max(1, Math.round(h / 6)));
    t.needsUpdate = true;
    return t;
  }, [seed, w, h]);
  const wall = useMemo(() => plasterTexture(base, seed), [base, seed]);
  return (
    <group position={[x, h / 2, z]}>
      <mesh>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial map={wall} roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.8, (facing * d) / 2 + facing * 0.01]} rotation-y={facing === 1 ? 0 : Math.PI}>
        <planeGeometry args={[w * 0.86, h - 4.4]} />
        <meshStandardMaterial map={win} emissiveMap={win} emissive="#ffffff" emissiveIntensity={0.9} roughness={0.4} />
      </mesh>
    </group>
  );
}

function StreetLamp({ x, z, flip = false }: { x: number; z: number; flip?: boolean }) {
  return (
    <group position={[x, 0, z]} rotation-y={flip ? Math.PI : 0}>
      <mesh position-y={2.6}>
        <cylinderGeometry args={[0.05, 0.07, 5.2, 10]} />
        <meshStandardMaterial color="#202224" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[0, 5.15, -0.45]} rotation-x={Math.PI / 2}>
        <cylinderGeometry args={[0.03, 0.03, 0.9, 8]} />
        <meshStandardMaterial color="#202224" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[0, 5.08, -0.85]}>
        <boxGeometry args={[0.32, 0.08, 0.5]} />
        <meshStandardMaterial color="#1c1d1f" />
      </mesh>
      <mesh position={[0, 5.03, -0.85]} rotation-x={Math.PI / 2}>
        <planeGeometry args={[0.26, 0.42]} />
        <meshBasicMaterial color={[4, 3.1, 1.9]} toneMapped={false} side={THREE.DoubleSide} />
      </mesh>
      <pointLight position={[0, 4.8, -0.85]} color="#ffc98a" intensity={14} distance={14} decay={1.8} />
    </group>
  );
}

export function Street({ quality }: { quality: Quality }) {
  const side = useMemo(() => {
    const t = sidewalkTexture().clone();
    t.repeat.set(5, 1.4);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.needsUpdate = true;
    return t;
  }, []);
  const asph = useMemo(() => asphaltTexture(), []);
  const cars = useMemo(() => {
    const rnd = mulberry32(4);
    return Array.from({ length: 3 }, (_, i) => ({ x: -9 + i * 7.5 + rnd() * 2, z: 9.6 + rnd() * 0.3, c: ["#6b6f75", "#1d2a3c", "#8a1f22"][i] }));
  }, []);
  return (
    <group>
      <mesh scale={80}>
        <sphereGeometry args={[1, 32, 16]} />
        <shaderMaterial vertexShader={skyVertex} fragmentShader={skyFragment} side={THREE.BackSide} depthWrite={false} />
      </mesh>
      {/* sidewalk in front of the shop */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, 1.75]} receiveShadow>
        <planeGeometry args={[30, 3.5]} />
        <meshStandardMaterial map={side} roughness={0.75} />
      </mesh>
      {/* curb */}
      <mesh position={[0, -0.06, 3.53]}>
        <boxGeometry args={[30, 0.14, 0.16]} />
        <meshStandardMaterial color="#8d8a85" roughness={0.8} />
      </mesh>
      {/* road (slightly wet for reflections) */}
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.13, 7.8]}>
        <planeGeometry args={[30, 8.4]} />
        <meshStandardMaterial map={asph} roughness={0.42} metalness={0.15} envMapIntensity={0.6} />
      </mesh>
      {[-12, -6, 0, 6, 12].map((x) => (
        <mesh key={x} rotation-x={-Math.PI / 2} position={[x, -0.125, 7.8]}>
          <planeGeometry args={[2.4, 0.12]} />
          <meshStandardMaterial color="#cfcbbf" roughness={0.6} />
        </mesh>
      ))}
      {/* opposite sidewalk */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, 13.5]}>
        <planeGeometry args={[30, 3.4]} />
        <meshStandardMaterial map={side} roughness={0.8} />
      </mesh>
      {/* parked cars (simple silhouettes, keeps the street believable) */}
      {cars.map((c, i) => (
        <group key={i} position={[c.x, 0, c.z]}>
          <mesh position-y={0.45}>
            <boxGeometry args={[4.1, 0.6, 1.75]} />
            <meshStandardMaterial color={c.c} metalness={0.6} roughness={0.3} />
          </mesh>
          <mesh position={[0.2, 0.95, 0]}>
            <boxGeometry args={[2.1, 0.5, 1.6]} />
            <meshStandardMaterial color="#121418" metalness={0.5} roughness={0.15} />
          </mesh>
          {[-1.4, 1.4].map((wx) =>
            [-0.85, 0.85].map((wz) => (
              <mesh key={`${wx}${wz}`} position={[wx, 0.32, wz]} rotation-x={Math.PI / 2}>
                <cylinderGeometry args={[0.32, 0.32, 0.2, 16]} />
                <meshStandardMaterial color="#111" roughness={0.9} />
              </mesh>
            )),
          )}
        </group>
      ))}
      {/* neighbouring buildings (concept reconstruction) */}
      <Building x={-5.0} z={-1.0} w={5.4} h={13} d={2} seed={5} base="#7d6b5a" />
      <Building x={5.3} z={-1.0} w={5.8} h={11} d={2} seed={8} base="#8d8579" />
      <Building x={-11} z={-1.5} w={6} h={16} d={3} seed={13} base="#6b6560" />
      <Building x={11.5} z={-1.5} w={6} h={14} d={3} seed={17} base="#77706a" />
      {/* volume of the Kervan building above the shop (sits on top of the interior ceiling) */}
      <mesh position={[0, 6.2, -5.6]}>
        <boxGeometry args={[4.4, 6.2, 11]} />
        <meshStandardMaterial color="#4f4b47" roughness={0.95} />
      </mesh>
      {/* opposite side of Cumhuriyet Caddesi */}
      <Building x={-7} z={17} w={7} h={12} d={3} seed={31} base="#6f6862" facing={-1} />
      <Building x={0.5} z={17} w={7} h={15} d={3} seed={37} base="#7a736c" facing={-1} />
      <Building x={8} z={17} w={7} h={11} d={3} seed={41} base="#6c665f" facing={-1} />
      {/* shop-level glow of neighbours */}
      <mesh position={[-4.6, 1.5, 0.02]}>
        <planeGeometry args={[4.2, 2.6]} />
        <meshBasicMaterial color={[0.55, 0.42, 0.3]} />
      </mesh>
      <mesh position={[5.0, 1.5, 0.02]}>
        <planeGeometry args={[4.4, 2.6]} />
        <meshBasicMaterial color={[0.35, 0.42, 0.5]} />
      </mesh>
      <StreetLamp x={-4.2} z={3.3} />
      <StreetLamp x={6.5} z={3.3} />
      {quality !== "low" && (
        <Sparkles count={quality === "high" ? 70 : 35} scale={[10, 5, 6]} position={[0, 3, 3]} size={2.2} speed={0.15} opacity={0.35} color="#ffd9a8" />
      )}
    </group>
  );
}
