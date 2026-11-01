import * as THREE from "three";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { ModelKind } from "@/lib/products";
import { fbm3, ridged3, smoothstep, clamp, mulberry32 } from "./noise";

/**
 * Procedural, physically-sized (metres) dried fruit & nut geometry.
 * Every kind is sculpted from a seamless icosphere (or a swept profile for cashews)
 * with noise-driven wrinkles, creases and baked vertex-colour shading.
 */

export type Detail = "low" | "mid" | "high";
type RGB = [number, number, number];
const hex = (h: number): RGB => [((h >> 16) & 255) / 255, ((h >> 8) & 255) / 255, (h & 255) / 255];
/** Vertex colours must be linear; authoring palette is sRGB. */
const lin = (c: RGB): RGB => [Math.pow(c[0], 2.2), Math.pow(c[1], 2.2), Math.pow(c[2], 2.2)];
const mix = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

type Sculpt = (u: THREE.Vector3, seed: number) => { p: [number, number, number]; c: RGB };

const ICO_DETAIL: Record<Detail, number> = { low: 2, mid: 3, high: 5 };

function sculptSphere(detail: Detail, seed: number, scale: number, fn: Sculpt) {
  let g: THREE.BufferGeometry = new THREE.IcosahedronGeometry(1, ICO_DETAIL[detail]);
  g.deleteAttribute("normal");
  g.deleteAttribute("uv");
  g = mergeVertices(g, 1e-5);
  const pos = g.getAttribute("position") as THREE.BufferAttribute;
  const colors = new Float32Array(pos.count * 3);
  const uvs = new Float32Array(pos.count * 2);
  const u = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    u.fromBufferAttribute(pos, i).normalize();
    uvs[i * 2] = 0.5 + Math.atan2(u.z, u.x) / (2 * Math.PI);
    uvs[i * 2 + 1] = 0.5 + Math.asin(clamp(u.y, -1, 1)) / Math.PI;
    const { p, c: cs } = fn(u, seed);
    const c = lin(cs);
    pos.setXYZ(i, p[0] * scale, p[1] * scale, p[2] * scale);
    colors[i * 3] = c[0];
    colors[i * 3 + 1] = c[1];
    colors[i * 3 + 2] = c[2];
  }
  g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  g.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  g.computeVertexNormals();
  g.computeBoundingSphere();
  return g;
}

// ---------- individual kinds ----------

const apricot = (sun: boolean): Sculpt => (u, s) => {
  // Turkish dried apricot: pressed round disc, pit-slit on top, soft wrinkles.
  const w = fbm3(u.x * 3.2, u.y * 3.2, u.z * 3.2, s, 4);
  const r = ridged3(u.x * 6, u.y * 6, u.z * 6, s + 3, 3);
  const disp = 1 + w * 0.08 + (r - 0.5) * 0.09;
  let x = u.x * disp, y = u.y * 0.4 * disp, z = u.z * 0.95 * disp;
  const rr = u.x * u.x + u.z * u.z;
  if (u.y > 0) {
    y -= 0.16 * Math.exp(-rr / 0.09); // pit dimple
    y -= 0.05 * Math.exp(-(u.z * u.z) / 0.004) * smoothstep(0.6, 0.2, Math.abs(u.x)); // slit
  }
  // fold the rim slightly
  y += 0.06 * Math.sin(Math.atan2(u.z, u.x) * 3 + s) * smoothstep(0.5, 1, rr);
  const base = sun ? hex(0x6e3a1c) : hex(0xe5821f);
  const deep = sun ? hex(0x3c1c0d) : hex(0xa94a08);
  const light = sun ? hex(0x8f5428) : hex(0xf2a43a);
  let c = mix(base, light, clamp(w * 1.4 + 0.3));
  c = mix(c, deep, clamp((0.55 - r) * 1.6) * 0.8 + (u.y > 0 ? Math.exp(-rr / 0.05) * 0.5 : 0));
  return { p: [x, y, z], c };
};

const date: Sculpt = (u, s) => {
  const w = fbm3(u.x * 7, u.y * 7, u.z * 2.2, s, 4);
  const r = ridged3(u.x * 9, u.y * 9, u.z * 3, s + 5, 3);
  const disp = 1 + w * 0.05 - (1 - r) * 0.05;
  const taper = 1 - 0.18 * u.z * u.z;
  const x = u.x * 0.43 * disp * taper, y = u.y * 0.4 * disp * taper, z = u.z * disp;
  let c = mix(hex(0x5a2810), hex(0x8c4a1f), clamp(w + 0.45));
  c = mix(c, hex(0x2a1006), clamp(0.7 - r) * 0.9);
  // stem end lighter
  c = mix(c, hex(0xa86a35), smoothstep(0.85, 1, u.z) * 0.6);
  return { p: [x, y, z], c };
};

