import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Category, Photo, Tag } from '../types';
import { SideNav } from '../components/SideNav';

interface GalleryViewProps {
  categories: Category[];
  tags: Tag[];
  photos: Photo[];
  selectedCategoryId: string | null;
  onSelectCategory: (id: string | null) => void;
  searchQuery: string;
  onViewPhoto: (photo: Photo, contextPhotos?: Photo[], filterLabel?: string) => void;
  onEditPhoto: (photo: Photo) => void;
  onDeletePhoto: (photo: Photo) => void;
  onViewAllTags: () => void;
  isAdmin?: boolean;
}

const INITIAL_VISIBLE_COUNT = 16;
const PAGE_INCREMENT = 8;
const DEFAULT_PRIMARY_TAGS = ['Nature', 'Portrait', 'Street', 'Architecture', 'Abstract'];

const normalizeTag = (str: string) => str.replace(/^#/, '').trim().toLowerCase();

export const GalleryView: React.FC<GalleryViewProps> = ({
  categories,
  tags,
  photos,
  selectedCategoryId,
  onSelectCategory,
  searchQuery,
  onViewPhoto,
  onEditPhoto,
  onDeletePhoto,
  onViewAllTags,
  isAdmin = false,
}) => {
  const [selectedTagFilters, setSelectedTagFilters] = useState<string[]>([]);
  const [tagFilterMode, setTagFilterMode] = useState<'OR' | 'AND'>('OR');
  const [photoSortOrder, setPhotoSortOrder] = useState<'date' | 'popular'>('date');
  const [visibleCount, setVisibleCount] = useState<number>(INITIAL_VISIBLE_COUNT);
  
  // Tag dropdown states
  const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false);
  const [tagSearchInput, setTagSearchInput] = useState('');
  const [tagSortBy, setTagSortBy] = useState<'count' | 'name'>('count');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Toggle tag filter helper
  const toggleTagFilter = (tagName: string) => {
    const norm = normalizeTag(tagName);
    setSelectedTagFilters((prev) => {
      const exists = prev.some((t) => normalizeTag(t) === norm);
      if (exists) {
        return prev.filter((t) => normalizeTag(t) !== norm);
      } else {
        return [...prev, tagName];
      }
    });
  };

  const clearTagFilters = () => {
    setSelectedTagFilters([]);
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsTagDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset pagination when filter/category/search changes
  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE_COUNT);
  }, [selectedCategoryId, selectedTagFilters, tagFilterMode, searchQuery]);

  // Tag counts based on current category selection
  const tagCounts = useMemo(() => {
    const map: Record<string, number> = {};
    const basePhotos = selectedCategoryId
      ? photos.filter((p) => p.categoryId === selectedCategoryId || p.category === selectedCategoryId)
      : photos;
    
    basePhotos.forEach((p) => {
      (p.tags || []).forEach((t) => {
        map[t] = (map[t] || 0) + 1;
      });
    });
    return map;
  }, [photos, selectedCategoryId]);

  // All unique tag names sorted
  const allTagNames = useMemo(() => {
    const set = new Set<string>();
    tags.forEach((t) => set.add(t.name));
    photos.forEach((p) => (p.tags || []).forEach((t) => set.add(t)));
    return Array.from(set);
  }, [tags, photos]);

  // Primary tags list for the main bar
  const primaryTagNames = useMemo(() => {
    return DEFAULT_PRIMARY_TAGS.map((prim) => {
      const found = allTagNames.find((t) => normalizeTag(t) === normalizeTag(prim));
      return found || `#${prim}`;
    });
  }, [allTagNames]);

  // Main chips to render on the main bar
  const mainChips = useMemo(() => {
    const list = [...primaryTagNames];
    selectedTagFilters.forEach((selected) => {
      const isPrimary = primaryTagNames.some((p) => normalizeTag(p) === normalizeTag(selected));
      if (!isPrimary && !list.some((item) => normalizeTag(item) === normalizeTag(selected))) {
        list.push(selected);
      }
    });
    return list;
  }, [primaryTagNames, selectedTagFilters]);

  // Dropdown list (contains remaining tags not in primaryTagNames, sorted & filtered)
  const dropdownFilteredTags = useMemo(() => {
    const primaryNorms = primaryTagNames.map((p) => normalizeTag(p));
    let remaining = allTagNames.filter((t) => !primaryNorms.includes(normalizeTag(t)));

    if (tagSearchInput.trim()) {
      const q = tagSearchInput.toLowerCase().trim();
      remaining = remaining.filter((t) => t.toLowerCase().includes(q));
    }

    remaining.sort((a, b) => {
      if (tagSortBy === 'count') {
        const countDiff = (tagCounts[b] || 0) - (tagCounts[a] || 0);
        if (countDiff !== 0) return countDiff;
        return a.localeCompare(b, 'ko');
      } else {
        return a.localeCompare(b, 'ko');
      }
    });

    return remaining;
  }, [allTagNames, primaryTagNames, tagSearchInput, tagSortBy, tagCounts]);

  // Active Category details
  const activeCategory = categories.find((c) => c.id === selectedCategoryId);
  const categoryTitle = activeCategory ? `${activeCategory.name} Collection` : 'All Collections';
  const categoryDesc = activeCategory?.description || 'A curated gallery of fine photography studies. Explore landscapes, portraits, architecture, and everyday street moments.';

  // Filter photos (with deduplication by ID and URL)
  const filteredPhotos = useMemo(() => {
    const seenIds = new Set<string>();
    const seenUrls = new Set<string>();
    const uniquePhotos: Photo[] = [];

    for (const p of photos) {
      if (!p || !p.id) continue;
      const normUrl = (p.url || '').trim();
      if (seenIds.has(p.id)) continue;
      if (normUrl && seenUrls.has(normUrl)) continue;

      seenIds.add(p.id);
      if (normUrl) seenUrls.add(normUrl);
      uniquePhotos.push(p);
    }

    return uniquePhotos.filter((photo) => {
      // Category match
      if (selectedCategoryId) {
        const matchId = photo.categoryId === selectedCategoryId;
        const matchCatName = activeCategory && photo.category?.toLowerCase() === activeCategory.name.toLowerCase();
        const matchRawCategory = photo.category === selectedCategoryId;
        if (!matchId && !matchCatName && !matchRawCategory) {
          return false;
        }
      }
      // Tag match
      if (selectedTagFilters.length > 0) {
        const photoTagsNorm = (photo.tags || []).map((t) => normalizeTag(t));
        const cat = categories.find((c) => c.id === photo.categoryId);
        const photoCatNorm = [
          cat ? normalizeTag(cat.name) : '',
          photo.category ? normalizeTag(photo.category) : ''
        ].filter(Boolean);

        const checkMatch = (filterTag: string) => {
          const normF = normalizeTag(filterTag);
          return photoTagsNorm.includes(normF) || photoCatNorm.includes(normF);
        };

        if (tagFilterMode === 'AND') {
          const matchesAll = selectedTagFilters.every((fTag) => checkMatch(fTag));
          if (!matchesAll) return false;
        } else {
          const matchesAny = selectedTagFilters.some((fTag) => checkMatch(fTag));
          if (!matchesAny) return false;
        }
      }
      // Search query match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = photo.title.toLowerCase().includes(q);
        const matchDesc = photo.description.toLowerCase().includes(q);
        const matchTags = photo.tags.some((t) => t.toLowerCase().includes(q));
        const matchLocation = photo.location?.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchTags && !matchLocation) {
          return false;
        }
      }
      return true;
    });
  }, [photos, selectedCategoryId, activeCategory, selectedTagFilters, tagFilterMode, searchQuery, categories]);

  // Sort photos according to photoSortOrder ('date' | 'popular')
  const sortedPhotos = useMemo(() => {
    const list = [...filteredPhotos];
    if (photoSortOrder === 'date') {
      list.sort((a, b) => {
        const timeA = a.date ? (Date.parse(a.date) || 0) : 0;
        const timeB = b.date ? (Date.parse(b.date) || 0) : 0;
        if (timeA !== timeB) return timeB - timeA;
        return b.id.localeCompare(a.id);
      });
    } else if (photoSortOrder === 'popular') {
      list.sort((a, b) => {
        const featA = a.featured ? 1 : 0;
        const featB = b.featured ? 1 : 0;
        if (featA !== featB) return featB - featA;
        const tagsA = a.tags?.length || 0;
        const tagsB = b.tags?.length || 0;
        if (tagsA !== tagsB) return tagsB - tagsA;
        const timeA = a.date ? (Date.parse(a.date) || 0) : 0;
        const timeB = b.date ? (Date.parse(b.date) || 0) : 0;
        if (timeA !== timeB) return timeB - timeA;
        return b.id.localeCompare(a.id);
      });
    }
    return list;
  }, [filteredPhotos, photoSortOrder]);

  const visiblePhotos = sortedPhotos.slice(0, visibleCount);
  const hasMore = visibleCount < sortedPhotos.length;
  const remainingCount = sortedPhotos.length - visibleCount;

  return (
    <div className="flex-grow flex w-full max-w-[1280px] mx-auto relative min-h-screen">
      {/* SideNav for desktop */}
      <SideNav
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        onSelectCategory={(id) => {
          onSelectCategory(id);
          clearTagFilters();
        }}
        onViewAllTags={onViewAllTags}
        isAdmin={isAdmin}
      />

      {/* Main Content Area */}
      <main className="flex-grow md:ml-64 px-4 md:px-10 py-8 w-full bg-[#f9f9f9]">
        {/* Context Header & Filter Bar Container */}
        <div className="max-w-[1280px] mx-auto mb-10">
          {/* Header Title & Count on same line */}
          <div className="mb-6">
            <div className="flex flex-wrap items-baseline gap-3">
              <h1 className="font-sans text-3xl md:text-5xl font-extrabold text-[#000000] tracking-tight">
                {categoryTitle}
              </h1>
              <span className="text-sm md:text-base font-sans font-medium text-[#8e8e93]">
                총 {filteredPhotos.length} 작품
                {visibleCount < filteredPhotos.length && (
                  <span>({Math.min(visibleCount, filteredPhotos.length)}개 표시 중)</span>
                )}
              </span>
            </div>
          </div>

          {/* Tag Navigation Bar (Subtle Line Tab Style) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e5e5e5] pb-2.5">
            {/* Tag List Tabs */}
            <div className="flex flex-wrap items-center gap-5 sm:gap-6">
              {/* All Button */}
              <button
                onClick={clearTagFilters}
                className={`font-sans text-sm font-semibold cursor-pointer pb-2.5 -mb-3 transition-colors border-b-2 ${
                  selectedTagFilters.length === 0
                    ? 'text-[#000000] border-[#000000] font-bold'
                    : 'text-[#8e8e93] hover:text-[#000000] border-transparent'
                }`}
              >
                All {activeCategory ? activeCategory.name : 'Photos'}
              </button>

              {/* Top Main Tags */}
              {mainChips.map((tagName) => {
                const isSelected = selectedTagFilters.some((t) => normalizeTag(t) === normalizeTag(tagName));
                const displayName = tagName.startsWith('#') ? tagName : `#${tagName}`;
                return (
                  <button
                    key={tagName}
                    onClick={() => toggleTagFilter(tagName)}
                    className={`font-sans text-sm font-medium cursor-pointer pb-2.5 -mb-3 transition-colors border-b-2 flex items-center gap-1 ${
                      isSelected
                        ? 'text-[#000000] border-[#000000] font-bold'
                        : 'text-[#8e8e93] hover:text-[#000000] border-transparent'
                    }`}
                  >
                    <span>{displayName}</span>
                    {isSelected && <span className="text-[10px] bg-black text-white px-1.5 py-0.2 rounded-full">✓</span>}
                  </button>
                );
              })}
            </div>

            {/* Dropdown Box for More/Search Tags */}
            <div className="relative shrink-0" ref={dropdownRef}>
              <button
                onClick={() => setIsTagDropdownOpen(!isTagDropdownOpen)}
                className={`font-sans text-xs font-medium px-3.5 py-2 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                  isTagDropdownOpen || selectedTagFilters.length > 0
                    ? 'bg-[#1a1c1c] text-white'
                    : 'bg-[#f5f5f5] hover:bg-[#eaeaea] text-[#2c2c2e]'
                }`}
              >
                <span className="material-symbols-outlined text-sm">search</span>
                <span>태그 검색 / 더보기</span>
                {selectedTagFilters.length > 0 && (
                  <span className="bg-white text-black text-[10px] font-extrabold px-1.5 py-0.2 rounded-full">
                    {selectedTagFilters.length}
                  </span>
                )}
                <span className="material-symbols-outlined text-sm">
                  {isTagDropdownOpen ? 'expand_less' : 'expand_more'}
                </span>
              </button>

              {/* Dropdown Popover */}
              {isTagDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 md:w-80 bg-white rounded-2xl shadow-xl border border-[#c4c7c7]/50 p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  {/* Search Header */}
                  <div className="relative mb-2.5">
                    <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-[#747878]">
                      search
                    </span>
                    <input
                      type="text"
                      value={tagSearchInput}
                      onChange={(e) => setTagSearchInput(e.target.value)}
                      placeholder="태그 이름으로 검색..."
                      className="w-full bg-[#f3f3f4] text-xs text-[#000000] pl-8 pr-7 py-2 rounded-xl border border-transparent focus:border-[#000000] focus:bg-white focus:outline-none transition-all"
                      autoFocus
                    />
                    {tagSearchInput && (
                      <button
                        onClick={() => setTagSearchInput('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-[#747878] hover:text-[#000000]"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Filter Mode & Reset Controls */}
                  <div className="flex items-center justify-between border-b border-[#e2e2e2] pb-2 mb-2 px-1">
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-[#747878] font-semibold mr-0.5">조건:</span>
                      <button
                        onClick={() => setTagFilterMode('OR')}
                        className={`text-[11px] px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                          tagFilterMode === 'OR'
                            ? 'bg-[#000000] text-white font-bold'
                            : 'text-[#444748] bg-[#f3f3f4] hover:bg-[#e2e2e2]'
                        }`}
                        title="선택한 태그 중 하나라도 포함된 사진 표시"
                      >
                        OR
                      </button>
                      <button
                        onClick={() => setTagFilterMode('AND')}
                        className={`text-[11px] px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                          tagFilterMode === 'AND'
                            ? 'bg-[#000000] text-white font-bold'
                            : 'text-[#444748] bg-[#f3f3f4] hover:bg-[#e2e2e2]'
                        }`}
                        title="선택한 태그를 모두 포함한 사진만 표시"
                      >
                        AND
                      </button>
                    </div>

                    {selectedTagFilters.length > 0 && (
                      <button
                        onClick={clearTagFilters}
                        className="text-[10px] text-rose-600 hover:underline font-semibold cursor-pointer"
                      >
                        선택 해제
                      </button>
                    )}
                  </div>

                  {/* Sort Controls */}
                  <div className="flex items-center justify-between border-b border-[#e2e2e2] pb-2 mb-2 px-1">
                    <span className="text-[10px] text-[#747878] font-medium">정렬:</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setTagSortBy('count')}
                        className={`text-[10px] px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                          tagSortBy === 'count'
                            ? 'bg-[#000000] text-white font-medium'
                            : 'text-[#444748] hover:bg-[#e2e2e2]'
                        }`}
                      >
                        사진 많은 순
                      </button>
                      <button
                        onClick={() => setTagSortBy('name')}
                        className={`text-[10px] px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                          tagSortBy === 'name'
                            ? 'bg-[#000000] text-white font-medium'
                            : 'text-[#444748] hover:bg-[#e2e2e2]'
                        }`}
                      >
                        가나다순
                      </button>
                    </div>
                  </div>

                  {/* Selected Tags Pills inside Dropdown if any */}
                  {selectedTagFilters.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1 mb-2 px-1 pb-2 border-b border-[#e2e2e2]">
                      {selectedTagFilters.map((st) => (
                        <span
                          key={st}
                          className="inline-flex items-center gap-1 bg-[#000000] text-white text-[10px] px-2 py-0.5 rounded-full font-medium"
                        >
                          #{normalizeTag(st)}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleTagFilter(st);
                            }}
                            className="hover:text-rose-300 ml-0.5 cursor-pointer font-bold"
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Tag List */}
                  <div className="max-h-52 overflow-y-auto space-y-1 pr-0.5 custom-scrollbar">
                    {dropdownFilteredTags.length === 0 ? (
                      <div className="py-6 text-center text-xs text-[#747878]">
                        검색 결과가 없습니다.
                      </div>
                    ) : (
                      dropdownFilteredTags.map((tagName) => {
                        const isSelected = selectedTagFilters.some((t) => normalizeTag(t) === normalizeTag(tagName));
                        const count = tagCounts[tagName] || 0;
                        const displayName = tagName.startsWith('#') ? tagName : `#${tagName}`;
                        return (
                          <button
                            key={tagName}
                            onClick={() => {
                              toggleTagFilter(tagName);
                            }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-[#000000] text-white font-semibold'
                                : 'text-[#1a1c1c] hover:bg-[#f3f3f4]'
                            }`}
                          >
                            <span className="truncate pr-2">{displayName}</span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span
                                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                                  isSelected ? 'bg-white/20 text-white' : 'bg-[#e2e2e2] text-[#444748]'
                                }`}
                              >
                                {count}장
                              </span>
                              {isSelected ? (
                                <span className="material-symbols-outlined text-sm text-white">check_box</span>
                              ) : (
                                <span className="material-symbols-outlined text-sm text-[#a0a0a0]">check_box_outline_blank</span>
                              )}
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Selected Tag Active Filter Status Banner */}
          {selectedTagFilters.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 bg-white border border-[#e2e2e2] px-3.5 py-2.5 rounded-xl text-xs shadow-2xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-[#000000]">선택한 태그 ({selectedTagFilters.length}개):</span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {selectedTagFilters.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 bg-[#f3f3f4] text-[#000000] border border-[#c4c7c7]/50 px-2.5 py-0.5 rounded-full text-[11px] font-medium"
                    >
                      #{normalizeTag(tag)}
                      <button
                        onClick={() => toggleTagFilter(tag)}
                        className="text-[#747878] hover:text-[#000000] font-bold cursor-pointer"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-1 ml-1">
                  <span className="text-[11px] text-[#747878]">조합:</span>
                  <button
                    onClick={() => setTagFilterMode('OR')}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                      tagFilterMode === 'OR'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-[#f3f3f4] text-[#555] hover:bg-[#e2e2e2]'
                    }`}
                  >
                    OR (하나라도)
                  </button>
                  <button
                    onClick={() => setTagFilterMode('AND')}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                      tagFilterMode === 'AND'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-[#f3f3f4] text-[#555] hover:bg-[#e2e2e2]'
                    }`}
                  >
                    AND (모두)
                  </button>
                </div>
              </div>
              <button
                onClick={clearTagFilters}
                className="text-[11px] text-rose-600 font-semibold hover:underline cursor-pointer shrink-0"
              >
                필터 초기화
              </button>
            </div>
          )}

          {/* Sorting Option Buttons (Placed right below tag bar on the right) */}
          <div className="flex items-center justify-end gap-1.5 mt-3">
            <button
              onClick={() => setPhotoSortOrder('date')}
              className={`text-xs px-3 py-1.5 rounded-lg transition-all cursor-pointer font-medium flex items-center gap-1 ${
                photoSortOrder === 'date'
                  ? 'bg-[#000000] text-white shadow-xs font-semibold'
                  : 'bg-[#f5f5f5] text-[#555555] hover:bg-[#eaeaea] hover:text-[#000000]'
              }`}
            >
              <span>날짜순</span>
            </button>
            <button
              onClick={() => setPhotoSortOrder('popular')}
              className={`text-xs px-3 py-1.5 rounded-lg transition-all cursor-pointer font-medium flex items-center gap-1 ${
                photoSortOrder === 'popular'
                  ? 'bg-[#000000] text-white shadow-xs font-semibold'
                  : 'bg-[#f5f5f5] text-[#555555] hover:bg-[#eaeaea] hover:text-[#000000]'
              }`}
            >
              <span>인기순</span>
            </button>
          </div>

          {searchQuery && (
            <div className="mt-4 text-xs text-[#747878] flex items-center gap-2">
              <span>Search results for: &ldquo;<strong className="text-[#000000]">{searchQuery}</strong>&rdquo;</span>
              <span className="bg-[#dcdddd] text-[#1a1c1c] px-2 py-0.5 rounded-full font-medium">
                {filteredPhotos.length} items
              </span>
            </div>
          )}
        </div>

        {/* Masonry / Responsive Grid */}
        {filteredPhotos.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border border-[#c4c7c7]/30 max-w-md mx-auto my-12 ambient-shadow">
            <span className="material-symbols-outlined text-4xl text-[#747878] mb-3">photo_library</span>
            <h3 className="font-serif text-xl font-semibold text-[#000000] mb-2">No photos found</h3>
            <p className="text-xs text-[#444748] mb-6">
              Try resetting your search or filters, or upload a new photo to this collection.
            </p>
            <button
              onClick={() => {
                onSelectCategory(null);
                clearTagFilters();
              }}
              className="px-4 py-2 bg-[#000000] text-white text-xs font-medium rounded-lg hover:bg-opacity-90 cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <>
            <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6">
              {visiblePhotos.map((photo) => (
                <div
                  key={photo.id}
                  onClick={() => {
                    let label = '';
                    if (selectedTagFilters.length > 0) {
                      const tagsStr = selectedTagFilters.map((t) => `#${normalizeTag(t)}`).join(', ');
                      label = `태그(${tagFilterMode}): ${tagsStr}`;
                    } else if (selectedCategoryId) {
                      label = `카테고리: ${activeCategory?.name || ''}`;
                    } else if (searchQuery.trim()) {
                      label = `검색: "${searchQuery}"`;
                    }
                    onViewPhoto(photo, sortedPhotos, label || undefined);
                  }}
                  className="masonry-item relative group rounded-xl overflow-hidden bg-white shadow-xs hover:shadow-md transition-all cursor-pointer border border-[#c4c7c7]/20"
                >
                  <img
                    src={photo.url}
                    alt={photo.title}
                    className="w-full h-auto object-cover block transition-transform duration-500 group-hover:scale-102"
                  />

                  {/* Featured Badge (Subtle Glassmorphism Star) */}
                  {photo.featured && (
                    <div
                      className="absolute top-3 left-3 w-7 h-7 rounded-full bg-white/40 backdrop-blur-md border border-white/60 shadow-xs flex items-center justify-center z-10 transition-transform duration-200 group-hover:scale-105"
                      title="관리자 추천작"
                    >
                      <span className="material-symbols-outlined text-[15px] leading-none text-[#2d2f31]/80 select-none">
                        star
                      </span>
                    </div>
                  )}

                  {/* Hover Action Icons (Top Right) */}
                  <div
                    className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => onEditPhoto(photo)}
                      title="Edit Photo"
                      className="bg-white/90 text-[#1a1c1c] p-2 rounded-full hover:bg-white hover:text-[#000000] backdrop-blur-xs shadow-xs transition-colors flex items-center justify-center cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                    </button>
                    <button
                      onClick={() => onDeletePhoto(photo)}
                      title="Delete Photo"
                      className="bg-white/90 text-[#ba1a1a] p-2 rounded-full hover:bg-[#ffdad6] hover:text-[#93000a] backdrop-blur-xs shadow-xs transition-colors flex items-center justify-center cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>

                  {/* Scrim & Metadata (Bottom) */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                    <h3 className="font-sans font-semibold text-base text-white drop-shadow-md">
                      {photo.title}
                    </h3>
                    <p className="font-sans text-xs text-white/80 mt-1 line-clamp-2">
                      {photo.description}
                    </p>
                    <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                      {photo.tags.slice(0, 3).map((t, idx) => (
                        <span
                          key={idx}
                          className="bg-white/20 text-white font-sans text-[10px] px-2 py-0.5 rounded-full backdrop-blur-md"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Load More Button Section */}
            {hasMore && (
              <div className="mt-12 flex flex-col items-center justify-center gap-3">
                <button
                  onClick={() => setVisibleCount((prev) => prev + PAGE_INCREMENT)}
                  className="px-8 py-3 bg-[#000000] text-white text-sm font-medium rounded-full hover:bg-neutral-800 transition-all shadow-sm cursor-pointer flex items-center gap-2 group"
                >
                  <span>사진 더 보기</span>
                  <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full group-hover:bg-white/30 transition-colors">
                    +{remainingCount}장
                  </span>
                  <span className="material-symbols-outlined text-lg group-hover:translate-y-0.5 transition-transform">
                    expand_more
                  </span>
                </button>
                <p className="text-xs text-[#747878]">
                  전체 {filteredPhotos.length}장 중 {visibleCount}장 표시 중
                </p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};
