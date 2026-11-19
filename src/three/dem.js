/**
 * GERÇEK YALOVA ARAZİSİ — Copernicus DEM GLO-30
 *
 * Veri, Copernicus DEM GLO-30 (N40 E029 karosu) kullanılarak 18 km × 18 km'lik bir alan için
 * TUREF / TM30 (EPSG:5254) projeksiyonunda düzenli bir ağa örneklenmiştir (46,875 m aralık).
 *  - Yerel metrik koordinat (e, n): ağ merkezine göre TM30 doğu/kuzey farkı (m).
 *    Gerçek TM30 koordinatı: Y = origin.Y + e (sağa), X = origin.X + n (yukarı).
 *  - Enlem/boylam (WGS84), (e, n)'den kübik polinomla hesaplanır (doğrulanmış hata ≈ 0 m).
 *  - Yükseklik: DEM yüzey yüksekliği (EGM2008), metre. Bir sayısal YÜZEY modelidir
 *    (bina ve bitki örtüsü dahil); arazi ölçümü veya resmi kot değildir.
 * Ağ dosyası: Int16, desimetre, satır satır kuzeyden güneye, little-endian.
 * Üretim betiği: README'deki "Gerçek arazi verisi" bölümüne bakın.
 */
import meta from '../data/yalova-dem.json';
import demUrl from '../data/yalova-dem.bin?url';
import demLowUrl from '../data/yalova-dem-low.bin?url'; // her ikinci örnek (193×193), mobil için

export const YALOVA = meta;
export const REGION_EXAG = 2.5; // düşey abartma (yalnızca görsel)
const SCENE_WIDTH = 40; // sahne birimi: temsili araziyle aynı genişlik, kamera/sis ayarları ortak kalsın

const loading = new Map();
const grids = new Map();

function loadHeights(url) {
  if (!loading.has(url)) {
    loading.set(url, fetch(url).then((r) => {
      if (!r.ok) throw new Error(`Yükseklik verisi yüklenemedi (HTTP ${r.status})`);
      return r.arrayBuffer().then((b) => new Int16Array(b));
    }));
  }
  return loading.get(url);
}

/** quality: 'high' → 385×385 köşe, 'low' → 193×193 (her ikinci örnek) */
export async function loadYalova(quality = 'high') {
  const factor = quality === 'high' ? 1 : 2;
  if (grids.has(factor)) return grids.get(factor);
  const raw = await loadHeights(factor === 1 ? demUrl : demLowUrl);
  const res = meta.res / factor;
  const N = res + 1;
  if (raw.length !== N * N) throw new Error('Yükseklik verisi beklenen boyutta değil');
  const h = new Float32Array(N * N);
  let min = Infinity;
  let max = -Infinity;
  for (let j = 0; j < N; j++) {
    for (let i = 0; i < N; i++) {
      const v = raw[j * N + i] * meta.heightScale;
      h[j * N + i] = v;
      if (v < min) min = v;
      if (v > max) max = v;
    }
  }
  const s = SCENE_WIDTH / meta.size;
  const g = {
    id: `yalova${res}`,
    res,
    N,
    step: meta.size / res,
    h,
    min,
    max,
    size: meta.size,
    s,
    ys: s * REGION_EXAG,
    cs: 10, // renk skalaları ~0–900 m aralığına ölçeklenir
    sea: 0.5, // DEM'de deniz yüzeyi ≈ 0 m; altı deniz olarak renklendirilir
    real: true,
  };
  grids.set(factor, g);
  return g;
}

/** Yerel (e, n) → gerçek TUREF/TM30 koordinatı */
export function toTM30(e, n) {
  return { Y: meta.origin.Y + e, X: meta.origin.X + n };
}

/** Yerel (e, n) → WGS84 enlem/boylam (derece) */
export function toLatLon(e, n) {
  const { scale, lat, lon } = meta.geoFit;
  const x = e / scale;
  const y = n / scale;
  const t = [1, x, y, x * x, x * y, y * y, x ** 3, x * x * y, x * y * y, y ** 3];
  let la = 0;
  let lo = 0;
  for (let k = 0; k < t.length; k++) {
    la += lat[k] * t[k];
    lo += lon[k] * t[k];
  }
  return { lat: la, lon: lo };
}
