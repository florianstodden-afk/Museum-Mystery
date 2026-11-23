# Security and verification review · 23 November 2026

This page explains what the deployed Museum Mystery app checks and how to repeat the checks. The public game is the `web/` browser app plus the `api/` Vercel functions. `legacy/python/` is a historical Streamlit prototype, outside the Vercel deployment.

## Access and input rules

| Action | Server rule | Automated check |
| --- | --- | --- |
| Start GitHub sign-in | Requires a 64-character random browser state and configured OAuth values; stores only its hash and a short-lived verifier. | Invalid state and expired state are rejected. |
| Exchange login ticket | Requires a correctly shaped, unexpired, one-use ticket. | Invalid, expired and reused tickets are rejected. |
| Read/write online save or scoreboard | Requires a current GitHub session. Saves are addressed by the GitHub account ID from that session, never a player ID supplied by the browser. | Anonymous requests and requests after logout return 401; a foreign Origin returns 403; two accounts cannot read or overwrite each other's saves. |
| Write an online save | Rejects invalid JSON, requests over 100,000 characters, a save over 90,000 characters, broken story structure and contradictory case facts. SQL values are bound as parameters. | Tests cover malformed/oversized bodies and forged evidence, scores, accusation and ending. |
| Publish a result | Requires a saved, successful current case and valid completed snapshots from all four mini-games. Points must agree with their saved progress; the server computes the published total. | A finished story missing one mini-game snapshot is rejected; a complete result is accepted. |

`api/_service.js` implements these rules; `web/story/save.js` validates the general story format; each `web/minigames/*-rules.js` module validates its own saved puzzle state. The server accepts older valid saves for resuming, but they cannot enter the current leaderboard without all four completed puzzle snapshots.

These checks establish **internal consistency**, not proof of human play. A player controlling their browser can create a fabricated but consistent puzzle snapshot. Preventing that would require the server to own game events or independently verify a trusted event history; a static browser game cannot provide that proof by validating its final JSON alone. The shared board should be described as a friendly game scoreboard, not a tamper-proof competition.

## Tests and their limits

From the repository root, run:

```bash
node --test
```

On 23 November 2026, **349 tests passed** on the security-review branch. They include accepted and rejected story actions, puzzle edge cases, broken saves, OAuth and API rejection paths, account separation, database parameter binding, ranking rules and the correct ending flow. `node web/dev/run-e2e.mjs` runs separate browser checks of visible workflows. Tests mock GitHub and Postgres: they do **not** prove that a real GitHub authorization, the live Neon database, a production deployment or a newly played winning result works. Those need a manual check at the published Vercel URL.

## Dependency and secret check

`package.json` declares one production dependency, exactly `@neondatabase/serverless` version `1.2.1`. `package-lock.json` pins that version and integrity hash and contains only the root project and this package. Browser game code uses no additional Node runtime package. The Python prototype has its own `legacy/python/uv.lock` and is not deployed.

On **23 November 2026**, the [OSV vulnerability query API](https://osv.dev/docs/) returned **zero reported vulnerabilities** for npm package `@neondatabase/serverless` version `1.2.1`. The package maintainer's [GitHub security advisories](https://github.com/neondatabase/serverless/security/advisories) listed none. This records what was known on that date; it is not a permanent safety guarantee. The check can be repeated with an npm audit when npm is available or by querying OSV again for the pinned version.

The repository's `.gitignore` excludes `.env`, `.env.*` (except a harmless example), `.vercel/`, local databases and Python secrets. The server reads `DATABASE_URL`, `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` from Vercel environment variables. No real values belong in code, screenshots, issues or the README. The GitHub password and access token are not saved by the game; the database stores hashed session tokens and account IDs. See [login and storage setup](leaderboard.md).
