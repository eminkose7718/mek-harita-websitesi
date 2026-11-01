"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { CATEGORIES, MODEL_PRODUCTS, PRODUCTS, productById, type Category } from "@/lib/products";
import { SITE, directionsUrl, mapsEmbedUrl } from "@/lib/site.config";
import { useStore } from "@/lib/store";
import { goHero, scrollToId } from "@/lib/nav";
import { useReveal } from "@/lib/useReveal";
import { displayFor } from "@/three/layout";
import { KervanLogo } from "./Logo";

const ShowcaseCanvas = dynamic(() => import("@/three/ShowcaseCanvas"), { ssr: false });

function Eyebrow({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return (
    <p className={`text-[11px] font-bold tracking-[0.32em] uppercase ${light ? "text-apricot" : "text-kervan"}`} data-reveal>
      {children}
    </p>
  );
}

/* ------------------------------------------------------------------ 2 */
export function StoreExperience() {
  const ref = useRef<HTMLElement>(null);
  useReveal(ref);
  const modes = [
    {
      n: "01",
      t: "Sinematik Tur",
      d: "Kamera Cumhuriyet Caddesi'nden başlayıp tabelanın önünden geçer, otomatik kapıdan içeri girer ve reyonları sizin için gezer.",
      cta: "Turu başlat",
      on: () => goHero({ mode: "tour" }),
    },
    {
      n: "02",
      t: "Serbest Gezinme",
      d: "Sürükleyerek etrafınıza bakın, zemine tıklayarak yürüyün. Mobilde dokunmatik ve iki parmakla yakınlaştırma desteklenir.",
      cta: "Mağazayı keşfet",
      on: () => goHero({ mode: "explore" }),
    },
    {
      n: "03",
      t: "Ürün Keşfi",
      d: "Bir reyona dokunun: kamera ürüne yaklaşır, arka plan kararır ve taneler havada süzülür. Ürünü 360° döndürerek inceleyin.",
      cta: "Ürünleri incele",
      on: () => goHero({ product: "kuru-kayisi" }),
    },
  ];
  return (
    <section ref={ref} id="deneyim" className="bg-charcoal relative overflow-hidden py-24 text-white sm:py-32">
      <div className="pointer-events-none absolute -top-40 right-[-10%] h-[520px] w-[520px] rounded-full bg-kervan/25 blur-[120px]" />
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Eyebrow light>İnteraktif mağaza deneyimi</Eyebrow>
        <h2 className="font-display mt-4 max-w-3xl text-4xl leading-[1.05] sm:text-6xl" data-split>
          Yalova&apos;daki dükkânımız, şimdi ekranınızda.
        </h2>
        <p className="mt-6 max-w-2xl text-lg text-white/70" data-reveal>
          Mağazanın cephesi, tabelası, dar ve uzun iç düzeni, reyonları ve tezgâhları gerçek fotoğraflar esas alınarak 3 boyutlu olarak yeniden kurgulandı.
        </p>
        <div className="mt-14 grid gap-4 md:grid-cols-3" data-stagger>
          {modes.map((m) => (
            <article key={m.n} className="group relative flex flex-col rounded-3xl border border-white/10 bg-white/[0.04] p-7 transition-[translate,background-color,border-color] duration-500 hover:-translate-y-1 hover:border-white/25 hover:bg-white/[0.07]">
              <span className="font-display text-apricot text-5xl italic">{m.n}</span>
              <h3 className="mt-6 text-2xl font-bold">{m.t}</h3>
              <p className="mt-3 flex-1 text-white/65">{m.d}</p>
              <button onClick={m.on} className="mt-8 inline-flex items-center gap-2 self-start rounded-full bg-white px-5 py-3 text-sm font-bold text-charcoal transition group-hover:bg-apricot">
                {m.cta} <span aria-hidden>→</span>
              </button>
            </article>
          ))}
        </div>
        <p className="mt-8 text-xs text-white/40" data-reveal>
          Not: Fotoğraflarda görünmeyen alanlar (mağazanın arka bölümü, kasa, komşu binalar) konsept rekonstrüksiyondur; ölçüler fotoğraflardan tahmin edilmiştir.
        </p>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ 3 */
export function FeaturedProducts() {
  const ref = useRef<HTMLElement>(null);
  useReveal(ref);
  const [cat, setCat] = useState<Category | "all">("all");
  const setShowcase = useStore((s) => s.setShowcase);
  const list = useMemo(() => (cat === "all" ? PRODUCTS : PRODUCTS.filter((p) => p.category === cat)), [cat]);
  return (
    <section ref={ref} id="urunler" className="bg-cream py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <Eyebrow>Ürünlerimiz</Eyebrow>
            <h2 className="font-display text-walnut mt-4 text-4xl leading-[1.05] sm:text-6xl" data-split>
              Reyonlardan seçtiklerimiz
            </h2>
          </div>
          <p className="text-walnut/70 max-w-md" data-reveal>
            Fiyat, gramaj ve stok bilgisi için lütfen mağazamızı ziyaret edin. Bu sürümde online sipariş bulunmamaktadır.
          </p>
        </div>
        <div className="mt-10 flex gap-2 overflow-x-auto pb-2" role="tablist" aria-label="Kategoriler" data-reveal>
          {[{ id: "all" as const, label: "Tümü" }, ...CATEGORIES].map((c) => (
            <button
              key={c.id}
              role="tab"
              aria-selected={cat === c.id}
              onClick={() => setCat(c.id)}
              className={`shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold transition ${cat === c.id ? "bg-walnut text-white" : "bg-walnut/5 text-walnut hover:bg-walnut/10"}`}
            >
              {c.label}
            </button>
          ))}
        </div>
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {list.map((p, i) => (
            <article
              key={`${cat}-${p.id}`}
              className="group flex flex-col overflow-hidden rounded-3xl bg-white shadow-[0_1px_0_rgba(56,37,30,.06),0_20px_40px_-28px_rgba(56,37,30,.35)] transition duration-500 hover:-translate-y-1 hover:shadow-[0_30px_60px_-30px_rgba(56,37,30,.5)]"
              style={{ animation: `cardIn .6s ${Math.min(i, 8) * 0.04}s both` }}
            >
              <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-[#f3ece2] to-[#e8dccb]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.image}
                  alt={p.name}
                  loading="lazy"
                  className={`h-full w-full transition duration-700 group-hover:scale-105 ${p.image.startsWith("/photos/") ? "object-cover" : "object-contain p-2"}`}
                />
                <span className="absolute top-3 left-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold tracking-wide text-walnut uppercase backdrop-blur">
                  {CATEGORIES.find((c) => c.id === p.category)?.label}
                </span>
                <span className="absolute right-3 bottom-3 rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur">
                  {p.image.startsWith("/photos/") ? "Mağaza fotoğrafı" : "3D temsili görsel"}
                </span>
              </div>
              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-walnut text-lg font-bold">{p.name}</h3>
                  {p.source === "sample" && (
                    <span className="mt-0.5 shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800" title={p.sourceNote}>
                      Örnek
                    </span>
                  )}
                </div>
                <p className="text-walnut/65 mt-2 flex-1 text-sm leading-relaxed">{p.description}</p>
                {p.model ? (
                  <div className="mt-5 flex gap-2">
                    <button
                      onClick={() => {
                        setShowcase(p.id);
                        scrollToId("vitrin");
                      }}
                      className="bg-kervan hover:bg-kervan-dark flex-1 rounded-full px-4 py-2.5 text-sm font-bold text-white transition"
                    >
                      3D İncele
                    </button>
                    {displayFor(p.id) && (
                      <button onClick={() => goHero({ product: p.id })} className="border-walnut/15 text-walnut hover:bg-walnut/5 rounded-full border px-4 py-2.5 text-sm font-bold transition">
                        Mağazada gör
                      </button>
                    )}
                  </div>
                ) : (
                  <p className="text-walnut/45 mt-5 text-xs">Paketli ürün — 3D model bu sürümde yok.</p>
                )}
              </div>
            </article>
          ))}
        </div>
        <style>{`@keyframes cardIn{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}@media (prefers-reduced-motion: reduce){article{animation:none!important}}`}</style>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ 4 */
export function Showcase3D() {
  const ref = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  useReveal(ref);
  const id = useStore((s) => s.showcaseId);
  const setShowcase = useStore((s) => s.setShowcase);
  const p = productById(id) ?? MODEL_PRODUCTS[0];
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { rootMargin: "200px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <section ref={ref} id="vitrin" className="relative overflow-hidden bg-[#120d0b] py-24 text-white sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Eyebrow light>3D ürün vitrini</Eyebrow>
        <h2 className="font-display mt-4 max-w-3xl text-4xl leading-[1.05] sm:text-6xl" data-split>
          Her tanesini yakından inceleyin.
        </h2>
        <div className="mt-10 grid items-stretch gap-6 lg:grid-cols-[1fr_380px]">
          <div ref={stage} className="relative h-[58svh] min-h-[380px] overflow-hidden rounded-[2rem] bg-[radial-gradient(ellipse_at_center,#2d1a10_0%,#0d0908_70%)]">
            {inView && p.model && <ShowcaseCanvas kind={p.model} key={p.id} />}
            <p className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/40 px-4 py-2 text-xs text-white/70 backdrop-blur">
              Sürükle: 360° döndür · Tekerlek / iki parmak: yakınlaş
            </p>
          </div>
          <div className="flex flex-col rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 sm:p-8">
            <p className="text-apricot text-[11px] font-bold tracking-[0.3em] uppercase">{CATEGORIES.find((c) => c.id === p.category)?.label}</p>
            <h3 className="font-display mt-2 text-4xl sm:text-5xl">{p.name}</h3>
            <p className="mt-4 text-white/70">{p.description}</p>
            <p className="mt-3 text-xs text-white/40">{p.sourceNote} 3D model prosedürel olarak üretilmiş temsili bir modeldir.</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {MODEL_PRODUCTS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setShowcase(m.id)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${m.id === p.id ? "bg-apricot text-charcoal" : "bg-white/8 text-white/80 hover:bg-white/15"}`}
                >
                  {m.name}
                </button>
              ))}
            </div>
            {displayFor(p.id) && (
              <button onClick={() => goHero({ product: p.id })} className="btn-primary mt-auto self-start !mt-8">
                Mağazadaki reyonunda gör →
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ 5 */
export function About() {
  const ref = useRef<HTMLElement>(null);
  useReveal(ref);
  return (
    <section ref={ref} id="hakkimizda" className="bg-cream relative overflow-hidden py-24 sm:py-32">
      <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 sm:px-8 lg:grid-cols-2">
        <div>
          <Eyebrow>Hakkımızda</Eyebrow>
          <h2 className="font-display text-walnut mt-4 text-4xl leading-[1.05] sm:text-6xl" data-split>
            Cumhuriyet Caddesi&apos;nin kırmızı tabelalı dükkânı.
          </h2>
          <div className="text-walnut/75 mt-8 space-y-5 text-lg leading-relaxed" data-reveal>
            <p>
              Kervan Kuruyemiş, Yalova Merkez&apos;de Rüstem Paşa Mahallesi, Cumhuriyet Caddesi No:8&apos;de hizmet veren bir kuruyemiş ve kuru meyve mağazasıdır.
            </p>
            <p>
              Reyonlarımızda kuru kayısıdan hurmaya, kajudan kuru üzüme uzanan açık ürünlerin yanında paketli kahve, meyveli çay, çikolata ve hediyelik kutular yer alır.
            </p>
          </div>
          <dl className="mt-10 grid grid-cols-2 gap-4" data-stagger>
            {[
              ["Konum", "Yalova Merkez"],
              ["Cadde", "Cumhuriyet Cd. No:8"],
              ["Reyonlar", "Kuruyemiş · Kuru meyve"],
              ["Raflar", "Paketli & özel ürünler"],
            ].map(([k, v]) => (
              <div key={k} className="border-walnut/10 rounded-2xl border bg-white/60 p-4">
                <dt className="text-walnut/50 text-[11px] font-bold tracking-[0.2em] uppercase">{k}</dt>
                <dd className="text-walnut mt-1 font-bold">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="relative h-[560px] overflow-hidden rounded-[2rem] sm:h-[680px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/photos/magaza-cephe.jpg" alt="Kervan Kuruyemiş mağaza cephesi" className="absolute inset-x-0 -top-[12%] h-[124%] w-full object-cover" data-parallax="0.08" loading="lazy" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute bottom-6 left-6 right-6 text-white">
            <KervanLogo className="h-12 w-auto" />
            <p className="mt-2 text-sm text-white/80">Mağaza cephesi — işletmenin paylaştığı fotoğraf</p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ 6 */
const GALLERY = [
  { src: "/photos/magaza-cephe.jpg", alt: "Kervan Kuruyemiş cephesi ve kırmızı tabela", cls: "row-span-2" },
  { src: "/photos/kaju.jpg", alt: "Ahşap kasede kaju", cls: "" },
  { src: "/photos/magaza-ic.jpg", alt: "Mağaza içi: raflar ve kuru meyve reyonları", cls: "row-span-2" },
  { src: "/photos/kuru-uzum.jpg", alt: "Ahşap kasede kuru üzüm", cls: "" },
];

export function Gallery() {
  const ref = useRef<HTMLElement>(null);
  useReveal(ref);
  const [lightbox, setLightbox] = useState<number | null>(null);
  useEffect(() => {
    if (lightbox === null) return;
    const k = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
      if (e.key === "ArrowRight") setLightbox((i) => ((i ?? 0) + 1) % GALLERY.length);
      if (e.key === "ArrowLeft") setLightbox((i) => ((i ?? 0) - 1 + GALLERY.length) % GALLERY.length);
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [lightbox]);
  return (
    <section ref={ref} id="galeri" className="bg-walnut py-24 text-white sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Eyebrow light>Fotoğraf galerisi</Eyebrow>
        <h2 className="font-display mt-4 text-4xl leading-[1.05] sm:text-6xl" data-split>
          Gerçek mağaza, gerçek ürünler.
        </h2>
        <div className="mt-12 grid auto-rows-[220px] grid-cols-2 gap-3 sm:auto-rows-[280px] sm:gap-5 lg:grid-cols-3">
          {GALLERY.map((g, i) => (
            <button key={g.src} onClick={() => setLightbox(i)} className={`group relative overflow-hidden rounded-3xl ${g.cls}`} data-reveal aria-label={`Büyüt: ${g.alt}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={g.src} alt={g.alt} loading="lazy" className="absolute inset-x-0 -top-[10%] h-[120%] w-full object-cover transition duration-700 group-hover:scale-105" data-parallax="0.06" />
              <span className="absolute inset-x-3 bottom-3 rounded-full bg-black/45 px-3 py-1.5 text-left text-xs opacity-0 backdrop-blur transition group-hover:opacity-100">{g.alt}</span>
            </button>
          ))}
          <div className="flex flex-col justify-end rounded-3xl border border-white/10 p-6" data-reveal>
            <p className="text-sm text-white/60">
              Fotoğraflar işletmenin Google Haritalar profilinde paylaştığı görsellerden alınmıştır. Yayın öncesi işletme sahibinin onayı alınmalıdır.
            </p>
          </div>
        </div>
      </div>
      {lightbox !== null && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4" onClick={() => setLightbox(null)} role="dialog" aria-label="Fotoğraf görüntüleyici">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={GALLERY[lightbox].src} alt={GALLERY[lightbox].alt} className="max-h-full max-w-full rounded-2xl object-contain" />
          <button className="absolute top-5 right-5 rounded-full bg-white/10 px-4 py-2 text-white" aria-label="Kapat">
            Kapat ✕
          </button>
        </div>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ 7 + 8 */
export function LocationContact() {
  const ref = useRef<HTMLElement>(null);
  useReveal(ref);
  const [mapOn, setMapOn] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = mapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setMapOn(true), { rootMargin: "400px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const contacts = [
    SITE.phone && { label: "Telefon", value: SITE.phone, href: `tel:${SITE.phone.replace(/\s/g, "")}` },
    SITE.whatsapp && { label: "WhatsApp", value: "Mesaj gönder", href: `https://wa.me/${SITE.whatsapp}` },
    SITE.instagram && { label: "Instagram", value: `@${SITE.instagram}`, href: `https://instagram.com/${SITE.instagram}` },
  ].filter(Boolean) as { label: string; value: string; href: string }[];
  return (
    <section ref={ref} className="bg-cream py-24 sm:py-32">
      <div id="konum" className="mx-auto max-w-7xl scroll-mt-20 px-5 sm:px-8">
        <Eyebrow>Konum</Eyebrow>
        <h2 className="font-display text-walnut mt-4 text-4xl leading-[1.05] sm:text-6xl" data-split>
          Bizi ziyaret edin.
        </h2>
        <div className="mt-10 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div ref={mapRef} className="relative min-h-[380px] overflow-hidden rounded-[2rem] bg-[#e7e0d4]" data-reveal>
            <div className="text-walnut/60 absolute inset-0 flex flex-col items-center justify-center gap-3 p-8 text-center text-sm">
              <p>Harita görüntülenemiyorsa:</p>
              <a href={SITE.mapsLinks.primary} target="_blank" rel="noopener noreferrer" className="btn-primary">
                Google Haritalar&apos;da aç
              </a>
            </div>
            {mapOn ? (
              <iframe
                title="Kervan Kuruyemiş — Google Haritalar"
                src={mapsEmbedUrl()}
                className="absolute inset-0 h-full w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            ) : null}
          </div>
          <div id="iletisim" className="bg-walnut flex scroll-mt-24 flex-col rounded-[2rem] p-7 text-white sm:p-9" data-reveal>
            <KervanLogo className="h-12 w-auto self-start" />
            <p className="mt-1 text-xs tracking-[0.3em] text-white/50 uppercase">Kuruyemiş</p>
            <address className="mt-8 not-italic">
              <p className="text-[11px] font-bold tracking-[0.25em] text-apricot uppercase">Adres</p>
              <p className="mt-2 text-xl leading-snug font-semibold">
                {SITE.address.line1}
                <br />
                {SITE.address.line2}
              </p>
            </address>
            {SITE.openingHours && (
              <div className="mt-6">
                <p className="text-[11px] font-bold tracking-[0.25em] text-apricot uppercase">Çalışma saatleri</p>
                <p className="mt-2">{SITE.openingHours}</p>
              </div>
            )}
            <div className="mt-8 flex flex-col gap-3">
              <a href={directionsUrl()} target="_blank" rel="noopener noreferrer" className="btn-primary">
                Yol tarifi al
              </a>
              <a href={SITE.mapsLinks.primary} target="_blank" rel="noopener noreferrer" className="btn-ghost text-white">
                Google Haritalar&apos;da aç
              </a>
              {contacts.map((c) => (
                <a key={c.label} href={c.href} target="_blank" rel="noopener noreferrer" className="btn-ghost text-white">
                  {c.label}: {c.value}
                </a>
              ))}
            </div>
            {contacts.length === 0 && (
              <p className="mt-6 text-xs leading-relaxed text-white/45">
                Telefon, WhatsApp ve Instagram bilgileri doğrulanmadığı için henüz eklenmedi. (Düzenleme: <code className="text-white/70">src/lib/site.config.ts</code>)
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="bg-charcoal px-5 pt-16 pb-28 text-white/60 sm:px-8 sm:pb-16">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 md:flex-row md:items-end md:justify-between">
        <div>
          <span className="bg-kervan inline-flex rounded-xl px-3 py-2">
            <KervanLogo className="h-8 w-auto text-white" />
          </span>
          <p className="mt-4 max-w-md text-sm">
            {SITE.address.line1}, {SITE.address.line2}
          </p>
        </div>
        <div className="max-w-md text-xs leading-relaxed text-white/40">
          3D mağaza; gerçek fotoğraflara dayanan temsili bir yeniden kurgulamadır. Ölçüler, mağazanın arka bölümü ve komşu binalar tahminidir. Ürün modelleri prosedürel olarak oluşturulmuştur.
          <br />© {new Date().getFullYear()} Kervan Kuruyemiş
        </div>
      </div>
    </footer>
  );
}

/** Quick actions bar on mobile (always-working links only). */
export function MobileQuickBar() {
  const mode = useStore((s) => s.mode);
  const heroVisible = useStore((s) => s.heroVisible);
  if (heroVisible && mode !== "menu") return null;
  return (
    <div className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 flex gap-2 md:hidden" style={{ display: heroVisible ? "none" : undefined }}>
      <a href={directionsUrl()} target="_blank" rel="noopener noreferrer" className="bg-kervan flex-1 rounded-full py-3.5 text-center text-sm font-bold text-white shadow-lg">
        Yol tarifi
      </a>
      {SITE.phone && (
        <a href={`tel:${SITE.phone.replace(/\s/g, "")}`} className="flex-1 rounded-full bg-white py-3.5 text-center text-sm font-bold text-walnut shadow-lg">
          Ara
        </a>
      )}
      {SITE.whatsapp && (
        <a href={`https://wa.me/${SITE.whatsapp}`} target="_blank" rel="noopener noreferrer" className="flex-1 rounded-full bg-[#25D366] py-3.5 text-center text-sm font-bold text-white shadow-lg">
          WhatsApp
        </a>
      )}
      <button onClick={() => scrollToId("magaza")} className="rounded-full bg-charcoal px-4 py-3.5 text-sm font-bold text-white shadow-lg" aria-label="3D mağazaya dön">
        3D
      </button>
    </div>
  );
}
