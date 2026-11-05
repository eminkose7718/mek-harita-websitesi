# MEK Harita & Mühendislik — Web Sitesi

Yalova merkezli MEK Harita & Mühendislik'in kurumsal web sitesi: etkileşimli 3D arazi,
ölçüm ve fotogrametri demolarıyla harita mühendisliği hizmetlerini anlatır.
Yayın adresi: [mekharita.com.tr](https://mekharita.com.tr/)

> **Önemli:** 3D sahnelerdeki arazi, parsel, ölçüm noktası, bina ve fotogrametri verileri
> **temsilidir** (prosedürel olarak üretilir). Gerçek ölçüm, resmi kadastro kaydı veya firma
> projesi değildir ve arayüzde her yerde bu şekilde etiketlenir.

## Teknoloji

| Katman | Araç |
| --- | --- |
| Derleme | [Vite](https://vite.dev/) 6 |
| Stil | [Tailwind CSS](https://tailwindcss.com/) 4 (build sırasında derlenir) |
| 3D | [three.js](https://threejs.org/) — saf modüller, React kullanılmaz |
| Kaydırma animasyonu | [GSAP](https://gsap.com/) + ScrollTrigger (yalnızca 3D modüllerinde) |
| İkon / yazı tipi | [Lucide](https://lucide.dev/) (yalnızca kullanılanlar), Manrope (kendi sunucumuzdan) |

Tüm bağımlılıklar `package.json` içinde sabit sürümlüdür.

**Neden React değil?** Sitenin tüm metin içeriği `index.html` içinde, arama motorlarının ve
JavaScript'siz tarayıcıların okuyabileceği şekilde durur. 3D sahneler bu sayfaya sonradan
eklenen bağımsız modüllerdir. Bu yaklaşım ilk yüklemeyi hafif tutar (~14 KB gzip JS); three.js
(~164 KB gzip) yalnızca bir 3D bölüm ekrana yaklaştığında indirilir.

## Sayfa yapısı

| Bölüm | `id` | Açıklama |
| --- | --- | --- |
| Sinematik giriş | `#anasayfa` | 5 sahnelik 3D giriş (arazi → ölçü ağı → parsel → bina → firma). "Animasyonu Atla" ile geçilebilir; oturum başına bir kez oynar. |
| Mühendislik süreci | `#surec` | Kaydırmayla ilerleyen 3D anlatı (5 bölüm), "Bu bölümü atla" bağlantısı |
| Kurumsal | `#kurumsal` | Hakkımızda, misyon, vizyon, değerler |
| Hizmetler | `#hizmetler` | 9 hizmet, teknik illüstrasyon, detay, ilgili demo ve "Teklif iste" |
| Kübaj hesap örneği | `#kubaj-demo` | Platform kotuna göre kazı/dolgu hacmi (TIN yöntemi, tam formül) |
| 3D Arazi Gezgini | `#arazi-3d` | 5 mod (uydu stili, topografik, tel kafes, yükseklik, parsel), katmanlar, nokta seçimi |
| GNSS demosu | `#gnss-demo` | Nokta ölçümünden teknik çizime 7 adım |
| Parsel & bina oturumu | `#arsa-demo` | Parsel sınırı, aplikasyon, bina oturumu, kot analizi (kesit profili), 3D görünüm |
| Drone & fotogrametri | `#drone-demo` | Görüntü alımı → bindirme → nokta bulutları → yüzey → SYM → ortofoto |
| Teknik altyapı | `#teknik-altyapi` | |
| Çalışma alanları | `#calisma-alanlari` | |
| Projeler | `#projeler` | Veri odaklı vitrin (şu an yalnızca "Temsili örnek" kartları) |
| SSS | `#sss` | |
| İletişim | `#iletisim` | İletişim bilgileri, çalışma saatleri, teklif formu |

## Dosya yapısı

```
index.html                  Tüm içerik + SEO etiketleri + yapısal veri
src/
  main.js                   Giriş: ikonlar, menü, form, 3D sahne yükleyici
  style.css                 Tasarım sistemi (Tailwind @theme + bileşenler)
  ui/                       nav.js, form.js, projects.js, cubature-ui.js, illustrations.js
  lib/                      quality.js (cihaz/WebGL), noise.js, cubature.js (hacim hesabı)
  data/
    geo.js                  Örnek parseller (GeoJSON), noktalar, koordinat yardımcıları
    projects.js             Proje vitrini verisi
  three/
    host.js                 SceneHost: WebGL bağlamı, görünürlükte durdurma, bellek temizliği
    terrain.js              Temsili arazi, eş yükselti eğrileri, araziye yapışık çizgiler
    objects.js, labels.js   Ortak 3D nesneler ve etiketler
    controls.js             Yörünge, klavye, dokunmatik kapı, kamera uçuşu
    world.js                Hero ve anlatının paylaştığı sahne
    scenes/                 hero, story, explorer, gnss, parcel, drone, cubature, model-viewer
public/                     logo.png (eklenecek), favicon.svg, og-image.png, robots.txt, sitemap.xml
```

## Çalıştırma

Gereksinim: Node.js 20+

```bash
npm install
npm run dev       # http://localhost:3000
npm run build     # dist/ klasörüne production çıktısı
npm run preview   # build çıktısını yerelde önizle (http://localhost:4173)
```

## Yayınlama

`dist/` klasörü herhangi bir statik barındırmaya yüklenebilir. Hazır yapılandırmalar:

- **Netlify:** `netlify.toml` — depoyu bağlayın; build komutu ve `dist` klasörü otomatik algılanır.
- **Vercel:** `vercel.json` — depoyu içe aktarın; ek ayar gerekmez.
- **cPanel / klasik hosting:** `npm run build` sonrası `dist/` içeriğini `public_html/` altına yükleyin.

Teklif formunu bir sunucuya bağlamak isterseniz barındırma panelinde `VITE_FORM_ENDPOINT`
ortam değişkenini tanımlayıp yeniden derleyin (bkz. `.env.example`).

## Firma tarafından tamamlanması gerekenler

- **Logo:** `public/logo.png` dosyasını ekleyin. Dosya yokken üst menüde yazılı logo gösterilir.
- **Teklif formu:** Varsayılan olarak hiçbir veri sunucuya gönderilmez; talep hazır bir WhatsApp
  mesajına dönüştürülür. Doğrudan iletim için `VITE_FORM_ENDPOINT` tanımlayın. Form, yalnızca
  sunucu başarılı yanıt verdiğinde "iletildi" der.
- **KVKK:** Formdaki kısa bilgilendirme metni, firmanın resmi KVKK aydınlatma metniyle
  değiştirilmeli veya ona bağlanmalıdır.
- **Projeler:** Gerçek projeler `src/data/projects.js` içine eklenmelidir (alanlar dosyanın
  başında açıklanmıştır). Görseller `public/projeler/...` altına konur. GLB model ve GeoJSON
  parsel desteği hazırdır.

## Gerçek coğrafi veri kullanımı

- Arazi `src/three/terrain.js` içinde prosedürel olarak üretilir. Gerçek bir sayısal yükseklik
  modeli (DEM/SYM) kullanılacaksa `getGrid()` bu veriden beslenmelidir.
- Parseller GeoJSON olarak okunur (`parseParcels(fc, crs)` — `src/data/geo.js`). Projeksiyonlu
  metrik koordinatlar (ör. TM / ITRF96 3°) için `crs = { kind: 'projected', origin: [Y0, X0] }`
  verilir. **Coğrafi koordinatlar (enlem/boylam) metre değildir**; önce `proj4` gibi bir
  kütüphaneyle projeksiyonlu sisteme dönüştürülmelidir. Kod bu durumda bilinçli olarak hata verir.
- Arayüzdeki Y / X değerleri şu an "yerel demo koordinatı"dır (Y = 5000 + doğu, X = 5000 + kuzey).

## Performans ve erişilebilirlik

- 3D sahneler ekrana yaklaşınca yüklenir, uzaklaşınca WebGL bağlamı ve bellek tamamen serbest bırakılır.
- Mobil ve zayıf cihazlarda düşük çözünürlüklü arazi, gölgesiz ışık ve düşük piksel oranı kullanılır;
  kare hızı düşerse piksel oranı otomatik azaltılır.
- Dokunmatik cihazlarda 3D etkileşim "3D ile etkileşime geç" düğmesiyle açılır; böylece sayfa kaydırması engellenmez.
- `prefers-reduced-motion` tercihinde sinematik giriş oynamaz, demolar otomatik başlamaz.
- WebGL yoksa tüm içerik metin olarak okunur; 3D alanlarında açıklayıcı mesaj gösterilir.
- 3D sahneler klavyeyle de kullanılabilir (oklar: döndür, Shift+oklar: kaydır, +/−: yakınlaştır).

## Test

Kübaj formülü analitik vakalarla (düz yüzey, eğik düzlem, köşegen eğim) ve ince sayısal
integrasyonla doğrulanmıştır. Tarayıcı testleri Playwright + Chromium (SwiftShader WebGL)
ile masaüstü (1440×900) ve mobil (390×844) görünümde yapılmıştır.