const fig: Sculpt = (u, s) => {
  const w = fbm3(u.x * 4, u.y * 4, u.z * 4, s, 4);
  const seeds = ridged3(u.x * 11, u.y * 11, u.z * 11, s + 4, 2);
  const disp = 1 + w * 0.09 + (seeds - 0.6) * 0.035;
  const neck = 1 - 0.55 * smoothstep(0.15, 1, u.z);
  let x = u.x * disp * neck, y = u.y * 0.44 * disp * neck, z = u.z * 1.05 * disp;
  z += 0.22 * Math.exp(-(u.x * u.x + u.y * u.y) / 0.015) * (u.z > 0 ? 1 : 0); // stem
  y -= 0.08 * Math.exp(-(u.x * u.x) / 0.01) * (u.y > 0 ? 1 : 0); // pressed seam
  let c = mix(hex(0x8f6a40), hex(0xcfac7a), clamp(w * 1.5 + 0.5));
  c = mix(c, hex(0x5e4024), smoothstep(0.85, 1, u.z) * 0.8);
  c = mix(c, hex(0x6a4a2a), clamp(0.55 - seeds) * 0.9);
  // dusty sugar bloom
  c = mix(c, hex(0xe8d6b5), clamp(fbm3(u.x * 12, u.y * 12, u.z * 12, s + 9, 2)) * 0.35);
  return { p: [x, y, z], c };
};

const raisin = (black: boolean): Sculpt => (u, s) => {
  const r = ridged3(u.x * 4.5, u.y * 4.5, u.z * 4.5, s, 3);
  const w = fbm3(u.x * 2, u.y * 2, u.z * 2, s + 2, 3);
  const disp = 1 + (r - 0.6) * 0.22 + w * 0.12;
  const x = u.x * 0.72 * disp, y = u.y * 0.6 * disp, z = u.z * disp;
  const a = black ? hex(0x2a1418) : hex(0xd08a30);
  const b = black ? hex(0x5a2e3a) : hex(0x8a3f14);
  let c = mix(a, b, clamp(w + 0.5));
  c = mix(c, black ? hex(0x120709) : hex(0x5a2408), clamp(0.6 - r) * 1.2);
  return { p: [x, y, z], c };
};

const prune: Sculpt = (u, s) => {
  const r = ridged3(u.x * 3.5, u.y * 3.5, u.z * 3.5, s, 3);
  const w = fbm3(u.x * 2, u.y * 2, u.z * 2, s + 2, 3);
  const disp = 1 + (r - 0.6) * 0.14 + w * 0.1;
  const x = u.x * 0.85 * disp, y = u.y * 0.62 * disp, z = u.z * disp;
  let c = mix(hex(0x1c0d10), hex(0x3d1c24), clamp(w + 0.5));
  c = mix(c, hex(0x070304), clamp(0.6 - r));
  return { p: [x, y, z], c };
};

const hazelnut: Sculpt = (u, s) => {
  const w = fbm3(u.x * 6, u.y * 6, u.z * 6, s, 3);
  let x = u.x, y = u.y * 1.08, z = u.z;
  if (u.y > 0) {
    const k = 1 - 0.32 * Math.pow(u.y, 2.2);
    x *= k;
    z *= k;
    y *= 1 + 0.12 * Math.pow(u.y, 3);
  }
  if (u.y < -0.75) y = -0.75 * 1.08 + (u.y + 0.75) * 0.35; // flat base scar
  const d = 1 + w * 0.025;
  let c = mix(hex(0x8a5428), hex(0xb07a44), clamp(w * 2 + 0.5));
  c = mix(c, hex(0xd7b98c), smoothstep(-0.6, -0.85, u.y)); // pale base
  c = mix(c, hex(0x4f2c12), clamp(fbm3(u.x * 14, u.y * 14, u.z * 14, s + 4, 2) - 0.15) * 0.8); // skin flakes
  return { p: [x * d, y * d, z * d], c };
};

