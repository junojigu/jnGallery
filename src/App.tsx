import { useState, useEffect } from 'react';
import { Category, Tag, Photo, ActiveView, HomeSettings, ExhibitionInfo, Exhibition } from './types';
import { INITIAL_CATEGORIES, INITIAL_TAGS, INITIAL_PHOTOS, INITIAL_HOME_SETTINGS, INITIAL_EXHIBITION_INFO, INITIAL_EXHIBITIONS } from './initialData';

import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { UploadModal } from './components/UploadModal';
import { DeleteModal } from './components/DeleteModal';
import { EditModal } from './components/EditModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { HomeEditModal } from './components/HomeEditModal';
import { ExhibitionEditModal } from './components/ExhibitionEditModal';
import { ChangePasswordModal } from './components/ChangePasswordModal';

import { HomeView } from './views/HomeView';
import { GalleryView } from './views/GalleryView';
import { CategoriesView } from './views/CategoriesView';
import { PhotoDetailView } from './views/PhotoDetailView';
import { ExhibitionView } from './views/ExhibitionView';

// Helper to ensure all photos have valid categoryId, category name, and tags array
function normalizePhotoList(rawPhotos: any[], currentCategories: Category[]): Photo[] {
  if (!Array.isArray(rawPhotos)) return [];

  const seenIds = new Set<string>();
  const seenUrls = new Set<string>();
  const deduplicated: Photo[] = [];

  for (const p of rawPhotos) {
    if (!p || typeof p !== 'object') continue;

    const photoId = p.id ? String(p.id).trim() : `photo-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const photoUrl = p.url ? String(p.url).trim() : '';

    // Prevent duplicate entries by ID or exact URL
    if (seenIds.has(photoId)) continue;
    if (photoUrl && seenUrls.has(photoUrl)) continue;

    seenIds.add(photoId);
    if (photoUrl) seenUrls.add(photoUrl);

    const rawCat = (p.categoryId || p.category || p.category_id || '').toString().trim();
    
    let matchedCat = currentCategories.find(
      (c) => c.id === rawCat ||
             c.name.toLowerCase() === rawCat.toLowerCase() ||
             c.id.toLowerCase() === rawCat.toLowerCase()
    );

    if (!matchedCat && rawCat) {
      matchedCat = currentCategories.find(
        (c) => c.name.toLowerCase().includes(rawCat.toLowerCase()) || rawCat.toLowerCase().includes(c.name.toLowerCase())
      );
    }

    if (!matchedCat) {
      const initialMatch = INITIAL_PHOTOS.find((ip) => ip.id === p.id);
      if (initialMatch) {
        matchedCat = currentCategories.find((c) => c.id === initialMatch.categoryId);
      }
    }

    const catId = matchedCat ? matchedCat.id : (INITIAL_PHOTOS.find((ip) => ip.id === p.id)?.categoryId || currentCategories[0]?.id || 'cat-nature');
    const catName = currentCategories.find((c) => c.id === catId)?.name || 'Nature';

    // Parse and normalize tags
    let extractedTags: string[] = [];
    if (Array.isArray(p.tags)) {
      extractedTags = p.tags.map((t: any) => String(t).trim()).filter(Boolean);
    } else if (typeof p.tags === 'string' && p.tags.trim()) {
      const tagStr = p.tags.trim();
      if (tagStr.startsWith('[') && tagStr.endsWith(']')) {
        try {
          const parsed = JSON.parse(tagStr);
          if (Array.isArray(parsed)) {
            extractedTags = parsed.map((t: any) => String(t).trim()).filter(Boolean);
          }
        } catch {
          // ignore
        }
      }
      if (extractedTags.length === 0) {
        extractedTags = tagStr.split(/[\s,]+/).filter(Boolean);
      }
    }

    const normalizedTags = Array.from(
      new Set(
        extractedTags
          .map((t) => (t.startsWith('#') ? t : `#${t}`))
          .map((t) => (t.toLowerCase() === '#minimalist' ? '#sea' : t))
          .filter((t) => t.length > 1)
      )
    );

    // Normalize featured boolean
    let isFeatured = false;
    if (p.featured !== undefined && p.featured !== null) {
      isFeatured = p.featured === true || p.featured === 'true' || p.featured === 'TRUE' || p.featured === 1 || p.featured === '1';
    } else {
      const initialMatch = INITIAL_PHOTOS.find((ip) => ip.id === photoId);
      if (initialMatch && initialMatch.featured) {
        isFeatured = true;
      } else {
        try {
          const savedStr = localStorage.getItem('pm_photos');
          if (savedStr) {
            const savedList = JSON.parse(savedStr);
            const match = savedList.find((sp: any) => sp.id === photoId || (sp.url && photoUrl && sp.url === photoUrl));
            if (match && match.featured) {
              isFeatured = true;
            }
          }
        } catch {
          // ignore
        }
      }
    }

    deduplicated.push({
      ...p,
      id: photoId,
      url: photoUrl,
      categoryId: catId,
      category: catName,
      tags: normalizedTags.length > 0 ? normalizedTags : ['#gallery'],
      featured: isFeatured,
    });
  }

  return deduplicated;
}

