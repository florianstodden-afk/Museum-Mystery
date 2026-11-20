// The investigation journal: first a pure data model, then a renderer for any container.
import { CASE, noteById, stationsByNumber } from './case-1.js';
import { nextStep } from './engine.js';
import { totalScore, maximumScore } from './scoring.js';
import { el } from './dom.js';

// Which evidence points to Voss, in the fixed station order. Used by journal, accusation and endings.
export function evidenceChain(state) {
  return CASE.stations.map(station => ({
    id: station.evidenceId,
    room: station.room,
    letter: station.letter,
    text: station.evidence,
    pointsToVoss: station.pointsToVoss,
    found: state.evidence.includes(station.evidenceId),
  }));
}

export const WHO_WAS_M = {
  id: 'who-was-m',
  title: 'Case notes · Who was M?',
  text: 'M was Adrien Voss. He signs private letters with “M”, for mécène, the old word for patron. Everyone thought it meant Mara Vale.',
};

export function journalModel(state) {
  return {
    mission: { title: CASE.mission.title, text: CASE.mission.text, read: state.missionRead },
    // By station number, not in code-word order: the gaps must not give the word away.
    // A letter shows only once its station is solved; before that the slot shows "?".
    slots: stationsByNumber().map(station => {
      const solved = state.stations[station.id].solved;
      return {
        stationId: station.id,
        number: station.number,
        room: station.room,
        spot: station.spot ?? null,
        letter: solved ? state.letters[CASE.stations.indexOf(station)] ?? station.letter : '?',
        solved,
      };
    }),
    // Evidence in the order it was found.
    evidence: state.evidence.map(id => {
      const station = CASE.stations.find(s => s.evidenceId === id);
      return { id, room: station.room, text: station.evidence };
    }),
    notes: state.notes.map(id => noteById(id)),
    // Revealed only after the right accusation, so it never spoils the answer.
    caseNotes: state.accusation.solved ? [WHO_WAS_M] : [],
    nextStep: nextStep(state),
    score: { total: totalScore(state), max: maximumScore(state) },
  };
}

export function renderJournal(container, model, evidenceContainer = null) {
  const slots = el('ol', { className: 'story-slots', attrs: { 'aria-label': 'Letters by station number' } });
  const compactNames = { landscape: 'Catalogue', portraits: 'Portraits', restoration: 'Picture', archive: 'Frame rack' };
  for (const slot of model.slots) {
    // Found: only the room. Not found yet: room plus spot, so three Gallery stations can be told apart.
    const where = !slot.solved && slot.spot ? `${slot.room}, ${slot.spot}` : slot.room;
    const label = slot.solved ? `Station ${slot.number}, ${slot.room}: letter ${slot.letter}` : `Station ${slot.number}, ${where}: not found yet`;
    slots.append(el('li', { className: slot.solved ? 'story-slot is-found' : 'story-slot', attrs: { 'aria-label': label } }, [
      el('span', { className: 'story-slot-letter', text: slot.letter, attrs: { 'aria-hidden': 'true' } }),
      el('span', { className: 'story-slot-room', attrs: { 'aria-hidden': 'true' } }, evidenceContainer
        ? [`${slot.number} · ${compactNames[slot.stationId] ?? slot.room}`]
        : slot.solved || !slot.spot
          ? [`${slot.number} · ${slot.room}`]
          : [`${slot.number} · ${slot.room}, `, el('span', { className: 'story-slot-spot', text: slot.spot }), ' – not found yet']),
    ]));
  }

  const evidence = model.evidence.length
    ? el('ul', { className: 'story-list' }, model.evidence.map(item =>
      el('li', {}, [el('strong', { text: `${item.room}: ` }), item.text])))
    : el('p', { className: 'story-muted', text: 'No evidence yet.' });

  const allNotes = [...model.notes, ...(model.caseNotes ?? [])];
  const notes = allNotes.length
    ? el('ul', { className: 'story-list' }, allNotes.map(note =>
      el('li', {}, [el('strong', { text: `${note.title}: ` }), note.text])))
    : el('p', { className: 'story-muted', text: 'No notes yet.' });

  if (evidenceContainer) {
    evidenceContainer.replaceChildren(
      el('div', { className: 'journal-evidence-grid' }, [
        el('section', {}, [el('h4', { text: 'Evidence' }), evidence]),
        el('section', {}, [el('h4', { text: 'Notes' }), notes]),
      ]),
    );
    container.replaceChildren(
      el('section', { className: 'story-journal' }, [
        el('div', { className: 'story-next' }, [el('strong', { text: 'Next: ' }), model.nextStep]),
        slots,
      ]),
    );
    return;
  }

  container.replaceChildren(
    el('section', { className: 'story-journal' }, [
      el('p', { className: 'story-eyebrow', text: 'INVESTIGATION JOURNAL' }),
      el('div', { className: 'story-next' }, [el('strong', { text: 'Next step: ' }), model.nextStep]),
      el('h3', { className: 'story-heading', text: 'Letters' }),
      slots,
      el('h3', { className: 'story-heading', text: 'Evidence' }),
      evidence,
      el('h3', { className: 'story-heading', text: 'Notes' }),
      notes,
      el('p', { className: 'story-score', text: `Score: ${model.score.total} / ${model.score.max}` }),
    ]),
  );
}
