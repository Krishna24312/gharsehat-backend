"""GharSehat backend — Flask app setup, CORS, and route wiring.

Wires the health check, the /assess scoring endpoint, the doctor portal
(/patients and /patient/<id>/history), a mock /analyze endpoint, an
experimental real-OpenCV /analyze-real endpoint, and a /capture-check
photo-quality endpoint. The /analyze mock stays the demo safety net.
"""

import json
import os
import re
import uuid
from datetime import datetime, timedelta, timezone

from flask import Flask, Response, jsonify, request, send_from_directory
from flask_cors import CORS

from analyze import AnalyzeError, analyze_pair
from assess import SYMPTOM_WEIGHTS, AssessmentError, assess
from capture_check import CaptureCheckError, check_capture_frame
from data import PATIENTS, get_current_status, get_last_check_in_timestamp
from storage import (
    UPLOADS_DIR,
    StorageError,
    append_checkin,
    get_checkins_for_patient,
    get_latest_checkin_for_patient,
    parse_float,
    save_uploaded_image,
)

# static_folder=None disables Flask's built-in /static route; the SPA fallback
# below serves the built frontend (including its assets) instead.
app = Flask(__name__, static_folder=None)
CORS(app)  # Allow all origins — hackathon prototype.

# Triage ordering for the doctor portal: red first, then amber, then green.
STATUS_ORDER: dict[str, int] = {"red": 0, "amber": 1, "green": 2}

# Built React frontend, produced by `npm run build` inside frontend/.
DIST_DIR = os.path.join(os.path.dirname(__file__), "frontend", "dist")
INDEX_FILE = os.path.join(DIST_DIR, "index.html")


def _serve_frontend() -> Response:
    """Serve the built SPA's index.html, or a JSON hint if it isn't built."""
    if os.path.exists(INDEX_FILE):
        return send_from_directory(DIST_DIR, "index.html")
    return jsonify(
        {
            "message": "GharSehat backend running",
            "frontend": "not built — run npm run build in frontend/",
        }
    )


@app.route("/health", methods=["GET"])
def health() -> Response:
    """Backend liveness check."""
    return jsonify({"message": "GharSehat backend running"})


