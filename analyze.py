"""Experimental real OpenCV wound-photo comparison for /analyze-real.

This compares yesterday/today photos and reports a measurable VISUAL CHANGE
score (redness area + bounding-box growth). It reports change only — never a
diagnosis, and never the word "infection".

Scoring approach: growth-direction-filtered multi-threshold on a central ROI.
Low saturation thresholds tend to capture skin/lighting/background warmth
rather than a true red mark, and that noise can point the "wrong way"
(yesterday redder than today). So we run several saturation thresholds, keep
only those that show genuine positive red growth on a centred crop, and take
the median of their scores. See analyze_pair for the exact steps.

Demo limitations (read before trusting the numbers):
  * This is a controlled-demo CV pipeline, not a clinical tool.
  * It does NOT do wound segmentation — it masks red-ish pixels in a crop.
  * It does NOT normalize lighting, scale, or angle.
  * It assumes both photos use similar distance, lighting, and framing.
  * The /capture-check endpoint and the frontend wound-guide frame improve
    capture quality but do not guarantee clinical comparability or true scale
    normalization.
  * Because v1 has no scale correction, DISTANCE IS CRITICAL: the same phone
    distance, angle, lighting, and framing must be used. Distance variation
    can dominate pixel-area changes and swamp any real wound change.

The /analyze mock endpoint stays the demo safety net; this is separate.
"""

import statistics

import cv2
import numpy as np

# Pipeline constants.
TARGET_WIDTH = 800
SATURATION_MIN = 80  # default S floor for redness_mask (S>80, not 60, keeps
VALUE_MIN = 50       # normal skin incl. Indian skin tones from counting as red)
KERNEL = np.ones((5, 5), np.uint8)  # small kernel for noise cleanup
MIN_DENOMINATOR = 50  # floor on yesterday areas so deltas don't explode
DISCLAIMER = "This checks visual change between photos only. It is not a medical diagnosis."

# Growth-direction-filtered multi-threshold scoring.
SATURATION_THRESHOLDS = [80, 100, 120]
MIN_RED_AREA_PIXELS = 100  # ignore thresholds with too little yesterday red
ROI_FRACTION = 0.85  # central 85% width and height


class AnalyzeError(Exception):
    """Raised when an image can't be decoded or the pair can't be analysed.

    The HTTP layer turns this into a 400 JSON error response.
    """

    def __init__(self, message: str) -> None:
        super().__init__(message)
        self.message = message


def decode_image(image_bytes: bytes) -> np.ndarray:
    """Decode raw bytes into a BGR image, or raise AnalyzeError.

    cv2.imdecode does not handle HEIC; callers should use JPG or PNG.
    """
    buffer = np.frombuffer(image_bytes, dtype=np.uint8)
    image = cv2.imdecode(buffer, cv2.IMREAD_COLOR)
    if image is None:
        raise AnalyzeError("Could not decode one or both images. Please use JPG or PNG images.")
    return image


def resize_to_width(image: np.ndarray, width: int = TARGET_WIDTH) -> np.ndarray:
    """Resize to `width` px, preserving aspect ratio."""
    height, original_width = image.shape[:2]
    scale = width / original_width
    return cv2.resize(image, (width, max(1, round(height * scale))), interpolation=cv2.INTER_AREA)


def central_roi(image: np.ndarray, fraction: float = ROI_FRACTION) -> np.ndarray:
    """Crop the central `fraction` of width and height.

    The frontend wound-guide frame asks the caregiver to centre the wound, so
    a central crop focuses on the wound and ignores background/edge warmth.
    """
    height, width = image.shape[:2]
    crop_w = int(width * fraction)
    crop_h = int(height * fraction)
    x0 = (width - crop_w) // 2
    y0 = (height - crop_h) // 2
    return image[y0:y0 + crop_h, x0:x0 + crop_w]


def redness_mask(image_bgr: np.ndarray, saturation_min: int = SATURATION_MIN) -> np.ndarray:
    """Binary mask of red-ish pixels using two HSV hue bands around red.

    `saturation_min` is exposed so callers can sweep it. Higher values exclude
    more normal skin.
    """
    hsv = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2HSV)
    lower_red = cv2.inRange(hsv, np.array([0, saturation_min, VALUE_MIN]), np.array([15, 255, 255]))
    upper_red = cv2.inRange(hsv, np.array([160, saturation_min, VALUE_MIN]), np.array([180, 255, 255]))
    mask = cv2.bitwise_or(lower_red, upper_red)
    # Opening removes specks; closing fills small holes.
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, KERNEL)
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, KERNEL)
    return mask


def red_area(mask: np.ndarray) -> int:
    """Number of red pixels in the mask."""
    return int(cv2.countNonZero(mask))


