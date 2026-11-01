"use client";
import { create } from "zustand";

export type Mode = "loading" | "intro" | "menu" | "tour" | "explore" | "product";
export type Quality = "low" | "medium" | "high";

type State = {
  mode: Mode;
  /** The mode to return to after closing a product. */
  prevMode: Exclude<Mode, "product" | "loading">;
  productId: string | null;
  quality: Quality;
  reducedMotion: boolean;
  heroVisible: boolean;
  introSkipRequested: boolean;
  tourProgress: number;
  /** product shown in the "3D Vitrin" section */
  showcaseId: string;
  setShowcase: (id: string) => void;
  setMode: (m: Mode) => void;
  openProduct: (id: string) => void;
  closeProduct: () => void;
  setQuality: (q: Quality) => void;
  setReducedMotion: (r: boolean) => void;
  setHeroVisible: (v: boolean) => void;
  skipIntro: () => void;
  setTourProgress: (p: number) => void;
};

export const useStore = create<State>((set, get) => ({
  mode: "loading",
  prevMode: "menu",
  productId: null,
  quality: "medium",
  reducedMotion: false,
  heroVisible: true,
  introSkipRequested: false,
  tourProgress: 0,
  showcaseId: "kaju",
  setShowcase: (id) => set({ showcaseId: id }),
  setMode: (m) => set({ mode: m }),
  openProduct: (id) => {
    const { mode } = get();
    const prev = mode === "product" || mode === "loading" || mode === "intro" ? get().prevMode : mode;
    set({ mode: "product", productId: id, prevMode: prev === "tour" ? "menu" : prev });
  },
  closeProduct: () => set({ mode: get().prevMode, productId: null }),
  setQuality: (q) => set({ quality: q }),
  setReducedMotion: (r) => set({ reducedMotion: r }),
  setHeroVisible: (v) => set({ heroVisible: v }),
  skipIntro: () => set({ introSkipRequested: true }),
  setTourProgress: (p) => set({ tourProgress: p }),
}));

// Exposed for automated visual tests (Playwright) — read-only usage recommended.
if (typeof window !== "undefined") (window as unknown as { __kervan: typeof useStore }).__kervan = useStore;