@app.route("/", methods=["GET"])
def index() -> Response:
    """Serve the built frontend at the root, or a JSON fallback if unbuilt."""
    return _serve_frontend()


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
    never a diagnosis claim.
    """
    if "yesterday" not in request.files or "today" not in request.files:
        return jsonify({"error": "Both yesterday and today image files are required."}), 400
    return jsonify(
        {
            "change_score": 68,
            "redness_delta": 23,
            "border_change": 12,
            "mock": True,
            "disclaimer": "This checks visual change between photos only. It is not a medical diagnosis.",
        }
    )


@app.route("/analyze-real", methods=["POST"])
def analyze_real() -> Response | tuple[Response, int]:
    """Experimental real-OpenCV wound-change comparison.

    Expects multipart/form-data with image files `yesterday` and `today`
    (JPG/PNG; HEIC may not decode). Runs a controlled-demo CV pipeline and
    reports visual change only — never a diagnosis. The bytes are analysed
    in-memory and never saved. The /analyze mock above is left untouched as
    the demo safety net.
    """
    if "yesterday" not in request.files or "today" not in request.files:
        return jsonify({"error": "Both yesterday and today image files are required."}), 400
    yesterday_bytes = request.files["yesterday"].read()
    today_bytes = request.files["today"].read()
    try:
        result = analyze_pair(yesterday_bytes, today_bytes)
    except AnalyzeError as error:
        return jsonify({"error": error.message}), 400
    return jsonify(result)


@app.route("/capture-check", methods=["POST"])
def capture_check() -> Response | tuple[Response, int]:
    """Check a live preview frame's lighting and blur before capture.

    Expects multipart/form-data with one image file named `frame`. The frame
    is analysed in-memory and never saved. Returns a photo-quality verdict
    only — no diagnosis.
    """
    if "frame" not in request.files:
        return jsonify({"error": "Image frame is required."}), 400
    image_bytes = request.files["frame"].read()
    try:
        result = check_capture_frame(image_bytes)
    except CaptureCheckError as error:
        return jsonify({"error": error.message}), 400
    return jsonify(result)


@app.route("/patients", methods=["GET"])
def list_patients() -> Response:
    """List all patients sorted by risk for the doctor portal.

    Red first, then amber, then green; within each band the most recent
    check-in comes first.
    """
    summaries = []
    for patient in PATIENTS.values():
        last_status = get_current_status(patient)
        last_check_in = get_last_check_in_timestamp(patient)
        # A submitted check-in (live caregiver data) overrides the hardcoded
        # latest status/date so the doctor portal reflects it immediately.
        latest = get_latest_checkin_for_patient(patient["id"])
        if latest is not None:
            last_status = latest["status"]
            last_check_in = latest["created_at"]
        summaries.append(
            {
                "id": patient["id"],
                "name": patient["name"],
                "age": patient["age"],
                "gender": patient["gender"],
                "burn_location": patient["burn_location"],
                "day_of_recovery": patient["day_of_recovery"],
                "last_status": last_status,
                "last_check_in": last_check_in,
            }
        )
    # Stable sort: order by check-in date (newest first), then by risk band so
    # the date ordering is preserved within each band.
    summaries.sort(key=lambda summary: summary["last_check_in"], reverse=True)
    summaries.sort(key=lambda summary: STATUS_ORDER[summary["last_status"]])
    return jsonify(summaries)


def _history_entry_from_checkin(checkin: dict, display_date: str) -> dict[str, object]:
    """Shape a submitted check-in like a hardcoded history entry.

    `display_date` is a demo-sequential date placed after the hardcoded
    timeline (so it reads in order); `created_at` keeps the real ISO
    submission timestamp. symptom_score is derived from the same weights
    /assess uses, so submitted rows are consistent with the rest of the
    timeline.
    """
    symptoms = checkin.get("symptoms") or {}
    symptom_score = sum(weight for name, weight in SYMPTOM_WEIGHTS.items() if symptoms.get(name))
    entry = {
        "date": display_date,
        # photo_url stays as the today/current photo for backwards compatibility.
        "photo_url": checkin.get("today_photo_url"),
        # Expose the full before/today pair so the UI can show both photos.
        "today_photo_url": checkin.get("today_photo_url"),
        "yesterday_photo_url": checkin.get("yesterday_photo_url"),
        "checkin_id": checkin.get("checkin_id"),
        "change_score": checkin.get("change_score"),
        "redness_delta": checkin.get("redness_delta"),
        "symptoms": symptoms,
        "symptom_score": symptom_score,
        "final_score": checkin.get("final_score"),
        "status": checkin.get("status"),
        "created_at": checkin.get("created_at"),
        "submitted": True,
    }
    # Optional advanced visual metrics, only when they were saved.
    for key in ("dark_area_delta", "yellow_area_delta", "wound_area_delta", "combined_border_change"):
        if checkin.get(key) is not None:
            entry[key] = checkin[key]
    return entry


@app.route("/patient/<patient_id>/history", methods=["GET"])
def patient_history(patient_id: str) -> Response | tuple[Response, int]:
    """Return a patient's 5-day timeline plus any submitted check-ins, or 404."""
    patient = PATIENTS.get(patient_id)
    if patient is None:
        return jsonify({"error": "patient not found"}), 404
    # Hardcoded 5-day timeline first, then live submitted check-ins appended
    # chronologically after it. Submitted entries get demo-sequential dates
    # continuing past the last hardcoded date (e.g. ...06-05 -> 06-06, 06-07).
    history = list(patient["history"])
    last_hardcoded_date = patient["history"][-1]["date"] if patient["history"] else None
    for index, checkin in enumerate(get_checkins_for_patient(patient_id)):
        if last_hardcoded_date:
            base = datetime.strptime(last_hardcoded_date, "%Y-%m-%d").date()
            display_date = (base + timedelta(days=index + 1)).isoformat()
        else:
            display_date = str(checkin.get("created_at", ""))[:10]
        history.append(_history_entry_from_checkin(checkin, display_date))
    return jsonify(
        {
            "id": patient["id"],
            "name": patient["name"],
            "age": patient["age"],
            "gender": patient["gender"],
            "burn_location": patient["burn_location"],
            "burn_type": patient["burn_type"],
            "day_of_recovery": patient["day_of_recovery"],
            "history": history,
        }
    )


