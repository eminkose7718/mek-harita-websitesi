"use client";
import { useStore, type Mode } from "./store";

const prefersReduced = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Scroll back to the 3D hero, then switch mode / open a product. */
export function goHero(action: { mode?: Exclude<Mode, "loading" | "intro" | "product">; product?: string }) {
  const atTop = window.scrollY < 40;
  window.scrollTo({ top: 0, behavior: prefersReduced() ? "auto" : "smooth" });
  const run = () => {
    const st = useStore.getState();
    if (st.mode === "intro") st.skipIntro();
    if (action.product) st.openProduct(action.product);
    else if (action.mode) st.setMode(action.mode);
  };
  if (atTop) run();
  else setTimeout(run, prefersReduced() ? 0 : 700);
}

export function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: prefersReduced() ? "auto" : "smooth", block: "start" });
}
