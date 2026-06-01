"""Photo-quality checks for the in-app camera screen.

The frontend camera screen sends a single live preview frame to
/capture-check; this module decides whether lighting and focus are good
enough to capture. It only checks photo quality — it never diagnoses, never
inspects the wound itself (the frontend overlay guides placement visually),
and never saves the frame.
"""

import cv2
import numpy as np

# Lighting thresholds on mean grayscale brightness (0-255).
DARK_THRESHOLD = 60
BRIGHT_THRESHOLD = 220
# Focus threshold on the variance of the Laplacian (higher = sharper).
BLUR_THRESHOLD = 80
# Frames are scaled to this width before analysis for speed and consistency.
TARGET_WIDTH = 640

# Central guide region, matching the frontend overlay (~78% wide, ~58% tall,
# centred). Both framing and distance are judged inside this box.
GUIDE_X = (0.11, 0.89)
GUIDE_Y = (0.21, 0.79)
# Framing thresholds (skin-based, same limb blob as the distance proxy below).
# Need at least this much of the guide filled by the limb to judge framing at
# all; otherwise we just show the guide.
FRAMING_MIN_FILL = 0.08
# Max distance of the limb's centroid from the guide centre (fraction of the
# guide, per axis) before we call it off-centre.
FRAMING_OFF_CENTER = 0.22

# Distance proxy thresholds (strict fill heuristic). True distance needs a scale
# reference we don't have, so this is NOT exact — it only asks "does the limb
# dominate the centre of the guide?". We require the largest skin blob to cover
# most of the guide's CENTRE core, so a small/distant subject reads as too_far
# even when stray skin-tone is present elsewhere. Known limits: warm-toned rooms
# can still read as skin, and a close face passes — accepted on purpose. Only
# ever warns "too_far"; a frame-filling close-up can't be told from "too close"
# without a scale reference, so we never say "move back". Not ML, not diagnosis.
SKIN_CENTER_FRAC = 0.5   # centre core = central 50% of the guide box
SKIN_CENTER_MIN = 0.10   # core barely covered -> nothing centred -> "unknown"
SKIN_CENTER_GOOD = 0.55  # core mostly covered (with enough overall fill) -> "good"
SKIN_MIN_FILL = 0.25     # largest blob must also fill this much of the whole guide
# Broad skin-colour ranges. We require BOTH a YCrCb and an HSV match to cut down
# on skin-toned decor (wood, beige fabric). Crude on purpose, not ML.
SKIN_YCRCB_LOW = (0, 133, 77)
SKIN_YCRCB_HIGH = (255, 180, 135)
SKIN_HSV_LOW = (0, 30, 60)
SKIN_HSV_HIGH = (25, 180, 255)
SKIN_HSV_WRAP_LOW = (160, 30, 60)
SKIN_HSV_WRAP_HIGH = (180, 180, 255)


class CaptureCheckError(Exception):
    """Raised when a preview frame cannot be decoded or processed.

    The HTTP layer turns this into a 400 JSON error response.
    """

    def __init__(self, message: str) -> None:
        super().__init__(message)
        self.message = message


