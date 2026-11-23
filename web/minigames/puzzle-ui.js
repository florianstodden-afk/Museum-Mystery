import { shortcutButton, showPopup, successPopup, speedBar, ensureStationStyles } from './station-ui.js?v=clock-note-1';

export { shortcutButton };

export function puzzleClock() {
  ensureStationStyles();
  const { root, update } = speedBar({
    tiers: [{ s: 0, p: 15 }, { s: 30, p: 10 }, { s: 45, p: 5 }, { s: 60, p: 0 }],
    label: 'Puzzle time',
  });
  return { clock: root, update };
}

export function puzzlePopup(pane, overlay, title, contents, action) {
  showPopup({ pane, overlay, label: title, contents, ...action });
}

export function puzzleReward(letter, points) {
  return successPopup({ headline: '', letter, points }).slice(1);
}
