"""Lokaler Demo-Spielstand. Noch keine Benutzerkonten oder Online-Datenbank."""

import sqlite3
from pathlib import Path

from game import Attempt, CASE_ID

DB_PATH = Path(__file__).parent / "data" / "museum_mystery.db"


def load_attempt(path: Path = DB_PATH) -> Attempt:
    path.parent.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(path) as connection:
        connection.execute("""CREATE TABLE IF NOT EXISTS attempts (
            case_id TEXT PRIMARY KEY, score INTEGER NOT NULL,
            clues_bought INTEGER NOT NULL, wrong_guess INTEGER,
            outcome TEXT NOT NULL)""")
        row = connection.execute(
            "SELECT score, clues_bought, wrong_guess, outcome FROM attempts WHERE case_id = ?",
            (CASE_ID,),
        ).fetchone()
    return Attempt(*row) if row else Attempt()


def save_attempt(attempt: Attempt, path: Path = DB_PATH) -> None:
    load_attempt(path)  # Legt die Tabelle auch beim ersten Speichern an.
    with sqlite3.connect(path) as connection:
        connection.execute("""INSERT INTO attempts VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(case_id) DO UPDATE SET score=excluded.score,
            clues_bought=excluded.clues_bought, wrong_guess=excluded.wrong_guess,
            outcome=excluded.outcome""",
            (CASE_ID, attempt.score, attempt.clues_bought,
             attempt.wrong_guess, attempt.outcome),
        )


def reset_attempt(path: Path = DB_PATH) -> None:
    save_attempt(Attempt(), path)

