"""Die Regeln des ersten Falls, unabhängig von Streamlit und SQLite."""

from dataclasses import dataclass

CASE_ID = "cypresses"
TARGET_ID = 436535
CANDIDATE_IDS = (436535, 459193, 436121, 12127, 435882, 435876)
FREE_CLUE = "Gesucht ist eine Landschaft mit einer Ansicht im Freien."
PAID_CLUES = (
    "Das Werk entstand nach 1885.",
    "Der Künstler kam aus den Niederlanden.",
    "Der Titel nennt Zypressen.",
)


@dataclass(frozen=True)
class Attempt:
    score: int = 100
    clues_bought: int = 0
    wrong_guess: int | None = None
    outcome: str = "playing"  # playing, won, lost


def buy_clue(attempt: Attempt) -> Attempt:
    if attempt.outcome != "playing" or attempt.clues_bought >= len(PAID_CLUES):
        raise ValueError("In diesem Versuch ist kein weiterer Hinweis verfügbar.")
    return Attempt(attempt.score - 15, attempt.clues_bought + 1,
                   attempt.wrong_guess, attempt.outcome)


def guess(attempt: Attempt, candidate_id: int) -> Attempt:
    if attempt.outcome != "playing":
        raise ValueError("Dieser Versuch ist bereits beendet.")
    if candidate_id not in CANDIDATE_IDS:
        raise ValueError("Dieses Kunstwerk gehört nicht zum Fall.")
    if candidate_id == attempt.wrong_guess:
        raise ValueError("Dieser Kandidat wurde bereits ausgeschlossen.")
    if candidate_id == TARGET_ID:
        return Attempt(attempt.score, attempt.clues_bought,
                       attempt.wrong_guess, "won")
    if attempt.wrong_guess is None:
        return Attempt(attempt.score - 25, attempt.clues_bought,
                       candidate_id, "playing")
    return Attempt(attempt.score, attempt.clues_bought,
                   attempt.wrong_guess, "lost")

