document.addEventListener('DOMContentLoaded', () => {

  const tabs = document.querySelectorAll('.tab-content');
  const mainVideo = document.getElementById('background-video');
  const calVideo = document.getElementById('calendar-background-video');
  const bucketlistVideo = document.getElementById('bucketlist-background-video');
  const botVideo = document.getElementById('yuukabot-background-video');

  function pathToTab(path) {
    const slug = path.replace(/^\/+|\/+$/g, '') || 'about';
    const valid = ['about', 'gallery', 'bucketlist', 'yuukabot', 'calendar', 'services'];
    // old links
    if (slug === 'ahmet') return 'bucketlist';
    return valid.includes(slug) ? slug : 'about';
  }

  function tabToPath(tabId) {
    return '/' + (tabId === 'about' ? '' : tabId);
  }

  const topLine = document.getElementById('top-line');

  // tabs not listed here use the main video
  const tabVideos = {
    calendar: calVideo,
    bucketlist: bucketlistVideo,
    yuukabot: botVideo,
    services: botVideo
  };

  function setBgForTab(tabId) {
    [mainVideo, calVideo, bucketlistVideo, botVideo].forEach(v => {
      if (v) { v.style.display = 'none'; v.pause(); }
    });

    const target = tabVideos[tabId];
    if (target) {
      target.style.display = 'block';
      target.play().catch(() => {});
    } else if (mainVideo) {
      mainVideo.style.display = 'block';
      if (mainVideo.paused) mainVideo.play().catch(() => {});
    }

    if (topLine) {
      topLine.classList.toggle('cal-theme', tabId === 'calendar');
      topLine.classList.toggle('bucketlist-theme', tabId === 'bucketlist');
    }
  }

  const navCurrent = document.getElementById('nav-current');

  function showTab(tabId) {
    tabs.forEach(t => t.style.display = 'none');
    const target = document.getElementById(tabId);
    if (target) target.style.display = 'block';
    setBgForTab(tabId);

    // tab name next to the hamburger on mobile
    const btn = document.getElementById(tabId + '-btn');
    if (navCurrent && btn) navCurrent.textContent = btn.textContent;
  }

  // changing the url breaks every button when index.html is opened as a file
  function setUrl(method, tabId) {
    if (window.location.protocol === 'file:') return;
    history[method]({ tab: tabId }, '', tabToPath(tabId) + window.location.search);
  }

  function navigateTo(tabId) {
    showTab(tabId);
    window.scrollTo(0, 0);
    setUrl('pushState', tabId);
  }

  const initialTab = pathToTab(window.location.pathname);
  showTab(initialTab);
  setUrl('replaceState', initialTab);

  const buttons = document.querySelectorAll('#nav-tabs button');
  buttons.forEach(button => {
    button.addEventListener('click', () => {
      const targetId = button.id.replace('-btn', '');
      navigateTo(targetId);
      closeMenu();
    });
  });

  // hamburger menu (mobile)
  const hamburger = document.getElementById('nav-hamburger');

  function openMenu() {
    topLine.classList.add('nav-open');
    hamburger.setAttribute('aria-expanded', 'true');
  }

  function closeMenu() {
    topLine.classList.remove('nav-open');
    hamburger.setAttribute('aria-expanded', 'false');
  }

  hamburger.addEventListener('click', () => {
    topLine.classList.contains('nav-open') ? closeMenu() : openMenu();
  });
  document.addEventListener('click', (e) => {
    if (!topLine.contains(e.target)) closeMenu();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });

  // back/forward buttons
  window.addEventListener('popstate', (e) => {
    showTab(e.state && e.state.tab ? e.state.tab : pathToTab(window.location.pathname));
  });

});
