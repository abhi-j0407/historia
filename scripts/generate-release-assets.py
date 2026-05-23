#!/usr/bin/env python3
"""Generate Phase 17 icons and CWS marketing images (warm copper / paper identity)."""

from __future__ import annotations

import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
CWS = ROOT / "assets" / "cws"
SCREENSHOTS = CWS / "screenshots"

BG = (249, 246, 241)
FG = (43, 36, 28)
MUTED = (107, 99, 88)
PRIMARY = (148, 87, 47)
CARD = (253, 252, 250)
BORDER = (224, 218, 210)
RAMP = [
    (245, 240, 232),
    (210, 168, 118),
    (196, 146, 82),
    (184, 137, 90),
    (143, 92, 46),
    (92, 58, 26),
]
WINNERS = [
    (122, 78, 42),
    (160, 98, 52),
    (194, 120, 58),
    (180, 88, 48),
    (150, 72, 40),
    (130, 65, 38),
    (110, 58, 35),
    (95, 52, 32),
    (85, 48, 30),
    (75, 44, 28),
    (138, 132, 120),
]


def _font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = [
        "/System/Library/Fonts/Supplemental/Georgia.ttf",
        "/System/Library/Fonts/Supplemental/Palatino.ttf",
        "/Library/Fonts/Arial.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf",
    ]
    for path in candidates:
        if Path(path).exists():
            try:
                return ImageFont.truetype(path, size)
            except OSError:
                continue
    return ImageFont.load_default()


