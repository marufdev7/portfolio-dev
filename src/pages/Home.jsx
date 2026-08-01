import Seo from "../components/layout/Seo";
import Hero from "../components/sections/Hero";
import FeaturedProjects from "../components/sections/FeaturedProjects";
import NetworkTeaser from "../components/sections/NetworkTeaser";
import ContactCta from "../components/sections/ContactCta";

export default function Home() {
  return (
    <>
      <Seo path="/" />
      <Hero />
      <FeaturedProjects />
      <NetworkTeaser />
      <ContactCta />
    </>
  );
}
