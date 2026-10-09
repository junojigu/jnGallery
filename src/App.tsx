import { useState, useEffect, useRef } from 'react';
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

// Helper to parse photoLikesJson from Google Sheet homeSettings (handles both object and JSON string)
function parseLikesMap(raw: any): Record<string, number> {
  if (!raw) return {};
  try {
    const obj = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
      const result: Record<string, number> = {};
      for (const [k, v] of Object.entries(obj)) {
        const num = Number(v);
        if (!isNaN(num) && num >= 0) {
          result[k] = Math.floor(num);
        }
      }
      return result;
    }
  } catch {
    // ignore parse error
  }
  return {};
}

// Helper to parse exhibitionPicksJson from Google Sheet homeSettings (handles both array and JSON string)
function parsePicksList(raw: any): string[] {
  if (!raw) return [];
  try {
    const arr = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (Array.isArray(arr)) {
      return arr.map((id) => String(id).trim()).filter(Boolean);
    }
  } catch {
    // ignore parse error
  }
  return [];
}

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

    // Normalize likes count
    let likesCount = 0;
    if (p.likes !== undefined && p.likes !== null && !isNaN(Number(p.likes))) {
      likesCount = Math.max(0, Math.floor(Number(p.likes)));
    } else {
      try {
        const savedLikesStr = localStorage.getItem('pm_photo_likes');
        if (savedLikesStr) {
          const savedLikesMap = JSON.parse(savedLikesStr);
          if (savedLikesMap && typeof savedLikesMap[photoId] === 'number') {
            likesCount = Math.max(0, savedLikesMap[photoId]);
          }
        }
        if (likesCount === 0) {
          const savedStr = localStorage.getItem('pm_photos');
          if (savedStr) {
            const savedList = JSON.parse(savedStr);
            const match = savedList.find((sp: any) => sp.id === photoId || (sp.url && photoUrl && sp.url === photoUrl));
            if (match && typeof match.likes === 'number') {
              likesCount = Math.max(0, match.likes);
            }
          }
        }
      } catch {
        // ignore
      }
    }

    // Normalize exhibitionPick boolean
    let isExhibitionPick = false;
    if (p.exhibitionPick !== undefined && p.exhibitionPick !== null) {
      isExhibitionPick =
        p.exhibitionPick === true ||
        p.exhibitionPick === 'true' ||
        p.exhibitionPick === 'TRUE' ||
        p.exhibitionPick === 1 ||
        p.exhibitionPick === '1';
    } else {
      try {
        const savedPicksStr = localStorage.getItem('pm_exhibition_picks');
        if (savedPicksStr) {
          const savedPicksList = JSON.parse(savedPicksStr);
          if (Array.isArray(savedPicksList) && savedPicksList.includes(photoId)) {
            isExhibitionPick = true;
          }
        } else {
          const savedStr = localStorage.getItem('pm_photos');
          if (savedStr) {
            const savedList = JSON.parse(savedStr);
            const match = savedList.find(
              (sp: any) => sp.id === photoId || (sp.url && photoUrl && sp.url === photoUrl)
            );
            if (match && match.exhibitionPick) {
              isExhibitionPick = true;
            }
          }
        }
      } catch {
        // ignore
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
      exhibitionPick: isExhibitionPick,
      likes: likesCount,
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
  const [previousView, setPreviousView] = useState<ActiveView>('home');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activePhotoList, setActivePhotoList] = useState<Photo[] | null>(null);
  const [activeFilterLabel, setActiveFilterLabel] = useState<string | null>(null);

  // Visitor Liked Photos State (Mode A: 1 toggle per photo per visitor browser)
  const [likedPhotoIds, setLikedPhotoIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('pm_liked_photos');
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

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

  // Global Toast Notification State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<any>(null);

  const showToast = (msg: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Google Sheets Auto Sync & Real-time Server Sync State
  const [isSheetSyncing, setIsSheetSyncing] = useState(false);
  const [sheetSyncStatus, setSheetSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const recentLikeClickRef = useRef<Record<string, number>>({});
  const realtimeLikesRef = useRef<Record<string, number>>({});
  const hasRealtimeServerRef = useRef<boolean>(false);

  // Apply authoritative real-time likes & exhibition picks to all active React states
  const applyRealtimeLikesAndPicks = (
    incomingLikes: Record<string, number>,
    incomingPicks?: string[],
    hasIncomingPicks?: boolean,
    respectRecentGuard = true
  ) => {
    const now = Date.now();
    realtimeLikesRef.current = incomingLikes;

    try {
      localStorage.setItem('pm_photo_likes', JSON.stringify(incomingLikes));
      if (hasIncomingPicks && Array.isArray(incomingPicks)) {
        localStorage.setItem('pm_exhibition_picks', JSON.stringify(incomingPicks));
      }
    } catch {}

    const picksSet = hasIncomingPicks && Array.isArray(incomingPicks) ? new Set(incomingPicks) : null;

    setPhotos((prevPhotos) => {
      let changed = false;
      const next = prevPhotos.map((p) => {
        if (respectRecentGuard && recentLikeClickRef.current[p.id] && now - recentLikeClickRef.current[p.id] < 600) {
          return p;
        }
        const remoteCount = typeof incomingLikes[p.id] === 'number' ? incomingLikes[p.id] : 0;
        const currentCount = typeof p.likes === 'number' ? p.likes : 0;
        const nextPick = picksSet ? picksSet.has(p.id) : p.exhibitionPick;

        if (remoteCount !== currentCount || (picksSet && nextPick !== Boolean(p.exhibitionPick))) {
          changed = true;
          return {
            ...p,
            likes: remoteCount,
            ...(picksSet ? { exhibitionPick: nextPick } : {}),
          };
        }
        return p;
      });

      if (changed) {
        try {
          localStorage.setItem('pm_photos', JSON.stringify(next));
        } catch {}
      }
      return changed ? next : prevPhotos;
    });

    setSelectedPhoto((prevSelected) => {
      if (!prevSelected) return prevSelected;
      if (
        respectRecentGuard &&
        recentLikeClickRef.current[prevSelected.id] &&
        now - recentLikeClickRef.current[prevSelected.id] < 600
      ) {
        return prevSelected;
      }
      const remoteCount =
        typeof incomingLikes[prevSelected.id] === 'number' ? incomingLikes[prevSelected.id] : 0;
      const currentCount = typeof prevSelected.likes === 'number' ? prevSelected.likes : 0;
      const nextPick = picksSet ? picksSet.has(prevSelected.id) : prevSelected.exhibitionPick;

      if (remoteCount !== currentCount || (picksSet && nextPick !== Boolean(prevSelected.exhibitionPick))) {
        return {
          ...prevSelected,
          likes: remoteCount,
          ...(picksSet ? { exhibitionPick: nextPick } : {}),
        };
      }
      return prevSelected;
    });

    setActivePhotoList((prevList) => {
      if (!prevList) return prevList;
      let listChanged = false;
      const nextList = prevList.map((p) => {
        if (respectRecentGuard && recentLikeClickRef.current[p.id] && now - recentLikeClickRef.current[p.id] < 600) {
          return p;
        }
        const remoteCount = typeof incomingLikes[p.id] === 'number' ? incomingLikes[p.id] : 0;
        const currentCount = typeof p.likes === 'number' ? p.likes : 0;
        const nextPick = picksSet ? picksSet.has(p.id) : p.exhibitionPick;

        if (remoteCount !== currentCount || (picksSet && nextPick !== Boolean(p.exhibitionPick))) {
          listChanged = true;
          return {
            ...p,
            likes: remoteCount,
            ...(picksSet ? { exhibitionPick: nextPick } : {}),
          };
        }
        return p;
      });
      return listChanged ? nextList : prevList;
    });
  };

  // Load initial data from Google Sheets if Web App URL exists
  useEffect(() => {
    const sheetUrl = homeSettings.googleSheetAppUrl;
    if (!sheetUrl) return;

    let isMounted = true;
    const fetchSheetData = async () => {
      try {
        setIsSheetSyncing(true);
        const separator = sheetUrl.includes('?') ? '&' : '?';
        const res = await fetch(`${sheetUrl}${separator}_t=${Date.now()}`, {
          method: 'GET',
          redirect: 'follow',
          cache: 'no-store',
        });
        if (!res.ok) return;

        const data = await res.json();
        if (!isMounted) return;

        if (data && typeof data === 'object') {
          const remoteLikesMap = parseLikesMap(data.homeSettings?.photoLikesJson);
          const hasRemotePicksField =
            data.homeSettings && data.homeSettings.exhibitionPicksJson !== undefined;
          const remotePicksSet = new Set(parsePicksList(data.homeSettings?.exhibitionPicksJson));

          // Save remote likes map to localStorage
          if (Object.keys(remoteLikesMap).length > 0) {
            try {
              const savedLikesStr = localStorage.getItem('pm_photo_likes');
              const localLikesObj = savedLikesStr ? JSON.parse(savedLikesStr) : {};
              const mergedLikes = { ...localLikesObj, ...remoteLikesMap };
              localStorage.setItem('pm_photo_likes', JSON.stringify(mergedLikes));
            } catch {}
          }

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
              const exhibitionPickMap = new Map<string, boolean>();
              const likesMap = new Map<string, number>();
              const localPhotosMap = new Map<string, Photo>();
              prevPhotos.forEach((p) => {
                localPhotosMap.set(p.id, p);
                if (p.url) localPhotosMap.set(p.url, p);
                if (p.featured) {
                  featuredMap.set(p.id, true);
                  if (p.url) featuredMap.set(p.url, true);
                }
                if (p.exhibitionPick) {
                  exhibitionPickMap.set(p.id, true);
                  if (p.url) exhibitionPickMap.set(p.url, true);
                }
                if (typeof p.likes === 'number' && p.likes > 0) {
                  likesMap.set(p.id, p.likes);
                  if (p.url) likesMap.set(p.url, p.likes);
                }
              });

              // Check if user has made recent local edits
              const lastLocalUpdate = localStorage.getItem('pm_photos_updated_at');
              const hasRecentLocalEdits = lastLocalUpdate && (Date.now() - Number(lastLocalUpdate) < 120000);

              const updated = normalized.map((p) => {
                const sheetItem = data.photos.find((sp: any) => sp.id === p.id);
                const localItem = localPhotosMap.get(p.id) || (p.url ? localPhotosMap.get(p.url) : null);

                let mergedPhoto: Photo = hasRecentLocalEdits && localItem ? { ...p, ...localItem } : { ...p };

                // If Google Sheets explicit boolean isn't present, check if local state had it featured
                if ((!sheetItem || sheetItem.featured === undefined || sheetItem.featured === null) &&
                    (featuredMap.get(p.id) || (p.url && featuredMap.get(p.url)))) {
                  mergedPhoto.featured = true;
                }

                // Apply exhibitionPick from remote homeSettings.exhibitionPicksJson or local fallback
                if (hasRemotePicksField) {
                  mergedPhoto.exhibitionPick = remotePicksSet.has(p.id);
                } else if (
                  (!sheetItem || sheetItem.exhibitionPick === undefined || sheetItem.exhibitionPick === null) &&
                  (exhibitionPickMap.get(p.id) || (p.url && exhibitionPickMap.get(p.url)))
                ) {
                  mergedPhoto.exhibitionPick = true;
                }

                // Apply likes from real-time server first, then remote homeSettings.photoLikesJson
                const serverLikes = hasRealtimeServerRef.current ? realtimeLikesRef.current[p.id] : undefined;
                const remoteLikes = remoteLikesMap[p.id];
                const localLikes = likesMap.get(p.id) || (p.url ? likesMap.get(p.url) : 0) || 0;
                if (typeof serverLikes === 'number') {
                  mergedPhoto.likes = serverLikes;
                } else if (hasRealtimeServerRef.current) {
                  mergedPhoto.likes = typeof remoteLikes === 'number' ? remoteLikes : 0;
                } else if (typeof remoteLikes === 'number') {
                  mergedPhoto.likes = remoteLikes;
                } else if (!sheetItem || sheetItem.likes === undefined || sheetItem.likes === null) {
                  mergedPhoto.likes = Math.max(mergedPhoto.likes || 0, localLikes);
                }

                return mergedPhoto;
              });
              try { localStorage.setItem('pm_photos', JSON.stringify(updated)); } catch {}

              // Also keep selectedPhoto and activePhotoList in sync if already open
              const updatedById = new Map<string, Photo>(updated.map((up) => [up.id, up]));
              setSelectedPhoto((prevSel) => {
                if (!prevSel) return prevSel;
                const match = updatedById.get(prevSel.id);
                return match ? { ...prevSel, likes: match.likes, featured: match.featured, exhibitionPick: match.exhibitionPick } : prevSel;
              });
              setActivePhotoList((prevList) => {
                if (!prevList) return prevList;
                return prevList.map((item) => {
                  const match = updatedById.get(item.id);
                  return match ? { ...item, likes: match.likes, featured: match.featured, exhibitionPick: match.exhibitionPick } : item;
                });
              });

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

  // Real-time Server-Sent Events (SSE) + fast 2s local server polling for instant (<0.5s) shared Likes
  useEffect(() => {
    const sheetUrl = homeSettings.googleSheetAppUrl;
    let isMounted = true;
    let eventSource: EventSource | null = null;

    // 1. Connect to real-time SSE stream for instant <100ms push updates when anyone clicks Like
    try {
      eventSource = new EventSource('/api/likes/stream');
      eventSource.onmessage = (event) => {
        if (!isMounted || !event.data) return;
        try {
          const parsed = JSON.parse(event.data);
          if (parsed && typeof parsed === 'object' && parsed.likes) {
            hasRealtimeServerRef.current = true;
            const likesMap = parseLikesMap(parsed.likes);
            const picksList = parsePicksList(parsed.exhibitionPicks);
            applyRealtimeLikesAndPicks(likesMap, picksList, Boolean(parsed.hasExhibitionPicks), true);
          }
        } catch {
          // ignore malformed SSE frame
        }
      };
    } catch {
      // fallback to polling if EventSource is unavailable
    }

    // 2. Fast local server fetch (< 5ms) for immediate sync on photo change / tab focus / 2s interval
    const fetchRealtimeServerLikes = async () => {
      try {
        const query = sheetUrl ? `?sheetUrl=${encodeURIComponent(sheetUrl)}&_t=${Date.now()}` : `?_t=${Date.now()}`;
        const res = await fetch(`/api/likes${query}`, { cache: 'no-store' });
        if (!res.ok || !isMounted) return;
        const data = await res.json();
        if (!isMounted || !data || !data.ok) return;

        hasRealtimeServerRef.current = true;
        const likesMap = parseLikesMap(data.likes);
        const picksList = parsePicksList(data.exhibitionPicks);
        applyRealtimeLikesAndPicks(likesMap, picksList, Boolean(data.hasExhibitionPicks), true);
      } catch {
        // Fallback to Google Sheets poll only if local server route is unreachable
        if (!sheetUrl || hasRealtimeServerRef.current) return;
        try {
          const separator = sheetUrl.includes('?') ? '&' : '?';
          const res = await fetch(`${sheetUrl}${separator}_t=${Date.now()}`, {
            method: 'GET',
            redirect: 'follow',
            cache: 'no-store',
          });
          if (!res.ok || !isMounted) return;
          const data = await res.json();
          if (!isMounted || !data?.homeSettings) return;
          const remoteLikesMap = parseLikesMap(data.homeSettings.photoLikesJson);
          if (data.homeSettings.photoLikesJson !== undefined) {
            applyRealtimeLikesAndPicks(remoteLikesMap, undefined, false, true);
          }
        } catch {
          // ignore
        }
      }
    };

    fetchRealtimeServerLikes();
    const intervalId = setInterval(fetchRealtimeServerLikes, 2000);
    const handleFocus = () => {
      fetchRealtimeServerLikes();
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      isMounted = false;
      if (eventSource) {
        eventSource.close();
      }
      clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
    };
  }, [homeSettings.googleSheetAppUrl, activeView, selectedPhoto?.id]);

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

      // Build current likesMap and exhibitionPicks list so they are always stored in HomeSettings sheet
      const currentLikesMap: Record<string, number> = {};
      const currentPicksList: string[] = [];
      targetPhotos.forEach((p: Photo) => {
        if (typeof p.likes === 'number' && p.likes > 0) {
          currentLikesMap[p.id] = p.likes;
        }
        if (p.exhibitionPick) {
          currentPicksList.push(p.id);
        }
      });

      const baseHomeSettings = payloadOverride?.homeSettings || homeSettings;
      const enrichedHomeSettings: HomeSettings = {
        ...baseHomeSettings,
        photoLikesJson: JSON.stringify(currentLikesMap),
        exhibitionPicksJson: JSON.stringify(currentPicksList),
      };

      const payload = {
        action: 'syncAll',
        categories: targetCategories,
        tags: payloadOverride?.tags || tags,
        exhibitions: targetExhibitions,
        activeExhibitionId: targetActiveExId,
        exhibitionInfo: payloadOverride?.exhibitionInfo || activeExInfo,
        updatedAt: new Date().toISOString(),
        ...payloadOverride,
        homeSettings: enrichedHomeSettings,
        photos: photosForSync,
      };

      await fetch(sheetUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
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
      const mergedSettings: HomeSettings = {
        ...newSettings,
        photoLikesJson: homeSettings.photoLikesJson,
        exhibitionPicksJson: homeSettings.exhibitionPicksJson,
      };
      setHomeSettings(mergedSettings);
      try {
        localStorage.setItem('pm_home_settings', JSON.stringify(mergedSettings));
      } catch {}
      syncToGoogleSheet({
        action: 'saveHomeSettings',
        homeSettings: mergedSettings,
        photos,
        categories,
        tags,
      });
      showToast('✨ 메인 페이지 설정이 저장되었습니다.');
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
      try { localStorage.setItem('pm_categories', JSON.stringify(nextCats)); } catch {}
      syncToGoogleSheet({ categories: nextCats });
      showToast('✨ 새 카테고리가 추가되었습니다.');
    }, '카테고리 추가는 관리자 전용 기능입니다.');
  };

  const handleSaveCategory = (updatedCat: Category) => {
    requireAdmin(() => {
      const nextCats = categories.map((c) => (c.id === updatedCat.id ? updatedCat : c));
      setCategories(nextCats);
      try { localStorage.setItem('pm_categories', JSON.stringify(nextCats)); } catch {}
      syncToGoogleSheet({ categories: nextCats });
      showToast('✨ 카테고리 수정 사항이 저장되었습니다.');
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
          try { localStorage.setItem('pm_categories', JSON.stringify(nextCats)); } catch {}
          setDeleteModal((m) => ({ ...m, isOpen: false }));
          syncToGoogleSheet({ categories: nextCats });
          showToast('🗑️ 카테고리가 삭제되었습니다.');
        }
      });
    }, '카테고리 삭제는 관리자 전용 기능입니다.');
  };

  const handleReorderCategories = (reorderedCats: Category[]) => {
    requireAdmin(() => {
      setCategories(reorderedCats);
      try { localStorage.setItem('pm_categories', JSON.stringify(reorderedCats)); } catch {}
      syncToGoogleSheet({ categories: reorderedCats });
      showToast('✨ 카테고리 순서가 변경되었습니다.');
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
      try { localStorage.setItem('pm_tags', JSON.stringify(nextTags)); } catch {}
      syncToGoogleSheet({ tags: nextTags });
      showToast('✨ 새 태그가 추가되었습니다.');
    }, '태그 추가는 관리자 전용 기능입니다.');
  };

  const handleSaveTag = (updatedTag: Tag) => {
    requireAdmin(() => {
      const oldTag = tags.find((t) => t.id === updatedTag.id);
      const nextTags = tags.map((t) => (t.id === updatedTag.id ? updatedTag : t));
      setTags(nextTags);
      try { localStorage.setItem('pm_tags', JSON.stringify(nextTags)); } catch {}

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
        try {
          localStorage.setItem('pm_photos', JSON.stringify(nextPhotos));
          localStorage.setItem('pm_photos_updated_at', Date.now().toString());
        } catch {}
      }

      syncToGoogleSheet({ tags: nextTags, photos: nextPhotos });
      showToast('✨ 태그 수정 사항이 저장되었습니다.');
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
          try { localStorage.setItem('pm_tags', JSON.stringify(nextTags)); } catch {}

          // Remove deleted tag from all photos
          const nextPhotos = photos.map((p) => {
            if (!p.tags || p.tags.length === 0) return p;
            const filteredTags = p.tags.filter(
              (t) => t.toLowerCase() !== tag.name.toLowerCase()
            );
            return { ...p, tags: filteredTags };
          });
          setPhotos(nextPhotos);
          try {
            localStorage.setItem('pm_photos', JSON.stringify(nextPhotos));
            localStorage.setItem('pm_photos_updated_at', Date.now().toString());
          } catch {}

          setDeleteModal((m) => ({ ...m, isOpen: false }));
          syncToGoogleSheet({ tags: nextTags, photos: nextPhotos });
          showToast('🗑️ 태그가 삭제되었습니다.');
        }
      });
    }, '태그 삭제는 관리자 전용 기능입니다.');
  };

  const handleReorderTags = (reorderedTags: Tag[]) => {
    requireAdmin(() => {
      setTags(reorderedTags);
      try { localStorage.setItem('pm_tags', JSON.stringify(reorderedTags)); } catch {}
      syncToGoogleSheet({ tags: reorderedTags });
      showToast('✨ 태그 순서가 변경되었습니다.');
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
    try {
      localStorage.setItem('pm_photos', JSON.stringify(nextPhotos));
      localStorage.setItem('pm_photos_updated_at', Date.now().toString());
    } catch {}

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
      try { localStorage.setItem('pm_tags', JSON.stringify(nextTags)); } catch {}
    }

    setActiveView('gallery');
    syncToGoogleSheet({ photos: nextPhotos, tags: tagsUpdated ? nextTags : tags });
    showToast('✨ 새 사진이 성공적으로 등록되었습니다.');
  };

  const handleSavePhoto = (updatedPhoto: Photo) => {
    const nextPhotos = photos.map((p) => (p.id === updatedPhoto.id ? updatedPhoto : p));
    setPhotos(nextPhotos);
    if (selectedPhoto?.id === updatedPhoto.id) {
      setSelectedPhoto(updatedPhoto);
    }
    if (activePhotoList) {
      setActivePhotoList((prev) =>
        prev ? prev.map((p) => (p.id === updatedPhoto.id ? updatedPhoto : p)) : null
      );
    }

    try {
      localStorage.setItem('pm_photos', JSON.stringify(nextPhotos));
      localStorage.setItem('pm_photos_updated_at', Date.now().toString());
    } catch {}

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
      try {
        localStorage.setItem('pm_tags', JSON.stringify(nextTags));
      } catch {}
    }

    syncToGoogleSheet({ photos: nextPhotos, tags: tagsUpdated ? nextTags : tags });
    showToast('✨ 사진 정보 및 태그 수정 사항이 성공적으로 저장되었습니다.');
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
          if (activePhotoList) {
            setActivePhotoList((prev) =>
              prev ? prev.filter((p) => p.id !== photo.id) : null
            );
          }
          try {
            localStorage.setItem('pm_photos', JSON.stringify(nextPhotos));
            localStorage.setItem('pm_photos_updated_at', Date.now().toString());
          } catch {}
          setDeleteModal((m) => ({ ...m, isOpen: false }));
          syncToGoogleSheet({ photos: nextPhotos });
          showToast('🗑️ 사진이 삭제되었습니다.');
        }
      });
    }, '사진 삭제는 관리자 전용 기능입니다.');
  };

  const handleEditPhotoClick = (photo: Photo) => {
    requireAdmin(() => {
      setEditTarget({ type: 'photo', data: photo });
    }, '사진 편집은 관리자 전용 기능입니다.');
  };

  const handleToggleFeatured = (photoToToggle: Photo) => {
    requireAdmin(() => {
      const updatedPhoto: Photo = {
        ...photoToToggle,
        featured: !photoToToggle.featured,
      };
      handleSavePhoto(updatedPhoto);
      showToast(
        updatedPhoto.featured
          ? '✨ 관리자 추천작으로 지정되었습니다.'
          : '관리자 추천이 해제되었습니다.'
      );
    }, '추천작 관리를 위해 관리자 로그인이 필요합니다.');
  };

  // Lightweight helper to sync only HomeSettings (used for fast ~2KB sync of Likes & Exhibition Picks)
  const syncMetadataToGoogleSheet = async (updatedPhotosList: Photo[], targetLikePhotoId?: string, isIncrement?: boolean) => {
    const sheetUrl = homeSettings.googleSheetAppUrl;
    if (!sheetUrl) return;

    try {
      setIsSheetSyncing(true);

      // 1. Fetch latest remote homeSettings first so we never overwrite another visitor's concurrent like
      let remoteLikesMap: Record<string, number> = {};
      let remoteHomeSettings: Partial<HomeSettings> = {};
      try {
        const separator = sheetUrl.includes('?') ? '&' : '?';
        const res = await fetch(`${sheetUrl}${separator}_t=${Date.now()}`, {
          method: 'GET',
          redirect: 'follow',
          cache: 'no-store',
        });
        if (res.ok) {
          const data = await res.json();
          if (data?.homeSettings && typeof data.homeSettings === 'object') {
            remoteHomeSettings = data.homeSettings;
            remoteLikesMap = parseLikesMap(data.homeSettings.photoLikesJson);
          }
        }
      } catch {
        // fallback to local state if GET fails
      }

      // 2. Build merged likes map and exhibition picks list
      const now = Date.now();
      const mergedLikesMap: Record<string, number> = { ...remoteLikesMap };
      const picksList: string[] = [];

      updatedPhotosList.forEach((p) => {
        if (p.exhibitionPick) {
          picksList.push(p.id);
        }
        const localCount = typeof p.likes === 'number' ? p.likes : 0;
        if (p.id === targetLikePhotoId && isIncrement !== undefined) {
          // If we have a remote count from another visitor, apply the delta accurately
          if (typeof remoteLikesMap[p.id] === 'number') {
            const computed = isIncrement
              ? Math.max(localCount, remoteLikesMap[p.id] + 1)
              : Math.max(0, remoteLikesMap[p.id] - 1);
            mergedLikesMap[p.id] = computed;
          } else {
            mergedLikesMap[p.id] = localCount;
          }
        } else if (recentLikeClickRef.current[p.id] && now - recentLikeClickRef.current[p.id] < 10000) {
          mergedLikesMap[p.id] = localCount;
        } else if (mergedLikesMap[p.id] === undefined && localCount > 0) {
          mergedLikesMap[p.id] = localCount;
        }
      });

      // Clean up zero entries to keep JSON compact
      Object.keys(mergedLikesMap).forEach((k) => {
        if (!mergedLikesMap[k] || mergedLikesMap[k] <= 0) {
          delete mergedLikesMap[k];
        }
      });

      // Update local state with any merged counts from other visitors
      setPhotos((prev) =>
        prev.map((p) => {
          const syncedLikes = mergedLikesMap[p.id] || 0;
          return (p.likes || 0) !== syncedLikes ? { ...p, likes: syncedLikes } : p;
        })
      );
      setSelectedPhoto((prev) => {
        if (!prev) return prev;
        const syncedLikes = mergedLikesMap[prev.id] || 0;
        return (prev.likes || 0) !== syncedLikes ? { ...prev, likes: syncedLikes } : prev;
      });
      setActivePhotoList((prev) =>
        prev
          ? prev.map((p) => {
              const syncedLikes = mergedLikesMap[p.id] || 0;
              return (p.likes || 0) !== syncedLikes ? { ...p, likes: syncedLikes } : p;
            })
          : null
      );

      try {
        localStorage.setItem('pm_photo_likes', JSON.stringify(mergedLikesMap));
      } catch {}

      const nextHomeSettings: HomeSettings = {
        ...homeSettings,
        ...remoteHomeSettings,
        photoLikesJson: JSON.stringify(mergedLikesMap),
        exhibitionPicksJson: JSON.stringify(picksList),
      };

      setHomeSettings(nextHomeSettings);
      try {
        localStorage.setItem('pm_home_settings', JSON.stringify(nextHomeSettings));
      } catch {}

      // 3. POST lightweight saveHomeSettings payload (~2KB instead of 600KB)
      await fetch(sheetUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({
          action: 'saveHomeSettings',
          homeSettings: nextHomeSettings,
          updatedAt: new Date().toISOString(),
        }),
      });

      setSheetSyncStatus('success');
    } catch (err) {
      console.error('Google Sheets metadata sync error:', err);
      setSheetSyncStatus('error');
    } finally {
      setIsSheetSyncing(false);
    }
  };

  // Admin Exhibition Pick (Flag) Toggle Handler
  const handleToggleExhibitionPick = (photoToToggle: Photo) => {
    requireAdmin(() => {
      const updatedPhoto: Photo = {
        ...photoToToggle,
        exhibitionPick: !photoToToggle.exhibitionPick,
      };
      const nextPhotos = photos.map((p) => (p.id === updatedPhoto.id ? updatedPhoto : p));
      setPhotos(nextPhotos);

      if (selectedPhoto?.id === updatedPhoto.id) {
        setSelectedPhoto(updatedPhoto);
      }
      if (activePhotoList) {
        setActivePhotoList((prev) =>
          prev ? prev.map((p) => (p.id === updatedPhoto.id ? updatedPhoto : p)) : null
        );
      }

      try {
        localStorage.setItem('pm_photos', JSON.stringify(nextPhotos));
        localStorage.setItem('pm_photos_updated_at', Date.now().toString());
        const pickIds = nextPhotos.filter((p) => p.exhibitionPick).map((p) => p.id);
        localStorage.setItem('pm_exhibition_picks', JSON.stringify(pickIds));
        fetch('/api/picks/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            exhibitionPicks: pickIds,
            sheetUrl: homeSettings.googleSheetAppUrl,
            homeSettingsSnapshot: homeSettings,
          }),
        }).catch(() => {
          syncMetadataToGoogleSheet(nextPhotos);
        });
      } catch {
        syncMetadataToGoogleSheet(nextPhotos);
      }

      showToast(
        updatedPhoto.exhibitionPick
          ? '🚩 전시 후보 작품으로 선택(깃발 표시)되었습니다.'
          : '전시 후보(깃발 표시)가 해제되었습니다.'
      );
    }, '전시 후보 작품 선별은 관리자 전용 기능입니다.');
  };

  // Admin Clear All Exhibition Picks Handler
  const handleClearAllExhibitionPicks = () => {
    requireAdmin(() => {
      const pickedCount = photos.filter((p) => p.exhibitionPick).length;
      if (pickedCount === 0) return;

      const nextPhotos = photos.map((p) => (p.exhibitionPick ? { ...p, exhibitionPick: false } : p));
      setPhotos(nextPhotos);

      if (selectedPhoto?.exhibitionPick) {
        setSelectedPhoto({ ...selectedPhoto, exhibitionPick: false });
      }
      if (activePhotoList) {
        setActivePhotoList((prev) =>
          prev ? prev.map((p) => (p.exhibitionPick ? { ...p, exhibitionPick: false } : p)) : null
        );
      }

      try {
        localStorage.setItem('pm_photos', JSON.stringify(nextPhotos));
        localStorage.setItem('pm_photos_updated_at', Date.now().toString());
        localStorage.setItem('pm_exhibition_picks', JSON.stringify([]));
        fetch('/api/picks/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            exhibitionPicks: [],
            sheetUrl: homeSettings.googleSheetAppUrl,
            homeSettingsSnapshot: homeSettings,
          }),
        }).catch(() => {
          syncMetadataToGoogleSheet(nextPhotos);
        });
      } catch {
        syncMetadataToGoogleSheet(nextPhotos);
      }

      showToast(`🚩 선택된 전시 후보(${pickedCount}장) 표시가 모두 해제되었습니다.`);
    }, '전시 후보 일괄 해제는 관리자 전용 기능입니다.');
  };

  // Visitor Like Toggle Handler (Mode A: 1-person 1-heart toggle)
  const handleToggleLikePhoto = (targetPhoto: Photo) => {
    const isAlreadyLiked = likedPhotoIds.includes(targetPhoto.id);
    const currentLikes = typeof targetPhoto.likes === 'number' ? targetPhoto.likes : 0;
    const nextLikes = isAlreadyLiked ? Math.max(0, currentLikes - 1) : currentLikes + 1;

    recentLikeClickRef.current[targetPhoto.id] = Date.now();

    const nextLikedIds = isAlreadyLiked
      ? likedPhotoIds.filter((id) => id !== targetPhoto.id)
      : [...likedPhotoIds, targetPhoto.id];

    setLikedPhotoIds(nextLikedIds);
    try {
      localStorage.setItem('pm_liked_photos', JSON.stringify(nextLikedIds));
    } catch {}

    const updatedPhoto: Photo = {
      ...targetPhoto,
      likes: nextLikes,
    };

    const nextPhotos = photos.map((p) => (p.id === updatedPhoto.id ? updatedPhoto : p));
    setPhotos(nextPhotos);

    if (selectedPhoto?.id === updatedPhoto.id) {
      setSelectedPhoto(updatedPhoto);
    }
    if (activePhotoList) {
      setActivePhotoList((prev) =>
        prev ? prev.map((p) => (p.id === updatedPhoto.id ? updatedPhoto : p)) : null
      );
    }

    try {
      localStorage.setItem('pm_photos', JSON.stringify(nextPhotos));
      localStorage.setItem('pm_photos_updated_at', Date.now().toString());
      const savedLikesStr = localStorage.getItem('pm_photo_likes');
      const likesMap = savedLikesStr ? JSON.parse(savedLikesStr) : {};
      likesMap[updatedPhoto.id] = nextLikes;
      localStorage.setItem('pm_photo_likes', JSON.stringify(likesMap));
    } catch {}

    // Instant (<10ms) real-time server toggle + SSE broadcast + background Google Sheet backup
    fetch('/api/likes/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        photoId: targetPhoto.id,
        increment: !isAlreadyLiked,
        baseCount: currentLikes,
        sheetUrl: homeSettings.googleSheetAppUrl,
        homeSettingsSnapshot: homeSettings,
      }),
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('API error'))))
      .then((data) => {
        if (data && data.ok && data.likes) {
          hasRealtimeServerRef.current = true;
          const serverLikesMap = parseLikesMap(data.likes);
          applyRealtimeLikesAndPicks(serverLikesMap, undefined, false, false);
        }
      })
      .catch(() => {
        // Fallback to direct Google Sheets sync if backend endpoint is unavailable
        syncMetadataToGoogleSheet(nextPhotos, targetPhoto.id, !isAlreadyLiked);
      });
  };

  const handleSelectCategory = (id: string | null) => {
    setSelectedCategoryId(id);
    setActiveView('gallery');
  };

  const handleViewPhotoDetail = (photo: Photo, contextPhotos?: Photo[], filterLabel?: string) => {
    if (activeView !== 'photo-detail') {
      setPreviousView(activeView);
    }
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
          showExhibitionPage={homeSettings.showExhibitionPage !== false}
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
              if (homeSettings.showGalleryPage !== false) {
                setActiveView('gallery');
              } else if (homeSettings.showExhibitionPage !== false) {
                setActiveView('exhibition');
              } else {
                setActiveView('home');
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
            onToggleExhibitionPick={handleToggleExhibitionPick}
            onClearAllExhibitionPicks={handleClearAllExhibitionPicks}
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
            onGoToGallery={homeSettings.showGalleryPage === false ? undefined : () => setActiveView('gallery')}
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
            backButtonText={
              previousView === 'exhibition' && homeSettings.showExhibitionPage !== false
                ? '작품 전시로 돌아가기'
                : previousView === 'home'
                ? '홈으로 돌아가기'
                : homeSettings.showGalleryPage !== false
                ? '갤러리로 돌아가기'
                : homeSettings.showExhibitionPage !== false
                ? '작품 전시로 돌아가기'
                : '홈으로 돌아가기'
            }
            onBack={() => {
              let targetView = previousView;
              if (targetView === 'gallery' && homeSettings.showGalleryPage === false) {
                targetView = homeSettings.showExhibitionPage !== false ? 'exhibition' : 'home';
              }
              if (targetView === 'exhibition' && homeSettings.showExhibitionPage === false) {
                targetView = homeSettings.showGalleryPage !== false ? 'gallery' : 'home';
              }
              if (targetView === 'photo-detail') {
                targetView =
                  homeSettings.showGalleryPage !== false
                    ? 'gallery'
                    : homeSettings.showExhibitionPage !== false
                    ? 'exhibition'
                    : 'home';
              }
              setActiveView(targetView);
            }}
            onSelectPhoto={setSelectedPhoto}
            onEditPhoto={handleEditPhotoClick}
            onDeletePhoto={handleDeletePhoto}
            onToggleFeatured={handleToggleFeatured}
            onToggleExhibitionPick={handleToggleExhibitionPick}
            onToggleLike={handleToggleLikePhoto}
            likedPhotoIds={likedPhotoIds}
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

      {/* Global Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] max-w-[90vw] md:max-w-md bg-[#111111] text-white text-xs md:text-sm font-medium px-4 py-3 rounded-xl shadow-2xl border border-[#333333] flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <span className="material-symbols-outlined text-emerald-400 text-base shrink-0">check_circle</span>
          <span className="flex-1 leading-snug">{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-white/60 hover:text-white shrink-0 ml-1 p-0.5 rounded transition-colors"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}
    </div>
  );
}
