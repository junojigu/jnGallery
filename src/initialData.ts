import { Category, Tag, Photo, HomeSettings, ExhibitionInfo } from './types';

export const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat-abstract', name: 'Abstract', icon: 'palette', description: 'Form, color, and texture studies.' },
  { id: 'cat-nature', name: 'Nature', icon: 'forest', description: 'Primary groupings for your collections.' },
  { id: 'cat-portrait', name: 'Portrait', icon: 'person', description: 'Human expression and character.' },
  { id: 'cat-architecture', name: 'Architecture', icon: 'domain', description: 'Lines, structures, and urban forms.' },
  { id: 'cat-street', name: 'Street', icon: 'directions_walk', description: 'Candid moments of everyday life.' },
];

export const INITIAL_TAGS: Tag[] = [
  { id: 'tag-nature', name: '#Nature' },
  { id: 'tag-portrait', name: '#Portrait' },
  { id: 'tag-street', name: '#Street' },
  { id: 'tag-architecture', name: '#Architecture' },
  { id: 'tag-abstract', name: '#Abstract' },
  { id: 'tag-1', name: '#blackandwhite' },
  { id: 'tag-2', name: '#macro' },
  { id: 'tag-3', name: '#film' },
  { id: 'tag-4', name: '#longexposure' },
  { id: 'tag-5', name: '#landscape' },
  { id: 'tag-6', name: '#mountains' },
  { id: 'tag-7', name: '#sea' },
];

