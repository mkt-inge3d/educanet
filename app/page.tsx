import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth";
import { NavbarLanding } from "@/components/landing/NavbarLanding";
import { HeroLanding } from "@/components/landing/HeroLanding";
import { StatsLanding } from "@/components/landing/StatsLanding";
import { BentoFeatures } from "@/components/landing/BentoFeatures";
import { CtaLanding } from "@/components/landing/CtaLanding";
import { FooterLanding } from "@/components/landing/FooterLanding";

export default async function LandingPage() {
  const session = await getSession();
  if (session) redirect("/home");

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <NavbarLanding />
      <main>
        <HeroLanding />
        <StatsLanding />
        <BentoFeatures />
        <CtaLanding />
      </main>
      <FooterLanding />
    </div>
  );
}
