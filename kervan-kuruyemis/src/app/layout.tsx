import type { Metadata, Viewport } from "next";
import "@fontsource/fraunces/400.css";
import "@fontsource/fraunces/600.css";
import "@fontsource/fraunces/400-italic.css";
import "@fontsource/manrope/400.css";
import "@fontsource/manrope/500.css";
import "@fontsource/manrope/700.css";
import "@fontsource/manrope/800.css";
import "@fontsource/nunito/600.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kervan Kuruyemiş · Yalova — 3D Mağaza Deneyimi",
  description:
    "Yalova Merkez, Cumhuriyet Caddesi No:8'deki Kervan Kuruyemiş mağazasını 3 boyutlu olarak gezin: kuru kayısı, kaju, hurma, incir, üzüm ve daha fazlası.",
  openGraph: {
    title: "Kervan Kuruyemiş · Yalova",
    description: "Mağazamızı 3D olarak keşfedin.",
    images: ["/photos/magaza-cephe.jpg"],
    locale: "tr_TR",
    type: "website",
  },
  icons: { icon: "/favicon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#b52530",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
