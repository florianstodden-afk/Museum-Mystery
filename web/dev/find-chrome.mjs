// Finds a Chrome-like browser for the browser checks (no Playwright needed).
// Order: CHROME_PATH, then known paths for macOS, Windows and Linux.
import { existsSync } from 'node:fs';
import { join, delimiter } from 'node:path';

function onPath(names) {
  for (const dir of (process.env.PATH ?? '').split(delimiter)) {
    for (const name of names) {
      const file = join(dir, name);
      if (dir && existsSync(file)) return file;
    }
  }
  return null;
}

export function chromeCandidates(env = process.env, platform = process.platform) {
  if (platform === 'darwin') {
    return [
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Chromium.app/Contents/MacOS/Chromium',
      '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    ];
  }
  if (platform === 'win32') {
    const roots = [env.ProgramFiles, env['ProgramFiles(x86)'], env.LOCALAPPDATA].filter(Boolean);
    return roots.flatMap(root => [
      join(root, 'Google', 'Chrome', 'Application', 'chrome.exe'),
      join(root, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    ]);
  }
  return [];
}

export function findChrome(env = process.env, platform = process.platform) {
  if (env.CHROME_PATH) {
    if (existsSync(env.CHROME_PATH)) return env.CHROME_PATH;
    throw Error(`CHROME_PATH is set, but nothing is at ${env.CHROME_PATH}.`);
  }
  const found = chromeCandidates(env, platform).find(file => existsSync(file))
    ?? (platform === 'linux' ? onPath(['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser', 'microsoft-edge']) : null);
  if (found) return found;
  throw Error('No Chrome, Chromium or Edge found. Install one, or set CHROME_PATH to the browser executable.');
}
