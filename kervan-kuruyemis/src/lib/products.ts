export type Category = "kuruyemis" | "kuru-meyve" | "paketli" | "ozel";

export const CATEGORIES: { id: Category; label: string }[] = [
  { id: "kuruyemis", label: "Kuruyemişler" },
  { id: "kuru-meyve", label: "Kuru Meyveler" },
  { id: "paketli", label: "Paketli Ürünler" },
  { id: "ozel", label: "Özel Ürünler" },
];

/** Procedural 3D model kinds (see src/three/nuts.ts). */
export type ModelKind =
  | "apricot"
  | "apricot-sun"
  | "cashew"
  | "date"
  | "fig"
  | "raisin"
  | "raisin-black"
  | "hazelnut"
  | "pistachio"
  | "almond"
  | "walnut"
  | "prune"
  | "mixed";

export type Product = {
  id: string;
  name: string;
  category: Category;
  description: string;
  model: ModelKind | null;
  /** Gerçek fotoğraf varsa (izinli kullanım varsayımıyla), yoksa 3D render küçük resmi */
  image: string;
  /**
   * "photo": ürün yüklenen mağaza fotoğraflarında görülüyor.
   * "sample": fotoğraflarda doğrulanamadı — örnek katalog içeriği.
   */
  source: "photo" | "sample";
  sourceNote: string;
  featured?: boolean;
};

