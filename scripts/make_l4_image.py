from PIL import Image, ImageDraw
import piexif

img = Image.new("RGB", (960, 720), (28, 24, 20))
d = ImageDraw.Draw(img)
d.rectangle([40, 40, 920, 680], outline=(90, 70, 55), width=2)
d.rectangle([80, 100, 420, 620], fill=(45, 38, 32), outline=(110, 90, 70))
d.rectangle([460, 100, 880, 340], fill=(38, 32, 28), outline=(110, 90, 70))
d.rectangle([460, 380, 880, 620], fill=(38, 32, 28), outline=(110, 90, 70))
for y in range(140, 600, 48):
    d.line([(100, y), (400, y)], fill=(70, 55, 45), width=1)
d.text((80, 50), "41/GLD  ·  LACI 08  ·  FOTO PETUGAS", fill=(180, 160, 130))
d.text((480, 160), "LEDGER?", fill=(120, 90, 70))
d.text((480, 420), "REN HALIM", fill=(160, 140, 110))
d.ellipse([200, 280, 280, 360], outline=(100, 60, 50), width=2)

cipher = b"GGVFAZPMUFEKECGKMSC"
user_comment = b"ASCII\x00\x00\x00" + cipher
exif_dict = {
    "0th": {
        piexif.ImageIFD.ImageDescription: cipher,
        piexif.ImageIFD.Artist: b"R.Halim archive",
        piexif.ImageIFD.Software: b"GLD-CAM",
    },
    "Exif": {
        piexif.ExifIFD.UserComment: user_comment,
        piexif.ExifIFD.DateTimeOriginal: b"2026:09:17 06:22:00",
    },
}
exif_bytes = piexif.dump(exif_dict)
img.save("assets/l4-foto.jpg", "JPEG", quality=88, exif=exif_bytes)
ex = piexif.load("assets/l4-foto.jpg")
print("saved assets/l4-foto.jpg")
print("desc", ex["0th"].get(piexif.ImageIFD.ImageDescription))
print("uc", ex["Exif"].get(piexif.ExifIFD.UserComment))
