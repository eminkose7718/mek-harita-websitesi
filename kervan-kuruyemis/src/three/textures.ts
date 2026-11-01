import * as THREE from "three";
import { KERVAN_LOGO_PATH, KERVAN_LOGO_VIEWBOX } from "@/lib/logo";
import { mulberry32 } from "./noise";

/** All textures are generated at runtime from canvas → no external image downloads for the 3D scene. */

const texCache = new Map<string, THREE.Texture>();

function canvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return [c, c.getContext("2d")!] as const;
}

function finish(c: HTMLCanvasElement, opts: { repeat?: [number, number]; srgb?: boolean; aniso?: number } = {}) {
  const t = new THREE.CanvasTexture(c);
  if (opts.srgb !== false) t.colorSpace = THREE.SRGBColorSpace;
  if (opts.repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(opts.repeat[0], opts.repeat[1]);
  }
  t.anisotropy = opts.aniso ?? 4;
  t.needsUpdate = true;
  return t;
}

function cached(key: string, make: () => THREE.Texture) {
  let t = texCache.get(key);
  if (!t) {
    t = make();
    texCache.set(key, t);
  }
  return t;
}

/** White 60×60 ceramic floor tiles with soft grout & subtle tone variation. One canvas = 4×4 tiles. */
export const floorTileTexture = () =>
  cached("floor", () => {
    const [c, g] = canvas(1024, 1024);
    const rnd = mulberry32(3);
    const n = 4, s = 1024 / n;
    g.fillStyle = "#cfcac2";
    g.fillRect(0, 0, 1024, 1024);
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++) {
        const v = 236 + Math.floor(rnd() * 10);
        const grd = g.createLinearGradient(i * s, j * s, (i + 1) * s, (j + 1) * s);
        grd.addColorStop(0, `rgb(${v},${v - 1},${v - 4})`);
        grd.addColorStop(1, `rgb(${v - 6},${v - 7},${v - 10})`);
        g.fillStyle = grd;
        g.fillRect(i * s + 3, j * s + 3, s - 6, s - 6);
        for (let k = 0; k < 120; k++) {
          g.fillStyle = `rgba(150,140,130,${rnd() * 0.05})`;
          g.fillRect(i * s + rnd() * s, j * s + rnd() * s, 2 + rnd() * 6, 1 + rnd() * 3);
        }
      }
    return finish(c, { repeat: [1, 1], aniso: 8 });
  });

export const sidewalkTexture = () =>
  cached("sidewalk", () => {
    const [c, g] = canvas(1024, 1024);
    const rnd = mulberry32(9);
    g.fillStyle = "#4a4744";
    g.fillRect(0, 0, 1024, 1024);
    const cols = 8, rows = 4;
    const w = 1024 / cols, h = 1024 / rows;
    for (let r = 0; r < rows; r++)
      for (let k = 0; k < cols + 1; k++) {
        const off = r % 2 ? w / 2 : 0;
        const v = 120 + Math.floor(rnd() * 40);
        g.fillStyle = `rgb(${v},${v - 4},${v - 10})`;
        g.fillRect(k * w - off + 3, r * h + 3, w - 6, h - 6);
        for (let q = 0; q < 160; q++) {
          const d = Math.floor(rnd() * 30) - 15;
          g.fillStyle = `rgba(${v + d},${v + d - 4},${v + d - 10},0.6)`;
          g.fillRect(k * w - off + rnd() * w, r * h + rnd() * h, 2, 2);
        }
      }
    return finish(c, { repeat: [3, 1], aniso: 8 });
  });

export const asphaltTexture = () =>
  cached("asphalt", () => {
    const [c, g] = canvas(512, 512);
    const rnd = mulberry32(12);
    g.fillStyle = "#26272a";
    g.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 9000; i++) {
      const v = 30 + Math.floor(rnd() * 40);
      g.fillStyle = `rgba(${v},${v},${v + 3},0.7)`;
      g.fillRect(rnd() * 512, rnd() * 512, 1.5, 1.5);
    }
    return finish(c, { repeat: [6, 3] });
  });

