# GitHub sign-in, online saves and shared leaderboard · 21.11.2026

## Player flow

The entry screen has two choices: **Continue with GitHub** and **Play as guest**. There are no in-game username/password forms. GitHub handles the account password. After GitHub confirms a player, the game opens the Home screen, loads that account's online save and lets the player resume on another device. The Home scoreboard shows the current run and up to 25 shared results. Winning results are submitted automatically when the case ends. Each GitHub account has one entry: its highest score. Equal scores share a rank; time does not change rank. A lost run is saved but does not enter the shared leaderboard.

Guests can play the whole case, including all endings. Their progress stays in this browser. They cannot open the leaderboard or submit a score. The painted Scoreboard button is visibly disabled for guests. A guest can choose **Settings → Sign in with GitHub** to switch to an online account; guest progress is not automatically transferred.

## How the data moves

1. The game sends the browser to the Cloudflare Worker. The Worker creates a one-time OAuth state and PKCE challenge, then sends the player to GitHub.
2. GitHub sends an authorization code to the Worker. The Worker checks the state, exchanges the code using a secret stored only on Cloudflare, and asks GitHub for the numeric account ID and login name. The GitHub access token is discarded after that lookup.
3. The Worker returns a short-lived, one-use ticket to the game. The game exchanges it for a session token. The token lives in this tab's `sessionStorage`; the database stores only its SHA-256 hash. **Sign out** deletes the server session.
4. With that session, the game downloads the account's saved story and map position before starting. During play, changes are saved online after a short pause. The Home screen shows whether the latest online save succeeded. When a winning run finishes, the game saves the final state and then asks the Worker to calculate and publish the score.
5. The Worker derives the leaderboard name and player ID from the verified GitHub session. It does not accept a name, player ID or score from the browser's leaderboard request. It reads the saved game and calculates the score with the game's scoring functions.

The online snapshot contains the story state, minigame progress and map position. It does **not** contain a GitHub password or GitHub access token. Multiple devices writing simultaneously use the most recently received save; play on one device at a time. The identity is verified, but a technically modified browser can still forge a plausible game state. A competition-grade anti-cheat system would need server-verified game actions.

## Files

| File | Role |
| --- | --- |
| `web/index.html`, `web/style.css` | GitHub/guest choice and status on the illustrated screens |
| `web/github-auth.js` | One-time ticket exchange, session, online save and sign-out |
| `web/main.js` | Loads the online save before the game starts; syncs changes and publishes a win |
| `web/leaderboard.js`, `web/story/story.css` | Shared ranking and translucent museum display |
| `server/leaderboard/worker.js` | OAuth callback, verified sessions, saves and ranking API |
| `server/leaderboard/migrations/` | D1 tables for leaderboard, OAuth states, tickets, sessions and saves |
| `web/leaderboard-config.js`, `server/leaderboard/wrangler.jsonc` | Public Worker address and deployment settings |

## One-time setup needed to go live

GitHub Pages is a static site, so it cannot exchange a GitHub authorization code securely or store shared saves itself. The Worker and database must be deployed once. **Until this is done, the GitHub button explains that the connection is unavailable; guest play works.**

1. Create or sign in to a Cloudflare account and open `server/leaderboard` in a terminal with Node.js. Run `npx wrangler login`.
2. Run `npx wrangler d1 create museum-mystery-leaderboard`. Copy the shown `database_id` into `wrangler.jsonc` in place of `REPLACE_WITH_D1_DATABASE_ID`.
3. Run `npx wrangler d1 migrations apply museum-mystery-leaderboard --remote`. This applies both `0001_leaderboard.sql` and `0002_github_login.sql`.
4. Run `npx wrangler deploy`. Copy the resulting Worker URL into `CALLBACK_URL` in `wrangler.jsonc`, with `/auth/callback` at the end.
5. In GitHub **Settings → Developer settings → OAuth Apps → New OAuth App**, create an app with Homepage URL `https://florianstodden-afk.github.io/Museum-Mystery/` and Authorization callback URL equal to `CALLBACK_URL`. Copy its **Client ID** into `GITHUB_CLIENT_ID` in `wrangler.jsonc`. Keep its **Client Secret** out of GitHub and out of the browser.
6. In `server/leaderboard`, run `npx wrangler secret put GITHUB_CLIENT_SECRET` and paste the Client Secret when prompted. Run `npx wrangler deploy` again to publish the callback setting.
7. Put the Worker base URL (without `/auth/callback`) into `LEADERBOARD_URL` in `web/leaderboard-config.js`, commit that public URL and merge it. GitHub Pages then uses the online service.
8. Test with a GitHub account on two devices: finish a case on device A, sign in on device B, see the same save and the result on the shared board. Test guest play separately: no online save or board.

`APP_URL` and `ALLOWED_ORIGINS` in `wrangler.jsonc` already name the current GitHub Pages site. If the public game URL changes, update both values and the OAuth App URLs. The OAuth Client Secret must only be entered through Wrangler's secret command; never commit it or send it in chat.

## What changed from the previous version

The older local username/password screens and the local score list are no longer shown. The previous unauthenticated leaderboard used random browser IDs and allowed client-supplied names and points. The new Worker ignores those older entries and lists only `github:` identities. Old local profile data remains untouched for historical reference, but it is not a GitHub identity. `docs/local-login.md` documents that earlier version.

## Checks

`cd web && node --test` checks game logic and the new entry rules. `node --test server/leaderboard/worker.test.js` exercises OAuth state, one-use tickets, session authorization, save and leaderboard with a fake database. A real GitHub round trip and cross-device check are possible only after the setup above.

References: [GitHub OAuth web application flow](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps), [GitHub authenticated user endpoint](https://docs.github.com/en/rest/users/users), [Cloudflare D1 Worker API](https://developers.cloudflare.com/d1/worker-api/), [D1 migrations](https://developers.cloudflare.com/d1/reference/migrations/).
