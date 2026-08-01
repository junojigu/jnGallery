import React, { useState } from 'react';
import { ExhibitionInfo, Photo } from '../types';

interface ExhibitionViewProps {
  exhibitionInfo: ExhibitionInfo;
  photos?: Photo[];
  isAdmin?: boolean;
  onOpenEditModal?: () => void;
  onGoToGallery?: () => void;
  onViewPhoto?: (photo: Photo, contextPhotos?: Photo[], filterLabel?: string) => void;
}

export const ExhibitionView: React.FC<ExhibitionViewProps> = ({
  exhibitionInfo,
  photos = [],
  isAdmin = false,
  onOpenEditModal,
  onGoToGallery,
  onViewPhoto,
}) => {
  const [activeTab, setActiveTab] = useState<'intro' | 'artworks' | 'artist'>('intro');

  // Filter curated exhibition photos
  const selectedIds = exhibitionInfo.exhibitionPhotoIds || [];
  const exhibitionPhotos = selectedIds.length > 0
    ? photos.filter((p) => selectedIds.includes(p.id))
    : photos.filter((p) => p.featured).length > 0
    ? photos.filter((p) => p.featured)
    : photos;

  const handleStartExhibitionTour = () => {
    if (exhibitionPhotos.length > 0 && onViewPhoto) {
      onViewPhoto(exhibitionPhotos[0], exhibitionPhotos, `온라인 특별전시: ${exhibitionInfo.title || '특별전'}`);
    }
  };

  return (
    <div id="exhibition-view" className="w-full min-h-screen bg-[#f9f9f9] text-[#1a1c1c] pt-20 pb-20 px-4 md:px-8 animate-fadeIn">
      <div className="max-w-5xl mx-auto space-y-10">
        {/* Top Header Banner */}
        <div className="text-center space-y-4 pt-4 border-b border-[#c4c7c7]/40 pb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#000000] text-white text-xs font-medium tracking-wider uppercase shadow-xs">
            <span className="material-symbols-outlined text-sm text-amber-400">auto_stories</span>
            <span>온라인 특별전시 • ONLINE EXHIBITION</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#000000] leading-tight">
            {exhibitionInfo.title || '시선의 여정: 빛과 고요'}
          </h1>

          {exhibitionInfo.subtitle && (
            <p className="font-sans text-base sm:text-lg text-[#444748] max-w-2xl mx-auto font-light leading-relaxed">
              {exhibitionInfo.subtitle}
            </p>
          )}

          <p className="text-xs font-semibold text-[#747878] tracking-widest uppercase">
            {exhibitionInfo.period || 'Permanent Online Special Exhibition'}
          </p>

          {/* Admin Edit Trigger Button */}
          {isAdmin && onOpenEditModal && (
            <div className="pt-2">
              <button
                onClick={onOpenEditModal}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#1a1c1c] text-white text-xs font-semibold rounded-full hover:bg-opacity-80 transition-all shadow-sm cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm text-amber-400">edit_note</span>
                <span>특별전시 주제 & 작품 큐레이션 편집</span>
              </button>
            </div>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="flex justify-center border-b border-[#c4c7c7]/30">
          <div className="inline-flex gap-4 sm:gap-8">
            <button
              onClick={() => setActiveTab('intro')}
              className={`pb-3 text-sm md:text-base font-serif font-medium transition-all relative cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'intro'
                  ? 'text-[#000000] font-bold border-b-2 border-[#000000]'
                  : 'text-[#747878] hover:text-[#000000]'
              }`}
            >
              <span className="material-symbols-outlined text-lg">museum</span>
              <span>특별전 소개</span>
            </button>

            <button
              onClick={() => setActiveTab('artworks')}
              className={`pb-3 text-sm md:text-base font-serif font-medium transition-all relative cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'artworks'
                  ? 'text-[#000000] font-bold border-b-2 border-[#000000]'
                  : 'text-[#747878] hover:text-[#000000]'
              }`}
            >
              <span className="material-symbols-outlined text-lg">photo_library</span>
              <span>전시 작품 ({exhibitionPhotos.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('artist')}
              className={`pb-3 text-sm md:text-base font-serif font-medium transition-all relative cursor-pointer flex items-center gap-1.5 ${
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

        {/* Tab 1: Exhibition Intro */}
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
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-90" />
                <div className="absolute bottom-6 left-6 right-6 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 text-white">
                  <div>
                    <span className="text-xs text-white/80 font-semibold tracking-wider uppercase block mb-1">CURATED EXHIBITION COVER</span>
                    <p className="font-serif text-lg md:text-2xl font-medium drop-shadow-md">
                      "{exhibitionInfo.title}"
                    </p>
                  </div>
                  {exhibitionPhotos.length > 0 && onViewPhoto && (
                    <button
                      onClick={handleStartExhibitionTour}
                      className="px-4 py-2 bg-white text-[#000000] rounded-full text-xs font-semibold hover:bg-[#e2e2e2] transition-colors shadow-md flex items-center gap-1.5 shrink-0 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-base">slideshow</span>
                      <span>전체 작품 슬라이드 투어</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Intro Text Content */}
            <div className="bg-white rounded-2xl p-6 md:p-10 border border-[#c4c7c7]/40 shadow-xs space-y-6">
              <div className="flex items-center gap-3 text-[#000000] border-b border-[#e2e2e2] pb-4">
                <span className="material-symbols-outlined text-2xl">auto_stories</span>
                <div>
                  <h2 className="font-serif text-2xl font-semibold">전시 기획 의도 & 작품 세계</h2>
                  <p className="text-xs text-[#747878]">CURATORIAL STATEMENT</p>
                </div>
              </div>

              <div className="font-sans text-[#1a1c1c] text-base md:text-lg leading-relaxed md:leading-loose whitespace-pre-line font-normal space-y-4">
                {exhibitionInfo.introText || '특별전시 소개 글이 작성되어 있지 않습니다.'}
              </div>
            </div>

            {/* Quick Teaser Grid of Exhibition Artworks */}
            {exhibitionPhotos.length > 0 && (
              <div className="space-y-4 pt-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-serif text-xl font-bold text-[#000000] flex items-center gap-2">
                    <span className="material-symbols-outlined text-amber-600">collections</span>
                    <span>특별전 엄선 작품</span>
                  </h3>
                  <button
                    onClick={() => setActiveTab('artworks')}
                    className="text-xs text-[#000000] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>전체 {exhibitionPhotos.length}점 보기</span>
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {exhibitionPhotos.slice(0, 4).map((photo) => (
                    <div
                      key={photo.id}
                      onClick={() => onViewPhoto && onViewPhoto(photo, exhibitionPhotos, `온라인 특별전시: ${exhibitionInfo.title}`)}
                      className="group aspect-4/3 rounded-xl overflow-hidden relative cursor-pointer border border-[#c4c7c7]/40 shadow-xs hover:shadow-md transition-all"
                    >
                      <img
                        src={photo.url}
                        alt={photo.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3 text-white">
                        <p className="font-serif text-xs font-medium truncate">{photo.title}</p>
                        <p className="text-[10px] text-white/80">{photo.category || photo.location || 'Exhibition Piece'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="text-center pt-6 flex flex-wrap justify-center gap-3">
              <button
                onClick={() => setActiveTab('artworks')}
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#000000] text-white rounded-full font-sans text-sm font-semibold hover:bg-opacity-90 transition-all shadow-md cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">collections</span>
                <span>전시 작품 관람하기</span>
              </button>
              {onGoToGallery && (
                <button
                  onClick={onGoToGallery}
                  className="inline-flex items-center gap-2 px-6 py-3.5 bg-white border border-[#c4c7c7] text-[#1a1c1c] rounded-full font-sans text-sm font-semibold hover:bg-[#f0f0f0] transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-lg">grid_view</span>
                  <span>전체 갤러리로 이동</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Exhibition Artworks Grid */}
        {activeTab === 'artworks' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-[#c4c7c7]/40 shadow-xs">
              <div>
                <h2 className="font-serif text-xl md:text-2xl font-bold text-[#000000] flex items-center gap-2">
                  <span className="material-symbols-outlined text-amber-600">photo_library</span>
                  <span>특별전 전시 작품 ({exhibitionPhotos.length}점)</span>
                </h2>
                <p className="text-xs text-[#747878] mt-0.5">
                  큐레이션된 작품을 클릭하면 고화질 디테일 뷰어로 감상할 수 있습니다.
                </p>
              </div>

              {exhibitionPhotos.length > 0 && onViewPhoto && (
                <button
                  onClick={handleStartExhibitionTour}
                  className="px-5 py-2.5 bg-[#000000] text-white rounded-full text-xs font-semibold hover:bg-opacity-80 transition-all shadow-md flex items-center gap-2 cursor-pointer shrink-0"
                >
                  <span className="material-symbols-outlined text-base text-amber-400">play_circle</span>
                  <span>전체 화면 연속 슬라이드 관람</span>
                </button>
              )}
            </div>

            {exhibitionPhotos.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-[#c4c7c7]/30 p-8 space-y-3">
                <span className="material-symbols-outlined text-4xl text-[#747878]">photo_library</span>
                <p className="text-sm font-medium text-[#444748]">선택된 특별전시 작품이 없습니다.</p>
                <p className="text-xs text-[#747878]">상단의 [편집] 버튼을 눌러 사진전 작품을 큐레이션해 보세요.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {exhibitionPhotos.map((photo, index) => (
                  <div
                    key={photo.id}
                    onClick={() => onViewPhoto && onViewPhoto(photo, exhibitionPhotos, `온라인 특별전시: ${exhibitionInfo.title}`)}
                    className="group bg-white rounded-2xl overflow-hidden border border-[#c4c7c7]/40 shadow-xs hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col"
                  >
                    <div className="relative aspect-4/3 bg-[#e2e2e2] overflow-hidden">
                      <img
                        src={photo.url}
                        alt={photo.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute top-3 left-3 px-2.5 py-1 bg-black/60 backdrop-blur-md text-white text-[10px] font-semibold rounded-full">
                        NO. {String(index + 1).padStart(2, '0')}
                      </div>
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                        <span className="px-3 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-xs font-medium border border-white/30 flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">zoom_in</span>
                          <span>작품 상세보기</span>
                        </span>
                      </div>
                    </div>

                    <div className="p-4 flex-grow flex flex-col justify-between space-y-2">
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-serif text-base font-bold text-[#000000] truncate">{photo.title}</h3>
                          {photo.category && (
                            <span className="text-[10px] px-2 py-0.5 bg-[#f0f0f0] text-[#444748] rounded font-medium shrink-0">
                              {photo.category}
                            </span>
                          )}
                        </div>
                        {photo.description && (
                          <p className="text-xs text-[#747878] line-clamp-2 mt-1 font-light">
                            {photo.description}
                          </p>
                        )}
                      </div>

                      <div className="pt-2 border-t border-[#f0f0f0] flex items-center justify-between text-[11px] text-[#747878]">
                        <span>{photo.location || photo.date || 'Photo Artwork'}</span>
                        <span className="text-[#000000] font-medium group-hover:underline flex items-center gap-0.5">
                          관람 <span className="material-symbols-outlined text-xs">arrow_forward</span>
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Artist Note */}
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
                <span className="text-xs font-semibold text-[#747878] uppercase tracking-wider">PHOTOGRAPHER / ARTIST</span>
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
            <div className="text-center pt-4">
              <button
                onClick={() => setActiveTab('artworks')}
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#000000] text-white rounded-full font-sans text-sm font-semibold hover:bg-opacity-90 transition-all shadow-md cursor-pointer group"
              >
                <span>전시 작품 관람하기</span>
                <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">
                  arrow_forward
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