export const INITIAL_PHOTOS: Photo[] = [
  {
    id: 'photo-1',
    title: 'Misty Peaks at Dawn',
    description: 'Captured during the early hours of the morning in the northern ranges. The interplay of light and mist creates a surreal, almost painting-like quality.',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBhjp0m_ks2zYErM-QVnIiDLAQba61H78smm3kfaiCX6pyoOYXVy_W2Ni0LgKuCgFVW0BATPx35QLgCH-Aas428ACa9fpOxgZXn4F7zlJR-jFWZdrD1ALk_6fPLJdV5RTzhvxejY_NC57orKiuwN-CIfsCyDtFfHiEqLLchLMPnHar3-J7ikeEbSp3NFkQy2vXG8UQrPiFLJ1HZSO7CgChuTRiMxcMgdTsTvz8nYyVSxzscwwxMSkCrRFxxAEmkNZBTDK5AmFQyKEc',
    categoryId: 'cat-nature',
    tags: ['#landscape', '#mountains', '#macro'],
    aspectRatio: 'landscape',
    date: 'October 24, 2023',
    location: 'Northern Alps, AT',
    camera: 'Sony A7R IV • 50mm',
    exif: 'f/8 • 1/250s • ISO 100',
    featured: true
  },
  {
    id: 'photo-2',
    title: 'Fern Unfurling',
    description: 'Macro study of woodland flora in spring, emphasizing fine detail and vibrant emerald contrasts.',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBMWvDT0o0rUq54N0x7uHM6zHQwydrPnFOWjneOvx0BZzEfNFTkI8trjBIlj5cdlN2z6BActsKQ_rowKUvlX2HShhmsfWxGPKEzKM5wIN4QaGCZizj-dreqhphu1gyDhrUWNL_kDUy9anqqz6P8aUvyTrQrnGhh_3dFkg60Wl7EFqfBSpmyT8aPd0bEEYFgQ2TJ0fvR4eOHLwD9DJMRQUGuhlXPEeLth4JcxSw-mdppw-ZkcjDf_eJZ0cs8X03q36ASUs6wimkogmE',
    categoryId: 'cat-nature',
    tags: ['#macro', '#film'],
    aspectRatio: 'square',
    date: 'May 12, 2023',
    location: 'Black Forest, DE',
    camera: 'Leica Q2 • 28mm Macro',
    exif: 'f/2.8 • 1/500s • ISO 200',
    featured: false
  },
  {
    id: 'photo-3',
    title: 'Urban Nature & Solitude',
    description: 'Contrast between brutalism and organic forms in an architectural courtyard.',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDMJqz-p7LVkX1phpspDn8kRFh5pkTVh9cE8XzS-y77YGRxpMxBGPCh49Gd3yRYsDVKwMqGJywk07OnYvDr3QDcoIjzV3-vY4vZYO4qTh5uN4snaZnt14bTlYWIWJcmIXW-t7i32fZZQMMorcAE9GwzRbuhShWA1R2m6iTKlHtET7Zn3oZtRIYElMCPLpT0zWcmL3MJHRtoFR0jLYY2aW-JNO15VjMnGlNnUuNFYx6MSdL2OwMD8mQs17AvxVQBKGCHA1y0qLrchMQ',
    categoryId: 'cat-architecture',
    tags: ['#blackandwhite', '#sea'],
    aspectRatio: 'portrait',
    date: 'November 15, 2023',
    location: 'Berlin, DE',
    camera: 'Fujifilm X-T4 • 35mm',
    exif: 'f/5.6 • 1/125s • ISO 160',
    featured: true
  },
  {
    id: 'photo-4',
    title: 'Glass Lake Reflections',
    description: 'Perfect reflections on a windless morning over a alpine pine lake.',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDB-Rf3PH5b1nTQy4ooufI9YrhE4B3vc1ccFT8Puy3r5Qoa2CpImphuJadqltwFPds9rF6TJsV_Ax9n15aMxh2bJtPyBvaKd5QwHodsLDFHpbytWWqUJdAkc08jqaKGM5p01gUQ0siFYtDWGZH03EXkNdKNxvojuv6A6a2e2feCNcV-o3Ygb4n0GOHZBZt5VwuaMcCkJtjnkkdXuAFHSiKEAWw40crSRqw-PC6evr2q4wCv0dkHTvb-iXayximYWEDvKZ_HDNMiyj0',
    categoryId: 'cat-nature',
    tags: ['#landscape', '#longexposure'],
    aspectRatio: 'wide',
    date: 'September 08, 2023',
    location: 'Lake Louise, CA',
    camera: 'Canon EOS R5 • 24-70mm',
    exif: 'f/11 • 1.5s • ISO 50',
    featured: false
  },
  {
    id: 'photo-5',
    title: 'Minimal Shadow & Texture',
    description: 'A delicate study of sunlight filtering across handmade fibrous paper.',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCvQ6Kas_zbel5gG8yvfjQ8Gf8ufPjxS9xRjOVQtS90EaiAvGNY4nGG60aly5Kyq9rMQ-3Fgnugj55z7I-9QjN_9VQr-c2OOYwNydL2YRGRiMkbjqyb1p1FAsGDoCvXeQzBpwBRaca8N9s5X_-EUl4wfTA1FzkFkYXq_0H_dYKh6CwCEqkKOzcvLVlAOKZdrVY0svZMJwAFS7CMbdrpVRHETXIzCwoHViLa2hbSpTtU2Tf4kCFqIwK00KKf2F65w5LgXeFQhoOdyYw',
    categoryId: 'cat-abstract',
    tags: ['#sea', '#blackandwhite'],
    aspectRatio: 'square',
    date: 'August 03, 2023',
    location: 'Kyoto, JP',
    camera: 'Hasselblad X1D II',
    exif: 'f/4.0 • 1/60s • ISO 100',
    featured: true
  },
  {
    id: 'photo-6',
    title: 'Silent Gallery Corridor',
    description: 'Modern exhibition museum space emphasizing soft light and architectural lines.',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDJEXFyQYaKEmyKcEPgSLirqujgFU6LBrJC9z7ejzCr1I5IVbz8cwUxOxox_r-gzRsdJAN-XsDLnADDdgSep4x17VEVV4ydcaPzpvxcdJiHLBZp_-AzaFgMnLAOyYG_QW-pY5Vr8tgi2ORbAOrmjaiYNDcvje2g2qUhOEUkNRLqznrsropl0H4JhKqkywuV-DypbQUwHzvhDKNQR0F_9gCJ3Bm6g2_A-gVutAETRu7FsS8hDu0KkSmBg3yGGy-oAvB56KTyV1iebYw',
    categoryId: 'cat-architecture',
    tags: ['#sea', '#blackandwhite'],
    aspectRatio: 'landscape',
    date: 'December 01, 2023',
    location: 'Zurich, CH',
    camera: 'Sony A7 IV • 16-35mm',
    exif: 'f/8.0 • 1/160s • ISO 100',
    featured: false
  },
  {
    id: 'photo-7',
    title: 'Subtle Expressions',
    description: 'A soft, natural light portrait capturing contemplation and depth.',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=1200',
    categoryId: 'cat-portrait',
    tags: ['#film', '#sea'],
    aspectRatio: 'portrait',
    date: 'January 10, 2024',
    location: 'Stockholm, SE',
    camera: 'Contax T2 • 38mm',
    exif: 'f/2.8 • 1/125s • Kodak Portra 400',
    featured: true
  },
  {
    id: 'photo-8',
    title: 'Rainy City Crossing',
    description: 'Candid reflection of neon and rain on pavement in downtown district.',
    url: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&q=80&w=1200',
    categoryId: 'cat-street',
    tags: ['#longexposure', '#film'],
    aspectRatio: 'wide',
    date: 'February 18, 2024',
    location: 'Tokyo, JP',
    camera: 'Ricoh GR III • 28mm',
    exif: 'f/2.8 • 1/60s • ISO 800',
    featured: false
  }
];

