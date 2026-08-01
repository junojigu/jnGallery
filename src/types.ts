export interface Category {
  id: string;
  name: string;
  icon: string;
  description?: string;
}

export interface Tag {
  id: string;
  name: string;
}

export interface Photo {
  id: string;
  title: string;
  description: string;
  url: string;
  categoryId: string;
  category?: string;
  tags: string[];
  aspectRatio?: 'square' | 'landscape' | 'portrait' | 'wide';
  date?: string;
  location?: string;
  camera?: string;
  exif?: string;
  featured?: boolean;
}

export type ActiveView = 'home' | 'gallery' | 'categories' | 'photo-detail' | 'exhibition';

export interface ExhibitionInfo {
  title: string;
  subtitle: string;
  period: string;
  introImage: string;
  introText: string;
  artistName: string;
  artistRole: string;
  artistPhoto: string;
  artistQuote: string;
  artistNote: string;
  exhibitionPhotoIds?: string[];
}

export interface HomeSettings {
  siteName?: string;
  heroImage: string;
  heroTitle: string;
  heroSubtitle: string;
  heroCtaText: string;
  aboutTitle: string;
  aboutDescription: string;
  feature1Icon: string;
  feature1Title: string;
  feature2Icon: string;
  feature2Title: string;
  aboutImage1: string;
  aboutImage2: string;
  cloudinaryCloudName?: string;
  cloudinaryUploadPreset?: string;
  googleSheetAppUrl?: string;
}
