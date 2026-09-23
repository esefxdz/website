"""Build gallery thumbnails + manifest.

Run after adding images to gallery/:
    python generate_thumbnails.py

- Creates gallery/thumbnails/<name>.jpg (max 400x400) for any image missing one.
- Rewrites gallery/manifest.json: the ordered list of full-size filenames
  that js/gallery.js renders.
"""
import json
import os

from PIL import Image

IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".gif"}
THUMB_SIZE = (400, 400)


def sort_key(filename):
    # Numeric names sort numerically (1, 2, ..., 10), anything else after, alphabetically
    stem = os.path.splitext(filename)[0]
    return (0, int(stem), "") if stem.isdigit() else (1, 0, stem.lower())


def list_images(base_folder):
    return sorted(
        (f for f in os.listdir(base_folder)
         if os.path.isfile(os.path.join(base_folder, f))
         and os.path.splitext(f)[1].lower() in IMAGE_EXTS),
        key=sort_key,
    )


def create_thumbnails(base_folder, images):
    thumb_dir = os.path.join(base_folder, "thumbnails")
    os.makedirs(thumb_dir, exist_ok=True)

    count = 0
    for filename in images:
        # Always save thumbnail as jpg
        stem = os.path.splitext(filename)[0]
        thumb_path = os.path.join(thumb_dir, f"{stem}.jpg")
        if os.path.exists(thumb_path):
            continue

        try:
            with Image.open(os.path.join(base_folder, filename)) as img:
                # JPEG needs RGB (e.g. for RGBA PNGs or palette GIFs)
                if img.mode != "RGB":
                    img = img.convert("RGB")
                img.thumbnail(THUMB_SIZE)  # keeps aspect ratio
                img.save(thumb_path, "JPEG", quality=85)
                count += 1
                print(f"Created thumbnail for {filename}")
        except Exception as e:
            print(f"Failed to process {filename}: {e}")

    print(f"Created {count} thumbnails in {base_folder}")


def write_manifest(base_folder, images):
    path = os.path.join(base_folder, "manifest.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(images, f, indent=2)
        f.write("\n")
    print(f"Wrote {path} ({len(images)} images)")


if __name__ == "__main__":
    folder = "gallery"
    if not os.path.isdir(folder):
        print(f"Folder {folder} does not exist.")
    else:
        imgs = list_images(folder)
        create_thumbnails(folder, imgs)
        write_manifest(folder, imgs)
