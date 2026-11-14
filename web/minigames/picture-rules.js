// Eight pieces, numbered by their original position: four columns, two rows.
export function shuffledPieces(random = Math.random) {
  const pieces = Array.from({ length: 8 }, (_, i) => i);
  for (let i = pieces.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [pieces[i], pieces[j]] = [pieces[j], pieces[i]];
  }
  // Even an unlucky shuffle must not show the solution in the tray.
  if (pieces.every((piece, index) => piece === index)) pieces.push(pieces.shift());
  return pieces;
}

export function initialPuzzle(random = Math.random) {
  return { order: shuffledPieces(random), slots: Array(8).fill(null),
    startedAt: null, finishedAt: null, solved: false, mistakes: 0, hints: 0 };
}

const pieceId = value => Number.isInteger(value) && value >= 0 && value < 8;
export function validPuzzle(state) {
  if (!state || !Array.isArray(state.order) || state.order.length !== 8
    || !state.order.every(pieceId) || new Set(state.order).size !== 8
    || !Array.isArray(state.slots) || state.slots.length !== 8
    || !state.slots.every(value => value === null || pieceId(value))) return false;
  const placed = state.slots.filter(value => value !== null);
  if (new Set(placed).size !== placed.length) return false;
  const timestamp = value => Number.isFinite(value) && value >= 0;
  if (state.startedAt !== null && !timestamp(state.startedAt)) return false;
  if (state.finishedAt !== null && (!timestamp(state.finishedAt)
    || state.startedAt === null || state.finishedAt < state.startedAt)) return false;
  if (state.startedAt === null && placed.length) return false;
  const complete = state.slots.every((piece, index) => piece === index);
  return state.solved === complete && (state.finishedAt !== null) === complete;
}

export function startPuzzle(state, now = Date.now()) {
  return state.startedAt !== null || state.solved ? state : { ...state, startedAt: now };
}

// null means return to the tray. Invalid or occupied targets leave the board alone.
export function placePiece(state, piece, target, now = Date.now()) {
  if (state.solved || state.startedAt === null || !pieceId(piece)
    || (target !== null && (!pieceId(target) || state.slots[target] !== null))) return state;
  const slots = state.slots.map(value => value === piece ? null : value);
  if (target !== null) slots[target] = piece;
  if (slots.every((value, index) => value === state.slots[index])) return state;
  const solved = slots.every((value, index) => value === index);
  return { ...state, slots, solved, finishedAt: solved ? Math.max(now, state.startedAt) : null };
}

export function elapsedMs(state, now = Date.now()) {
  return state?.startedAt == null ? 0 : Math.max(0, (state.finishedAt ?? now) - state.startedAt);
}
