import React, { useState, useEffect } from 'react';
import { HomeSettings, Photo } from '../types';
import { INITIAL_HOME_SETTINGS } from '../initialData';

interface HomeEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  homeSettings: HomeSettings;
  onSave: (newSettings: HomeSettings) => void;
  photos: Photo[];
}

export const HomeEditModal: React.FC<HomeEditModalProps> = ({
  isOpen,
  onClose,
  homeSettings,
  onSave,
  photos,
}) => {
  const [formData, setFormData] = useState<HomeSettings>(homeSettings);
  const [photoPickerTarget, setPhotoPickerTarget] = useState<'heroImage' | 'aboutImage1' | 'aboutImage2' | null>(null);

  useEffect(() => {
    setFormData(homeSettings);
  }, [homeSettings, isOpen]);

  if (!isOpen) return null;

  const handleChange = (field: keyof HomeSettings, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  const handleReset = () => {
    if (window.confirm('랜딩 페이지 설정을 기본값으로 복원하시겠습니까?')) {
      setFormData(INITIAL_HOME_SETTINGS);
    }
  };

  const handleSelectPhotoForTarget = (photoUrl: string) => {
    if (photoPickerTarget) {
      handleChange(photoPickerTarget, photoUrl);
      setPhotoPickerTarget(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-[#c4c7c7]/30 overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-[#c4c7c7]/30 bg-[#f9f9f9]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#000000]">settings</span>
            <h2 className="font-serif text-xl font-bold text-[#000000]">사이트 설정 관리</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-[#e2e2e2] flex items-center justify-center text-[#444748] transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-8 flex-grow">
          {/* Section 0: General Site Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-[#c4c7c7]/30 pb-2">
              <span className="material-symbols-outlined text-lg text-[#000000]">badge</span>
              <h3 className="font-sans font-semibold text-base text-[#000000]">사이트 기본 정보 (Site Info)</h3>
            </div>

            {/* Site / Brand Name */}
            <div>
              <label className="block text-xs font-semibold text-[#444748] mb-1">
                홈페이지명 (사이트 이름)
              </label>
              <input
                type="text"
                value={formData.siteName || ''}
                onChange={(e) => handleChange('siteName', e.target.value)}
                placeholder="Photo Moments"
                className="w-full px-3 py-2 text-sm bg-[#f3f3f4] border border-[#c4c7c7] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#000000] font-serif text-lg font-bold"
                required
              />
              <p className="text-[11px] text-[#747878] mt-1">
                상단 헤더 브랜드 로고 및 하단 푸터에 표시되는 홈페이지 이름입니다.
              </p>
            </div>
          </div>

          {/* Section 0.5: External Storage & Database Services */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2 border-b border-[#c4c7c7]/30 pb-2">
              <span className="material-symbols-outlined text-lg text-amber-600">cloud_sync</span>
              <h3 className="font-sans font-semibold text-base text-[#000000]">클라우드 저장소 & DB 설정 (Cloud & DB)</h3>
            </div>

            {/* Cloudinary Info */}
            <div className="bg-[#f0f4f8] p-4 rounded-xl border border-[#c4c7c7]/50 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#000000]">
                <span className="material-symbols-outlined text-base text-sky-600">cloud_upload</span>
                <span>Cloudinary 이미지 스토리지 설정</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#444748] mb-1">Cloud Name</label>
                  <input
                    type="text"
                    value={formData.cloudinaryCloudName || ''}
                    onChange={(e) => handleChange('cloudinaryCloudName', e.target.value)}
                    placeholder="예: ryhom5vw"
                    className="w-full px-3 py-1.5 text-xs bg-white border border-[#c4c7c7] rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-[#000000]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#444748] mb-1">Upload Preset</label>
                  <input
                    type="text"
                    value={formData.cloudinaryUploadPreset || ''}
                    onChange={(e) => handleChange('cloudinaryUploadPreset', e.target.value)}
                    placeholder="예: photo_gallery_preset"
                    className="w-full px-3 py-1.5 text-xs bg-white border border-[#c4c7c7] rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-[#000000]"
                  />
                </div>
              </div>
              <p className="text-[11px] text-[#5d5f5f]">
                새 이미지 등록 시 Cloudinary로 자동 업로드할 때 사용되는 설정입니다.
              </p>
            </div>

            {/* Google Sheets Apps Script URL */}
            <div className="bg-[#f4f8f3] p-4 rounded-xl border border-[#c4c7c7]/50 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#000000]">
                <span className="material-symbols-outlined text-base text-emerald-600">table_chart</span>
                <span>Google Apps Script 웹앱 URL (구글 스프레드시트 DB 연동)</span>
              </div>
              <input
                type="url"
                value={formData.googleSheetAppUrl || ''}
                onChange={(e) => handleChange('googleSheetAppUrl', e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="w-full px-3 py-2 text-xs bg-white border border-[#c4c7c7] rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-[#000000]"
              />
              <p className="text-[11px] text-[#5d5f5f]">
                구글 스프레드시트 Apps Script 배포 후 생성된 웹앱 URL을 입력하면 실시간 스프레드시트 DB와 연동됩니다.
              </p>
            </div>
          </div>

          {/* Section 1: Hero Section */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2 border-b border-[#c4c7c7]/30 pb-2">
              <span className="material-symbols-outlined text-lg text-[#000000]">image</span>
              <h3 className="font-sans font-semibold text-base text-[#000000]">히어로 영역 (Hero Section)</h3>
            </div>

            {/* Hero Image */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-[#444748]">히어로 배경 이미지</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={formData.heroImage}
                  onChange={(e) => handleChange('heroImage', e.target.value)}
                  placeholder="https://..."
                  className="flex-grow px-3 py-2 text-sm bg-[#f3f3f4] border border-[#c4c7c7] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#000000]"
                  required
                />
                <button
                  type="button"
                  onClick={() => setPhotoPickerTarget('heroImage')}
                  className="px-3 py-2 text-xs font-medium bg-[#e2e2e2] hover:bg-[#d8d8d8] text-[#000000] rounded-lg transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap"
                >
                  <span className="material-symbols-outlined text-sm">photo_library</span>
                  <span>갤러리에서 선택</span>
                </button>
              </div>
              {formData.heroImage && (
                <div className="relative h-28 w-full rounded-lg overflow-hidden border border-[#c4c7c7]/40 mt-2">
                  <img src={formData.heroImage} alt="Hero Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            {/* Hero Title */}
            <div>
              <label className="block text-xs font-semibold text-[#444748] mb-1">메인 제목 (Title)</label>
              <input
                type="text"
                value={formData.heroTitle}
                onChange={(e) => handleChange('heroTitle', e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#f3f3f4] border border-[#c4c7c7] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#000000]"
                required
              />
            </div>

            {/* Hero Subtitle */}
            <div>
              <label className="block text-xs font-semibold text-[#444748] mb-1">메인 설명 (Subtitle)</label>
              <textarea
                value={formData.heroSubtitle}
                onChange={(e) => handleChange('heroSubtitle', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 text-sm bg-[#f3f3f4] border border-[#c4c7c7] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#000000]"
                required
              />
            </div>

            {/* Hero CTA Button Text */}
            <div>
              <label className="block text-xs font-semibold text-[#444748] mb-1">버튼 텍스트 (Button Text)</label>
              <input
                type="text"
                value={formData.heroCtaText}
                onChange={(e) => handleChange('heroCtaText', e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#f3f3f4] border border-[#c4c7c7] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#000000]"
                required
              />
            </div>
          </div>

          {/* Section 2: About / Curation Section */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2 border-b border-[#c4c7c7]/30 pb-2">
              <span className="material-symbols-outlined text-lg text-[#000000]">auto_awesome</span>
              <h3 className="font-sans font-semibold text-base text-[#000000]">소개 및 큐레이션 영역 (About Section)</h3>
            </div>

            {/* About Title */}
            <div>
              <label className="block text-xs font-semibold text-[#444748] mb-1">소개 제목</label>
              <input
                type="text"
                value={formData.aboutTitle}
                onChange={(e) => handleChange('aboutTitle', e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#f3f3f4] border border-[#c4c7c7] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#000000]"
                required
              />
            </div>

            {/* About Description */}
            <div>
              <label className="block text-xs font-semibold text-[#444748] mb-1">소개 내용</label>
              <textarea
                value={formData.aboutDescription}
                onChange={(e) => handleChange('aboutDescription', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 text-sm bg-[#f3f3f4] border border-[#c4c7c7] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#000000]"
                required
              />
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3 bg-[#f3f3f4] rounded-lg space-y-2 border border-[#c4c7c7]/40">
                <label className="block text-xs font-semibold text-[#000000]">특징 1</label>
                <input
                  type="text"
                  value={formData.feature1Title}
                  onChange={(e) => handleChange('feature1Title', e.target.value)}
                  placeholder="제목"
                  className="w-full px-2 py-1.5 text-xs bg-white border border-[#c4c7c7] rounded-md"
                />
              </div>

              <div className="p-3 bg-[#f3f3f4] rounded-lg space-y-2 border border-[#c4c7c7]/40">
                <label className="block text-xs font-semibold text-[#000000]">특징 2</label>
                <input
                  type="text"
                  value={formData.feature2Title}
                  onChange={(e) => handleChange('feature2Title', e.target.value)}
                  placeholder="제목"
                  className="w-full px-2 py-1.5 text-xs bg-white border border-[#c4c7c7] rounded-md"
                />
              </div>
            </div>

            {/* About Images Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {/* About Image 1 */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-[#444748]">소개 이미지 1</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={formData.aboutImage1}
                    onChange={(e) => handleChange('aboutImage1', e.target.value)}
                    placeholder="https://..."
                    className="flex-grow px-2.5 py-1.5 text-xs bg-[#f3f3f4] border border-[#c4c7c7] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#000000]"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setPhotoPickerTarget('aboutImage1')}
                    className="px-2 py-1.5 text-[11px] font-medium bg-[#e2e2e2] hover:bg-[#d8d8d8] text-[#000000] rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                  >
                    선택
                  </button>
                </div>
                {formData.aboutImage1 && (
                  <div className="relative h-24 w-full rounded-lg overflow-hidden border border-[#c4c7c7]/40">
                    <img src={formData.aboutImage1} alt="About 1 Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              {/* About Image 2 */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-[#444748]">소개 이미지 2</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={formData.aboutImage2}
                    onChange={(e) => handleChange('aboutImage2', e.target.value)}
                    placeholder="https://..."
                    className="flex-grow px-2.5 py-1.5 text-xs bg-[#f3f3f4] border border-[#c4c7c7] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#000000]"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setPhotoPickerTarget('aboutImage2')}
                    className="px-2 py-1.5 text-[11px] font-medium bg-[#e2e2e2] hover:bg-[#d8d8d8] text-[#000000] rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                  >
                    선택
                  </button>
                </div>
                {formData.aboutImage2 && (
                  <div className="relative h-24 w-full rounded-lg overflow-hidden border border-[#c4c7c7]/40">
                    <img src={formData.aboutImage2} alt="About 2 Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-[#c4c7c7]/30 flex justify-between items-center">
            <button
              type="button"
              onClick={handleReset}
              className="text-xs font-medium text-[#747878] hover:text-[#000000] underline cursor-pointer"
            >
              기본값으로 복원
            </button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium border border-[#c4c7c7] text-[#444748] hover:text-[#000000] rounded-lg transition-colors cursor-pointer"
              >
                취소
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-medium bg-[#000000] text-white rounded-lg hover:bg-opacity-90 transition-colors shadow-sm cursor-pointer"
              >
                설정 저장
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Sub-modal: Gallery Photo Picker */}
      {photoPickerTarget && (
        <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] flex flex-col p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-serif text-lg font-bold text-[#000000]">갤러리에서 이미지 선택</h3>
              <button
                onClick={() => setPhotoPickerTarget(null)}
                className="w-8 h-8 rounded-full hover:bg-[#e2e2e2] flex items-center justify-center text-[#444748] cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <p className="text-xs text-[#747878] mb-4">
              랜딩 페이지에 사용할 사진을 아래 갤러리 목록에서 하나 선택하세요.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 overflow-y-auto max-h-[50vh] p-1">
              {photos.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectPhotoForTarget(p.url)}
                  className="group relative aspect-square rounded-xl overflow-hidden border-2 border-transparent hover:border-[#000000] focus:border-[#000000] transition-all cursor-pointer shadow-xs"
                >
                  <img src={p.url} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold p-2 text-center">
                    {p.title}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