/** Dark walnut wood grain (counters). */
export const woodTexture = () =>
  cached("wood", () => {
    const [c, g] = canvas(512, 512);
    const rnd = mulberry32(21);
    g.fillStyle = "#3a2318";
    g.fillRect(0, 0, 512, 512);
    for (let y = 0; y < 512; y += 1) {
      const v = Math.sin(y * 0.07 + Math.sin(y * 0.013) * 6) * 0.5 + 0.5;
      g.fillStyle = `rgba(${90 + v * 40},${55 + v * 25},${35 + v * 15},${0.25 + rnd() * 0.15})`;
      g.fillRect(0, y, 512, 1);
    }
    for (let i = 0; i < 40; i++) {
      g.strokeStyle = `rgba(25,12,8,${0.15 + rnd() * 0.2})`;
      g.lineWidth = 0.6 + rnd() * 1.4;
      g.beginPath();
      const y0 = rnd() * 512;
      g.moveTo(0, y0);
      for (let x = 0; x <= 512; x += 32) g.lineTo(x, y0 + Math.sin(x * 0.01 + i) * 10);
      g.stroke();
    }
    return finish(c, { repeat: [2, 1] });
  });

/** Upper-floor window glass: dark reflective glass with interior blinds. */
export const blindsTexture = () =>
  cached("blinds", () => {
    const [c, g] = canvas(256, 256);
    g.fillStyle = "#1b1d22";
    g.fillRect(0, 0, 256, 256);
    for (let y = 0; y < 256; y += 8) {
      g.fillStyle = "rgba(170,172,178,0.55)";
      g.fillRect(0, y, 256, 5);
      g.fillStyle = "rgba(255,255,255,0.12)";
      g.fillRect(0, y, 256, 1);
    }
    return finish(c);
  });

/** Lit windows for background buildings. */
export function windowsTexture(seed: number, litRatio = 0.35) {
  return cached(`windows${seed}${litRatio}`, () => {
    const [c, g] = canvas(256, 512);
    const rnd = mulberry32(seed);
    g.fillStyle = "#16151a";
    g.fillRect(0, 0, 256, 512);
    for (let y = 0; y < 8; y++)
      for (let x = 0; x < 4; x++) {
        const lit = rnd() < litRatio;
        const warm = rnd();
        g.fillStyle = lit
          ? warm > 0.3
            ? `rgb(${230 + rnd() * 25},${170 + rnd() * 40},${90 + rnd() * 40})`
            : `rgb(${170 + rnd() * 40},${200 + rnd() * 30},${235})`
          : `rgb(${24 + rnd() * 12},${26 + rnd() * 12},${34 + rnd() * 12})`;
        g.fillRect(x * 64 + 10, y * 64 + 12, 44, 40);
      }
    return finish(c);
  });
}

/** Building plaster/stucco. */
export function plasterTexture(base: string, seed = 1) {
  return cached(`plaster${base}${seed}`, () => {
    const [c, g] = canvas(256, 256);
    const rnd = mulberry32(seed);
    g.fillStyle = base;
    g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 4000; i++) {
      g.fillStyle = rnd() > 0.5 ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.07)";
      g.fillRect(rnd() * 256, rnd() * 256, 2, 2);
    }
    for (let i = 0; i < 18; i++) {
      g.fillStyle = "rgba(40,25,15,0.05)";
      g.fillRect(rnd() * 256, rnd() * 256, 3, 30 + rnd() * 90);
    }
    return finish(c, { repeat: [2, 2] });
  });
}

/** Red awning fabric with lighter valance band (as in the storefront photo). */
export const awningTexture = () =>
  cached("awning", () => {
    const [c, g] = canvas(512, 256);
    const grd = g.createLinearGradient(0, 0, 0, 256);
    grd.addColorStop(0, "#7e1418");
    grd.addColorStop(1, "#9c1d22");
    g.fillStyle = grd;
    g.fillRect(0, 0, 512, 256);
    for (let x = 0; x < 512; x += 3) {
      g.fillStyle = `rgba(0,0,0,${0.03 + (x % 6 ? 0 : 0.03)})`;
      g.fillRect(x, 0, 1, 256);
    }
    return finish(c);
  });

// ---------------------------------------------------------------------------
// The Kervan sign — built from the logo traced from the real storefront photo.
// ---------------------------------------------------------------------------

export type SignTextures = { base: THREE.Texture; leds: THREE.Texture; aspect: number };

const SIGN_W = 2048;
const SIGN_H = 740; // ≈ 3.85m × 1.39m

function logoTransform() {
  const [vx, vy, vw, vh] = KERVAN_LOGO_VIEWBOX.split(" ").map(Number);
  // Place the logo like the real sign: left-aligned script on the upper 2/3
  const targetW = SIGN_W * 0.83;
  const s = targetW / vw;
  const ox = SIGN_W * 0.075 - vx * s;
  const oy = SIGN_H * 0.08 - vy * s;
  return { s, ox, oy, vh, vw };
}

