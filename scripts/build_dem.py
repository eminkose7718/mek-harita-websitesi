"""Copernicus DEM GLO-30 -> Yalova bölgesi için TUREF/TM30 (EPSG:5254) düzenli ağ.

Kullanım (Python 3.10+, pip install rasterio pyproj numpy):
  curl -o N40E029.tif https://copernicus-dem-30m.s3.amazonaws.com/Copernicus_DSM_COG_10_N40_00_E029_00_DEM/Copernicus_DSM_COG_10_N40_00_E029_00_DEM.tif
  python scripts/build_dem.py N40E029.tif src/data/yalova-dem.bin src/data/yalova-dem.json
  python scripts/build_dem.py --low src/data/yalova-dem.bin src/data/yalova-dem-low.bin

Çıktı: Int16 (desimetre, little-endian), 385x385 köşe, kuzeyden güneye satırlar.
Not: yalova-dem.json'daki "places" ve "attribution" alanları elle eklenmiştir; yeniden üretirken koruyun.
"""
import sys, json, numpy as np, rasterio
from rasterio.windows import from_bounds
from pyproj import Transformer, CRS

if sys.argv[1] == '--low':
    a = np.fromfile(sys.argv[2], dtype='<i2').reshape(385, 385)
    np.ascontiguousarray(a[::2, ::2]).tofile(sys.argv[3])
    sys.exit(0)
tif, out_bin, out_json = sys.argv[1:4]
crs_tm = CRS.from_epsg(5254)
print('CRS:', crs_tm.name)
to_tm = Transformer.from_crs(4326, 5254, always_xy=True)
to_geo = Transformer.from_crs(5254, 4326, always_xy=True)

LAT0, LON0 = 40.618, 29.256          # kadraj merkezi
SIZE, RES = 18000.0, 384             # 18 km kare, 385x385 köşe (46,875 m aralık)
Y0, X0 = to_tm.transform(LON0, LAT0)
Y0, X0 = round(Y0 / 1000) * 1000, round(X0 / 1000) * 1000   # TM30 km çizgilerine hizalı başlangıç
print('origin TM30 Y0=%d X0=%d' % (Y0, X0))

src = rasterio.open(tif)
pad = 0.02
lon_min, lat_min = to_geo.transform(Y0 - SIZE / 2, X0 - SIZE / 2)
lon_max, lat_max = to_geo.transform(Y0 + SIZE / 2, X0 + SIZE / 2)
W, S, E, N = min(lon_min, lon_max) - pad, min(lat_min, lat_max) - pad, max(lon_min, lon_max) + pad, max(lat_min, lat_max) + pad
win = from_bounds(W, S, E, N, src.transform).round_offsets().round_lengths()
a = src.read(1, window=win).astype('float64')
T = src.window_transform(win)   # piksel köşesi -> lon/lat
print('window', a.shape, 'bounds', W, S, E, N)

step = SIZE / RES
idx = np.arange(RES + 1)
e = -SIZE / 2 + idx * step                    # doğu (sütun)
n = SIZE / 2 - idx * step                     # kuzey (satır; j=0 kuzey kenarı)
EE, NN = np.meshgrid(e, n)
lon, lat = to_geo.transform(Y0 + EE, X0 + NN)
# Piksel merkezli bilineer örnekleme
col = (lon - T.c) / T.a - 0.5
row = (lat - T.f) / T.e - 0.5
c0 = np.clip(np.floor(col).astype(int), 0, a.shape[1] - 2); r0 = np.clip(np.floor(row).astype(int), 0, a.shape[0] - 2)
fc = np.clip(col - c0, 0, 1); fr = np.clip(row - r0, 0, 1)
h = (a[r0, c0] * (1 - fc) * (1 - fr) + a[r0, c0 + 1] * fc * (1 - fr) + a[r0 + 1, c0] * (1 - fc) * fr + a[r0 + 1, c0 + 1] * fc * fr)
print('elev min %.1f max %.1f, sea(<=0.5m) %.1f%%' % (h.min(), h.max(), (h <= 0.5).mean() * 100))

q = np.clip(np.round(h * 10), -32768, 32767).astype('<i2')     # desimetre, Int16 LE
q.tofile(out_bin)

# Yerel (e, n) -> enlem/boylam için kübik polinom (ekranda gösterim)
def terms(x, y):
    x, y = x / 1e4, y / 1e4
    return np.stack([np.ones_like(x), x, y, x * x, x * y, y * y, x ** 3, x * x * y, x * y * y, y ** 3], -1)
A = terms(EE.ravel(), NN.ravel())
clat = np.linalg.lstsq(A, lat.ravel(), rcond=None)[0]
clon = np.linalg.lstsq(A, lon.ravel(), rcond=None)[0]
# doğrulama: rastgele noktalar
rng = np.random.default_rng(1)
te, tn = rng.uniform(-SIZE / 2, SIZE / 2, 5000), rng.uniform(-SIZE / 2, SIZE / 2, 5000)
tlon, tlat = to_geo.transform(Y0 + te, X0 + tn)
At = terms(te, tn)
plat, plon = At @ clat, At @ clon
err_m = np.hypot((plat - tlat) * 111132.0, (plon - tlon) * 111320.0 * np.cos(np.radians(tlat)))
print('poly geo fit max error: %.4f m' % err_m.max())

meta = {
  'name': 'Yalova', 'source': 'Copernicus DEM GLO-30 (tile N40 E029)',
  'crs': 'EPSG:5254', 'crsName': 'TUREF / TM30', 'origin': {'Y': Y0, 'X': X0},
  'size': SIZE, 'res': RES, 'heightScale': 0.1, 'heightDatum': 'EGM2008',
  'min': round(float(h.min()), 1), 'max': round(float(h.max()), 1),
  'geoFit': {'scale': 1e4, 'lat': [float(v) for v in clat], 'lon': [float(v) for v in clon], 'maxErrorM': round(float(err_m.max()), 4)},
}
json.dump(meta, open(out_json, 'w'), indent=1, ensure_ascii=False)
print('wrote', out_bin, q.nbytes, 'bytes;', out_json)