@app.route("/checkins", methods=["POST"])
def submit_checkin() -> Response | tuple[Response, int]:
    """Accept a caregiver check-in (multipart) and persist it.

    Saves the uploaded photo(s) and appends a submitted check-in that shows up
    immediately in /patients and /patient/<id>/history. Stores the caregiver's
    own scores and status — it does not diagnose.
    """
    form = request.form

    patient_id = (form.get("patient_id") or "").strip()
    if not re.fullmatch(r"[A-Za-z0-9_-]+", patient_id):
        return jsonify({"error": "patient_id is required and must be alphanumeric."}), 400

    today_file = request.files.get("today")
    if today_file is None or not today_file.filename:
        return jsonify({"error": "today image file is required."}), 400

    change_score = parse_float(form.get("change_score"))
    if change_score is None:
        return jsonify({"error": "change_score is required and must be numeric."}), 400
    final_score = parse_float(form.get("final_score"))
    if final_score is None:
        return jsonify({"error": "final_score is required and must be numeric."}), 400

    status = form.get("status")
    if status not in {"green", "amber", "red"}:
        return jsonify({"error": "status must be one of green, amber, red."}), 400

    raw_symptoms = form.get("symptoms")
    try:
        symptoms = json.loads(raw_symptoms) if raw_symptoms else None
    except (TypeError, ValueError):
        return jsonify({"error": "symptoms must be valid JSON."}), 400
    if not isinstance(symptoms, dict):
        return jsonify({"error": "symptoms must be a JSON object."}), 400

    # Optional fields.
    redness_delta = parse_float(form.get("redness_delta"))
    border_change = parse_float(form.get("border_change"))
    action = form.get("action")
    yesterday_file = request.files.get("yesterday")

    # Optional advanced /analyze-real visual metrics. Only stored when present
    # so older / mock-analyze check-ins stay backward compatible.
    advanced_metrics = {
        key: parse_float(form.get(key))
        for key in ("dark_area_delta", "yellow_area_delta", "wound_area_delta", "combined_border_change")
        if parse_float(form.get(key)) is not None
    }

    try:
        today_photo_url = save_uploaded_image(today_file, patient_id)
        yesterday_photo_url = None
        if yesterday_file is not None and yesterday_file.filename:
            yesterday_photo_url = save_uploaded_image(yesterday_file, patient_id)
    except StorageError as error:
        return jsonify({"error": error.message}), 400
    except OSError:
        return jsonify({"error": "Could not save the uploaded image."}), 400

    entry = {
        "checkin_id": uuid.uuid4().hex,
        "patient_id": patient_id,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "today_photo_url": today_photo_url,
        "yesterday_photo_url": yesterday_photo_url,
        "change_score": change_score,
        "redness_delta": redness_delta,
        "border_change": border_change,
        "final_score": final_score,
        "status": status,
        "action": action,
        "symptoms": symptoms,
        "submitted": True,
        **advanced_metrics,
    }
    append_checkin(entry)

    return (
        jsonify(
            {
                "saved": True,
                "checkin_id": entry["checkin_id"],
                "patient_id": patient_id,
                "today_photo_url": today_photo_url,
                "yesterday_photo_url": yesterday_photo_url,
            }
        ),
        201,
    )


@app.route("/uploads/<path:filename>", methods=["GET"])
def serve_upload(filename: str) -> Response:
    """Serve a saved check-in image; 404 if missing (send_from_directory is
    path-traversal safe)."""
    return send_from_directory(UPLOADS_DIR, filename)


# SPA fallback — declared after all API routes so they keep priority (Flask
# also ranks specific rules above this catch-all). Serves a real built asset
# when the path matches one, otherwise the SPA entry point.
@app.route("/<path:path>", methods=["GET"])
def spa_fallback(path: str) -> Response:
    """Serve a static asset from the build, else fall back to index.html."""
    asset_path = os.path.join(DIST_DIR, path)
    if os.path.isfile(asset_path):
        return send_from_directory(DIST_DIR, path)
    return _serve_frontend()


if __name__ == "__main__":
    app.run(port=5000, debug=True)
