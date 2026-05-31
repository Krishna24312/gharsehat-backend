"""Experimental real OpenCV wound-photo comparison for /analyze-real.

This compares yesterday/today photos and reports a measurable VISUAL CHANGE
score (redness area + bounding-box growth). It reports change only — never a
diagnosis, and never the word "infection".

Demo limitations (read before trusting the numbers):
  * This is a controlled-demo CV pipeline, not a clinical tool.
  * It does NOT do wound segmentation — it masks red-ish pixels anywhere.
  * It does NOT normalize lighting, scale, or angle.
  * It assumes both photos use similar distance, lighting, and framing.
  * The /capture-check endpoint improves capture quality but does not
    guarantee clinical comparability.
  * Because v1 has no scale correction, DISTANCE IS CRITICAL: the same phone
    distance, angle, lighting, and framing must be used. Distance variation
    can dominate pixel-area changes and swamp any real wound change.

The /analyze mock endpoint stays the demo safety net; this is separate.
"""

import cv2
import numpy as np

# Pipeline constants.
TARGET_WIDTH = 800
SATURATION_MIN = 80  # S > 80 (not 60) keeps normal skin, incl. Indian skin
VALUE_MIN = 50       # tones, from being counted as red.
KERNEL = np.ones((5, 5), np.uint8)  # small kernel for noise cleanup
MIN_DENOMINATOR = 50  # floor on yesterday areas so deltas don't explode
DISCLAIMER = "This checks visual change between photos only. It is not a medical diagnosis."


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


def redness_mask(image_bgr: np.ndarray, saturation_min: int = SATURATION_MIN) -> np.ndarray:
    """Binary mask of red-ish pixels using two HSV hue bands around red.

    `saturation_min` is exposed so tune_mask.py can sweep it. Higher values
    exclude more normal skin.
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


def analyze_pair(yesterday_bytes: bytes, today_bytes: bytes) -> dict[str, object]:
    """Compare two wound photos and return a visual-change result dict.

    Raises AnalyzeError if either image fails to decode.
    """
    yesterday = resize_to_width(decode_image(yesterday_bytes))
    today = resize_to_width(decode_image(today_bytes))

    yesterday_mask = redness_mask(yesterday)
    today_mask = redness_mask(today)

    yesterday_red = red_area(yesterday_mask)
    today_red = red_area(today_mask)
    raw_redness_delta = ((today_red - yesterday_red) / max(yesterday_red, MIN_DENOMINATOR)) * 100

    yesterday_bbox = bounding_box_area(yesterday_mask)
    today_bbox = bounding_box_area(today_mask)
    raw_border_change = ((today_bbox - yesterday_bbox) / max(yesterday_bbox, MIN_DENOMINATOR)) * 100

    # Negative values mean the area shrank (improvement) and clamp to 0.
    raw_change_score = max(raw_redness_delta, raw_border_change)

    return {
        "change_score": round(clamp(raw_change_score), 1),
        "redness_delta": round(clamp(raw_redness_delta), 1),
        "border_change": round(clamp(raw_border_change), 1),
        "mock": False,
        "disclaimer": DISCLAIMER,
    }