export default function App() {
  // Admin State
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    try {
      return localStorage.getItem('pm_is_admin') === 'true';
    } catch {
      return false;
    }
  });

  const [adminPassword, setAdminPassword] = useState<string>(() => {
    try {
      return localStorage.getItem('pm_admin_password') || 'admin';
    } catch {
      return 'admin';
    }
  });

  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [adminLoginMessage, setAdminLoginMessage] = useState<string | undefined>(undefined);

  // State with LocalStorage Persistence
  const [categories, setCategories] = useState<Category[]>(() => {
    try {
      const saved = localStorage.getItem('pm_categories');
      return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
    } catch {
      return INITIAL_CATEGORIES;
    }
  });

  const [tags, setTags] = useState<Tag[]>(() => {
    try {
      const saved = localStorage.getItem('pm_tags');
      const loaded: Tag[] = saved ? JSON.parse(saved) : INITIAL_TAGS;
      return loaded.map((t) => (t.name.toLowerCase() === '#minimalist' ? { ...t, name: '#sea' } : t));
    } catch {
      return INITIAL_TAGS;
    }
  });

  const [photos, setPhotos] = useState<Photo[]>(() => {
    try {
      const saved = localStorage.getItem('pm_photos');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return normalizePhotoList(parsed, INITIAL_CATEGORIES);
        }
      }
      return INITIAL_PHOTOS;
    } catch {
      return INITIAL_PHOTOS;
    }
  });

  const [homeSettings, setHomeSettings] = useState<HomeSettings>(() => {
    try {
      const saved = localStorage.getItem('pm_home_settings');
      return saved ? JSON.parse(saved) : INITIAL_HOME_SETTINGS;
    } catch {
      return INITIAL_HOME_SETTINGS;
    }
  });

  const [exhibitions, setExhibitions] = useState<Exhibition[]>(() => {
    try {
      const saved = localStorage.getItem('pm_exhibitions');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return INITIAL_EXHIBITIONS;
    } catch {
      return INITIAL_EXHIBITIONS;
    }
  });

  const [activeExhibitionId, setActiveExhibitionId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('pm_active_exhibition_id');
      return saved || INITIAL_EXHIBITIONS[0]?.id || 'exhibition-1';
    } catch {
      return INITIAL_EXHIBITIONS[0]?.id || 'exhibition-1';
    }
  });

  const [exhibitionInfo, setExhibitionInfo] = useState<ExhibitionInfo>(() => {
    const found = exhibitions.find((e) => e.id === activeExhibitionId);
    return found || INITIAL_EXHIBITION_INFO;
  });

  const [isHomeEditOpen, setIsHomeEditOpen] = useState(false);
  const [isExhibitionEditOpen, setIsExhibitionEditOpen] = useState(false);

  const [activeView, setActiveView] = useState<ActiveView>('home');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activePhotoList, setActivePhotoList] = useState<Photo[] | null>(null);
  const [activeFilterLabel, setActiveFilterLabel] = useState<string | null>(null);

  // Modals state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    itemType: string;
    itemName: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    itemType: 'Item',
    itemName: '',
    onConfirm: () => {},
  });

  const [editTarget, setEditTarget] = useState<
    | { type: 'category'; data: Category }
    | { type: 'tag'; data: Tag }
    | { type: 'photo'; data: Photo }
    | null
  >(null);

  // Google Sheets Auto Sync Effect
  const [isSheetSyncing, setIsSheetSyncing] = useState(false);
  const [sheetSyncStatus, setSheetSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Load initial data from Google Sheets if Web App URL exists
  useEffect(() => {
    const sheetUrl = homeSettings.googleSheetAppUrl;
    if (!sheetUrl) return;

    let isMounted = true;
    const fetchSheetData = async () => {
      try {
        setIsSheetSyncing(true);
        const res = await fetch(sheetUrl, { method: 'GET', redirect: 'follow' });
        if (!res.ok) return;

        const data = await res.json();
        if (!isMounted) return;

        if (data && typeof data === 'object') {
          const loadedCategories = (Array.isArray(data.categories) && data.categories.length > 0)
            ? data.categories
            : categories;

          if (Array.isArray(data.categories) && data.categories.length > 0) {
            setCategories(data.categories);
            try { localStorage.setItem('pm_categories', JSON.stringify(data.categories)); } catch {}
          }
          if (Array.isArray(data.photos) && data.photos.length > 0) {
            const normalized = normalizePhotoList(data.photos, loadedCategories);
            setPhotos((prevPhotos) => {
              const featuredMap = new Map<string, boolean>();
              prevPhotos.forEach((p) => {
                if (p.featured) {
                  featuredMap.set(p.id, true);
                  if (p.url) featuredMap.set(p.url, true);
                }
              });
              const updated = normalized.map((p) => {
                const sheetItem = data.photos.find((sp: any) => sp.id === p.id);
                // If Google Sheets explicit boolean isn't present, check if local state had it featured
                if ((!sheetItem || sheetItem.featured === undefined || sheetItem.featured === null) &&
                    (featuredMap.get(p.id) || (p.url && featuredMap.get(p.url)))) {
                  return { ...p, featured: true };
                }
                return p;
              });
              try { localStorage.setItem('pm_photos', JSON.stringify(updated)); } catch {}
              return updated;
            });
          }
          if (Array.isArray(data.tags) && data.tags.length > 0) {
            const formattedTags = data.tags.map((t: Tag) => (t.name?.toLowerCase() === '#minimalist' ? { ...t, name: '#sea' } : t));
            setTags(formattedTags);
            try { localStorage.setItem('pm_tags', JSON.stringify(formattedTags)); } catch {}
          }
          if (data.homeSettings && typeof data.homeSettings === 'object') {
            setHomeSettings((prev) => {
              const updated = { ...prev, ...data.homeSettings };
              try { localStorage.setItem('pm_home_settings', JSON.stringify(updated)); } catch {}
              return updated;
            });
          }
          if (Array.isArray(data.exhibitions) && data.exhibitions.length > 0) {
            setExhibitions(data.exhibitions);
            try { localStorage.setItem('pm_exhibitions', JSON.stringify(data.exhibitions)); } catch {}
            if (data.activeExhibitionId) {
              setActiveExhibitionId(data.activeExhibitionId);
              try { localStorage.setItem('pm_active_exhibition_id', data.activeExhibitionId); } catch {}
            }
          } else if (data.exhibitionInfo && typeof data.exhibitionInfo === 'object') {
            setExhibitions((prev) => {
              const updated = prev.map((ex) => (ex.id === activeExhibitionId ? { ...ex, ...data.exhibitionInfo } : ex));
              try { localStorage.setItem('pm_exhibitions', JSON.stringify(updated)); } catch {}
              return updated;
            });
          }
          setSheetSyncStatus('success');
        }
      } catch (err) {
        console.log('Google Sheets initial fetch notice (using local data fallback):', err);
        if (isMounted) setSheetSyncStatus('error');
      } finally {
        if (isMounted) setIsSheetSyncing(false);
      }
    };

    fetchSheetData();
    return () => {
      isMounted = false;
    };
  }, [homeSettings.googleSheetAppUrl]);

  // Sync state to Google Sheets on changes
  const syncToGoogleSheet = async (payloadOverride?: any) => {
    const sheetUrl = homeSettings.googleSheetAppUrl;
    if (!sheetUrl) return;

    try {
      setIsSheetSyncing(true);

      const targetPhotos = payloadOverride?.photos || photos;
      const targetCategories = payloadOverride?.categories || categories;

      const photosForSync = targetPhotos.map((p: Photo) => ({
        ...p,
        category: targetCategories.find((c: Category) => c.id === p.categoryId)?.name || p.category || p.categoryId,
        categoryId: p.categoryId,
      }));

      const targetExhibitions = payloadOverride?.exhibitions || exhibitions;
      const targetActiveExId = payloadOverride?.activeExhibitionId || activeExhibitionId;
      const activeExInfo = targetExhibitions.find((e: Exhibition) => e.id === targetActiveExId) || targetExhibitions[0];

      const payload = {
        action: 'syncAll',
        categories: targetCategories,
        tags: payloadOverride?.tags || tags,
        homeSettings: payloadOverride?.homeSettings || homeSettings,
        exhibitions: targetExhibitions,
        activeExhibitionId: targetActiveExId,
        exhibitionInfo: payloadOverride?.exhibitionInfo || activeExInfo,
        updatedAt: new Date().toISOString(),
        ...payloadOverride,
        photos: photosForSync,
      };

      await fetch(sheetUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      setSheetSyncStatus('success');
    } catch (err) {
      console.error('Google Sheets sync error:', err);
      setSheetSyncStatus('error');
    } finally {
      setIsSheetSyncing(false);
    }
  };

  // Sync to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('pm_is_admin', isAdmin ? 'true' : 'false');
    } catch {
      // ignore
    }
  }, [isAdmin]);

  useEffect(() => {
    try {
      localStorage.setItem('pm_categories', JSON.stringify(categories));
    } catch {
      // ignore
    }
  }, [categories]);

  useEffect(() => {
    try {
      localStorage.setItem('pm_tags', JSON.stringify(tags));
    } catch {
      // ignore
    }
  }, [tags]);

  // Ensure all tags present in photos exist in global tags state
  useEffect(() => {
    if (!photos || photos.length === 0) return;

    let nextTags = [...tags];
    let hasChanges = false;

    photos.forEach((photo) => {
      (photo.tags || []).forEach((t) => {
        const formatted = t.startsWith('#') ? t.trim() : `#${t.trim()}`;
        if (formatted.length > 1) {
          const exists = nextTags.some(
            (gt) => gt.name.toLowerCase() === formatted.toLowerCase()
          );
          if (!exists) {
            nextTags.push({
              id: `tag-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              name: formatted,
            });
            hasChanges = true;
          }
        }
      });
    });

    if (hasChanges) {
      setTags(nextTags);
    }
  }, [photos]);

  useEffect(() => {
    try {
      localStorage.setItem('pm_photos', JSON.stringify(photos));
    } catch {
      // ignore
    }
  }, [photos]);

  useEffect(() => {
    try {
      localStorage.setItem('pm_home_settings', JSON.stringify(homeSettings));
    } catch {
      // ignore
    }
  }, [homeSettings]);

  useEffect(() => {
    try {
      localStorage.setItem('pm_exhibition_info', JSON.stringify(exhibitionInfo));
    } catch {
      // ignore
    }
  }, [exhibitionInfo]);

  useEffect(() => {
    try {
      localStorage.setItem('pm_exhibitions', JSON.stringify(exhibitions));
    } catch {
      // ignore
    }
  }, [exhibitions]);

  useEffect(() => {
    try {
      localStorage.setItem('pm_active_exhibition_id', activeExhibitionId);
    } catch {
      // ignore
    }
  }, [activeExhibitionId]);

  const handleSaveExhibition = (newExhibition: Exhibition) => {
    requireAdmin(() => {
      let updatedExhibitions: Exhibition[];
      const exists = exhibitions.some((e) => e.id === newExhibition.id);
      if (exists) {
        updatedExhibitions = exhibitions.map((e) => (e.id === newExhibition.id ? newExhibition : e));
      } else {
        updatedExhibitions = [...exhibitions, newExhibition];
      }
      setExhibitions(updatedExhibitions);

      syncToGoogleSheet({
        action: 'saveExhibition',
        exhibitions: updatedExhibitions,
        activeExhibitionId,
        exhibitionInfo: updatedExhibitions.find((e) => e.id === activeExhibitionId) || updatedExhibitions[0],
      });
    }, '전시 관리는 관리자 로그인 후 가능합니다.');
  };

  const handleDeleteExhibition = (exhibitionId: string) => {
    requireAdmin(() => {
      if (exhibitions.length <= 1) {
        alert('최소 하나의 전시는 남아있어야 합니다.');
        return;
      }
      const updated = exhibitions.filter((e) => e.id !== exhibitionId);
      setExhibitions(updated);
      let nextActiveId = activeExhibitionId;
      if (activeExhibitionId === exhibitionId) {
        nextActiveId = updated[0].id;
        setActiveExhibitionId(nextActiveId);
      }
      syncToGoogleSheet({
        action: 'deleteExhibition',
        exhibitions: updated,
        activeExhibitionId: nextActiveId,
        exhibitionInfo: updated.find((e) => e.id === nextActiveId) || updated[0],
      });
    }, '전시 삭제는 관리자 로그인 후 가능합니다.');
  };

  const handleSetActiveExhibition = (exhibitionId: string) => {
    requireAdmin(() => {
      setActiveExhibitionId(exhibitionId);
      const activeEx = exhibitions.find((e) => e.id === exhibitionId) || exhibitions[0];
      syncToGoogleSheet({
        action: 'setActiveExhibition',
        exhibitions,
        activeExhibitionId: exhibitionId,
        exhibitionInfo: activeEx,
      });
    }, '대표 전시 설정은 관리자 로그인 후 가능합니다.');
  };

  useEffect(() => {
    try {
      localStorage.setItem('pm_admin_password', adminPassword);
    } catch {
      // ignore
    }
  }, [adminPassword]);

  const handleChangePassword = (newPassword: string) => {
    setAdminPassword(newPassword);
  };

  const handleOpenHomeEdit = () => {
    requireAdmin(() => setIsHomeEditOpen(true), '랜딩 페이지 수정은 관리자 로그인 후 가능합니다.');
  };

  const handleSaveHomeSettings = (newSettings: HomeSettings) => {
    requireAdmin(() => {
      setHomeSettings(newSettings);
      syncToGoogleSheet({
        action: 'saveHomeSettings',
        homeSettings: newSettings,
        photos,
        categories,
        tags,
      });
    }, '랜딩 페이지 수정은 관리자 로그인 후 가능합니다.');
  };

  // Admin Guard Helper
  const requireAdmin = (action: () => void, message?: string) => {
    if (isAdmin) {
      action();
    } else {
      setAdminLoginMessage(message || '이 기능을 사용하려면 관리자 로그인이 필요합니다.');
      setIsAdminLoginOpen(true);
    }
  };

  const handleOpenAdminLogin = (msg?: string) => {
    setAdminLoginMessage(msg);
    setIsAdminLoginOpen(true);
  };

  const handleAdminLoginSuccess = () => {
    setIsAdmin(true);
  };

  const handleAdminLogout = () => {
    setIsAdmin(false);
    if (activeView === 'categories') {
      setActiveView('gallery');
    }
  };

  const handleOpenUploadClick = () => {
    requireAdmin(() => setIsUploadOpen(true), '사진 업로드는 관리자 로그인 후 이용 가능합니다.');
  };

  // Handlers for Categories
  const handleAddCategory = (name: string, icon = 'folder') => {
    requireAdmin(() => {
      const newCat: Category = {
        id: `cat-${Date.now()}`,
        name,
        icon,
        description: `Collection of ${name} photography.`
      };
      const nextCats = [...categories, newCat];
      setCategories(nextCats);
      syncToGoogleSheet({ categories: nextCats });
    }, '카테고리 추가는 관리자 전용 기능입니다.');
  };

  const handleSaveCategory = (updatedCat: Category) => {
    requireAdmin(() => {
      const nextCats = categories.map((c) => (c.id === updatedCat.id ? updatedCat : c));
      setCategories(nextCats);
      syncToGoogleSheet({ categories: nextCats });
    }, '카테고리 수정은 관리자 전용 기능입니다.');
  };

  const handleDeleteCategory = (cat: Category) => {
    requireAdmin(() => {
      setDeleteModal({
        isOpen: true,
        itemType: 'Category',
        itemName: cat.name,
        onConfirm: () => {
          const nextCats = categories.filter((c) => c.id !== cat.id);
          setCategories(nextCats);
          if (selectedCategoryId === cat.id) {
            setSelectedCategoryId(null);
          }
          setDeleteModal((m) => ({ ...m, isOpen: false }));
          syncToGoogleSheet({ categories: nextCats });
        }
      });
    }, '카테고리 삭제는 관리자 전용 기능입니다.');
  };

  const handleReorderCategories = (reorderedCats: Category[]) => {
    requireAdmin(() => {
      setCategories(reorderedCats);
      syncToGoogleSheet({ categories: reorderedCats });
    }, '카테고리 순서 변경은 관리자 전용 기능입니다.');
  };

  // Handlers for Tags
  const handleAddTag = (name: string) => {
    requireAdmin(() => {
      const formatted = name.startsWith('#') ? name : `#${name}`;
      if (tags.some((t) => t.name.toLowerCase() === formatted.toLowerCase())) return;
      const newTag: Tag = {
        id: `tag-${Date.now()}`,
        name: formatted
      };
      const nextTags = [...tags, newTag];
      setTags(nextTags);
      syncToGoogleSheet({ tags: nextTags });
    }, '태그 추가는 관리자 전용 기능입니다.');
  };

  const handleSaveTag = (updatedTag: Tag) => {
    requireAdmin(() => {
      const oldTag = tags.find((t) => t.id === updatedTag.id);
      const nextTags = tags.map((t) => (t.id === updatedTag.id ? updatedTag : t));
      setTags(nextTags);

      let nextPhotos = photos;
      if (oldTag && oldTag.name.toLowerCase() !== updatedTag.name.toLowerCase()) {
        nextPhotos = photos.map((p) => {
          if (!p.tags || p.tags.length === 0) return p;
          const updatedPhotoTags = p.tags.map((t) =>
            t.toLowerCase() === oldTag.name.toLowerCase() ? updatedTag.name : t
          );
          return { ...p, tags: updatedPhotoTags };
        });
        setPhotos(nextPhotos);
      }

      syncToGoogleSheet({ tags: nextTags, photos: nextPhotos });
    }, '태그 수정은 관리자 전용 기능입니다.');
  };

  const handleDeleteTag = (tag: Tag) => {
    requireAdmin(() => {
      setDeleteModal({
        isOpen: true,
        itemType: 'Tag',
        itemName: tag.name,
        onConfirm: () => {
          const nextTags = tags.filter((t) => t.id !== tag.id);
          setTags(nextTags);

          // Remove deleted tag from all photos
          const nextPhotos = photos.map((p) => {
            if (!p.tags || p.tags.length === 0) return p;
            const filteredTags = p.tags.filter(
              (t) => t.toLowerCase() !== tag.name.toLowerCase()
            );
            return { ...p, tags: filteredTags };
          });
          setPhotos(nextPhotos);

          setDeleteModal((m) => ({ ...m, isOpen: false }));
          syncToGoogleSheet({ tags: nextTags, photos: nextPhotos });
        }
      });
    }, '태그 삭제는 관리자 전용 기능입니다.');
  };

  const handleReorderTags = (reorderedTags: Tag[]) => {
    requireAdmin(() => {
      setTags(reorderedTags);
      syncToGoogleSheet({ tags: reorderedTags });
    }, '태그 순서 변경은 관리자 전용 기능입니다.');
  };

  // Handlers for Photos
  const handleUploadPhoto = (newPhotoData: Omit<Photo, 'id'>) => {
    const newPhoto: Photo = {
      ...newPhotoData,
      id: `photo-${Date.now()}`
    };
    const nextPhotos = [newPhoto, ...photos];
    setPhotos(nextPhotos);

    // Auto register newly introduced tags to global tags state
    let nextTags = [...tags];
    let tagsUpdated = false;
    (newPhotoData.tags || []).forEach((t) => {
      const formatted = t.startsWith('#') ? t : `#${t}`;
      if (!nextTags.some((gt) => gt.name.toLowerCase() === formatted.toLowerCase())) {
        nextTags.push({
          id: `tag-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          name: formatted,
        });
        tagsUpdated = true;
      }
    });

    if (tagsUpdated) {
      setTags(nextTags);
    }

    setActiveView('gallery');
    syncToGoogleSheet({ photos: nextPhotos, tags: tagsUpdated ? nextTags : tags });
  };

  const handleSavePhoto = (updatedPhoto: Photo) => {
    requireAdmin(() => {
      const nextPhotos = photos.map((p) => (p.id === updatedPhoto.id ? updatedPhoto : p));
      setPhotos(nextPhotos);
      if (selectedPhoto?.id === updatedPhoto.id) {
        setSelectedPhoto(updatedPhoto);
      }

      // Auto register new tags if any
      let nextTags = [...tags];
      let tagsUpdated = false;
      (updatedPhoto.tags || []).forEach((t) => {
        const formatted = t.startsWith('#') ? t.trim() : `#${t.trim()}`;
        if (
          formatted.length > 1 &&
          !nextTags.some((gt) => gt.name.toLowerCase() === formatted.toLowerCase())
        ) {
          nextTags.push({
            id: `tag-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            name: formatted,
          });
          tagsUpdated = true;
        }
      });

      if (tagsUpdated) {
        setTags(nextTags);
      }

      syncToGoogleSheet({ photos: nextPhotos, tags: tagsUpdated ? nextTags : tags });
    }, '사진 수정은 관리자 전용 기능입니다.');
  };

  const handleDeletePhoto = (photo: Photo) => {
    requireAdmin(() => {
      setDeleteModal({
        isOpen: true,
        itemType: 'Photo',
        itemName: photo.title,
        onConfirm: () => {
          const nextPhotos = photos.filter((p) => p.id !== photo.id);
          setPhotos(nextPhotos);
          if (selectedPhoto?.id === photo.id) {
            setSelectedPhoto(null);
            setActiveView('gallery');
          }
          setDeleteModal((m) => ({ ...m, isOpen: false }));
          syncToGoogleSheet({ photos: nextPhotos });
        }
      });
    }, '사진 삭제는 관리자 전용 기능입니다.');
  };

  const handleEditPhotoClick = (photo: Photo) => {
    requireAdmin(() => {
      setEditTarget({ type: 'photo', data: photo });
    }, '사진 편집은 관리자 전용 기능입니다.');
  };

  const handleSelectCategory = (id: string | null) => {
    setSelectedCategoryId(id);
    setActiveView('gallery');
  };

  const handleViewPhotoDetail = (photo: Photo, contextPhotos?: Photo[], filterLabel?: string) => {
    setSelectedPhoto(photo);
    setActivePhotoList(contextPhotos || null);
    setActiveFilterLabel(filterLabel || null);
    setActiveView('photo-detail');
  };

  const handleScrollToTags = () => {
    requireAdmin(() => {
      setActiveView('categories');
      setTimeout(() => {
        const el = document.getElementById('tags-section');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }, 'Categories 관리 메뉴는 관리자 전용 기능입니다.');
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f9f9f9] text-[#1a1c1c] antialiased">
      {/* Top Header except when in photo detail (which has its own action bar) */}
      {activeView !== 'photo-detail' && (
        <Header
          siteName={homeSettings.siteName}
          showGalleryPage={homeSettings.showGalleryPage !== false}
          activeView={activeView}
          setActiveView={(view) => {
            if (view === 'categories' && !isAdmin) {
              requireAdmin(() => setActiveView('categories'), 'Categories 관리 메뉴는 관리자 전용 기능입니다.');
              return;
            }
            setActiveView(view);
            if (view === 'gallery') setSearchQuery('');
          }}
          searchQuery={searchQuery}
          setSearchQuery={(q) => {
            setSearchQuery(q);
            if (activeView !== 'gallery') setActiveView('gallery');
          }}
          onOpenUpload={handleOpenUploadClick}
          isAdmin={isAdmin}
          onOpenAdminLogin={() => handleOpenAdminLogin()}
          onAdminLogout={handleAdminLogout}
          onOpenHomeEdit={handleOpenHomeEdit}
          onChangePassword={() => setIsChangePasswordOpen(true)}
          transparent={activeView === 'home'}
        />
      )}

      {/* Main View Router */}
      <div className="flex-grow flex flex-col">
        {activeView === 'home' && (
          <HomeView
            onExplore={() => {
              if (homeSettings.showGalleryPage === false) {
                setActiveView('exhibition');
              } else {
                setActiveView('gallery');
              }
            }}
            homeSettings={homeSettings}
          />
        )}

        {activeView === 'gallery' && (
          <GalleryView
            categories={categories}
            tags={tags}
            photos={photos}
            selectedCategoryId={selectedCategoryId}
            onSelectCategory={setSelectedCategoryId}
            searchQuery={searchQuery}
            onViewPhoto={handleViewPhotoDetail}
            onEditPhoto={handleEditPhotoClick}
            onDeletePhoto={handleDeletePhoto}
            onViewAllTags={handleScrollToTags}
            isAdmin={isAdmin}
          />
        )}

        {activeView === 'categories' && isAdmin && (
          <CategoriesView
            categories={categories}
            tags={tags}
            photos={photos}
            selectedCategoryId={selectedCategoryId}
            onSelectCategory={handleSelectCategory}
            onAddCategory={handleAddCategory}
            onEditCategory={(c) => requireAdmin(() => setEditTarget({ type: 'category', data: c }), '카테고리 편집은 관리자 전용 기능입니다.')}
            onDeleteCategory={handleDeleteCategory}
            onReorderCategories={handleReorderCategories}
            onAddTag={handleAddTag}
            onEditTag={(t) => requireAdmin(() => setEditTarget({ type: 'tag', data: t }), '태그 편집은 관리자 전용 기능입니다.')}
            onDeleteTag={handleDeleteTag}
            onReorderTags={handleReorderTags}
            onViewAllTags={handleScrollToTags}
          />
        )}

        {activeView === 'exhibition' && (
          <ExhibitionView
            exhibitions={exhibitions}
            activeExhibitionId={activeExhibitionId}
            photos={photos}
            isAdmin={isAdmin}
            onOpenEditModal={() => setIsExhibitionEditOpen(true)}
            onGoToGallery={() => setActiveView('gallery')}
            onViewPhoto={handleViewPhotoDetail}
            onSetActiveExhibition={handleSetActiveExhibition}
          />
        )}

        {activeView === 'photo-detail' && selectedPhoto && (
          <PhotoDetailView
            photo={selectedPhoto}
            allPhotos={activePhotoList || photos}
            initialFilterLabel={activeFilterLabel}
            onClearContextFilter={() => {
              setActivePhotoList(null);
              setActiveFilterLabel(null);
            }}
            onBack={() => setActiveView('gallery')}
            onSelectPhoto={setSelectedPhoto}
            onEditPhoto={handleEditPhotoClick}
            onDeletePhoto={handleDeletePhoto}
            isAdmin={isAdmin}
            onRequireAdmin={() => handleOpenAdminLogin('사진 관리를 위해 관리자 로그인이 필요합니다.')}
          />
        )}
      </div>

      {/* Global Footer except in photo detail view */}
      {activeView !== 'photo-detail' && <Footer siteName={homeSettings.siteName} />}

      {/* Admin Login Modal */}
      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        onLoginSuccess={handleAdminLoginSuccess}
        adminPassword={adminPassword}
        ownerEmail="junojigu@gmail.com"
        message={adminLoginMessage}
      />

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
        currentPassword={adminPassword}
        ownerEmail="junojigu@gmail.com"
        onChangePassword={handleChangePassword}
      />

      {/* Upload Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        categories={categories}
        tags={tags}
        cloudinaryCloudName={homeSettings.cloudinaryCloudName}
        cloudinaryUploadPreset={homeSettings.cloudinaryUploadPreset}
        onClose={() => setIsUploadOpen(false)}
        onUpload={handleUploadPhoto}
      />

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={deleteModal.isOpen}
        itemType={deleteModal.itemType}
        itemName={deleteModal.itemName}
        onClose={() => setDeleteModal((m) => ({ ...m, isOpen: false }))}
        onConfirm={deleteModal.onConfirm}
      />

      {/* Edit Modal */}
      <EditModal
        target={editTarget}
        categories={categories}
        tags={tags}
        onClose={() => setEditTarget(null)}
        onSaveCategory={handleSaveCategory}
        onSaveTag={handleSaveTag}
        onSavePhoto={handleSavePhoto}
      />

      {/* Home / Landing Settings Edit Modal */}
      <HomeEditModal
        isOpen={isHomeEditOpen}
        onClose={() => setIsHomeEditOpen(false)}
        homeSettings={homeSettings}
        onSave={handleSaveHomeSettings}
        photos={photos}
      />

      {/* Exhibition Info & Artist Note Edit Modal */}
      <ExhibitionEditModal
        isOpen={isExhibitionEditOpen}
        onClose={() => setIsExhibitionEditOpen(false)}
        exhibitions={exhibitions}
        activeExhibitionId={activeExhibitionId}
        onSaveExhibition={handleSaveExhibition}
        onDeleteExhibition={handleDeleteExhibition}
        onSetActiveExhibition={handleSetActiveExhibition}
        photos={photos}
        homeSettings={homeSettings}
      />
    </div>
  );
}
