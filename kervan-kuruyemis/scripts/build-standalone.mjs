// Builds ONE self-contained HTML file (JS, CSS, fonts, photos inlined) → standalone/kervan-kuruyemis.html
// Usage: node scripts/build-standalone.mjs
import { build } from "esbuild";
import postcss from "postcss";
import tailwind from "@tailwindcss/postcss";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const b64 = (p) => readFileSync(p).toString("base64");
const mime = { jpg: "image/jpeg", webp: "image/webp", svg: "image/svg+xml", png: "image/png" };

// 1) JS bundle (dynamic imports inlined, next/dynamic shimmed)
const res = await build({
  entryPoints: ["standalone/main.tsx"],
  bundle: true,
  minify: true,
  format: "iife",
  target: "es2020",
  write: false,
  jsx: "automatic",
  define: { "process.env.NODE_ENV": '"production"' },
  alias: { "next/dynamic": path.join(root, "standalone/next-dynamic-shim.tsx"), "@": path.join(root, "src") },
  logLevel: "warning",
});
let js = res.outputFiles[0].text;

// 2) inline images referenced by path
js = js.replace(/\/(photos|products)\/[\w-]+\.(jpg|webp)/g, (m) => {
  const f = path.join(root, "public", m);
  if (!existsSync(f)) return m;
  return `data:${mime[m.split(".").pop()]};base64,${b64(f)}`;
});

// 3) CSS: Tailwind + fonts (latin + latin-ext only)
const css = (await postcss([tailwind({ base: root })]).process(readFileSync("src/app/globals.css", "utf8"), { from: path.join(root, "src/app/globals.css") })).css;
const LATIN = "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD";
const LATIN_EXT = "U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF";
const faces = [
  ["Fraunces", "fraunces", 400, "normal"], ["Fraunces", "fraunces", 600, "normal"], ["Fraunces", "fraunces", 400, "italic"],
  ["Manrope", "manrope", 400, "normal"], ["Manrope", "manrope", 500, "normal"], ["Manrope", "manrope", 700, "normal"], ["Manrope", "manrope", 800, "normal"],
  ["Nunito", "nunito", 600, "normal"],
];
let fontCss = "";
for (const [fam, pkg, w, st] of faces)
  for (const [sub, range] of [["latin", LATIN], ["latin-ext", LATIN_EXT]]) {
    const f = path.join(root, `node_modules/@fontsource/${pkg}/files/${pkg}-${sub}-${w}-${st}.woff2`);
    fontCss += `@font-face{font-family:"${fam}";font-style:${st};font-weight:${w};font-display:swap;src:url(data:font/woff2;base64,${b64(f)}) format("woff2");unicode-range:${range}}\n`;
  }

const favicon = `data:image/svg+xml;base64,${b64("public/favicon.svg")}`;
const og = "Yalova Merkez, Cumhuriyet Caddesi No:8'deki Kervan Kuruyemiş mağazasını 3 boyutlu olarak gezin.";
const html = `<!doctype html>
<html lang="tr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#b52530">
<title>Kervan Kuruyemiş · Yalova — 3D Mağaza Deneyimi</title>
<meta name="description" content="${og}">
<link rel="icon" href="${favicon}">
<style>${fontCss}${css}</style>
</head><body><div id="root"></div>
<script>${js.replace(/<\/script/gi, "<\\/script")}</script>
</body></html>`;
writeFileSync("standalone/kervan-kuruyemis.html", html);
console.log("standalone/kervan-kuruyemis.html", (html.length / 1024 / 1024).toFixed(2), "MB");