def bounding_box_area(mask: np.ndarray) -> int:
    """Area of a single bounding box around ALL red pixels combined.

    Not per-component — one box over every red pixel. 0 if there are none.
    """
    points = cv2.findNonZero(mask)
    if points is None:
        return 0
    _x, _y, width, height = cv2.boundingRect(points)
    return int(width * height)


def clamp(value: float, low: float = 0.0, high: float = 100.0) -> float:
    """Clamp `value` into [low, high]."""
    return max(low, min(high, value))


def score_at_threshold(
    yesterday_roi: np.ndarray, today_roi: np.ndarray, saturation: int
) -> dict[str, object]:
    """Run the redness comparison at one saturation threshold.

    Returns a per-threshold result dict including the unclamped
    raw_redness_delta (used for the growth-direction filter), the clamped
    redness_delta/border_change, the change_score, and why it was kept or
    excluded.
    """
    yesterday_mask = redness_mask(yesterday_roi, saturation_min=saturation)
    today_mask = redness_mask(today_roi, saturation_min=saturation)

    yesterday_red = red_area(yesterday_mask)
    today_red = red_area(today_mask)
    raw_redness_delta = ((today_red - yesterday_red) / max(yesterday_red, MIN_DENOMINATOR)) * 100
    redness_delta = clamp(raw_redness_delta)

    yesterday_bbox = bounding_box_area(yesterday_mask)
    today_bbox = bounding_box_area(today_mask)
    border_change = clamp(((today_bbox - yesterday_bbox) / max(yesterday_bbox, MIN_DENOMINATOR)) * 100)

    change_score = max(redness_delta, border_change)

    # Keep only thresholds that show genuine positive red growth with enough
    # yesterday red to be a real mark (not lighting/white-balance drift).
    if raw_redness_delta <= 0:
        excluded_reason: str | None = "negative_or_zero_growth"
    elif yesterday_red < MIN_RED_AREA_PIXELS:
        excluded_reason = "red_area_too_small"
    else:
        excluded_reason = None

    return {
        "s_threshold": saturation,
        "yesterday_red_area": yesterday_red,
        "today_red_area": today_red,
        "raw_redness_delta": round(raw_redness_delta, 2),
        "redness_delta": round(redness_delta, 2),
        "border_change": round(border_change, 2),
        "change_score": round(change_score, 2),
        "used_for_score": excluded_reason is None,
        "excluded_reason": excluded_reason,
    }


def analyze_pair(yesterday_bytes: bytes, today_bytes: bytes) -> dict[str, object]:
    """Compare two wound photos and return a visual-change result dict.

    Steps:
      1. Decode + resize to width 800, then crop the central 85% ROI.
      2. Score at saturation thresholds 80, 100, 120.
      3. Keep thresholds with positive red growth and enough yesterday red.
      4. If none pass, return zeros with a debug note.
      5. Otherwise the change_score is the MEDIAN of valid scores; the shown
         redness_delta/border_change come from the valid threshold whose score
         is closest to that median.

    Raises AnalyzeError if either image fails to decode.
    """
    yesterday = central_roi(resize_to_width(decode_image(yesterday_bytes)))
    today = central_roi(resize_to_width(decode_image(today_bytes)))

    threshold_results = [score_at_threshold(yesterday, today, s) for s in SATURATION_THRESHOLDS]
    valid_results = [result for result in threshold_results if result["used_for_score"]]

    debug: dict[str, object] = {
        "method": "growth_direction_filtered_multi_threshold_roi",
        "thresholds": list(SATURATION_THRESHOLDS),
        "selected_threshold": None,
        "roi": "central_85_percent",
        "valid_thresholds": [result["s_threshold"] for result in valid_results],
        "threshold_results": threshold_results,
        "note": "",
    }

    if not valid_results:
        debug["note"] = "No positive red-growth direction detected."
        return {
            "change_score": 0.0,
            "redness_delta": 0.0,
            "border_change": 0.0,
            "mock": False,
            "disclaimer": DISCLAIMER,
            "debug": debug,
        }

    valid_scores = [result["change_score"] for result in valid_results]
    median_score = statistics.median(valid_scores)
    # Pick the valid result closest to the median; on a tie prefer the higher
    # score (high sensitivity — better to over-flag than miss change).
    selected = min(
        valid_results,
        key=lambda result: (abs(result["change_score"] - median_score), -result["change_score"]),
    )

    debug["selected_threshold"] = selected["s_threshold"]
    debug["note"] = (
        "change_score is the median over growth-positive thresholds; "
        "redness_delta and border_change are from the threshold closest to that median."
    )

    return {
        "change_score": round(median_score, 2),
        "redness_delta": selected["redness_delta"],
        "border_change": selected["border_change"],
        "mock": False,
        "disclaimer": DISCLAIMER,
        "debug": debug,
    }