/** Collects LED points along the logo contour (offset outward) and inside "Kuruyemiş" glyphs. */
let ledCache: { x: number; y: number; r: number; kind: 0 | 1 }[] | null = null;
function ledPoints() {
  if (ledCache) return ledCache;
  const pts: { x: number; y: number; r: number; kind: 0 | 1 }[] = [];
  const { s, ox, oy } = logoTransform();
  const path = new Path2D(KERVAN_LOGO_PATH);

  // contour sampling via an SVG path element (needs to be attached for reliable length APIs)
  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("style", "position:absolute;width:0;height:0;overflow:hidden;visibility:hidden");
  const p = document.createElementNS(svgNS, "path");
  svg.appendChild(p);
  document.body.appendChild(svg);
  const [, mctx] = canvas(8, 8);
  // split into sub-paths so moves don't create "jump" samples
  const subs = KERVAN_LOGO_PATH.split(/(?=M)/).filter((x) => x.trim().length);
  const spacing = 15 / s; // px → logo units
  const offset = 7 / s;
  for (const d of subs) {
    p.setAttribute("d", d);
    const len = p.getTotalLength();
    if (len < spacing * 3) continue;
    const n = Math.floor(len / spacing);
    for (let i = 0; i < n; i++) {
      const l = (i / n) * len;
      const a = p.getPointAtLength(l);
      const b = p.getPointAtLength(Math.min(len, l + spacing * 0.3));
      let nx = -(b.y - a.y), ny = b.x - a.x;
      const nl = Math.hypot(nx, ny) || 1;
      nx /= nl;
      ny /= nl;
      // choose the normal that points OUT of the filled glyph
      const tx = a.x + nx * offset, ty = a.y + ny * offset;
      if (mctx.isPointInPath(path, tx, ty, "evenodd")) {
        nx = -nx;
        ny = -ny;
      }
      pts.push({ x: (a.x + nx * offset) * s + ox, y: (a.y + ny * offset) * s + oy, r: 4.2, kind: 0 });
    }
  }
  svg.remove();

  // "Kuruyemiş" — dot-matrix LED lettering (sans, like the photo)
  const [mc, m] = canvas(SIGN_W, SIGN_H);
  m.fillStyle = "#000";
  m.fillRect(0, 0, SIGN_W, SIGN_H);
  m.fillStyle = "#fff";
  m.font = `600 ${Math.round(SIGN_H * 0.23)}px "Nunito", "Arial Rounded MT Bold", sans-serif`;
  m.textBaseline = "alphabetic";
  m.textAlign = "right";
  m.fillText("Kuruyemiş", SIGN_W * 0.925, SIGN_H * 0.9);
  const data = m.getImageData(0, 0, SIGN_W, SIGN_H).data;
  const step = 13;
  for (let y = 0; y < SIGN_H; y += step)
    for (let x = (y / step) % 2 ? step / 2 : 0; x < SIGN_W; x += step) {
      const xi = Math.floor(x), yi = Math.floor(y);
      if (data[(yi * SIGN_W + xi) * 4] > 140) pts.push({ x, y, r: 4.6, kind: 1 });
    }
  void mc;
  ledCache = pts;
  return pts;
}

