import React, { useState, useEffect } from 'react';
import { ExhibitionInfo, Photo, HomeSettings } from '../types';
import { INITIAL_EXHIBITION_INFO } from '../initialData';

interface ExhibitionEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  exhibitionInfo: ExhibitionInfo;
  onSave: (newInfo: ExhibitionInfo) => void;
  photos: Photo[];
  homeSettings: HomeSettings;
}

export const ExhibitionEditModal: React.FC<ExhibitionEditModalProps> = ({
  isOpen,
  onClose,
  exhibitionInfo,
  onSave,
  photos,
  homeSettings,
}) => {
  const [formData, setFormData] = useState<ExhibitionInfo>(exhibitionInfo);
  const [photoPickerTarget, setPhotoPickerTarget] = useState<'introImage' | 'artistPhoto' | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    setFormData(exhibitionInfo);
  }, [exhibitionInfo, isOpen]);

  if (!isOpen) return null;

  const handleChange = (field: keyof ExhibitionInfo, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  const handleReset = () => {
    if (window.confirm('전시 소개 및 작가 노트를 기본값으로 복원하시겠습니까?')) {
      setFormData(INITIAL_EXHIBITION_INFO);
    }
  };

  const handleSelectPhotoForTarget = (photoUrl: string) => {
    if (photoPickerTarget) {
      handleChange(photoPickerTarget, photoUrl);
      setPhotoPickerTarget(null);
    }
  };

  // Direct Cloudinary upload for Intro Image or Artist Photo
  const handleCloudinaryUpload = async (e: React.ChangeEvent<HTMLInputElement>, targetField: 'introImage' | 'artistPhoto') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const cloudName = homeSettings.cloudinaryCloudName;
    const preset = homeSettings.cloudinaryUploadPreset;

    if (!cloudName || !preset) {
      alert('Cloudinary 설정(Cloud Name 및 Upload Preset)이 필요합니다. [사이트 설정]에서 등록해 주세요.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('upload_preset', preset);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: uploadFormData,
      });

      if (!res.ok) {
        throw new Error('Cloudinary 업로드 실패');
      }

      const data = await res.json();
      if (data.secure_url) {
        handleChange(targetField, data.secure_url);
      }
    } catch (err: any) {
      setUploadError('이미지 업로드 실패: ' + (err.message || '오류가 발생했습니다.'));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-[#c4c7c7]/30 overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-[#c4c7c7]/30 bg-[#f9f9f9]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#000000]">edit_note</span>
            <h2 className="font-serif text-xl font-bold text-[#000000]">사진전 소개 & 작가 노트 편집</h2>
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
          {/* Section 1: Exhibition Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-[#c4c7c7]/30 pb-2">
              <span className="material-symbols-outlined text-lg text-[#000000]">photo_camera_back</span>
              <h3 className="font-sans font-semibold text-base text-[#000000]">1. 사진전 정보 (Exhibition Intro)</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#444748] mb-1">
                  전시 제목 (Title)
                </label>
                <input
                  type="text"
                  value={formData.title || ''}
                  onChange={(e) => handleChange('title', e.target.value)}
                  placeholder="예: 시선의 여정: 빛과 고요"
                  className="w-full px-3 py-2 text-sm bg-[#f3f3f4] border border-[#c4c7c7] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#000000]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#444748] mb-1">
                  부제 (Subtitle)
                </label>
                <input
                  type="text"
                  value={formData.subtitle || ''}
                  onChange={(e) => handleChange('subtitle', e.target.value)}
                  placeholder="예: 일상의 스쳐 지나가는 순간 속 찰나의 기억들"
                  className="w-full px-3 py-2 text-sm bg-[#f3f3f4] border border-[#c4c7c7] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#000000]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#444748] mb-1">
                전시 기간 / 안내 문구 (Period / Status)
              </label>
              <input
                type="text"
                value={formData.period || ''}
                onChange={(e) => handleChange('period', e.target.value)}
                placeholder="예: 2026.08.01 - Permanent Online Exhibition"
                className="w-full px-3 py-2 text-sm bg-[#f3f3f4] border border-[#c4c7c7] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#000000]"
              />
            </div>

            {/* Intro Cover Image */}
            <div>
              <label className="block text-xs font-semibold text-[#444748] mb-1">
                전시 대표 이미지 URL (Main Cover Image)
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={formData.introImage || ''}
                  onChange={(e) => handleChange('introImage', e.target.value)}
                  placeholder="https://..."
                  className="flex-1 px-3 py-2 text-sm bg-[#f3f3f4] border border-[#c4c7c7] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#000000]"
                />
                <button
                  type="button"
                  onClick={() => setPhotoPickerTarget('introImage')}
                  className="px-3 py-2 text-xs bg-[#e2e2e2] text-[#1a1c1c] rounded-lg font-medium hover:bg-[#dcdddd] transition-colors cursor-pointer flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">photo_library</span>
                  갤러리 선택
                </button>
                <label className="px-3 py-2 text-xs bg-[#000000] text-white rounded-lg font-medium hover:bg-opacity-90 transition-colors cursor-pointer flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">cloud_upload</span>
                  Cloudinary
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleCloudinaryUpload(e, 'introImage')}
                    className="hidden"
                  />
                </label>
              </div>
              {formData.introImage && (
                <div className="mt-2 h-28 rounded-lg overflow-hidden border border-[#c4c7c7]">
                  <img src={formData.introImage} alt="Cover Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            {/* Intro Text */}
            <div>
              <label className="block text-xs font-semibold text-[#444748] mb-1">
                사진전 소개 글 (Exhibition Introduction)
              </label>
              <textarea
                rows={4}
                value={formData.introText || ''}
                onChange={(e) => handleChange('introText', e.target.value)}
                placeholder="전시회의 기획 의도 및 컨셉을 작성하세요."
                className="w-full px-3 py-2 text-sm bg-[#f3f3f4] border border-[#c4c7c7] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#000000] leading-relaxed"
              />
            </div>
          </div>

          {/* Section 2: Artist Note Details */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2 border-b border-[#c4c7c7]/30 pb-2">
              <span className="material-symbols-outlined text-lg text-[#000000]">person_pin</span>
              <h3 className="font-sans font-semibold text-base text-[#000000]">2. 작가 노트 (Artist Note)</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#444748] mb-1">
                  작가 이름 (Artist Name)
                </label>
                <input
                  type="text"
                  value={formData.artistName || ''}
                  onChange={(e) => handleChange('artistName', e.target.value)}
                  placeholder="예: Juno"
                  className="w-full px-3 py-2 text-sm bg-[#f3f3f4] border border-[#c4c7c7] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#000000]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#444748] mb-1">
                  작가 프로필 / 수식어 (Artist Role)
                </label>
                <input
                  type="text"
                  value={formData.artistRole || ''}
                  onChange={(e) => handleChange('artistRole', e.target.value)}
                  placeholder="예: Visual Artist / Photographer"
                  className="w-full px-3 py-2 text-sm bg-[#f3f3f4] border border-[#c4c7c7] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#000000]"
                />
              </div>
            </div>

            {/* Artist Photo */}
            <div>
              <label className="block text-xs font-semibold text-[#444748] mb-1">
                작가 프로필 사진 URL (Artist Photo URL)
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={formData.artistPhoto || ''}
                  onChange={(e) => handleChange('artistPhoto', e.target.value)}
                  placeholder="https://..."
                  className="flex-1 px-3 py-2 text-sm bg-[#f3f3f4] border border-[#c4c7c7] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#000000]"
                />
                <button
                  type="button"
                  onClick={() => setPhotoPickerTarget('artistPhoto')}
                  className="px-3 py-2 text-xs bg-[#e2e2e2] text-[#1a1c1c] rounded-lg font-medium hover:bg-[#dcdddd] transition-colors cursor-pointer flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">photo_library</span>
                  갤러리 선택
                </button>
                <label className="px-3 py-2 text-xs bg-[#000000] text-white rounded-lg font-medium hover:bg-opacity-90 transition-colors cursor-pointer flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">cloud_upload</span>
                  Cloudinary
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleCloudinaryUpload(e, 'artistPhoto')}
                    className="hidden"
                  />
                </label>
              </div>
              {formData.artistPhoto && (
                <div className="mt-2 flex items-center gap-3">
                  <img
                    src={formData.artistPhoto}
                    alt="Artist Profile Preview"
                    className="w-16 h-16 rounded-full object-cover border border-[#c4c7c7]"
                  />
                  <span className="text-xs text-[#747878]">프로필 이미지 미리보기</span>
                </div>
              )}
            </div>

            {/* Artist Quote */}
            <div>
              <label className="block text-xs font-semibold text-[#444748] mb-1">
                대표 문구 / 인용구 (Artist Quote)
              </label>
              <input
                type="text"
                value={formData.artistQuote || ''}
                onChange={(e) => handleChange('artistQuote', e.target.value)}
                placeholder="예: 카메라는 눈이 아닌 마음의 렌즈로 세상을 기록하는 정직한 거울입니다."
                className="w-full px-3 py-2 text-sm bg-[#f3f3f4] border border-[#c4c7c7] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#000000] italic font-serif"
              />
            </div>

            {/* Artist Note Text */}
            <div>
              <label className="block text-xs font-semibold text-[#444748] mb-1">
                작가 노트 본문 (Artist Note Statement)
              </label>
              <textarea
                rows={6}
                value={formData.artistNote || ''}
                onChange={(e) => handleChange('artistNote', e.target.value)}
                placeholder="사진을 찍으며 느낀 예술 철학, 생각, 에세이를 편안하게 적어주세요."
                className="w-full px-3 py-2 text-sm bg-[#f3f3f4] border border-[#c4c7c7] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#000000] leading-relaxed"
              />
            </div>
          </div>

          {/* Section 3: Exhibition Artworks Curation */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between border-b border-[#c4c7c7]/30 pb-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-lg text-[#000000]">collections</span>
                <h3 className="font-sans font-semibold text-base text-[#000000]">3. 특별전시 참여 작품 큐레이션 (Exhibition Artworks)</h3>
              </div>
              <span className="text-xs text-[#747878] font-medium">
                선택됨: {(formData.exhibitionPhotoIds || []).length} / {photos.length}점
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const featuredIds = photos.filter((p) => p.featured).map((p) => p.id);
                  setFormData((prev) => ({ ...prev, exhibitionPhotoIds: featuredIds }));
                }}
                className="px-2.5 py-1 bg-[#e2e2e2] text-[#1a1c1c] hover:bg-[#dcdddd] rounded text-xs font-medium cursor-pointer"
              >
                ⭐ 추천(Featured) 사진만 선택
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormData((prev) => ({ ...prev, exhibitionPhotoIds: photos.map((p) => p.id) }));
                }}
                className="px-2.5 py-1 bg-[#e2e2e2] text-[#1a1c1c] hover:bg-[#dcdddd] rounded text-xs font-medium cursor-pointer"
              >
                🖼️ 전체 사진 선택
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormData((prev) => ({ ...prev, exhibitionPhotoIds: [] }));
                }}
                className="px-2.5 py-1 bg-[#f0f0f0] text-[#747878] hover:text-[#000000] rounded text-xs font-medium cursor-pointer"
              >
                ✕ 전체 선택 해제
              </button>
            </div>

            <p className="text-xs text-[#747878]">
              아래 갤러리 이미지에서 클릭하여 특별전 전시대상 작품을 추가/제외할 수 있습니다. (선택 해제 시 기본적으로 추천 작품이 전시됩니다)
            </p>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 max-h-56 overflow-y-auto p-2 bg-[#f3f3f4] rounded-xl border border-[#c4c7c7]">
              {photos.map((photo) => {
                const currentSelected = formData.exhibitionPhotoIds || [];
                const isSelected = currentSelected.includes(photo.id);

                const togglePhoto = () => {
                  const nextSelected = isSelected
                    ? currentSelected.filter((id) => id !== photo.id)
                    : [...currentSelected, photo.id];
                  setFormData((prev) => ({ ...prev, exhibitionPhotoIds: nextSelected }));
                };

                return (
                  <div
                    key={photo.id}
                    onClick={togglePhoto}
                    className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                      isSelected ? 'border-[#000000] ring-2 ring-amber-400' : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={photo.url} alt={photo.title} className="w-full h-full object-cover" />
                    {isSelected && (
                      <div className="absolute top-1 right-1 bg-[#000000] text-white rounded-full w-5 h-5 flex items-center justify-center">
                        <span className="material-symbols-outlined text-xs">check</span>
                      </div>
                    )}
                    <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[9px] px-1 py-0.5 truncate text-center">
                      {photo.title}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {isUploading && (
            <div className="p-3 bg-amber-50 text-amber-800 text-xs rounded-lg flex items-center gap-2">
              <span className="material-symbols-outlined text-sm animate-spin">sync</span>
              <span>Cloudinary로 이미지 업로드 중...</span>
            </div>
          )}

          {uploadError && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg">
              {uploadError}
            </div>
          )}

          {/* Photo Picker Drawer */}
          {photoPickerTarget && (
            <div className="p-4 bg-[#f3f3f4] rounded-xl border border-[#c4c7c7] space-y-3 animate-fadeIn">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-[#000000]">
                  갤러리 사진 중 선택
                </span>
                <button
                  type="button"
                  onClick={() => setPhotoPickerTarget(null)}
                  className="text-xs text-[#747878] hover:text-[#000000]"
                >
                  취소
                </button>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-40 overflow-y-auto p-1">
                {photos.map((photo) => (
                  <button
                    key={photo.id}
                    type="button"
                    onClick={() => handleSelectPhotoForTarget(photo.url)}
                    className="aspect-square rounded-md overflow-hidden border border-[#c4c7c7] hover:border-[#000000] hover:scale-105 transition-all cursor-pointer"
                  >
                    <img src={photo.url} alt={photo.title} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex justify-between items-center pt-4 border-t border-[#c4c7c7]/30">
            <button
              type="button"
              onClick={handleReset}
              className="text-xs text-red-600 hover:text-red-800 font-medium cursor-pointer"
            >
              기본값으로 복원
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm border border-[#c4c7c7] text-[#444748] rounded-xl font-medium hover:bg-[#e2e2e2] transition-colors cursor-pointer"
              >
                취소
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-sm bg-[#000000] text-white rounded-xl font-semibold hover:bg-opacity-90 transition-colors shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-base">save</span>
                저장 및 자동 동기화
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
