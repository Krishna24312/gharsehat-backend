# GharSehat Backend

AI burn wound recovery companion. Detects daily change between wound photos for Indian home caregivers, with a doctor portal for triaged review.

Built for a 2-day national student hackathon. Prioritize a stable working demo over production complexity.

## One-liner

GharSehat is an AI-powered burn wound recovery companion for Indian home caregivers that detects daily visual change before human eyes can.

## Critical design rules

1. **Detect change, never diagnosis.**
   Outputs describe measurable visual change only: `"redness area increased 20%"`, never `"wound is infected"`.

2. **High sensitivity over precision.**
   Miss nothing important. False alarms are acceptable.

3. **No push notifications to doctors.**
   Escalation goes to the caregiver. The doctor portal updates silently for the doctor's later review.

4. **Demo data only.**
   No authentication, no database, no persistence. Patient data is hardcoded in `data.py` as in-memory dictionaries.

5. **No LLM-generated medical advice.**
   Caregiver messages must come from fixed Hindi/English templates.

6. **Hindi must use Devanagari script.**
   Do not use Hinglish or Romanized Hindi for `message_hindi`.

7. **Reference card matters.**
   Wound photos should include a printed reference card for color, scale, and distance normalization. This will be implemented in the OpenCV stage later.

## Tech stack

* Python 3.11+
* Flask
* flask-cors
* OpenCV (`opencv-python`)
* NumPy

## File structure

Build incrementally. Do not pre-create empty files.

* `app.py` — Flask app setup, CORS, route wiring, server entry point
* `assess.py` — symptom scoring logic
* `messages.py` — Hindi and English message templates
* `analyze.py` — OpenCV image comparison logic, added later
* `data.py` — hardcoded patient data and demo fixtures, added later
* `requirements.txt`
* `static/` — sample photos and reference card image for the demo, added later

## General conventions

* Use `snake_case` throughout.
* Add type hints on all function signatures.
* All routes return JSON via `jsonify`.
* CORS enabled for all origins because this is a hackathon prototype.
* Server runs on port `5000`.
* Keep code simple and readable.
* Use `print()` for debug if needed.
* Do not add logging frameworks.
* Do not overbuild production infrastructure.

## API contract

### POST `/assess`

Input:

```json
{
  "change_score": 68,
  "symptoms": {
    "fever": true,
    "smell": false,
    "spreading_redness": true,
    "discharge": false,
    "increasing_pain": false
  }
}
```

Symptom weights:

```text
spreading_redness: 30
fever: 25
discharge: 20
smell: 15
increasing_pain: 10
```

Scoring:

```text
symptom_score = sum of weights for symptoms marked true
final_score = change_score * 0.5 + symptom_score * 0.5
```

Status thresholds:

```text
green: final_score < 30
amber: final_score >= 30 and final_score < 60
red: final_score >= 60
```

Actions:

```text
green: continue_care
amber: watch_closely
red and final_score < 75: show_doctor_today
red and final_score >= 75: call_108
```

Returns:

```json
{
  "status": "green | amber | red",
  "final_score": 0,
  "change_score": 0,
  "symptom_score": 0,
  "positive_symptoms": [],
  "message_hindi": "",
  "message_english": "",
  "action": "",
  "disclaimer_hindi": "यह चिकित्सा निदान नहीं है। हमेशा अपने डॉक्टर से सलाह लें।",
  "disclaimer_english": "Not a medical diagnosis. Always consult your doctor."
}
```

Validation rules:

* If request body is missing, return HTTP 400 JSON error.
* If `change_score` is missing or not numeric, return HTTP 400 JSON error.
* If `change_score` is below 0 or above 100, return HTTP 400 JSON error.
* If `symptoms` is missing, default all symptoms to false.
* Ignore unknown symptom keys.

## Fixed message templates

Use these fixed templates unless explicitly asked to change them.

### Green

English:

```text
No significant change detected since yesterday. Continue dressing care as advised.
```

Hindi:

```text
कल से कोई महत्वपूर्ण बदलाव नहीं दिखा है। डॉक्टर की सलाह के अनुसार ड्रेसिंग जारी रखें।
```