export const signTextures = (): SignTextures => {
  const base = cached("signBase", () => {
    const [c, g] = canvas(SIGN_W, SIGN_H);
    // backlit red panel
    const grd = g.createLinearGradient(0, 0, 0, SIGN_H);
    grd.addColorStop(0, "#c0262f");
    grd.addColorStop(0.5, "#b52530");
    grd.addColorStop(1, "#a11f29");
    g.fillStyle = grd;
    g.fillRect(0, 0, SIGN_W, SIGN_H);
    // aluminium frame
    g.strokeStyle = "#d9d9d6";
    g.lineWidth = 22;
    g.strokeRect(11, 11, SIGN_W - 22, SIGN_H - 22);
    g.strokeStyle = "rgba(0,0,0,0.25)";
    g.lineWidth = 3;
    g.strokeRect(24, 24, SIGN_W - 48, SIGN_H - 48);
    // logo letters: warm white
    const { s, ox, oy } = logoTransform();
    g.save();
    g.translate(ox, oy);
    g.scale(s, s);
    g.fillStyle = "#f6ece6";
    g.fill(new Path2D(KERVAN_LOGO_PATH), "evenodd");
    g.restore();
    // unlit LED sockets
    for (const p of ledPoints()) {
      g.fillStyle = "rgba(90,10,14,0.85)";
      g.beginPath();
      g.arc(p.x, p.y, p.r * 0.9, 0, Math.PI * 2);
      g.fill();
    }
    // building number plate "8" (seen on the real sign)
    g.fillStyle = "#e8e2dc";
    g.fillRect(SIGN_W - 120, SIGN_H - 100, 70, 62);
    g.fillStyle = "#b52530";
    g.font = `700 46px "Manrope", sans-serif`;
    g.textAlign = "center";
    g.fillText("8", SIGN_W - 85, SIGN_H - 52);
    return finish(c, { aniso: 8 });
  });

  const leds = cached("signLeds", () => {
    const [c, g] = canvas(SIGN_W, SIGN_H);
    g.clearRect(0, 0, SIGN_W, SIGN_H);
    // letter glow (alpha channel used as letter mask in the shader → G channel)
    const { s, ox, oy } = logoTransform();
    g.save();
    g.translate(ox, oy);
    g.scale(s, s);
    g.fillStyle = "rgb(0,255,0)";
    g.fill(new Path2D(KERVAN_LOGO_PATH), "evenodd");
    g.restore();
    g.globalCompositeOperation = "lighter";
    for (const p of ledPoints()) {
      const grd = g.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 1.6);
      grd.addColorStop(0, p.kind ? "rgb(255,0,255)" : "rgb(255,0,0)");
      grd.addColorStop(0.55, p.kind ? "rgb(200,0,200)" : "rgb(200,0,0)");
      grd.addColorStop(1, "rgb(0,0,0)");
      g.fillStyle = grd;
      g.beginPath();
      g.arc(p.x, p.y, p.r * 1.6, 0, Math.PI * 2);
      g.fill();
    }
    // R = contour LEDs, B = "Kuruyemiş" LEDs, G = letter mask
    return finish(c, { srgb: false, aniso: 8 });
  });

  return { base, leds, aspect: SIGN_W / SIGN_H };
};

/** Vertical "KERVAN KURUYEMİŞ" blade sign on the red pilaster. */
export const verticalSignTexture = () =>
  cached("vsign", () => {
    const [c, g] = canvas(128, 1024);
    g.fillStyle = "#b52530";
    g.fillRect(0, 0, 128, 1024);
    g.strokeStyle = "#e8e2dc";
    g.lineWidth = 6;
    g.strokeRect(6, 6, 116, 1012);
    g.fillStyle = "#ffffff";
    g.font = `800 60px "Manrope", sans-serif`;
    g.textAlign = "center";
    const letters = "KERVAN KURUYEMİŞ".split("");
    const step = 1000 / letters.length;
    letters.forEach((ch, i) => g.fillText(ch, 64, 60 + i * step));
    return finish(c);
  });

/** "GİRİŞ / DİKKAT OTOMATİK KAPI" sticker on the sliding door (seen in the photo). */
export const doorStickerTexture = () =>
  cached("sticker", () => {
    const [c, g] = canvas(256, 160);
    g.fillStyle = "#f4f2ee";
    g.fillRect(0, 0, 256, 160);
    g.fillStyle = "#1c1c1c";
    g.font = `800 34px "Manrope", sans-serif`;
    g.textAlign = "center";
    g.fillText("GİRİŞ", 128, 46);
    g.font = `700 24px "Manrope", sans-serif`;
    g.fillText("DİKKAT", 128, 86);
    g.fillText("OTOMATİK KAPI", 128, 122);
    return finish(c);
  });

// ---------------------------------------------------------------------------
// Packaging atlas (generic designs — no third-party brand names are reproduced).
// 4×4 cells. Index layout documented in PACK.
// ---------------------------------------------------------------------------

export const PACK = {
  coffeeWhite: 0, coffeeGreen: 1, coffeeGold: 2, teaRed: 3,
  teaYellow: 4, teaPurple: 5, nutBagClear: 6, nutBagGreen: 7,
  chocolateGold: 8, lokumPink: 9, lokumGreen: 10, lokumBlue: 11,
  barRed: 12, jarHoney: 13, boxBrown: 14, bagOrange: 15,
} as const;

