"""Build gallery thumbnails + manifest.

Run after adding images to gallery/:
    python generate_thumbnails.py

- Converts animated GIFs to MP4 (needs ffmpeg on PATH). Same animation at a
  few % of the size; the GIF stays as the source but the site uses the MP4.
- Creates gallery/thumbnails/<name>.jpg (max 400x400) for any item missing one.
- Rewrites gallery/manifest.json: the ordered list of full-size filenames
  that js/gallery.js renders (the MP4 wins when a GIF has one).
"""
import json
import os
import shutil
import subprocess

from PIL import Image

IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".gif"}
VIDEO_EXTS = {".mp4"}
THUMB_SIZE = (400, 400)
FFMPEG = shutil.which("ffmpeg")


def sort_key(filename):
    # Numeric names sort numerically (1, 2, ..., 10), anything else after, alphabetically
    stem = os.path.splitext(filename)[0]
    return (0, int(stem), "") if stem.isdigit() else (1, 0, stem.lower())


def list_files(base_folder, exts):
    return sorted(
        (f for f in os.listdir(base_folder)
         if os.path.isfile(os.path.join(base_folder, f))
         and os.path.splitext(f)[1].lower() in exts),
        key=sort_key,
    )


def convert_gifs(base_folder):
    if not FFMPEG:
        print("ffmpeg not found — skipping GIF -> MP4 conversion")
        return
    for filename in list_files(base_folder, {".gif"}):
        src = os.path.join(base_folder, filename)
        dst = os.path.join(base_folder, os.path.splitext(filename)[0] + ".mp4")
        if os.path.exists(dst):
            continue
        with Image.open(src) as img:
            if getattr(img, "n_frames", 1) < 2:
                continue  # still image, keep as GIF
        subprocess.run([
            FFMPEG, "-hide_banner", "-loglevel", "error", "-y", "-i", src,
            "-vf", "scale=trunc(iw/2)*2:trunc(ih/2)*2",   # h264 needs even sizes
            "-c:v", "libx264", "-crf", "23", "-pix_fmt", "yuv420p",
            "-an", "-movflags", "+faststart", dst,
        ], check=True)
        print(f"Converted {filename} -> {os.path.basename(dst)}")


def make_thumbnail(src, thumb_path):
    if os.path.splitext(src)[1].lower() in VIDEO_EXTS:
        if not FFMPEG:
            raise RuntimeError("ffmpeg needed for video thumbnails")
        subprocess.run([
            FFMPEG, "-hide_banner", "-loglevel", "error", "-y", "-i", src,
            "-frames:v", "1", "-vf", "scale='min(400,iw)':'min(400,ih)':force_original_aspect_ratio=decrease",
            "-q:v", "4", thumb_path,
        ], check=True)
        return
    with Image.open(src) as img:
        # JPEG needs RGB (e.g. for RGBA PNGs or palette GIFs)
        if img.mode != "RGB":
            img = img.convert("RGB")
        img.thumbnail(THUMB_SIZE)  # keeps aspect ratio
        img.save(thumb_path, "JPEG", quality=85)


def create_thumbnails(base_folder, files):
    thumb_dir = os.path.join(base_folder, "thumbnails")
    os.makedirs(thumb_dir, exist_ok=True)

    count = 0
    for filename in files:
        # Always save thumbnail as jpg
        stem = os.path.splitext(filename)[0]
        thumb_path = os.path.join(thumb_dir, f"{stem}.jpg")
        if os.path.exists(thumb_path):
            continue
        try:
            make_thumbnail(os.path.join(base_folder, filename), thumb_path)
            count += 1
            print(f"Created thumbnail for {filename}")
        except Exception as e:
            print(f"Failed to process {filename}: {e}")

    print(f"Created {count} thumbnails in {base_folder}")


def pick_for_site(files):
    # One entry per name; prefer the MP4 over its source GIF
    chosen = {}
    for f in files:
        stem, ext = os.path.splitext(f)
        if stem not in chosen or ext.lower() in VIDEO_EXTS:
            chosen[stem] = f
    return sorted(chosen.values(), key=sort_key)


def write_manifest(base_folder, files):
    path = os.path.join(base_folder, "manifest.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(files, f, indent=2)
        f.write("\n")
    print(f"Wrote {path} ({len(files)} items)")


if __name__ == "__main__":
    folder = "gallery"
    if not os.path.isdir(folder):
        print(f"Folder {folder} does not exist.")
    else:
        convert_gifs(folder)
        site_files = pick_for_site(list_files(folder, IMAGE_EXTS | VIDEO_EXTS))
        create_thumbnails(folder, site_files)
        write_manifest(folder, site_files)
