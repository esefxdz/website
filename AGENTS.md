# Repository Guidelines

## Project Structure & Module Organization

```
website/
├── index.html              # Single-page entry point — all 6 tabs live here
├── _redirects              # Netlify SPA rewrite rule (/* → /index.html)
├── js/
│   ├── tabs.js             # Client-side routing, tab switching, background video swap
│   ├── comments.js         # Steam-style comment wall (Firestore: comments + stats)
│   ├── yuukabot.js         # Live bot dashboard (Firestore: sysinfo/server)
│   ├── calendar.js         # Event calendar (Firestore: calendar_events)
│   ├── bucketlist.js       # Password-gated list (Firestore: bucketlist_auth + bucketlist_data)
│   └── gallery.js          # Lightbox + thumbnail grid built from gallery/manifest.json
├── style/
│   ├── styles.css          # Global layout, nav bar, base typography
│   ├── comments.css        # Steam-profile comment UI
│   ├── yuukabot.css        # Dashboard glassmorphism cards + grid
│   ├── calendar.css        # Calendar grid, popups, sidebar
│   ├── bucketlist.css      # Lock screen + list panel
│   ├── services.css        # Services tab — one .svc-banner per service (Bot Status look)
│   └── gallery.css         # Gallery grid + lightbox
├── gallery/                # Full-quality images, thumbnails/, and manifest.json
├── textures/               # Background MP4s, clickable character PNG, service logos
├── sounds/                 # Click SFX (yuuka_click.mp3)
├── generate_thumbnails.py  # Pillow script: builds thumbnails/ + manifest.json
└── firebase.txt            # Firestore security rules (reference only, gitignored)
```

- **No frameworks, no build step, no package manager.** Every file is served directly.
- Assets are organised by type (images in `gallery/`, videos/PNGs in `textures/`).
- Firebase config is duplicated per JS file, each guarding `firebase.initializeApp()` with `if (!firebase.apps.length)` to avoid collisions.

## Build, Test, and Development Commands

This is a static site with **no build system**. Run locally with any HTTP server:

```sh
# Python 3 (recommended)
python -m http.server 8080

# Node.js alternative
npx serve .
```

- `_redirects` handles SPA routing on Netlify; for local dev, navigate to `/index.html` directly.
- After adding images to `gallery/`, run `python generate_thumbnails.py` (requires `Pillow`, and `ffmpeg` for GIFs). It converts animated GIFs to much smaller MP4s, creates missing thumbnails, and rewrites `gallery/manifest.json`, which is the list the gallery renders — an image not in the manifest won't show up.
- **Keep data usage low.** Background videos are 1080p H.264, no audio, `+faststart`, `preload="none"` (tabs.js starts the one the current tab needs). Recent ones use `ffmpeg -i in.mp4 -r 30 -c:v libx264 -preset slow -crf 28 -pix_fmt yuv420p -an -movflags +faststart out.mp4`. Keep untouched originals outside the site folder (`../media_originals/`). Size images to about 2× their displayed size.

There are **no automated tests** in this project.

## Coding Style & Naming Conventions

- **HTML:** Semantic elements where practical. Tab contents use `<section id="…" class="tab-content">`. IDs are kebab-case.
- **CSS:** Each tab has its own stylesheet under `style/`. Class names follow BEM-lite (`cal-day`, `dash-card`). CSS variables define layout knobs (`--dash-columns`, `--dash-gap`).
- **JavaScript:** Vanilla ES6+, no transpilation. Functions are `camelCase`, DOM-referencing IDs match kebab-case HTML IDs. Each script is self-contained with a `DOMContentLoaded` guard, and Firestore-backed scripts are wrapped in an IIFE so their helpers don't leak into (and clobber each other in) the global scope. Firebase config is repeated per-file (same values) — keep this pattern.
- **Whitespace:** 4-space indentation in JS/CSS, 2-space in HTML. No trailing semicolons are required but consistency within each file is expected.
- No linters or formatters are configured.

## Commit & Pull Request Guidelines

Commit history follows an informal style:

```
<verb> <short description>
```

Examples from the repo: `calendar added`, `fix upcoming filter`, `css polish bs`, `tab specific routing added`.

- Use lowercase, imperative mood.
- Keep messages short (under 72 characters).
- Group related changes into a single commit where possible.
- PRs should include a brief description of what changed and why; screenshots are appreciated for visual/UI changes.

## Security & Configuration

- **Firebase API keys** are public by design (they identify the project, not authenticate). Do not commit service-account credentials or `.env` files.
- `firebase.txt` is in `.gitignore` — keep the live rules reference there, not hardcoded in source.
- All Firestore writes are guarded by security rules (see `firebase.txt`): only `comments` and `stats/global_clicks` accept public writes; everything else is read-only.
- Use `allow get` (not `allow read`) for collections keyed by a secret, like `bucketlist_auth` — `read` also permits listing every document.
- Editing `firebase.txt` does nothing by itself: paste it into Firebase Console → Firestore → Rules and publish.

## Adding a New Feature

1. Add the new `<section class="tab-content" id="…">` in `index.html`.
2. Add a `<button id="…-btn">` to the nav bar (`#top-line`).
3. Add the tab name to the `valid` array in `js/tabs.js`. For a custom background video, map the tab to a video element in `tabVideos` (tabs can share one) and optionally add a nav theme class.
4. Create a dedicated stylesheet in `style/` and JS module in `js/` if needed.
5. Link both in `index.html` `<head>` (CSS) and before `</body>` (JS).
6. If the feature reads/writes Firestore, add the matching security rules to `firebase.txt`.
