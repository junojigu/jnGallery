import React from 'react';
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
          onClick={() => setActiveView('home')}
          className="font-serif text-2xl md:text-3xl font-semibold tracking-tight hover:opacity-80 transition-opacity text-left cursor-pointer"
        >
          {siteName || 'Photo Moments'}
        </button>

        {/* Global Nav */}
        <nav className="hidden md:flex items-center gap-8">
          <button
            onClick={() => setActiveView('home')}
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
          <button
            onClick={() => setActiveView('gallery')}
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
          <button
            onClick={() => setActiveView('exhibition')}
            title="온라인 특별전시 (소개 & 작가 노트)"
            aria-label="온라인 특별전시"
            className={`font-sans text-sm font-medium transition-all cursor-pointer py-1 px-2.5 rounded-full relative group flex items-center justify-center ${
              activeView === 'exhibition'
                ? transparent
                  ? 'bg-white/20 text-white font-semibold'
                  : 'bg-[#000000] text-white font-bold'
                : transparent
                ? 'text-white/80 hover:text-white hover:bg-white/10'
                : 'text-[#444748] hover:text-[#000000] hover:bg-[#eaeaea]'
            }`}
          >
            <span className="material-symbols-outlined text-xl">auto_stories</span>
            {/* Tooltip on hover */}
            <span className="absolute -bottom-9 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-[#1a1c1c] text-white text-[11px] font-sans font-medium rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-md">
              소개 & 작가 노트
            </span>
          </button>
          {/* Categories tab ONLY visible for Admin */}
          {isAdmin && (
            <button
              onClick={() => setActiveView('categories')}
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
        </nav>

        {/* Search bar in Gallery mode, or Upload CTA */}
        <div className="flex items-center gap-4">
          {activeView === 'gallery' && (
            <div className="relative hidden sm:block w-48 md:w-64 lg:w-80">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#747878] text-xl">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search photos, tags..."
                className="w-full bg-[#f3f3f4] border border-[#c4c7c7] text-[#1a1c1c] text-sm rounded-full py-2 pl-10 pr-4 focus:outline-none focus:ring-1 focus:ring-[#000000] focus:border-[#000000] transition-all placeholder:text-[#747878]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#747878] hover:text-[#000000]"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              )}
            </div>
          )}

          {/* Admin Status & Actions */}
          {isAdmin ? (
            <div className="flex items-center gap-2.5">
              <span
                title="💡 백업 기능: 비밀번호 외에도 admin 또는 소유자 계정(junojigu@gmail.com / junojigu) 입력 시에도 마스터 로그인할 수 있습니다."
                className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 cursor-help ${
                  transparent ? 'bg-white/20 text-white backdrop-blur-md' : 'bg-[#e2e2e2] text-[#000000]'
                }`}
              >
                <span className="material-symbols-outlined text-sm text-[#000000]">verified_user</span>
                Admin
              </span>

              {/* Site Settings Button ONLY shown for Admin */}
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

              {/* Password Change Button ONLY shown for Admin */}
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

              {/* Upload Button ONLY shown for Admin when not on Home page */}
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
            </div>
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
      </div>
    </header>
  );
};
