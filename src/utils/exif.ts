import ExifReader from 'exifreader';

export interface ExtractedExifData {
  camera?: string;
  exif?: string;
  location?: string;
}

export async function extractExifFromFile(file: File): Promise<ExtractedExifData> {
  try {
    const tags = await ExifReader.load(file);
    return parseExifTags(tags);
  } catch (error) {
    console.warn('Could not read EXIF data from file:', error);
    return {};
  }
}

export async function extractExifFromUrl(url: string): Promise<ExtractedExifData> {
  try {
    // Only fetch CORS accessible URLs or Data URLs
    if (!url || (!url.startsWith('http') && !url.startsWith('data:'))) return {};
    
    let buffer: ArrayBuffer;
    if (url.startsWith('data:')) {
      const response = await fetch(url);
      buffer = await response.arrayBuffer();
    } else {
      const response = await fetch(url, { mode: 'cors' });
      if (!response.ok) return {};
      buffer = await response.arrayBuffer();
    }
    
    const tags = await ExifReader.load(buffer);
    return parseExifTags(tags);
  } catch (error) {
    console.warn('Could not fetch/read EXIF data from URL:', error);
    return {};
  }
}

function parseExifTags(tags: any): ExtractedExifData {
  const result: ExtractedExifData = {};

  // 1. Camera info (Make, Model, FocalLength, LensModel)
  const make = tags.Make?.description?.trim() || '';
  const model = tags.Model?.description?.trim() || '';
  const focalLength = tags.FocalLength?.description?.trim() || tags.FocalLengthIn35mmFilm?.description?.trim() || '';
  const lensModel = tags.LensModel?.description?.trim() || '';

  let cameraStr = '';
  if (model) {
    if (make && !model.toLowerCase().includes(make.toLowerCase())) {
      cameraStr = `${make} ${model}`;
    } else {
      cameraStr = model;
    }
  } else if (make) {
    cameraStr = make;
  }

  if (focalLength) {
    const formattedFocal = focalLength.endsWith('mm') ? focalLength : `${focalLength}mm`;
    cameraStr = cameraStr ? `${cameraStr} • ${formattedFocal}` : formattedFocal;
  } else if (lensModel) {
    cameraStr = cameraStr ? `${cameraStr} • ${lensModel}` : lensModel;
  }

  if (cameraStr) {
    result.camera = cameraStr;
  }

  // 2. Shutter / Aperture / ISO (f/2.8 • 1/250s • ISO 100)
  let fNumberStr = '';
  if (tags.FNumber?.description) {
    const fn = String(tags.FNumber.description).trim();
    fNumberStr = fn.toLowerCase().startsWith('f/') ? fn : `f/${fn}`;
  }

  let shutterStr = '';
  if (tags.ExposureTime?.description) {
    const et = String(tags.ExposureTime.description).trim();
    if (et.endsWith('s') || et.endsWith('sec')) {
      shutterStr = et.replace(/\s*sec$/, 's');
    } else {
      shutterStr = `${et}s`;
    }
  }

  let isoStr = '';
  const isoTag = tags.ISOSpeedRatings || tags.ISO || tags.PhotographicSensitivity;
  if (isoTag?.description) {
    const isoVal = String(isoTag.description).trim();
    isoStr = isoVal.toUpperCase().startsWith('ISO') ? isoVal : `ISO ${isoVal}`;
  }

  const exifParts = [fNumberStr, shutterStr, isoStr].filter(Boolean);
  if (exifParts.length > 0) {
    result.exif = exifParts.join(' • ');
  }

  return result;
}
