# MEK Harita & Mühendislik — Web Sitesi

Yalova merkezli MEK Harita & Mühendislik'in kurumsal web sitesi.
Kaynak: [mekharita.com.tr](https://mekharita.com.tr/)

## Teknoloji

- [Vite](https://vite.dev/) — geliştirme sunucusu ve production build
- [Tailwind CSS v4](https://tailwindcss.com/) — build sırasında derlenir (`@tailwindcss/vite`)
- [Lucide](https://lucide.dev/) — yalnızca kullanılan ikonlar paketlenir

Tüm bağımlılıklar `package.json` içinde sabit sürümlüdür.

## Dosya yapısı

| Dosya | İçerik |
| --- | --- |
| `index.html` | Tüm sayfa içeriği (ana sayfa + Kurumsal, Hizmetler, Teknik Altyapı, Çalışma Alanları, SSS, İletişim panelleri), SEO etiketleri |
| `script.js` | Modal panelleri, mobil menü, SSS, teklif formu davranışı |
| `style.css` | Tailwind girişi, marka renkleri (`@theme`) ve arka plan animasyonları |
| `public/` | Olduğu gibi kopyalanan dosyalar: `robots.txt`, `sitemap.xml`, `favicon.svg`, **`logo.png`** |

## Çalıştırma

Gereksinim: Node.js 20+

```bash
npm install
npm run dev       # http://localhost:3000
npm run build     # dist/ klasörüne production çıktısı
npm run preview   # build çıktısını yerelde önizle
```

`dist/` klasörü herhangi bir statik barındırmaya (Netlify, Vercel, cPanel vb.) yüklenebilir.

## Notlar

- **Logo:** Site `public/logo.png` dosyasını kullanır. Dosya yoksa üst menüde yazılı logo gösterilir.
- **Bölüm bağlantıları:** Her panel doğrudan açılabilir, ör. `https://mekharita.com.tr/#hizmetler`, `#iletisim`, `#sss`.
- **Teklif formu:** Sitenin bir form sunucusu yoktur. Form doldurulduğunda talep hazır bir WhatsApp mesajına
  dönüştürülür (yedek olarak e-posta bağlantısı sunulur); mesaj kullanıcı WhatsApp'ta "Gönder"e bastığında iletilir.