### Amber

English:

```text
Some change detected. Watch closely and show this to your doctor at the next visit.
```

Hindi:

```text
कुछ बदलाव दिखा है। ध्यान से निगरानी रखें और अगली मुलाकात में डॉक्टर को दिखाएँ।
```

### Red

English:

```text
Significant change detected since yesterday. Please show this to your doctor today.
```

Hindi:

```text
कल से महत्वपूर्ण बदलाव दिखा है। कृपया आज ही डॉक्टर को दिखाएँ।
```

### Severe red

English:

```text
Significant change detected with concerning symptoms. Call 108 immediately and take the patient to the nearest hospital.
```

Hindi:

```text
चिंताजनक लक्षणों के साथ महत्वपूर्ण बदलाव दिखा है। तुरंत 108 पर कॉल करें और मरीज को नज़दीकी अस्पताल ले जाएँ।
```

### Disclaimers

English:

```text
Not a medical diagnosis. Always consult your doctor.
```

Hindi:

```text
यह चिकित्सा निदान नहीं है। हमेशा अपने डॉक्टर से सलाह लें।
```

If uncertain about Hindi medical terminology or phrasing, flag it clearly in the final summary so it can be reviewed.

## Later API contracts

These are not part of Step 1. Implement later only when explicitly asked.

### POST `/analyze`

Input: multipart form with two image files: `yesterday` and `today`, each showing the wound plus a printed reference card.

Pipeline:

```text
detect reference card
normalize colour using reference card
normalize scale using reference card
HSV mask for redness
compute redness area delta
compute bounding-box/border delta
return change score
```

Returns:

```json
{
  "change_score": 0,
  "redness_delta": 0,
  "border_change": 0
}
```

Important: `/analyze` detects visual change only. It must never claim infection.

### POST `/capture-check`

Input: one image, a single live preview frame.

Returns:

```json
{
  "status": "good | card_not_found | too_far | too_close | bad_lighting"
}
```

Called 2–3 times per second from the camera screen.

### GET `/patients`

Returns list of patients sorted by risk, red first.

Each patient:

```json
{
  "id": "1",
  "name": "Ravi",
  "age": 34,
  "day_of_recovery": 5,
  "last_status": "red",
  "last_check_in": "2026-05-31T09:00:00"
}
```

### GET `/patient/<id>/history`

Returns full timeline for one patient.

```json
{
  "id": "1",
  "name": "Ravi",
  "history": [
    {
      "date": "2026-05-31",
      "photo_url": "/static/ravi_day5.jpg",
      "change_score": 68,
      "symptoms": {
        "fever": true,
        "smell": false,
        "spreading_redness": true,
        "discharge": false,
        "increasing_pain": false
      },
      "status": "red"
    }
  ]
}
```

## Demo data

When `data.py` is added later, hardcode 5 patients:

* Ravi — id `1`, age 34, left forearm 2nd-degree burn, day 5, currently red, live demo patient
* 2 amber patients with varied names, ages, and burn locations
* 2 green patients with varied names, ages, and burn locations

Each patient should have 5 days of fake check-in history.

## What not to do

* Do not create frontend files: no `.jsx`, `.tsx`, `.html`, or `.css`.
* Do not add authentication.
* Do not add a database.
* Do not train or load any ML model.
* Do not use an LLM API.
* Do not implement WhatsApp sending.
* Do not add doctor push notifications.
* Do not add logging frameworks.
* Do not build all endpoints at once unless explicitly asked.
* Do not generate free-text medical advice dynamically.

## Step 1 implementation target

Implement only:

* `app.py`
* `assess.py`
* `messages.py`
* `/assess` route
* `/` health route

Do not implement `/analyze`, `/capture-check`, `/patients`, or `/patient/<id>/history` in Step 1.

## Running the app

```bash
source venv/bin/activate
pip install -r requirements.txt
python app.py
```

App runs on:

```text
http://localhost:5000
```

Test endpoints with `curl` from a second terminal.
