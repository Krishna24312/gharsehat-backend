GharSehat Backend
AI burn wound recovery companion. Detects daily change between wound photos for Indian home caregivers, with a doctor portal for triaged review.
Critical design rules

Detect change, never diagnosis. Outputs describe pixel-level change only: "redness area increased 20%", never "wound is infected".
High sensitivity over precision. Miss nothing important. False alarms are acceptable.
No push notifications to doctors. Escalation goes to the caregiver. The doctor portal updates silently for the doctor's later review.
Demo data only. No auth, no database. Patient data is hardcoded in data.py as an in-memory dict.

Tech stack

Python 3.11+
Flask + flask-cors
OpenCV (opencv-python)
NumPy

File structure (build incrementally — do not pre-create empty files)

app.py — Flask app, all route handlers
assess.py — symptom scoring logic
analyze.py — OpenCV image comparison logic
data.py — hardcoded patient data and demo fixtures
messages.py — Hindi / English message templates
requirements.txt
static/ — sample photos and reference card image for the demo

API contract
POST /assess
Input: { "change_score": float 0-100, "symptoms": { "fever": bool, "smell": bool, "spreading_redness": bool, "discharge": bool, "increasing_pain": bool } }
Scoring: final_score = change_score * 0.5 + symptom_score * 0.5, where symptom weights are:

spreading_redness: 30
fever: 25
discharge: 20
smell: 15
increasing_pain: 10

(symptom_score is the sum of weights for symptoms set to true; max 100)
Returns: { "status": "green" | "amber" | "red", "final_score": float, "message_hindi": str, "message_english": str, "action": str }
Status thresholds: green < 30, amber 30–60, red > 60. Severe red (≥ 75) action: "call 108". Other red action: "see doctor today".
POST /analyze
Input: multipart form with two image files (yesterday, today), each showing the wound plus a printed reference card.
Pipeline: detect reference card → normalize colour (white balance) and scale (mm per pixel) → HSV mask for redness → compute area and bounding-box deltas.
Returns: { "change_score": float 0-100, "redness_delta": float (percentage), "border_change": float (percentage) }
POST /capture-check
Input: one image (single live preview frame).
Returns: { "status": "good" | "card_not_found" | "too_far" | "too_close" | "bad_lighting" }
Called 2–3 times per second from the camera screen.
GET /patients
Returns: list of patients sorted by risk (red first). Each: { id, name, age, day_of_recovery, last_status, last_check_in }.
GET /patient/<id>/history
Returns: full timeline for one patient: { id, name, history: [ { date, photo_url, change_score, symptoms, status } ] }.
Demo data
Hardcode 5 patients in data.py:

ravi — id 1, age 34, left forearm 2nd-degree burn, day 5, currently red (the live demo patient)
2 amber patients, 2 green patients (varied names, ages, burn locations)

Each with 5 days of fake check-in history.
Conventions

Snake_case throughout
Type hints on all function signatures
Each endpoint as a separate function imported into app.py
All routes return JSON via jsonify
CORS enabled for all origins (this is a hackathon)
Server runs on port 5000

What NOT to do

Do NOT create any frontend files (no .jsx, .tsx, .html, .css). Frontend is in a separate repo.
Do NOT add authentication.
Do NOT add a database. In-memory dicts only.
Do NOT train or load any ML model. Pure rule-based CV.
Do NOT implement WhatsApp sending. There is no WhatsApp channel — escalation is to the caregiver via the action and message_* fields.
Do NOT add logging frameworks. print() for debug is fine.

Running the app
source venv/bin/activate
pip install -r requirements.txt
python app.py
App runs on http://localhost:5000. Test endpoints with curl from a second terminal.