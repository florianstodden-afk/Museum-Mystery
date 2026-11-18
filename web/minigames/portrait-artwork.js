// Station I: loads the portrait images.
// First the Met Collection API (checked carefully), otherwise the bundled copy in web/assets.
// The ORDER of the cards never comes from here – only from the frozen snapshot in case-1.js.
import { workById } from '../story/case-1.js';
import { PORTRAIT_IDS } from './portrait-rules.js';

export const PORTRAIT_ARTWORKS = Object.freeze(PORTRAIT_IDS.map(id => {
  const work = workById(id);
  return Object.freeze({
    id,
    title: work.title,             // full Met title, must match the API exactly
    shortTitle: work.shortTitle,
    artist: work.artist,
    date: work.date,
    medium: work.medium,
    url: work.url,
    api: `https://collectionapi.metmuseum.org/public/collection/v1/objects/${id}`,
    local: new URL(`../assets/met-${id}.jpg`, import.meta.url).href,
  });
}));

// Accepts the API answer only if it is exactly this public-domain work with an image from the Met.
export function verifiedImageUrl(data, artwork) {
  if (data?.objectID !== artwork.id || data.isPublicDomain !== true
    || data.title !== artwork.title || data.artistDisplayName !== artwork.artist) throw new Error('Unexpected artwork');
  const url = new URL(data.primaryImageSmall || data.primaryImage);
  if (url.protocol !== 'https:' || url.hostname !== 'images.metmuseum.org') throw new Error('Unexpected image source');
  return url.href;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const timeout = setTimeout(() => { image.src = ''; reject(new Error('Image timeout')); }, 6000);
    image.onload = () => { clearTimeout(timeout); resolve({ src }); };
    image.onerror = () => { clearTimeout(timeout); reject(new Error('Image unavailable')); };
    image.src = src;
  });
}

// One portrait: online if everything checks out, otherwise the bundled copy (offline: true).
export async function loadPortrait(artwork, { fetchData = fetch, readImage = loadImage } = {}) {
  try {
    const response = await fetchData(artwork.api, { signal: AbortSignal.timeout(6000) });
    if (!response.ok) throw new Error('Met API unavailable');
    const src = verifiedImageUrl(await response.json(), artwork);
    return { id: artwork.id, ...await readImage(src), offline: false };
  } catch {
    try {
      return { id: artwork.id, ...await readImage(artwork.local), offline: true };
    } catch {
      return { id: artwork.id, src: null, offline: true, failed: true };
    }
  }
}

// All portraits, in the order of PORTRAIT_ARTWORKS.
export function loadPortraits(options) {
  return Promise.all(PORTRAIT_ARTWORKS.map(artwork => loadPortrait(artwork, options)));
}
