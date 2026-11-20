// Connects any station (mini-game) to the story engine.
//
// A station module exports start(container, caseData, onSolved).
// The adapter translates whatever the station reports into { mistakes, hints } for the engine.
// The ENGINE decides letter, evidence and points – never the station.
//
// Two formats are supported:
// 1. Target format: onSolved({ mistakes, hints })
// 2. The older station format: onSolved({ letter, evidence, points }) and the progress
//    { mistakes, hints, solved } arrives earlier through caseData.onChange(progress).

export function openStation(stationModule, container, options) {
  const { stationId, caseData = {}, savedProgress = null, onProgress, onSolved } = options;
  if (!stationModule || typeof stationModule.start !== 'function') {
    throw new Error(`Station "${stationId}" has no start(container, caseData, onSolved) function.`);
  }

  let progress = savedProgress;
  let finished = false;
  let active = true;

  const stationCaseData = {
    ...caseData,
    stationId,
    state: savedProgress ?? undefined,   // older stations read their saved progress from here
    onChange(next) {                      // older stations report every change here
      if (!active) return;
      progress = next;
      if (onProgress) onProgress(next);
    },
  };

  const cleanup = stationModule.start(container, stationCaseData, report => {
    if (!active || finished) return;      // a station may only finish once
    finished = true;
    onSolved(toEngineResult(report, progress));
  });
  return () => {
    active = false;
    if (typeof cleanup === 'function') cleanup();
  };
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
