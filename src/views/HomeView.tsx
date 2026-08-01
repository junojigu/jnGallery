import React from 'react';
import { HomeSettings } from '../types';

interface HomeViewProps {
  onExplore: () => void;
  homeSettings: HomeSettings;
  isAdmin?: boolean;
  onOpenHomeEdit?: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onExplore,
  homeSettings,
}) => {
  return (
    <div className="flex-grow flex flex-col min-h-screen relative">
      {/* Hero Section */}
      <section className="relative h-screen min-h-[600px] w-full overflow-hidden flex items-center justify-center group/hero">
        {/* Background Image */}
        <div
          className="absolute inset-0 z-0 bg-cover bg-center transition-transform duration-1000 scale-105"
          style={{ backgroundImage: `url('${homeSettings.heroImage}')` }}
        />

        {/* Overlay */}
        <div className="absolute inset-0 z-10 bg-gradient-to-b from-black/50 via-black/20 to-black/70" />

        {/* Content */}
        <div className="relative z-20 text-center px-4 md:px-10 max-w-4xl mx-auto flex flex-col items-center gap-6 mt-12">
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl text-white font-bold tracking-tight drop-shadow-lg leading-tight">
            {homeSettings.heroTitle}
          </h1>

          <p className="font-sans text-base sm:text-lg text-white/90 max-w-2xl drop-shadow-md leading-relaxed whitespace-pre-line">
            {homeSettings.heroSubtitle}
          </p>

          <button
            onClick={onExplore}
            className="mt-4 inline-flex items-center gap-2 bg-white text-[#000000] font-sans font-medium text-sm md:text-base px-8 py-4 rounded-lg hover:bg-[#e2e2e2] transition-all duration-300 shadow-xl transform hover:-translate-y-1 cursor-pointer"
          >
            <span>{homeSettings.heroCtaText}</span>
            <span className="material-symbols-outlined text-lg">arrow_forward</span>
          </button>
        </div>
      </section>

      {/* About / Intentional Curation Section */}
      <section className="py-20 md:py-28 px-4 md:px-10 bg-[#f9f9f9] relative group/about" id="about">
        <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row gap-12 lg:gap-16 items-center">
          <div className="flex-1 space-y-6">
            <h2 className="font-serif text-3xl md:text-4xl text-[#000000] font-semibold">
              {homeSettings.aboutTitle}
            </h2>
            <p className="font-sans text-base text-[#444748] leading-relaxed max-w-lg whitespace-pre-line">
              {homeSettings.aboutDescription}
            </p>

            <div className="pt-4 flex gap-10">
              <div className="flex flex-col gap-2">
                <span className="material-symbols-outlined text-[#000000] text-3xl">
                  {homeSettings.feature1Icon || 'photo_library'}
                </span>
                <span className="font-sans font-semibold text-sm text-[#000000]">
                  {homeSettings.feature1Title}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                <span className="material-symbols-outlined text-[#000000] text-3xl">
                  {homeSettings.feature2Icon || 'view_cozy'}
                </span>
                <span className="font-sans font-semibold text-sm text-[#000000]">
                  {homeSettings.feature2Title}
                </span>
              </div>
            </div>
          </div>

          <div className="flex-1 w-full grid grid-cols-2 gap-4">
            <div className="rounded-xl overflow-hidden shadow-sm bg-white border border-[#c4c7c7]/20">
              <img
                alt="Landing About Visual 1"
                src={homeSettings.aboutImage1}
                className="w-full h-64 md:h-80 object-cover hover:scale-105 transition-transform duration-700 ease-out"
              />
            </div>

            <div className="rounded-xl overflow-hidden mt-8 shadow-sm bg-white border border-[#c4c7c7]/20">
              <img
                alt="Landing About Visual 2"
                src={homeSettings.aboutImage2}
                className="w-full h-64 md:h-80 object-cover hover:scale-105 transition-transform duration-700 ease-out"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

