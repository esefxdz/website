// live online/offline dots on the services tab, read from VEGA (Uptime Kuma's public status page)
// banners with data-monitor="<kuma monitor id>" get a dot, "vega" means VEGA itself.
// needs VEGA's nginx to send Access-Control-Allow-Origin for this site, until then the dots just stay hidden.
document.addEventListener('DOMContentLoaded', () => {
  const tab = document.getElementById('services');
  const banners = tab ? tab.querySelectorAll('.svc-banner[data-monitor]') : [];
  if (!banners.length) return;

  // local preview server proxies this so it can be tested before VEGA allows the site
  const API = location.hostname === 'localhost'
    ? '/vega-api'
    : 'https://status.userevolt.app/api';

  let lastCheck = 0;

  function setDot(banner, state) {
    const dot = banner.querySelector('.svc-status');
    if (!dot) return;
    dot.hidden = false;
    dot.className = 'svc-status ' + state;
    dot.title = state === 'up' ? 'Online' : state === 'down' ? 'Offline' : 'Checking…';
  }

  async function check() {
    if (Date.now() - lastCheck < 60000) return;
    lastCheck = Date.now();
    try {
      const res = await fetch(`${API}/status-page/heartbeat/default`, { cache: 'no-store' });
      if (!res.ok) throw new Error(res.status);
      const { heartbeatList } = await res.json();
      banners.forEach(b => {
        const id = b.dataset.monitor;
        if (id === 'vega') return setDot(b, 'up'); // it answered, so it's up
        const beats = heartbeatList[id];
        if (!beats || !beats.length) return;
        setDot(b, beats[beats.length - 1].status === 1 ? 'up' : 'down');
      });
    } catch (e) {
      // VEGA unreachable or not allowing this site yet: leave dots hidden
    }
  }

  const isShown = () => getComputedStyle(tab).display !== 'none';
  if (isShown()) check();
  const btn = document.getElementById('services-btn');
  btn && btn.addEventListener('click', check);
  window.addEventListener('popstate', () => { if (isShown()) check(); });
});
