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
  onToggleExhibitionPick?: (photo: Photo) => void;
  onClearAllExhibitionPicks?: () => void;
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
  onToggleExhibitionPick,
  onClearAllExhibitionPicks,
  onViewAllTags,
  isAdmin = false,
}) => {
  const [selectedTagFilters, setSelectedTagFilters] = useState<string[]>([]);
  const [onlyFeatured, setOnlyFeatured] = useState<boolean>(false);
  const [onlyExhibitionPick, setOnlyExhibitionPick] = useState<boolean>(false);
  const [tagFilterMode, setTagFilterMode] = useState<'OR' | 'AND'>('OR');
  const [photoSortOrder, setPhotoSortOrder] = useState<'date' | 'popular'>('date');
  const [visibleCount, setVisibleCount] = useState<number>(INITIAL_VISIBLE_COUNT);

  // Ensure admin-only filter is turned off if admin logs out
  useEffect(() => {
    if (!isAdmin && onlyExhibitionPick) {
      setOnlyExhibitionPick(false);
    }
  }, [isAdmin, onlyExhibitionPick]);
  
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

  const clearAllFilters = () => {
    setSelectedTagFilters([]);
    setOnlyFeatured(false);
    setOnlyExhibitionPick(false);
  };

  // Close dropdown on click outside and Escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsTagDropdownOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsTagDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    if (isTagDropdownOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isTagDropdownOpen]);

  // Reset pagination when filter/category/search changes
  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE_COUNT);
  }, [selectedCategoryId, selectedTagFilters, tagFilterMode, searchQuery, onlyFeatured, onlyExhibitionPick]);

  // Active Category details
  const activeCategory = categories.find((c) => c.id === selectedCategoryId);
  const categoryTitle = activeCategory ? `${activeCategory.name} Collection` : 'All Collections';
  const categoryDesc = activeCategory?.description || 'A curated gallery of fine photography studies. Explore landscapes, portraits, architecture, and everyday street moments.';

  // Photos in current category scope
  const baseCategoryPhotos = useMemo(() => {
    if (!selectedCategoryId) return photos;
    return photos.filter((p) => {
      const matchId = p.categoryId === selectedCategoryId;
      const matchCatName = activeCategory && p.category?.toLowerCase() === activeCategory.name.toLowerCase();
      const matchRawCategory = p.category === selectedCategoryId;
      return matchId || matchCatName || matchRawCategory;
    });
  }, [photos, selectedCategoryId, activeCategory]);

  // Featured photos count in current category scope
  const featuredPhotosCount = useMemo(() => {
    return baseCategoryPhotos.filter((p) => p.featured).length;
  }, [baseCategoryPhotos]);

  // Exhibition Pick photos count in current category scope & total across gallery
  const exhibitionPickPhotosCount = useMemo(() => {
    return baseCategoryPhotos.filter((p) => p.exhibitionPick).length;
  }, [baseCategoryPhotos]);

  const totalExhibitionPickCount = useMemo(() => {
    return photos.filter((p) => p.exhibitionPick).length;
  }, [photos]);

  // Tag counts based on current category selection
  const tagCounts = useMemo(() => {
    const map: Record<string, number> = {};
    baseCategoryPhotos.forEach((p) => {
      (p.tags || []).forEach((t) => {
        map[t] = (map[t] || 0) + 1;
      });
    });
    return map;
  }, [baseCategoryPhotos]);

  // All unique tag names sorted
  const allTagNames = useMemo(() => {
    const set = new Set<string>();
    tags.forEach((t) => set.add(t.name));
    photos.forEach((p) => (p.tags || []).forEach((t) => set.add(t)));
    return Array.from(set);
  }, [tags, photos]);

  // Popular tags for quick access
  const popularTags = useMemo(() => {
    const sorted = [...allTagNames].sort((a, b) => (tagCounts[b] || 0) - (tagCounts[a] || 0));
    return sorted.filter((t) => (tagCounts[t] || 0) > 0).slice(0, 5);
  }, [allTagNames, tagCounts]);

  // Check if tag search input matches "추천" or "featured"
  const isFeaturedSearchMatch = useMemo(() => {
    if (!tagSearchInput.trim()) return true;
    const q = tagSearchInput.toLowerCase().trim();
    return '관리자 추천'.includes(q) || '추천'.includes(q) || 'featured'.includes(q) || 'star'.includes(q);
  }, [tagSearchInput]);

  // Check if tag search input matches "전시" or "깃발" or "후보"
  const isExhibitionPickSearchMatch = useMemo(() => {
    if (!tagSearchInput.trim()) return true;
    const q = tagSearchInput.toLowerCase().trim();
    return '전시 후보'.includes(q) || '전시'.includes(q) || '깃발'.includes(q) || 'flag'.includes(q) || 'pick'.includes(q);
  }, [tagSearchInput]);

  const activeFilterCount = selectedTagFilters.length + (onlyFeatured ? 1 : 0) + (isAdmin && onlyExhibitionPick ? 1 : 0);

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
      // Featured match (관리자 추천 필터)
      if (onlyFeatured && !photo.featured) {
        return false;
      }
      // Exhibition Pick match (관리자 전용 전시 후보 깃발 필터)
      if (isAdmin && onlyExhibitionPick && !photo.exhibitionPick) {
        return false;
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
  }, [photos, selectedCategoryId, activeCategory, onlyFeatured, isAdmin, onlyExhibitionPick, selectedTagFilters, tagFilterMode, searchQuery, categories]);

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
        const likesA = typeof a.likes === 'number' ? a.likes : 0;
        const likesB = typeof b.likes === 'number' ? b.likes : 0;
        if (likesA !== likesB) return likesB - likesA;
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
            <div className="flex flex-wrap items-center gap-4 sm:gap-5">
              {/* All Button */}
              <button
                onClick={clearAllFilters}
                className={`font-sans text-sm font-semibold cursor-pointer pb-2.5 -mb-3 transition-colors border-b-2 ${
                  selectedTagFilters.length === 0 && !onlyFeatured && !onlyExhibitionPick
                    ? 'text-[#000000] border-[#000000] font-bold'
                    : 'text-[#8e8e93] hover:text-[#000000] border-transparent'
                }`}
              >
                All {activeCategory ? activeCategory.name : 'Photos'}
              </button>

              {/* Admin Featured Quick Filter Tab - Simplified to (Star) (Count) */}
              <button
                onClick={() => setOnlyFeatured(!onlyFeatured)}
                className={`font-sans text-sm font-medium cursor-pointer pb-2.5 -mb-3 transition-all border-b-2 flex items-center gap-1 ${
                  onlyFeatured
                    ? 'text-amber-800 border-amber-500 font-bold'
                    : 'text-[#8e8e93] hover:text-amber-600 border-transparent'
                }`}
                title="관리자 추천 작품만 모아보기"
                aria-label="관리자 추천 작품만 모아보기"
              >
                <span className={`material-symbols-outlined text-[17px] leading-none ${onlyFeatured ? 'text-amber-500' : 'text-[#8e8e93]'}`}>
                  {onlyFeatured ? 'star' : 'star_outline'}
                </span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold transition-colors ${
                    onlyFeatured
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : 'bg-[#e5e5e5] text-[#666]'
                  }`}
                >
                  {featuredPhotosCount}
                </span>
              </button>

              {/* Admin-Only Exhibition Pick (Flag) Quick Filter Tab & Bulk Reset */}
              {isAdmin && (
                <div className="flex items-center gap-1.5 pb-2.5 -mb-3 border-b-2 transition-all border-transparent">
                  <button
                    onClick={() => setOnlyExhibitionPick(!onlyExhibitionPick)}
                    className={`font-sans text-sm font-medium cursor-pointer transition-all flex items-center gap-1 ${
                      onlyExhibitionPick
                        ? 'text-emerald-800 font-bold'
                        : 'text-[#8e8e93] hover:text-emerald-700'
                    }`}
                    title="전시 후보(깃발 표시) 작품만 모아보기 (관리자 전용)"
                    aria-label="전시 후보 작품만 모아보기"
                  >
                    <span
                      style={{ fontVariationSettings: onlyExhibitionPick ? "'FILL' 1" : "'FILL' 0" }}
                      className={`material-symbols-outlined text-[17px] leading-none ${
                        onlyExhibitionPick ? 'text-emerald-600' : 'text-[#8e8e93]'
                      }`}
                    >
                      flag
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold transition-colors ${
                        onlyExhibitionPick
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          : 'bg-[#e5e5e5] text-[#666]'
                      }`}
                    >
                      {exhibitionPickPhotosCount}
                    </span>
                  </button>

                  {totalExhibitionPickCount > 0 && onClearAllExhibitionPicks && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onClearAllExhibitionPicks();
                        setOnlyExhibitionPick(false);
                      }}
                      title={`선택된 전시 후보(${totalExhibitionPickCount}장) 깃발 표시를 한꺼번에 모두 해제합니다`}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 hover:bg-rose-50 text-emerald-800 hover:text-rose-700 border border-emerald-200 hover:border-rose-300 font-semibold transition-colors cursor-pointer flex items-center gap-0.5"
                    >
                      <span>깃발 해제</span>
                      <span className="text-[9px] opacity-75">✕</span>
                    </button>
                  )}
                </div>
              )}

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
                  isTagDropdownOpen || activeFilterCount > 0
                    ? 'bg-[#1a1c1c] text-white shadow-xs'
                    : 'bg-[#f5f5f5] hover:bg-[#eaeaea] text-[#2c2c2e]'
                }`}
                title="태그 검색, 추천작 필터 및 조건 설정"
              >
                <span className="material-symbols-outlined text-sm">tune</span>
                <span>태그 검색 / 더보기</span>
                {activeFilterCount > 0 && (
                  <span className="bg-white text-black text-[10px] font-extrabold px-1.5 py-0.2 rounded-full">
                    {activeFilterCount}
                  </span>
                )}
                <span className="material-symbols-outlined text-sm">
                  {isTagDropdownOpen ? 'expand_less' : 'expand_more'}
                </span>
              </button>

              {/* Dropdown Popover */}
              {isTagDropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-[#c4c7c7]/50 p-3.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  {/* Search Header */}
                  <div className="relative mb-2.5">
                    <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-[#747878]">
                      search
                    </span>
                    <input
                      type="text"
                      value={tagSearchInput}
                      onChange={(e) => setTagSearchInput(e.target.value)}
                      placeholder="태그 검색 (예: Nature, 추천...)"
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

                  {/* Special Filter: Featured (관리자 추천) Quick Toggle Card */}
                  {isFeaturedSearchMatch && (
                    <div
                      onClick={() => setOnlyFeatured(!onlyFeatured)}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between mb-2 select-none ${
                        onlyFeatured
                          ? 'bg-amber-500/10 border-amber-500/40 text-amber-950 shadow-2xs'
                          : 'bg-[#f7f7f8] hover:bg-[#efefef] border-[#e2e2e2] text-[#1a1c1c]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          onlyFeatured ? 'bg-amber-500 text-white' : 'bg-amber-100 text-amber-700'
                        }`}>
                          <span className="material-symbols-outlined text-[16px]">star</span>
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-[#1a1c1c] truncate">관리자 추천작만 모아보기</span>
                            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold shrink-0 ${
                              onlyFeatured ? 'bg-amber-200/80 text-amber-900' : 'bg-[#e2e2e2] text-[#555]'
                            }`}>
                              {featuredPhotosCount}장
                            </span>
                          </div>
                          <p className="text-[10px] text-[#747878] leading-tight truncate">
                            관리자가 엄선한 대표 사진만 필터링합니다
                          </p>
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center border shrink-0 ml-2 transition-all ${
                        onlyFeatured ? 'bg-amber-500 border-amber-500 text-white' : 'border-[#c4c7c7] bg-white'
                      }`}>
                        {onlyFeatured && <span className="material-symbols-outlined text-sm font-bold">check</span>}
                      </div>
                    </div>
                  )}

                  {/* Admin-Only Special Filter: Exhibition Pick (전시 후보 깃발) Quick Toggle Card */}
                  {isAdmin && isExhibitionPickSearchMatch && (
                    <div
                      onClick={() => setOnlyExhibitionPick(!onlyExhibitionPick)}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between mb-2.5 select-none ${
                        onlyExhibitionPick
                          ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-950 shadow-2xs'
                          : 'bg-[#f7f7f8] hover:bg-[#efefef] border-[#e2e2e2] text-[#1a1c1c]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          onlyExhibitionPick ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          <span
                            style={{ fontVariationSettings: "'FILL' 1" }}
                            className="material-symbols-outlined text-[16px]"
                          >
                            flag
                          </span>
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-[#1a1c1c] truncate">전시 후보(깃발) 작품만 보기</span>
                            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold shrink-0 ${
                              onlyExhibitionPick ? 'bg-emerald-200/80 text-emerald-900' : 'bg-[#e2e2e2] text-[#555]'
                            }`}>
                              {exhibitionPickPhotosCount}장
                            </span>
                          </div>
                          <p className="text-[10px] text-[#747878] leading-tight truncate">
                            전시 기획용으로 깃발 표시한 후보 사진만 필터링
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        {totalExhibitionPickCount > 0 && onClearAllExhibitionPicks && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onClearAllExhibitionPicks();
                              setOnlyExhibitionPick(false);
                            }}
                            title="선택된 전시 후보 깃발을 모두 해제"
                            className="text-[10px] px-2 py-1 rounded-md bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 font-semibold transition-colors cursor-pointer"
                          >
                            전체 해제
                          </button>
                        )}
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                          onlyExhibitionPick ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-[#c4c7c7] bg-white'
                        }`}>
                          {onlyExhibitionPick && <span className="material-symbols-outlined text-sm font-bold">check</span>}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Popular Tags Quick Discovery (when not actively searching) */}
                  {!tagSearchInput && popularTags.length > 0 && (
                    <div className="mb-2.5 px-0.5">
                      <span className="text-[10px] text-[#747878] font-semibold block mb-1">인기 태그:</span>
                      <div className="flex flex-wrap gap-1">
                        {popularTags.map((tag) => {
                          const isSelected = selectedTagFilters.some((t) => normalizeTag(t) === normalizeTag(tag));
                          return (
                            <button
                              key={tag}
                              onClick={() => toggleTagFilter(tag)}
                              className={`text-[10px] px-2 py-0.5 rounded-full transition-all cursor-pointer flex items-center gap-1 ${
                                isSelected
                                  ? 'bg-[#000000] text-white font-medium shadow-2xs'
                                  : 'bg-[#f0f0f2] hover:bg-[#e2e2e4] text-[#333]'
                              }`}
                            >
                              <span>#{normalizeTag(tag)}</span>
                              <span className="opacity-60 text-[9px]">{tagCounts[tag] || 0}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Filter Mode & Reset Controls */}
                  <div className="flex items-center justify-between border-t border-b border-[#e2e2e2] py-2 mb-2 px-1">
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-[#747878] font-semibold mr-0.5">태그 조건:</span>
                      <button
                        onClick={() => setTagFilterMode('OR')}
                        className={`text-[11px] px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                          tagFilterMode === 'OR'
                            ? 'bg-[#000000] text-white font-bold'
                            : 'text-[#444748] bg-[#f3f3f4] hover:bg-[#e2e2e2]'
                        }`}
                        title="선택한 태그 중 하나라도 포함된 사진 표시"
                      >
                        OR (하나라도)
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
                        AND (모두 포함)
                      </button>
                    </div>

                    {activeFilterCount > 0 && (
                      <button
                        onClick={clearAllFilters}
                        className="text-[10px] text-rose-600 hover:underline font-semibold cursor-pointer"
                      >
                        전체 초기화
                      </button>
                    )}
                  </div>

                  {/* Sort Controls */}
                  <div className="flex items-center justify-between border-b border-[#e2e2e2] pb-2 mb-2 px-1">
                    <span className="text-[10px] text-[#747878] font-medium">태그 정렬:</span>
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

                  {/* Selected Filters (Tags + Featured) Summary inside Popover */}
                  {activeFilterCount > 0 && (
                    <div className="flex flex-wrap items-center gap-1 mb-2 px-1 pb-2 border-b border-[#e2e2e2]">
                      {onlyFeatured && (
                        <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-900 border border-amber-300 text-[10px] px-2 py-0.5 rounded-full font-semibold">
                          <span className="material-symbols-outlined text-[11px] text-amber-500">star</span>
                          추천작
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOnlyFeatured(false);
                            }}
                            className="hover:text-rose-600 ml-0.5 cursor-pointer font-bold"
                          >
                            ✕
                          </button>
                        </span>
                      )}
                      {isAdmin && onlyExhibitionPick && (
                        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-900 border border-emerald-300 text-[10px] px-2 py-0.5 rounded-full font-semibold">
                          <span
                            style={{ fontVariationSettings: "'FILL' 1" }}
                            className="material-symbols-outlined text-[11px] text-emerald-600"
                          >
                            flag
                          </span>
                          전시 후보
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOnlyExhibitionPick(false);
                            }}
                            className="hover:text-rose-600 ml-0.5 cursor-pointer font-bold"
                          >
                            ✕
                          </button>
                        </span>
                      )}
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
                        {tagSearchInput ? '일치하는 태그가 없습니다.' : '등록된 추가 태그가 없습니다.'}
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

          {/* Selected Filters Active Status Banner (Tags + Featured) */}
          {activeFilterCount > 0 && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 bg-white border border-[#e2e2e2] px-3.5 py-2.5 rounded-xl text-xs shadow-2xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-[#000000]">적용된 필터 ({activeFilterCount}개):</span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {onlyFeatured && (
                    <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-900 border border-amber-300 px-2.5 py-0.5 rounded-full text-[11px] font-semibold">
                      <span className="material-symbols-outlined text-[13px] text-amber-500">star</span>
                      관리자 추천
                      <button
                        onClick={() => setOnlyFeatured(false)}
                        className="text-amber-700 hover:text-amber-950 font-bold cursor-pointer ml-0.5"
                        title="추천 필터 해제"
                      >
                        ✕
                      </button>
                    </span>
                  )}
                  {isAdmin && onlyExhibitionPick && (
                    <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-900 border border-emerald-300 px-2.5 py-0.5 rounded-full text-[11px] font-semibold">
                      <span
                        style={{ fontVariationSettings: "'FILL' 1" }}
                        className="material-symbols-outlined text-[13px] text-emerald-600"
                      >
                        flag
                      </span>
                      전시 후보 (깃발)
                      <button
                        onClick={() => setOnlyExhibitionPick(false)}
                        className="text-emerald-700 hover:text-emerald-950 font-bold cursor-pointer ml-0.5"
                        title="전시 후보 필터 해제"
                      >
                        ✕
                      </button>
                    </span>
                  )}
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
                {selectedTagFilters.length > 1 && (
                  <div className="flex items-center gap-1 ml-1">
                    <span className="text-[11px] text-[#747878]">태그 조합:</span>
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
                )}
              </div>
              <button
                onClick={clearAllFilters}
                className="text-[11px] text-rose-600 font-semibold hover:underline cursor-pointer shrink-0"
              >
                필터 전체 초기화
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
            <h3 className="font-serif text-xl font-semibold text-[#000000] mb-2">
              {onlyFeatured ? '관리자 추천 작품이 없습니다' : '조건에 맞는 사진이 없습니다'}
            </h3>
            <p className="text-xs text-[#444748] mb-6">
              {onlyFeatured
                ? '현재 카테고리 또는 선택한 태그 조건에 해당하는 관리자 추천작이 없습니다.'
                : '검색어나 필터 조건을 변경하거나 초기화해 보세요.'}
            </p>
            <div className="flex items-center justify-center gap-2">
              {onlyFeatured && (
                <button
                  onClick={() => setOnlyFeatured(false)}
                  className="px-4 py-2 bg-amber-500 text-white text-xs font-medium rounded-lg hover:bg-amber-600 cursor-pointer"
                >
                  추천 필터 해제
                </button>
              )}
              <button
                onClick={() => {
                  onSelectCategory(null);
                  clearAllFilters();
                }}
                className="px-4 py-2 bg-[#000000] text-white text-xs font-medium rounded-lg hover:bg-opacity-90 cursor-pointer"
              >
                모든 필터 초기화
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6">
              {visiblePhotos.map((photo) => (
                <div
                  key={photo.id}
                  onClick={() => {
                    let label = '';
                    const parts: string[] = [];
                    if (onlyFeatured) {
                      parts.push('⭐ 관리자 추천');
                    }
                    if (isAdmin && onlyExhibitionPick) {
                      parts.push('🚩 전시 후보');
                    }
                    if (selectedTagFilters.length > 0) {
                      const tagsStr = selectedTagFilters.map((t) => `#${normalizeTag(t)}`).join(', ');
                      parts.push(`태그(${tagFilterMode}): ${tagsStr}`);
                    }
                    if (selectedCategoryId) {
                      parts.push(`카테고리: ${activeCategory?.name || ''}`);
                    }
                    if (searchQuery.trim()) {
                      parts.push(`검색: "${searchQuery}"`);
                    }
                    label = parts.join(' • ');
                    onViewPhoto(photo, sortedPhotos, label || undefined);
                  }}
                  className="masonry-item relative group rounded-xl overflow-hidden bg-white shadow-xs hover:shadow-md transition-all cursor-pointer border border-[#c4c7c7]/20"
                >
                  <img
                    src={photo.url}
                    alt={photo.title}
                    className="w-full h-auto object-cover block transition-transform duration-500 group-hover:scale-102"
                  />

                  {/* Top-Left Badges (Featured Star & Admin-Only Exhibition Pick Flag) */}
                  {(photo.featured || (isAdmin && photo.exhibitionPick)) && (
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
                      {photo.featured && (
                        <div
                          className="w-7 h-7 rounded-full bg-white/40 backdrop-blur-md border border-white/60 shadow-xs flex items-center justify-center transition-transform duration-200 group-hover:scale-105"
                          title="관리자 추천작"
                        >
                          <span className="material-symbols-outlined text-[15px] leading-none text-[#2d2f31]/80 select-none">
                            star
                          </span>
                        </div>
                      )}
                      {isAdmin && photo.exhibitionPick && (
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleExhibitionPick?.(photo);
                          }}
                          className="w-7 h-7 rounded-full bg-emerald-600/90 hover:bg-emerald-700 text-white backdrop-blur-md border border-emerald-300/60 shadow-sm flex items-center justify-center transition-transform duration-200 hover:scale-110 cursor-pointer"
                          title="전시 후보 작품 (클릭 시 깃발 해제)"
                        >
                          <span
                            style={{ fontVariationSettings: "'FILL' 1" }}
                            className="material-symbols-outlined text-[15px] leading-none select-none"
                          >
                            flag
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Hover Action Icons (Top Right) */}
                  <div
                    className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {isAdmin && onToggleExhibitionPick && (
                      <button
                        onClick={() => onToggleExhibitionPick(photo)}
                        title={photo.exhibitionPick ? '전시 후보(깃발) 해제' : '전시 후보(깃발)로 선택'}
                        className={`p-2 rounded-full backdrop-blur-xs shadow-xs transition-all flex items-center justify-center cursor-pointer ${
                          photo.exhibitionPick
                            ? 'bg-emerald-600 text-white hover:bg-emerald-700 ring-2 ring-emerald-300/70'
                            : 'bg-white/90 text-[#1a1c1c] hover:bg-emerald-50 hover:text-emerald-700'
                        }`}
                      >
                        <span
                          style={{ fontVariationSettings: photo.exhibitionPick ? "'FILL' 1" : "'FILL' 0" }}
                          className="material-symbols-outlined text-[18px]"
                        >
                          flag
                        </span>
                      </button>
                    )}
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
