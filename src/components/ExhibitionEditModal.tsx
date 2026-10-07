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

  // Section 3 Filter States
  const [viewFilterMode, setViewFilterMode] = useState<'all' | 'pick' | 'featured'>('all');
  const [searchTagFilter, setSearchTagFilter] = useState('');
  const [isTagSearchOpen, setIsTagSearchOpen] = useState(false);

  // Section 4 Drag & Drop Reordering States
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Sync formData when selectedExhibitionId or exhibitions list changes
  useEffect(() => {
    const target = exhibitions.find((e) => e.id === selectedExhibitionId);
    if (target) {
      setFormData(target);
    } else if (exhibitions.length > 0) {
      setSelectedExhibitionId(exhibitions[0].id);
      setFormData(exhibitions[0]);
    }
  }, [selectedExhibitionId, exhibitions, isOpen]);

  // Create a brand new exhibition
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
          if (typeof t === 'string') tagSet.add(t.replace(/^#/, ''));
          else if (t && typeof t === 'object' && 'name' in t) tagSet.add(String((t as any).name).replace(/^#/, ''));
        });
      }
    });
    return Array.from(tagSet).filter(Boolean);
  }, [photos]);

  const exhibitionPickPhotos = React.useMemo(() => photos.filter((p) => p.exhibitionPick), [photos]);
  const featuredPhotos = React.useMemo(() => photos.filter((p) => p.featured), [photos]);

  // Filter photos for Section 3 based on viewFilterMode and searchTagFilter
  const filteredPhotos = React.useMemo(() => {
    let baseList = photos;
    if (viewFilterMode === 'pick') {
      baseList = photos.filter((p) => p.exhibitionPick);
    } else if (viewFilterMode === 'featured') {
      baseList = photos.filter((p) => p.featured);
    }

    if (!searchTagFilter.trim()) return baseList;
    const term = searchTagFilter.trim().toLowerCase().replace(/^#/, '');
    return baseList.filter((p) => {
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
  }, [photos, viewFilterMode, searchTagFilter]);

  // Ordered list of selected photo objects for Section 4 Drag & Drop
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

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-3 sm:p-5 animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-neutral-200 overflow-hidden">
        {/* Minimal Modal Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-neutral-200 bg-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-neutral-900 text-white flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">collections_bookmark</span>
            </div>
            <div>
              <h2 className="font-sans text-base sm:text-lg font-bold text-neutral-900 tracking-tight">
                전시 관리 및 작가 노트 편집
              </h2>
              <p className="text-[11px] text-neutral-500">전시 정보, 작가 노트, 전시 작품 선택 및 노출 순서를 설정합니다.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-neutral-100 flex items-center justify-center text-neutral-500 hover:text-neutral-900 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Exhibition Switcher Bar */}
        <div className="bg-neutral-50 px-6 py-2.5 border-b border-neutral-200 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
          <div className="flex items-center gap-2 flex-1 min-w-[240px]">
            <span className="text-xs font-semibold text-neutral-600 shrink-0">편집 대상:</span>
            <select
              value={formData.id}
              onChange={(e) => {
                const target = exhibitions.find((ex) => ex.id === e.target.value);
                if (target) {
                  setSelectedExhibitionId(target.id);
                  setFormData(target);
                }
              }}
              className="px-3 py-1.5 text-xs font-semibold bg-white border border-neutral-300 rounded-lg focus:outline-none focus:border-neutral-900 flex-1 cursor-pointer text-neutral-900"
            >
              {exhibitions.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.id === activeExhibitionId ? '★ [대표 전시] ' : ''}{ex.title} ({ex.period || '기간미정'})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            {onSetActiveExhibition && (
              <button
                type="button"
                onClick={() => onSetActiveExhibition(formData.id)}
                disabled={formData.id === activeExhibitionId}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 border ${
                  formData.id === activeExhibitionId
                    ? 'bg-amber-50 text-amber-800 border-amber-200 cursor-default'
                    : 'bg-white text-neutral-700 border-neutral-300 hover:border-neutral-900'
                }`}
              >
                <span className="material-symbols-outlined text-[15px] text-amber-500">
                  {formData.id === activeExhibitionId ? 'verified' : 'star'}
                </span>
                <span>{formData.id === activeExhibitionId ? '대표 전시' : '대표로 지정'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleAddNewExhibition}
              className="px-2.5 py-1.5 bg-neutral-900 text-white rounded-lg text-xs font-semibold hover:bg-neutral-800 transition-all cursor-pointer flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[15px]">add</span>
              <span>새 전시 추가</span>
            </button>

            {onDeleteExhibition && exhibitions.length > 1 && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`'${formData.title}' 전시를 삭제하시겠습니까?`)) {
                    onDeleteExhibition(formData.id);
                  }
                }}
                className="p-1.5 bg-white hover:bg-red-50 text-neutral-500 hover:text-red-600 border border-neutral-300 hover:border-red-200 rounded-lg text-xs transition-all cursor-pointer flex items-center justify-center"
                title="이 전시 삭제"
              >
                <span className="material-symbols-outlined text-[16px]">delete</span>
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-7 custom-scrollbar">
          {/* SECTION 1: Exhibition Basic Info */}
          <section className="space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-neutral-900 text-white text-[11px] font-bold flex items-center justify-center">
                  1
                </span>
                <h3 className="font-sans font-bold text-sm text-neutral-900">전시 기본 정보</h3>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-[11px] font-medium text-neutral-500">상태</label>
                <select
                  value={formData.status || 'past'}
                  onChange={(e) => handleChange('status', e.target.value)}
                  className="px-2.5 py-1 text-xs bg-neutral-50 border border-neutral-300 rounded-lg font-medium text-neutral-800 focus:outline-none focus:border-neutral-900"
                >
                  <option value="active">진행 중 (Active)</option>
                  <option value="past">과거 전시 (Past)</option>
                  <option value="upcoming">예정 전시 (Upcoming)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-neutral-600 mb-1">전시 제목 *</label>
                <input
                  type="text"
                  value={formData.title || ''}
                  onChange={(e) => handleChange('title', e.target.value)}
                  placeholder="예: 시선의 여정: 빛과 고요"
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-neutral-50 border border-neutral-300 rounded-lg focus:bg-white focus:outline-none focus:border-neutral-900 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-600 mb-1">전시 부제</label>
                <input
                  type="text"
                  value={formData.subtitle || ''}
                  onChange={(e) => handleChange('subtitle', e.target.value)}
                  placeholder="예: 일상의 스쳐 지나가는 순간 속 찰나의 기억들"
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-neutral-50 border border-neutral-300 rounded-lg focus:bg-white focus:outline-none focus:border-neutral-900 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-600 mb-1">전시 기간</label>
                <input
                  type="text"
                  value={formData.period || ''}
                  onChange={(e) => handleChange('period', e.target.value)}
                  placeholder="예: 2026.08.01 - 진행 중"
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-neutral-50 border border-neutral-300 rounded-lg focus:bg-white focus:outline-none focus:border-neutral-900 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-600 mb-1">전시 장소 / 공간</label>
                <input
                  type="text"
                  value={formData.location || ''}
                  onChange={(e) => handleChange('location', e.target.value)}
                  placeholder="예: 온라인 갤러리 / 서울 성수 스튜디오"
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-neutral-50 border border-neutral-300 rounded-lg focus:bg-white focus:outline-none focus:border-neutral-900 transition-colors"
                />
              </div>
            </div>

            {/* Cover Image Compact Row */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center bg-neutral-50 p-3 rounded-xl border border-neutral-200">
              {formData.introImage && (
                <img
                  src={formData.introImage}
                  alt="Cover Preview"
                  className="w-20 h-14 object-cover rounded-lg border border-neutral-300 shrink-0 bg-neutral-200"
                />
              )}
              <div className="flex-1 w-full space-y-1.5">
                <label className="block text-[11px] font-semibold text-neutral-600">
                  전시 대표 커버 이미지
                </label>
                <div className="flex flex-wrap sm:flex-nowrap gap-1.5">
                  <input
                    type="url"
                    value={formData.introImage || ''}
                    onChange={(e) => handleChange('introImage', e.target.value)}
                    placeholder="https://..."
                    className="flex-1 min-w-[160px] px-2.5 py-1.5 text-xs bg-white border border-neutral-300 rounded-lg focus:outline-none focus:border-neutral-900"
                  />
                  <button
                    type="button"
                    onClick={() => setPhotoPickerTarget('introImage')}
                    className="px-2.5 py-1.5 text-xs rounded-lg font-medium bg-white border border-neutral-300 hover:border-neutral-900 text-neutral-800 cursor-pointer flex items-center gap-1 shrink-0 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[15px]">photo_library</span>
                    갤러리 선택
                  </button>
                  <label className="px-2.5 py-1.5 text-xs bg-neutral-900 text-white rounded-lg font-medium hover:bg-neutral-800 transition-colors cursor-pointer flex items-center gap-1 shrink-0">
                    <span className="material-symbols-outlined text-[15px]">cloud_upload</span>
                    업로드
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleCloudinaryUpload(e, 'introImage')}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-neutral-600 mb-1">
                전시 소개 서문 (Introduction)
              </label>
              <textarea
                rows={3}
                value={formData.introText || ''}
                onChange={(e) => handleChange('introText', e.target.value)}
                placeholder="전시 기획 의도 및 소개글을 입력하세요."
                className="w-full px-3 py-2 text-xs sm:text-sm bg-neutral-50 border border-neutral-300 rounded-lg focus:bg-white focus:outline-none focus:border-neutral-900 leading-relaxed transition-colors"
              />
            </div>
          </section>

          {/* SECTION 2: Artist Note */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 border-b border-neutral-200 pb-2">
              <span className="w-5 h-5 rounded-full bg-neutral-900 text-white text-[11px] font-bold flex items-center justify-center">
                2
              </span>
              <h3 className="font-sans font-bold text-sm text-neutral-900">작가 노트 (Artist Statement)</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-neutral-600 mb-1">작가 이름</label>
                <input
                  type="text"
                  value={formData.artistName || ''}
                  onChange={(e) => handleChange('artistName', e.target.value)}
                  placeholder="예: Juno"
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-neutral-50 border border-neutral-300 rounded-lg focus:bg-white focus:outline-none focus:border-neutral-900 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-600 mb-1">작가 역할 / 직함</label>
                <input
                  type="text"
                  value={formData.artistRole || ''}
                  onChange={(e) => handleChange('artistRole', e.target.value)}
                  placeholder="예: Visual Artist / Photographer"
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-neutral-50 border border-neutral-300 rounded-lg focus:bg-white focus:outline-none focus:border-neutral-900 transition-colors"
                />
              </div>
            </div>

            {/* Artist Photo Compact Row */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center bg-neutral-50 p-3 rounded-xl border border-neutral-200">
              {formData.artistPhoto && (
                <img
                  src={formData.artistPhoto}
                  alt="Artist Preview"
                  className="w-12 h-12 rounded-full object-cover border border-neutral-300 shrink-0 bg-neutral-200"
                />
              )}
              <div className="flex-1 w-full space-y-1.5">
                <label className="block text-[11px] font-semibold text-neutral-600">작가 프로필 사진</label>
                <div className="flex flex-wrap sm:flex-nowrap gap-1.5">
                  <input
                    type="url"
                    value={formData.artistPhoto || ''}
                    onChange={(e) => handleChange('artistPhoto', e.target.value)}
                    placeholder="https://..."
                    className="flex-1 min-w-[160px] px-2.5 py-1.5 text-xs bg-white border border-neutral-300 rounded-lg focus:outline-none focus:border-neutral-900"
                  />
                  <button
                    type="button"
                    onClick={() => setPhotoPickerTarget('artistPhoto')}
                    className="px-2.5 py-1.5 text-xs rounded-lg font-medium bg-white border border-neutral-300 hover:border-neutral-900 text-neutral-800 cursor-pointer flex items-center gap-1 shrink-0 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[15px]">photo_library</span>
                    갤러리 선택
                  </button>
                  <label className="px-2.5 py-1.5 text-xs bg-neutral-900 text-white rounded-lg font-medium hover:bg-neutral-800 transition-colors cursor-pointer flex items-center gap-1 shrink-0">
                    <span className="material-symbols-outlined text-[15px]">cloud_upload</span>
                    업로드
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleCloudinaryUpload(e, 'artistPhoto')}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-neutral-600 mb-1">대표 인용구 (Artist Quote)</label>
              <input
                type="text"
                value={formData.artistQuote || ''}
                onChange={(e) => handleChange('artistQuote', e.target.value)}
                placeholder="예: 카메라는 눈이 아닌 마음의 렌즈로 세상을 기록하는 정직한 거울입니다."
                className="w-full px-3 py-2 text-xs sm:text-sm bg-neutral-50 border border-neutral-300 rounded-lg focus:bg-white focus:outline-none focus:border-neutral-900 italic font-serif transition-colors"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-neutral-600 mb-1">작가 노트 본문</label>
              <textarea
                rows={4}
                value={formData.artistNote || ''}
                onChange={(e) => handleChange('artistNote', e.target.value)}
                placeholder="전시를 준비하며 느낀 생각과 작가 노트를 작성하세요."
                className="w-full px-3 py-2 text-xs sm:text-sm bg-neutral-50 border border-neutral-300 rounded-lg focus:bg-white focus:outline-none focus:border-neutral-900 leading-relaxed transition-colors"
              />
            </div>
          </section>

          {/* SECTION 3: Select Photos for Exhibition (Swapped to #3) */}
          <section className="space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-neutral-900 text-white text-[11px] font-bold flex items-center justify-center">
                  3
                </span>
                <div>
                  <h3 className="font-sans font-bold text-sm text-neutral-900">전시할 사진 선택</h3>
                </div>
                <span className="text-xs text-neutral-500">
                  — 사진을 클릭하여 이 전시에 포함/제외하세요
                </span>
              </div>
              <span className="text-xs text-neutral-500 font-medium">
                표시 중: <strong className="text-neutral-900">{filteredPhotos.length}</strong> / 전체 {photos.length}장
              </span>
            </div>

            {/* Clean Minimal Filter & Quick Select Toolbar */}
            <div className="flex flex-col gap-2 bg-neutral-50 p-3 rounded-xl border border-neutral-200">
              <div className="flex flex-wrap items-center justify-between gap-2">
                {/* Left: View Filter Tabs */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setViewFilterMode('all')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      viewFilterMode === 'all'
                        ? 'bg-neutral-900 text-white font-semibold'
                        : 'bg-white text-neutral-600 border border-neutral-200 hover:border-neutral-400'
                    }`}
                  >
                    전체 ({photos.length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setViewFilterMode(viewFilterMode === 'pick' ? 'all' : 'pick')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1 ${
                      viewFilterMode === 'pick'
                        ? 'bg-emerald-600 text-white font-semibold shadow-2xs'
                        : 'bg-white text-emerald-800 border border-emerald-200 hover:bg-emerald-50'
                    }`}
                    title="갤러리에서 깃발 표시한 전시 후보 사진만 모아봅니다"
                  >
                    <span
                      style={{ fontVariationSettings: "'FILL' 1" }}
                      className={`material-symbols-outlined text-[14px] ${
                        viewFilterMode === 'pick' ? 'text-white' : 'text-emerald-600'
                      }`}
                    >
                      flag
                    </span>
                    <span>전시 후보 ({exhibitionPickPhotos.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setViewFilterMode(viewFilterMode === 'featured' ? 'all' : 'featured')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1 ${
                      viewFilterMode === 'featured'
                        ? 'bg-amber-500 text-white font-semibold shadow-2xs'
                        : 'bg-white text-amber-800 border border-amber-200 hover:bg-amber-50'
                    }`}
                    title="관리자 추천(★) 사진만 모아봅니다"
                  >
                    <span className="material-symbols-outlined text-[14px]">star</span>
                    <span>추천작 ({featuredPhotos.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsTagSearchOpen(!isTagSearchOpen)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1 ${
                      isTagSearchOpen || searchTagFilter
                        ? 'bg-neutral-900 text-white font-semibold'
                        : 'bg-white text-neutral-700 border border-neutral-200 hover:border-neutral-400'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[14px]">search</span>
                    <span>태그 검색</span>
                  </button>
                </div>

                {/* Right: Bulk Selection Quick Actions */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    disabled={exhibitionPickPhotos.length === 0}
                    onClick={() => {
                      const pickIds = exhibitionPickPhotos.map((p) => p.id);
                      setFormData((prev) => ({ ...prev, exhibitionPhotoIds: pickIds }));
                    }}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 disabled:opacity-40 disabled:pointer-events-none cursor-pointer transition-colors"
                    title="깃발 표시된 전시 후보 사진들을 일괄 선택합니다"
                  >
                    + 후보작 일괄 선택
                  </button>

                  <button
                    type="button"
                    disabled={featuredPhotos.length === 0}
                    onClick={() => {
                      const featIds = featuredPhotos.map((p) => p.id);
                      setFormData((prev) => ({ ...prev, exhibitionPhotoIds: featIds }));
                    }}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white hover:bg-amber-50 text-amber-800 border border-amber-300 disabled:opacity-40 disabled:pointer-events-none cursor-pointer transition-colors"
                    title="관리자 추천(★) 사진들을 일괄 선택합니다"
                  >
                    + 추천작 일괄 선택
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({ ...prev, exhibitionPhotoIds: photos.map((p) => p.id) }));
                    }}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-white hover:bg-neutral-100 text-neutral-700 border border-neutral-300 cursor-pointer transition-colors"
                  >
                    전체 선택
                  </button>
                </div>
              </div>

              {/* Expandable Tag Search Row */}
              {(isTagSearchOpen || searchTagFilter) && (
                <div className="pt-2 border-t border-neutral-200 space-y-2 animate-fadeIn">
                  <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                    <div className="relative flex-1">
                      <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-neutral-400">
                        search
                      </span>
                      <input
                        type="text"
                        value={searchTagFilter}
                        onChange={(e) => setSearchTagFilter(e.target.value)}
                        placeholder="태그, 제목, 장소 검색 (예: 풍경, 바다, 흑백...)"
                        className="w-full pl-8 pr-7 py-1.5 text-xs bg-white border border-neutral-300 rounded-lg focus:outline-none focus:border-neutral-900"
                      />
                      {searchTagFilter && (
                        <button
                          type="button"
                          onClick={() => setSearchTagFilter('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-neutral-400 hover:text-neutral-900 cursor-pointer"
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
                        className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold cursor-pointer shrink-0 transition-colors"
                      >
                        검색된 {filteredPhotos.length}장 모두 추가
                      </button>
                    )}
                  </div>

                  {allUniqueTags.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1">
                      {allUniqueTags.slice(0, 14).map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => setSearchTagFilter(searchTagFilter === tag ? '' : tag)}
                          className={`px-2 py-0.5 rounded-full text-[11px] font-medium transition-all cursor-pointer ${
                            searchTagFilter.toLowerCase() === tag.toLowerCase()
                              ? 'bg-neutral-900 text-white'
                              : 'bg-white text-neutral-600 border border-neutral-200 hover:border-neutral-400'
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

            {/* Section 3 Photo Selection Grid */}
            {filteredPhotos.length === 0 ? (
              <div className="py-10 text-center text-xs text-neutral-500 bg-neutral-50 rounded-xl border border-neutral-200">
                {viewFilterMode === 'pick'
                  ? '깃발(전시 후보) 표시된 사진이 없습니다. 갤러리 페이지에서 전시할 사진에 깃발 표시를 해보세요.'
                  : '조건에 일치하는 사진이 없습니다.'}
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5 max-h-64 overflow-y-auto p-2.5 bg-neutral-50 rounded-xl border border-neutral-200 custom-scrollbar">
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
                      className={`group relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all select-none ${
                        isSelected
                          ? 'border-neutral-900 ring-2 ring-neutral-900/20 scale-[0.98]'
                          : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={photo.url} alt={photo.title} className="w-full h-full object-cover" />

                      {/* Top-Left Status Badges (Flag / Star) */}
                      <div className="absolute top-1.5 left-1.5 flex items-center gap-1">
                        {photo.exhibitionPick && (
                          <div
                            className="bg-emerald-600/90 text-white rounded-full w-4.5 h-4.5 flex items-center justify-center shadow-xs"
                            title="전시 후보(깃발)"
                          >
                            <span
                              style={{ fontVariationSettings: "'FILL' 1" }}
                              className="material-symbols-outlined text-[11px] leading-none"
                            >
                              flag
                            </span>
                          </div>
                        )}
                        {photo.featured && (
                          <div
                            className="bg-amber-500/90 text-white rounded-full w-4.5 h-4.5 flex items-center justify-center shadow-xs"
                            title="관리자 추천"
                          >
                            <span
                              style={{ fontVariationSettings: "'FILL' 1" }}
                              className="material-symbols-outlined text-[11px] leading-none"
                            >
                              star
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Top-Right Selected Order Number (1, 2, 3...) */}
                      {isSelected && (
                        <div className="absolute top-1.5 right-1.5 bg-neutral-900 text-white rounded-full text-[11px] font-bold min-w-[20px] h-5 px-1 flex items-center justify-center shadow-md">
                          {selectedOrder}
                        </div>
                      )}

                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/75 via-black/40 to-transparent text-white text-[10px] px-1.5 py-1 truncate text-center">
                        {photo.title}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* SECTION 4: Exhibition Artworks Curation & Multi-Row Reordering (Swapped to #4) */}
          <section className="space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-neutral-900 text-white text-[11px] font-bold flex items-center justify-center">
                  4
                </span>
                <h3 className="font-sans font-bold text-sm text-neutral-900">
                  전시 작품 큐레이션 및 순서 변경
                </h3>
                <span className="text-xs text-neutral-500">
                  — 마우스로 드래그 앤 드롭하거나 화살표로 순서를 조정하세요
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-neutral-600 font-medium">
                  총 <strong className="text-neutral-900 font-bold">{selectedPhotoObjects.length}</strong>점 수록
                </span>
                {selectedPhotoObjects.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, exhibitionPhotoIds: [] }))}
                    className="text-xs text-rose-600 hover:text-rose-700 hover:underline font-semibold cursor-pointer"
                  >
                    전체 선택 해제
                  </button>
                )}
              </div>
            </div>

            {selectedPhotoObjects.length === 0 ? (
              <div className="py-10 text-center text-xs text-neutral-500 border border-dashed border-neutral-300 rounded-xl bg-neutral-50">
                위 <strong>3. 전시할 사진 선택</strong> 목록에서 전시에 수록할 작품을 먼저 선택해 주세요.
              </div>
            ) : (
              /* 3-Row Friendly Grid Layout for Drag & Drop Reordering */
              <div className="bg-neutral-50 p-3.5 rounded-xl border border-neutral-200">
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 max-h-[430px] overflow-y-auto p-1 custom-scrollbar">
                  {selectedPhotoObjects.map((photo, index) => (
                    <div
                      key={photo.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragEnd={handleDragEnd}
                      onDrop={(e) => handleDrop(e, index)}
                      className={`relative bg-white rounded-xl border p-1.5 shadow-2xs transition-all cursor-grab active:cursor-grabbing select-none flex flex-col ${
                        draggedIndex === index
                          ? 'opacity-40 scale-95 border-neutral-400'
                          : dragOverIndex === index
                          ? 'border-neutral-900 ring-2 ring-amber-400 scale-[1.03] z-10'
                          : 'border-neutral-200 hover:border-neutral-400'
                      }`}
                    >
                      {/* Image & Top Overlay Badges */}
                      <div className="relative aspect-square rounded-lg overflow-hidden bg-neutral-100 mb-1.5">
                        <img
                          src={photo.url}
                          alt={photo.title}
                          className="w-full h-full object-cover pointer-events-none"
                        />

                        {/* Prominent Order Number Badge: 1, 2, 3... */}
                        <div
                          className="absolute top-1.5 left-1.5 min-w-[22px] h-[22px] px-1.5 bg-neutral-900/90 backdrop-blur-xs text-white text-xs font-extrabold rounded-full flex items-center justify-center shadow-sm"
                          title={`${index + 1}번째 전시 작품`}
                        >
                          {index + 1}
                        </div>

                        {/* Remove Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const nextIds = (formData.exhibitionPhotoIds || []).filter((id) => id !== photo.id);
                            setFormData((prev) => ({ ...prev, exhibitionPhotoIds: nextIds }));
                          }}
                          title="전시에서 제외"
                          className="absolute top-1.5 right-1.5 bg-black/55 hover:bg-rose-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] transition-colors cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>

                      {/* Photo Title */}
                      <p className="text-[11px] font-medium text-neutral-800 truncate text-center px-1">
                        {photo.title}
                      </p>

                      {/* Minimal Left / Right Step Buttons */}
                      <div className="flex items-center justify-between mt-1 pt-1 border-t border-neutral-100">
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => handleMovePhoto(index, index - 1)}
                          title="순서 앞으로"
                          className="w-6 h-5 flex items-center justify-center rounded text-neutral-500 hover:bg-neutral-900 hover:text-white disabled:opacity-25 disabled:pointer-events-none text-[10px] cursor-pointer transition-colors"
                        >
                          ◀
                        </button>
                        <span className="text-[10px] font-semibold text-neutral-400 tabular-nums">
                          {index + 1}
                        </span>
                        <button
                          type="button"
                          disabled={index === selectedPhotoObjects.length - 1}
                          onClick={() => handleMovePhoto(index, index + 1)}
                          title="순서 뒤로"
                          className="w-6 h-5 flex items-center justify-center rounded text-neutral-500 hover:bg-neutral-900 hover:text-white disabled:opacity-25 disabled:pointer-events-none text-[10px] cursor-pointer transition-colors"
                        >
                          ▶
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {isUploading && (
            <div className="p-3 bg-amber-50 text-amber-800 text-xs rounded-lg flex items-center gap-2">
              <span className="material-symbols-outlined text-sm animate-spin">sync</span>
              <span>Cloudinary로 이미지 업로드 중...</span>
            </div>
          )}

          {uploadError && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg">{uploadError}</div>
          )}

          {/* Sticky-style Clean Footer Actions */}
          <div className="flex justify-end items-center gap-2 pt-4 border-t border-neutral-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm border border-neutral-300 text-neutral-700 rounded-xl font-medium hover:bg-neutral-100 transition-colors cursor-pointer"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs sm:text-sm bg-neutral-900 text-white rounded-xl font-semibold hover:bg-neutral-800 transition-colors shadow-sm cursor-pointer flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">check</span>
              변경사항 저장
            </button>
          </div>
        </form>
      </div>

      {/* Unified Sub-Modal for Cover / Artist Photo Selection */}
      {photoPickerTarget && (
        <div className="fixed inset-0 z-[70] bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] flex flex-col p-5 shadow-2xl border border-neutral-200">
            <div className="flex justify-between items-center mb-3 pb-3 border-b border-neutral-200">
              <h3 className="font-sans text-sm sm:text-base font-bold text-neutral-900">
                {photoPickerTarget === 'introImage' ? '전시 대표 커버 이미지 선택' : '작가 프로필 사진 선택'}
              </h3>
              <button
                type="button"
                onClick={() => setPhotoPickerTarget(null)}
                className="w-7 h-7 rounded-full hover:bg-neutral-100 flex items-center justify-center text-neutral-500 cursor-pointer transition-colors"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 overflow-y-auto max-h-[55vh] p-1 custom-scrollbar">
              {photos.map((photo) => (
                <button
                  key={photo.id}
                  type="button"
                  onClick={() => handleSelectPhotoForTarget(photo.url)}
                  className="group relative aspect-square rounded-xl overflow-hidden border border-neutral-200 hover:border-neutral-900 transition-all cursor-pointer bg-neutral-100"
                >
                  <img
                    src={photo.url}
                    alt={photo.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-xs font-semibold p-2 text-center">
                    <span className="material-symbols-outlined text-lg text-white mb-0.5">check_circle</span>
                    <span className="line-clamp-1 text-[11px]">{photo.title}</span>
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
