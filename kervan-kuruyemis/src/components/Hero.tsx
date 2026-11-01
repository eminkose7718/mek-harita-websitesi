"use client";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { detectQuality, hasWebGL } from "@/lib/webgl";
import { HeroOverlays } from "./HeroOverlays";
import { KervanLogo } from "./Logo";
import { scrollToId } from "@/lib/nav";

const Experience = dynamic(() => import("@/three/Experience"), { ssr: false });

async function loadFonts() {
  try {
    await Promise.race([
      Promise.all([
        document.fonts.load('600 64px "Nunito"', "Kuruyemiş"),
        document.fonts.load('800 32px "Manrope"', "KERVAN"),
        document.fonts.load('700 32px "Manrope"', "8"),
      ]),
      new Promise((r) => setTimeout(r, 2500)),
    ]);
  } catch {
    /* fonts are optional for the 3D textures */
  }
}

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const [webgl, setWebgl] = useState<boolean | null>(null);
  const [ready, setReady] = useState(false);
  const setQuality = useStore((s) => s.setQuality);
  const setReduced = useStore((s) => s.setReducedMotion);
  const setHeroVisible = useStore((s) => s.setHeroVisible);

  useEffect(() => {
    const ok = hasWebGL();
    setWebgl(ok);
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    if (ok) {
      setQuality(detectQuality());
      loadFonts().then(() => setReady(true));
    }
    return () => mq.removeEventListener("change", onChange);
  }, [setQuality, setReduced]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setHeroVisible(e.isIntersecting), { threshold: 0.02 });
    io.observe(el);
    return () => io.disconnect();
  }, [setHeroVisible]);

  return (
    <section ref={ref} id="magaza" className="relative h-[100svh] min-h-[560px] w-full overflow-hidden bg-[#05060a]" aria-label="3D Kervan Kuruyemiş mağazası">
      {webgl === false ? <NoWebGLFallback /> : ready ? <Experience /> : null}
      {webgl !== false && <HeroOverlays />}
    </section>
  );
}

/** High-quality static alternative for devices without WebGL. */
function NoWebGLFallback() {
  return (
    <div className="absolute inset-0">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/photos/magaza-cephe.jpg" alt="Kervan Kuruyemiş mağaza cephesi, Yalova" className="h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/40" />
      <div className="absolute inset-x-0 bottom-0 p-6 pb-16 text-white sm:p-12">
        <KervanLogo className="h-16 w-auto text-white drop-shadow-lg sm:h-24" />
        <p className="mt-2 text-sm tracking-[0.3em] uppercase opacity-80">Kuruyemiş · Yalova</p>
        <p className="mt-4 max-w-md text-white/85">
          Cihazınız 3D (WebGL) görüntülemeyi desteklemiyor. Mağazamızın fotoğraflarını ve ürünlerimizi aşağıda inceleyebilirsiniz.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button className="btn-primary" onClick={() => scrollToId("urunler")}>Ürünleri İncele</button>
          <button className="btn-ghost text-white" onClick={() => scrollToId("konum")}>Konuma Git</button>
        </div>
      </div>
    </div>
  );
}
