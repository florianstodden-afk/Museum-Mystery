// Station I: small building blocks for the view. They only build HTML – no game rules here.
import { el, button } from '../story/dom.js';
import { PORTRAIT_ARTWORKS } from './portrait-artwork.js';

export const TASK = 'Memorise the dates, then sort oldest to newest.';
export const HELP = 'Click two cards (or press 1, 2, 3) to swap them, or drag a card. Enter checks the order.';

/** The artwork data for one Met object ID. */
export function artworkFor(id) {
  return PORTRAIT_ARTWORKS.find(artwork => artwork.id === id);
}

/** The clock block in the top right: time, small counters and the personal best. */
export function clockBlock() {
  const time = el('span', { className: 'portrait-time', text: '0:00', attrs: { role: 'timer', 'aria-label': 'Time' } });
  const counters = el('span', { className: 'portrait-counters' });
  const goal = el('span', { className: 'portrait-goal' });
  return { root: el('div', { className: 'portrait-clock' }, [time, el('span', { className: 'portrait-clock-sub' }, [counters, goal])]), time, counters, goal };
}

/** One line of task text with a small "?" that explains the controls. */
export function taskLine() {
  const help = el('span', { className: 'portrait-help-text', text: HELP, attrs: { id: 'portrait-help', role: 'tooltip' } });
  const mark = el('span', { className: 'portrait-help', text: '?', attrs: { tabindex: '0', 'aria-describedby': 'portrait-help', title: HELP } });
  return el('p', { className: 'portrait-task' }, [el('span', { text: TASK }), mark, help]);
}

/** One card: picture, artist, short title, a date chip (or Peek) and a small link to the Met. */
export function cardView(id, { onChoose, onPeek }) {
  const artwork = artworkFor(id);
  const img = el('img', { props: { alt: `${artwork.shortTitle} by ${artwork.artist}`, draggable: false } });
  const face = button('', () => onChoose(id), 'portrait-face');
  face.append(img);
  const chip = el('span', { className: 'portrait-chip', attrs: { 'aria-hidden': 'true' } });
  const peek = button('Peek', () => onPeek(id), 'portrait-peek');
  peek.setAttribute('aria-label', `Peek at the date of ${artwork.shortTitle} (+5 seconds)`);
  const link = el('a', { className: 'portrait-link', text: '↗', props: { href: artwork.url, target: '_blank', rel: 'noopener noreferrer' }, attrs: { 'aria-label': `${artwork.shortTitle} at The Met` } });
  const back = el('p', { className: 'portrait-back' });
  const front = el('div', { className: 'portrait-front' }, [
    face,
    el('strong', { className: 'portrait-artist', text: artwork.artist }),
    el('span', { className: 'portrait-title', text: artwork.shortTitle }),
    el('span', { className: 'portrait-meta' }, [chip, peek, link]),
  ]);
  const root = el('li', { className: 'portrait-card' }, [el('div', { className: 'portrait-inner' }, [front, back])]);
  return { root, face, img, chip, peek, back, artwork };
}

/** The timeline under the cards: three numbered places, oldest on the left. */
export function timelineView() {
  const dot = n => el('span', { className: 'portrait-slot', text: String(n) });
  const line = () => el('span', { className: 'portrait-line' });
  const bar = el('span', { className: 'portrait-flashbar' });
  return {
    root: el('div', { className: 'portrait-axis', attrs: { 'aria-hidden': 'true' } }, [
      el('div', { className: 'portrait-axis-row' }, [dot(1), line(), dot(2), line(), dot(3), el('span', { className: 'portrait-axis-label', text: 'Oldest → Newest' })]),
      bar,
    ]),
    bar,
  };
}

/** Footer: one short source line, an "i" that opens the full list, and an offline symbol. */
export function footerView() {
  const list = el('p', { className: 'portrait-sources' }, PORTRAIT_ARTWORKS.flatMap((artwork, index) => [
    index ? ' · ' : '', `${artwork.artist}, `,
    el('a', { text: artwork.shortTitle, props: { href: artwork.url, target: '_blank', rel: 'noopener noreferrer' } }),
  ]));
  list.hidden = true;
  const info = button('i', () => { list.hidden = !list.hidden; info.setAttribute('aria-expanded', String(!list.hidden)); }, 'portrait-info');
  info.setAttribute('aria-label', 'Image sources');
  info.setAttribute('aria-expanded', 'false');
  const offline = el('span', { className: 'portrait-offline', text: '⌂', attrs: { title: 'Saved Met copy', 'aria-label': 'Saved Met copy' } });
  offline.hidden = true;
  return { root: el('footer', { className: 'portrait-footer' }, [el('span', { text: 'Images: The Met · Public Domain' }), info, offline, list]), offline };
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
  link.href = new URL('./portrait-timeline.css?v=speedrun-1', import.meta.url).href;
  document.head.append(link);
}

/** localStorage, or null if the browser blocks it. */
export function safeStorage() {
  try { return globalThis.localStorage ?? null; } catch { return null; }
}
