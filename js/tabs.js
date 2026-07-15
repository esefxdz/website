document.addEventListener('DOMContentLoaded', () => {

  const tabs = document.querySelectorAll('.tab-content');
  const mainVideo = document.getElementById('background-video');
  const calVideo = document.getElementById('calendar-background-video');
  const czVideo = document.getElementById('czscores-background-video');

  // ── Map URL path → tab id ──────────────────────────────
  function pathToTab(path) {
    const slug = path.replace(/^\/+|\/+$/g, '') || 'about';
    const valid = ['about', 'gallery', 'czscores', 'yuukabot', 'calendar'];
    // backward compat: old /ahmet links
    if (slug === 'ahmet') return 'czscores';
    return valid.includes(slug) ? slug : 'about';
  }

  function tabToPath(tabId) {
    return '/' + (tabId === 'about' ? '' : tabId);
  }

  // ── Swap background videos + top-bar theme ────────────
  const topLine = document.getElementById('top-line');

  // map tab id → its dedicated video element (null = use main)
  const tabVideos = {
    calendar: calVideo,
    czscores: czVideo
  };

  function setBgForTab(tabId) {
    // Hide + pause ALL videos first
    [mainVideo, calVideo, czVideo].forEach(v => {
      if (v) { v.style.display = 'none'; v.pause(); }
    });

    // Show the right one
    const target = tabVideos[tabId];
    if (target) {
      target.style.display = 'block';
      target.play().catch(() => {});
    } else if (mainVideo) {
      mainVideo.style.display = 'block';
      if (mainVideo.paused) mainVideo.play().catch(() => {});
    }

    // Top-bar theme toggle
    if (topLine) {
      topLine.classList.toggle('cal-theme', tabId === 'calendar');
      topLine.classList.toggle('czscores-theme', tabId === 'czscores');
    }
  }

  // ── Show a specific tab ────────────────────────────────
  function showTab(tabId) {
    tabs.forEach(t => t.style.display = 'none');
    const target = document.getElementById(tabId);
    if (target) target.style.display = 'block';
    setBgForTab(tabId);
  }

  // ── Navigate to a tab (updates URL + shows it) ────────
  function navigateTo(tabId, push = true) {
    showTab(tabId);
    if (push) {
      history.pushState({ tab: tabId }, '', tabToPath(tabId));
    }
  }

  // ── Initial load: show tab from URL ────────────────────
  showTab(pathToTab(window.location.pathname));

  // ── Tab button clicks ──────────────────────────────────
  const buttons = document.querySelectorAll('#top-line button');
  buttons.forEach(button => {
    button.addEventListener('click', () => {
      const targetId = button.id.replace('-btn', '');
      navigateTo(targetId);
    });
  });

  // ── Home button (logo) ─────────────────────────────────
  const homeBtn = document.getElementById('home-btn');
  if (homeBtn) {
    homeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      navigateTo('about');
    });
  }

  // ── Back / forward browser buttons ─────────────────────
  window.addEventListener('popstate', (e) => {
    if (e.state && e.state.tab) {
      showTab(e.state.tab);
    } else {
      showTab(pathToTab(window.location.pathname));
    }
  });

});
