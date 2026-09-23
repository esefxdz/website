document.addEventListener('DOMContentLoaded', () => {

  const tabs = document.querySelectorAll('.tab-content');
  const mainVideo = document.getElementById('background-video');
  const calVideo = document.getElementById('calendar-background-video');
  const bucketlistVideo = document.getElementById('bucketlist-background-video');
  const botVideo = document.getElementById('yuukabot-background-video');

  // ── Map URL path → tab id ──────────────────────────────
  function pathToTab(path) {
    const slug = path.replace(/^\/+|\/+$/g, '') || 'about';
    const valid = ['about', 'gallery', 'bucketlist', 'yuukabot', 'calendar'];
    // backward compat: old /ahmet links
    if (slug === 'ahmet') return 'bucketlist';
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
    bucketlist: bucketlistVideo,
    yuukabot: botVideo
  };

  function setBgForTab(tabId) {
    // Hide + pause ALL videos first
    [mainVideo, calVideo, bucketlistVideo, botVideo].forEach(v => {
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
      topLine.classList.toggle('bucketlist-theme', tabId === 'bucketlist');
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
  function navigateTo(tabId) {
    showTab(tabId);
    window.scrollTo(0, 0);
    history.pushState({ tab: tabId }, '', tabToPath(tabId));
  }

  // ── Initial load: show tab from URL ────────────────────
  // (also normalises unknown / legacy paths like /ahmet in the address bar)
  const initialTab = pathToTab(window.location.pathname);
  showTab(initialTab);
  history.replaceState({ tab: initialTab }, '', tabToPath(initialTab) + window.location.search);

  // ── Tab button clicks ──────────────────────────────────
  const buttons = document.querySelectorAll('#top-line button');
  buttons.forEach(button => {
    button.addEventListener('click', () => {
      const targetId = button.id.replace('-btn', '');
      navigateTo(targetId);
    });
  });

  // ── Back / forward browser buttons ─────────────────────
  window.addEventListener('popstate', (e) => {
    showTab(e.state && e.state.tab ? e.state.tab : pathToTab(window.location.pathname));
  });

});
