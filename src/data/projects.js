/**
 * PROJE PORTFÖYÜ — veri odaklı yapı.
 *
 * Şu an listede yalnızca TEMSİLİ ÖRNEKLER vardır (demo: true). Bunlar gerçek proje,
 * müşteri veya ölçüm değildir ve arayüzde açıkça "Temsili örnek" olarak etiketlenir.
 *
 * Gerçek proje eklemek için diziye yeni bir nesne ekleyin:
 * {
 *   id: 'benzersiz-kimlik',
 *   demo: false,
 *   title: 'Proje adı',
 *   location: 'İlçe, Yalova',
 *   category: 'Aplikasyon',            // hizmet kategorisi
 *   year: 2026,                         // isteğe bağlı
 *   summary: 'Kısa açıklama',
 *   details: ['Paragraf 1', 'Paragraf 2'],
 *   cover: '/projeler/ornek/kapak.jpg', // public/ altına koyulan görsel (yoksa illustration kullanılır)
 *   images: ['/projeler/ornek/1.jpg'],  // isteğe bağlı galeri
 *   beforeAfter: { before: '/projeler/ornek/once.jpg', after: '/projeler/ornek/sonra.jpg', beforeLabel: 'Önce', afterLabel: 'Sonra' },
 *   model: { type: 'glb', url: '/projeler/ornek/model.glb' }       // veya
 *   model: { type: 'geojson', data: {...FeatureCollection}, crs: { kind: 'projected', origin: [Y0, X0] } }
 * }
 */
import { demoParcelsGeoJSON } from './geo.js';

export const projects = [
  {
    id: 'ornek-aplikasyon',
    demo: true,
    title: 'Konut parseli: sınır tespiti ve aplikasyon',
    location: 'Temsili konum',
    category: 'Aplikasyon',
    summary: 'Parsel köşelerinin tespiti, bina köşelerinin sahaya aktarılması ve kontrol ölçümü iş akışını gösteren örnek.',
    details: [
      'Bu kart, bir konut parselinde tipik olarak izlenen adımları göstermek için hazırlanmış temsili bir örnektir.',
      'Önce parsel köşeleri referans noktalarına dayanarak tespit edilir; ardından projedeki bina köşe koordinatları sahaya aktarılır ve kazıklarla işaretlenir.',
    ],
    illustration: 'stakeout',
    beforeAfter: { before: 'terrain', after: 'drawing', beforeLabel: 'Arazi (temsili)', afterLabel: 'Teknik çizim (temsili)' },
    model: { type: 'geojson', data: demoParcelsGeoJSON },
  },
  {
    id: 'ornek-halihazir',
    demo: true,
    title: 'Halihazır harita ve kot analizi',
    location: 'Temsili konum',
    category: 'Halihazır Harita',
    summary: 'Arazideki detayların ve kotların ölçülerek eş yükselti eğrili bir halihazır haritaya dönüştürülmesine örnek.',
    details: [
      'Temsili örnek: arazideki yapı, yol, duvar ve kot noktaları ölçülür, eş yükselti eğrileriyle birlikte sayısal çizime aktarılır.',
    ],
    illustration: 'map',
    beforeAfter: { before: 'terrain', after: 'contours', beforeLabel: 'Arazi (temsili)', afterLabel: 'Eş yükselti eğrileri (temsili)' },
  },
  {
    id: 'ornek-kubaj',
    demo: true,
    title: 'Hafriyat öncesi ve sonrası kübaj karşılaştırması',
    location: 'Temsili konum',
    category: 'Kot / Kübaj',
    summary: 'Kazı öncesi ve sonrası yüzey modelleri arasındaki hacim farkının hesaplanmasını anlatan örnek.',
    details: [
      'Temsili örnek: kazı öncesi ve sonrası yapılan ölçümlerden iki yüzey modeli oluşturulur; aradaki fark kazı ve dolgu hacmi olarak hesaplanır.',
      'Hesap yönteminin etkileşimli bir örneğini Hizmetler bölümündeki “Kübaj Hesap Örneği”nde deneyebilirsiniz.',
    ],
    illustration: 'cutfill',
  },
];
