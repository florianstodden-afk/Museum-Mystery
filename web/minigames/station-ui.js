// Shared building blocks for the minigame stations, in the look of Station L (picture-puzzle.js).
// They use L's CSS classes (puzzle-intro, puzzle-popup, puzzle-key, puzzle-time-track, puzzle-credit,
// puzzle-earned) from web/story/story.css, so a station that uses them looks exactly like L.
// The station's root element needs the class "picture-puzzle" for those rules to apply.
import { el, button } from '../story/dom.js';

const KEY_BADGES = { Enter: '↵', Escape: 'Esc', ArrowLeft: '←', ArrowRight: '→' };

/** A button with keyboard badges like L: "Start ↵", "Back to museum Esc". */
export function shortcutButton(label, action, ...keys) {
  const control = button(label, action);
  control.setAttribute('aria-keyshortcuts', keys.join(' '));
  control.append(...keys.map(key => el('kbd', { className: 'puzzle-key', text: KEY_BADGES[key] ?? key, attrs: { 'aria-hidden': 'true' } })));
  return control;
}

/** The intro above a station: one task line, the gold speed line, a round "?" and the Start/Back buttons. */
export function introPopup({ task, pointsText, onStart, onBack, onHelp }) {
  const help = button('?', onHelp, 'story-button puzzle-help');
  help.setAttribute('aria-label', 'Instructions');
  const intro = el('div', { className: 'puzzle-intro' }, [el('p', { text: task }), el('p', { text: pointsText }), help]);
  const startButton = shortcutButton('Start', onStart, 'Enter');
  const backButton = shortcutButton('Back to museum', onBack, 'Escape');
  return { intro, help, startButton, backButton, controls: el('div', { className: 'story-actions puzzle-actions' }) };
}

/** Shows a popup like L's (help or success) inside `overlay`, makes `pane` inert, focuses the one button.
 *  Returns a close function; `close.action` is the popup's button. */
export function showPopup({ overlay, pane, label, contents, actionLabel, onAction, keys = ['Enter', 'Escape'], secondary = null }) {
  pane.inert = true;
  const action = shortcutButton(actionLabel, onAction, ...keys);
  // An optional second button with its own key (e.g. "Learn about the art A"). The main button keeps the focus and Enter.
  const extra = secondary ? shortcutButton(secondary.label, secondary.onAction, secondary.key) : null;
  const buttons = extra ? el('div', { className: 'story-actions station-popup-actions' }, [action, extra]) : action;
  const dialog = el('div', { className: 'puzzle-popup', attrs: { role: 'dialog', 'aria-modal': 'true', 'aria-label': label } }, [...contents, buttons]);
  overlay.replaceChildren(el('div', { className: 'puzzle-overlay' }, [dialog]));
  action.focus?.();
  const close = () => { overlay.replaceChildren(); pane.inert = false; };
  close.action = action;   // so the station can press it with Enter or Esc
  close.secondary = extra; // and this one with its key
  close.secondaryKey = secondary?.key ?? null;
  return close;
}

/** The contents of the success popup: a headline, the letter slot "added to journal" and the points. */
export function successPopup({ headline, letter, points, extra = null }) {
  return [
    el('h3', { text: headline }),
    el('div', { className: 'story-slot is-found puzzle-letter' }, [el('span', { className: 'story-slot-letter', text: letter }), el('span', { className: 'story-slot-room', text: 'added to journal' })]),
    el('p', { className: 'puzzle-earned', text: `+${points} points earned` }),
    extra ? el('p', { className: 'story-muted station-extra', text: extra }) : null,
  ].filter(Boolean);
}

/** "Learn about the art": one card per work (image, artist, title, year, a short text), ← → to browse.
 *  works: [{ artist, title, date, image, text }]. Opens like showPopup and returns its close function;
 *  `close.handleKey(event)` handles ← → (true if used). Any station can reuse it with its own texts. */
export function artCards({ overlay, pane, works, onClose, closeLabel = 'Back to museum' }) {
  let index = 0;
  const img = el('img', { className: 'art-card-image' });
  const artist = el('p', { className: 'art-card-artist' });
  const title = el('h3', { className: 'art-card-title' });
  const text = el('p', { className: 'art-card-text' });
  const count = el('p', { className: 'story-muted art-card-count', attrs: { 'aria-live': 'polite' } });
  const card = el('article', { className: 'art-card', attrs: { tabindex: '-1' } }, [img, el('div', { className: 'art-card-body' }, [artist, title, text, count])]);
  const prev = shortcutButton('Previous', () => show(index - 1), 'ArrowLeft');
  const next = shortcutButton('Next', () => show(index + 1), 'ArrowRight');
  function show(i) {
    index = (i + works.length) % works.length;
    const work = works[index];
    img.src = work.image;
    img.alt = `${work.artist}, ${work.title}`;
    artist.textContent = work.artist;
    title.textContent = `${work.title}, ${work.date}`;
    text.textContent = work.text;
    count.textContent = `${index + 1} / ${works.length}`;
  }
  show(0);
  const close = showPopup({
    overlay, pane, label: 'Learn about the art', actionLabel: closeLabel, onAction: onClose, keys: ['Escape'],
    contents: [el('div', { className: 'art-cards' }, [card, el('div', { className: 'story-actions art-card-nav' }, [prev, next])])],
  });
  card.focus?.();   // focus starts on the first card
  close.handleKey = event => {
    const step = { ArrowLeft: -1, ArrowRight: 1 }[event.key];
    if (!step) return false;
    show(index + step);
    return true;
  };
  close.current = () => index;
  return close;
}

