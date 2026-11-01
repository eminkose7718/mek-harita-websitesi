import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { About, FeaturedProducts, Footer, Gallery, LocationContact, MobileQuickBar, Showcase3D, StoreExperience } from "@/components/Sections";

export default function Page() {
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
