"""Hardcoded in-memory demo data for the doctor portal.

This is simulated demo data, not real collected patient data. There is no
database and no persistence — the dictionary below is rebuilt on every start.

Each daily check-in's symptom_score, final_score, and status are computed by
assess.assess() so they always match exactly what the /assess endpoint would
return for the same change_score + symptoms input.
"""

from assess import assess

# Fixed simulated demo dates. The most recent check-in is 2026-06-05 for every
# patient so they all appear active during the demo.
DATES: list[str] = [
    "2026-06-01",
    "2026-06-02",
    "2026-06-03",
    "2026-06-04",
    "2026-06-05",
]

# The five symptom keys from CLAUDE.md. Every check-in carries all five.
SYMPTOM_KEYS: list[str] = [
    "fever",
    "smell",
    "spreading_redness",
    "discharge",
    "increasing_pain",
]


def _symptoms(*positive: str) -> dict[str, bool]:
    """Build a full 5-key symptom dict; listed keys are true, the rest false."""
    return {key: key in positive for key in SYMPTOM_KEYS}


def _check_in(name: str, day: int, date: str, change_score: float, *positive: str) -> dict[str, object]:
    """Build one daily check-in with scores derived from assess.assess().

    `day` is the 1-5 position in the demo window and feeds the photo_url
    naming convention. The image files themselves are not created.
    """
    symptoms = _symptoms(*positive)
    scored = assess({"change_score": change_score, "symptoms": symptoms})
    return {
        "date": date,
        "photo_url": f"/static/demo/{name.lower()}_day{day}.jpg",
        "change_score": change_score,
        "symptoms": symptoms,
        "symptom_score": scored["symptom_score"],
        "final_score": scored["final_score"],
        "status": scored["status"],
    }


# Five hardcoded patients keyed by string id.
# day_of_recovery is aligned to the 5-day demo window (recovery days 1-5),
# so photo day numbers map cleanly to recovery days, as in Ravi's example.
PATIENTS: dict[str, dict[str, object]] = {
    "1": {
        "id": "1",
        "name": "Ravi",
        "age": 34,
        "gender": "male",
        "burn_location": "left forearm",
        "burn_type": "2nd-degree burn",
        "day_of_recovery": 5,
        # Live demo patient: steady improvement days 1-4, sharp Day 5 reversal
        # into red (spreading redness + fever).
        "history": [
            _check_in("Ravi", 1, DATES[0], 40.0, "increasing_pain"),
            _check_in("Ravi", 2, DATES[1], 30.0, "increasing_pain"),
            _check_in("Ravi", 3, DATES[2], 22.0),
            _check_in("Ravi", 4, DATES[3], 14.0),
            _check_in("Ravi", 5, DATES[4], 68.0, "spreading_redness", "fever", "increasing_pain"),
        ],
    },
    "2": {
        "id": "2",
        "name": "Sunita",
        "age": 52,
        "gender": "female",
        "burn_location": "right calf",
        "burn_type": "2nd-degree burn",
        "day_of_recovery": 5,
        # Slow healer: persistent moderate change, currently amber.
        "history": [
            _check_in("Sunita", 1, DATES[0], 72.0),
            _check_in("Sunita", 2, DATES[1], 70.0, "increasing_pain"),
            _check_in("Sunita", 3, DATES[2], 64.0, "increasing_pain"),
            _check_in("Sunita", 4, DATES[3], 60.0),
            _check_in("Sunita", 5, DATES[4], 58.0, "discharge"),
        ],
    },
    "3": {
        "id": "3",
        "name": "Imran",
        "age": 45,
        "gender": "male",
        "burn_location": "upper back",
        "burn_type": "2nd-degree burn",
        "day_of_recovery": 5,
        # Gradual improvement but still amber at the latest check-in.
        "history": [
            _check_in("Imran", 1, DATES[0], 78.0),
            _check_in("Imran", 2, DATES[1], 74.0),
            _check_in("Imran", 3, DATES[2], 70.0, "smell"),
            _check_in("Imran", 4, DATES[3], 66.0),
            _check_in("Imran", 5, DATES[4], 62.0, "increasing_pain"),
        ],
    },
    "4": {
        "id": "4",
        "name": "Anjali",
        "age": 29,
        "gender": "female",
        "burn_location": "left hand",
        "burn_type": "1st-degree burn",
        "day_of_recovery": 5,
        # Healing well, consistently green.
        "history": [
            _check_in("Anjali", 1, DATES[0], 40.0, "increasing_pain"),
            _check_in("Anjali", 2, DATES[1], 34.0),
            _check_in("Anjali", 3, DATES[2], 28.0),
            _check_in("Anjali", 4, DATES[3], 20.0),
            _check_in("Anjali", 5, DATES[4], 12.0),
        ],
    },
    "5": {
        "id": "5",
        "name": "Vikram",
        "age": 61,
        "gender": "male",
        "burn_location": "scalp",
        "burn_type": "2nd-degree burn",
        "day_of_recovery": 5,
        # Steady recovery, green throughout.
        "history": [
            _check_in("Vikram", 1, DATES[0], 48.0),
            _check_in("Vikram", 2, DATES[1], 40.0),
            _check_in("Vikram", 3, DATES[2], 30.0),
            _check_in("Vikram", 4, DATES[3], 22.0, "increasing_pain"),
            _check_in("Vikram", 5, DATES[4], 16.0),
        ],
    },
}


def get_current_status(patient: dict[str, object]) -> str:
    """Return the status of the patient's most recent check-in."""
    history = patient["history"]
    return history[-1]["status"]


def get_last_check_in_timestamp(patient: dict[str, object]) -> str:
    """Return the date of the patient's most recent check-in."""
    history = patient["history"]
    return history[-1]["date"]
