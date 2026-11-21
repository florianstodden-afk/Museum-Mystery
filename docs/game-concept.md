# Game concept “Museum Nocturne” – short version

> The full concept document is kept by the team (not in the repository). This short version is the basis for the story logic in `web/story/` and was taken over from the assignment on 12.11.2026.

## Plot

The fictional **Museum Nocturne** in New York, at night. The player character (a temporary restoration assistant) receives a job from “M”: take Van Gogh’s *Wheat Field with Cypresses* out of a safe before sunrise.

Characters (all fictional):
- **Adrien Voss** (“M”, patron, the real mastermind)
- **Dr. Mara Vale** (curator, secured the original in the safe and left four clues)
- **Leon** (night guard, saw a transport cart at night but not the painting; suspected at first, cleared later)
- **Imani** (conservator, helps with material details)

## Flow

1. Read the mission
2. Explore the museum
3. **Four stations in any order**, each gives a letter and a piece of evidence
4. The journal places the letters in a fixed order to spell the code word (Station 3 → 1 → 2 → 4)
5. The **safe** opens only with proof from all four stations **and** the word `OILS` (oil paints; letters in the order Station 3, 1, 2, 4) (wrong input: “Check the order in your journal”, can be corrected)
6. In the safe: the original + documents
7. **Final question** “Who planned the false label and the transport slip, and lured you to the safe?” – Leon / Dr. Vale / Adrien Voss, the right answer is **Voss**. There is **one accusation**: the game asks for confirmation first (“You get one chance…”); a wrong name ends the case with **Case lost**, and the end screen explains which evidence clears the accused
8. **Two endings:** **A “The Heist”** (painting to Voss, the fraud stays hidden, dark ending, no game over) and **B “The Open File”** (painting and evidence to Dr. Vale, Voss is exposed, the work returns)

Nobody can get stuck for good.

| Station | Room | Letter | Evidence |
|---|---|---|---|
| 1 | Portrait Hall | I | Night-shift log: Leon was elsewhere; the transport was booked as a patron visit. |
| 2 | Gallery, left painting | L | Hidden mark “V” on the fake transport slip. |
| 3 | Gallery, middle painting | O | Voss approved the false wall label. |
| 4 | Gallery, frame rack | S | Frame label: “Ordered by: A. Voss”. |

## Points (max. 100, no time scoring)

- up to 20 per station (−3 per wrong try, −5 per hint, at least 5 when solved)
- Safe 10 (5 after a wrong try)
- Final question 10 (5 after a wrong try)
- Endings: 0 extra points

Login, online database and leaderboard are not part of the story logic.

## Real works (The Met, Open Access)

436535 Van Gogh *Wheat Field with Cypresses* (1889) · 459193 Van Gogh *Road in Etten* (1881) · 436121 Degas *A Woman Seated beside a Vase of Flowers* (1865) · 12127 Sargent *Madame X* (1883–84) · 435876 Cézanne *Madame Cézanne in a Red Dress* (1888–90) · 435882 Cézanne *Still Life with Apples and a Pot of Primroses* (ca. 1890).

Museum and characters are fictional; the game says so visibly.
