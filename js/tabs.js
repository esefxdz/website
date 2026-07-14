document.addEventListener('DOMContentLoaded', () => {

  const tabs = document.querySelectorAll('.tab-content');
  const mainVideo = document.getElementById('background-video');
  const calVideo = document.getElementById('calendar-background-video');

  // ── Map URL path → tab id ──────────────────────────────
  function pathToTab(path) {
    const slug = path.replace(/^\/+|\/+$/g, '') || 'about';
    const valid = ['about', 'gallery', 'ahmet', 'yuukabot', 'calendar'];
    return valid.includes(slug) ? slug : 'about';
  }

  function tabToPath(tabId) {
    return '/' + (tabId === 'about' ? '' : tabId);
  }

  // ── Swap background videos + top-bar theme ────────────
  const topLine = document.getElementById('top-line');

  function setBgForTab(tabId) {
    if (tabId === 'calendar') {
      // Switch to calendar background
      if (mainVideo) { mainVideo.style.display = 'none'; mainVideo.pause(); }
      if (calVideo) { calVideo.style.display = 'block'; calVideo.play().catch(() => {}); }
      if (topLine) topLine.classList.add('cal-theme');
    } else {
      // Switch back to main background
      if (calVideo) { calVideo.style.display = 'none'; calVideo.pause(); }
      if (mainVideo) { mainVideo.style.display = 'block'; if (mainVideo.paused) mainVideo.play().catch(() => {}); }
      if (topLine) topLine.classList.remove('cal-theme');
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
