"use client";
import { useEffect, useRef, useState } from "react";
import { CATEGORIES, MODEL_PRODUCTS, productById } from "@/lib/products";
import { useStore } from "@/lib/store";
import { scrollToId } from "@/lib/nav";
import { exploreInput } from "@/three/CameraRig";
import { KervanLogo } from "./Logo";

export function HeroOverlays() {
  const mode = useStore((s) => s.mode);
  return (
    <>
      <LoadingCurtain />
      {mode === "intro" && <IntroOverlay />}
      {mode === "menu" && <ModeMenu />}
      {mode === "explore" && <ExploreHud />}
      {mode === "tour" && <TourHud />}
      {mode === "product" && <ProductPanel />}
      <Escape />
    </>
  );
}

function Escape() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const st = useStore.getState();
      if (st.mode === "product") st.closeProduct();
      else if (st.mode === "explore" || st.mode === "tour") st.setMode("menu");
      else if (st.mode === "intro") st.skipIntro();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return null;
}

/** Black curtain: covers loading, then fades out slowly as the intro starts ("dark → light"). */
function LoadingCurtain() {
  const mode = useStore((s) => s.mode);
  const reduced = useStore((s) => s.reducedMotion);
  const [gone, setGone] = useState(false);
  const visible = mode === "loading";
  useEffect(() => {
    if (!visible) {
      const t = setTimeout(() => setGone(true), reduced ? 0 : 2600);
      return () => clearTimeout(t);
    }
  }, [visible, reduced]);
  if (gone) return null;
  return (
    <div
      className="pointer-events-none absolute inset-0 z-30 flex flex-col items-center justify-center bg-black"
      style={{ opacity: visible ? 1 : 0, transition: `opacity ${reduced ? 0 : 2.4}s cubic-bezier(.4,0,.2,1)` }}
      aria-hidden={!visible}
    >
      <KervanLogo className="h-14 w-auto animate-pulse text-white/90" />
      <p className="mt-4 text-xs tracking-[0.35em] text-white/50 uppercase">Mağaza hazırlanıyor</p>
    </div>
  );
}

function IntroOverlay() {
  const skip = useStore((s) => s.skipIntro);
  const reduced = useStore((s) => s.reducedMotion);
  const caps = [
    { t: "Yalova · Cumhuriyet Caddesi No:8", d: 0.9, out: 3.8 },
    { t: "Kervan Kuruyemiş", d: 4.2, out: 6.6, big: true },
    { t: "Hoş geldiniz", d: 7.0, out: 9.8 },
  ];
  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      {/* cinematic letterbox */}
      <div className="letterbox absolute inset-x-0 top-0 h-[7vh] bg-black" />
      <div className="letterbox absolute inset-x-0 bottom-0 h-[7vh] bg-black" />
      <div className="absolute inset-x-0 bottom-[12vh] flex justify-center px-6 text-center">
        {!reduced &&
          caps.map((c) => (
            <p
              key={c.t}
              className={`intro-cap absolute text-white drop-shadow-[0_2px_20px_rgba(0,0,0,.8)] ${c.big ? "font-display text-4xl italic sm:text-6xl" : "text-xs font-semibold tracking-[0.35em] uppercase sm:text-sm"}`}
              style={{ animationDelay: `${c.d}s`, animationDuration: `${c.out - c.d}s` }}
            >
              {c.t}
            </p>
          ))}
      </div>
      <button
        onClick={skip}
        className="pointer-events-auto absolute right-4 bottom-[calc(7vh+16px)] rounded-full border border-white/30 bg-black/40 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-white hover:text-black sm:right-8"
      >
        Girişi atla →
      </button>
      <style>{`
        .intro-cap{opacity:0;animation-name:cap;animation-fill-mode:forwards;animation-timing-function:ease}
        @keyframes cap{0%{opacity:0;transform:translateY(14px);filter:blur(6px)}18%{opacity:1;transform:none;filter:none}80%{opacity:1}100%{opacity:0;transform:translateY(-8px)}}
        .letterbox{animation:lb 10.5s ease forwards}
        @keyframes lb{0%{transform:scaleY(1)}85%{transform:scaleY(1)}100%{transform:scaleY(0)}}
        .letterbox:first-child{transform-origin:top}.letterbox:nth-child(2){transform-origin:bottom}
      `}</style>
    </div>
  );
}

