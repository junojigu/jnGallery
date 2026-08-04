import { Category, Tag, Photo, HomeSettings, ExhibitionInfo, Exhibition } from './types';

export const INITIAL_EXHIBITIONS: Exhibition[] = [
  {
    "id": "exhibition-1",
    "title": "시선의 여정: 빛과 고요",
    "subtitle": "일상의 스쳐 지나가는 순간 속 찰나의 기억들",
    "period": "2026.08.01 - 진행 중",
    "status": "active",
    "introImage": "https://res.cloudinary.com/ryhom5vw/image/upload/v1785116441/DSCF6888_pdc9s2.jpg",
    "introText": "이번 사진전 <시선의 여정>은 정지된 시간 속에서 빛과 그림자가 자아내는 고요한 아우라를 담아냅니다. 단순한 풍경 기록을 넘어, 우리가 지나치는 무심한 공간과 사물에 깃든 깊은 서사를 렌즈라는 시선을 통해 재조명합니다.",
    "artistName": "Juno",
    "artistRole": "Visual Artist / Photographer",
    "artistPhoto": "https://res.cloudinary.com/ryhom5vw/image/upload/v1785421836/s9gbrrfs4tmtxozx7m1a.jpg",
    "artistQuote": "카메라는 눈이 아닌 마음의 렌즈로 세상을 기록하는 정직한 거울입니다.",
    "artistNote": "셔터를 누르는 순간, 세상의 소음은 사그라들고 오롯이 나와 피사체 간의 조용한 대화가 시작됩니다. 사진을 찍는 것은 피사체를 소유하는 것이 아니라, 순간의 감정과 빛의 온도를 간직하는 작업입니다.\n\n길거리의 차가운 빗방울, 해질녘 건물의 따스한 여운, 이름을 알 수 없는 스쳐가는 타인의 표정까지. 모든 사진에는 그 당시 내가 느꼈던 조용한 고독과 작은 설렘이 녹아있습니다.\n\n관람객 여러분께서도 이 사진들 앞을 거닐며 각자 잊고 지냈던 유일무이한 순간과 기억의 한 조각을 떠올리실 수 있기를 바랍니다.",
    "exhibitionPhotoIds": [
      "photo-1785813748048",
      "photo-1785755955104",
      "photo-1785755760672",
      "photo-1785755496342",
      "photo-1785755388560",
      "photo-1785684219035",
      "photo-1785683838615",
      "photo-1785683552432",
      "photo-1785682450199",
      "photo-1785681431442",
      "photo-1785465781816"
    ],
    "createdAt": "2026-08-01"
  }
];

export const INITIAL_EXHIBITION_INFO: ExhibitionInfo = INITIAL_EXHIBITIONS[0];

export const INITIAL_CATEGORIES: Category[] = [
  {
    "id": "cat-nature",
    "name": "Nature",
    "icon": "forest",
    "description": "Primary groupings for your collections."
  },
  {
    "id": "cat-portrait",
    "name": "Portrait",
    "icon": "person",
    "description": "Human expression and character."
  },
  {
    "id": "cat-street",
    "name": "Street",
    "icon": "directions_walk",
    "description": "Candid moments of everyday life."
  },
  {
    "id": "cat-architecture",
    "name": "Architecture",
    "icon": "domain",
    "description": "Lines, structures, and urban forms."
  },
  {
    "id": "cat-abstract",
    "name": "Abstract",
    "icon": "palette",
    "description": "Form, color, and texture studies."
  }
];

