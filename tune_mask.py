"""Local helper to tune the redness-mask saturation threshold.

Sweeps S = 60, 80, 100, 120 over a baseline/today image pair and prints the
resulting areas and change scores, so you can pick a threshold that separates
the red marker from normal skin. This script is standalone: it does not affect
app runtime, save images, or touch the frontend.

Usage:
    python tune_mask.py test_images/baseline.jpg test_images/today.jpg
"""

import sys

from analyze import (
    MIN_DENOMINATOR,
    bounding_box_area,
    clamp,
    red_area,
    redness_mask,
    resize_to_width,
)

import cv2

SATURATION_THRESHOLDS = [60, 80, 100, 120]


def _load(path: str) -> "cv2.Mat":
    image = cv2.imread(path, cv2.IMREAD_COLOR)
    if image is None:
        print(f"Error: could not read '{path}'. Use a JPG or PNG path that exists.")
        sys.exit(1)
    return resize_to_width(image)


def main() -> None:
    if len(sys.argv) != 3:
        print("Usage: python tune_mask.py <baseline_image> <today_image>")
        sys.exit(1)

    yesterday = _load(sys.argv[1])
    today = _load(sys.argv[2])

    header = f"{'S':>4} | {'yest_red':>9} | {'today_red':>9} | {'redness_delta':>13} | {'border_change':>13} | {'change_score':>12}"
    print(header)
    print("-" * len(header))

    for saturation in SATURATION_THRESHOLDS:
        y_mask = redness_mask(yesterday, saturation_min=saturation)
        t_mask = redness_mask(today, saturation_min=saturation)

        y_red = red_area(y_mask)
        t_red = red_area(t_mask)
        redness_delta = ((t_red - y_red) / max(y_red, MIN_DENOMINATOR)) * 100

        y_bbox = bounding_box_area(y_mask)
        t_bbox = bounding_box_area(t_mask)
        border_change = ((t_bbox - y_bbox) / max(y_bbox, MIN_DENOMINATOR)) * 100

        change_score = max(redness_delta, border_change)

        print(
            f"{saturation:>4} | {y_red:>9} | {t_red:>9} | "
            f"{clamp(redness_delta):>13.1f} | {clamp(border_change):>13.1f} | {clamp(change_score):>12.1f}"
        )


if __name__ == "__main__":
    main()