def check_capture_frame(image_bytes: bytes) -> dict[str, object]:
    """Assess one preview frame's lighting and blur.

    Returns a dict describing lighting, blur, framing, and an overall status
    of "good", "bad_lighting", or "blurry". Raises CaptureCheckError if the
    bytes cannot be decoded into an image.
    """
    buffer = np.frombuffer(image_bytes, dtype=np.uint8)
    image = cv2.imdecode(buffer, cv2.IMREAD_COLOR)
    if image is None:
        raise CaptureCheckError("Could not decode image frame. Please send a valid image.")

    # Scale to a fixed width so thresholds behave consistently across phones.
    height, width = image.shape[:2]
    scale = TARGET_WIDTH / width
    image = cv2.resize(image, (TARGET_WIDTH, max(1, round(height * scale))), interpolation=cv2.INTER_AREA)
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    brightness = round(float(gray.mean()), 1)
    if brightness < DARK_THRESHOLD:
        lighting = "too_dark"
    elif brightness > BRIGHT_THRESHOLD:
        lighting = "too_bright"
    else:
        lighting = "good"

    blur_score = round(float(cv2.Laplacian(gray, cv2.CV_64F).var()), 1)
    blur = "blurry" if blur_score < BLUR_THRESHOLD else "sharp"

    # Placement check, derived entirely from the limb (skin) — far more reliable
    # in a busy room than raw edges, which a ceiling fan / wardrobe / pictures
    # dilute. We mask skin colour inside the guide, keep only the largest
    # connected blob (the limb), and from it derive BOTH framing (is the limb
    # centred in the guide?) and distance (does it dominate the guide centre?).
    # Crude by design — warm-toned rooms or a close face can pass — and never a
    # diagnosis. `framing` stays "guide_only" for backwards compatibility; the
    # `framing_status` field carries the signal. Distance only ever warns too_far.
    framing = "guide_only"
    frame_height, frame_width = gray.shape
    y0, y1 = int(frame_height * GUIDE_Y[0]), int(frame_height * GUIDE_Y[1])
    x0, x1 = int(frame_width * GUIDE_X[0]), int(frame_width * GUIDE_X[1])

    guide_bgr = image[y0:y1, x0:x1]
    guide_height, guide_width = guide_bgr.shape[:2]
    guide_pixels = guide_height * guide_width
    skin_fill = 0.0
    center_fill = 0.0
    if guide_pixels == 0:
        framing_status = "guide_only"
        framing_message = "Keep the wound inside the on-screen guide."
        distance_status = "unknown"
        distance_message = "Can't read the guide region yet."
    else:
        ycrcb = cv2.cvtColor(guide_bgr, cv2.COLOR_BGR2YCrCb)
        hsv = cv2.cvtColor(guide_bgr, cv2.COLOR_BGR2HSV)
        skin = cv2.bitwise_and(
            cv2.inRange(ycrcb, SKIN_YCRCB_LOW, SKIN_YCRCB_HIGH),
            cv2.bitwise_or(
                cv2.inRange(hsv, SKIN_HSV_LOW, SKIN_HSV_HIGH),
                cv2.inRange(hsv, SKIN_HSV_WRAP_LOW, SKIN_HSV_WRAP_HIGH),
            ),
        )
        # Open to drop speckle, then keep only the largest blob (the limb) so
        # scattered skin-ish background pixels don't inflate the measurement.
        skin = cv2.morphologyEx(skin, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))
        count, labels, stats, centroids = cv2.connectedComponentsWithStats((skin > 0).astype(np.uint8), connectivity=8)
        if count > 1:
            largest_blob, largest_label = max((int(stats[i, cv2.CC_STAT_AREA]), i) for i in range(1, count))
        else:
            largest_blob, largest_label = 0, 0
        skin_fill = round(largest_blob / guide_pixels, 3)

        # Framing: is the limb roughly centred in the guide? Judge by centroid.
        if skin_fill < FRAMING_MIN_FILL:
            framing_status = "guide_only"
            framing_message = "Keep the wound inside the on-screen guide."
        else:
            blob_cx, blob_cy = centroids[largest_label]
            offset = max(abs(blob_cx / guide_width - 0.5), abs(blob_cy / guide_height - 0.5))
            if offset <= FRAMING_OFF_CENTER:
                framing_status = "good"
                framing_message = "Wound is inside the guide."
            else:
                framing_status = "off_center"
                framing_message = "Move the wound toward the centre of the guide."

        # Distance (strict fill): does the limb dominate the guide's CENTRE core?
        # A small/distant subject leaves the centre mostly empty -> too_far.
        blob_mask = labels == largest_label if largest_blob else np.zeros_like(labels, dtype=bool)
        margin = (1.0 - SKIN_CENTER_FRAC) / 2.0
        cy0, cy1 = int(guide_height * margin), int(guide_height * (1.0 - margin))
        cx0, cx1 = int(guide_width * margin), int(guide_width * (1.0 - margin))
        core = blob_mask[cy0:cy1, cx0:cx1]
        center_fill = round(float(core.mean()), 3) if core.size else 0.0

        if center_fill < SKIN_CENTER_MIN:
            distance_status = "unknown"
            distance_message = "Place the limb in the centre of the guide."
        elif center_fill >= SKIN_CENTER_GOOD and skin_fill >= SKIN_MIN_FILL:
            distance_status = "good"
            distance_message = "Distance looks good."
        else:
            distance_status = "too_far"
            distance_message = "Move closer so the wound fills the guide."

    if lighting == "too_dark":
        status = "bad_lighting"
        message = "Too dark. Move to brighter, even light before capturing."
    elif lighting == "too_bright":
        status = "bad_lighting"
        message = "Too bright. Reduce glare or harsh light before capturing."
    elif blur == "blurry":
        status = "blurry"
        message = "Image is blurry. Hold the phone steady and let it focus."
    else:
        status = "good"
        message = "Ready to capture. Keep the wound inside the frame."

    return {
        "status": status,
        "lighting": lighting,
        "brightness": brightness,
        "blur": blur,
        "blur_score": blur_score,
        "framing": framing,
        "framing_status": framing_status,
        "framing_message": framing_message,
        "distance_status": distance_status,
        "distance_message": distance_message,
        "skin_fill": skin_fill,
        "center_fill": center_fill,
        "message": message,
    }