export const packAtlasTexture = () =>
  cached("packAtlas", () => {
    const S = 256;
    const [c, g] = canvas(S * 4, S * 4);
    const rnd = mulberry32(5);
    const cell = (i: number) => [(i % 4) * S, Math.floor(i / 4) * S] as const;
    const label = (x: number, y: number, text: string, color: string, size = 26) => {
      g.fillStyle = color;
      g.font = `800 ${size}px "Manrope", sans-serif`;
      g.textAlign = "center";
      g.fillText(text, x + S / 2, y);
    };
    const nuts = (x: number, y: number, w: number, h: number, col: string[]) => {
      for (let i = 0; i < 80; i++) {
        g.fillStyle = col[Math.floor(rnd() * col.length)];
        g.beginPath();
        g.ellipse(x + rnd() * w, y + rnd() * h, 6 + rnd() * 6, 4 + rnd() * 5, rnd() * 3, 0, Math.PI * 2);
        g.fill();
      }
    };
    const pattern = (x: number, y: number, col: string) => {
      g.strokeStyle = col;
      g.lineWidth = 2;
      for (let i = 0; i < 6; i++)
        for (let j = 0; j < 6; j++) {
          g.beginPath();
          g.arc(x + i * 44 + 20, y + j * 44 + 20, 12, 0, Math.PI * 2);
          g.stroke();
        }
    };
    const designs: ((x: number, y: number) => void)[] = [
      (x, y) => { g.fillStyle = "#f2efe8"; g.fillRect(x, y, S, S); pattern(x, y, "rgba(150,110,60,0.25)"); g.fillStyle = "#6b4630"; g.fillRect(x + 40, y + 70, S - 80, 60); label(x, y + 110, "KAHVE", "#f2efe8"); g.fillStyle = "#3a2318"; g.beginPath(); g.ellipse(x + S / 2, y + 190, 36, 18, 0, 0, Math.PI * 2); g.fill(); },
      (x, y) => { g.fillStyle = "#e9ece4"; g.fillRect(x, y, S, S); pattern(x, y, "rgba(40,90,60,0.3)"); g.fillStyle = "#2c5a3e"; g.fillRect(x + 40, y + 70, S - 80, 60); label(x, y + 110, "KAHVE", "#e9ece4"); },
      (x, y) => { g.fillStyle = "#efe5d2"; g.fillRect(x, y, S, S); pattern(x, y, "rgba(170,120,40,0.35)"); g.fillStyle = "#a4772e"; g.fillRect(x + 40, y + 70, S - 80, 60); label(x, y + 110, "KAHVE", "#fff"); },
      (x, y) => { g.fillStyle = "#b0262c"; g.fillRect(x, y, S, S); g.fillStyle = "#fff"; g.fillRect(x, y, S, 50); label(x, y + 36, "ÇAY", "#b0262c"); g.fillStyle = "#d9433a"; g.beginPath(); g.arc(x + 128, y + 160, 56, 0, Math.PI * 2); g.fill(); },
      (x, y) => { g.fillStyle = "#f3d23a"; g.fillRect(x, y, S, S); g.fillStyle = "#fff"; g.fillRect(x, y, S, 50); label(x, y + 36, "ÇAY", "#b0262c"); g.fillStyle = "#f0e070"; g.beginPath(); g.arc(x + 128, y + 160, 56, 0, Math.PI * 2); g.fill(); },
      (x, y) => { g.fillStyle = "#5a2346"; g.fillRect(x, y, S, S); g.fillStyle = "#fff"; g.fillRect(x, y, S, 50); label(x, y + 36, "ÇAY", "#b0262c"); nuts(x + 60, y + 110, 140, 100, ["#2a0f22", "#3b1630", "#6a2a50"]); },
      (x, y) => { g.fillStyle = "rgba(235,228,214,1)"; g.fillRect(x, y, S, S); nuts(x, y, S, S, ["#c79b62", "#b98a50", "#d9b27a", "#a5743f"]); g.fillStyle = "#b52530"; g.fillRect(x + 30, y + 20, S - 60, 34); label(x, y + 46, "KURUYEMİŞ", "#fff", 20); },
      (x, y) => { g.fillStyle = "#4f8a3a"; g.fillRect(x, y, S, S); g.fillStyle = "#e9f0e0"; g.fillRect(x + 20, y + 90, S - 40, 120); nuts(x + 30, y + 100, S - 60, 100, ["#7f9a3a", "#a7b85a", "#6a3a4a"]); label(x, y + 60, "FISTIKLI", "#fff", 24); },
      (x, y) => { g.fillStyle = "#c9a548"; g.fillRect(x, y, S, S); const gr = g.createLinearGradient(x, y, x + S, y + S); gr.addColorStop(0, "rgba(255,240,180,0.6)"); gr.addColorStop(1, "rgba(120,80,20,0.3)"); g.fillStyle = gr; g.fillRect(x, y, S, S); label(x, y + 140, "ÇİKOLATA", "#5a3a10", 28); },
      (x, y) => { g.fillStyle = "#e6a0b8"; g.fillRect(x, y, S, S); g.strokeStyle = "#fff"; g.lineWidth = 6; g.strokeRect(x + 20, y + 20, S - 40, S - 40); label(x, y + 140, "LOKUM", "#7a2040", 32); },
      (x, y) => { g.fillStyle = "#6cc08a"; g.fillRect(x, y, S, S); g.strokeStyle = "#fff"; g.lineWidth = 6; g.strokeRect(x + 20, y + 20, S - 40, S - 40); label(x, y + 140, "LOKUM", "#1e5a34", 32); },
      (x, y) => { g.fillStyle = "#3a6ab0"; g.fillRect(x, y, S, S); g.strokeStyle = "#e0c070"; g.lineWidth = 6; g.strokeRect(x + 20, y + 20, S - 40, S - 40); label(x, y + 140, "HEDİYELİK", "#e0c070", 26); },
      (x, y) => { g.fillStyle = "#c22a2a"; g.fillRect(x, y, S, S); g.fillStyle = "#f6e7c8"; g.fillRect(x, y + 90, S, 76); nuts(x + 10, y + 96, S - 20, 64, ["#b97a3a", "#d7a15a"]); },
      (x, y) => { const gr = g.createLinearGradient(x, y, x, y + S); gr.addColorStop(0, "#e9a23a"); gr.addColorStop(1, "#a0561a"); g.fillStyle = gr; g.fillRect(x, y, S, S); g.fillStyle = "#f5efe2"; g.fillRect(x + 40, y + 90, S - 80, 70); label(x, y + 136, "BAL", "#7a3a10", 30); },
      (x, y) => { g.fillStyle = "#6b4630"; g.fillRect(x, y, S, S); g.strokeStyle = "#d9b27a"; g.lineWidth = 4; g.strokeRect(x + 16, y + 16, S - 32, S - 32); pattern(x, y, "rgba(217,178,122,0.25)"); },
      (x, y) => { g.fillStyle = "rgba(240,236,228,1)"; g.fillRect(x, y, S, S); nuts(x, y, S, S, ["#ec9a3a", "#f7bd5c", "#c86414"]); g.fillStyle = "#b52530"; g.fillRect(x + 30, y + 20, S - 60, 34); label(x, y + 46, "KURU MEYVE", "#fff", 20); },
    ];
    designs.forEach((d, i) => {
      const [x, y] = cell(i);
      d(x, y);
      g.fillStyle = "rgba(255,255,255,0.08)";
      g.fillRect(x, y, 10, S);
    });
    return finish(c, { aniso: 4 });
  });

