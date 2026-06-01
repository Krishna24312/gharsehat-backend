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

    response = {
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
    # Patient-friendly guidance derived from the computed values above. The
    # numeric triage fields (for doctors) are left exactly as they were.
    response.update(
        build_patient_guidance_payload(change_score, symptom_score, final_score, status, action, symptoms)
    )
    return response


def _classify(final_score: float) -> tuple[str, str, str]:
    """Map a final score to (status, action, message template key)."""
    if final_score < 30:
        return "green", "continue_care", "green"
    if final_score < 60:
        return "amber", "watch_closely", "amber"
    if final_score < 75:
        return "red", "show_doctor_today", "red"
    return "red", "call_108", "severe_red"


# Human-readable lines for each reported symptom. Wording is non-diagnostic:
# it states what was *reported*, not what it means.
SYMPTOM_REASONS: dict[str, str] = {
    "fever": "Fever was reported.",
    "discharge": "Discharge was reported.",
    "smell": "Smell was reported.",
    "spreading_redness": "Redness was reported as spreading.",
    "increasing_pain": "Pain was reported as increasing.",
}

# Patient guidance keyed by (status, action). A status/action combo not listed
# here falls back to GUIDANCE_FALLBACK.
PATIENT_GUIDANCE: dict[tuple[str, str], dict[str, str]] = {
    ("green", "continue_care"): {
        "patient_title": "Looking stable today",
        "patient_summary": "No major visual change was seen today.",
        "next_step": "Continue dressing care and check in again tomorrow.",
        "care_level_label": "Stable",
    },
    ("amber", "watch_closely"): {
        "patient_title": "Watch closely",
        "patient_summary": "Some visual change was seen today.",
        "next_step": "Continue care, repeat check-in tomorrow, and contact your doctor if symptoms increase.",
        "care_level_label": "Watch closely",
    },
    ("red", "show_doctor_today"): {
        "patient_title": "Doctor review recommended",
        "patient_summary": "This check-in shows enough change that a doctor should review it.",
        "next_step": "Show this check-in to your doctor today.",
        "care_level_label": "Doctor review",
    },
    ("red", "call_108"): {
        "patient_title": "Urgent care recommended",
        "patient_summary": "This check-in shows changes or symptoms that need urgent medical attention.",
        "next_step": "Call 108 or go to the nearest hospital.",
        "care_level_label": "Urgent care",
    },
}

GUIDANCE_FALLBACK: dict[str, str] = {
    "patient_title": "Review recommended",
    "patient_summary": "This check-in should be reviewed with care.",
    "next_step": "Contact your doctor if you are concerned or symptoms increase.",
    "care_level_label": "Review",
}


def _clamp(value: float, low: float = 0.0, high: float = 100.0) -> float:
    """Clamp `value` into [low, high]."""
    return max(low, min(high, value))


def get_visual_change_label(change_score: float) -> str:
    """Bucket the visual change_score into a plain-language label."""
    if change_score < 30:
        return "Low visual change"
    if change_score < 60:
        return "Some visual change"
    return "High visual change"


def build_reason_summary(change_score: float, symptoms: dict) -> list[str]:
    """Build plain-language reasons for the result from the actual inputs.

    Leads with a visual-change line, then one line per reported symptom (or a
    single line noting none were reported). Non-diagnostic wording only.
    """
    if change_score >= 60:
        reasons = ["The photo comparison showed a clear visual change."]
    elif change_score >= 30:
        reasons = ["The photo comparison showed some visual change."]
    else:
        reasons = ["The photo comparison looked mostly stable."]

    symptom_lines = [reason for name, reason in SYMPTOM_REASONS.items() if symptoms.get(name)]
    if symptom_lines:
        reasons.extend(symptom_lines)
    else:
        reasons.append("No concerning symptoms were reported.")
    return reasons


def get_patient_guidance(status: str, action: str, final_score: float) -> dict[str, object]:
    """Select patient guidance for the computed status/action.

    `final_score` is clamped to 0-100 and returned as care_level_position so
    the result screen can place a marker on a 0-100 care scale.
    """
    guidance = PATIENT_GUIDANCE.get((status, action), GUIDANCE_FALLBACK)
    return {**guidance, "care_level_position": _clamp(final_score)}


def build_patient_guidance_payload(
    change_score: float,
    symptom_score: int,
    final_score: float,
    status: str,
    action: str,
    symptoms: dict,
) -> dict[str, object]:
    """Assemble all patient-friendly guidance fields added to /assess.

    Wording templates are predefined, but which wording is selected is driven
    entirely by the computed values passed in.
    """
    guidance = get_patient_guidance(status, action, final_score)
    return {
        "patient_title": guidance["patient_title"],
        "patient_summary": guidance["patient_summary"],
        "reason_summary": build_reason_summary(change_score, symptoms),
        "next_step": guidance["next_step"],
        "care_level_label": guidance["care_level_label"],
        "care_level_position": guidance["care_level_position"],
        "visual_change_label": get_visual_change_label(change_score),
    }
