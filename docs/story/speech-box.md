# Speech box

All characters (Leon, Imani, Dr. Vale) talk in a small speech box at the bottom of the game view, as in classic console RPGs. The world stays visible behind it. Reference: `docs/screenshots/guard-speech-mockup.png`.

## Three parts, three files

| File | Purpose | DOM? |
|---|---|---|
| `web/story/dialogues.js` → `conversationFor(id, state)` | **What** is said: Leon has a greeting, two questions and a goodbye; Imani and Dr. Vale have their existing lines. Depends on the game state. | no |
| `web/story/proximity.js` → `talkPartner(...)`, `shouldCloseTalk(...)` | **Who** talks after `E` and **when** the box closes again. | no |
| `web/story/speech-box.js` → `createSpeechBox(parent, ...)` | **How** it looks: name tag, text box, typewriter effect, buttons, keys. | yes |

Also: styles with the prefix `speech-` in `web/story/story.css`, the connection in `web/story/host.js` (`talkTo` uses the box when there is a conversation) and in `web/main.js` (distance check in the game loop, player and Leon pause).

## Flow

1. All characters (Leon, Imani, Dr. Vale) talk only after **E**. Above the character it then says “E Name”. `main.js` (`handleInteract`) asks `talkPartner(object, PEOPLE)` which character belongs to the map object and opens their box. Coming close alone opens nothing.
2. Every frame, `main.js` (`checkTalkDistance`) checks how far the player is from the speaking character. It is measured on screen (100 pixels = 1 step), because the floor is drawn in perspective.
3. Beyond **1.5 steps** the box closes (`shouldCloseTalk`). So you can simply walk away.
4. Leon has a greeting, two questions and an optional goodbye. An answered question disappears for the current conversation. After the second answer, the conversation ends automatically on the next click. With a new **E** both questions are available again.
5. Imani says her existing lines and closes automatically on the next click after the last line. A new **E** starts her conversation again. Dr. Vale keeps the existing “Goodbye.” button.

While a character talks, they look at the player (`facingToward`). Leon stands still meanwhile. In the Gallery Imani keeps looking forward, because `gallery.js` draws her and was not changed there.

## Controls

- Mouse/touch: click the buttons, click in the box = continue.
- Keyboard: `1` `2` `3` choose, as far as buttons exist; `Tab` switches between them, `Enter` chooses. After Leon’s first question the other question moves to `1`.
- `Space` / `E`: show the sentence in full at once, then continue.
- `Escape`: close. Walking (`W A S D`, arrows) keeps working; walking away closes the box.
- Text appears at 35 characters per second; with `prefers-reduced-motion` all at once. `aria-live="polite"` reads the text aloud.
- If the player stands at the bottom of the view, the box moves to the top (`setPlacement('top')`).

## Own questions for another character (e.g. Imani)

1. In `dialogues.js` write a function `imaniConversation(state)` that returns `{ greeting, questions, goodbye }`, and register it in `conversationFor`: `{ leon: leonConversation, imani: imaniConversation }`. Rules: questions sound like small talk, at most two short sentences per box, never give away a solution.
2. Add tests in `web/story/tests/conversation.test.js`.

A completely new character is added to `PEOPLE` in `main.js` (map object → character), plus their room in `personDistance`.