export const INITIAL_TAGS: Tag[] = [
  {
    "id": "tag-1",
    "name": "#Landscape"
  },
  {
    "id": "tag-3",
    "name": "#Film"
  },
  {
    "id": "tag-2",
    "name": "#Macro"
  },
  {
    "id": "tag-4",
    "name": "#LongExposure"
  },
  {
    "id": "tag-1785591732046-awy8",
    "name": "#BlackWhite"
  },
  {
    "id": "tag-1785465708580-iweq",
    "name": "#바위"
  },
  {
    "id": "tag-1785681431442-thel",
    "name": "#gallery"
  },
  {
    "id": "tag-1785681473728-phaa",
    "name": "#2005년"
  },
  {
    "id": "tag-1785681473728-82jb",
    "name": "#눈"
  },
  {
    "id": "tag-1785681473728-5fxl",
    "name": "#학교"
  },
  {
    "id": "tag-1785682450199-ubek",
    "name": "#남애항"
  },
  {
    "id": "tag-1785682450199-ykx3",
    "name": "#구름"
  },
  {
    "id": "tag-1785682450199-f2lv",
    "name": "#태풍"
  },
  {
    "id": "tag-1785683552432-drv9",
    "name": "#갈매기"
  },
  {
    "id": "tag-1785683552432-icu7",
    "name": "#바다"
  },
  {
    "id": "tag-1785683838615-o6vq",
    "name": "#주문진"
  },
  {
    "id": "tag-1785684219035-gu16",
    "name": "#나무"
  },
  {
    "id": "tag-1785755388561-qskq",
    "name": "#다중노출"
  },
  {
    "id": "tag-1785755388561-stgf",
    "name": "#꽃"
  },
  {
    "id": "tag-1785755388561-wc6d",
    "name": "#2006년"
  },
  {
    "id": "tag-1785755496342-mus8",
    "name": "#산"
  },
  {
    "id": "tag-1785755496342-v9rj",
    "name": "#야경"
  },
  {
    "id": "tag-1785755760672-mq9k",
    "name": "#단풍"
  },
  {
    "id": "tag-1785755955104-seh6",
    "name": "#이끼"
  }
];

