/**
 * DEMO COĞRAFİ VERİLER — TEMSİLİDİR.
 *
 * Aşağıdaki parseller, noktalar ve bina oturumu, temsili 3D arazi modeli üzerinde
 * eğitim amaçlı olarak tanımlanmıştır. Resmi kadastro kaydı, gerçek ölçüm veya
 * gerçek bir mülk DEĞİLDİR.
 *
 * Koordinatlar "yerel demo koordinat sistemi"ndedir: model merkezine göre metre
 * cinsinden doğu (e) ve kuzey (n). Arayüzde gösterilirken 5000 m'lik sahte başlangıç
 * değeri eklenir (Y = 5000 + e, X = 5000 + n) — bu değerler bilerek gerçek ülke
 * koordinatlarına benzemeyecek şekilde seçilmiştir.
 *
 * GERÇEK VERİ EKLEMEK İÇİN: GeoJSON FeatureCollection'ı `parseParcels(fc, crs)` ile
 * okuyun. Projeksiyonlu metrik bir sistemde (ör. TM / ITRF96 3°) koordinatlar için
 * crs = { kind: 'projected', name: '...', origin: [Y0, X0] } verin; origin, sahne merkezine
 * karşılık gelen koordinattır. Coğrafi koordinatlar (enlem/boylam, EPSG:4326) metre
 * DEĞİLDİR; önce proj4 gibi bir kütüphaneyle projeksiyonlu sisteme dönüştürülmelidir.
 */

export const LOCAL_CRS = {
  kind: 'local',
  name: 'Yerel demo koordinat sistemi (m)',
  falseEasting: 5000,
  falseNorthing: 5000,
};

/** Koordinatı yerel metrik (e, n) değerine çevirir */
export function toLocal([x, y], crs = LOCAL_CRS) {
  if (crs.kind === 'local') return [x, y];
  if (crs.kind === 'projected') return [x - crs.origin[0], y - crs.origin[1]];
  throw new Error(
    'Coğrafi koordinatlar (enlem/boylam) doğrudan metrik sahneye aktarılamaz. ' +
      'Önce proj4 ile uygun bir projeksiyonlu koordinat sistemine dönüştürün.',
  );
}

export function ringArea(ring) {
  let a = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    a += (ring[j][0] + ring[i][0]) * (ring[j][1] - ring[i][1]);
  }
  return Math.abs(a / 2);
}

export function ringPerimeter(ring) {
  let p = 0;
  for (let i = 0; i < ring.length; i++) {
    const [a, b] = [ring[i], ring[(i + 1) % ring.length]];
    p += Math.hypot(b[0] - a[0], b[1] - a[1]);
  }
  return p;
}

export function ringCentroid(ring) {
  const e = ring.reduce((s, p) => s + p[0], 0) / ring.length;
  const n = ring.reduce((s, p) => s + p[1], 0) / ring.length;
  return [e, n];
}

/** GeoJSON Polygon/MultiPolygon FeatureCollection → parsel listesi (yerel metrik) */
export function parseParcels(fc, crs = LOCAL_CRS) {
  const out = [];
  for (const f of fc.features) {
    const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
    for (const poly of polys) {
      let ring = poly[0].map((c) => toLocal(c, crs));
      const [f0, fl] = [ring[0], ring[ring.length - 1]];
      if (f0[0] === fl[0] && f0[1] === fl[1]) ring = ring.slice(0, -1);
      out.push({
        id: f.properties?.id ?? String(out.length + 1),
        label: f.properties?.label ?? '',
        demo: f.properties?.demo !== false,
        main: !!f.properties?.main,
        ring,
        area: ringArea(ring),
        perimeter: ringPerimeter(ring),
      });
    }
  }
  return out;
}

const K = { K1: [-18, -14], K2: [16, -16], K3: [19, 10], K4: [2, 17], K5: [-20, 12] };

/** Örnek parseller (GeoJSON, yerel demo koordinat sistemi) */
export const demoParcelsGeoJSON = {
  type: 'FeatureCollection',
  name: 'ornek-parseller',
  features: [
    { type: 'Feature', properties: { id: 'A', label: 'Örnek Parsel A', main: true, demo: true },
      geometry: { type: 'Polygon', coordinates: [[K.K1, K.K2, K.K3, K.K4, K.K5, K.K1]] } },
    { type: 'Feature', properties: { id: 'B', label: 'Örnek Parsel B', demo: true },
      geometry: { type: 'Polygon', coordinates: [[K.K2, [50, -18], [53, 8], K.K3, K.K2]] } },
    { type: 'Feature', properties: { id: 'C', label: 'Örnek Parsel C', demo: true },
      geometry: { type: 'Polygon', coordinates: [[[-52, -12], K.K1, K.K5, [-53, 10], [-52, -12]]] } },
    { type: 'Feature', properties: { id: 'D', label: 'Örnek Parsel D', demo: true },
      geometry: { type: 'Polygon', coordinates: [[K.K5, K.K4, K.K3, [21, 41], [-22, 39], K.K5]] } },
    { type: 'Feature', properties: { id: 'E', label: 'Örnek Parsel E', demo: true },
      geometry: { type: 'Polygon', coordinates: [[[-17, -46], [15, -48], K.K2, K.K1, [-17, -46]]] } },
  ],
};

export const parcels = parseParcels(demoParcelsGeoJSON);
export const mainParcel = parcels.find((p) => p.main);
export const parcelVertices = Object.entries(K).map(([id, [e, n]]) => ({ id, e, n }));

/** Örnek bina oturumu: 14 m × 11 m, parsel ön cephesine paralel */
const angle = Math.atan2(K.K2[1] - K.K1[1], K.K2[0] - K.K1[0]);
const center = [-1, 0];
const rot = ([x, y]) => [
  center[0] + x * Math.cos(angle) - y * Math.sin(angle),
  center[1] + x * Math.sin(angle) + y * Math.cos(angle),
];
export const building = {
  width: 14,
  depth: 11,
  floors: 3,
  floorHeight: 3,
  angle,
  center,
  corners: [[-7, -5.5], [7, -5.5], [7, 5.5], [-7, 5.5]].map(rot).map(([e, n], i) => ({ id: `B${i + 1}`, e, n })),
};

/** Örnek referans (röper / poligon) noktaları */
export const refPoints = [
  { id: 'RN-1', e: -36, n: -30 },
  { id: 'RN-2', e: 35, n: -29 },
  { id: 'RN-3', e: -31, n: 31 },
];

/** Temsili arazi üzerinde örnek ölçüm noktaları */
export const surveyPoints = [
  { id: 'P-01', e: -92, n: 48 },
  { id: 'P-02', e: -58, n: -64 },
  { id: 'P-03', e: 64, n: -52 },
  { id: 'P-04', e: 96, n: 30 },
  { id: 'P-05', e: 18, n: 82 },
  { id: 'P-06', e: -124, n: -18 },
  { id: 'P-07', e: 128, n: -104 },
  { id: 'P-08', e: -20, n: -118 },
];

export const fmt = (v, d = 2) =>
  v.toLocaleString('tr-TR', { minimumFractionDigits: d, maximumFractionDigits: d });

/** Yerel (e, n) → arayüzde gösterilecek örnek Y / X değerleri */
export function displayYX(e, n) {
  return { Y: fmt(LOCAL_CRS.falseEasting + e), X: fmt(LOCAL_CRS.falseNorthing + n) };
}
