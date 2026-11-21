// Story hints, so nobody gets stuck for good.
// hintFor(state, level) → { from, text }
// level 1 = a gentle nudge, level 2 = a concrete tip.
// Story hints cost no points. (Hints INSIDE a station are the station's own and cost −5 there.)
// After two wrong tries at the safe, level 1 is already concrete: no one may stay stuck there.
// The final question has only one try, so its hints are the same two levels for everyone.
import { CASE, stationPlace, stationsByNumber } from './case-1.js';
import { allStationsSolved } from './engine.js';

export const HINT_GIVER = 'Imani';

export function hintFor(state, level = 1) {
  const concrete = level >= 2;
  if (state.ending !== null) {
    return hint('The case is closed. Start a new game if you want to see the other ending.');
  }
  if (!state.missionRead) {
    return hint('Your phone buzzed in the Portrait Hall. Read the message from M first.');
  }
  if (!allStationsSolved(state)) return stationHint(state, concrete);
  if (!state.safe.open) return safeHint(state, concrete);
  if (!state.accusation.solved) return accusationHint(state, concrete);
  return hint('There is no wrong choice now – only two different stories. Who should get the painting: Voss or Dr. Vale?');
}

function stationHint(state, concrete) {
  const open = stationsByNumber().filter(station => !state.stations[station.id].solved);
  if (!concrete) {
    return hint(`Four wings, four clues. Still open: ${open.map(stationPlace).join('; ')}. The order does not matter.`);
  }
  const next = open[0];
  // Before the Portrait Hall, the security office gives useful background.
  if (next.id === 'portraits' && !state.notes.includes('duty-roster')) {
    return hint('Before the Portrait Hall, read the shift schedule in the security office. Then: ' + next.task);
  }
  return hint(`Try the ${stationPlace(next)}: ${next.task}`);
}

function safeHint(state, concrete) {
  if (concrete || state.safe.attempts >= 2) {
    return hint(`Put the four letters from your journal in this order: ${CASE.stations.map(s => s.letter).join(' – ')}.`);
  }
  return hint('Four letters, one word: what every painter in this museum worked with.');
}

function accusationHint(state, concrete) {
  if (concrete) {
    return hint('A patron, initials A. V. – who fits both?');
  }
  return hint('Line up the four pieces of evidence: who approved the label, who booked the cart, whose “V” is it?');
}

function hint(text) {
  return { from: HINT_GIVER, text };
}
