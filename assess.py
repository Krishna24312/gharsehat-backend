"""Symptom scoring logic for the /assess endpoint.

Combines the visual change_score with a weighted symptom score, maps the
result to a green/amber/red status, and selects a fixed caregiver message
and action. This reports measurable severity only — never a diagnosis.

Design rule: high sensitivity over precision. False alarms are acceptable;
missing something important is not.
"""

from messages import DISCLAIMER_ENGLISH, DISCLAIMER_HINDI, MESSAGES

# Points each symptom adds to the symptom score when marked true.
SYMPTOM_WEIGHTS: dict[str, int] = {
    "spreading_redness": 30,
    "fever": 25,
    "discharge": 20,
    "smell": 15,
    "increasing_pain": 10,
}


class AssessmentError(Exception):
    """Raised when the /assess request body fails validation.

    The HTTP layer turns this into a 400 JSON error response.
    """

    def __init__(self, message: str) -> None:
        super().__init__(message)
        self.message = message


def _is_number(value: object) -> bool:
    """True for int/float values, excluding bool (a subclass of int)."""
    return isinstance(value, (int, float)) and not isinstance(value, bool)


def assess(payload: object) -> dict[str, object]:
    """Score a single check-in and build the caregiver-facing response.

    `payload` is the parsed JSON request body (or None if the body was
    missing or unparseable). Raises AssessmentError on invalid input.
    """
    if not isinstance(payload, dict):
        raise AssessmentError("Request body must be a JSON object.")

    change_score = payload.get("change_score")
    if not _is_number(change_score):
        raise AssessmentError("change_score is required and must be a number.")
    if change_score < 0 or change_score > 100:
        raise AssessmentError("change_score must be between 0 and 100.")

    symptoms = payload.get("symptoms")
    if symptoms is None:
        symptoms = {}  # Missing symptoms default to all false.
    if not isinstance(symptoms, dict):
        raise AssessmentError("symptoms must be a JSON object if provided.")

    # Only known symptoms count; unknown keys are ignored.
    positive_symptoms = [name for name in SYMPTOM_WEIGHTS if symptoms.get(name)]
    symptom_score = sum(SYMPTOM_WEIGHTS[name] for name in positive_symptoms)
    final_score = round(change_score * 0.5 + symptom_score * 0.5, 2)

    status, action, message_key = _classify(final_score)

    return {
        "status": status,
        "change_score": change_score,
        "symptom_score": symptom_score,
        "final_score": final_score,
        "positive_symptoms": positive_symptoms,
        "message_hindi": MESSAGES[message_key]["hindi"],
        "message_english": MESSAGES[message_key]["english"],
        "action": action,
        "disclaimer_hindi": DISCLAIMER_HINDI,
        "disclaimer_english": DISCLAIMER_ENGLISH,
    }


def _classify(final_score: float) -> tuple[str, str, str]:
    """Map a final score to (status, action, message template key)."""
    if final_score < 30:
        return "green", "continue_care", "green"
    if final_score < 60:
        return "amber", "watch_closely", "amber"
    if final_score < 75:
        return "red", "show_doctor_today", "red"
    return "red", "call_108", "severe_red"
