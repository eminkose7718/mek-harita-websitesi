"use client";
import { useMemo, type ReactNode } from "react";
import { MeshReflectorMaterial } from "@react-three/drei";
import type { ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { productById } from "@/lib/products";
import { useStore, type Quality } from "@/lib/store";
import {
  ANGLED_DISPLAY, ANGLED_LEN, ANGLED_Z0, BIN_LEN, BIN_TILT, BIN_X0, BIN_X1, BIN_Z0, COUNTER_LEN, COUNTER_TRAYS,
  COUNTER_Z0, DIM, RIGHT_BINS,
} from "./layout";
import { ProductPile } from "./ProductPile";
import { PackInstances, fillShelf, PACK_DESIGNS, type PackItem } from "./Packs";
import { floorTileTexture, sackTexture, woodTexture } from "./textures";
import { mulberry32 } from "./noise";

const W = DIM.halfW;
const D = DIM.depth;
const WHITE = "#f1efeb";

function Clickable({ id, children }: { id: string; children: ReactNode }) {
  const open = useStore((s) => s.openProduct);
  const onClick = (e: ThreeEvent<MouseEvent>) => {
    const mode = useStore.getState().mode;
    if (mode !== "explore" && mode !== "menu") return;
    if (e.delta > 6) return; // was a drag
    e.stopPropagation();
    open(id);
  };
  return (
    <group
      onClick={onClick}
      onPointerOver={(e) => {
        const mode = useStore.getState().mode;
        if (mode !== "explore" && mode !== "menu") return;
        e.stopPropagation();
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => (document.body.style.cursor = "")}
      userData={{ productId: id }}
    >
      {children}
    </group>
  );
}

function Shell({ quality }: { quality: Quality }) {
  const tiles = useMemo(() => {
    const t = floorTileTexture().clone();
    t.repeat.set((W * 2) / 2.4, D / 2.4);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.needsUpdate = true;
    return t;
  }, []);
  return (
    <group>
      {/* floor */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.001, -D / 2]} receiveShadow>
        <planeGeometry args={[W * 2, D]} />
        {quality === "high" ? (
          <MeshReflectorMaterial
            map={tiles}
            resolution={512}
            blur={[200, 80]}
            mixBlur={1}
            mixStrength={0.9}
            mixContrast={1}
            roughness={0.32}
            metalness={0}
            mirror={0.4}
            depthScale={0}
            color="#ffffff"
          />
        ) : (
          <meshStandardMaterial map={tiles} roughness={0.22} metalness={0} envMapIntensity={0.9} />
        )}
      </mesh>
      {/* ceiling — white panels with linear grooves (as in photo) */}
      <mesh rotation-x={Math.PI / 2} position={[0, DIM.ceil, -D / 2]}>
        <planeGeometry args={[W * 2, D]} />
        <meshStandardMaterial color="#f4f3f1" roughness={0.6} emissive="#ffffff" emissiveIntensity={0.22} />
      </mesh>
      {[-1.25, -0.42, 0.42, 1.25].map((x) => (
        <mesh key={x} position={[x, DIM.ceil - 0.004, -D / 2]}>
          <boxGeometry args={[0.012, 0.004, D]} />
          <meshBasicMaterial color="#bdbab5" />
        </mesh>
      ))}
      {/* walls */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * W, DIM.ceil / 2, -D / 2]} rotation-y={-s * Math.PI / 2}>
          <planeGeometry args={[D, DIM.ceil]} />
          <meshStandardMaterial color={WHITE} roughness={0.85} />
        </mesh>
      ))}
      <mesh position={[0, DIM.ceil / 2, -D]}>
        <planeGeometry args={[W * 2, DIM.ceil]} />
        <meshStandardMaterial color={WHITE} roughness={0.85} />
      </mesh>
      {/* skirting */}
      {[-1, 1].map((s) => (
        <mesh key={`sk${s}`} position={[s * (W - 0.01), 0.05, -D / 2]}>
          <boxGeometry args={[0.02, 0.1, D]} />
          <meshStandardMaterial color="#cfccc6" />
        </mesh>
      ))}
    </group>
  );
}