const pistachio: Sculpt = (u, s) => {
  const w = fbm3(u.x * 5, u.y * 5, u.z * 5, s, 3);
  const end = 1 - 0.32 * Math.pow(Math.abs(u.z), 3);
  const tip = u.z > 0 ? 1 - 0.18 * Math.pow(u.z, 6) : 1;
  let x = u.x * 0.6 * end * tip, y = u.y * 0.54 * end * tip, z = u.z;
  // shell gapes open along the top seam, revealing the green kernel
  const seam = Math.exp(-(u.x * u.x) / 0.035) * smoothstep(0.05, 0.5, u.y) * smoothstep(0.92, 0.3, Math.abs(u.z));
  y -= seam * 0.12;
  x *= 1 + seam * 0.15 * Math.sign(u.x || 1);
  const d = 1 + w * 0.02;
  let c = mix(hex(0xd8c096), hex(0xeddcba), clamp(w * 2 + 0.5));
  c = mix(c, hex(0xa98858), clamp(fbm3(u.x * 16, u.y * 16, u.z * 16, s + 7, 2)) * 0.6);
  const kernel = mix(hex(0x6f9a2e), hex(0x84466a), clamp(fbm3(u.x * 7, u.y * 7, u.z * 7, s + 2, 2) + 0.35));
  c = mix(c, kernel, smoothstep(0.2, 0.6, seam));
  c = mix(c, hex(0x8a6a40), Math.exp(-(u.x * u.x) / 0.002) * smoothstep(0.0, 0.3, u.y) * 0.5); // seam line
  return { p: [x * d, y * d, z * d], c };
};

const almond: Sculpt = (u, s) => {
  const stri = fbm3(u.x * 26, u.y * 26, u.z * 3, s, 2);
  const w = fbm3(u.x * 3, u.y * 3, u.z * 3, s + 1, 3);
  const tip = Math.pow(Math.max(0, u.z), 1.6);
  const k = 1 - 0.6 * tip;
  const d = 1 + stri * 0.03 + w * 0.04;
  const x = u.x * 0.62 * k * d, y = u.y * 0.33 * k * d, z = u.z * d;
  let c = mix(hex(0x7a4424), hex(0xa6683c), clamp(stri * 2 + 0.5));
  c = mix(c, hex(0x5a2e16), clamp(-w));
  return { p: [x, y, z], c };
};

const walnut: Sculpt = (u, s) => {
  // Walnut kernel half: two lobes split by a deep central groove, covered with brain-like folds.
  const r = ridged3(u.x * 5.2 + 3, u.y * 5.2, u.z * 5.2, s, 3);
  const crease = Math.pow(Math.max(0, 1 - r), 1.6);
  const w = fbm3(u.x * 2.5, u.y * 2.5, u.z * 2.5, s + 3, 2);
  const groove = Math.exp(-(u.x * u.x) / 0.006);
  let x = u.x, y = u.y, z = u.z * 0.82;
  const disp = 1 - crease * 0.2 + w * 0.06;
  x *= disp;
  z *= disp;
  if (u.y >= 0) y = u.y * 0.62 * disp - groove * 0.28 * u.y;
  else y = u.y * 0.22; // flat cut face
  // lobes bulge a little sideways
  x *= 1 + 0.08 * Math.cos(u.z * 3.0);
  let c = mix(hex(0xc8a06a), hex(0xe2c592), clamp(w + 0.5));
  c = mix(c, hex(0x5a3518), clamp(crease * 1.7) * 0.9);
  c = mix(c, hex(0x4a2a12), groove * (u.y > 0 ? 0.8 : 0));
  if (u.y < 0) c = mix(c, hex(0xead6ae), 0.55);
  return { p: [x, y, z], c };
};

