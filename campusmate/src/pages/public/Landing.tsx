import React from 'react';
import { LandingHeader } from './landing/LandingHeader';
import { LandingHero } from './landing/LandingHero';
import { FeaturesGrid } from './landing/FeaturesGrid';
import { AttendancePlannerWidget } from './landing/AttendancePlannerWidget';
import { StudyOSBand } from './landing/StudyOSBand';
import { AboutSection } from './landing/AboutSection';
import { PageDirectory } from './landing/PageDirectory';
import { ThreeSteps } from './landing/ThreeSteps';
import { ClosingCTA } from './landing/ClosingCTA';
import { LandingFooter } from './landing/LandingFooter';

export const Landing: React.FC = () => {
  return (
    <div className="min-h-screen bg-white text-[#0B1020] flex flex-col font-sans selection:bg-[#1A86E0]/20 selection:text-[#0B1020]">
      {/* 1. Header (sticky, with logo, nav links, login & sign up) */}
      <LandingHeader />

      <main className="flex-1">
        {/* 1 & 2. Hero with Glows, H1, Subtext, CTA buttons & Dashboard Preview inside */}
        <LandingHero />

        {/* 3. Features (id=features, Section-wash background, 6 frosted cards) */}
        <FeaturesGrid />

        {/* 4. Attendance Planner (Working interactive widget, white background) */}
        <AttendancePlannerWidget />

        {/* 5. StudyOS (Dark band with glows, 40px radius, mockup with sample files) */}
        <StudyOSBand />

        {/* 6. About (id=about, Section-wash background, centered) */}
        <AboutSection />

        {/* 7. Page Directory (White background, 3 cards with link rows) */}
        <PageDirectory />

        {/* 8. Three Steps (Background #F7F8FE, numbered gradient circles) */}
        <ThreeSteps />

        {/* 9. Closing CTA (Big gradient band, Get Started & Create an account) */}
        <ClosingCTA />
      </main>

      {/* 10. Footer (id=contact, logo, columns, copyright) */}
      <LandingFooter />
    </div>
  );
};