function ModeMenu() {
  const setMode = useStore((s) => s.setMode);
  const open = useStore((s) => s.openProduct);
  const items = [
    { label: "Mağazayı Keşfet", sub: "Serbest gezinme", on: () => setMode("explore"), primary: true },
    { label: "Ürünleri İncele", sub: "3D ürün keşfi", on: () => open("kuru-kayisi") },
    { label: "Sinematik Turu Başlat", sub: "Otomatik tur · ~45 sn", on: () => setMode("tour") },
    { label: "Konuma Git", sub: "Yol tarifi & harita", on: () => scrollToId("konum") },
  ];
  return (
    <div className="menu-in absolute inset-x-0 bottom-0 z-20 flex flex-col items-center px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
      <div className="glass w-full max-w-3xl rounded-3xl p-4 text-white shadow-2xl sm:p-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.3em] text-white/60 uppercase">Yalova · Cumhuriyet Cd. No:8</p>
            <h1 className="font-display mt-1 text-2xl leading-tight sm:text-4xl">
              Kervan Kuruyemiş&apos;e <span className="text-apricot italic">hoş geldiniz</span>
            </h1>
          </div>
          <KervanLogo className="hidden h-12 w-auto shrink-0 text-white/90 sm:block" />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:mt-5 sm:grid-cols-4 sm:gap-3">
          {items.map((it) => (
            <button
              key={it.label}
              onClick={it.on}
              className={`group rounded-2xl px-3 py-3 text-left transition duration-300 hover:-translate-y-0.5 sm:px-4 sm:py-4 ${
                it.primary ? "bg-kervan hover:bg-kervan-dark" : "bg-white/8 hover:bg-white/16"
              }`}
            >
              <span className="block text-sm leading-tight font-bold sm:text-[15px]">{it.label}</span>
              <span className="mt-1 block text-[11px] text-white/65">{it.sub}</span>
            </button>
          ))}
        </div>
      </div>
      <button onClick={() => scrollToId("deneyim")} className="mt-3 text-[11px] font-semibold tracking-[0.3em] text-white/55 uppercase transition hover:text-white">
        Aşağı kaydırın ↓
      </button>
      <style>{`.menu-in{animation:menuIn .9s cubic-bezier(.2,.8,.2,1) both}@keyframes menuIn{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:none}}@media (prefers-reduced-motion: reduce){.menu-in{animation:none}}`}</style>
    </div>
  );
}

function HoldButton({ label, onDown, onUp, className = "" }: { label: string; onDown: () => void; onUp: () => void; className?: string }) {
  return (
    <button
      aria-label={label}
      className={`glass flex h-12 w-12 items-center justify-center rounded-full text-lg text-white select-none active:bg-white/30 ${className}`}
      onPointerDown={(e) => {
        e.preventDefault();
        onDown();
      }}
      onPointerUp={onUp}
      onPointerLeave={onUp}
      onPointerCancel={onUp}
      onContextMenu={(e) => e.preventDefault()}
    >
      {label}
    </button>
  );
}

function ExploreHud() {
  const setMode = useStore((s) => s.setMode);
  useEffect(() => () => {
    exploreInput.fwd = 0;
    exploreInput.strafe = 0;
  }, []);
  return (
    <>
      <div className="pointer-events-none absolute inset-x-0 top-20 z-20 flex justify-center px-4">
        <p className="glass rounded-full px-4 py-2 text-center text-[12px] text-white/90">
          <span className="hidden sm:inline">Sürükle: etrafa bak · Zemine tıkla: yürü · Tekerlek: yakınlaş · W A S D / oklar · Parlayan noktalar: ürünler</span>
          <span className="sm:hidden">Sürükle: bak · Zemine dokun: yürü · İki parmak: yakınlaş</span>
        </p>
      </div>
      <div className="absolute bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-4 z-20 grid grid-cols-3 gap-1.5 sm:left-8">
        <span />
        <HoldButton label="▲" onDown={() => (exploreInput.fwd = 1)} onUp={() => (exploreInput.fwd = 0)} />
        <span />
        <HoldButton label="◀" onDown={() => (exploreInput.strafe = -1)} onUp={() => (exploreInput.strafe = 0)} />
        <HoldButton label="▼" onDown={() => (exploreInput.fwd = -1)} onUp={() => (exploreInput.fwd = 0)} />
        <HoldButton label="▶" onDown={() => (exploreInput.strafe = 1)} onUp={() => (exploreInput.strafe = 0)} />
      </div>
      <div className="absolute right-4 bottom-[max(1.25rem,env(safe-area-inset-bottom))] z-20 flex gap-2 sm:right-8">
        <button onClick={() => setMode("tour")} className="glass rounded-full px-4 py-3 text-sm font-semibold text-white hover:bg-white/20">
          Sinematik tur
        </button>
        <button onClick={() => setMode("menu")} className="rounded-full bg-white px-4 py-3 text-sm font-bold text-charcoal hover:bg-cream">
          Menü
        </button>
      </div>
    </>
  );
}

const CHAPTERS = [
  { at: 0, t: "Cumhuriyet Caddesi" },
  { at: 0.12, t: "Kervan tabelası" },
  { at: 0.22, t: "Otomatik giriş kapısı" },
  { at: 0.34, t: "Paketli ürün rafları" },
  { at: 0.42, t: "Kuru meyve reyonu" },
  { at: 0.56, t: "Kuruyemiş vitrini" },
  { at: 0.64, t: "Kaju · badem · karışık tezgâhı" },
  { at: 0.75, t: "Mağazanın derinliği" },
  { at: 0.86, t: "Tekrar sokağa" },
];

