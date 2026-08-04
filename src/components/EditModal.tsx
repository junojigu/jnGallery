import React, { useState, useEffect } from 'react';
import { Category, Tag, Photo } from '../types';
import { extractExifFromFile, extractExifFromUrl } from '../utils/exif';

type EditTarget = 
  | { type: 'category'; data: Category }
  | { type: 'tag'; data: Tag }
  | { type: 'photo'; data: Photo }
  | null;

interface EditModalProps {
  target: EditTarget;
  categories: Category[];
  tags: Tag[];
  onClose: () => void;
  onSaveCategory: (cat: Category) => void;
  onSaveTag: (tag: Tag) => void;
  onSavePhoto: (photo: Photo) => void;
}

const PRIMARY_DEFAULT_TAGS = ['Nature', 'Portrait', 'Street', 'Architecture', 'Abstract'];

const isPrimaryTag = (tagName: string) =>
  PRIMARY_DEFAULT_TAGS.some(
    (p) => p.toLowerCase() === tagName.replace(/^#/, '').trim().toLowerCase()
  );

export const EditModal: React.FC<EditModalProps> = ({
  target,
  categories,
  tags,
  onClose,
  onSaveCategory,
  onSaveTag,
  onSavePhoto,
}) => {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('palette');
  const [description, setDescription] = useState('');
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [photoTags, setPhotoTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState('');
  const [isAllTagsDropdownOpen, setIsAllTagsDropdownOpen] = useState(false);
  const [location, setLocation] = useState('');
  const [camera, setCamera] = useState('');
  const [exif, setExif] = useState('');
  const [featured, setFeatured] = useState(false);
  const [exifNotice, setExifNotice] = useState<string | null>(null);

  const handleEditFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setExifNotice('📸 선택한 새 파일에서 EXIF 메타데이터를 추출하는 중...');
    
    // Convert to data URL for preview/url
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setUrl(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);

    try {
      const extracted = await extractExifFromFile(file);
      let detectedItems: string[] = [];
      if (extracted.camera) {
        setCamera(extracted.camera);
        detectedItems.push(`카메라: ${extracted.camera}`);
      }
      if (extracted.exif) {
        setExif(extracted.exif);
        detectedItems.push(`셔터/ISO: ${extracted.exif}`);
      }
      if (detectedItems.length > 0) {
        setExifNotice(`✨ EXIF 메타데이터 자동 추출 완료! (${detectedItems.join(' | ')})`);
      } else {
        setExifNotice('ℹ️ 파일에서 EXIF 메타데이터를 감지하지 못했습니다.');
      }
    } catch {
      setExifNotice(null);
    }
  };

  const handleReadExifFromCurrentUrl = async () => {
    if (!url) return;
    try {
      setExifNotice('📸 현재 이미지 URL에서 EXIF 정보 분석 중...');
      const extracted = await extractExifFromUrl(url);
      let detectedItems: string[] = [];
      if (extracted.camera) {
        setCamera(extracted.camera);
        detectedItems.push(`카메라: ${extracted.camera}`);
      }
      if (extracted.exif) {
        setExif(extracted.exif);
        detectedItems.push(`셔터/ISO: ${extracted.exif}`);
      }
      if (detectedItems.length > 0) {
        setExifNotice(`✨ EXIF 메타데이터 추출 완료! (${detectedItems.join(' | ')})`);
      } else {
        setExifNotice('ℹ️ URL 이미지에서 EXIF 메타데이터를 감지하지 못했습니다.');
      }
    } catch {
      setExifNotice('ℹ️ 외부 이미지 URL에서 EXIF 메타데이터를 읽을 수 없습니다.');
    }
  };

  useEffect(() => {
    if (!target) return;
    if (target.type === 'category') {
      setName(target.data.name);
      setIcon(target.data.icon || 'palette');
      setDescription(target.data.description || '');
    } else if (target.type === 'tag') {
      setName(target.data.name);
    } else if (target.type === 'photo') {
      setTitle(target.data.title);
      setDescription(target.data.description);
      setUrl(target.data.url);
      setCategoryId(target.data.categoryId);
      setPhotoTags(target.data.tags || []);
      setLocation(target.data.location || '');
      setCamera(target.data.camera || '');
      setExif(target.data.exif || '');
      setFeatured(target.data.featured || false);
      setCustomTag('');
      setIsAllTagsDropdownOpen(false);
    }
  }, [target]);

  if (!target) return null;

  const customAppliedTags = photoTags.filter((t) => !isPrimaryTag(t));

  const sortedAllTags = [...tags].sort((a, b) => a.name.localeCompare(b.name, 'ko'));

  const matchingSystemTags = tags.filter((t) => {
    if (!customTag.trim()) return false;
    const q = customTag.toLowerCase().replace(/^#/, '').trim();
    const nameNorm = t.name.toLowerCase().replace(/^#/, '').trim();
    return (
      nameNorm.includes(q) &&
      !photoTags.some(
        (pt) => pt.replace(/^#/, '').toLowerCase() === t.name.replace(/^#/, '').toLowerCase()
      )
    );
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (target.type === 'category') {
      if (!name.trim()) return;
      onSaveCategory({
        ...target.data,
        name: name.trim(),
        icon: icon.trim() || 'folder',
        description: description.trim()
      });
    } else if (target.type === 'tag') {
      if (!name.trim()) return;
      const formatted = name.startsWith('#') ? name.trim() : `#${name.trim()}`;
      onSaveTag({
        ...target.data,
        name: formatted
      });
    } else if (target.type === 'photo') {
      if (!title.trim() || !url.trim()) return;
      let finalTags = [...photoTags];
      if (customTag.trim()) {
        const parts = customTag.split(/[\s,]+/).filter(Boolean);
        parts.forEach((part) => {
          const formatted = part.startsWith('#') ? part.trim() : `#${part.trim()}`;
          if (formatted.length > 1 && !finalTags.includes(formatted)) {
            finalTags.push(formatted);
          }
        });
      }
      const matchedCat = categories.find((c) => c.id === categoryId);
      onSavePhoto({
        ...target.data,
        title: title.trim(),
        description: description.trim(),
        url: url.trim(),
        categoryId,
        category: matchedCat?.name || categoryId,
        tags: finalTags,
        location: location.trim(),
        camera: camera.trim(),
        exif: exif.trim(),
        featured
      });
    }
    onClose();
  };

  const handleToggleTag = (tagName: string) => {
    if (photoTags.includes(tagName)) {
      setPhotoTags(photoTags.filter(t => t !== tagName));
    } else {
      setPhotoTags([...photoTags, tagName]);
    }
  };

  const handleAddCustomTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && customTag.trim()) {
      e.preventDefault();
      const parts = customTag.split(/[\s,]+/).filter(Boolean);
      const updated = [...photoTags];
      parts.forEach((part) => {
        const formatted = part.startsWith('#') ? part.trim() : `#${part.trim()}`;
        if (formatted.length > 1 && !updated.includes(formatted)) {
          updated.push(formatted);
        }
      });
      setPhotoTags(updated);
      setCustomTag('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-xl max-w-lg w-full p-5 sm:p-6 md:p-7 ambient-shadow border border-[#c4c7c7]/30 max-h-[88vh] sm:max-h-[90vh] flex flex-col my-auto shadow-2xl">
        <div className="flex justify-between items-center mb-4 border-b border-[#e2e2e2] pb-3 shrink-0">
          <h2 className="font-serif text-xl font-semibold text-[#000000]">
            Edit {target.type === 'category' ? 'Category' : target.type === 'tag' ? 'Tag' : 'Photo'}
          </h2>
          <button onClick={onClose} className="text-[#747878] hover:text-[#000000] cursor-pointer p-1 rounded-lg hover:bg-[#f3f3f4] transition-colors">
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
          {target.type === 'category' && (
            <>
              <div>
                <label className="block text-xs font-semibold uppercase text-[#444748] mb-1">
                  Category Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#f9f9f9] border border-[#c4c7c7] rounded-lg px-3 py-2 text-sm text-[#000000]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-[#444748] mb-1">
                  Icon (Material Symbol)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    placeholder="e.g. palette, forest, person"
                    className="flex-grow bg-[#f9f9f9] border border-[#c4c7c7] rounded-lg px-3 py-2 text-sm text-[#000000]"
                  />
                  <div className="w-10 h-10 rounded-full bg-[#f3f3f4] flex items-center justify-center text-[#1a1c1c]">
                    <span className="material-symbols-outlined">{icon || 'folder'}</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {target.type === 'tag' && (
            <div>
              <label className="block text-xs font-semibold uppercase text-[#444748] mb-1">
                Tag Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#f9f9f9] border border-[#c4c7c7] rounded-lg px-3 py-2 text-sm text-[#000000]"
              />
            </div>
          )}

          {target.type === 'photo' && (
            <>
              <div>
                <label className="block text-xs font-semibold uppercase text-[#444748] mb-1">
                  Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[#f9f9f9] border border-[#c4c7c7] rounded-lg px-3 py-2 text-sm text-[#000000]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-[#444748] mb-1">
                  Image URL
                </label>
                <input
                  type="text"
                  required
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full bg-[#f9f9f9] border border-[#c4c7c7] rounded-lg px-3 py-2 text-sm text-[#000000]"
                />
                {url && (
                  <div className="mt-2 relative w-full h-48 sm:h-56 rounded-xl overflow-hidden border border-[#c4c7c7] bg-[#1a1c1e] flex items-center justify-center p-2 shadow-inner">
                    <img src={url} alt="Photo Preview" className="max-w-full max-h-full w-auto h-auto object-contain rounded-md shadow-xs" />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-[#444748] mb-1">
                  Category
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full bg-[#f9f9f9] border border-[#c4c7c7] rounded-lg px-3 py-2 text-sm text-[#000000]"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-[#444748] mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#f9f9f9] border border-[#c4c7c7] rounded-lg px-3 py-2 text-sm text-[#000000]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-[#444748] mb-1.5">
                  Tags (태그)
                </label>

                {/* Primary Default Tags and Applied Custom Tags */}
                <div className="p-2.5 bg-[#f9f9f9] border border-[#e2e2e2] rounded-xl mb-2.5 space-y-2">
                  {/* Row 1: Primary Default Tags */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {PRIMARY_DEFAULT_TAGS.map((primName) => {
                      const isSelected = photoTags.some(
                        (pt) => pt.replace(/^#/, '').trim().toLowerCase() === primName.toLowerCase()
                      );
                      const displayTag = `#${primName}`;
                      return (
                        <button
                          key={primName}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setPhotoTags(
                                photoTags.filter(
                                  (pt) => pt.replace(/^#/, '').trim().toLowerCase() !== primName.toLowerCase()
                                )
                              );
                            } else {
                              setPhotoTags([...photoTags, displayTag]);
                            }
                          }}
                          className={`h-7 inline-flex items-center text-xs px-2.5 rounded-full cursor-pointer transition-all border font-medium ${
                            isSelected
                              ? 'bg-[#000000] text-white border-[#000000]'
                              : 'bg-white text-[#5d5f5f] border-[#c4c7c7]/50 hover:bg-[#eef0f0]'
                          }`}
                        >
                          {displayTag}
                        </button>
                      );
                    })}
                  </div>

                  {/* Row 2: Applied Custom Tags on New Line (Scrollable if many tags) */}
                  {customAppliedTags.length > 0 && (
                    <div className="pt-2 border-t border-[#e8e8e8] flex flex-wrap items-center gap-1.5 max-h-28 overflow-y-auto pr-1 custom-scrollbar">
                      {customAppliedTags.map((t) => {
                        const display = t.startsWith('#') ? t : `#${t}`;
                        return (
                          <span
                            key={t}
                            className="h-7 inline-flex items-center gap-1 text-xs pl-2.5 pr-1.5 rounded-full bg-[#1a1c1c] text-white font-medium border border-[#1a1c1c]"
                          >
                            <span>{display}</span>
                            <button
                              type="button"
                              onClick={() => setPhotoTags(photoTags.filter((pt) => pt !== t))}
                              className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-white/20 text-white/70 hover:text-white transition-colors cursor-pointer"
                              title="태그 삭제"
                            >
                              <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Minimal Search & Add Input with Alphabetical Dropdown Toggle */}
                <div className="relative">
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined absolute left-2.5 text-sm text-[#747878] pointer-events-none">
                      search
                    </span>
                    <input
                      type="text"
                      value={customTag}
                      onChange={(e) => {
                        setCustomTag(e.target.value);
                        if (isAllTagsDropdownOpen) setIsAllTagsDropdownOpen(false);
                      }}
                      onKeyDown={handleAddCustomTag}
                      placeholder="태그 검색 및 추가 (예: #강릉고, #sea 입력 후 Enter)"
                      className="w-full bg-[#f9f9f9] border border-[#c4c7c7] rounded-lg pl-8 pr-8 py-1.5 text-xs text-[#000000] focus:outline-none focus:border-[#000000] focus:bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setIsAllTagsDropdownOpen(!isAllTagsDropdownOpen)}
                      className={`absolute right-2 p-1 rounded hover:bg-[#e2e2e2] text-[#5d5f5f] transition-colors cursor-pointer flex items-center justify-center ${
                        isAllTagsDropdownOpen ? 'bg-[#e2e2e2] text-[#000000]' : ''
                      }`}
                      title="전체 태그 목록 (가나다순)"
                    >
                      <span className="material-symbols-outlined text-base leading-none">
                        {isAllTagsDropdownOpen ? 'expand_less' : 'unfold_more'}
                      </span>
                    </button>
                  </div>

                  {/* Alphabetical All Tags Dropdown Popover */}
                  {isAllTagsDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-[#c4c7c7]/80 rounded-xl shadow-lg z-30 max-h-48 overflow-y-auto p-2.5 custom-scrollbar">
                      <div className="text-[11px] font-semibold text-[#747878] mb-2 flex items-center justify-between border-b border-[#f0f0f0] pb-1.5">
                        <span>전체 태그 목록 (가나다순)</span>
                        <span className="text-[10px] text-[#a0a0a5] font-normal">총 {sortedAllTags.length}개</span>
                      </div>
                      {sortedAllTags.length === 0 ? (
                        <p className="text-xs text-[#8e8e93] py-2 text-center">등록된 태그가 없습니다.</p>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {sortedAllTags.map((t) => {
                            const isSelected = photoTags.some(
                              (pt) => pt.replace(/^#/, '').toLowerCase() === t.name.replace(/^#/, '').toLowerCase()
                            );
                            return (
                              <button
                                key={t.id}
                                type="button"
                                onClick={() => {
                                  if (isSelected) {
                                    setPhotoTags(
                                      photoTags.filter(
                                        (pt) => pt.replace(/^#/, '').toLowerCase() !== t.name.replace(/^#/, '').toLowerCase()
                                      )
                                    );
                                  } else {
                                    setPhotoTags([...photoTags, t.name]);
                                  }
                                }}
                                className={`text-xs px-2.5 py-1 rounded-full cursor-pointer transition-all border ${
                                  isSelected
                                    ? 'bg-[#000000] text-white border-[#000000] font-medium'
                                    : 'bg-[#f5f5f5] text-[#444748] border-[#e2e2e2] hover:bg-[#e2e2e2]'
                                }`}
                              >
                                {t.name.startsWith('#') ? t.name : `#${t.name}`}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Search Autocomplete Suggestions Popover */}
                  {customTag.trim() && !isAllTagsDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-[#c4c7c7]/80 rounded-xl shadow-lg z-20 max-h-36 overflow-y-auto p-2 custom-scrollbar">
                      {matchingSystemTags.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {matchingSystemTags.map((t) => (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => {
                                if (!photoTags.includes(t.name)) {
                                  setPhotoTags([...photoTags, t.name]);
                                }
                                setCustomTag('');
                              }}
                              className="text-xs px-2.5 py-1 rounded-full bg-[#f3f3f4] text-[#1a1c1c] hover:bg-[#000000] hover:text-white transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <span>{t.name}</span>
                              <span className="text-[10px] opacity-60">+추가</span>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="p-1.5 text-xs text-[#747878] flex items-center justify-between">
                          <span>
                            새 태그 <strong>"{customTag.trim()}"</strong> 추가
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const parts = customTag.split(/[\s,]+/).filter(Boolean);
                              const updated = [...photoTags];
                              parts.forEach((part) => {
                                const formatted = part.startsWith('#') ? part.trim() : `#${part.trim()}`;
                                if (formatted.length > 1 && !updated.includes(formatted)) {
                                  updated.push(formatted);
                                }
                              });
                              setPhotoTags(updated);
                              setCustomTag('');
                            }}
                            className="px-2 py-0.5 rounded bg-[#000000] text-white text-[11px] font-medium cursor-pointer"
                          >
                            Enter 눌러 추가
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-[#e2e2e2]">
                {exifNotice && (
                  <div className="mb-3 text-xs p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 font-medium flex items-center justify-between">
                    <span>{exifNotice}</span>
                    <button
                      type="button"
                      onClick={() => setExifNotice(null)}
                      className="text-amber-700 hover:text-amber-950 font-bold ml-2 text-xs"
                    >
                      ✕
                    </button>
                  </div>
                )}

                <div className="flex items-center justify-between mb-3 bg-[#f5f5f5] p-2.5 rounded-lg border border-[#e2e2e2]">
                  <span className="text-xs text-[#444748] font-medium">📷 새 이미지 파일로 교체 또는 EXIF 재분석</span>
                  <div className="flex items-center gap-2">
                    <label className="px-2.5 py-1 bg-white border border-[#c4c7c7] text-[#1a1c1c] rounded text-xs cursor-pointer hover:bg-[#eaeaea]">
                      파일 선택
                      <input type="file" accept="image/*" onChange={handleEditFileChange} className="hidden" />
                    </label>
                    <button
                      type="button"
                      onClick={handleReadExifFromCurrentUrl}
                      className="px-2.5 py-1 bg-[#000000] text-white rounded text-xs cursor-pointer hover:opacity-90"
                    >
                      EXIF 읽기
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] text-[#747878] mb-1">Location (촬영 위치)</label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. Northern Alps, AT"
                      className="w-full bg-[#f9f9f9] border border-[#c4c7c7] rounded px-2 py-1 text-xs text-[#000000]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#747878] mb-1 flex items-center justify-between">
                      <span>Camera (카메라)</span>
                      <span className="text-[10px] text-amber-600 font-normal">EXIF</span>
                    </label>
                    <input
                      type="text"
                      value={camera}
                      onChange={(e) => setCamera(e.target.value)}
                      placeholder="e.g. Sony A7R IV • 50mm"
                      className="w-full bg-[#f9f9f9] border border-[#c4c7c7] rounded px-2 py-1 text-xs text-[#000000] focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#747878] mb-1 flex items-center justify-between">
                      <span>Shutter / ISO</span>
                      <span className="text-[10px] text-amber-600 font-normal">EXIF</span>
                    </label>
                    <input
                      type="text"
                      value={exif}
                      onChange={(e) => setExif(e.target.value)}
                      placeholder="e.g. f/8 • 1/250s • ISO 100"
                      className="w-full bg-[#f9f9f9] border border-[#c4c7c7] rounded px-2 py-1 text-xs text-[#000000] focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Featured toggle checkbox */}
              <div className="pt-2">
                <label className="inline-flex items-center gap-2 cursor-pointer select-none text-xs font-medium text-[#1a1c1c] bg-[#f5f5f5] hover:bg-[#eaeaea] px-3 py-2 rounded-lg border border-[#e2e2e2] transition-colors">
                  <input
                    type="checkbox"
                    checked={featured}
                    onChange={(e) => setFeatured(e.target.checked)}
                    className="w-4 h-4 rounded border-[#c4c7c7] text-black focus:ring-black cursor-pointer"
                  />
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-amber-500 text-base leading-none">star</span>
                    <span>관리자 추천작 (Featured)</span>
                  </span>
                </label>
              </div>
            </>
          )}
          </div>

          {/* Sticky Bottom Buttons Footer */}
          <div className="flex justify-end items-center gap-3 pt-4 mt-3 border-t border-[#e2e2e2] shrink-0 bg-white">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-[#747878] rounded-lg text-xs font-medium text-[#000000] hover:bg-[#e2e2e2] cursor-pointer transition-colors"
            >
              취소 (Cancel)
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#000000] text-white rounded-lg text-xs font-medium hover:bg-opacity-90 cursor-pointer transition-opacity flex items-center gap-1.5"
            >
              <span>저장 (Save Changes)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
