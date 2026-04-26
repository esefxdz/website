import os
from PIL import Image

def create_thumbnails(base_folder):
    if not os.path.exists(base_folder):
        print(f"Folder {base_folder} does not exist.")
        return

    thumb_dir = os.path.join(base_folder, "thumbnails")
    os.makedirs(thumb_dir, exist_ok=True)

    count = 0
    for filename in os.listdir(base_folder):
        ext = filename.split('.')[-1].lower()
        if ext not in ['jpg', 'jpeg', 'png', 'gif']:
            continue
            
        filepath = os.path.join(base_folder, filename)
        if not os.path.isfile(filepath):
            continue

        base_name = filename.split('.')[0]
        # Always save thumbnail as jpg
        thumb_path = os.path.join(thumb_dir, f"{base_name}.jpg")
        
        # If thumbnail already exists, skip
        if os.path.exists(thumb_path):
            continue
            
        try:
            with Image.open(filepath) as img:
                # Convert to RGB if necessary (e.g., for RGBA PNGs or GIFs)
                if img.mode != 'RGB':
                    img = img.convert('RGB')
                
                # Resize keeping aspect ratio
                # Set a max dimension (e.g., 400x400)
                img.thumbnail((400, 400))
                img.save(thumb_path, "JPEG", quality=85)
                count += 1
                print(f"Created thumbnail for {filename}")
        except Exception as e:
            print(f"Failed to process {filename}: {e}")
            
    print(f"Created {count} thumbnails in {base_folder}")

if __name__ == "__main__":
    create_thumbnails("gallery")
    create_thumbnails("ahmet")
