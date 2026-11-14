export const ARTWORK = {
  id: 459111, title: 'Sea and Cliffs', artist: 'Auguste Renoir', date: 'ca. 1885',
  api: 'https://collectionapi.metmuseum.org/public/collection/v1/objects/459111',
  url: 'https://www.metmuseum.org/art/collection/search/459111',
  local: new URL('../assets/met-459111.jpg', import.meta.url).href,
};

export function verifiedImageUrl(data) {
  if (data?.objectID !== ARTWORK.id || data.isPublicDomain !== true
    || data.title !== ARTWORK.title || data.artistDisplayName !== ARTWORK.artist) throw new Error('Unexpected artwork');
  const url = new URL(data.primaryImageSmall || data.primaryImage);
  if (url.protocol !== 'https:' || url.hostname !== 'images.metmuseum.org') throw new Error('Unexpected image source');
  return url.href;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const timeout = setTimeout(() => { image.src = ''; reject(new Error('Image timeout')); }, 6000);
    image.onload = () => {
      clearTimeout(timeout);
      resolve({ src, width: image.naturalWidth, height: image.naturalHeight });
    };
    image.onerror = () => { clearTimeout(timeout); reject(new Error('Image unavailable')); };
    image.src = src;
  });
}

export async function loadArtwork({ fetchData = fetch, readImage = loadImage } = {}) {
  try {
    // Limit the whole metadata request, including reading its body.
    const response = await fetchData(ARTWORK.api, { signal: AbortSignal.timeout(6000) });
    if (!response.ok) throw new Error('Met API unavailable');
    const src = verifiedImageUrl(await response.json());
    return { ...await readImage(src), offline: false };
  } catch {
    try { return { ...await readImage(ARTWORK.local), offline: true }; }
    catch { throw new Error('The painting could not be loaded online or from the bundled copy. Please retry.'); }
  }
}
