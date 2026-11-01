// Renders product thumbnails from the procedural 3D models.
// Usage: npm run build && (serve ./out on :4173) && node scripts/render-thumbnails.cjs
// (Playwright may be installed globally: NODE_PATH=$(npm root -g) node scripts/render-thumbnails.cjs)
// Requires Playwright + Python Pillow (for WebP conversion).
const { chromium } = require("playwright");
const { execFileSync } = require("node:child_process");
const { mkdirSync } = require("node:fs");

(async () => {
const base = process.env.BASE_URL ?? "http://localhost:4173";
const ids = (process.env.IDS ?? "kuru-kayisi,gun-kurusu-kayisi,hurma,kuru-incir,siyah-uzum,kuru-erik,findik,antep-fistigi,badem,ceviz,karisik,turk-kahvesi,meyve-cayi,lokum,dubai-cikolatasi").split(",");
const files = { "turk-kahvesi": "paket-kahve", "meyve-cayi": "paket-cay", "dubai-cikolatasi": "dubai" };
mkdirSync("public/products", { recursive: true });
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const page = await browser.newPage({ viewport: { width: 640, height: 640 } });
for (const id of ids) {
  await page.goto(`${base}/studio/?p=${id}`, { waitUntil: "load" });
  await page.waitForSelector("canvas");
  await page.waitForTimeout(Number(process.env.WAIT ?? 9000));
  const png = `public/products/${files[id] ?? id}.png`;
  await page.locator("canvas").screenshot({ path: png, omitBackground: true });
  execFileSync("python3", ["-c", `from PIL import Image; im=Image.open('${png}'); im.save('${png.replace(".png", ".webp")}', 'WEBP', quality=86)`]);
  execFileSync("rm", [png]);
  console.log("rendered", id);
}
await browser.close();
})();
