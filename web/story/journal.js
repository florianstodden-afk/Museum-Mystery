// The investigation journal: first a pure data model, then a renderer for any container.
import { CASE, noteById } from './case-1.js';
import { nextStep } from './engine.js';
import { totalScore, MAX_SCORE } from './scoring.js';
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

export function journalModel(state) {
  return {
    mission: { title: CASE.mission.title, text: CASE.mission.text, read: state.missionRead },
    slots: CASE.stations.map((station, index) => ({
      stationId: station.id,
      room: station.room,
      letter: state.letters[index] ?? '_',
      solved: state.stations[station.id].solved,
    })),
    // Evidence in the order it was found.
    evidence: state.evidence.map(id => {
      const station = CASE.stations.find(s => s.evidenceId === id);
      return { id, room: station.room, text: station.evidence };
    }),
    notes: state.notes.map(id => noteById(id)),
    nextStep: nextStep(state),
    score: { total: totalScore(state), max: MAX_SCORE },
  };
}

export function renderJournal(container, model) {
  const slots = el('ol', { className: 'story-slots', attrs: { 'aria-label': 'Letters in fixed order' } });
  for (const slot of model.slots) {
    const label = slot.solved ? `${slot.room}: letter ${slot.letter}` : `${slot.room}: not found yet`;
    slots.append(el('li', { className: slot.solved ? 'story-slot is-found' : 'story-slot', attrs: { 'aria-label': label } }, [
      el('span', { className: 'story-slot-letter', text: slot.letter, attrs: { 'aria-hidden': 'true' } }),
      el('span', { className: 'story-slot-room', text: slot.room, attrs: { 'aria-hidden': 'true' } }),
    ]));
  }

  const evidence = model.evidence.length
    ? el('ul', { className: 'story-list' }, model.evidence.map(item =>
      el('li', {}, [el('strong', { text: `${item.room}: ` }), item.text])))
    : el('p', { className: 'story-muted', text: 'No evidence yet.' });

  const notes = model.notes.length
    ? el('ul', { className: 'story-list' }, model.notes.map(note =>
      el('li', {}, [el('strong', { text: `${note.title}: ` }), note.text])))
    : el('p', { className: 'story-muted', text: 'No notes yet.' });

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