export const INITIAL_PHOTOS: Photo[] = [
  {
    "id": "photo-1785813748048",
    "title": "교암",
    "description": "허균의 탄생 설화가 깃든 이무기 바위. 쩍 갈라진 틈으로 이무기가 나왔다는 전설.",
    "url": "https://res.cloudinary.com/ryhom5vw/image/upload/v1785813590/2026-08-04_115836_jgfb7b.jpg",
    "category": "Nature",
    "categoryId": "cat-nature",
    "aspectRatio": "landscape",
    "date": "August 4, 2026",
    "location": "Unknown Location",
    "camera": "Fuji X-T2",
    "exif": "",
    "featured": true,
    "tags": [
      "#Landscape",
      "#바위",
      "#LongExposure"
    ]
  },
  {
    "id": "photo-1785755955104",
    "title": "이끼와 단풍",
    "description": "장전계곡에서 이끼를 찍었다. 마침 다른 지역보다 일찍 떨어진 단풍이 여기저기 널브러져 있었다. 단풍과 이끼를 함께 다중노출로 찍었다.",
    "url": "https://res.cloudinary.com/ryhom5vw/image/upload/v1785755811/wuvpkffhiurhrrdanlhk.jpg",
    "category": "Nature",
    "categoryId": "cat-nature",
    "aspectRatio": "landscape",
    "date": "August 3, 2026",
    "location": "장전계곡",
    "camera": "CONTAX S2",
    "exif": "f/2.8 • 1/250s • ISO 100",
    "featured": false,
    "tags": [
      "#Landscape",
      "#다중노출",
      "#단풍",
      "#이끼",
      "#2006년"
    ]
  },
  {
    "id": "photo-1785755760672",
    "title": "방태산 단풍",
    "description": "방태산의 이단폭포를 지나 산 중턱 입구에서 계곡을 바라봤다. 단풍 사이로 햇살이 물가로 내려앉아 걸음을 멈추고 한참을 바라보던 장면이다. 함께 산행하던 일행에게 먼저 올라가라 하고 한참을 이 앙증맞은 장면을 촬영했다. 나중에 하산하다 이곳에 다시 들렀을 때는 다시는 이 느낌을 볼 수 없었다. 아름다운 풍경이 보이면 무조건 걸음을 멈춰야 한다. 나중은 없다!",
    "url": "https://res.cloudinary.com/ryhom5vw/image/upload/v1785755513/rguplmbntqh3ejbmtlzs.jpg",
    "category": "Nature",
    "categoryId": "cat-nature",
    "aspectRatio": "landscape",
    "date": "August 3, 2026",
    "location": "방태산",
    "camera": "CONTAX S2",
    "exif": "f/2.8 • 1/250s • ISO 100",
    "featured": false,
    "tags": [
      "#2006년",
      "#Landscape",
      "#단풍",
      "#산",
      "#Film",
      "#다중노출"
    ]
  },
  {
    "id": "photo-1785755496342",
    "title": "중청봉 야경",
    "description": "대청봉에서 본 중청봉의 야경을 보면 아직도 설렌다.",
    "url": "https://res.cloudinary.com/ryhom5vw/image/upload/v1785755410/bnuahas4rb0nlrzozdtk.jpg",
    "category": "Nature",
    "categoryId": "cat-nature",
    "aspectRatio": "landscape",
    "date": "August 3, 2026",
    "location": "중청봉",
    "camera": "CONTAX S2",
    "exif": "f/2.8 • 1/250s • ISO 100",
    "featured": false,
    "tags": [
      "#Landscape",
      "#Film",
      "#산",
      "#야경",
      "#2006년"
    ]
  },
  {
    "id": "photo-1785755388560",
    "title": "코스모스",
    "description": "No description provided.",
    "url": "https://res.cloudinary.com/ryhom5vw/image/upload/v1785754893/jlyj5mqn8zc7r8rx30kd.jpg",
    "category": "Nature",
    "categoryId": "cat-nature",
    "aspectRatio": "landscape",
    "date": "August 3, 2026",
    "location": "2006년",
    "camera": "CONTAX S2",
    "exif": "f/2.8 • 1/250s • ISO 100",
    "featured": false,
    "tags": [
      "#Landscape",
      "#Film",
      "#다중노출",
      "#꽃",
      "#2006년"
    ]
  },
  {
    "id": "photo-1785684219035",
    "title": "제왕산 고사목",
    "description": "제왕산에서 만난 고사목. 제왕산 지킴이 역할을 하고 있다.",
    "url": "https://res.cloudinary.com/ryhom5vw/image/upload/v1785684151/pjcwwnur1gzarmkxkluf.jpg",
    "category": "Nature",
    "categoryId": "cat-nature",
    "aspectRatio": "landscape",
    "date": "August 3, 2026",
    "location": "제왕산",
    "camera": "Canon EOS 10D • 17 mm",
    "exif": "f/11.0 • 1/400s • ISO 200",
    "featured": false,
    "tags": [
      "#Landscape",
      "#2005년",
      "#나무",
      "#BlackWhite"
    ]
  },
  {
    "id": "photo-1785683838615",
    "title": "주문진 생선 굽은 사람",
    "description": "주문진 어판장 옆에는 지금도 생선을 굽는 가게들이 즐비하다. 근처만 가면 냄새가 먼저 나를 유혹하고, 연기가 내 시선을 빼앗는다.",
    "url": "https://res.cloudinary.com/ryhom5vw/image/upload/v1785683704/xpc4cnph0mdnvg8hfqlj.jpg",
    "category": "Street",
    "categoryId": "cat-street",
    "aspectRatio": "landscape",
    "date": "August 3, 2026",
    "location": "주문진",
    "camera": "Canon EOS 10D • 50 mm",
    "exif": "f/5.6 • 1/400s • ISO 100",
    "featured": false,
    "tags": [
      "#2005년",
      "#주문진"
    ]
  },
  {
    "id": "photo-1785683552432",
    "title": "휴식",
    "description": "늦은 오후의 햇살이 남은 시간대. 갈매기들이 깃털을 고르고 있는 평화로운 시간.",
    "url": "https://res.cloudinary.com/ryhom5vw/image/upload/v1785683436/sbatocqqdbxfsaq1zgbt.jpg",
    "category": "Nature",
    "categoryId": "cat-nature",
    "aspectRatio": "landscape",
    "date": "August 3, 2026",
    "location": "",
    "camera": "Canon EOS 10D • 200 mm",
    "exif": "f/3.2 • 1/400s • ISO 200",
    "featured": false,
    "tags": [
      "#Landscape",
      "#2005년",
      "#갈매기",
      "#바다"
    ]
  },
  {
    "id": "photo-1785682450199",
    "title": "태풍 전",
    "description": "태풍이 오기 전날의 하늘 모습. 붉은 노을과 하늘을 비상하는 붕새와 같은 형상의 구름이 내 발길을 멈추게 하고 바라보게 한다. 이미 매미와 루사라는 태풍의 고통을 겪은 뒤이지만 신비로운 자연 현상은 넋을 잃고 바라만 보게 된다. (2005년)",
    "url": "https://res.cloudinary.com/ryhom5vw/image/upload/v1785682095/zjeslyprnwej1xfhcazb.jpg",
    "category": "Nature",
    "categoryId": "cat-nature",
    "aspectRatio": "landscape",
    "date": "August 2, 2026",
    "location": "Unknown Location",
    "camera": "Canon EOS 10D • 19 mm",
    "exif": "f/5.6 • 1/50s • ISO 100",
    "featured": false,
    "tags": [
      "#Landscape",
      "#남애항",
      "#구름",
      "#태풍",
      "#2005년",
      "#바다"
    ]
  },
  {
    "id": "photo-1785681431442",
    "title": "폭설에 등교",
    "description": "2005년 3월에 폭설. 학교로 등교하는 학생들의 뒷모습.",
    "url": "https://res.cloudinary.com/ryhom5vw/image/upload/v1785681167/qcnkxfoqpigitzmen3kc.jpg",
    "category": "Nature",
    "categoryId": "cat-nature",
    "aspectRatio": "landscape",
    "date": "August 2, 2026",
    "location": "Unknown Location",
    "camera": "Canon EOS 10D • 36 mm",
    "exif": "f/4.0 • 1/100s • ISO 200",
    "featured": true,
    "tags": [
      "#gallery",
      "#2005년",
      "#눈",
      "#학교"
    ]
  },
  {
    "id": "photo-1785465781816",
    "title": "바위섬",
    "description": "사천의 바위섬",
    "url": "https://res.cloudinary.com/ryhom5vw/image/upload/v1785116441/DSCF6888_pdc9s2.jpg",
    "category": "Nature",
    "categoryId": "cat-nature",
    "aspectRatio": "landscape",
    "date": "July 31, 2026",
    "location": "사천",
    "camera": "FUJIFILM X-T2 • 38.8 mm",
    "exif": "f/8.0 • 20s • ISO 200",
    "featured": true,
    "tags": [
      "#Landscape",
      "#바위",
      "#BlackWhite",
      "#LongExposure"
    ]
  }
];

