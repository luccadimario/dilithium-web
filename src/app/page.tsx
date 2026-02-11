import StarfieldBackground from '@/components/StarfieldBackground';
import Navigation from '@/components/Navigation';
import HeroSection from '@/components/HeroSection';
import AboutSection from '@/components/AboutSection';
import FeaturesSection from '@/components/FeaturesSection';
import GetStartedSection from '@/components/GetStartedSection';
import RoadmapSection from '@/components/RoadmapSection';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <>
      <StarfieldBackground />
      <Navigation />
      <main className="relative z-10">
        <HeroSection />
        <AboutSection />
        <FeaturesSection />
        <GetStartedSection />
        <RoadmapSection />
      </main>
      <Footer />
    </>
  );
}
