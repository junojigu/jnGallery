import React, { useState } from 'react';
import { ExhibitionInfo } from '../types';

interface ExhibitionViewProps {
  exhibitionInfo: ExhibitionInfo;
  isAdmin?: boolean;
  onOpenEditModal?: () => void;
  onGoToGallery?: () => void;
}

export const ExhibitionView: React.FC<ExhibitionViewProps> = ({
  exhibitionInfo,
  isAdmin = false,
  onOpenEditModal,
  onGoToGallery,
}) => {
  const [activeTab, setActiveTab] = useState<'intro' | 'artist'>('intro');

  return (
    <div id="exhibition-view" className="w-full min-h-screen bg-[#f9f9f9] text-[#1a1c1c] pt-24 pb-20 px-4 md:px-8 animate-fadeIn">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Top Header Banner */}
        <div className="text-center space-y-4 pt-4 border-b border-[#c4c7c7]/40 pb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#e2e2e2] text-[#444748] text-xs font-semibold tracking-wider uppercase">
            <span className="material-symbols-outlined text-sm">photo_camera_back</span>
            {exhibitionInfo.period || 'EXHIBITION & ARTIST NOTE'}
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#000000] leading-tight">
            {exhibitionInfo.title || '시선의 여정: 빛과 고요'}
          </h1>

          {exhibitionInfo.subtitle && (
            <p className="font-sans text-base sm:text-lg text-[#444748] max-w-2xl mx-auto font-light leading-relaxed">
              {exhibitionInfo.subtitle}
            </p>
          )}

          {/* Admin Edit Trigger Button */}
          {isAdmin && onOpenEditModal && (
            <div className="pt-2">
              <button
                onClick={onOpenEditModal}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#000000] text-white text-xs font-semibold rounded-full hover:bg-opacity-80 transition-all shadow-sm cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm text-amber-400">edit_note</span>
                <span>사진전 소개 및 작가 노트 편집</span>
              </button>
            </div>
          )}
        </div>

        {/* Minimal Tab Switching Navigation */}
        <div className="flex justify-center border-b border-[#c4c7c7]/30">
          <div className="inline-flex gap-8">
            <button
              onClick={() => setActiveTab('intro')}
              className={`pb-3 text-sm md:text-base font-serif font-medium transition-all relative cursor-pointer flex items-center gap-2 ${
                activeTab === 'intro'
                  ? 'text-[#000000] font-bold border-b-2 border-[#000000]'
                  : 'text-[#747878] hover:text-[#000000]'
              }`}
            >
              <span className="material-symbols-outlined text-lg">museum</span>
              <span>사진전 소개</span>
            </button>

            <button
              onClick={() => setActiveTab('artist')}
              className={`pb-3 text-sm md:text-base font-serif font-medium transition-all relative cursor-pointer flex items-center gap-2 ${
                activeTab === 'artist'
                  ? 'text-[#000000] font-bold border-b-2 border-[#000000]'
                  : 'text-[#747878] hover:text-[#000000]'
              }`}
            >
              <span className="material-symbols-outlined text-lg">history_edu</span>
              <span>작가 노트</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Exhibition Intro (사진전 소개) */}
        {activeTab === 'intro' && (
          <div className="space-y-10 animate-fadeIn">
            {/* Hero Cover Artwork */}
            {exhibitionInfo.introImage && (
              <div className="relative w-full aspect-16/9 rounded-2xl overflow-hidden shadow-lg border border-[#c4c7c7]/30 bg-[#e2e2e2] group">
                <img
                  src={exhibitionInfo.introImage}
                  alt={exhibitionInfo.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-102"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-80" />
                <div className="absolute bottom-6 left-6 right-6 text-white font-serif text-sm md:text-base font-light italic drop-shadow-md">
                  "{exhibitionInfo.title}"
                </div>
              </div>
            )}

            {/* Intro Text Content */}
            <div className="bg-white rounded-2xl p-6 md:p-10 border border-[#c4c7c7]/40 shadow-xs space-y-6">
              <div className="flex items-center gap-3 text-[#000000]">
                <span className="material-symbols-outlined text-2xl">auto_stories</span>
                <h2 className="font-serif text-2xl font-semibold">기획 의도 및 작품 세계</h2>
              </div>

              <div className="font-sans text-[#1a1c1c] text-base md:text-lg leading-relaxed md:leading-loose whitespace-pre-line font-normal space-y-4">
                {exhibitionInfo.introText || '사진전 소개 글이 등록되지 않았습니다.'}
              </div>
            </div>

            {/* Bottom Call to Action */}
            {onGoToGallery && (
              <div className="text-center pt-4">
                <button
                  onClick={onGoToGallery}
                  className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#000000] text-white rounded-full font-sans text-sm font-semibold hover:bg-opacity-90 transition-all shadow-md cursor-pointer group"
                >
                  <span>전시 작품 관람하러 가기</span>
                  <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">
                    arrow_forward
                  </span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Artist Note (작가 노트) */}
        {activeTab === 'artist' && (
          <div className="space-y-10 animate-fadeIn">
            {/* Artist Profile Card */}
            <div className="bg-white rounded-2xl p-6 md:p-8 border border-[#c4c7c7]/40 shadow-xs flex flex-col md:flex-row items-center md:items-start gap-6">
              {exhibitionInfo.artistPhoto ? (
                <div className="w-28 h-28 md:w-36 md:h-36 rounded-2xl overflow-hidden border-2 border-[#c4c7c7]/60 shrink-0 shadow-sm bg-[#e2e2e2]">
                  <img
                    src={exhibitionInfo.artistPhoto}
                    alt={exhibitionInfo.artistName || 'Artist'}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-28 h-28 md:w-36 md:h-36 rounded-2xl bg-[#e2e2e2] flex items-center justify-center shrink-0 text-[#747878]">
                  <span className="material-symbols-outlined text-5xl">person</span>
                </div>
              )}

              <div className="text-center md:text-left space-y-2">
                <span className="text-xs font-semibold text-[#747878] uppercase tracking-wider">PHOTOGRAPHER</span>
                <h3 className="font-serif text-2xl md:text-3xl font-bold text-[#000000]">
                  {exhibitionInfo.artistName || 'Juno'}
                </h3>
                {exhibitionInfo.artistRole && (
                  <p className="font-sans text-sm text-[#444748] font-medium">
                    {exhibitionInfo.artistRole}
                  </p>
                )}
              </div>
            </div>

            {/* Featured Quote */}
            {exhibitionInfo.artistQuote && (
              <div className="relative bg-[#f0f0f0] rounded-2xl p-8 md:p-10 border border-[#c4c7c7]/50 text-center space-y-3">
                <span className="material-symbols-outlined text-4xl text-[#747878] block mx-auto">
                  format_quote
                </span>
                <p className="font-serif text-lg md:text-2xl text-[#000000] italic font-medium leading-relaxed max-w-2xl mx-auto">
                  "{exhibitionInfo.artistQuote}"
                </p>
              </div>
            )}

            {/* Artist Note Statement Essay */}
            <div className="bg-white rounded-2xl p-6 md:p-10 border border-[#c4c7c7]/40 shadow-xs space-y-6">
              <div className="flex items-center gap-3 text-[#000000]">
                <span className="material-symbols-outlined text-2xl">edit_note</span>
                <h2 className="font-serif text-2xl font-semibold">작가의 말 (Artist Statement)</h2>
              </div>

              <div className="font-sans text-[#1a1c1c] text-base md:text-lg leading-relaxed md:leading-loose whitespace-pre-line font-normal space-y-4">
                {exhibitionInfo.artistNote || '작가 노트가 등록되지 않았습니다.'}
              </div>
            </div>

            {/* Bottom Call to Action */}
            {onGoToGallery && (
              <div className="text-center pt-4">
                <button
                  onClick={onGoToGallery}
                  className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#000000] text-white rounded-full font-sans text-sm font-semibold hover:bg-opacity-90 transition-all shadow-md cursor-pointer group"
                >
                  <span>전시 작품 관람하기</span>
                  <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">
                    arrow_forward
                  </span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
