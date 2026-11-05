/**
 * Kübaj (kazı / dolgu) hesabı — üçgenlenmiş yüzey (TIN) yöntemi.
 *
 * Mevcut arazi, düzenli bir karelaj ağındaki nokta kotlarıyla tanımlanır. Her kare
 * iki üçgene bölünür; üçgen içinde yüzey doğrusal kabul edilir. Tasarım yüzeyi
 * yatay bir platform kotudur (zd). Her üçgen için d = z - zd farkı doğrusal olduğundan
 * pozitif (kazı) ve negatif (dolgu) hacimler kapalı formülle TAM olarak hesaplanır:
 *
 *   - Tüm köşeler aynı işaretli:   V = A · (d1 + d2 + d3) / 3
 *   - Bir köşe diğer ikisinden farklı işaretli (d1 tek başına):
 *       d1 tarafındaki hacim = A · d1³ / (3 · (d1 − d2) · (d1 − d3))
 *       diğer taraf = toplam − bu hacim
 *
 * Birimler: koordinat ve kotlar metre (m), alan m², hacim m³.
 * Sonuçlar, verilen örnek geometri için matematiksel olarak doğrudur; gerçek bir
 * projede kullanılabilir hakediş/rapor değeri değildir.
 */

function triangleVolumes(area, d1, d2, d3) {
  const total = (area * (d1 + d2 + d3)) / 3;
  const s = [Math.sign(d1), Math.sign(d2), Math.sign(d3)];
  const pos = s.filter((x) => x > 0).length;
  const neg = s.filter((x) => x < 0).length;
  if (neg === 0) return { cut: Math.max(total, 0), fill: 0 };
  if (pos === 0) return { cut: 0, fill: Math.max(-total, 0) };

  // Tek kalan köşeyi bul (diğer ikisinden farklı işaretli olan)
  const d = [d1, d2, d3];
  const lonelyIsPositive = pos === 1;
  const k = d.findIndex((x) => (lonelyIsPositive ? x > 0 : x < 0));
  const a = d[k];
  const b = d[(k + 1) % 3];
  const c = d[(k + 2) % 3];
  const lonely = (area * a * a * a) / (3 * (a - b) * (a - c));
  // lonely: tek köşe tarafındaki işaretli hacim (a > 0 ise pozitif, a < 0 ise negatif)
  const other = total - lonely;
  return lonelyIsPositive ? { cut: lonely, fill: -other } : { cut: other, fill: -lonely };
}

/**
 * @param {number[][]} z  satır × sütun nokta kotları (m)
 * @param {number} spacing karelaj aralığı (m)
 * @param {number} designLevel platform (tasarım) kotu (m)
 */
export function computeCutFill(z, spacing, designLevel) {
  const rows = z.length;
  const cols = z[0].length;
  const triArea = (spacing * spacing) / 2;
  let cut = 0;
  let fill = 0;
  for (let r = 0; r < rows - 1; r++) {
    for (let c = 0; c < cols - 1; c++) {
      const a = z[r][c] - designLevel;
      const b = z[r][c + 1] - designLevel;
      const d = z[r + 1][c] - designLevel;
      const e = z[r + 1][c + 1] - designLevel;
      for (const [x, y, w] of [[a, b, d], [b, e, d]]) {
        const v = triangleVolumes(triArea, x, y, w);
        cut += v.cut;
        fill += v.fill;
      }
    }
  }
  const area = (rows - 1) * (cols - 1) * spacing * spacing;
  return { cut, fill, net: cut - fill, area };
}

/** Örnek geometri: 20 m × 20 m alan, 5 m karelaj, 5 × 5 nokta (kotlar ÖRNEKTİR) */
export const EXAMPLE_SURVEY = {
  spacing: 5,
  z: [
    [102.4, 102.1, 101.7, 101.2, 100.9],
    [101.9, 101.6, 101.1, 100.6, 100.2],
    [101.3, 101.0, 100.4, 99.9, 99.5],
    [100.8, 100.3, 99.8, 99.3, 98.9],
    [100.2, 99.8, 99.2, 98.8, 98.4],
  ],
};