function cashew(detail: Detail, seed: number, scale: number) {
  const U = detail === "low" ? 14 : detail === "mid" ? 26 : 72;
  const V = detail === "low" ? 8 : detail === "mid" ? 14 : 36;
  const rnd = mulberry32(seed);
  const arc0 = 0.02 * Math.PI, arc1 = 0.9 * Math.PI + rnd() * 0.08;
  const positions: number[] = [];
  const colors: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  for (let i = 0; i <= U; i++) {
    const t = i / U;
    const phi = arc0 + (arc1 - arc0) * t;
    const sx = Math.cos(phi), sy = Math.sin(phi);
    const prof = Math.pow(Math.sin(Math.PI * t), 0.42) * (1 + 0.18 * (t - 0.5));
    for (let j = 0; j <= V; j++) {
      const v = (j / V) * Math.PI * 2;
      const cv = Math.cos(v), sv = Math.sin(v);
      let r = 0.6 * prof;
      if (cv < 0) r *= 0.78; // inner curve flatter
      const groove = 0.05 * Math.exp(-(sv * sv) / 0.012) * (cv > 0 ? 1 : 0.4);
      const n = fbm3(t * 6, cv * 2, sv * 2, seed, 3);
      r = r * (1 + n * 0.05) - groove * prof;
      const px = sx * (1 + cv * r);
      const py = sy * (1 + cv * r);
      const pz = sv * r * 0.8;
      positions.push(px * scale, py * scale, pz * scale);
      uvs.push(t, j / V);
      let c = mix(hex(0xe9d6a8), hex(0xf4e7c4), clamp(n * 2 + 0.5));
      c = mix(c, hex(0xc99a5c), clamp(fbm3(t * 9, cv * 3, sv * 3, seed + 5, 2) * 1.6 - 0.1)); // toasted patches
      c = mix(c, hex(0xb98a50), groove * 8);
      colors.push(...lin(c));
    }
  }
  for (let i = 0; i < U; i++)
    for (let j = 0; j < V; j++) {
      const a = i * (V + 1) + j, b = a + V + 1;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  g.setIndex(indices);
  g.computeVertexNormals();
  g.translate(0, -0.55 * scale, 0);
  g.computeBoundingSphere();
  return g;
}

// ---------- public API ----------

export type SimpleKind = Exclude<ModelKind, "mixed">;

/** Real-world size (approx. longest dimension / 2, in metres). */
export const KIND_SCALE: Record<SimpleKind, number> = {
  apricot: 0.021,
  "apricot-sun": 0.019,
  cashew: 0.0125,
  date: 0.019,
  fig: 0.022,
  raisin: 0.0075,
  "raisin-black": 0.0072,
  hazelnut: 0.0085,
  pistachio: 0.0105,
  almond: 0.0118,
  walnut: 0.0135,
  prune: 0.016,
};

/** Items that rest flat in a pile (rotate mostly around Y). */
export const FLAT_KINDS = new Set<SimpleKind>(["apricot", "apricot-sun", "fig", "walnut", "almond"]);

export const MIXED_KINDS: SimpleKind[] = ["cashew", "hazelnut", "almond", "pistachio", "walnut"];

export const MATERIAL_PARAMS: Record<SimpleKind, { roughness: number; clearcoat: number; sheen: number }> = {
  apricot: { roughness: 0.5, clearcoat: 0.35, sheen: 0.4 },
  "apricot-sun": { roughness: 0.55, clearcoat: 0.25, sheen: 0.3 },
  cashew: { roughness: 0.72, clearcoat: 0.0, sheen: 0.2 },
  date: { roughness: 0.3, clearcoat: 0.7, sheen: 0.1 },
  fig: { roughness: 0.85, clearcoat: 0.0, sheen: 0.5 },
  raisin: { roughness: 0.38, clearcoat: 0.5, sheen: 0.2 },
  "raisin-black": { roughness: 0.35, clearcoat: 0.6, sheen: 0.2 },
  hazelnut: { roughness: 0.6, clearcoat: 0.1, sheen: 0.1 },
  pistachio: { roughness: 0.7, clearcoat: 0.0, sheen: 0.1 },
  almond: { roughness: 0.68, clearcoat: 0.05, sheen: 0.2 },
  walnut: { roughness: 0.75, clearcoat: 0.0, sheen: 0.3 },
  prune: { roughness: 0.3, clearcoat: 0.7, sheen: 0.1 },
};

const cache = new Map<string, THREE.BufferGeometry>();

export function nutGeometry(kind: SimpleKind, detail: Detail, seed = 1, unitScale = false) {
  const key = `${kind}|${detail}|${seed}|${unitScale}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const scale = unitScale ? KIND_SCALE[kind] / KIND_SCALE.apricot : KIND_SCALE[kind];
  let g: THREE.BufferGeometry;
  switch (kind) {
    case "apricot": g = sculptSphere(detail, seed, scale, apricot(false)); break;
    case "apricot-sun": g = sculptSphere(detail, seed, scale, apricot(true)); break;
    case "date": g = sculptSphere(detail, seed, scale, date); break;
    case "fig": g = sculptSphere(detail, seed, scale, fig); break;
    case "raisin": g = sculptSphere(detail, seed, scale, raisin(false)); break;
    case "raisin-black": g = sculptSphere(detail, seed, scale, raisin(true)); break;
    case "prune": g = sculptSphere(detail, seed, scale, prune); break;
    case "hazelnut": g = sculptSphere(detail, seed, scale, hazelnut); break;
    case "pistachio": g = sculptSphere(detail, seed, scale, pistachio); break;
    case "almond": g = sculptSphere(detail, seed, scale, almond); break;
    case "walnut": g = sculptSphere(detail, seed, scale, walnut); break;
    case "cashew": g = cashew(detail, seed, scale); break;
  }
  cache.set(key, g);
  return g;
}

let bumpTex: THREE.Texture | null = null;
/** Tiny tileable micro-surface bump texture shared by all products. */
export function microBumpTexture() {
  if (bumpTex || typeof document === "undefined") return bumpTex;
  const size = 128;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  const img = ctx.createImageData(size, size);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const a = (x / size) * Math.PI * 2, b = (y / size) * Math.PI * 2;
      const v = fbm3(Math.cos(a) * 3 + 9, Math.sin(a) * 3, Math.cos(b) * 3 + Math.sin(b) * 3, 7, 4);
      const g = Math.floor(clamp(v * 0.9 + 0.5) * 255);
      const i = (y * size + x) * 4;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = g;
      img.data[i + 3] = 255;
    }
  ctx.putImageData(img, 0, 0);
  bumpTex = new THREE.CanvasTexture(c);
  bumpTex.wrapS = bumpTex.wrapT = THREE.RepeatWrapping;
  bumpTex.repeat.set(3, 3);
  return bumpTex;
}

const matCache = new Map<string, THREE.Material>();
export function nutMaterial(kind: SimpleKind, quality: "low" | "medium" | "high") {
  const key = `${kind}|${quality}`;
  const hit = matCache.get(key);
  if (hit) return hit;
  const p = MATERIAL_PARAMS[kind];
  let m: THREE.Material;
  if (quality === "low") {
    m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: p.roughness, metalness: 0 });
  } else {
    const bump = microBumpTexture();
    m = new THREE.MeshPhysicalMaterial({
      vertexColors: true,
      roughness: p.roughness,
      metalness: 0,
      clearcoat: p.clearcoat,
      clearcoatRoughness: 0.45,
      sheen: p.sheen,
      sheenRoughness: 0.6,
      sheenColor: new THREE.Color(0x8a6a4a),
      bumpMap: bump ?? undefined,
      bumpScale: 0.6,
    });
  }
  matCache.set(key, m);
  return m;
}

/** Average display colour (used for pile "filler" beds under instances). */
export const KIND_BED_COLOR: Record<SimpleKind, string> = {
  apricot: "#b8661c",
  "apricot-sun": "#3e1e0e",
  cashew: "#b89566",
  date: "#2c1307",
  fig: "#7a5a36",
  raisin: "#6b3410",
  "raisin-black": "#140a0c",
  hazelnut: "#5e391a",
  pistachio: "#9c8460",
  almond: "#5e331a",
  walnut: "#7a5a32",
  prune: "#0d0507",
};

/** sRGB palette [dark, mid, light] used for the textured bed under each pile. */
export const KIND_PALETTE: Record<SimpleKind, string[]> = {
  apricot: ["#c86414", "#ec9a3a", "#f7bd5c", "#e08a2a"],
  "apricot-sun": ["#3c1c0d", "#6e3a1c", "#8f5428", "#55290f"],
  cashew: ["#c99a5c", "#e9d6a8", "#f4e7c4", "#dcc08a"],
  date: ["#2a1006", "#5a2810", "#8c4a1f", "#401a08"],
  fig: ["#7a5a36", "#9b7346", "#cfac7a", "#b08a5a"],
  raisin: ["#5a2408", "#8a3f14", "#d08a30", "#b06420"],
  "raisin-black": ["#0e0507", "#2a1418", "#3d1d24", "#1a0b0e"],
  hazelnut: ["#4f2c12", "#8a5428", "#b07a44", "#6e4020"],
  pistachio: ["#b08f63", "#d9c29a", "#eadbbd", "#7f9a3a"],
  almond: ["#5a2e16", "#7a4424", "#a6683c", "#6a3a1e"],
  walnut: ["#6d4422", "#c29a62", "#dcbd88", "#a07a48"],
  prune: ["#070304", "#1c0d10", "#3d1c24", "#120709"],
};
