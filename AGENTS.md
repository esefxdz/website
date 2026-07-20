# Repository Guidelines

## Project Structure & Module Organization

```
website/
├── index.html              # Single-page entry point — all 5 tabs live here
├── gallery-container.html  # Static gallery image tags (50 images)
├── _redirects              # Netlify SPA rewrite rule (/* → /index.html)
├── js/
│   ├── tabs.js             # Client-side routing, tab switching, background video swap
│   ├── comments.js         # Steam-style comment wall (Firestore: comments + stats)
│   ├── yuukabot.js         # Live bot dashboard (Firestore: sysinfo/server)
│   ├── calendar.js         # Event calendar (Firestore: calendar_events)
│   └── gallery.js          # Lightbox + dynamic thumbnail loader
├── style/
│   ├── styles.css          # Global layout, nav bar, base typography
│   ├── comments.css        # Steam-profile comment UI
│   ├── yuukabot.css        # Dashboard glassmorphism cards + grid
│   ├── calendar.css        # Calendar grid, popups, sidebar
│   ├── gallery.css         # Gallery grid + lightbox
│   └── ahmet.css           # Bucketlist tab button
├── gallery/                # 50 full-quality images + thumbnails/ subdirectory
├── textures/               # Background MP4 videos + clickable character PNG
├── sounds/                 # Click SFX (yuuka_click.mp3)
├── generate_thumbnails.py  # Pillow script: resizes gallery/ images → thumbnails/
└── firebase.txt            # Firestore security rules (reference only)
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
- `generate_thumbnails.py` regenerates gallery thumbnails: `python generate_thumbnails.py`. Requires `Pillow`.

There are **no automated tests** in this project.

## Coding Style & Naming Conventions

- **HTML:** Semantic elements where practical. Tab contents use `<section id="…" class="tab-content">`. IDs are kebab-case.
- **CSS:** Each tab has its own stylesheet under `style/`. Class names follow BEM-lite (`cal-day`, `dash-card`). CSS variables define layout knobs (`--dash-columns`, `--dash-gap`).
- **JavaScript:** Vanilla ES6+, no transpilation. Functions are `camelCase`, DOM-referencing IDs match kebab-case HTML IDs. Each script is self-contained with a `DOMContentLoaded` guard. Firebase config is repeated per-file (same values) — keep this pattern.
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

## Adding a New Feature

1. Add the new `<section class="tab-content" id="…">` in `index.html`.
2. Add a `<button id="…-btn">` to the nav bar (`#top-line`).
3. Add the tab name to the `valid` array in `js/tabs.js`.
4. Create a dedicated stylesheet in `style/` and JS module in `js/` if needed.
5. Link both in `index.html` `<head>` (CSS) and before `</body>` (JS).
6. If the feature reads/writes Firestore, add the matching security rules to `firebase.txt`.