// NOT: Fiyat, gramaj, stok ve menşei bilgileri doğrulanmadığı için bilerek eklenmemiştir.
export const PRODUCTS: Product[] = [
  {
    id: "kuru-kayisi",
    name: "Kuru Kayısı",
    category: "kuru-meyve",
    description:
      "Parlak turuncu renkli, yumuşak dokulu kuru kayısı. Kahvaltıda, ara öğünde ya da tatlılarda keyifle tüketilir.",
    model: "apricot",
    image: "/products/kuru-kayisi.webp",
    source: "photo",
    sourceNote: "Mağaza tezgâhı fotoğrafında görülüyor.",
    featured: true,
  },
  {
    id: "gun-kurusu-kayisi",
    name: "Gün Kurusu Kayısı",
    category: "kuru-meyve",
    description:
      "Güneşte doğal yollarla kurutulmuş, koyu kahve tonlu kayısı. Yoğun ve karamelimsi bir tada sahiptir.",
    model: "apricot-sun",
    image: "/products/gun-kurusu-kayisi.webp",
    source: "photo",
    sourceNote: "Mağaza tezgâhı fotoğrafında görülüyor.",
  },
  {
    id: "kaju",
    name: "Kaju",
    category: "kuruyemis",
    description:
      "Kendine özgü kavisli formu ve kremamsı lezzetiyle kaju. Tek başına ya da karışımlarda sevilen bir lezzet.",
    model: "cashew",
    image: "/photos/kaju.jpg",
    source: "photo",
    sourceNote: "İşletmenin paylaştığı ürün fotoğrafı.",
    featured: true,
  },
  {
    id: "hurma",
    name: "Hurma",
    category: "kuru-meyve",
    description:
      "Parlak, koyu kahverengi kabuğu ve bal gibi tatlı iç dokusuyla hurma. Enerji veren doğal bir atıştırmalık.",
    model: "date",
    image: "/products/hurma.webp",
    source: "photo",
    sourceNote: "Mağaza iç mekân fotoğrafındaki reyonlarda görülüyor.",
    featured: true,
  },
  {
    id: "kuru-incir",
    name: "Kuru İncir",
    category: "kuru-meyve",
    description:
      "Yumuşak dokulu, çekirdekli iç yapısıyla kuru incir. Sade ya da cevizle birlikte tüketilebilir.",
    model: "fig",
    image: "/products/kuru-incir.webp",
    source: "photo",
    sourceNote: "Mağaza tezgâhı fotoğrafında görülüyor.",
    featured: true,
  },
  {
    id: "kuru-uzum",
    name: "Kuru Üzüm",
    category: "kuru-meyve",
    description:
      "Altın sarısından kehribar tonlarına uzanan renkleriyle kuru üzüm. Kahvaltıların ve tatlıların vazgeçilmezi.",
    model: "raisin",
    image: "/photos/kuru-uzum.jpg",
    source: "photo",
    sourceNote: "İşletmenin paylaştığı ürün fotoğrafı.",
    featured: true,
  },
  {
    id: "siyah-uzum",
    name: "Siyah Kuru Üzüm",
    category: "kuru-meyve",
    description: "Koyu renkli, tatlı ve yumuşak siyah kuru üzüm.",
    model: "raisin-black",
    image: "/products/siyah-uzum.webp",
    source: "photo",
    sourceNote: "Mağaza iç mekân fotoğrafındaki reyonlarda görülüyor.",
  },
  {
    id: "kuru-erik",
    name: "Kuru Erik",
    category: "kuru-meyve",
    description: "Koyu mor-siyah tonlu, hafif ekşi-tatlı kuru erik.",
    model: "prune",
    image: "/products/kuru-erik.webp",
    source: "photo",
    sourceNote: "Mağaza tezgâhı fotoğrafında görülüyor.",
  },
  {
    id: "findik",
    name: "Fındık",
    category: "kuruyemis",
    description: "Kavrulmuş iç fındık; çıtır dokusu ve aromatik lezzetiyle klasik bir kuruyemiş.",
    model: "hazelnut",
    image: "/products/findik.webp",
    source: "sample",
    sourceNote: "Fotoğraflarda net doğrulanamadı — örnek katalog içeriği.",
    featured: true,
  },
  {
    id: "antep-fistigi",
    name: "Antep Fıstığı",
    category: "kuruyemis",
    description: "Kabuğu aralanmış, yeşil iç tonlu fıstık. Kuruyemiş sofrasının en sevilenlerinden.",
    model: "pistachio",
    image: "/products/antep-fistigi.webp",
    source: "sample",
    sourceNote: "Fotoğraflarda net doğrulanamadı — örnek katalog içeriği.",
    featured: true,
  },
  {
    id: "badem",
    name: "Badem",
    category: "kuruyemis",
    description: "Kahverengi kabuklu, uzun formlu badem içi.",
    model: "almond",
    image: "/products/badem.webp",
    source: "sample",
    sourceNote: "Fotoğraflarda net doğrulanamadı — örnek katalog içeriği.",
  },
  {
    id: "ceviz",
    name: "Ceviz İçi",
    category: "kuruyemis",
    description: "Kıvrımlı yapısıyla ceviz içi; kahvaltıda, tatlılarda ve salatalarda kullanılır.",
    model: "walnut",
    image: "/products/ceviz.webp",
    source: "photo",
    sourceNote: "Mağaza tezgâhı fotoğrafında cevizli incir olarak görülüyor.",
    featured: true,
  },
  {
    id: "karisik",
    name: "Karışık Kuruyemiş",
    category: "kuruyemis",
    description: "Kaju, fındık, badem, fıstık ve cevizden oluşan karışım. (Karışım içeriği temsilidir.)",
    model: "mixed",
    image: "/products/karisik.webp",
    source: "sample",
    sourceNote: "Karışım içeriği temsilidir — örnek katalog içeriği.",
    featured: true,
  },
  {
    id: "turk-kahvesi",
    name: "Türk Kahvesi Çeşitleri",
    category: "paketli",
    description:
      "Paketli ve teneke kutulu Türk kahvesi çeşitleri; sade ve aromalı seçenekler raflarda yer alıyor.",
    model: null,
    image: "/products/paket-kahve.webp",
    source: "photo",
    sourceNote: "Mağaza raf fotoğrafında görülüyor (marka adları gösterilmez).",
  },
  {
    id: "meyve-cayi",
    name: "Meyveli Çaylar",
    category: "paketli",
    description: "Elma, nar, limon, kivi ve dut gibi aromalı Türk çayı kutuları.",
    model: null,
    image: "/products/paket-cay.webp",
    source: "photo",
    sourceNote: "Mağaza raf fotoğrafında görülüyor.",
  },
  {
    id: "lokum",
    name: "Lokum & Hediyelik Kutular",
    category: "ozel",
    description: "Hediyelik kutularda lokum ve şekerleme çeşitleri.",
    model: null,
    image: "/products/lokum.webp",
    source: "sample",
    sourceNote: "İç mekân fotoğrafındaki kutuların içeriği net değil — örnek katalog içeriği.",
  },
  {
    id: "dubai-cikolatasi",
    name: "Dubai Çikolatası",
    category: "ozel",
    description: "Raflarda yer alan, kadayıf ve fıstık kremalı çikolata çeşidi.",
    model: null,
    image: "/products/dubai.webp",
    source: "photo",
    sourceNote: "Mağaza raf fotoğrafındaki kutularda görülüyor.",
  },
];

export const productById = (id: string | null) => PRODUCTS.find((p) => p.id === id) ?? null;
export const MODEL_PRODUCTS = PRODUCTS.filter((p) => p.model !== null);
