// A general stand-in for stations that are not built yet (Portrait Hall, Conservation Studio,
// Frame Archive). It follows the same contract as a real station: start(container, caseData, onSolved).
// caseData.stationId says which station it stands in for.
import { stationById, workById } from './case-1.js';
import { el, button, artworkImageUrl } from './dom.js';

export function placeholderModel(stationId) {
  const station = stationById(stationId);
  if (!station) return null;
  return {
    room: station.room,
    letter: station.letter,
    task: station.task,
    works: station.metIds.map(workById),
  };
}

export function start(container, caseData, onSolved) {
  const model = placeholderModel(caseData.stationId);
  container.replaceChildren();
  if (!model) {
    container.append(el('p', { text: `Unknown station: ${caseData.stationId}` }));
    return;
  }

  const works = el('div', { className: 'story-placeholder-works' });
  for (const work of model.works) {
    const image = el('img', { props: { src: artworkImageUrl(work), alt: `${work.shortTitle} by ${work.artist}`, loading: 'lazy' } });
    const caption = el('p', { text: `${work.artist}: ${work.shortTitle}, ${work.date}` });
    works.append(el('figure', { className: 'story-placeholder-work' }, [image, caption]));
  }

  const feedback = el('p', { className: 'story-feedback', attrs: { 'aria-live': 'polite' } });
  const solve = button('Solve station (placeholder)', () => {
    solve.disabled = true;
    feedback.textContent = 'Placeholder solved. A teammate’s mini-game will replace this screen.';
    onSolved({ mistakes: 0, hints: 0 });
  });

  container.append(
    el('p', { className: 'story-eyebrow', text: `${model.room.toUpperCase()} · PLACEHOLDER` }),
    el('p', { className: 'story-text', text: model.task }),
    works,
    solve,
    feedback,
  );
}
