"use client";
import dynamic from "next/dynamic";

const StudioCanvas = dynamic(() => import("@/three/StudioCanvas"), { ssr: false });

export function StudioClient() {
  return (
    <div style={{ position: "fixed", inset: 0, background: "transparent" }}>
      <StudioCanvas />
    </div>
  );
}
