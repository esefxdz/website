// manifest.json comes from generate_thumbnails.py
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('gallery-container');
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxVideo = document.getElementById('lightbox-video');
  const counter = document.getElementById('lightbox-counter');
  const prevBtn = lightbox && lightbox.querySelector('.lightbox-prev');
  const nextBtn = lightbox && lightbox.querySelector('.lightbox-next');

  if (!container || !lightbox) return;

  let files = [];
  let current = -1;

  const isOpen = () => lightbox.style.display === 'block';
  const fullPath = (file) => `gallery/${file}`;
  const thumbPath = (file) => `gallery/thumbnails/${file.replace(/\.[^.]+$/, '')}.jpg`;

  // gifs are converted to mp4 so those open in the video player
  const show = (i) => {
    current = (i + files.length) % files.length;
    const src = fullPath(files[current]);
    const isVideo = src.endsWith('.mp4');

    lightboxImg.style.display = isVideo ? 'none' : 'block';
    lightboxVideo.style.display = isVideo ? 'block' : 'none';
    if (isVideo) {
      lightboxImg.removeAttribute('src');
      lightboxVideo.src = src;
      lightboxVideo.play().catch(() => {});
    } else {
      lightboxVideo.pause();
      lightboxVideo.removeAttribute('src');
      lightboxImg.src = src;
    }
    if (counter) counter.textContent = `${current + 1} / ${files.length}`;

    // warm up the next image so flipping forward feels instant
    const next = files[(current + 1) % files.length];
    if (next && !next.endsWith('.mp4')) new Image().src = fullPath(next);
  };

  const openLightbox = (i) => {
    lightbox.style.display = 'block';
    document.body.style.overflow = 'hidden';
    show(i);
  };

  const closeLightbox = () => {
    lightbox.style.display = 'none';
    document.body.style.overflow = '';
    lightboxImg.removeAttribute('src');
    lightboxVideo.pause();
    lightboxVideo.removeAttribute('src');
    lightboxVideo.load();
  };

  const step = (d) => { if (files.length > 1) show(current + d); };

  prevBtn && prevBtn.addEventListener('click', (e) => { e.stopPropagation(); step(-1); });
  nextBtn && nextBtn.addEventListener('click', (e) => { e.stopPropagation(); step(1); });

  lightbox.addEventListener('click', (e) => {
    if (e.target !== lightboxImg && e.target !== lightboxVideo) closeLightbox();
  });
  document.addEventListener('keydown', (e) => {
    if (!isOpen()) return;
    if (e.key === 'Escape') closeLightbox();
    else if (e.key === 'ArrowLeft') step(-1);
    else if (e.key === 'ArrowRight') step(1);
  });

  // swipe left/right on phones
  let touchX = null, touchY = null;
  lightbox.addEventListener('touchstart', (e) => {
    touchX = e.touches[0].clientX;
    touchY = e.touches[0].clientY;
  }, { passive: true });
  lightbox.addEventListener('touchend', (e) => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    const dy = e.changedTouches[0].clientY - touchY;
    touchX = touchY = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      e.preventDefault(); // don't let the swipe count as a tap that closes it
      step(dx < 0 ? 1 : -1);
    }
  });

  fetch('gallery/manifest.json')
    .then(res => {
      if (!res.ok) throw new Error(res.status);
      return res.json();
    })
    .then(list => {
      files = list;
      files.forEach((file, i) => {
        const tile = document.createElement('div');
        tile.className = 'gallery-item' + (file.endsWith('.mp4') ? ' is-video' : '');

        const img = document.createElement('img');
        img.alt = `Gallery image ${i + 1}`;
        img.loading = 'lazy';
        img.onload = () => tile.classList.add('loaded');
        img.src = thumbPath(file);

        tile.appendChild(img);
        tile.onclick = () => openLightbox(i);
        container.appendChild(tile);
      });
    })
    .catch(err => console.error('Could not load gallery manifest:', err));
});
