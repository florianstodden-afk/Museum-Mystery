// Connects any station (mini-game) to the story engine.
//
// A station module exports start(container, caseData, onSolved).
// The adapter translates whatever the station reports into { mistakes, hints } for the engine.
// The ENGINE decides letter, evidence and points – never the station.
//
// Two formats are supported:
// 1. Target format: onSolved({ mistakes, hints })
// 2. Today's landscape.js: onSolved({ letter, evidence, points }) and the progress
//    { mistakes, hints, solved } arrives earlier through caseData.onChange(progress).

export function openStation(stationModule, container, options) {
  const { stationId, caseData = {}, savedProgress = null, onProgress, onSolved } = options;
  if (!stationModule || typeof stationModule.start !== 'function') {
    throw new Error(`Station "${stationId}" has no start(container, caseData, onSolved) function.`);
  }

  let progress = savedProgress;
  let finished = false;

  const stationCaseData = {
    ...caseData,
    stationId,
    state: savedProgress ?? undefined,   // landscape.js reads its saved progress from here
    onChange(next) {                      // landscape.js reports every change here
      progress = next;
      if (onProgress) onProgress(next);
    },
  };

  stationModule.start(container, stationCaseData, report => {
    if (finished) return;                 // a station may only finish once
    finished = true;
    onSolved(toEngineResult(report, progress));
  });
}

// Picks mistakes and hints from the report; falls back to the last progress; otherwise 0.
export function toEngineResult(report, lastProgress) {
  const source = hasCounts(report) ? report : hasCounts(lastProgress) ? lastProgress : {};
  return {
    mistakes: countOrZero(source.mistakes),
    hints: countOrZero(source.hints),
  };
}

function hasCounts(value) {
  return value !== null && typeof value === 'object'
    && Number.isInteger(value.mistakes) && Number.isInteger(value.hints);
}

function countOrZero(value) {
  return Number.isInteger(value) && value >= 0 ? value : 0;
}
