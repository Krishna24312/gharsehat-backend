# Demo wound photos — source & license note

These 25 images (`<name>_day1.jpg` … `<name>_day5.jpg` for ravi, sunita, imran,
anjali, vikram) are **procedurally generated synthetic images**, not real
patient photos.

- **Source:** generated locally by `scripts/gen_demo_photos.py` (skin-tone
  texture + a soft, feathered red inflamed patch).
- **License / rights:** none required. No external images were downloaded; there
  is **no copyright, no Creative Commons attribution, and no patient PII** — no
  real faces, names, tattoos, or identifiable information.
- **Why synthetic:** real burn/wound photos on the open web are often graphic and
  carry copyright/licensing and privacy concerns. Synthetic images keep the demo
  non-gory, "medically serious, not shocking," fully license-clean, and let the
  imagery match each patient's status story exactly.
- **Regenerate:** `venv/bin/python scripts/gen_demo_photos.py`
- **Replace with real photos:** drop real JPGs at the same paths
  (`static/demo/<name>_day<N>.jpg`) — no code change needed; the backend already
  serves `/static/demo/...` and `data.py` points here.

## Status story → imagery mapping

| Patient | Status story            | Imagery (Day 1 → Day 5)              |
|---------|-------------------------|-------------------------------------|
| Ravi    | red / worsening         | small light patch → large deep-red  |
| Sunita  | amber / moderate        | steady moderate patch               |
| Imran   | amber / slow recovery   | steady moderate patch               |
| Anjali  | green / improving       | patch shrinks & fades               |
| Vikram  | green / improving       | small patch, fades                  |

Each patient uses a distinct skin tone so they read as different people in the
doctor portal. `/analyze-real` on Ravi day1→day5 yields a moderate-high
visual-change score; improving pairs (e.g. Vikram) yield ~0 (no false high).
