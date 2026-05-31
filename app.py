"""GharSehat backend — Flask app setup, CORS, and route wiring.

Wires the health check, the /assess scoring endpoint, the doctor portal
(/patients and /patient/<id>/history), and a mock /analyze endpoint.
Real OpenCV image comparison and /capture-check come later.
"""

from flask import Flask, Response, jsonify, request
from flask_cors import CORS

from assess import AssessmentError, assess
from data import PATIENTS, get_current_status, get_last_check_in_timestamp

app = Flask(__name__)
CORS(app)  # Allow all origins — hackathon prototype.

# Triage ordering for the doctor portal: red first, then amber, then green.
STATUS_ORDER: dict[str, int] = {"red": 0, "amber": 1, "green": 2}


@app.route("/", methods=["GET"])
def health() -> Response:
    """Simple liveness check."""
    return jsonify({"message": "GharSehat backend running"})


@app.route("/assess", methods=["POST"])
def assess_route() -> Response | tuple[Response, int]:
    """Score a check-in and return the caregiver-facing assessment."""
    payload = request.get_json(silent=True)
    try:
        result = assess(payload)
    except AssessmentError as error:
        return jsonify({"error": error.message}), 400
    return jsonify(result)


@app.route("/analyze", methods=["POST"])
def analyze() -> Response | tuple[Response, int]:
    """Mock wound-change analysis from two uploaded photos.

    Expects multipart/form-data with image files `yesterday` and `today`.
    Returns a fixed change score for the demo — the uploaded bytes are not
    read, processed, or saved. Real OpenCV comparison replaces this later,
    at which point the "mock" flag goes away. Reports visual change only,
    never infection.
    """
    if "yesterday" not in request.files or "today" not in request.files:
        return jsonify({"error": "Both yesterday and today image files are required."}), 400
    return jsonify(
        {
            "change_score": 68,
            "redness_delta": 23,
            "border_change": 12,
            "mock": True,
            "disclaimer": "This detects visual change only, not infection.",
        }
    )


@app.route("/patients", methods=["GET"])
def list_patients() -> Response:
    """List all patients sorted by risk for the doctor portal.

    Red first, then amber, then green; within each band the most recent
    check-in comes first.
    """
    summaries = [
        {
            "id": patient["id"],
            "name": patient["name"],
            "age": patient["age"],
            "gender": patient["gender"],
            "burn_location": patient["burn_location"],
            "day_of_recovery": patient["day_of_recovery"],
            "last_status": get_current_status(patient),
            "last_check_in": get_last_check_in_timestamp(patient),
        }
        for patient in PATIENTS.values()
    ]
    # Stable sort: order by check-in date (newest first), then by risk band so
    # the date ordering is preserved within each band.
    summaries.sort(key=lambda summary: summary["last_check_in"], reverse=True)
    summaries.sort(key=lambda summary: STATUS_ORDER[summary["last_status"]])
    return jsonify(summaries)


@app.route("/patient/<patient_id>/history", methods=["GET"])
def patient_history(patient_id: str) -> Response | tuple[Response, int]:
    """Return one patient's full 5-day check-in timeline, or 404 if unknown."""
    patient = PATIENTS.get(patient_id)
    if patient is None:
        return jsonify({"error": "patient not found"}), 404
    return jsonify(
        {
            "id": patient["id"],
            "name": patient["name"],
            "age": patient["age"],
            "gender": patient["gender"],
            "burn_location": patient["burn_location"],
            "burn_type": patient["burn_type"],
            "day_of_recovery": patient["day_of_recovery"],
            "history": patient["history"],
        }
    )


if __name__ == "__main__":
    app.run(port=5000, debug=True)