function CeilingLights({ quality }: { quality: Quality }) {
  const zs = [-1.0, -2.6, -4.2, -5.8, -7.4, -9.0, -10.3];
  return (
    <group>
      {zs.map((z) =>
        [-0.55, 0.55].map((x) => (
          <group key={`${x}${z}`} position={[x, DIM.ceil - 0.01, z]}>
            <mesh rotation-x={Math.PI / 2}>
              <circleGeometry args={[0.17, 32]} />
              <meshBasicMaterial color={[2.6, 2.6, 2.45]} toneMapped={false} />
            </mesh>
            <mesh rotation-x={Math.PI / 2} position-y={0.003}>
              <ringGeometry args={[0.17, 0.2, 32]} />
              <meshStandardMaterial color="#e9e8e6" />
            </mesh>
          </group>
        )),
      )}
      {/* small round vents between lights */}
      {[-1.8, -5.0, -8.2].map((z) => (
        <mesh key={z} rotation-x={Math.PI / 2} position={[0, DIM.ceil - 0.01, z]}>
          <ringGeometry args={[0.06, 0.14, 24]} />
          <meshStandardMaterial color="#d8d6d2" />
        </mesh>
      ))}
      {/* actual light sources (kept few for performance) */}
      {[-1.6, -5.0, -8.6].map((z) => (
        <pointLight key={z} position={[0.1, DIM.ceil - 0.25, z]} intensity={quality === "low" ? 7 : 6} distance={9} decay={1.6} color="#fff6ea" />
      ))}
      <rectAreaLight position={[0, DIM.ceil - 0.02, -D / 2]} rotation-x={-Math.PI / 2} width={1.6} height={D - 1} intensity={1.6} color="#fff8ef" />
    </group>
  );
}

