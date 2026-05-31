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

    # Wound segmentation is not done here; the frontend overlay frame guides
    # placement, so framing is always reported as a guide.
    framing = "guide_only"

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
        "message": message,
    }
