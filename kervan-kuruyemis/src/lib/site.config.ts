/**
 * İşletme bilgileri — düzenlenebilir.
 * Doğrulanmamış iletişim bilgileri bilerek BOŞ bırakılmıştır.
 * Doldurulan alanlar sitede otomatik olarak buton/bağlantı olarak görünür;
 * boş alanlar için buton gösterilmez (çalışmayan buton olmaması için).
 */
type SiteConfig = {
  name: string;
  address: { line1: string; line2: string };
  mapsLinks: { primary: string; secondary: string };
  mapsEmbedQuery: string;
  directionsDestination: string;
  phone: string;
  whatsapp: string;
  instagram: string;
  openingHours: string;
};

export const SITE: SiteConfig = {
  name: "Kervan Kuruyemiş",
  address: {
    line1: "Rüstem Paşa Mahallesi, Cumhuriyet Caddesi No:8",
    line2: "Merkez / Yalova",
  },
  mapsLinks: {
    primary: "https://maps.app.goo.gl/m5iGq7mQfEVD99xN6?g_st=ic",
    secondary: "https://maps.app.goo.gl/H27wpGVHgs5Ktv3D9",
  },
  /** Google Maps gömülü harita — adres sorgusu ile (API anahtarı gerekmez). */
  mapsEmbedQuery: "Kervan Kuruyemiş, Rüstem Paşa, Cumhuriyet Cd. No:8, Yalova Merkez",
  directionsDestination: "Kervan Kuruyemiş, Cumhuriyet Cd. No:8, Rüstem Paşa, Yalova",

  // ---- DOĞRULANMADI: işletme sahibi tarafından doldurulmalı ----
  /** Örnek biçim: "+90 226 000 00 00" */
  phone: "",
  /** Uluslararası biçimde, yalnız rakam. Örnek: "905xxxxxxxxx" */
  whatsapp: "",
  /** Kullanıcı adı, @ olmadan. Örnek: "kervankuruyemis" */
  instagram: "",
  /** Örnek: "Her gün 09:00 – 23:00" */
  openingHours: "",
};

export const mapsEmbedUrl = () =>
  `https://www.google.com/maps?q=${encodeURIComponent(SITE.mapsEmbedQuery)}&output=embed&hl=tr`;

export const directionsUrl = () =>
  `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(SITE.directionsDestination)}`;
