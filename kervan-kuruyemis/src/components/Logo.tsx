import { KERVAN_LOGO_PATH, KERVAN_LOGO_VIEWBOX } from "@/lib/logo";

/** The real "Kervan" script logo, vector-traced from the storefront sign photo. */
export function KervanLogo({ className = "", title = "Kervan" }: { className?: string; title?: string }) {
  return (
    <svg viewBox={KERVAN_LOGO_VIEWBOX} className={className} role="img" aria-label={title}>
      <path d={KERVAN_LOGO_PATH} fill="currentColor" fillRule="evenodd" />
    </svg>
  );
}
