"use client";
import { useEffect, useState } from "react";
import { scrollToId } from "@/lib/nav";
import { KervanLogo } from "./Logo";

const LINKS = [
  { id: "magaza", label: "Mağaza" },
  { id: "urunler", label: "Ürünler" },
  { id: "vitrin", label: "3D Vitrin" },
  { id: "hakkimizda", label: "Hakkımızda" },
  { id: "galeri", label: "Galeri" },
  { id: "konum", label: "Konum" },
  { id: "iletisim", label: "İletişim" },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > window.innerHeight * 0.75);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
  }, [open]);
  const go = (id: string) => {
    setOpen(false);
    scrollToId(id);
  };
  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${scrolled ? "glass-light shadow-sm" : "bg-gradient-to-b from-black/50 to-transparent"}`}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:h-[72px] sm:px-6">
        <button onClick={() => go("magaza")} className="flex items-center gap-3" aria-label="Kervan Kuruyemiş — başa dön">
          <span className="bg-kervan flex h-10 items-center rounded-xl px-3 shadow-md sm:h-11">
            <KervanLogo className="h-6 w-auto text-white sm:h-7" />
          </span>
          <span className={`hidden text-[11px] leading-tight font-bold tracking-[0.25em] uppercase sm:block ${scrolled ? "text-walnut" : "text-white"}`}>
            Kuruyemiş
            <br />
            <span className="font-medium opacity-70">Yalova</span>
          </span>
        </button>
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Ana menü">
          {LINKS.map((l) => (
            <button
              key={l.id}
              onClick={() => go(l.id)}
              className={`rounded-full px-3.5 py-2 text-sm font-semibold transition ${scrolled ? "text-walnut hover:bg-walnut/5" : "text-white/90 hover:bg-white/10 hover:text-white"}`}
            >
              {l.label}
            </button>
          ))}
        </nav>
        <button
          className={`flex h-11 w-11 items-center justify-center rounded-full lg:hidden ${scrolled ? "text-walnut" : "text-white"}`}
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? "Menüyü kapat" : "Menüyü aç"}
          aria-expanded={open}
        >
          <span className="relative block h-3.5 w-6">
            <span className={`absolute left-0 h-0.5 w-6 bg-current transition ${open ? "top-1.5 rotate-45" : "top-0"}`} />
            <span className={`absolute left-0 top-1.5 h-0.5 w-6 bg-current transition ${open ? "opacity-0" : ""}`} />
            <span className={`absolute left-0 h-0.5 w-6 bg-current transition ${open ? "top-1.5 -rotate-45" : "top-3"}`} />
          </span>
        </button>
      </div>
      {open && (
        <div className="bg-walnut/97 fixed inset-0 top-16 z-40 flex flex-col px-6 py-8 text-white backdrop-blur-xl lg:hidden">
          {LINKS.map((l, i) => (
            <button
              key={l.id}
              onClick={() => go(l.id)}
              className="font-display border-b border-white/10 py-4 text-left text-3xl"
              style={{ animation: `menuItem .5s ${i * 0.04}s both` }}
            >
              {l.label}
            </button>
          ))}
          <style>{`@keyframes menuItem{from{opacity:0;transform:translateX(-12px)}to{opacity:1;transform:none}}`}</style>
        </div>
      )}
    </header>
  );
}
