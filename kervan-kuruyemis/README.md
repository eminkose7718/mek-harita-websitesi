# Kervan Kuruyemiş — 3D Sinematik Web Sitesi

Yalova Merkez, Cumhuriyet Caddesi No:8'deki **Kervan Kuruyemiş** mağazasının, gerçek fotoğraflar esas alınarak
WebGL ile yeniden kurgulanmış 3 boyutlu dijital ikizi ve tanıtım sitesi.

**Teknoloji:** Next.js 16 (statik dışa aktarım) · React 19 · TypeScript · Tailwind CSS 4 · Three.js ·
React Three Fiber · Drei · @react-three/postprocessing · GSAP + ScrollTrigger · Zustand

## Çalıştırma

```bash
cd kervan-kuruyemis
npm install
npm run dev          # http://localhost:3000
npm run build        # statik site → ./out
npm run typecheck
```

`?q=low|medium|high` URL parametresi grafik kalitesini elle seçer (varsayılan: cihaza göre otomatik).

## Yayınlama

Site tamamen statiktir (`out/` klasörü); herhangi bir statik barındırmada çalışır.

- **Vercel:** Yeni proje → bu depoyu seçin → *Root Directory* = `kervan-kuruyemis` → Deploy.
  (Framework otomatik "Next.js" olarak algılanır.)
- **Netlify:** *Base directory* = `kervan-kuruyemis`, *Build command* = `npm run build`,
  *Publish directory* = `kervan-kuruyemis/out`.
- **Diğer:** `npm run build` sonrası `out/` klasörünü herhangi bir sunucuya yükleyin.

## İçerik düzenleme

| Ne | Nerede |
| --- | --- |
| Telefon, WhatsApp, Instagram, çalışma saatleri | `src/lib/site.config.ts` (boş alanlar sitede gösterilmez) |
| Ürünler, açıklamalar, kategoriler | `src/lib/products.ts` |
| Mağaza ölçüleri, reyon sırası | `src/three/layout.ts` |
| Ürün küçük resimleri (3D render) | `scripts/render-thumbnails.cjs` ile yeniden üretilir |

## Site yapısı

1. **Sinematik 3D Hero** — karanlıktan açılış, LED tabela yanışı, kamera vitrine iner, otomatik kapı açılır,
   reyonlar boyunca ilerleyip kuru kayısıya makro çekim (≈10 sn, atlanabilir, `prefers-reduced-motion` ile atlanır).
2. **İnteraktif mağaza** — üç mod:
   - *Sinematik Tur* (≈45 sn otomatik kamera yolu, bölüm başlıkları, ilerleme çubuğu)
   - *Serbest Gezinme* (sürükle-bak, zemine tıkla-yürü, tekerlek/pinch yakınlaştırma, WASD/oklar,
     mobil yön tuşları; kamera duvar ve tezgâhlardan geçemez — yürünebilir alan çarpışma kontrolü)
   - *Ürün Keşfi* (reyon/hotspot tıklanınca kamera yaklaşır, arka plan kararır, taneler "patlayarak" süzülür,
     360° sürükle-döndür, makro dolly; bilgi paneli, önceki/sonraki)
3. **Öne çıkan ürünler** (kategori filtreli katalog)
4. **3D ürün vitrini** (görünür olduğunda yüklenen ayrı WebGL sahnesi)
5. **Hakkımızda** · 6. **Fotoğraf galerisi** · 7. **Google Haritalar konumu** · 8. **İletişim**

## Gerçek / temsili içerik — açık liste

**Fotoğraflardan alınanlar:** kırmızı ışıklı tabela ve oranları, el yazısı "Kervan" logosu (tabela fotoğrafından
**vektörel olarak izlenmiştir**, `src/lib/logo.ts`), "Kuruyemiş" LED yazısı, kırmızı tente, otomatik cam kapı ve
"GİRİŞ – DİKKAT OTOMATİK KAPI" etiketi, kapı yanındaki dış raflar, sağdaki kırmızı kaplama ve dikey
"KERVAN KURUYEMİŞ" tabelası, üst kattaki metal çerçeveli pencereler, dar-uzun iç plan, beyaz seramik zemin,
beyaz panel tavan ve yuvarlak LED'ler, iki yandaki raflar, eğimli kuru meyve bölmeleri, camlı tezgâhlar,
çuvallar, klima ve kapı üstü TV.

**Temsili / varsayım (konsept rekonstrüksiyon):**
- İç mekân derinliği (≈11 m) ve tüm ölçüler fotoğraflardan tahmin edilmiştir.
- Mağazanın arka duvarı ve kasa bölümü fotoğraflarda görünmez — tahminidir.
- Komşu binalar, sokak, karşı kaldırım ve park etmiş araçlar temsilidir.
- Raflardaki paketler **jenerik tasarımlardır**; fotoğraftaki üçüncü taraf markalar kopyalanmamıştır.
- Ürünlerin 3D modelleri (kayısı, kaju, hurma, incir, üzüm, fındık, fıstık, badem, ceviz…) **prosedürel olarak**
  üretilmiştir (GLB dosyası yoktur; geometri tarayıcıda oluşturulur, `src/three/nuts.ts`).
- Ürün kartlarındaki görsellerden yalnızca **kaju** ve **kuru üzüm** gerçek fotoğraftır; diğerleri 3D render'dır
  ve sitede "3D temsili görsel" olarak etiketlenir.
- Fındık, antep fıstığı, badem, karışık kuruyemiş ve lokum fotoğraflarda net doğrulanamadığından
  **"Örnek katalog içeriği"** olarak işaretlenmiştir.
- Fiyat, gramaj, stok ve menşei bilgisi **bilerek eklenmemiştir**.
- Telefon, WhatsApp, Instagram ve çalışma saatleri doğrulanmadığından **boş bırakılmıştır**.
- Google Haritalar gömülü haritası adres sorgusuyla açılır (API anahtarı gerekmez); pin konumunun işletme
  ile eşleştiği yayın öncesi kontrol edilmelidir.

## Fotoğraf kullanımı

`public/photos/` altındaki 4 fotoğraf, işletmenin ("Etem Köse Kervan Kuruyemiş") Google Haritalar profilinde
paylaştığı görsellerden kırpılmıştır. Üçüncü bir kullanıcıya ait olan raf/tezgâh fotoğrafı **yalnızca modelleme
referansı** olarak kullanılmış, siteye eklenmemiştir. Yayından önce işletme sahibinin onayı alınmalıdır.

## Performans

- Tek draw-call'da yüzlerce paket: atlas dokulu `InstancedMesh` (`src/three/Packs.tsx`)
- Reyon yığınları: ürün başına tek `InstancedMesh` + boyalı taban dokusu (`src/three/ProductPile.tsx`)
- Tüm dokular çalışma anında canvas ile üretilir (indirilen görsel/HDR yok)
- Kalite kademeleri (low/medium/high), `PerformanceMonitor` ile otomatik düşürme, `AdaptiveDpr`
- Hero görünmezken render döngüsü durur; 3D vitrin ve harita yalnızca görünür olduklarında yüklenir
- WebGL yoksa fotoğraflı statik alternatif; `prefers-reduced-motion` desteklenir
