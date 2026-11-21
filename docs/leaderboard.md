# GitHub login, online saves and leaderboard on Vercel · 21.11.2026

## Current architecture

Vercel serves the browser game from `web/` and the same-origin functions from `api/`. A Neon Postgres database, connected through Vercel Storage, keeps the OAuth handshakes, hashed game sessions, one save per GitHub account and one best result per account. This replaces the earlier Cloudflare Worker/D1 proposal. GitHub Pages remains a guest-only copy: its static hosting has no `/api/` functions. Its GitHub button hands the player to `museum-mystery.vercel.app/?github-login=1`, where OAuth starts automatically on the correct origin.

The entry screen offers **Continue with GitHub** or **Play as guest**. GitHub players can resume a case on another device and open the shared scoreboard. Winning finishes are saved and submitted automatically. The Vercel function derives the account ID and display name from GitHub and calculates the score from the saved game. It ignores names and points supplied by a browser. Guests keep only a local save and cannot open or submit to the leaderboard. Lost runs are saved but never ranked. Equal scores share a place; time does not decide the rank.

The GitHub password and access token never enter the game repository or database. The GitHub access token is used briefly on the server to fetch the numeric account ID, then discarded. The game keeps only a temporary session token in this tab; the database keeps its hash. A one-use OAuth state and PKCE protect the GitHub handoff. The browser loads the online save before starting play and uploads changes after a short pause. If an upload fails, it retains a pending local copy and retries after the next sign-in. One device should be played at a time; the most recent upload wins. GitHub verifies identity, but browser-side gameplay remains open to deliberate manipulation.

## Why the first Vercel deployment failed

The imported Vercel project used **Root Directory: `legacy/python`** and **Framework: Python**. That folder is an old Streamlit prototype. Its `app.py` is not a Vercel Python function, which explains `PYTHON_ENTRYPOINT_NOT_FOUND`. The current game lives in `web/`, while its server functions live in root-level `api/`. Both must be inside the Vercel project root.

## Live status and remaining check

PR #40 was merged. On 21 November, `https://museum-mystery.vercel.app/` served the game, `/api/auth/start` redirected to GitHub with the correct callback URL, and anonymous requests to `/api/auth/me`, `/api/save` and `/api/runs` correctly returned 401. This confirms the deployed functions can reach the configured database and know the GitHub Client ID. It does not prove the Client Secret, real GitHub callback, online save on two devices or completed-run ranking; those need a player to authorize the OAuth App and play. The user's reported “GitHub login is not connected yet” came from the static GitHub Pages copy, not the Vercel domain. The GitHub Pages button now hands off to Vercel.

## One-time Vercel setup (completed for Production; retained for documentation)

1. Open project **museum-mystery → Settings → Build and Deployment → Root Directory**. Remove `legacy/python` so the root is the **repository root** (an empty Root Directory field). Save. Vercel applies this on the next deployment. The repository's `vercel.json` then chooses the **Other** framework and `web` output directory. Do not set Root Directory to `web`, because that would hide `api/` from Vercel.
2. In the project, open **Storage** and add a **Neon Postgres** database from the Vercel Marketplace. No database was connected when the project owner checked on 21 November. Connect it to this project and select **Production** under Environments. Leave **Custom Prefix** empty: the server expects the automatically injected variable to be named exactly `DATABASE_URL`. Under **Create database branch for deployment**, leave both Production and Preview unchecked for this first setup; an isolated Preview branch can be enabled later if needed. If the Neon resource Settings ask for **Allowed Environments**, choose **Production environment only**. This makes database credentials non-readable; re-enabling Preview later requires a Vercel team owner and reconnecting the project. Do not commit or send the connection URL. The server creates its tables on first use; no manual SQL command is required.
3. The project owner confirmed the production domain is `museum-mystery.vercel.app`. In GitHub **Settings → Developer settings → OAuth Apps → New OAuth App**, set Homepage URL to `https://museum-mystery.vercel.app/` and Authorization callback URL to `https://museum-mystery.vercel.app/api/auth/callback`. Copy the Client ID and create a Client Secret. The two URLs must use this production domain, not the temporary deployment URLs.
4. In Vercel **Settings → Environment Variables**, add `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` for Production. Choose the **Secret** type for `GITHUB_CLIENT_SECRET` if offered. Never put it in Git or in a chat. Check that `DATABASE_URL` is present from Neon. Vercel's `VERCEL_PROJECT_PRODUCTION_URL` gives the code its production callback address; if system variables are disabled, enable them in Environment Variables.
5. [PR #40](https://github.com/florianstodden-afk/Museum-Mystery/pull/40) was merged and triggered the first successful Production deployment. If the database or OAuth variables are changed later, redeploy Production so the functions see them. The initial failed Python deployment is a historical state.
6. On the Vercel URL, test **Continue with GitHub**. Finish a case on device A and open the same account on device B: the case should resume and the shared scoreboard should show the winning result. Test **Play as guest** separately: no online save or scoreboard.

The public files `vercel.json`, `web/leaderboard-config.js` and `api/` contain no secrets. `package.json` installs the Neon serverless database driver. The server checks the database connection on each request and reports a clear error if Storage has not been connected.

## Code map

| File | Role |
| --- | --- |
| `web/index.html`, `web/style.css`, `web/assets/github-login-screen.png` | Painted GitHub/guest login with real clickable buttons and live status |
| `web/github-auth.js`, `web/main.js` | OAuth ticket exchange, load and upload save, sign-out and guest separation |
| `web/leaderboard.js`, `web/story/story.css` | Shared scores and transparent museum board |
| `web/leaderboard-config.js`, `web/github-auth.js` | Uses `/api` on Vercel; hands GitHub Pages login to Vercel |
| `api/auth/*.js`, `api/save.js`, `api/runs.js` | Small Vercel function entry points |
| `api/_service.js` | GitHub OAuth, verified sessions, saves and scoreboard rules |
| `api/_database.js`, `api/_runtime.js` | Postgres tables, safe queries and Vercel environment |
| `vercel.json`, `package.json` | Website root and Neon driver dependency |

## Checks and limits

`node --test` covers the game, OAuth state, one-use ticket, session authorization, saves, ranking, the database adapter and the GitHub Pages handoff. A real GitHub round trip and a two-device check remain outstanding. Earlier local username/password saves are not automatically migrated. A guest can still finish all endings. The older Cloudflare proposal remains visible only in dated entries of `docs/work-log.md`.

References: [Vercel Root Directory](https://vercel.com/docs/builds/configure-a-build), [Vercel Functions](https://vercel.com/docs/functions/runtimes/node-js), [Vercel Storage Marketplace](https://vercel.com/docs/marketplace-storage), [Neon serverless driver](https://github.com/neondatabase/serverless/blob/main/CONFIG.md), [GitHub OAuth flow](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps).
