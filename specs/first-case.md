# Task 1: A complete local Museum Mystery case

> **Historical specification for the first Python prototype.** This was the six-artwork Streamlit case, now in [legacy/python](../legacy/python/). See the [current README](../README.md) for the finished browser game.

## Why?

We need a small, playable case whose rules every team member can explain. Artworks and images should come from the Met Collection API; the game state should survive an app restart.

## What?

Six Met object IDs: 436535 (target), 459193, 436121, 12127, 435882 and 435876. These six were checked on 09.11.2026 for `isPublicDomain=true`, a public image, artist, date and medium. The originally chosen 437133 and 10393 were unsuitable and were replaced after an app error; see the work log. The target is *Wheat Field with Cypresses* (1889) by Vincent van Gogh. Images and metadata are requested from the object endpoint at startup and cached for 24 hours in the running Streamlit process.

A free clue describes the work as an outdoor landscape. That leaves the target and *Road in Etten* (1881) possible at first. The first paid clue, “after 1885”, tells the two apart. Three further clues cost 15 each of the starting 100 points. A first wrong guess costs 25 points and rules out the chosen work. A second wrong guess ends the case; a right guess wins. An invalid or repeated guess and any action after the game has ended are rejected. The local attempt is stored in SQLite. After the end, a new practice attempt may be started.

## Outside this task

Real user accounts, scored attempts, a leaderboard, several cases, hosting and live multiplayer. The local database is a demo save for **one** computer and not a shared online database.

## Done when …

- `uv run pytest` checks the rules and a second database access.
- The app shows six real Met images with a source link and gives an understandable error message if the API fails.
- A right guess wins; the first wrong guess deducts 25 points; the second wrong guess loses.
- Paid clues cost 15 points each and stop after three purchases.
- A finished attempt allows no further guesses or purchases.
- After closing and restarting the app the local save is still there; after “Start new practice attempt” it is reset.

## Path to understanding

`app.py` shows the works and buttons; `game.py` computes only valid state changes; `storage.py` saves and loads the state in SQLite. `tests/` checks rules and storage. The Met API delivers the image and factual information about the work. The target ID and clues are curated so the solution can be checked.
