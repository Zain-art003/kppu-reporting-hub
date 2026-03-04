import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import WelcomeSection from "@/components/WelcomeSection";
import TataCaraSection from "@/components/TataCaraSection";
import TujuanSection from "@/components/TujuanSection";
import PrinsipSection from "@/components/PrinsipSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background w-full">
      <Navbar />
      <main className="flex-1 w-full">
        <HeroSection />
        <WelcomeSection />
        <TataCaraSection />
        <TujuanSection />
        <PrinsipSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
