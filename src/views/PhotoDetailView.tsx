import React, { useState, useEffect } from 'react';
import { Photo } from '../types';

interface PhotoDetailViewProps {
  photo: Photo;
  allPhotos: Photo[];
  initialFilterLabel?: string | null;
  onClearContextFilter?: () => void;
  onBack: () => void;
  onSelectPhoto: (photo: Photo) => void;
  onEditPhoto: (photo: Photo) => void;
  onDeletePhoto: (photo: Photo) => void;
  isAdmin?: boolean;
  onRequireAdmin?: () => void;
}

export const PhotoDetailView: React.FC<PhotoDetailViewProps> = ({
  photo,
  allPhotos,
  initialFilterLabel,
  onClearContextFilter,
  onBack,
  onSelectPhoto,
  onEditPhoto,
  onDeletePhoto,
  isAdmin = false,
  onRequireAdmin,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const [internalTagFilter, setInternalTagFilter] = useState<string | null>(null);

  // Fullscreen Theater Mode states
  const [isPlaying, setIsPlaying] = useState(false);
  const [slideInterval, setSlideInterval] = useState(5); // 5 seconds
  const [showInfoOverlay, setShowInfoOverlay] = useState(true);
  const [isControlsVisible, setIsControlsVisible] = useState(true);
  const [isZoomed, setIsZoomed] = useState(false);
  const controlsTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Compute effective photos list based on internal tag filter or initial list
  const effectivePhotos = React.useMemo(() => {
    if (internalTagFilter) {
      const norm = internalTagFilter.toLowerCase().replace(/^#/, '');
      return allPhotos.filter((p) =>
        p.tags.some((t) => t.toLowerCase().replace(/^#/, '') === norm)
      );
    }
    return allPhotos;
  }, [allPhotos, internalTagFilter]);

  // Index of current photo in effectivePhotos
  const currentIndex = effectivePhotos.findIndex((p) => p.id === photo.id);

  // If current photo is not in effectivePhotos when tag filter changes, select first match
  useEffect(() => {
    if (effectivePhotos.length > 0 && currentIndex === -1) {
      onSelectPhoto(effectivePhotos[0]);
    }
  }, [effectivePhotos, currentIndex, onSelectPhoto]);

  const handlePrev = () => {
    if (effectivePhotos.length === 0) return;
    const prevIdx = currentIndex > 0 ? currentIndex - 1 : effectivePhotos.length - 1;
    onSelectPhoto(effectivePhotos[prevIdx]);
  };

  const handleNext = () => {
    if (effectivePhotos.length === 0) return;
    const nextIdx = currentIndex < effectivePhotos.length - 1 ? currentIndex + 1 : 0;
    onSelectPhoto(effectivePhotos[nextIdx]);
  };

  const handleClearFilter = () => {
    setInternalTagFilter(null);
    if (onClearContextFilter) {
      onClearContextFilter();
    }
  };

  const currentFilterText = internalTagFilter
    ? `태그: #${internalTagFilter.replace(/^#/, '')}`
    : initialFilterLabel;

  const lastWheelTimeRef = React.useRef<number>(0);

  // Slideshow auto-advance timer
  useEffect(() => {
    if (!isFullscreen || !isPlaying) return;
    const timer = setInterval(() => {
      handleNext();
    }, slideInterval * 1000);
    return () => clearInterval(timer);
  }, [isFullscreen, isPlaying, slideInterval, currentIndex, effectivePhotos]);

  // Auto-hide controls in fullscreen theater mode
  const handleMouseMoveTheater = () => {
    setIsControlsVisible(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setIsControlsVisible(false);
      }
    }, 2500);
  };

  useEffect(() => {
    if (!isFullscreen) {
      setIsPlaying(false);
      setIsZoomed(false);
      setIsControlsVisible(true);
    }
  }, [isFullscreen]);

  // Keyboard Navigation & Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === ' ') {
        if (isFullscreen) {
          e.preventDefault();
          setIsPlaying((prev) => !prev);
        }
      } else if (e.key.toLowerCase() === 'f' && isFullscreen) {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen?.().catch(() => {});
        } else {
          document.exitFullscreen?.().catch(() => {});
        }
      } else if (e.key === 'Escape') {
        if (isFullscreen) {
          setIsFullscreen(false);
        } else {
          onBack();
        }
      }
    };

    const handleWheel = (e: WheelEvent) => {
      // Don't trigger if user is scrolling inside sidebar description panel
      const target = e.target as HTMLElement;
      if (target && target.closest('aside')) return;

      const now = Date.now();
      if (now - lastWheelTimeRef.current < 300) return; // 300ms cooldown

      if (Math.abs(e.deltaY) > 15 || Math.abs(e.deltaX) > 15) {
        lastWheelTimeRef.current = now;
        if (e.deltaY > 0 || e.deltaX > 0) {
          handleNext();
        } else {
          handlePrev();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('wheel', handleWheel, { passive: true });
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('wheel', handleWheel);
    };
  }, [currentIndex, effectivePhotos, isFullscreen]);

  const touchStartXRef = React.useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diffX = touchStartXRef.current - touchEndX;
    if (Math.abs(diffX) > 40) {
      if (diffX > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
    touchStartXRef.current = null;
  };

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = photo.url;
    a.download = `${photo.title.replace(/\s+/g, '_')}.jpg`;
    a.target = '_blank';
    a.click();
  };

  const handleEditClick = () => {
    if (!isAdmin && onRequireAdmin) {
      onRequireAdmin();
    } else {
      onEditPhoto(photo);
    }
  };

  const handleDeleteClick = () => {
    if (!isAdmin && onRequireAdmin) {
      onRequireAdmin();
    } else {
      onDeletePhoto(photo);
    }
  };

  return (
    <div className="bg-[#f9f9f9] text-[#1a1c1c] h-screen max-h-screen overflow-hidden flex flex-col font-sans">
      {/* Header Action Bar */}
      <header className="w-full flex-shrink-0 flex justify-between items-center px-4 md:px-10 py-3.5 bg-[#f9f9f9] border-b border-[#e2e2e2]/60 z-40">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-[#444748] hover:text-[#000000] transition-colors group cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px] group-hover:-translate-x-1 transition-transform">
              arrow_back
            </span>
            <span className="font-semibold text-sm">Back to Gallery</span>
          </button>

          {/* Active Filter Badge */}
          {currentFilterText && (
            <div className="flex items-center gap-2 bg-[#000000] text-white text-xs px-3 py-1.5 rounded-full shadow-sm">
              <span className="material-symbols-outlined text-sm text-amber-400">filter_alt</span>
              <span className="font-semibold">{currentFilterText}</span>
              <span className="text-white/70">
                ({effectivePhotos.length > 0 ? `${currentIndex + 1}/${effectivePhotos.length}` : '0'})
              </span>
              <button
                onClick={handleClearFilter}
                title="필터 해제 (전체 사진 보기)"
                aria-label="필터 해제"
                className="ml-1 hover:bg-white/20 rounded-full w-4 h-4 flex items-center justify-center text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleEditClick}
            aria-label="Edit photo"
            title={isAdmin ? "Edit Photo" : "관리자 로그인 필요"}
            className="w-10 h-10 rounded-full flex items-center justify-center border border-[#c4c7c7] text-[#444748] hover:border-[#000000] hover:text-[#000000] transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">edit</span>
          </button>
          <button
            onClick={handleDeleteClick}
            aria-label="Delete photo"
            title={isAdmin ? "Delete Photo" : "관리자 로그인 필요"}
            className="w-10 h-10 rounded-full flex items-center justify-center border border-[#c4c7c7] text-[#ba1a1a] hover:bg-[#ffdad6] hover:border-[#ba1a1a] transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">delete</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 min-h-0 flex flex-col lg:flex-row w-full pl-4 md:pl-8 pr-0 gap-6 pb-3 transition-all relative overflow-hidden">
        {/* Floating Side Toggle Button for Description Panel */}
        <button
          onClick={() => setShowPanel(!showPanel)}
          title={showPanel ? '오른쪽 설명 패널 감추기' : '오른쪽 설명 패널 나타내기'}
          aria-label={showPanel ? '설명 패널 감추기' : '설명 패널 보기'}
          className={`fixed top-1/2 -translate-y-1/2 z-30 transition-all duration-300 cursor-pointer shadow-xl flex items-center justify-center border-y border-l rounded-l-2xl ${
            showPanel
              ? 'right-0 lg:right-[380px] bg-white/90 hover:bg-white text-[#1a1c1c] border-[#c4c7c7] p-3 hover:border-[#000000]'
              : 'right-0 bg-[#000000] text-white border-[#000000] p-3 hover:bg-opacity-90 hover:scale-105'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">
            {showPanel ? 'chevron_right' : 'dock_to_left'}
          </span>
        </button>

        {/* Photo Viewer Container */}
        <div className="flex-1 min-h-0 min-w-0 h-full relative flex flex-col items-center justify-between transition-all">
          {/* Main Image Container */}
          <div
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            className="relative group w-full flex-1 min-h-0 flex items-center justify-center p-2 select-none"
          >
            {/* Left Navigation Arrow */}
            <button
              onClick={handlePrev}
              aria-label="Previous photo"
              title="이전 사진"
              className="absolute left-2 md:left-8 top-1/2 -translate-y-1/2 w-11 h-11 md:w-12 md:h-12 rounded-full bg-white/90 hover:bg-white text-[#1a1c1c] backdrop-blur-md shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all duration-300 z-20 cursor-pointer border border-[#c4c7c7]/40"
            >
              <span className="material-symbols-outlined text-[24px]">chevron_left</span>
            </button>

            {/* Right Navigation Arrow */}
            <button
              onClick={handleNext}
              aria-label="Next photo"
              title="다음 사진"
              className="absolute right-2 md:right-8 top-1/2 -translate-y-1/2 w-11 h-11 md:w-12 md:h-12 rounded-full bg-white/90 hover:bg-white text-[#1a1c1c] backdrop-blur-md shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all duration-300 z-20 cursor-pointer border border-[#c4c7c7]/40"
            >
              <span className="material-symbols-outlined text-[24px]">chevron_right</span>
            </button>

            <img
              key={photo.id}
              src={photo.url}
              alt={photo.title}
              className="max-w-full max-h-full object-contain rounded-xl ambient-shadow shadow-2xl animate-smooth-fade pointer-events-none"
            />

            {/* Fullscreen Overlay Toggle Button */}
            <button
              onClick={() => setIsFullscreen(true)}
              aria-label="Toggle Fullscreen"
              title="전체 화면으로 감상하기"
              className="absolute bottom-4 right-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur-md opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity flex items-center justify-center text-[#1a1c1c] hover:text-[#000000] shadow-sm cursor-pointer z-20"
            >
              <span className="material-symbols-outlined text-[20px]">fullscreen</span>
            </button>
          </div>

          {/* Thumbnail Carousel (Hover at bottom area to reveal) */}
          <div className="w-full flex-shrink-0 pt-1 pb-1 group/bottomBar flex flex-col items-center justify-end relative z-30">
            {/* Hover indicator pill */}
            <div className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-[#c4c7c7]/40 text-xs font-semibold text-[#1a1c1c] shadow-md group-hover/bottomBar:opacity-0 transition-all duration-300 cursor-pointer pointer-events-auto">
              <span className="material-symbols-outlined text-sm">photo_library</span>
              <span>사진 목록</span>
            </div>

            {/* Slide-up Carousel */}
            <div className="absolute bottom-1 w-full max-w-3xl flex justify-center gap-2.5 overflow-x-auto p-2.5 rounded-2xl bg-white/85 backdrop-blur-xl border border-[#c4c7c7]/40 shadow-2xl opacity-0 translate-y-4 pointer-events-none group-hover/bottomBar:opacity-100 group-hover/bottomBar:translate-y-0 group-hover/bottomBar:pointer-events-auto transition-all duration-300 scrollbar-hide">
              {effectivePhotos.map((item) => {
                const isCurrent = item.id === photo.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => onSelectPhoto(item)}
                    className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${
                      isCurrent
                        ? 'border-[#000000] scale-105 shadow-md'
                        : 'border-transparent hover:border-[#c4c7c7] opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={item.url}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Translucent Sidebar / Details Panel Docked Right */}
        {showPanel && (
          <aside className="w-full lg:w-[380px] flex-shrink-0 flex flex-col gap-5 py-6 px-6 bg-white/80 backdrop-blur-xl border-l border-y border-[#c4c7c7]/30 rounded-l-2xl shadow-xl h-full max-h-full overflow-y-auto animate-fadeIn z-20">
            {/* Title & Description */}
            <div className="flex flex-col gap-3">
              <h1 className="font-serif text-3xl font-bold text-[#000000] leading-tight">
                {photo.title}
              </h1>
              <p className="font-sans text-sm text-[#444748] leading-relaxed">
                {photo.description}
              </p>
            </div>

            <hr className="border-t border-[#e2e2e2]/80 w-full" />

            {/* Metadata / EXIF */}
            <div className="flex flex-col gap-3">
              <h2 className="font-sans text-sm font-semibold text-[#000000] uppercase tracking-wider">
                Details
              </h2>
              <ul className="flex flex-col gap-2.5 text-xs text-[#444748]">
                {photo.date && (
                  <li className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                    <span>{photo.date}</span>
                  </li>
                )}
                {photo.location && (
                  <li className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[18px]">location_on</span>
                    <span>{photo.location}</span>
                  </li>
                )}
                {photo.camera && (
                  <li className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[18px]">camera</span>
                    <span>{photo.camera}</span>
                  </li>
                )}
                {photo.exif && (
                  <li className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[18px]">shutter_speed</span>
                    <span>{photo.exif}</span>
                  </li>
                )}
              </ul>
            </div>

            <hr className="border-t border-[#e2e2e2]/80 w-full" />

            {/* Tags */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h2 className="font-sans text-sm font-semibold text-[#000000] uppercase tracking-wider">
                  Tags
                </h2>
                {internalTagFilter && (
                  <button
                    onClick={() => setInternalTagFilter(null)}
                    className="text-[11px] text-[#747878] hover:text-[#000000] underline cursor-pointer"
                  >
                    태그 필터 해제
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {photo.tags.map((t, idx) => {
                  const normTag = t.replace(/^#/, '');
                  const isSelected = internalTagFilter?.toLowerCase() === normTag.toLowerCase();
                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        if (isSelected) {
                          setInternalTagFilter(null);
                        } else {
                          setInternalTagFilter(normTag);
                        }
                      }}
                      title={`'${normTag}' 태그 모아보기`}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-all border ${
                        isSelected
                          ? 'bg-[#000000] text-white border-[#000000] shadow-sm'
                          : 'bg-[#f3f3f4]/90 text-[#444748] border-transparent hover:bg-[#e2e2e2]'
                      }`}
                    >
                      {t.startsWith('#') ? t : `#${t}`}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Download Action */}
            <div className="pt-2">
              <button
                onClick={handleDownload}
                className="w-full py-3.5 rounded-lg bg-[#000000] text-white font-sans text-xs uppercase tracking-wider font-semibold flex items-center justify-center gap-2 hover:bg-opacity-90 transition-colors cursor-pointer shadow-xs"
              >
                <span className="material-symbols-outlined text-[18px]">download</span>
                Download Original
              </button>
            </div>
          </aside>
        )}
      </main>

      {/* Fullscreen Theater Focus Mode */}
      {isFullscreen && (
        <div
          onMouseMove={handleMouseMoveTheater}
          onClick={handleMouseMoveTheater}
          className="fixed inset-0 z-50 bg-black flex flex-col justify-between overflow-hidden select-none animate-fadeIn group/theater"
        >
          {/* Subtle Glassmorphism Slideshow Progress Bar at Top */}
          {isPlaying && (
            <div className="absolute top-0 left-0 right-0 h-1 bg-black/40 backdrop-blur-xs z-50 overflow-hidden">
              <div
                key={photo.id}
                style={{ animationDuration: `${slideInterval}s` }}
                className="h-full bg-white/40 backdrop-blur-md animate-[progress_linear_infinite]"
              />
            </div>
          )}

          {/* Top Control Bar (Glassmorphism & Auto-hides) */}
          <header
            className={`relative z-40 w-full flex items-center justify-between px-6 py-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent transition-opacity duration-500 ${
              isControlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            {/* Left Counter Badge */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-black/40 border border-white/15 text-white/90 text-xs px-3.5 py-1.5 rounded-full backdrop-blur-xl shadow-lg">
                <span className="material-symbols-outlined text-sm text-white/70">photo_library</span>
                <span className="font-medium text-white/90">
                  {effectivePhotos.length > 0 ? `${currentIndex + 1} / ${effectivePhotos.length}` : '0'}
                </span>
                {currentFilterText && (
                  <span className="text-white/70 border-l border-white/20 pl-2">
                    {currentFilterText}
                  </span>
                )}
              </div>

              {/* Keyboard Tip */}
              <span className="hidden lg:inline-block text-[11px] text-white/40 font-light">
                [Space] 재생/정지 • [F] 전체화면 • [←/→] 이동
              </span>
            </div>

            {/* Right Action Controls */}
            <div className="flex items-center gap-2">
              {/* Slideshow Play / Pause */}
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                title={isPlaying ? '슬라이드쇼 일시정지 (Space)' : '슬라이드쇼 자동재생 (Space)'}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium backdrop-blur-xl transition-all cursor-pointer border ${
                  isPlaying
                    ? 'bg-white/25 text-white border-white/40 shadow-lg shadow-black/50'
                    : 'bg-black/40 text-white/80 border-white/15 hover:bg-black/60 hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {isPlaying ? 'pause' : 'play_arrow'}
                </span>
                <span>{isPlaying ? 'PAUSE' : 'SLIDESHOW'}</span>
              </button>

              {/* Interval Speed Switcher */}
              {isPlaying && (
                <div className="flex items-center bg-black/40 border border-white/15 rounded-full p-0.5 text-[11px] backdrop-blur-xl text-white/70">
                  {[3, 5, 8].map((sec) => (
                    <button
                      key={sec}
                      onClick={() => setSlideInterval(sec)}
                      className={`px-2.5 py-1 rounded-full font-medium transition-all cursor-pointer ${
                        slideInterval === sec ? 'bg-white/30 text-white font-bold' : 'hover:text-white'
                      }`}
                    >
                      {sec}s
                    </button>
                  ))}
                </div>
              )}

              {/* Title Overlay Toggle */}
              <button
                onClick={() => setShowInfoOverlay(!showInfoOverlay)}
                title={showInfoOverlay ? '제목 숨기기' : '제목 보기'}
                className={`w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-xl transition-all cursor-pointer border ${
                  showInfoOverlay
                    ? 'bg-white/30 text-white border-white/40'
                    : 'bg-black/40 text-white/80 border-white/15 hover:bg-black/60 hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">title</span>
              </button>

              {/* Zoom Toggle */}
              <button
                onClick={() => setIsZoomed(!isZoomed)}
                title={isZoomed ? '원래 크기로' : '확대해서 보기'}
                className={`w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-xl transition-all cursor-pointer border ${
                  isZoomed
                    ? 'bg-white/30 text-white border-white/40'
                    : 'bg-black/40 text-white/80 border-white/15 hover:bg-black/60 hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {isZoomed ? 'zoom_out' : 'zoom_in'}
                </span>
              </button>

              {/* Close Button */}
              <button
                onClick={() => setIsFullscreen(false)}
                title="전체 화면 감상 종료 (Esc)"
                aria-label="Close theater mode"
                className="w-9 h-9 rounded-full bg-black/40 hover:bg-red-600/80 text-white backdrop-blur-xl border border-white/15 flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
          </header>

          {/* Center Main Stage (Image Area) */}
          <div
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            className="relative flex-1 w-full flex items-center justify-center z-10 p-2 md:p-6 overflow-hidden select-none"
          >
            {/* Nav Prev Button */}
            <button
              onClick={handlePrev}
              aria-label="Previous photo"
              title="이전 사진 (Left Arrow)"
              className={`absolute left-2 md:left-8 top-1/2 -translate-y-1/2 w-11 h-11 md:w-14 md:h-14 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-xl border border-white/20 flex items-center justify-center transition-all duration-300 cursor-pointer z-30 hover:scale-110 active:scale-95 shadow-2xl ${
                isControlsVisible ? 'opacity-100' : 'opacity-80 lg:opacity-0 pointer-events-auto'
              }`}
            >
              <span className="material-symbols-outlined text-[28px] md:text-[32px]">chevron_left</span>
            </button>

            {/* Nav Next Button */}
            <button
              onClick={handleNext}
              aria-label="Next photo"
              title="다음 사진 (Right Arrow)"
              className={`absolute right-2 md:right-8 top-1/2 -translate-y-1/2 w-11 h-11 md:w-14 md:h-14 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-xl border border-white/20 flex items-center justify-center transition-all duration-300 cursor-pointer z-30 hover:scale-110 active:scale-95 shadow-2xl ${
                isControlsVisible ? 'opacity-100' : 'opacity-80 lg:opacity-0 pointer-events-auto'
              }`}
            >
              <span className="material-symbols-outlined text-[28px] md:text-[32px]">chevron_right</span>
            </button>

            {/* Main Center Image */}
            <div
              key={photo.id}
              className={`relative max-w-full max-h-full flex items-center justify-center transition-all duration-500 animate-smooth-fade ${
                isZoomed ? 'cursor-zoom-out scale-125' : 'cursor-zoom-in'
              }`}
              onClick={() => setIsZoomed(!isZoomed)}
            >
              <img
                src={photo.url}
                alt={photo.title}
                className="max-w-full max-h-[85vh] object-contain rounded-md shadow-[0_25px_60px_rgba(0,0,0,0.9)]"
              />
            </div>
          </div>

          {/* Bottom Caption & Mini Filmstrip */}
          <footer className="relative z-40 w-full flex flex-col items-center gap-3 px-6 pb-6 pt-2 pointer-events-none">
            {/* Title-Only Minimal Borderless Caption (Always visible when enabled) */}
            {showInfoOverlay && (
              <div
                key={photo.id}
                className="px-6 py-1.5 text-white flex items-center justify-center animate-smooth-fade max-w-3xl pointer-events-auto"
              >
                <h2 className="font-serif text-base md:text-xl font-normal text-white/95 tracking-wide text-center drop-shadow-[0_2px_12px_rgba(0,0,0,0.95)] truncate">
                  {photo.title}
                </h2>
              </div>
            )}

            {/* Mini Filmstrip Thumbnails Bar (Glassmorphism, Auto-hides with controls) */}
            <div
              className={`max-w-xl w-full flex items-center justify-center gap-2 overflow-x-auto p-2 bg-black/40 border border-white/15 rounded-2xl backdrop-blur-xl scrollbar-hide shadow-2xl transition-opacity duration-500 pointer-events-auto ${
                isControlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
            >
              {effectivePhotos.map((item) => {
                const isCurrent = item.id === photo.id;
                return (
                  <button
                    key={item.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectPhoto(item);
                    }}
                    className={`flex-shrink-0 w-12 h-12 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                      isCurrent
                        ? 'border-white scale-105 shadow-[0_0_12px_rgba(255,255,255,0.4)] opacity-100'
                        : 'border-transparent opacity-40 hover:opacity-100 hover:border-white/40'
                    }`}
                  >
                    <img src={item.url} alt={item.title} className="w-full h-full object-cover" />
                  </button>
                );
              })}
            </div>
          </footer>
        </div>
      )}
    </div>
  );
};
