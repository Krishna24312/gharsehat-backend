"""Generate realistic-looking synthetic demo wound photos for the patient/doctor
portals.

These are NOT real patient photos — they are procedurally rendered (skin-tone
texture + a soft, feathered red inflamed patch) so the demo has believable
imagery with zero copyright, licensing, or privacy concerns and nothing gory.
Each patient's wound stays in the same spot across Day 1-5; only its size and
redness change to match that patient's status story:

  ravi   (red, worsening)   -> patch grows + reddens day 1 -> day 5
  sunita (amber, moderate)  -> steady moderate patch
  imran  (amber, slow)      -> steady moderate patch
  anjali (green, improving) -> patch shrinks + fades
  vikram (green, improving) -> small patch, fades

Output: static/demo/<name>_day<1..5>.jpg  (matches data.py photo_url paths)

Re-run any time: `venv/bin/python scripts/gen_demo_photos.py`
"""

import os

import cv2
import numpy as np

H = W = 420
OUT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "static", "demo")

# Per-patient skin tone (BGR) + status story. Distinct tones so each patient
# reads as a different person in the doctor portal.
PATIENTS: dict[str, dict] = {
    "ravi": {"skin": (118, 150, 198), "story": "worsening", "seed": 11},
    "sunita": {"skin": (142, 178, 216), "story": "amber", "seed": 22},
    "imran": {"skin": (92, 120, 165), "story": "amber", "seed": 33},
    "anjali": {"skin": (132, 166, 210), "story": "improving", "seed": 44},
    "vikram": {"skin": (108, 138, 184), "story": "improving", "seed": 55},
}


def severity(story: str, day: int) -> float:
    """Map a status story + day (1-5) to a 0..1 wound severity."""
    t = (day - 1) / 4.0
    if story == "worsening":
        return 0.22 + 0.63 * t          # 0.22 -> 0.85
    if story == "improving":
        return 0.58 - 0.46 * t          # 0.58 -> 0.12
    # amber: steady moderate, gentle dip in the middle
    return 0.50 - 0.06 * (0.5 - abs(t - 0.5))


def render(skin_bgr, sev: float, seed: int) -> np.ndarray:
    """Render one skin photo with a feathered red patch of the given severity."""
    rng = np.random.default_rng(seed)
    img = np.full((H, W, 3), skin_bgr, np.float32)

    # Skin texture: vary LUMINANCE only (same delta on B,G,R) so the hue stays
    # skin-coloured — independent per-channel noise would look like rainbow static.
    low = rng.normal(0, 1, (H // 16, W // 16)).astype(np.float32)
    low = cv2.GaussianBlur(cv2.resize(low, (W, H), interpolation=cv2.INTER_CUBIC), (0, 0), 8.0)
    low = low / (np.abs(low).max() + 1e-6) * 15.0          # ±15 soft blotches
    grad = np.linspace(11.0, -13.0, H, dtype=np.float32).reshape(H, 1)  # top lit
    grain = rng.normal(0, 3.0, (H, W)).astype(np.float32)  # fine film grain
    img += (low + grad + grain)[..., None]
    img += rng.normal(0, 1.2, (H, W, 3)).astype(np.float32)  # tiny chroma speckle

    # Irregular wound mask: a few overlapping ellipses, then feathered.
    cx = W // 2 + int(rng.integers(-28, 28))
    cy = H // 2 + int(rng.integers(-28, 28))
    radius = int((0.075 + 0.16 * sev) * min(H, W))
    mask = np.zeros((H, W), np.uint8)
    for _ in range(5):
        ex = cx + int(rng.integers(-radius // 2, radius // 2 + 1))
        ey = cy + int(rng.integers(-radius // 2, radius // 2 + 1))
        ax = max(4, int(radius * rng.uniform(0.6, 1.1)))
        ay = max(4, int(radius * rng.uniform(0.6, 1.1)))
        cv2.ellipse(mask, (ex, ey), (ax, ay), float(rng.integers(0, 180)), 0, 360, 255, -1)
    soft = cv2.GaussianBlur(mask.astype(np.float32), (0, 0), max(1.0, radius * 0.35)) / 255.0
    soft = np.clip(soft, 0.0, 1.0)
    core = soft ** 2  # redder, more saturated in the centre

    # Redder core, pinker halo; overall intensity grows with severity.
    red = np.array([58, 52, 205], np.float32)   # BGR deep red
    pink = np.array([122, 120, 224], np.float32)  # BGR pink
    color = pink * (1 - core[..., None]) + red * core[..., None]
    alpha = (soft * (0.34 + 0.5 * sev))[..., None]
    img = img * (1 - alpha) + color * alpha

    img = cv2.GaussianBlur(img, (0, 0), 0.7)
    return np.clip(img, 0, 255).astype(np.uint8)


def main() -> None:
    os.makedirs(OUT_DIR, exist_ok=True)
    count = 0
    for name, cfg in PATIENTS.items():
        for day in range(1, 6):
            sev = severity(cfg["story"], day)
            img = render(cfg["skin"], sev, cfg["seed"])
            path = os.path.join(OUT_DIR, f"{name}_day{day}.jpg")
            cv2.imwrite(path, img, [cv2.IMWRITE_JPEG_QUALITY, 82])
            count += 1
    print(f"wrote {count} images to {OUT_DIR}")


if __name__ == "__main__":
    main()