def draw_icon(size: int) -> Image.Image:
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    pad = max(1, size // 16)
    radius = size // 5
    draw.rounded_rectangle(
        (pad, pad, size - pad - 1, size - pad - 1),
        radius=radius,
        fill=BG + (255,),
        outline=PRIMARY + (255,),
        width=max(1, size // 32),
    )
    grid = 5
    inner = size - 2 * pad - radius
    ox = pad + (size - 2 * pad - inner) // 2
    oy = ox
    cell = inner // grid
    gap = max(1, cell // 8)
    for row in range(grid):
        for col in range(grid):
            level = (row + col) % 6
            x0 = ox + col * cell + gap
            y0 = oy + row * cell + gap
            x1 = ox + (col + 1) * cell - gap
            y1 = oy + (row + 1) * cell - gap
            draw.rounded_rectangle(
                (x0, y0, x1, y1),
                radius=max(1, cell // 6),
                fill=RAMP[level] + (255,),
            )
    return img


def draw_heatmap_block(
    draw: ImageDraw.ImageDraw,
    x: int,
    y: int,
    cols: int,
    rows: int,
    cell: int,
    gap: int,
    seed: int,
) -> None:
    for r in range(rows):
        for c in range(cols):
            level = (seed + r * 3 + c * 2 + (r * c) % 3) % 6
            x0 = x + c * (cell + gap)
            y0 = y + r * (cell + gap)
            draw.rounded_rectangle(
                (x0, y0, x0 + cell, y0 + cell),
                radius=2,
                fill=RAMP[level],
            )


def draw_dashboard(
    width: int,
    height: int,
    *,
    view: str,
    range_label: str,
) -> Image.Image:
    img = Image.new("RGB", (width, height), BG)
    draw = ImageDraw.Draw(img)
    title_font = _font(42, bold=True)
    label_font = _font(14)
    small_font = _font(12)
    tab_font = _font(13)

    margin_x = 80
    y = 56
    draw.text((margin_x, y), "historia", fill=FG, font=title_font)
    y += 58
    draw.text(
        (margin_x, y),
        "Your browsing rhythm — local only.",
        fill=MUTED,
        font=label_font,
    )
    y += 44

    tabs = ["Sites", "Daily", "Winners"]
    tab_x = margin_x
    for tab in tabs:
        active = tab == view
        tw = draw.textlength(tab, font=tab_font) + 28
        if active:
            draw.rounded_rectangle(
                (tab_x, y, tab_x + tw, y + 34),
                radius=17,
                fill=PRIMARY,
            )
            draw.text((tab_x + 14, y + 8), tab, fill=(250, 247, 242), font=tab_font)
        else:
            draw.text((tab_x + 14, y + 8), tab, fill=MUTED, font=tab_font)
        tab_x += int(tw) + 12

    ranges = ["7d", "30d", "All"]
    rx = width - margin_x - 180
    for r in ranges:
        active = r == range_label
        rw = 44
        if active:
            draw.rounded_rectangle((rx, y + 4, rx + rw, y + 30), radius=14, fill=CARD, outline=BORDER)
        draw.text((rx + 12, y + 10), r, fill=FG if active else MUTED, font=small_font)
        rx += rw + 8

    y += 56
    card_w = width - 2 * margin_x
    draw.rounded_rectangle(
        (margin_x, y, margin_x + card_w, y + height - y - 80),
        radius=12,
        fill=CARD,
        outline=BORDER,
        width=1,
    )
    inner_x = margin_x + 32
    inner_y = y + 28

    if view == "Sites":
        draw.text((inner_x, inner_y), "example.com", fill=FG, font=_font(20))
        inner_y += 36
        draw.text((inner_x, inner_y), "142 visits in range", fill=MUTED, font=label_font)
        inner_y += 40
        draw_heatmap_block(draw, inner_x, inner_y, 52, 7, 11, 2, 2)
    elif view == "Daily":
        draw.text((inner_x, inner_y), "All sites combined", fill=FG, font=_font(20))
        inner_y += 36
        draw.text((inner_x, inner_y), "1,204 visits in range", fill=MUTED, font=label_font)
        inner_y += 40
        draw_heatmap_block(draw, inner_x, inner_y, 60, 7, 11, 2, 5)
    else:
        draw.text((inner_x, inner_y), "Top sites by share", fill=FG, font=_font(20))
        inner_y += 44
        bar_h = 22
        gap = 10
        total_w = card_w - 64
        shares = [0.22, 0.18, 0.14, 0.11, 0.09, 0.08, 0.07, 0.05, 0.04, 0.02]
        for i, share in enumerate(shares):
            bw = int(total_w * share)
            color = WINNERS[i] if i < 10 else WINNERS[10]
            draw.rounded_rectangle(
                (inner_x, inner_y, inner_x + bw, inner_y + bar_h),
                radius=6,
                fill=color,
            )
            label = f"site{i + 1}.com" if i < 5 else ("…" if i == 9 else f"site{i + 1}.com")
            draw.text((inner_x + bw + 10, inner_y + 3), label, fill=MUTED, font=small_font)
            inner_y += bar_h + gap

    return img


def draw_promo_tile() -> Image.Image:
    w, h = 440, 280
    img = Image.new("RGB", (w, h), BG)
    draw = ImageDraw.Draw(img)
    draw.rounded_rectangle((0, 0, w - 1, h - 1), radius=0, fill=BG)
    icon = draw_icon(96)
    img.paste(icon, (32, 92), icon)
    draw.text((150, 100), "historia", fill=FG, font=_font(36))
    draw.text(
        (150, 148),
        "Local browsing heatmaps",
        fill=MUTED,
        font=_font(16),
    )
    gx, gy = 150, 188
    for i, level in enumerate([0, 2, 4, 5, 3, 1]):
        draw.rounded_rectangle((gx + i * 22, gy, gx + i * 22 + 16, gy + 16), radius=3, fill=RAMP[level])
    return img


def main() -> None:
    PUBLIC.mkdir(parents=True, exist_ok=True)
    SCREENSHOTS.mkdir(parents=True, exist_ok=True)

    for size in (16, 32, 48, 128):
        path = PUBLIC / f"icon-{size}.png"
        draw_icon(size).save(path, "PNG")
        print(f"wrote {path}")

    views = [
        ("sites-7d.png", "Sites", "7d"),
        ("daily-30d.png", "Daily", "30d"),
        ("winners-all.png", "Winners", "All"),
    ]
    for name, view, rng in views:
        shot = draw_dashboard(1280, 800, view=view, range_label=rng)
        path = SCREENSHOTS / name
        shot.save(path, "PNG")
        print(f"wrote {path}")

    promo = draw_promo_tile()
    promo_path = CWS / "promo-tile-440x280.png"
    promo.save(promo_path, "PNG")
    print(f"wrote {promo_path}")


if __name__ == "__main__":
    main()
