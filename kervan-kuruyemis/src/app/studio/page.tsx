import type { Metadata } from "next";
import { StudioClient } from "./StudioClient";

export const metadata: Metadata = { title: "Stüdyo", robots: { index: false, follow: false } };

/** Internal page used by scripts/render-thumbnails.mjs to render product thumbnails. */
export default function StudioPage() {
  return <StudioClient />;
}
