"""Erzeugt die PNG-Icons aus der Geometrie von public/icon.svg (Pillow).

Ausführen:  python3 scripts/make-icons.py
"""
from PIL import Image, ImageDraw

INK = (15, 23, 42)
BAR_A = (110, 231, 183)
BAR_B = (167, 243, 208)
WHITE = (255, 255, 255)
COIN = (251, 191, 36)
COIN_RING = (253, 230, 138)


def draw(size: int, padding: float, radius_ratio: float, path: str) -> None:
    """padding: Rand als Anteil (Maskable-Icons ~0.12); radius_ratio 0 = eckig."""
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(canvas)
    d.rounded_rectangle([0, 0, size - 1, size - 1], radius=int(112 * size / 512 * radius_ratio), fill=INK)

    inset = padding * size
    k = (size - 2 * inset) / 512

    def p(x: float, y: float) -> tuple[float, float]:
        return (inset + x * k, inset + y * k)

    def rr(x: float, y: float, w: float, h: float, color) -> None:
        d.rounded_rectangle([*p(x, y), *p(x + w, y + h)], radius=32 * k, fill=color)

    def circle(cx: float, cy: float, r: float, fill=None, outline=None, width=0) -> None:
        d.ellipse([*p(cx - r, cy - r), *p(cx + r, cy + r)], fill=fill, outline=outline, width=int(width * k))

    rr(120, 310, 64, 90, BAR_A)
    rr(210, 250, 64, 150, BAR_B)
    rr(300, 190, 64, 210, WHITE)
    circle(392, 128, 62, fill=COIN)
    circle(392, 128, 40, outline=COIN_RING, width=12)
    canvas.save(path, optimize=True)


if __name__ == "__main__":
    draw(192, 0.0, 1.0, "public/icon-192.png")
    draw(512, 0.0, 1.0, "public/icon-512.png")
    draw(512, 0.12, 0.0, "public/icon-maskable-512.png")
    print("Icons erzeugt.")
