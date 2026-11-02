// Entry for the single-file build (scripts/build-standalone.mjs). Mirrors src/app/page.tsx.
import { createRoot } from "react-dom/client";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { About, FeaturedProducts, Footer, Gallery, LocationContact, MobileQuickBar, Showcase3D, StoreExperience } from "@/components/Sections";

function App() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <StoreExperience />
        <FeaturedProducts />
        <Showcase3D />
        <About />
        <Gallery />
        <LocationContact />
      </main>
      <Footer />
      <MobileQuickBar />
    </>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
