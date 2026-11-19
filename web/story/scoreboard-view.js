// Home screen scoreboard: shows the numbers from scoring.js (scoreboard, best run). No points logic here.
import { el } from './dom.js';
import { formatClock } from './scoring.js';

const clock = ms => (ms === null ? '–' : formatClock(ms));

/** Fills `container` with the table per station, the run's totals and the best run. */
export function renderScoreboard(container, board, best) {
  const bestMaximum = best?.max ?? 90;
  const earlierScale = best && bestMaximum !== board.max ? ' (earlier scoring)' : '';
  const head = el('tr', {}, ['Station', 'Status', 'Time', 'Points'].map(text => el('th', { text, attrs: { scope: 'col' } })));
  const rows = board.stations.map(row => el('tr', { className: row.solved ? 'is-solved' : '' }, [
    el('th', { text: `${row.letter} · ${row.room}`, attrs: { scope: 'row' } }),
    el('td', { text: row.solved ? 'Solved' : 'Open' }),
    el('td', { text: row.solved ? clock(row.timeMs) : '–' }),
    el('td', { text: `${row.points} / ${row.max}` }),
  ]));
  container.replaceChildren(
    el('table', { className: 'scoreboard-table' }, [el('thead', {}, [head]), el('tbody', {}, rows)]),
    el('p', { className: 'scoreboard-total' }, [
      el('strong', { text: `${board.finished ? 'Finished run' : 'Current run'}: ${board.points} / ${board.max} points` }),
      ` · time ${clock(board.timeMs)}`,
    ]),
    el('p', { className: 'scoreboard-best', text: best ? `Best run: ${best.points} / ${bestMaximum} points${earlierScale} · time ${clock(best.timeMs)}` : 'Best run: finish a run to set one.' }),
    el('p', { className: 'scoreboard-rules', text: 'B: wrong answers and hints reduce points. I, L and D: faster completion earns more. The safe and final question also count.' }),
  );
}
