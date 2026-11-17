// Station I: small building blocks for the cards. They only build HTML – no game rules here.
// The parts every station shares (intro, speed bar, popups, credit) are in station-ui.js.
import { el, button } from '../story/dom.js';
import { PORTRAIT_ARTWORKS } from './portrait-artwork.js';

/** The artwork data for one Met object ID. */
export function artworkFor(id) {
  return PORTRAIT_ARTWORKS.find(artwork => artwork.id === id);
}

// Which part of each painting stays visible in the equal frames: the face (Degas sits on the right).
const FOCUS = { 436121: '88% 30%', 12127: '50% 8%', 435876: '50% 10%' };

/** One card: picture in a gold frame, artist, short title, and a date chip (or Peek) below. */
export function cardView(id, { onChoose, onPeek }) {
  const artwork = artworkFor(id);
  const img = el('img', { props: { alt: `${artwork.shortTitle} by ${artwork.artist}`, draggable: false } });
  img.style.setProperty('--focus', FOCUS[id] ?? '50% 0%');
  const face = button('', () => onChoose(id), 'portrait-face');
  face.append(img);
  const chip = el('span', { className: 'portrait-chip', attrs: { 'aria-hidden': 'true' } });
  const peek = button('Peek', () => onPeek(id), 'portrait-peek');
  peek.setAttribute('aria-label', `Peek at the date of ${artwork.shortTitle} (+5 seconds)`);
  const back = el('p', { className: 'portrait-back' });
  const front = el('div', { className: 'portrait-front' }, [
    face,
    el('strong', { className: 'portrait-artist', text: artwork.artist }),
    el('span', { className: 'portrait-title', text: artwork.shortTitle }),
    el('span', { className: 'portrait-meta' }, [chip, peek]),
  ]);
  const root = el('li', { className: 'portrait-card' }, [el('div', { className: 'portrait-inner' }, [front, back])]);
  return { root, face, img, chip, peek, back, artwork };
}

/** The timeline under the cards: three numbered places, oldest on the left, plus the scan progress bar. */
export function timelineView() {
  const slots = [1, 2, 3].map(n => el('span', { className: 'portrait-slot', text: String(n) }));
  const line = () => el('span', { className: 'portrait-line' });
  const bar = el('span', { className: 'portrait-flashbar' });
  return {
    root: el('div', { className: 'portrait-axis', attrs: { 'aria-hidden': 'true' } }, [
      el('div', { className: 'portrait-axis-row' }, [slots[0], line(), slots[1], line(), slots[2], el('span', { className: 'portrait-axis-label', text: 'Oldest → Newest' })]),
      bar,
    ]),
    slots,
    bar,
  };
}

/** Reads and writes the personal best time. Broken storage just means "no best yet". */
export function bestTimeStore(storage, key = 'museum-nocturne-portrait-best-v1') {
  return {
    get() { try { const ms = Number(storage?.getItem(key)); return ms > 0 ? ms : null; } catch { return null; } },
    offer(ms) {
      const best = this.get();
      if (best !== null && best <= ms) return best;
      try { storage?.setItem(key, String(ms)); } catch { /* no saving, still fine */ }
      return ms;
    },
  };
}

/** Adds the station's own stylesheet once, so no shared CSS file has to change. */
export function ensureStylesheet() {
  if (typeof document === 'undefined' || !document.head || document.getElementById('portrait-timeline-css')) return;
  const link = document.createElement('link');
  link.id = 'portrait-timeline-css';
  link.rel = 'stylesheet';
  link.href = new URL('./portrait-timeline.css?v=look-like-l-1', import.meta.url).href;
  document.head.append(link);
}

/** localStorage, or null if the browser blocks it. */
export function safeStorage() {
  try { return globalThis.localStorage ?? null; } catch { return null; }
}