export const HERO_IMAGE = 'https://lh3.googleusercontent.com/aida-public/AB6AXuBSwIsnP_S6iNnmxsdCM-bM1IcFL2cw0HvSr0ICJ6RoFJ3LCgE18NPACkRRp7r_SE8FHYdN5kdzvI3NZAZa3EQQcy5Isxqro2xDNi4j0QR1SdT5bVwb2RMIGzays-9cdf0EDJWiqDxwmYyKDMv7P6PZQFvBzXowZtleMGumw9Zf1ILdOntSgizVR966gsggSVyWEFKeHkVQyE4-L-k_YbL63KHdcb2Uj-QLpaxXTrc1Uf1I_e1hGpVyFQ--3XjGGGB1dxQlY7ls-2A';

export const INITIAL_HOME_SETTINGS: HomeSettings = {
  siteName: 'jnGallery',
  heroImage: HERO_IMAGE,
  heroTitle: '순간의 기억을 담다',
  heroSubtitle: '자연, 초상, 건축, 그리고 일상의 아름다운 풍경을 감상할 수 있는 감성 사진 갤러리입니다.',
  heroCtaText: '갤러리 감상하기',
  aboutTitle: '시선과 기록',
  aboutDescription: '모든 사진에는 정지된 시간 속 찰나의 순간과 빛의 감성이 녹아있습니다. 자잘한 소음 없이 오롯이 이미지에 집중할 수 있는 나만의 갤러리 공간입니다.',
  feature1Icon: 'photo_library',
  feature1Title: '몰입형 갤러리',
  feature2Icon: 'view_cozy',
  feature2Title: '감성적인 그리드',
  aboutImage1: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDJEXFyQYaKEmyKcEPgSLirqujgFU6LBrJC9z7ejzCr1I5IVbz8cwUxOxox_r-gzRsdJAN-XsDLnADDdgSep4x17VEVV4ydcaPzpvxcdJiHLBZp_-AzaFgMnLAOyYG_QW-pY5Vr8tgi2ORbAOrmjaiYNDcvje2g2qUhOEUkNRLqznrsropl0H4JhKqkywuV-DypbQUwHzvhDKNQR0F_9gCJ3Bm6g2_A-gVutAETRu7FsS8hDu0KkSmBg3yGGy-oAvB56KTyV1iebYw',
  aboutImage2: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCvQ6Kas_zbel5gG8yvfjQ8Gf8ufPjxS9xRjOVQtS90EaiAvGNY4nGG60aly5Kyq9rMQ-3Fgnugj55z7I-9QjN_9VQr-c2OOYwNydL2YRGRiMkbjqyb1p1FAsGDoCvXeQzBpwBRaca8N9s5X_-EUl4wfTA1FzkFkYXq_0H_dYKh6CwCEqkKOzcvLVlAOKZdrVY0svZMJwAFS7CMbdrpVRHETXIzCwoHViLa2hbSpTtU2Tf4kCFqIwK00KKf2F65w5LgXeFQhoOdyYw',
  cloudinaryCloudName: 'ryhom5vw',
  cloudinaryUploadPreset: 'photo_gallery_preset',
  googleSheetAppUrl: 'https://script.google.com/macros/s/AKfycbzvRVU7ythOqAG6xy7WE87vs7g16U1UFglncVnC4CVsV4jBqeq0OtZHkkPsb49H4uo_/exec'
};

export const INITIAL_EXHIBITION_INFO: ExhibitionInfo = {
  title: '시선의 여정: 빛과 고요',
  subtitle: '일상의 스쳐 지나가는 순간 속 찰나의 기억들',
  period: '2026.08.01 - Permanent Online Exhibition',
  introImage: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&q=80&w=1200',
  introText: '이번 사진전 <시선의 여정>은 정지된 시간 속에서 빛과 그림자가 자아내는 고요한 아우라를 담아냅니다. 단순한 풍경 기록을 넘어, 우리가 지나치는 무심한 공간과 사물에 깃든 깊은 서사를 렌즈라는 시선을 통해 재조명합니다.',
  artistName: 'Juno',
  artistRole: 'Visual Artist / Photographer',
  artistPhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600',
  artistQuote: '카메라는 눈이 아닌 마음의 렌즈로 세상을 기록하는 정직한 거울입니다.',
  artistNote: '셔터를 누르는 순간, 세상의 소음은 사그라들고 오롯이 나와 피사체 간의 조용한 대화가 시작됩니다. 사진을 찍는 것은 피사체를 소유하는 것이 아니라, 순간의 감정과 빛의 온도를 간직하는 작업입니다.\n\n길거리의 차가운 빗방울, 해질녘 건물의 따스한 여운, 이름을 알 수 없는 스쳐가는 타인의 표정까지. 모든 사진에는 그 당시 내가 느꼈던 조용한 고독과 작은 설렘이 녹아있습니다.\n\n관람객 여러분께서도 이 사진들 앞을 거닐며 각자 잊고 지냈던 유일무이한 순간과 기억의 한 조각을 떠올리실 수 있기를 바랍니다.'
};