/** Native, keyboard-accessible disclosure; credits stay collapsed until requested. */
export function artworkDetails(...contents) {
  return el('details', { className: 'artwork-details' }, [
    el('summary', { text: 'Artwork details' }),
    el('div', { className: 'artwork-details-content' }, contents),
  ]);
}

/** One credit line like L: "Artist, Title, date · …. Public domain · The Metropolitan Museum of Art".
 *  `dates: false` leaves the years out (Station I: the years are the puzzle). */
export function creditLine(artworks, { dates = true } = {}) {
  const parts = artworks.map(a => [a.artist, a.shortTitle ?? a.title, dates ? a.date : null].filter(Boolean).join(', ')).join(' · ');
  const link = el('a', { text: 'The Metropolitan Museum of Art', props: { href: 'https://www.metmuseum.org/art/collection', target: '_blank', rel: 'noopener noreferrer' } });
  return el('p', { className: 'story-muted puzzle-credit' }, [`${parts}. Public domain · `, link]);
}

// ---------- Speed bar ----------

/** The bar's scale in seconds: a bit past the last tier, like L (tiers 0/30/45/60 → 70 s). */
export function speedScale(tiers) {
  const last = tiers[tiers.length - 1].s;
  const before = tiers[tiers.length - 2]?.s ?? 0;
  return last + Math.round((last - before) * 2 / 3);
}

/** Points for a time: the last tier whose start (seconds) has been reached. */
export function tierPoints(tiers, ms) {
  let points = tiers[0].p;
  for (const tier of tiers) if (ms > tier.s * 1000) points = tier.p;
  return points;
}

/** Where things sit on the bar, in percent: each tier's mark and the width of each reward label. */
export function speedLayout(tiers) {
  const scale = speedScale(tiers);
  const marks = tiers.map(tier => (tier.s / scale) * 100);
  const widths = marks.map((start, i) => (marks[i + 1] ?? 100) - start);
  return { scale, marks, widths };
}

/** L's points bar with any tiers, e.g. [{s:0,p:15},{s:20,p:10},{s:35,p:5},{s:50,p:0}]. Returns { root, update(ms) }. */
export function speedBar({ tiers, label = 'Time' }) {
  const { scale, marks, widths } = speedLayout(tiers);
  const fill = el('div', { className: 'puzzle-time-fill' });
  const track = el('div', { className: 'puzzle-time-track station-time-track', attrs: { role: 'progressbar', 'aria-label': label, 'aria-valuemin': '0', 'aria-valuemax': String(scale) } }, [fill]);
  // The thin lines on the track at each tier (L draws its own fixed ones).
  track.style.setProperty('--ticks', marks.slice(1).map(m => `transparent ${m - 0.25}%, #ead7a3 ${m - 0.25}% ${m + 0.25}%, transparent ${m + 0.25}%`).join(', '));
  const rewards = el('div', { className: 'puzzle-time-rewards' }, tiers.map(tier => el('span', { text: `+${tier.p} points` })));
  rewards.style.gridTemplateColumns = widths.map(w => `${w.toFixed(2)}fr`).join(' ');
  const markRow = el('div', { className: 'puzzle-time-marks station-time-marks' }, tiers.map((tier, i) => {
    const mark = el('span', { text: `${tier.s}s` });
    if (i > 0) mark.style.left = `${marks[i].toFixed(3)}%`;
    return mark;
  }));
  const root = el('div', { className: 'puzzle-clock' }, [rewards, track, markRow]);
  function update(ms) {
    const seconds = Math.floor(ms / 1000);
    fill.style.width = `${Math.min(100, (ms / 10) / scale)}%`;
    track.setAttribute('aria-valuenow', String(Math.min(scale, seconds)));
    track.setAttribute('aria-valuetext', `${seconds} seconds; ${tierPoints(tiers, ms)} points on completion`);
  }
  update(0);
  return { root, update };
}

/** Adds station-ui.css once (the few rules L does not have, e.g. custom tick marks). */
export function ensureStationStyles() {
  if (typeof document === 'undefined' || !document.head || document.getElementById('station-ui-css')) return;
  const link = document.createElement('link');
  link.id = 'station-ui-css';
  link.rel = 'stylesheet';
  link.href = new URL('./station-ui.css?v=art-cards-2', import.meta.url).href;
  document.head.append(link);
}
