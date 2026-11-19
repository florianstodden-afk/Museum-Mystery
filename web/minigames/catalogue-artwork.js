import { CATALOGUE_ARTWORKS } from './catalogue-data.js';

export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const timeout = setTimeout(() => { image.src = ''; reject(new Error('Image timeout')); }, 8000);
    image.onload = async () => {
      try {
        await image.decode();
        if (!image.naturalWidth || !image.naturalHeight) throw new Error('Empty image');
        clearTimeout(timeout);
        resolve({ src, width: image.naturalWidth, height: image.naturalHeight });
      } catch (error) { clearTimeout(timeout); reject(error); }
    };
    image.onerror = () => { clearTimeout(timeout); reject(new Error('Image unavailable')); };
    image.src = src;
  });
}

// Local first: these are checked Met images, so a Met outage cannot change the set or block play.
// If a bundled file is unavailable, try its checked public-domain Met source.
export async function loadCatalogue({ readImage = loadImage } = {}) {
  try {
    return await Promise.all(CATALOGUE_ARTWORKS.map(async work => {
      const local = new URL(`../assets/catalogue/met-${work.id}.jpg`, import.meta.url).href;
      let image;
      try { image = await readImage(local); }
      catch { image = await readImage(work.image); }
      if (!image?.src || !(image.width > 0) || !(image.height > 0)) throw new Error('Invalid image');
      return { ...image, id: work.id };
    }));
  } catch {
    throw new Error('All four artworks must load before you can play. Please retry.');
  }
}
