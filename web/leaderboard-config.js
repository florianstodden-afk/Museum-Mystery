// Vercel serves the game and its API on one domain. Static local and GitHub Pages copies remain guest-only.
const host = typeof location === 'undefined' ? '' : location.hostname;
export const LEADERBOARD_URL = host && !host.endsWith('github.io') && host !== 'localhost' && host !== '127.0.0.1' ? '/api' : '';
