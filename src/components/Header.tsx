import React, { useState } from 'react';
import { ActiveView } from '../types';

interface HeaderProps {
  siteName?: string;
  showGalleryPage?: boolean;
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
  showGalleryPage = true,
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
      <div className="flex justify-between items-center w-full px-4 md:px-10 py-4 max-w-[1280px] mx-auto">
        {/* Brand */}
        <button
          onClick={() => handleNavClick('home')}
          className="font-serif text-2xl md:text-3xl font-semibold tracking-tight hover:opacity-80 transition-opacity text-left cursor-pointer"
        >
          {siteName || 'Photo Moments'}
        </button>

        {/* Global Desktop Navigation (Horizontal) */}
        <nav className="hidden md:flex items-center gap-8">
          <button
            onClick={() => handleNavClick('home')}
            className={`font-sans text-sm font-medium transition-colors cursor-pointer py-1 ${
              activeView === 'home'
                ? transparent
                  ? 'border-b-2 border-white text-white font-semibold'
                  : 'border-b-2 border-[#000000] text-[#000000] font-bold'
                : transparent
                ? 'text-white/80 hover:text-white'
                : 'text-[#444748] hover:text-[#000000]'
            }`}
          >
            Home
          </button>

          {showGalleryPage && (
            <button
              onClick={() => handleNavClick('gallery')}
              className={`font-sans text-sm font-medium transition-colors cursor-pointer py-1 ${
                activeView === 'gallery'
                  ? transparent
                    ? 'border-b-2 border-white text-white font-semibold'
                    : 'border-b-2 border-[#000000] text-[#000000] font-bold'
                  : transparent
                  ? 'text-white/80 hover:text-white'
                  : 'text-[#444748] hover:text-[#000000]'
              }`}
            >
              Gallery
            </button>
          )}

          {/* Categories tab ONLY visible for Admin */}
          {isAdmin && (
            <button
              onClick={() => handleNavClick('categories')}
              className={`font-sans text-sm font-medium transition-colors cursor-pointer py-1 ${
                activeView === 'categories'
                  ? transparent
                    ? 'border-b-2 border-white text-white font-semibold'
                    : 'border-b-2 border-[#000000] text-[#000000] font-bold'
                  : transparent
                  ? 'text-white/80 hover:text-white'
                  : 'text-[#444748] hover:text-[#000000]'
              }`}
            >
              Categories
            </button>
          )}

          {/* Exhibition (작품 전시) Tab */}
          <button
            onClick={() => handleNavClick('exhibition')}
            title="작품 전시"
            aria-label="작품 전시"
            className={`font-sans text-sm font-medium transition-colors cursor-pointer py-1 flex items-center gap-1.5 ${
              activeView === 'exhibition'
                ? transparent
                  ? 'border-b-2 border-white text-white font-semibold'
                  : 'border-b-2 border-[#000000] text-[#000000] font-bold'
                : transparent
                ? 'text-white/80 hover:text-white'
                : 'text-[#444748] hover:text-[#000000]'
            }`}
          >
            <span className="material-symbols-outlined text-lg">auto_stories</span>
            <span>작품 전시</span>
          </button>
        </nav>

