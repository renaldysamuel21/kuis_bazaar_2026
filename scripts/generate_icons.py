from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"


def rounded(draw, box, radius, fill, outline=None, width=1):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def make_icon(size: int, filename: str) -> None:
    scale = size / 512
    image = Image.new("RGB", (size, size), "#f4c99f")
    draw = ImageDraw.Draw(image)

    def s(value):
        return int(round(value * scale))

    rounded(draw, (s(30), s(30), s(482), s(482)), s(112), "#fff8ef", "#ffffff", s(10))
    draw.ellipse((s(92), s(350), s(420), s(430)), fill="#d8aa82")
    draw.ellipse((s(126), s(104), s(386), s(386)), fill="#e98947", outline="#fff4e9", width=s(14))
    draw.polygon([(s(151), s(144)), (s(172), s(70)), (s(228), s(134))], fill="#e98947")
    draw.polygon([(s(361), s(144)), (s(340), s(70)), (s(284), s(134))], fill="#e98947")
    draw.ellipse((s(179), s(202), s(239), s(280)), fill="#fffdfb", outline="#583e49", width=s(7))
    draw.ellipse((s(273), s(202), s(333), s(280)), fill="#fffdfb", outline="#583e49", width=s(7))
    draw.ellipse((s(207), s(231), s(231), s(269)), fill="#583e49")
    draw.ellipse((s(301), s(231), s(325), s(269)), fill="#583e49")
    draw.ellipse((s(211), s(236), s(219), s(248)), fill="#ffffff")
    draw.ellipse((s(305), s(236), s(313), s(248)), fill="#ffffff")
    draw.arc((s(218), s(263), s(294), s(333)), start=18, end=162, fill="#583e49", width=s(10))
    draw.ellipse((s(153), s(286), s(198), s(306)), fill="#d36d35")
    draw.ellipse((s(314), s(286), s(359), s(306)), fill="#d36d35")

    image.save(PUBLIC / filename, optimize=True)


PUBLIC.mkdir(exist_ok=True)
make_icon(192, "icon-192.png")
make_icon(512, "icon-512.png")
make_icon(180, "apple-touch-icon.png")
print("Generated PWA icons")
