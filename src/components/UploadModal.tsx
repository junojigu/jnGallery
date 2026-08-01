import React, { useState } from 'react';
import { Category, Tag, Photo } from '../types';
import { extractExifFromFile, extractExifFromUrl } from '../utils/exif';

interface UploadModalProps {
  isOpen: boolean;
  categories: Category[];
  tags: Tag[];
  cloudinaryCloudName?: string;
  cloudinaryUploadPreset?: string;
  onClose: () => void;
  onUpload: (photo: Omit<Photo, 'id'>) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  categories,
  tags,
  cloudinaryCloudName,
  cloudinaryUploadPreset,
  onClose,
  onUpload,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || 'cat-nature');
  const [selectedTagNames, setSelectedTagNames] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState('');
  const [location, setLocation] = useState('');
  const [camera, setCamera] = useState('');
  const [exif, setExif] = useState('');
  const [featured, setFeatured] = useState(false);
  const [isUploadingCloudinary, setIsUploadingCloudinary] = useState(false);
  const [cloudinaryError, setCloudinaryError] = useState<string | null>(null);
  const [exifNotice, setExifNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const compressImageFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height = Math.round((height * MAX_WIDTH) / width);
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width = Math.round((width * MAX_HEIGHT) / height);
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          resolve(dataUrl);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleExtractExifFromUrl = async (targetUrl: string) => {
    if (!targetUrl) return;
    try {
      setExifNotice('📸 URL 이미지에서 EXIF 메타데이터를 분석 중입니다...');
      const extracted = await extractExifFromUrl(targetUrl);
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
        setExifNotice(`✨ EXIF 메타데이터 자동 입력 완료! (${detectedItems.join(' | ')})`);
      } else {
        setExifNotice('ℹ️ 선택한 이미지에서 EXIF 메타데이터를 찾지 못했습니다. 직접 입력할 수 있습니다.');
      }
    } catch {
      setExifNotice(null);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCloudinaryError(null);
    setExifNotice('📸 선택한 이미지의 EXIF 메타데이터(카메라, 셔터/ISO)를 불러오는 중...');

    // Extract EXIF data from local file immediately
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
        setExifNotice(`✨ EXIF 메타데이터 자동 입력 완료! (${detectedItems.join(' | ')})`);
      } else {
        setExifNotice('ℹ️ 선택한 사진에서 EXIF 메타데이터를 찾지 못했습니다. 직접 작성하실 수 있습니다.');
      }
    } catch (err) {
      console.warn('EXIF read error:', err);
      setExifNotice(null);
    }

    // Check if Cloudinary is configured
    if (cloudinaryCloudName && cloudinaryUploadPreset) {
      setIsUploadingCloudinary(true);
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', cloudinaryUploadPreset);

        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudinaryCloudName}/image/upload`,
          {
            method: 'POST',
            body: formData,
          }
        );

        const data = await response.json();
        if (data.secure_url) {
          setImageUrl(data.secure_url);
        } else {
          throw new Error(data.error?.message || 'Cloudinary upload failed');
        }
      } catch (err: any) {
        console.error('Cloudinary upload error:', err);
        setCloudinaryError(`Cloudinary 업로드 실패: ${err.message || '설정을 확인해주세요.'}`);
        // Fallback to compressed local Data URL
        try {
          const compressed = await compressImageFile(file);
          setImageUrl(compressed);
        } catch {
          const reader = new FileReader();
          reader.onload = (event) => {
            if (event.target?.result) setImageUrl(event.target.result as string);
          };
          reader.readAsDataURL(file);
        }
      } finally {
        setIsUploadingCloudinary(false);
      }
    } else {
      // Standard local file read with automatic canvas compression
      try {
        const compressed = await compressImageFile(file);
        setImageUrl(compressed);
      } catch {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setImageUrl(event.target.result as string);
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleToggleTag = (tagName: string) => {
    if (selectedTagNames.includes(tagName)) {
      setSelectedTagNames(selectedTagNames.filter((t) => t !== tagName));
    } else {
      setSelectedTagNames([...selectedTagNames, tagName]);
    }
  };

  const handleAddCustomTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && customTag.trim()) {
      e.preventDefault();
      const parts = customTag.split(/[\s,]+/).filter(Boolean);
      const updated = [...selectedTagNames];
      parts.forEach((part) => {
        const formatted = part.startsWith('#') ? part.trim() : `#${part.trim()}`;
        if (formatted.length > 1 && !updated.includes(formatted)) {
          updated.push(formatted);
        }
      });
      setSelectedTagNames(updated);
      setCustomTag('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !imageUrl.trim()) return;

    let finalTags = [...selectedTagNames];
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

    onUpload({
      title: title.trim(),
      description: description.trim() || 'No description provided.',
      url: imageUrl.trim(),
      categoryId,
      category: matchedCat?.name || categoryId,
      tags: finalTags.length > 0 ? finalTags : ['#gallery'],
      aspectRatio: 'landscape',
      date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      location: location.trim() || 'Unknown Location',
      camera: camera.trim() || 'Digital Camera',
      exif: exif.trim() || 'f/2.8 • 1/250s • ISO 100',
      featured
    });

    // Reset fields
    setTitle('');
    setDescription('');
    setImageUrl('');
    setSelectedTagNames([]);
    setCustomTag('');
    setLocation('');
    setCamera('');
    setExif('');
    setFeatured(false);
    onClose();
  };

  // Sample quick hotlinks
  const sampleLinks = [
    { label: 'Misty Mountains', url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&q=80&w=1200' },
    { label: 'Architecture', url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=1200' },
    { label: 'Forest Stream', url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&q=80&w=1200' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl max-w-xl w-full p-6 md:p-8 ambient-shadow border border-[#c4c7c7]/30 my-8">
        <div className="flex justify-between items-center mb-6 border-b border-[#e2e2e2] pb-4">
          <div>
            <h2 className="font-serif text-2xl font-semibold text-[#000000]">Upload Photo</h2>
            <p className="text-xs text-[#444748] mt-1">Add a new image via hotlink URL or local file.</p>
          </div>
          <button
            onClick={onClose}
            className="text-[#747878] hover:text-[#000000] p-1 rounded-lg transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Image Source Selection */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#444748] mb-2">
              Image Source (File or Hotlink URL)
            </label>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <label className="border-2 border-dashed border-[#c4c7c7] rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer hover:border-[#000000] hover:bg-[#f3f3f4] transition-colors relative">
                {isUploadingCloudinary ? (
                  <div className="flex flex-col items-center gap-1">
                    <span className="material-symbols-outlined text-2xl text-amber-500 animate-spin">sync</span>
                    <span className="text-xs text-amber-600 font-semibold">Cloudinary 업로드 중...</span>
                  </div>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-2xl text-[#747878] mb-1">upload_file</span>
                    <span className="text-xs text-[#444748] font-medium">Choose Local File</span>
                    {cloudinaryCloudName && (
                      <span className="text-[10px] text-emerald-600 font-mono mt-0.5">☁️ Cloudinary Auto Upload</span>
                    )}
                  </>
                )}
                <input type="file" accept="image/*" onChange={handleFileChange} disabled={isUploadingCloudinary} className="hidden" />
              </label>

              <div className="flex flex-col justify-center">
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://... (Hotlink Image URL)"
                  className="w-full bg-[#f9f9f9] border border-[#c4c7c7] rounded-lg px-3 py-2 text-xs text-[#000000] focus:outline-none focus:border-[#000000]"
                />
                <span className="text-[11px] text-[#747878] mt-1">Direct HTML hotlinks supported.</span>
              </div>
            </div>

            {cloudinaryError && (
              <div className="text-xs text-red-600 bg-red-50 p-2 rounded-lg border border-red-200 mb-2">
                {cloudinaryError}
              </div>
            )}

            {/* Quick hotlink buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] text-[#747878]">Presets:</span>
              {sampleLinks.map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setImageUrl(sample.url);
                    handleExtractExifFromUrl(sample.url);
                  }}
                  className="text-[11px] bg-[#e2e2e2] text-[#1a1c1c] hover:bg-[#dcdddd] px-2 py-0.5 rounded cursor-pointer transition-colors"
                >
                  {sample.label}
                </button>
              ))}
            </div>

            {/* Preview */}
            {imageUrl && (
              <div className="mt-3 relative w-full h-40 rounded-lg overflow-hidden border border-[#c4c7c7] bg-[#f3f3f4]">
                <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          {/* Title & Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#444748] mb-1">
                Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Autumn Morning Light"
                className="w-full bg-[#f9f9f9] border border-[#c4c7c7] rounded-lg px-3 py-2 text-sm text-[#000000] focus:outline-none focus:border-[#000000]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#444748] mb-1">
                Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-[#f9f9f9] border border-[#c4c7c7] rounded-lg px-3 py-2 text-sm text-[#000000] focus:outline-none focus:border-[#000000]"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#444748] mb-1">
              Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the context, mood, or capture technique..."
              className="w-full bg-[#f9f9f9] border border-[#c4c7c7] rounded-lg px-3 py-2 text-sm text-[#000000] focus:outline-none focus:border-[#000000]"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#444748] mb-1">
              Tags
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {Array.from(new Set([...tags.map((t) => t.name), ...selectedTagNames])).map((tagName) => {
                const isSelected = selectedTagNames.includes(tagName);
                return (
                  <button
                    key={tagName}
                    type="button"
                    onClick={() => handleToggleTag(tagName)}
                    className={`text-xs px-2.5 py-1 rounded-full transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#000000] text-white'
                        : 'bg-[#f3f3f4] text-[#444748] hover:bg-[#e2e2e2]'
                    }`}
                  >
                    {tagName.startsWith('#') ? tagName : `#${tagName}`}
                  </button>
                );
              })}
            </div>
            <input
              type="text"
              value={customTag}
              onChange={(e) => setCustomTag(e.target.value)}
              onKeyDown={handleAddCustomTag}
              placeholder="태그 입력 (예: #sunset #ocean 또는 #sunset, #ocean 입력 후 Enter)"
              className="w-full bg-[#f9f9f9] border border-[#c4c7c7] rounded-lg px-3 py-1.5 text-xs text-[#000000] focus:outline-none focus:border-[#000000]"
            />
          </div>

          {/* EXIF Metadata */}
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
                  <span>Camera (카메라 모델)</span>
                  <span className="text-[10px] text-amber-600 font-normal">EXIF 자동 감지</span>
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
                  <span>Shutter / ISO (촬영 정보)</span>
                  <span className="text-[10px] text-amber-600 font-normal">EXIF 자동 감지</span>
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

          {/* Featured option */}
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
                <span>관리자 추천작으로 등록 (Featured)</span>
              </span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-[#e2e2e2]">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 border border-[#747878] text-[#000000] rounded-lg text-xs font-medium hover:bg-[#e2e2e2] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || !imageUrl.trim()}
              className="px-6 py-2 bg-[#000000] text-white rounded-lg text-xs font-medium hover:bg-opacity-90 disabled:opacity-40 transition-opacity cursor-pointer"
            >
              Publish Photo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