        {/* Right Section: Search & Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
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

          {/* Admin Desktop Actions */}
          <div className="hidden md:flex items-center gap-2">
            {isAdmin ? (
              <>
                {onOpenHomeEdit && (
                  <button
                    onClick={onOpenHomeEdit}
                    title="사이트 설정"
                    aria-label="사이트 설정"
                    className={`p-2 rounded-lg text-xs font-semibold transition-all shadow-xs flex items-center justify-center cursor-pointer ${
                      transparent
                        ? 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-md border border-white/30'
                        : 'bg-[#f0f0f0] text-[#000000] hover:bg-[#e2e2e2] border border-[#c4c7c7]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm text-amber-500">settings</span>
                  </button>
                )}

                {onChangePassword && (
                  <button
                    onClick={onChangePassword}
                    title="관리자 비밀번호 변경"
                    aria-label="관리자 비밀번호 변경"
                    className={`p-2 rounded-lg text-xs font-semibold transition-all shadow-xs flex items-center justify-center cursor-pointer ${
                      transparent
                        ? 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-md border border-white/30'
                        : 'bg-[#f0f0f0] text-[#000000] hover:bg-[#e2e2e2] border border-[#c4c7c7]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm">key</span>
                  </button>
                )}

                {activeView !== 'home' && (
                  <button
                    onClick={onOpenUpload}
                    title="사진 업로드"
                    aria-label="사진 업로드"
                    className={`p-2 rounded-full transition-all shadow-xs flex items-center justify-center cursor-pointer ${
                      transparent
                        ? 'bg-white text-[#000000] hover:bg-[#e2e2e2]'
                        : 'bg-[#000000] text-white hover:bg-opacity-90'
                    }`}
                  >
                    <span className="material-symbols-outlined text-lg">upload</span>
                  </button>
                )}

                <button
                  onClick={onAdminLogout}
                  title="관리자 로그아웃"
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer border ${
                    transparent
                      ? 'border-white/40 text-white hover:bg-white/10'
                      : 'border-[#c4c7c7] text-[#444748] hover:text-[#000000] hover:border-[#000000]'
                  }`}
                >
                  로그아웃
                </button>
              </>
            ) : (
              <button
                onClick={onOpenAdminLogin}
                title="관리자 로그인"
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1 border ${
                  transparent
                    ? 'border-white/40 text-white hover:bg-white/10'
                    : 'border-[#c4c7c7] text-[#444748] hover:text-[#000000] hover:border-[#000000]'
                }`}
              >
                <span className="material-symbols-outlined text-sm">lock</span>
                <span>관리자 로그인</span>
              </button>
            )}
          </div>

          {/* Mobile Hamburger Toggle Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle Mobile Menu"
            className={`md:hidden p-2 rounded-lg transition-colors cursor-pointer flex items-center justify-center ${
              transparent
                ? 'text-white hover:bg-white/20'
                : 'text-[#1a1c1c] hover:bg-[#e2e2e2]/60'
            }`}
          >
            <span className="material-symbols-outlined text-2xl">
              {isMobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-[#ffffff] text-[#1a1c1c] border-b border-[#c4c7c7] px-5 py-4 space-y-3 shadow-lg animate-fadeIn">
          {activeView === 'gallery' && (
            <div className="relative w-full mb-3">
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

          <nav className="flex flex-col space-y-2">
            <button
              onClick={() => handleNavClick('home')}
              className={`text-left text-sm font-semibold py-2 px-3 rounded-lg transition-colors cursor-pointer ${
                activeView === 'home' ? 'bg-[#000000] text-white' : 'hover:bg-[#f3f3f4] text-[#1a1c1c]'
              }`}
            >
              Home
            </button>
            {showGalleryPage && (
              <button
                onClick={() => handleNavClick('gallery')}
                className={`text-left text-sm font-semibold py-2 px-3 rounded-lg transition-colors cursor-pointer ${
                  activeView === 'gallery' ? 'bg-[#000000] text-white' : 'hover:bg-[#f3f3f4] text-[#1a1c1c]'
                }`}
              >
                Gallery
              </button>
            )}
            {isAdmin && (
              <button
                onClick={() => handleNavClick('categories')}
                className={`text-left text-sm font-semibold py-2 px-3 rounded-lg transition-colors cursor-pointer ${
                  activeView === 'categories' ? 'bg-[#000000] text-white' : 'hover:bg-[#f3f3f4] text-[#1a1c1c]'
                }`}
              >
                Categories
              </button>
            )}
            <button
              onClick={() => handleNavClick('exhibition')}
              className={`text-left text-sm font-semibold py-2 px-3 rounded-lg transition-colors cursor-pointer flex items-center gap-2 ${
                activeView === 'exhibition' ? 'bg-[#000000] text-white' : 'hover:bg-[#f3f3f4] text-[#1a1c1c]'
              }`}
            >
              <span className="material-symbols-outlined text-lg">auto_stories</span>
              <span>작품 전시</span>
            </button>
          </nav>

          {/* Mobile Admin Controls */}
          <div className="pt-3 border-t border-[#e2e2e2] flex flex-wrap items-center justify-between gap-2">
            {isAdmin ? (
              <>
                <div className="flex items-center gap-2">
                  {onOpenHomeEdit && (
                    <button
                      onClick={() => {
                        onOpenHomeEdit();
                        setIsMobileMenuOpen(false);
                      }}
                      className="p-2 bg-[#f0f0f0] border border-[#c4c7c7] rounded-lg text-xs font-medium flex items-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm text-amber-500">settings</span>
                      <span>설정</span>
                    </button>
                  )}
                  {onChangePassword && (
                    <button
                      onClick={() => {
                        onChangePassword();
                        setIsMobileMenuOpen(false);
                      }}
                      className="p-2 bg-[#f0f0f0] border border-[#c4c7c7] rounded-lg text-xs font-medium flex items-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">key</span>
                      <span>비밀번호</span>
                    </button>
                  )}
                  {activeView !== 'home' && (
                    <button
                      onClick={() => {
                        onOpenUpload();
                        setIsMobileMenuOpen(false);
                      }}
                      className="p-2 bg-[#000000] text-white rounded-lg text-xs font-medium flex items-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">upload</span>
                      <span>업로드</span>
                    </button>
                  )}
                </div>
                <button
                  onClick={() => {
                    onAdminLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="px-3 py-1.5 border border-[#c4c7c7] rounded-lg text-xs text-[#444748] cursor-pointer"
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
                className="w-full py-2 border border-[#c4c7c7] rounded-lg text-xs font-medium text-[#1a1c1c] flex items-center justify-center gap-1.5 cursor-pointer hover:bg-[#f3f3f4]"
              >
                <span className="material-symbols-outlined text-sm">lock</span>
                <span>관리자 로그인</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