function TourHud() {
  const p = useStore((s) => s.tourProgress);
  const setMode = useStore((s) => s.setMode);
  const setP = useStore((s) => s.setTourProgress);
  useEffect(() => {
    setP(0);
  }, [setP]);
  const ch = [...CHAPTERS].reverse().find((c) => p >= c.at) ?? CHAPTERS[0];
  return (
    <div className="absolute inset-x-0 bottom-0 z-20 flex flex-col items-center gap-3 px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
      <p key={ch.t} className="font-display text-2xl text-white italic drop-shadow-[0_2px_16px_rgba(0,0,0,.8)] sm:text-3xl" style={{ animation: "menuIn .8s ease both" }}>
        {ch.t}
      </p>
      <div className="glass flex w-full max-w-xl items-center gap-3 rounded-full px-4 py-2.5">
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/15">
          <div className="h-full rounded-full bg-apricot" style={{ width: `${Math.round(p * 100)}%` }} />
        </div>
        <button onClick={() => setMode("explore")} className="text-xs font-semibold text-white/80 hover:text-white">
          Serbest gez
        </button>
        <button onClick={() => setMode("menu")} className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-charcoal">
          Turu durdur
        </button>
      </div>
      <style>{`@keyframes menuIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}`}</style>
    </div>
  );
}

function ProductPanel() {
  const id = useStore((s) => s.productId);
  const open = useStore((s) => s.openProduct);
  const close = useStore((s) => s.closeProduct);
  const p = productById(id);
  const idx = MODEL_PRODUCTS.findIndex((x) => x.id === id);
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    panel.current?.focus({ preventScroll: true });
  }, [id]);
  if (!p) return null;
  const go = (d: number) => open(MODEL_PRODUCTS[(idx + d + MODEL_PRODUCTS.length) % MODEL_PRODUCTS.length].id);
  const cat = CATEGORIES.find((c) => c.id === p.category)?.label;
  return (
    <div
      ref={panel}
      tabIndex={-1}
      key={p.id}
      role="dialog"
      aria-label={`${p.name} ürün bilgisi`}
      className="panel-in absolute inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-20 rounded-3xl p-5 text-white outline-none sm:inset-x-auto sm:right-8 sm:bottom-auto sm:top-1/2 sm:w-[380px] sm:-translate-y-1/2 sm:p-7 glass max-h-[calc(100svh-6rem)] overflow-y-auto"
    >
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold tracking-[0.3em] text-apricot uppercase">{cat}</p>
        <button onClick={close} className="-mr-2 rounded-full px-3 py-1 text-sm text-white/70 hover:bg-white/10 hover:text-white" aria-label="Kapat">
          Kapat ✕
        </button>
      </div>
      <h2 className="font-display mt-2 text-3xl leading-none sm:text-5xl">{p.name}</h2>
      <span
        className={`mt-3 inline-block rounded-full px-2.5 py-1 text-[11px] font-semibold ${p.source === "photo" ? "bg-emerald-400/15 text-emerald-200" : "bg-amber-300/15 text-amber-200"}`}
      >
        {p.source === "photo" ? "Mağaza fotoğraflarında görülüyor" : "Örnek katalog içeriği"}
      </span>
      <p className="mt-3 text-sm leading-relaxed text-white/85 sm:text-[15px]">{p.description}</p>
      <p className="mt-3 hidden text-xs text-white/50 sm:block">Sürükleyerek 360° döndürün · Yakınlaştırmak için kaydırın</p>
      <p className="mt-3 text-xs text-white/50 sm:hidden">Parmağınızla döndürün · İki parmakla yakınlaştırın</p>
      <div className="mt-4 flex items-center gap-2">
        <button onClick={() => go(-1)} className="rounded-full bg-white/10 px-4 py-2.5 text-sm font-semibold hover:bg-white/20" aria-label="Önceki ürün">
          ←
        </button>
        <button onClick={() => go(1)} className="rounded-full bg-white/10 px-4 py-2.5 text-sm font-semibold hover:bg-white/20" aria-label="Sonraki ürün">
          →
        </button>
        <span className="ml-1 text-xs text-white/50">
          {idx + 1} / {MODEL_PRODUCTS.length}
        </span>
        <button onClick={() => { close(); scrollToId("urunler"); }} className="ml-auto text-xs font-semibold text-white/70 underline-offset-4 hover:text-white hover:underline">
          Tüm ürünler
        </button>
      </div>
      <style>{`.panel-in{animation:pin .7s cubic-bezier(.2,.8,.2,1) .35s both}@keyframes pin{from{opacity:0;transform:translateY(24px)}to{opacity:1}}@media (min-width:640px){@keyframes pin{from{opacity:0;filter:blur(6px)}to{opacity:1;filter:none}}}@media (prefers-reduced-motion: reduce){.panel-in{animation:none}}`}</style>
    </div>
  );
}
