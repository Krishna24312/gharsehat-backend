"""Local helper to inspect the redness-mask thresholds used by /analyze-real.

Sweeps S = 60, 80, 100, 120 over a baseline/today pair on the SAME central ROI
that /analyze-real uses, showing the raw (unclamped) growth direction, the
clamped deltas, and which thresholds /analyze-real would actually keep. It then
prints the final growth-direction-filtered median score by calling the real
analyze_pair, so what you see here matches the endpoint.

This script is standalone: it does not affect app runtime, save images, or
touch the frontend.

Usage:
    python tune_mask.py test_images/baseline.jpg test_images/today.jpg
"""

import sys

from analyze import (
    AnalyzeError,
    SATURATION_THRESHOLDS,
    analyze_pair,
    central_roi,
    decode_image,
    resize_to_width,
    score_at_threshold,
)

# 60 is included (below /analyze-real's set) to show the low-saturation noise
# that the growth-direction filter is designed to reject.
SWEEP_THRESHOLDS = [60, 80, 100, 120]


def _load_bytes(path: str) -> bytes:
    try:
        with open(path, "rb") as handle:
            return handle.read()
    except OSError as error:
        print(f"Error: could not read '{path}': {error}")
        sys.exit(1)


def main() -> None:
    if len(sys.argv) != 3:
        print("Usage: python tune_mask.py <baseline_image> <today_image>")
        sys.exit(1)

    yesterday_bytes = _load_bytes(sys.argv[1])
    today_bytes = _load_bytes(sys.argv[2])

    try:
        yesterday = central_roi(resize_to_width(decode_image(yesterday_bytes)))
        today = central_roi(resize_to_width(decode_image(today_bytes)))
    except AnalyzeError as error:
        print(f"Error: {error.message}")
        sys.exit(1)

    print("ROI: central 85% | /analyze-real thresholds:", SATURATION_THRESHOLDS)
    header = (
        f"{'S':>4} | {'yest_red':>9} | {'today_red':>9} | {'raw_delta':>10} | "
        f"{'redness':>8} | {'border':>8} | {'change':>8} | {'used_by_/analyze-real':>22}"
    )
    print(header)
    print("-" * len(header))

    for saturation in SWEEP_THRESHOLDS:
        row = score_at_threshold(yesterday, today, saturation)
        # /analyze-real only runs its own thresholds AND only keeps growth-positive ones.
        used = saturation in SATURATION_THRESHOLDS and row["used_for_score"]
        if used:
            used_label = "yes"
        elif saturation not in SATURATION_THRESHOLDS:
            used_label = "no (not in S set)"
        else:
            used_label = f"no ({row['excluded_reason']})"
        print(
            f"{saturation:>4} | {row['yesterday_red_area']:>9} | {row['today_red_area']:>9} | "
            f"{row['raw_redness_delta']:>10.2f} | {row['redness_delta']:>8.2f} | "
            f"{row['border_change']:>8.2f} | {row['change_score']:>8.2f} | {used_label:>22}"
        )

    # Authoritative final score — exactly what /analyze-real returns.
    result = analyze_pair(yesterday_bytes, today_bytes)
    debug = result["debug"]
    print()
    print(f"valid (growth-positive) thresholds: {debug['valid_thresholds']}")
    print(f"selected threshold (for shown deltas): {debug['selected_threshold']}")
    print(f"FINAL growth-filtered median change_score: {result['change_score']}")
    print(f"note: {debug['note']}")


if __name__ == "__main__":
    main()