export const INITIAL_HOME_SETTINGS: HomeSettings = {
  "siteName": "jnGalley",
  "showGalleryPage": true,
  "heroImage": "https://res.cloudinary.com/ryhom5vw/image/upload/v1785813590/2026-08-04_115836_jgfb7b.jpg",
  "heroTitle": "빛, 마주침, 감정, 기억",
  "heroSubtitle": "스쳐 지나가는 일상에 빛이 스며드는 순간과 마주치고 이를 사진으로 기록합니다. 불필요한 장식 없이 사진 본연의 온기와 감정만을 남겨, 잊고 지낸 소중한 기억을 언제든 꺼내어 볼 수 있는 공간을 만듭니다.",
  "heroCtaText": "Explore Your Gallery",
  "aboutTitle": "큐레이션의 의도",
  "aboutDescription": "사진이 다른 요소들과 어우러져 돋보일 수 있는 공간을 마련해야 한다고 믿습니다. 미니멀리즘을 추구하여 불필요한 요소들을 제거하고, 사진이 중심이 되는 깔끔한 캔버스를 만들어 드립니다. 모든 작업은 간결하고 직관적이며, 자연스럽고 아름답게 디자인되었습니다.",
  "feature1Icon": "photo_library",
  "feature1Title": "방해 요소 없는 디자인",
  "feature2Icon": "view_cozy",
  "feature2Title": "우아한 그리드",
  "aboutImage1": "https://lh3.googleusercontent.com/aida-public/AB6AXuDJEXFyQYaKEmyKcEPgSLirqujgFU6LBrJC9z7ejzCr1I5IVbz8cwUxOxox_r-gzRsdJAN-XsDLnADDdgSep4x17VEVV4ydcaPzpvxcdJiHLBZp_-AzaFgMnLAOyYG_QW-pY5Vr8tgi2ORbAOrmjaiYNDcvje2g2qUhOEUkNRLqznrsropl0H4JhKqkywuV-DypbQUwHzvhDKNQR0F_9gCJ3Bm6g2_A-gVutAETRu7FsS8hDu0KkSmBg3yGGy-oAvB56KTyV1iebYw",
  "aboutImage2": "https://lh3.googleusercontent.com/aida-public/AB6AXuCvQ6Kas_zbel5gG8yvfjQ8Gf8ufPjxS9xRjOVQtS90EaiAvGNY4nGG60aly5Kyq9rMQ-3Fgnugj55z7I-9QjN_9VQr-c2OOYwNydL2YRGRiMkbjqyb1p1FAsGDoCvXeQzBpwBRaca8N9s5X_-EUl4wfTA1FzkFkYXq_0H_dYKh6CwCEqkKOzcvLVlAOKZdrVY0svZMJwAFS7CMbdrpVRHETXIzCwoHViLa2hbSpTtU2Tf4kCFqIwK00KKf2F65w5LgXeFQhoOdyYw",
  "cloudinaryCloudName": "ryhom5vw",
  "cloudinaryUploadPreset": "photo_gallery_preset",
  "googleSheetAppUrl": "https://script.google.com/macros/s/AKfycbzvRVU7ythOqAG6xy7WE87vs7g16U1UFglncVnC4CVsV4jBqeq0OtZHkkPsb49H4uo_/exec"
};
