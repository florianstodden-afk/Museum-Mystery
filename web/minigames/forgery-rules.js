// Ellipses traced from the five circles in the DT1946 answer key. Fractions are
// relative to the complete, uncropped image. IDs stay stable across resizes and saves.
export const regions = [
  [845, 156, 152], [431, 440, 148], [1889, 858, 165],
  [879, 1126, 170], [1340, 1203, 158],
].map(([x, y, radius]) => ({
  x: x / 2048, y: y / 1634, rx: radius / 2048, ry: radius / 1634,
}));

export const COOLDOWN_MS = 5000;
export const REQUIRED_FINDS = 3;
export function initialForgery() {
  return { found: [], startedAt: null, finishedAt: null, blockedUntil: 0, solved: false, mistakes: 0, hints: 0 };
}

export function validForgery(s) {
  const timestamp = value => Number.isFinite(value) && value >= 0;
  if (!s || !Array.isArray(s.found) || s.found.length > REQUIRED_FINDS
    || !s.found.every(i => Number.isInteger(i) && i >= 0 && i < regions.length)
    || new Set(s.found).size !== s.found.length || !timestamp(s.blockedUntil)
    || !Number.isInteger(s.mistakes) || s.mistakes < 0 || s.hints !== 0) return false;
  if (s.startedAt === null && (s.found.length || s.blockedUntil || s.mistakes)) return false;
  if (s.startedAt !== null && !timestamp(s.startedAt)) return false;
  const complete = s.found.length === REQUIRED_FINDS;
  return s.solved === complete && (complete
    ? timestamp(s.finishedAt) && s.startedAt !== null && s.finishedAt >= s.startedAt
    : s.finishedAt === null);
}

export function guess(state, x, y, now) {
  if (state.solved || state.startedAt === null || now < state.blockedUntil) return state;
  if (![x, y].every(v => Number.isFinite(v) && v >= 0 && v <= 1)) return state;
  const index = regions.findIndex(r => ((x - r.x) / r.rx) ** 2 + ((y - r.y) / r.ry) ** 2 <= 1);
  if (index < 0) return { ...state, blockedUntil: now + COOLDOWN_MS, mistakes: state.mistakes + 1 };
  if (state.found.includes(index)) return state;
  const found = [...state.found, index];
  const solved = found.length === REQUIRED_FINDS;
  return { ...state, found, solved, finishedAt: solved ? Math.max(state.startedAt, now) : null };
}