function ShelfUnit({
  x, z0, z1, depth, levels, face,
}: { x: number; z0: number; z1: number; depth: number; levels: number[]; face: 1 | -1 }) {
  const len = z0 - z1;
  const zc = (z0 + z1) / 2;
  return (
    <group>
      {levels.map((y) => (
        <group key={y}>
          <mesh position={[x, y, zc]}>
            <boxGeometry args={[depth, 0.025, len]} />
            <meshStandardMaterial color="#e6e5e2" roughness={0.5} metalness={0.2} />
          </mesh>
          {/* price strip */}
          <mesh position={[x + face * (depth / 2 + 0.003), y - 0.012, zc]} rotation-y={(face * Math.PI) / 2}>
            <planeGeometry args={[len, 0.035]} />
            <meshStandardMaterial color="#d8d6d0" roughness={0.6} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function RightSide({ quality }: { quality: Quality }) {
  const packs = useMemo(() => {
    const rnd = mulberry32(11);
    const out: PackItem[] = [];
    const levels = [1.18, 1.52, 1.86, 2.2, 2.54];
    levels.forEach((y, i) =>
      fillShelf(out, {
        x: 1.74, y: y + 0.013, z0: -0.65, z1: -8.0, depth: 0.26, face: -1,
        designs: i < 2 ? PACK_DESIGNS.nutBags : i < 4 ? PACK_DESIGNS.mixedRetail : PACK_DESIGNS.coffee,
        h: [0.16, 0.28], w: [0.1, 0.17], rnd,
      }),
    );
    // stacked gift boxes near the door (green/pink stacks in the photo)
    for (let k = 0; k < 9; k++)
      out.push({ p: [0.95, 0.06 + k * 0.075, -0.45], s: [0.3, 0.07, 0.42], design: k % 2 ? 9 : 10, ry: (rnd() - 0.5) * 0.1 });
    for (let k = 0; k < 7; k++)
      out.push({ p: [1.32, 0.06 + k * 0.075, -0.42], s: [0.3, 0.07, 0.42], design: k % 3 ? 10 : 11, ry: (rnd() - 0.5) * 0.1 });
    return out;
  }, []);
  const binW = BIN_X1 - BIN_X0;
  return (
    <group>
      <ShelfUnit x={1.74} z0={-0.6} z1={-8.1} depth={0.3} levels={[1.18, 1.52, 1.86, 2.2, 2.54]} face={-1} />
      <PackInstances items={packs} />
      {/* bin cabinet */}
      <mesh position={[(BIN_X0 + W) / 2, 0.38, BIN_Z0 - (BIN_LEN * RIGHT_BINS.length) / 2]}>
        <boxGeometry args={[W - BIN_X0, 0.76, BIN_LEN * RIGHT_BINS.length + 0.04]} />
        <meshStandardMaterial color="#ecebe8" roughness={0.6} />
      </mesh>
      {RIGHT_BINS.map((id, i) => {
        const zc = BIN_Z0 - BIN_LEN * (i + 0.5);
        const kind = productById(id)?.model ?? "apricot";
        return (
          <group key={id} position={[(BIN_X0 + BIN_X1) / 2, 0.93, zc]} rotation-z={BIN_TILT}>
            <Clickable id={id}>
              <ProductPile kind={kind} width={binW / Math.cos(BIN_TILT) - 0.04} length={BIN_LEN - 0.06} quality={quality} seed={i + 3} mound={0.03} />
            </Clickable>
            {/* clear acrylic lip + divider */}
            <mesh position={[-binW / 2 / Math.cos(BIN_TILT), 0.05, 0]} rotation-z={-BIN_TILT}>
              <boxGeometry args={[0.008, 0.16, BIN_LEN - 0.02]} />
              <meshPhysicalMaterial color="#e8f3f5" transparent opacity={0.25} roughness={0.05} depthWrite={false} />
            </mesh>
            <mesh position={[0, 0.03, -BIN_LEN / 2]}>
              <boxGeometry args={[binW / Math.cos(BIN_TILT), 0.1, 0.008]} />
              <meshPhysicalMaterial color="#e8f3f5" transparent opacity={0.3} roughness={0.05} depthWrite={false} />
            </mesh>
            {/* price tag */}
            <mesh position={[-binW / 2 / Math.cos(BIN_TILT) - 0.01, 0.1, 0.25]} rotation-y={-Math.PI / 2} rotation-z={-BIN_TILT}>
              <planeGeometry args={[0.1, 0.07]} />
              <meshStandardMaterial color="#fdfbf6" emissive="#ffffff" emissiveIntensity={0.15} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function LeftSide({ quality }: { quality: Quality }) {
  const wood = useMemo(() => woodTexture(), []);
  const { packs, jars } = useMemo(() => {
    const rnd = mulberry32(23);
    const packs: PackItem[] = [];
    const jars: PackItem[] = [];
    const levels = [0.3, 0.72, 1.14, 1.56, 1.98, 2.4];
    levels.forEach((y, i) => {
      if (i === 2 || i === 3) {
        // jars of honey / spreads (amber jars with gold lids in the photo)
        let z = -0.6;
        while (z > -10.4) {
          const r = 0.045 + rnd() * 0.02;
          jars.push({ p: [-1.72, y + 0.013 + 0.07, z - r], s: [r * 2, 0.14, r * 2], design: 13 });
          z -= r * 2 + 0.01;
        }
      } else {
        fillShelf(packs, {
          x: -1.72, y: y + 0.013, z0: -0.6, z1: -10.4, depth: 0.26, face: 1,
          designs: i >= 4 ? PACK_DESIGNS.boxes : PACK_DESIGNS.mixedRetail,
          h: i >= 4 ? [0.12, 0.2] : [0.15, 0.3], w: [0.1, 0.2], rnd,
        });
      }
    });
    // gondola near the door with red packaged items
    [0.32, 0.7, 1.08, 1.46].forEach((y) =>
      fillShelf(packs, { x: -1.3, y: y + 0.013, z0: -0.55, z1: -2.3, depth: 0.32, face: 1, designs: [12, 12, 8, 15], h: [0.14, 0.22], w: [0.08, 0.13], rnd }),
    );
    return { packs, jars };
  }, []);
  const sacks = useMemo(
    () => [
      { z: -2.75, tex: sackTexture(["#e2c992", "#d9b97a", "#efdcae", "#c99f62"], 1) },
      { z: -3.25, tex: sackTexture(["#d7c39a", "#8aa04a", "#c8b088", "#e5d6b5"], 2) },
      { z: -3.75, tex: sackTexture(["#8a5428", "#a8723f", "#6e4120"], 3) },
      { z: -4.25, tex: sackTexture(["#e2c992", "#d9b97a", "#efdcae", "#c99f62"], 4) },
    ],
    [],
  );
  const glass = <meshPhysicalMaterial color="#e6f2f4" transparent opacity={0.16} roughness={0.03} metalness={0.1} envMapIntensity={1.8} depthWrite={false} side={THREE.DoubleSide} />;
  const angledLen = ANGLED_LEN * ANGLED_DISPLAY.length;
  const counterLen = COUNTER_LEN * COUNTER_TRAYS.length;
  return (
    <group>
      <ShelfUnit x={-1.74} z0={-0.5} z1={-10.5} depth={0.3} levels={[0.3, 0.72, 1.14, 1.56, 1.98, 2.4]} face={1} />
      <ShelfUnit x={-1.3} z0={-0.5} z1={-2.35} depth={0.34} levels={[0.32, 0.7, 1.08, 1.46]} face={1} />
      <PackInstances items={packs} />
      <PackInstances items={jars} shape="cyl" roughness={0.15} metalness={0.05} />
      {/* bulk sacks (cashews, pistachios …) */}
      {sacks.map((s) => (
        <group key={s.z} position={[-1.25, 0, s.z]}>
          <mesh position-y={0.18}>
            <boxGeometry args={[0.42, 0.36, 0.44]} />
            <meshStandardMaterial color="#e3e1dc" />
          </mesh>
          <mesh position-y={0.36 + 0.3}>
            <cylinderGeometry args={[0.19, 0.2, 0.6, 24, 1, true]} />
            <meshStandardMaterial map={s.tex} roughness={0.35} side={THREE.DoubleSide} />
          </mesh>
          <mesh position-y={0.96}>
            <sphereGeometry args={[0.19, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial map={s.tex} roughness={0.35} />
          </mesh>
        </group>
      ))}
      {/* angled glass display on a walnut cabinet */}
      <group position={[-1.2, 0, ANGLED_Z0 - angledLen / 2]}>
        <mesh position-y={0.42}>
          <boxGeometry args={[0.7, 0.84, angledLen + 0.04]} />
          <meshStandardMaterial map={wood} roughness={0.55} />
        </mesh>
        <mesh position={[0.08, 1.1, 0]} rotation-z={0.55}>
          <planeGeometry args={[0.6, angledLen]} />
          {glass}
        </mesh>
      </group>
      {ANGLED_DISPLAY.map((id, i) => {
        const kind = productById(id)?.model ?? "mixed";
        return (
          <group key={id} position={[-1.2, 0.93, ANGLED_Z0 - ANGLED_LEN * (i + 0.5)]} rotation-z={-BIN_TILT * 0.7}>
            <Clickable id={id}>
              <ProductPile kind={kind} width={0.62} length={ANGLED_LEN - 0.05} quality={quality} seed={i + 20} mound={0.05} />
            </Clickable>
            <mesh position={[0, 0.04, -ANGLED_LEN / 2]}>
              <boxGeometry args={[0.66, 0.1, 0.008]} />
              <meshPhysicalMaterial color="#e8f3f5" transparent opacity={0.3} depthWrite={false} />
            </mesh>
          </group>
        );
      })}
      {/* curved-glass walnut counter at the back */}
      <group position={[-1.17, 0, COUNTER_Z0 - counterLen / 2]}>
        <mesh position-y={0.4}>
          <boxGeometry args={[0.78, 0.8, counterLen + 0.04]} />
          <meshStandardMaterial map={wood} roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.81, 0]}>
          <boxGeometry args={[0.8, 0.02, counterLen + 0.06]} />
          <meshStandardMaterial color="#2a1a12" roughness={0.4} />
        </mesh>
        <mesh position={[-0.38, 0.82, 0]} rotation-x={Math.PI / 2}>
          <cylinderGeometry args={[0.42, 0.42, counterLen, 32, 1, true, 0, Math.PI / 2]} />
          {glass}
        </mesh>
      </group>
      {COUNTER_TRAYS.map((id, i) => {
        const kind = productById(id)?.model ?? "mixed";
        return (
          <group key={id} position={[-1.15, 0.83, COUNTER_Z0 - COUNTER_LEN * (i + 0.5)]}>
            <mesh position-y={-0.005}>
              <boxGeometry args={[0.66, 0.02, COUNTER_LEN - 0.06]} />
              <meshStandardMaterial color="#c9c6c0" metalness={0.7} roughness={0.25} />
            </mesh>
            <Clickable id={id}>
              <ProductPile kind={kind} width={0.62} length={COUNTER_LEN - 0.1} quality={quality} seed={i + 40} mound={0.05} />
            </Clickable>
          </group>
        );
      })}
    </group>
  );
}

function BackAndFixtures() {
  const packs = useMemo(() => {
    const rnd = mulberry32(31);
    const out: PackItem[] = [];
    [0.9, 1.3, 1.7, 2.1, 2.5].forEach((y) => {
      let x = -1.5;
      while (x < 1.6) {
        const w = 0.14 + rnd() * 0.12;
        const h = 0.14 + rnd() * 0.16;
        out.push({ p: [x + w / 2, y + h / 2 + 0.013, -D + 0.16], s: [w, h, 0.2], ry: 0, design: PACK_DESIGNS.boxes[Math.floor(rnd() * 5)] });
        x += w + 0.015;
      }
    });
    return out;
  }, []);
  return (
    <group>
      {[0.9, 1.3, 1.7, 2.1, 2.5].map((y) => (
        <mesh key={y} position={[0, y, -D + 0.16]}>
          <boxGeometry args={[3.7, 0.025, 0.3]} />
          <meshStandardMaterial color="#e6e5e2" roughness={0.5} metalness={0.2} />
        </mesh>
      ))}
      <PackInstances items={packs} />
      {/* cashier desk (concept reconstruction — not visible in photos) */}
      <mesh position={[1.15, 0.5, -10.05]}>
        <boxGeometry args={[1.3, 1.0, 0.55]} />
        <meshStandardMaterial map={woodTexture()} roughness={0.5} />
      </mesh>
      <mesh position={[1.1, 1.08, -10.05]}>
        <boxGeometry args={[0.3, 0.16, 0.24]} />
        <meshStandardMaterial color="#202224" roughness={0.4} />
      </mesh>
      {/* AC unit above the entrance (seen in photo) */}
      <mesh position={[0.25, 2.66, -0.22]}>
        <boxGeometry args={[0.95, 0.3, 0.24]} />
        <meshStandardMaterial color="#f7f7f5" roughness={0.4} />
      </mesh>
      {/* TV above the door */}
      <mesh position={[-1.05, 2.45, -0.08]}>
        <boxGeometry args={[0.85, 0.5, 0.05]} />
        <meshStandardMaterial color="#0d0e10" roughness={0.2} metalness={0.3} />
      </mesh>
      <mesh position={[-1.05, 2.45, -0.11]} rotation-y={Math.PI}>
        <planeGeometry args={[0.8, 0.45]} />
        <meshBasicMaterial color={[0.25, 0.32, 0.45]} toneMapped={false} />
      </mesh>
      {/* security dome */}
      <mesh position={[-0.6, DIM.ceil - 0.05, -0.6]}>
        <sphereGeometry args={[0.06, 16, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
        <meshStandardMaterial color="#111" roughness={0.1} />
      </mesh>
    </group>
  );
}

export function Interior({ quality }: { quality: Quality }) {
  return (
    <group>
      <Shell quality={quality} />
      <CeilingLights quality={quality} />
      <RightSide quality={quality} />
      <LeftSide quality={quality} />
      <BackAndFixtures />
    </group>
  );
}
