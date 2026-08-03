import React, { useState } from 'react';
import { Exhibition, Photo } from '../types';

interface ExhibitionViewProps {
  exhibitions: Exhibition[];
  activeExhibitionId: string;
  onSelectExhibition?: (exhibitionId: string) => void;
  photos?: Photo[];
  isAdmin?: boolean;
  onOpenEditModal?: () => void;
  onGoToGallery?: () => void;
  onViewPhoto?: (photo: Photo, contextPhotos?: Photo[], filterLabel?: string) => void;
  onSetActiveExhibition?: (exhibitionId: string) => void;
}

export const ExhibitionView: React.FC<ExhibitionViewProps> = ({
  exhibitions = [],
  activeExhibitionId,
  onSelectExhibition,
  photos = [],
  isAdmin = false,
  onOpenEditModal,
  onGoToGallery,
  onViewPhoto,
  onSetActiveExhibition,
}) => {
  // Currently displayed exhibition in the view
  const [viewExhibitionId, setViewExhibitionId] = useState<string>(
    activeExhibitionId || exhibitions[0]?.id || ''
  );

  const [activeTab, setActiveTab] = useState<'intro' | 'artworks' | 'artist' | 'archive'>('intro');

  const currentExhibition = exhibitions.find((e) => e.id === viewExhibitionId) || exhibitions[0];

  if (!currentExhibition) {
    return (
      <div className="w-full min-h-screen pt-32 text-center text-[#747878]">
        <p>등록된 전시 정보가 없습니다.</p>
        {isAdmin && onOpenEditModal && (
          <button
            onClick={onOpenEditModal}
            className="mt-4 px-4 py-2 bg-black text-white text-xs rounded-full cursor-pointer"
          >
            + 새 전시 개설하기
          </button>
        )}
      </div>
    );
  }

  // Filter exhibition curated photos
  const selectedIds = currentExhibition.exhibitionPhotoIds || [];
  const exhibitionPhotos = selectedIds.length > 0
    ? photos
        .filter((p) => selectedIds.includes(p.id))
        .sort((a, b) => selectedIds.indexOf(a.id) - selectedIds.indexOf(b.id))
    : photos.filter((p) => p.featured).length > 0
    ? photos.filter((p) => p.featured)
    : photos;

  const isCurrentActive = currentExhibition.id === activeExhibitionId;

  const handleStartExhibitionTour = () => {
    if (exhibitionPhotos.length > 0 && onViewPhoto) {
      onViewPhoto(exhibitionPhotos[0], exhibitionPhotos, `온라인 전시: ${currentExhibition.title}`);
    }
  };

  const handleSwitchExhibition = (id: string) => {
    setViewExhibitionId(id);
    if (onSelectExhibition) onSelectExhibition(id);
  };

  return (
    <div id="exhibition-view" className="w-full min-h-screen bg-[#f9f9f9] text-[#1a1c1c] pt-20 pb-20 px-4 md:px-8 animate-fadeIn">
      <div className="max-w-5xl mx-auto space-y-10">

        {/* Exhibition Selector & Status Bar */}
        <div className="bg-white rounded-2xl p-4 md:p-6 border border-[#c4c7c7]/40 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <span className="material-symbols-outlined text-amber-600 text-xl shrink-0">
              collections_bookmark
            </span>
            <div className="shrink-0">
              <span className="text-[11px] font-bold tracking-wider text-[#747878] uppercase block">
                전시 목록 선택 (EXHIBITIONS ARCHIVE)
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <select
                  value={currentExhibition.id}
                  onChange={(e) => handleSwitchExhibition(e.target.value)}
                  className="text-sm md:text-base font-bold font-serif text-[#000000] bg-[#f3f3f4] border border-[#c4c7c7] rounded-xl px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-black cursor-pointer"
                >
                  {exhibitions.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.id === activeExhibitionId ? '★ [대표/진행중] ' : ''}
                      {ex.title} ({ex.period || '기간미정'})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {isAdmin && onOpenEditModal && (
              <button
                onClick={onOpenEditModal}
                className="px-3.5 py-2 bg-[#1a1c1c] text-white text-xs font-semibold rounded-xl hover:bg-opacity-80 transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm text-amber-400">edit_note</span>
                <span>전시 관리/편집</span>
              </button>
            )}
          </div>
        </div>

        {/* Top Header Banner for Selected Exhibition */}
        <div className="text-center space-y-4 pt-2 border-b border-[#c4c7c7]/40 pb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#000000] text-white text-xs font-medium tracking-wider uppercase shadow-xs">
            <span className="material-symbols-outlined text-sm text-amber-400">
              {isCurrentActive ? 'local_fire_department' : 'history'}
            </span>
            <span>
              {isCurrentActive
                ? '현재 진행 중인 메인 전시 • CURRENT EXHIBITION'
                : '아카이브 기획 전시 • PAST EXHIBITION'}
            </span>
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#000000] leading-tight">
            {currentExhibition.title}
          </h1>

          {currentExhibition.subtitle && (
            <p className="font-sans text-base sm:text-lg text-[#444748] max-w-2xl mx-auto font-light leading-relaxed">
              {currentExhibition.subtitle}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-semibold text-[#747878] tracking-widest uppercase">
            <span>{currentExhibition.period || 'Period Unspecified'}</span>
            {currentExhibition.location && (
              <>
                <span>•</span>
                <span className="text-[#000000] font-normal">{currentExhibition.location}</span>
              </>
            )}
          </div>

          {isAdmin && onSetActiveExhibition && !isCurrentActive && (
            <div className="pt-2">
              <button
                onClick={() => onSetActiveExhibition(currentExhibition.id)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 text-white text-xs font-semibold rounded-full hover:bg-amber-700 transition-all shadow-xs cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">star</span>
                <span>이 전시를 현재 메인 대표 전시로 설정하기</span>
              </button>
            </div>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="flex justify-center border-b border-[#c4c7c7]/30">
          <div className="inline-flex gap-3 sm:gap-8 flex-wrap justify-center">
            <button
              onClick={() => setActiveTab('intro')}
              className={`pb-3 text-sm md:text-base font-serif font-medium transition-all relative cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'intro'
                  ? 'text-[#000000] font-bold border-b-2 border-[#000000]'
                  : 'text-[#747878] hover:text-[#000000]'
              }`}
            >
              <span className="material-symbols-outlined text-lg">museum</span>
              <span>전시 서문 & 소개</span>
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

            <button
              onClick={() => setActiveTab('archive')}
              className={`pb-3 text-sm md:text-base font-serif font-medium transition-all relative cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'archive'
                  ? 'text-[#000000] font-bold border-b-2 border-[#000000]'
                  : 'text-[#747878] hover:text-[#000000]'
              }`}
            >
              <span className="material-symbols-outlined text-lg">folder_open</span>
              <span>전시 아카이브 ({exhibitions.length})</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Exhibition Intro */}
        {activeTab === 'intro' && (
          <div className="space-y-10 animate-fadeIn">
            {/* Hero Cover Artwork */}
            {currentExhibition.introImage && (
              <div className="relative w-full aspect-16/9 rounded-2xl overflow-hidden shadow-lg border border-[#c4c7c7]/30 bg-[#e2e2e2] group">
                <img
                  src={currentExhibition.introImage}
                  alt={currentExhibition.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-102"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-90" />
                <div className="absolute bottom-6 left-6 right-6 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 text-white">
                  <div>
                    <span className="text-xs text-white/80 font-semibold tracking-wider uppercase block mb-1">
                      EXHIBITION POSTER & COVER
                    </span>
                    <p className="font-serif text-lg md:text-2xl font-medium drop-shadow-md">
                      "{currentExhibition.title}"
                    </p>
                  </div>
                  {exhibitionPhotos.length > 0 && onViewPhoto && (
                    <button
                      onClick={handleStartExhibitionTour}
                      className="px-4 py-2 bg-white text-[#000000] rounded-full text-xs font-semibold hover:bg-[#e2e2e2] transition-colors shadow-md flex items-center gap-1.5 shrink-0 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-base">slideshow</span>
                      <span>전체 작품 연속 관람</span>
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
                  <h2 className="font-serif text-2xl font-semibold">전시 기획 서문 & 작품 세계</h2>
                  <p className="text-xs text-[#747878]">CURATORIAL STATEMENT</p>
                </div>
              </div>

              <div className="font-sans text-[#1a1c1c] text-base md:text-lg leading-relaxed md:leading-loose whitespace-pre-line font-normal space-y-4">
                {currentExhibition.introText || '전시 소개 글이 등록되어 있지 않습니다.'}
              </div>
            </div>

            {/* Quick Teaser Grid of Exhibition Artworks */}
            {exhibitionPhotos.length > 0 && (
              <div className="space-y-4 pt-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-serif text-xl font-bold text-[#000000] flex items-center gap-2">
                    <span className="material-symbols-outlined text-amber-600">collections</span>
                    <span>이 전시의 수록 작품 ({exhibitionPhotos.length}점)</span>
                  </h3>
                  <button
                    onClick={() => setActiveTab('artworks')}
                    className="text-xs text-[#000000] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>전체 작품 보기</span>
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {exhibitionPhotos.slice(0, 4).map((photo) => (
                    <div
                      key={photo.id}
                      onClick={() => onViewPhoto && onViewPhoto(photo, exhibitionPhotos, `전시: ${currentExhibition.title}`)}
                      className="group aspect-4/3 rounded-xl overflow-hidden relative cursor-pointer border border-[#c4c7c7]/40 shadow-xs hover:shadow-md transition-all"
                    >
                      <img
                        src={photo.url}
                        alt={photo.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3 text-white">
                        <p className="font-serif text-xs font-medium truncate">{photo.title}</p>
                        <p className="text-[10px] text-white/80">{photo.category || photo.location || 'Piece'}</p>
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
                <span>전시 작품 감상하기</span>
              </button>
              {onGoToGallery && (
                <button
                  onClick={onGoToGallery}
                  className="inline-flex items-center gap-2 px-6 py-3.5 bg-white border border-[#c4c7c7] text-[#1a1c1c] rounded-full font-sans text-sm font-semibold hover:bg-[#f0f0f0] transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-lg">grid_view</span>
                  <span>전체 메인 갤러리로 이동</span>
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
                  <span>"{currentExhibition.title}" 수록 작품 ({exhibitionPhotos.length}점)</span>
                </h2>
                <p className="text-xs text-[#747878] mt-0.5">
                  선택한 전시 당시에 큐레이션된 작품들입니다. 사진을 클릭하면 고화질 디테일로 볼 수 있습니다.
                </p>
              </div>

              {exhibitionPhotos.length > 0 && onViewPhoto && (
                <button
                  onClick={handleStartExhibitionTour}
                  className="px-5 py-2.5 bg-[#000000] text-white rounded-full text-xs font-semibold hover:bg-opacity-80 transition-all shadow-md flex items-center gap-2 cursor-pointer shrink-0"
                >
                  <span className="material-symbols-outlined text-base text-amber-400">play_circle</span>
                  <span>전체 연속 슬라이드 관람</span>
                </button>
              )}
            </div>

            {exhibitionPhotos.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-[#c4c7c7]/30 p-8 space-y-3">
                <span className="material-symbols-outlined text-4xl text-[#747878]">photo_library</span>
                <p className="text-sm font-medium text-[#444748]">선택된 전시 작품이 없습니다.</p>
                {isAdmin && onOpenEditModal && (
                  <button
                    onClick={onOpenEditModal}
                    className="px-4 py-2 bg-black text-white text-xs rounded-full cursor-pointer"
                  >
                    편집에서 작품 큐레이션하기
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {exhibitionPhotos.map((photo, index) => (
                  <div
                    key={photo.id}
                    onClick={() => onViewPhoto && onViewPhoto(photo, exhibitionPhotos, `전시: ${currentExhibition.title}`)}
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
              {currentExhibition.artistPhoto ? (
                <div className="w-28 h-28 md:w-36 md:h-36 rounded-2xl overflow-hidden border-2 border-[#c4c7c7]/60 shrink-0 shadow-sm bg-[#e2e2e2]">
                  <img
                    src={currentExhibition.artistPhoto}
                    alt={currentExhibition.artistName || 'Artist'}
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
                  {currentExhibition.artistName || 'Juno'}
                </h3>
                {currentExhibition.artistRole && (
                  <p className="font-sans text-sm text-[#444748] font-medium">
                    {currentExhibition.artistRole}
                  </p>
                )}
              </div>
            </div>

            {/* Featured Quote */}
            {currentExhibition.artistQuote && (
              <div className="relative bg-[#f0f0f0] rounded-2xl p-8 md:p-10 border border-[#c4c7c7]/50 text-center space-y-3">
                <span className="material-symbols-outlined text-4xl text-[#747878] block mx-auto">
                  format_quote
                </span>
                <p className="font-serif text-lg md:text-2xl text-[#000000] italic font-medium leading-relaxed max-w-2xl mx-auto">
                  "{currentExhibition.artistQuote}"
                </p>
              </div>
            )}

            {/* Artist Note Statement Essay */}
            <div className="bg-white rounded-2xl p-6 md:p-10 border border-[#c4c7c7]/40 shadow-xs space-y-6">
              <div className="flex items-center gap-3 text-[#000000]">
                <span className="material-symbols-outlined text-2xl">edit_note</span>
                <h2 className="font-serif text-2xl font-semibold">이 전시의 작가 노트 (Artist Statement)</h2>
              </div>

              <div className="font-sans text-[#1a1c1c] text-base md:text-lg leading-relaxed md:leading-loose whitespace-pre-line font-normal space-y-4">
                {currentExhibition.artistNote || '작가 노트가 등록되지 않았습니다.'}
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

        {/* Tab 4: Exhibitions Archive */}
        {activeTab === 'archive' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="bg-white p-6 rounded-2xl border border-[#c4c7c7]/40 shadow-xs space-y-2">
              <h2 className="font-serif text-2xl font-bold text-[#000000] flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-600">inventory_2</span>
                <span>역대 기획 전시 아카이브 (Exhibition History)</span>
              </h2>
              <p className="text-xs text-[#747878]">
                과거에 개최되었던 전시와 작가 노트, 당시 선보인 사진 컬렉션을 언제든 다시 열람할 수 있습니다.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {exhibitions.map((ex) => {
                const selectedIds = ex.exhibitionPhotoIds || [];
                const exPhotoCount = selectedIds.length > 0
                  ? photos.filter((p) => selectedIds.includes(p.id)).length
                  : photos.filter((p) => p.featured).length > 0
                  ? photos.filter((p) => p.featured).length
                  : photos.length;
                const isSelected = ex.id === currentExhibition.id;
                const isActiveMain = ex.id === activeExhibitionId;

                return (
                  <div
                    key={ex.id}
                    className={`bg-white rounded-2xl overflow-hidden border transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-2 border-[#000000] shadow-lg ring-1 ring-amber-300'
                        : 'border-[#c4c7c7]/40 hover:border-[#000000] hover:shadow-md'
                    }`}
                  >
                    <div>
                      {/* Cover Poster Header */}
                      <div className="relative h-48 bg-[#e2e2e2] overflow-hidden">
                        {ex.introImage ? (
                          <img
                            src={ex.introImage}
                            alt={ex.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#747878]">
                            <span className="material-symbols-outlined text-4xl">museum</span>
                          </div>
                        )}

                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                        <div className="absolute top-3 left-3 flex gap-1.5">
                          {isActiveMain && (
                            <span className="px-2.5 py-1 bg-amber-500 text-black text-[10px] font-bold rounded-full shadow-xs">
                              ★ 메인 대표 전시
                            </span>
                          )}
                          <span className="px-2.5 py-1 bg-black/60 backdrop-blur-md text-white text-[10px] font-medium rounded-full">
                            {ex.status === 'active'
                              ? '진행 중'
                              : ex.status === 'upcoming'
                              ? '개설 예정'
                              : '종료 / 아카이브'}
                          </span>
                        </div>

                        <div className="absolute bottom-3 left-3 right-3 text-white">
                          <h3 className="font-serif text-lg font-bold truncate">{ex.title}</h3>
                          <p className="text-xs text-white/80 line-clamp-1">{ex.subtitle}</p>
                        </div>
                      </div>

                      {/* Info Body */}
                      <div className="p-5 space-y-3">
                        <div className="text-xs text-[#747878] space-y-1">
                          <p className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">calendar_month</span>
                            <span>{ex.period || '기간 정보 없음'}</span>
                          </p>
                          {ex.location && (
                            <p className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-sm">location_on</span>
                              <span>{ex.location}</span>
                            </p>
                          )}
                        </div>

                        <p className="text-xs text-[#444748] line-clamp-3 leading-relaxed">
                          {ex.introText}
                        </p>
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-4 bg-[#f9f9f9] border-t border-[#f0f0f0] flex items-center justify-between">
                      <span className="text-xs text-[#747878] font-medium">
                        작품수: <strong className="text-[#000000]">{exPhotoCount}점</strong>
                      </span>

                      <button
                        onClick={() => {
                          handleSwitchExhibition(ex.id);
                          setActiveTab('intro');
                        }}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all flex items-center gap-1 ${
                          isSelected
                            ? 'bg-[#000000] text-white'
                            : 'bg-white border border-[#c4c7c7] text-[#1a1c1c] hover:bg-[#e2e2e2]'
                        }`}
                      >
                        <span>{isSelected ? '현재 관람 중' : '전시 보기'}</span>
                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
