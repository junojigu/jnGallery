import React, { useState } from 'react';
import { ActiveView } from '../types';

interface HeaderProps {
  siteName?: string;
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onOpenUpload: () => void;
  isAdmin: boolean;
  onOpenAdminLogin: () => void;
  onAdminLogout: () => void;
  onOpenHomeEdit?: () => void;
  onChangePassword?: () => void;
  transparent?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  siteName = 'Photo Moments',
  activeView,
  setActiveView,
  searchQuery,
  setSearchQuery,
  onOpenUpload,
  isAdmin,
  onOpenAdminLogin,
  onAdminLogout,
  onOpenHomeEdit,
  onChangePassword,
  transparent = false
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleNavClick = (view: ActiveView) => {
    setActiveView(view);
    setIsMobileMenuOpen(false);
  };
  return (
    <header
      id="main-header"
      className={`w-full z-40 transition-all duration-300 ${
        transparent
          ? 'absolute top-0 text-white'
          : 'bg-[#f9f9f9] border-b border-[#c4c7c7] shadow-sm sticky top-0 text-[#1a1c1c]'
      }`}
    >
      <div className="flex justify-between items-center w-full px-4 md:px-10 py-3.5 max-w-[1280px] mx-auto">
        {/* Brand */}
        <button
          onClick={() => handleNavClick('home')}
          className="font-serif text-2xl md:text-3xl font-semibold tracking-tight hover:opacity-80 transition-opacity text-left cursor-pointer"
        >
          {siteName || 'Photo Moments'}
        </button>

        {/* Right Section: Search & Universal Hamburger Menu Toggle */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Search bar in Gallery mode */}
          {activeView === 'gallery' && (
            <div className="relative hidden sm:block w-44 md:w-60 lg:w-72">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#747878] text-lg">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="사진, 태그 검색..."
                className={`w-full text-xs md:text-sm rounded-full py-1.5 pl-9 pr-7 focus:outline-none focus:ring-1 focus:ring-[#000000] transition-all placeholder:text-[#747878] ${
                  transparent
                    ? 'bg-white/20 border border-white/30 text-white placeholder:text-white/70'
                    : 'bg-[#f3f3f4] border border-[#c4c7c7] text-[#1a1c1c]'
                }`}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#747878] hover:text-[#000000]"
                >
                  <span className="material-symbols-outlined text-xs">close</span>
                </button>
              )}
            </div>
          )}

          {/* Universal Hamburger Toggle Button (All screen sizes) */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle Menu"
            title="메뉴 열기/닫기"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer border ${
              transparent
                ? 'bg-white/20 text-white border-white/30 hover:bg-white/30 backdrop-blur-md'
                : isMobileMenuOpen
                ? 'bg-[#000000] text-white border-[#000000]'
                : 'bg-white text-[#1a1c1c] border-[#c4c7c7] hover:border-[#000000] hover:shadow-xs'
            }`}
          >
            <span className="material-symbols-outlined text-lg">
              {isMobileMenuOpen ? 'close' : 'menu'}
            </span>
            <span className="hidden sm:inline font-sans">
              {isMobileMenuOpen ? '닫기' : '메뉴'}
            </span>
          </button>
        </div>
      </div>

      {/* Universal Dropdown Menu Drawer */}
      {isMobileMenuOpen && (
        <div
          className={`w-full border-b shadow-xl transition-all animate-fadeIn ${
            transparent
              ? 'bg-[#121212]/95 backdrop-blur-2xl text-white border-white/20'
              : 'bg-[#ffffff] text-[#1a1c1c] border-[#c4c7c7]'
          }`}
        >
          <div className="max-w-[1280px] mx-auto px-5 py-5 md:px-10 space-y-4">
            {/* Mobile-only Search input inside menu */}
            {activeView === 'gallery' && (
              <div className="relative w-full sm:hidden mb-2">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#747878] text-lg">
                  search
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="사진, 태그 검색..."
                  className="w-full bg-[#f3f3f4] border border-[#c4c7c7] text-[#1a1c1c] text-sm rounded-full py-2 pl-9 pr-8 focus:outline-none focus:ring-1 focus:ring-[#000000]"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#747878]"
                  >
                    <span className="material-symbols-outlined text-xs">close</span>
                  </button>
                )}
              </div>
            )}

            {/* Navigation Vertical List */}
            <nav className="flex flex-col space-y-1.5 max-w-md">
              <button
                onClick={() => handleNavClick('home')}
                className={`text-left text-sm font-semibold py-2.5 px-4 rounded-xl transition-all cursor-pointer flex items-center justify-between ${
                  activeView === 'home'
                    ? transparent
                      ? 'bg-white/20 text-white font-bold'
                      : 'bg-[#000000] text-white shadow-xs'
                    : transparent
                    ? 'hover:bg-white/10 text-white/90'
                    : 'hover:bg-[#f3f3f4] text-[#1a1c1c]'
                }`}
              >
                <span>Home</span>
                <span className="material-symbols-outlined text-base opacity-60">chevron_right</span>
              </button>

              <button
                onClick={() => handleNavClick('gallery')}
                className={`text-left text-sm font-semibold py-2.5 px-4 rounded-xl transition-all cursor-pointer flex items-center justify-between ${
                  activeView === 'gallery'
                    ? transparent
                      ? 'bg-white/20 text-white font-bold'
                      : 'bg-[#000000] text-white shadow-xs'
                    : transparent
                    ? 'hover:bg-white/10 text-white/90'
                    : 'hover:bg-[#f3f3f4] text-[#1a1c1c]'
                }`}
              >
                <span>Gallery</span>
                <span className="material-symbols-outlined text-base opacity-60">photo_library</span>
              </button>

              {isAdmin && (
                <button
                  onClick={() => handleNavClick('categories')}
                  className={`text-left text-sm font-semibold py-2.5 px-4 rounded-xl transition-all cursor-pointer flex items-center justify-between ${
                    activeView === 'categories'
                      ? transparent
                        ? 'bg-white/20 text-white font-bold'
                        : 'bg-[#000000] text-white shadow-xs'
                      : transparent
                      ? 'hover:bg-white/10 text-white/90'
                      : 'hover:bg-[#f3f3f4] text-[#1a1c1c]'
                  }`}
                >
                  <span>Categories</span>
                  <span className="material-symbols-outlined text-base opacity-60">category</span>
                </button>
              )}

              <button
                onClick={() => handleNavClick('exhibition')}
                className={`w-full text-left text-sm font-semibold py-2.5 px-4 rounded-xl transition-all cursor-pointer flex items-center justify-between border ${
                  activeView === 'exhibition'
                    ? transparent
                      ? 'bg-white/20 text-white font-bold border-white/40'
                      : 'bg-[#000000] text-white border-[#000000] shadow-xs'
                    : transparent
                    ? 'bg-white/10 hover:bg-white/20 text-white border-white/20'
                    : 'bg-[#f8f9fa] hover:bg-[#f0f0f0] text-[#1a1c1c] border-[#c4c7c7]/60'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg">auto_stories</span>
                  <span>소개 & 작가 노트</span>
                </div>
                <span className="material-symbols-outlined text-base opacity-60">menu_book</span>
              </button>
            </nav>

            {/* Admin Controls Section */}
            <div
              className={`pt-3 border-t flex flex-wrap items-center justify-between gap-3 ${
                transparent ? 'border-white/20' : 'border-[#e2e2e2]'
              }`}
            >
              {isAdmin ? (
                <>
                  <div className="flex flex-wrap items-center gap-2">
                    {onOpenHomeEdit && (
                      <button
                        onClick={() => {
                          onOpenHomeEdit();
                          setIsMobileMenuOpen(false);
                        }}
                        className={`px-3 py-2 border rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                          transparent
                            ? 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                            : 'bg-[#f0f0f0] border-[#c4c7c7] text-[#1a1c1c] hover:bg-[#e2e2e2]'
                        }`}
                      >
                        <span className="material-symbols-outlined text-base text-amber-500">settings</span>
                        <span>사이트 설정</span>
                      </button>
                    )}

                    {onChangePassword && (
                      <button
                        onClick={() => {
                          onChangePassword();
                          setIsMobileMenuOpen(false);
                        }}
                        className={`px-3 py-2 border rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                          transparent
                            ? 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                            : 'bg-[#f0f0f0] border-[#c4c7c7] text-[#1a1c1c] hover:bg-[#e2e2e2]'
                        }`}
                      >
                        <span className="material-symbols-outlined text-base text-gray-500">key</span>
                        <span>비밀번호 변경</span>
                      </button>
                    )}

                    {activeView !== 'home' && (
                      <button
                        onClick={() => {
                          onOpenUpload();
                          setIsMobileMenuOpen(false);
                        }}
                        className="px-3 py-2 bg-[#000000] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer hover:bg-opacity-90 shadow-xs"
                      >
                        <span className="material-symbols-outlined text-base">upload</span>
                        <span>사진 업로드</span>
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      onAdminLogout();
                      setIsMobileMenuOpen(false);
                    }}
                    className={`px-4 py-2 border rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      transparent
                        ? 'border-white/30 text-white/80 hover:bg-white/10'
                        : 'border-[#c4c7c7] text-[#444748] hover:text-[#000000] hover:border-[#000000]'
                    }`}
                  >
                    로그아웃
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    onOpenAdminLogin();
                    setIsMobileMenuOpen(false);
                  }}
                  className={`py-2 px-4 border rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                    transparent
                      ? 'border-white/30 text-white hover:bg-white/10'
                      : 'border-[#c4c7c7] text-[#1a1c1c] hover:bg-[#f3f3f4]'
                  }`}
                >
                  <span className="material-symbols-outlined text-base">lock</span>
                  <span>관리자 로그인</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
