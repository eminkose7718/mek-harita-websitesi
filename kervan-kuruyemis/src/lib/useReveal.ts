"use client";
import { useLayoutEffect, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
  // layout settles after web fonts / images load → recompute trigger positions
  const refresh = () => ScrollTrigger.refresh();
  window.addEventListener("load", refresh);
  document.fonts?.ready.then(refresh).catch(() => {});
}

/**
 * Scroll-driven reveals inside a section:
 *  [data-reveal]        fade/slide up
 *  [data-split]         word-by-word text reveal
 *  [data-parallax="n"]  vertical parallax (n = strength, e.g. 0.15)
 *  [data-stagger]       children stagger in
 */
export function useReveal(ref: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    const ctx = gsap.context(() => {
      root.querySelectorAll<HTMLElement>("[data-split]").forEach((el) => {
        if (!el.dataset.splitDone) {
          const words = (el.textContent ?? "").split(/\s+/).filter(Boolean);
          el.innerHTML = words
            .map((w) => `<span class="reveal-line" style="display:inline-block;overflow:hidden;vertical-align:top;padding-bottom:.16em;margin-bottom:-.16em"><span class="reveal-word">${w}</span></span>`)
            .join(" ");
          el.dataset.splitDone = "1";
        }
        gsap.fromTo(el.querySelectorAll(".reveal-word"), { yPercent: 115 }, {
          yPercent: 0,
          duration: 1.0,
          ease: "power4.out",
          stagger: 0.035,
          scrollTrigger: { trigger: el, start: "top 85%" },
        });
      });
      root.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => {
        gsap.fromTo(el, { y: 40, autoAlpha: 0 }, {
          y: 0,
          autoAlpha: 1,
          duration: 1.1,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 88%" },
        });
      });
      root.querySelectorAll<HTMLElement>("[data-stagger]").forEach((el) => {
        gsap.fromTo(el.children, { y: 36, autoAlpha: 0 }, {
          y: 0,
          autoAlpha: 1,
          duration: 0.9,
          ease: "power3.out",
          stagger: 0.08,
          scrollTrigger: { trigger: el, start: "top 85%" },
        });
      });
      root.querySelectorAll<HTMLElement>("[data-parallax]").forEach((el) => {
        const k = Number(el.dataset.parallax) || 0.15;
        gsap.fromTo(
          el,
          { yPercent: -k * 100 },
          { yPercent: k * 100, ease: "none", scrollTrigger: { trigger: el.parentElement ?? el, start: "top bottom", end: "bottom top", scrub: true } },
        );
      });
    }, root);
    return () => ctx.revert();
  }, [ref]);
}
