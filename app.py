"""GharSehat backend — Flask app setup, CORS, and route wiring.

Step 1 wires only the health check and the /assess scoring endpoint.
Image analysis, capture checks, and the doctor portal come later.
"""

from flask import Flask, Response, jsonify, request
from flask_cors import CORS

from assess import AssessmentError, assess

app = Flask(__name__)
CORS(app)  # Allow all origins — hackathon prototype.


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


if __name__ == "__main__":
    app.run(port=5000, debug=True)