/** Clear bulk bag full of nuts (large sacks of cashew/pistachio seen in the store photo). */
export function sackTexture(colors: string[], seed: number, sticker = true) {
  return cached(`sack${colors.join()}${seed}${sticker}`, () => {
    const [c, g] = canvas(256, 512);
    const rnd = mulberry32(seed);
    g.fillStyle = colors[0];
    g.fillRect(0, 0, 256, 512);
    for (let i = 0; i < 700; i++) {
      const x = rnd() * 256, y = rnd() * 512;
      const col = colors[Math.floor(rnd() * colors.length)];
      g.fillStyle = col;
      g.beginPath();
      g.ellipse(x, y, 9 + rnd() * 6, 6 + rnd() * 4, rnd() * Math.PI, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = "rgba(255,255,255,0.18)";
      g.beginPath();
      g.ellipse(x - 3, y - 2, 3, 2, 0, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = "rgba(0,0,0,0.18)";
      g.beginPath();
      g.ellipse(x + 3, y + 3, 6, 3, 0, 0, Math.PI * 2);
      g.fill();
    }
    if (sticker) {
      // price/label sticker
      g.fillStyle = "#fbfaf6";
      g.fillRect(70, 150, 116, 70);
      g.fillStyle = "#b52530";
      g.fillRect(70, 150, 116, 18);
    }
    return finish(c, sticker ? {} : { repeat: [1, 1] });
  });
}
