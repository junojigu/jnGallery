import React, { useState, useEffect } from 'react';
import { Exhibition, Photo, HomeSettings } from '../types';
import { INITIAL_EXHIBITION_INFO } from '../initialData';

interface ExhibitionEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  exhibitions: Exhibition[];
  activeExhibitionId: string;
  onSaveExhibition: (exhibition: Exhibition) => void;
  onDeleteExhibition?: (exhibitionId: string) => void;
  onSetActiveExhibition?: (exhibitionId: string) => void;
  photos: Photo[];
  homeSettings: HomeSettings;
}

export const ExhibitionEditModal: React.FC<ExhibitionEditModalProps> = ({
  isOpen,
  onClose,
  exhibitions,
  activeExhibitionId,
  onSaveExhibition,
  onDeleteExhibition,
  onSetActiveExhibition,
  photos,
  homeSettings,
}) => {
  const [selectedExhibitionId, setSelectedExhibitionId] = useState<string>(
    activeExhibitionId || exhibitions[0]?.id || 'exhibition-1'
  );
  const [formData, setFormData] = useState<Exhibition>(() => {
    const found = exhibitions.find((e) => e.id === selectedExhibitionId);
    return (
      found || {
        ...INITIAL_EXHIBITION_INFO,
        id: `exhibition-${Date.now()}`,
        status: 'active',
      }
    );
  });

  const [photoPickerTarget, setPhotoPickerTarget] = useState<'introImage' | 'artistPhoto' | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Tag filter & Drag & Drop Reordering states
  const [searchTagFilter, setSearchTagFilter] = useState('');
  const [isTagSearchOpen, setIsTagSearchOpen] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // When selectedExhibitionId or exhibitions list changes, sync formData
  useEffect(() => {
    const target = exhibitions.find((e) => e.id === selectedExhibitionId);
    if (target) {
      setFormData(target);
    } else if (exhibitions.length > 0) {
      setSelectedExhibitionId(exhibitions[0].id);
      setFormData(exhibitions[0]);
    }
  }, [selectedExhibitionId, exhibitions, isOpen]);

  // Handle creating a brand new exhibition
  const handleAddNewExhibition = () => {
    const newId = `exhibition-${Date.now()}`;
    const newExhibition: Exhibition = {
      id: newId,
      title: '새로운 기획 전시',
      subtitle: '전시 부제를 입력하세요',
      period: '2026.00.00 - 진행 중',
      status: 'past',
      introImage: photos[0]?.url || INITIAL_EXHIBITION_INFO.introImage,
      introText: '새로운 기획 전시 소개글입니다.',
      artistName: exhibitions[0]?.artistName || 'Juno',
      artistRole: exhibitions[0]?.artistRole || 'Photographer',
      artistPhoto: exhibitions[0]?.artistPhoto || '',
      artistQuote: '사진은 정지된 시간 속 기억의 자국입니다.',
      artistNote: '작가 노트를 적어주세요.',
      exhibitionPhotoIds: [],
      createdAt: new Date().toISOString().split('T')[0],
    };
    setSelectedExhibitionId(newId);
    setFormData(newExhibition);
  };

  // Collect all unique tags and categories from photos
  const allUniqueTags = React.useMemo(() => {
    const tagSet = new Set<string>();
    photos.forEach((p) => {
      if (p.category) tagSet.add(p.category);
      if (Array.isArray(p.tags)) {
        p.tags.forEach((t) => {
          if (typeof t === 'string') tagSet.add(t);
          else if (t && typeof t === 'object' && 'name' in t) tagSet.add((t as any).name);
        });
      }
    });
    return Array.from(tagSet).filter(Boolean);
  }, [photos]);

  // Filter photos based on searchTagFilter
  const filteredPhotos = React.useMemo(() => {
    if (!searchTagFilter.trim()) return photos;
    const term = searchTagFilter.trim().toLowerCase();
    return photos.filter((p) => {
      const matchTitle = p.title.toLowerCase().includes(term);
      const matchCategory = p.category?.toLowerCase().includes(term);
      const matchLocation = p.location?.toLowerCase().includes(term);
      const matchTags =
        Array.isArray(p.tags) &&
        p.tags.some((t) => {
          const tagName = typeof t === 'string' ? t : (t as any)?.name || '';
          return tagName.toLowerCase().includes(term);
        });
      return matchTitle || matchCategory || matchLocation || matchTags;
    });
  }, [photos, searchTagFilter]);

  // Ordered list of selected photo objects for Drag & Drop
  const selectedPhotoObjects = React.useMemo(() => {
    const ids = formData.exhibitionPhotoIds || [];
    const photoMap = new Map(photos.map((p) => [p.id, p]));
    return ids.map((id) => photoMap.get(id)).filter(Boolean) as Photo[];
  }, [formData.exhibitionPhotoIds, photos]);

  // Reordering handlers
  const handleMovePhoto = (fromIndex: number, toIndex: number) => {
    const currentIds = [...(formData.exhibitionPhotoIds || [])];
    if (fromIndex < 0 || fromIndex >= currentIds.length || toIndex < 0 || toIndex >= currentIds.length) return;
    const [movedId] = currentIds.splice(fromIndex, 1);
    currentIds.splice(toIndex, 0, movedId);
    setFormData((prev) => ({ ...prev, exhibitionPhotoIds: currentIds }));
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== targetIndex) {
      handleMovePhoto(draggedIndex, targetIndex);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  if (!isOpen) return null;

  const handleChange = (field: keyof Exhibition, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveExhibition(formData);
    onClose();
  };

  const handleSelectPhotoForTarget = (photoUrl: string) => {
    if (photoPickerTarget) {
      handleChange(photoPickerTarget, photoUrl);
      setPhotoPickerTarget(null);
    }
  };

  const handleCloudinaryUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    targetField: 'introImage' | 'artistPhoto'
  ) => {
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
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-[#c4c7c7]/30 overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-[#c4c7c7]/30 bg-[#f9f9f9]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#000000]">collections_bookmark</span>
            <div>
              <h2 className="font-serif text-xl font-bold text-[#000000]">전시 관리 및 작가 노트 편집</h2>
              <p className="text-xs text-[#747878]">여러 개의 전시를 개설하고 아카이빙할 수 있습니다.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-[#e2e2e2] flex items-center justify-center text-[#444748] transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Exhibition Switcher & Add New Bar */}
        <div className="bg-[#f0f0f2] px-6 py-3 border-b border-[#c4c7c7]/40 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[280px]">
            <span className="text-xs font-semibold text-[#444748] shrink-0">편집할 전시:</span>
            <select
              value={formData.id}
              onChange={(e) => {
                const target = exhibitions.find((ex) => ex.id === e.target.value);
                if (target) {
                  setSelectedExhibitionId(target.id);
                  setFormData(target);
                }
              }}
              className="px-3 py-1.5 text-xs font-semibold bg-white border border-[#c4c7c7] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#000000] flex-1 cursor-pointer"
            >
              {exhibitions.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.id === activeExhibitionId ? '★ [대표/진행중] ' : ''}{ex.title} ({ex.period || '기간미정'})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            {onSetActiveExhibition && (
              <button
                type="button"
                onClick={() => onSetActiveExhibition(formData.id)}
                disabled={formData.id === activeExhibitionId}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 border ${
                  formData.id === activeExhibitionId
                    ? 'bg-amber-100 text-amber-900 border-amber-300 opacity-90 cursor-default'
                    : 'bg-white text-[#1a1c1c] border-[#c4c7c7] hover:border-[#000000]'
                }`}
              >
                <span className="material-symbols-outlined text-sm text-amber-600">
                  {formData.id === activeExhibitionId ? 'verified' : 'star'}
                </span>
                <span>{formData.id === activeExhibitionId ? '현재 대표 전시' : '대표 전시로 설정'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleAddNewExhibition}
              className="px-3 py-1.5 bg-[#000000] text-white rounded-lg text-xs font-semibold hover:bg-opacity-80 transition-all cursor-pointer flex items-center gap-1 shadow-xs"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              <span>+ 새 전시 개설</span>
            </button>

            {onDeleteExhibition && exhibitions.length > 1 && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`'${formData.title}' 전시를 삭제하시겠습니까?`)) {
                    onDeleteExhibition(formData.id);
                  }
                }}
                className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1"
                title="전시 삭제"
              >
                <span className="material-symbols-outlined text-sm">delete</span>
              </button>
            )}
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-8 flex-grow">
          {/* Section 1: Exhibition Details */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#c4c7c7]/30 pb-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-lg text-[#000000]">photo_camera_back</span>
                <h3 className="font-sans font-semibold text-base text-[#000000]">1. 전시 기본 정보</h3>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-xs font-semibold text-[#444748]">전시 상태:</label>
                <select
                  value={formData.status || 'past'}
                  onChange={(e) => handleChange('status', e.target.value)}
                  className="px-2.5 py-1 text-xs bg-[#f3f3f4] border border-[#c4c7c7] rounded-lg font-medium"
                >
                  <option value="active">현재 진행 중 (Active)</option>
                  <option value="past">과거 전시 아카이브 (Past)</option>
                  <option value="upcoming">예정 전시 (Upcoming)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#444748] mb-1">
                  전시 제목 (Title) *
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#444748] mb-1">
                  전시 기간 / 안내 문구 (Period)
                </label>
                <input
                  type="text"
                  value={formData.period || ''}
                  onChange={(e) => handleChange('period', e.target.value)}
                  placeholder="예: 2026.08.01 - Permanent Online Exhibition"
                  className="w-full px-3 py-2 text-sm bg-[#f3f3f4] border border-[#c4c7c7] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#000000]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#444748] mb-1">
                  전시 장소/공간 (Location / Venue)
                </label>
                <input
                  type="text"
                  value={formData.location || ''}
                  onChange={(e) => handleChange('location', e.target.value)}
                  placeholder="예: 온라인 3D 갤러리 / 서울 성수 스튜디오"
                  className="w-full px-3 py-2 text-sm bg-[#f3f3f4] border border-[#c4c7c7] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#000000]"
                />
              </div>
            </div>

            {/* Intro Cover Image */}
            <div>
              <label className="block text-xs font-semibold text-[#444748] mb-1">
                전시 포스터 / 대표 이미지 URL (Main Cover Image)
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
                전시 기획 서문 / 소개 글 (Exhibition Introduction)
              </label>
              <textarea
                rows={4}
                value={formData.introText || ''}
                onChange={(e) => handleChange('introText', e.target.value)}
                placeholder="해당 전시회의 기획 의도 및 컨셉을 상세하게 작성하세요."
                className="w-full px-3 py-2 text-sm bg-[#f3f3f4] border border-[#c4c7c7] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#000000] leading-relaxed"
              />
            </div>
          </div>

          {/* Section 2: Artist Note Details */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2 border-b border-[#c4c7c7]/30 pb-2">
              <span className="material-symbols-outlined text-lg text-[#000000]">person_pin</span>
              <h3 className="font-sans font-semibold text-base text-[#000000]">2. 이 전시의 작가 노트 (Artist Statement)</h3>
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
                이 전시의 대표 문구 / 인용구 (Artist Quote)
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
                이 전시를 기획하며 쓴 작가 노트 본문 (Artist Statement)
              </label>
              <textarea
                rows={6}
                value={formData.artistNote || ''}
                onChange={(e) => handleChange('artistNote', e.target.value)}
                placeholder="이 당시 전시를 준비하며 느낀 예술 철학, 생각, 에세이를 적어주세요."
                className="w-full px-3 py-2 text-sm bg-[#f3f3f4] border border-[#c4c7c7] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#000000] leading-relaxed"
              />
            </div>
          </div>

          {/* Section 3: Exhibition Artworks Curation & Drag-and-Drop Reordering */}
          <div className="space-y-5 pt-2">
            <div className="flex items-center justify-between border-b border-[#c4c7c7]/30 pb-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-lg text-[#000000]">collections</span>
                <h3 className="font-sans font-semibold text-base text-[#000000]">
                  3. 해당 전시 수록 작품 큐레이션 및 순서 변경
                </h3>
              </div>
              <span className="text-xs text-[#747878] font-medium">
                선택됨: <strong className="text-[#000000]">{selectedPhotoObjects.length}</strong> / {photos.length}점
              </span>
            </div>

            {/* Selected Photos Order Track (Drag & Drop Reordering Area) */}
            <div className="bg-[#f0f0f2] p-3.5 rounded-2xl border border-[#c4c7c7] space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1a1c1c]">
                  <span className="material-symbols-outlined text-base text-amber-600">drag_indicator</span>
                  <span>선택된 전시 작품 순서 (카드를 드래그하거나 화살표로 순서를 변경하세요)</span>
                </div>
                {selectedPhotoObjects.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, exhibitionPhotoIds: [] }))}
                    className="text-[11px] text-red-600 hover:underline font-medium cursor-pointer"
                  >
                    전체 해제
                  </button>
                )}
              </div>

              {selectedPhotoObjects.length === 0 ? (
                <div className="py-6 text-center text-xs text-[#747878] border border-dashed border-[#c4c7c7] rounded-xl bg-white">
                  아래 사진 목록에서 작품을 클릭하여 이 전시에 포함시킬 사진을 선택해 주세요.
                </div>
              ) : (
                <div className="flex gap-2.5 overflow-x-auto pb-2 pt-1 px-1 custom-scrollbar">
                  {selectedPhotoObjects.map((photo, index) => (
                    <div
                      key={photo.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDrop={(e) => handleDrop(e, index)}
                      className={`relative flex-shrink-0 w-28 bg-white rounded-xl border p-1.5 shadow-xs transition-all cursor-grab active:cursor-grabbing group ${
                        dragOverIndex === index
                          ? 'border-amber-500 scale-105 ring-2 ring-amber-300'
                          : 'border-[#c4c7c7] hover:border-[#000000]'
                      }`}
                    >
                      {/* Order Badge */}
                      <div className="absolute top-2 left-2 bg-[#000000] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full z-10 shadow-xs">
                        {String(index + 1).padStart(2, '0')}
                      </div>

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => {
                          const nextIds = (formData.exhibitionPhotoIds || []).filter((id) => id !== photo.id);
                          setFormData((prev) => ({ ...prev, exhibitionPhotoIds: nextIds }));
                        }}
                        title="전시에서 제외"
                        className="absolute top-2 right-2 bg-black/60 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs z-10 transition-colors cursor-pointer"
                      >
                        ✕
                      </button>

                      {/* Image Preview */}
                      <div className="aspect-square rounded-lg overflow-hidden bg-[#e2e2e2] mb-1.5">
                        <img src={photo.url} alt={photo.title} className="w-full h-full object-cover pointer-events-none" />
                      </div>

                      {/* Title */}
                      <p className="text-[11px] font-semibold text-[#000000] truncate text-center px-1">
                        {photo.title}
                      </p>

                      {/* Left / Right Arrow Reorder Controls */}
                      <div className="flex items-center justify-between mt-1 pt-1 border-t border-[#f0f0f0]">
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => handleMovePhoto(index, index - 1)}
                          title="앞으로 이동"
                          className="w-6 h-5 flex items-center justify-center rounded bg-[#f0f0f0] hover:bg-[#000000] hover:text-white disabled:opacity-30 disabled:hover:bg-[#f0f0f0] disabled:hover:text-inherit text-xs cursor-pointer transition-colors"
                        >
                          ◀
                        </button>
                        <span className="text-[9px] text-[#747878] font-mono">#{index + 1}</span>
                        <button
                          type="button"
                          disabled={index === selectedPhotoObjects.length - 1}
                          onClick={() => handleMovePhoto(index, index + 1)}
                          title="뒤로 이동"
                          className="w-6 h-5 flex items-center justify-center rounded bg-[#f0f0f0] hover:bg-[#000000] hover:text-white disabled:opacity-30 disabled:hover:bg-[#f0f0f0] disabled:hover:text-inherit text-xs cursor-pointer transition-colors"
                        >
                          ▶
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Curation Quick Action Buttons Bar */}
            <div className="space-y-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsTagSearchOpen(!isTagSearchOpen)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center gap-1 border ${
                    isTagSearchOpen || searchTagFilter
                      ? 'bg-[#000000] text-white border-[#000000] shadow-sm'
                      : 'bg-white text-[#1a1c1c] border-[#c4c7c7] hover:border-[#000000]'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">sell</span>
                  <span>🏷️ 태그로 검색하여 선택하기</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const featuredIds = photos.filter((p) => p.featured).map((p) => p.id);
                    setFormData((prev) => ({ ...prev, exhibitionPhotoIds: featuredIds }));
                  }}
                  className="px-3 py-1.5 bg-white border border-[#c4c7c7] hover:border-[#000000] text-[#1a1c1c] rounded-lg text-xs font-semibold cursor-pointer transition-all"
                >
                  ⭐ 추천(Featured) 사진만 선택
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setFormData((prev) => ({ ...prev, exhibitionPhotoIds: photos.map((p) => p.id) }));
                  }}
                  className="px-3 py-1.5 bg-white border border-[#c4c7c7] hover:border-[#000000] text-[#1a1c1c] rounded-lg text-xs font-semibold cursor-pointer transition-all"
                >
                  🖼️ 전체 사진 선택
                </button>
              </div>

              {/* Tag Search & Filter Drawer */}
              {(isTagSearchOpen || searchTagFilter) && (
                <div className="p-3 bg-white rounded-xl border border-[#c4c7c7] shadow-xs space-y-2.5 animate-fadeIn">
                  <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center justify-between">
                    <div className="relative flex-1">
                      <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-base text-[#747878]">
                        search
                      </span>
                      <input
                        type="text"
                        value={searchTagFilter}
                        onChange={(e) => setSearchTagFilter(e.target.value)}
                        placeholder="태그 또는 키워드 검색 (예: 바다, 풍경, 자연, 흑백...)"
                        className="w-full pl-8 pr-8 py-1.5 text-xs bg-[#f3f3f4] border border-[#c4c7c7] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#000000]"
                      />
                      {searchTagFilter && (
                        <button
                          type="button"
                          onClick={() => setSearchTagFilter('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#747878] hover:text-[#000000]"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {searchTagFilter.trim() && filteredPhotos.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          const currentSelected = new Set(formData.exhibitionPhotoIds || []);
                          filteredPhotos.forEach((p) => currentSelected.add(p.id));
                          setFormData((prev) => ({ ...prev, exhibitionPhotoIds: Array.from(currentSelected) }));
                        }}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold cursor-pointer shrink-0 transition-colors flex items-center gap-1 shadow-xs"
                      >
                        <span className="material-symbols-outlined text-sm">add_circle</span>
                        <span>'{searchTagFilter}' 태그 검색결과 ({filteredPhotos.length}장) 모두 선택 추가</span>
                      </button>
                    )}
                  </div>

                  {allUniqueTags.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-[#f0f0f0]">
                      <span className="text-[11px] text-[#747878] font-semibold mr-1">인기 태그:</span>
                      {allUniqueTags.slice(0, 12).map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => setSearchTagFilter(tag)}
                          className={`px-2 py-0.5 rounded-full text-[11px] font-medium transition-all cursor-pointer ${
                            searchTagFilter.toLowerCase() === tag.toLowerCase()
                              ? 'bg-[#000000] text-white font-bold'
                              : 'bg-[#f0f0f0] text-[#444748] hover:bg-[#e2e2e2] hover:text-[#000000]'
                          }`}
                        >
                          #{tag}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Photos Select Grid */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-[#747878]">
                <span>
                  사진을 클릭하여 이 전시에 포함/제외하세요 ({filteredPhotos.length}장 검색됨)
                </span>
                {searchTagFilter && (
                  <span className="text-amber-700 font-semibold">필터: '{searchTagFilter}'</span>
                )}
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 max-h-60 overflow-y-auto p-2 bg-[#f3f3f4] rounded-xl border border-[#c4c7c7] custom-scrollbar">
                {filteredPhotos.map((photo) => {
                  const currentSelected = formData.exhibitionPhotoIds || [];
                  const isSelected = currentSelected.includes(photo.id);
                  const selectedOrder = isSelected ? currentSelected.indexOf(photo.id) + 1 : null;

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
                        isSelected
                          ? 'border-[#000000] ring-2 ring-amber-400 scale-[0.98]'
                          : 'border-transparent opacity-60 hover:opacity-100 hover:scale-102'
                      }`}
                    >
                      <img src={photo.url} alt={photo.title} className="w-full h-full object-cover" />

                      {isSelected && (
                        <div className="absolute top-1 right-1 bg-[#000000] text-white rounded-full text-[10px] font-bold w-5 h-5 flex items-center justify-center shadow-md">
                          {selectedOrder}
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
          </div>

          {isUploading && (
            <div className="p-3 bg-amber-50 text-amber-800 text-xs rounded-lg flex items-center gap-2">
              <span className="material-symbols-outlined text-sm animate-spin">sync</span>
              <span>Cloudinary로 이미지 업로드 중...</span>
            </div>
          )}

          {uploadError && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg">{uploadError}</div>
          )}

          {/* Photo Picker Drawer */}
          {photoPickerTarget && (
            <div className="p-4 bg-[#f3f3f4] rounded-xl border border-[#c4c7c7] space-y-3 animate-fadeIn">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-[#000000]">갤러리 사진 중 선택</span>
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
          <div className="flex justify-end items-center gap-2 pt-4 border-t border-[#c4c7c7]/30">
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
              이 전시 저장 및 구글 시트 자동 동기화
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
