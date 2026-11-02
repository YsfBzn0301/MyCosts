"""Erzeugt die PNG-Icons aus dem Design von public/icon.svg (Pillow, keine Schriftarten nötig).

Ausführen:  python3 scripts/make-icons.py
"""
from PIL import Image, ImageDraw

INDIGO = (79, 70, 229)
WHITE = (255, 255, 255)
LIGHT = (199, 210, 254)


def draw(size: int, padding: float, radius_ratio: float, path: str) -> None:
    """padding: Anteil des Rands (0.0 = Vollbild, Maskable-Icons brauchen ~0.1)."""
    scale = size / 512
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(canvas)
    d.rounded_rectangle([0, 0, size - 1, size - 1], radius=int(112 * scale * radius_ratio), fill=INDIGO)

    inset = padding * size
    inner = size - 2 * inset
    k = inner / 512  # Designkoordinaten (0..512) auf den inneren Bereich abbilden

    def bar(x: float, y: float, w: float, h: float, color) -> None:
        r = h / 2
        d.rounded_rectangle(
            [inset + x * k, inset + y * k, inset + (x + w) * k, inset + (y + h) * k],
            radius=r * k,
            fill=color,
        )

    bar(128, 150, 256, 60, WHITE)
    bar(128, 236, 200, 60, LIGHT)
    bar(128, 322, 150, 60, WHITE)
    canvas.save(path, optimize=True)


if __name__ == "__main__":
    draw(192, 0.0, 1.0, "public/icon-192.png")
    draw(512, 0.0, 1.0, "public/icon-512.png")
    draw(512, 0.12, 0.0, "public/icon-maskable-512.png")
    print("Icons erzeugt.")
