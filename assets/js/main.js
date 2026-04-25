/* main.js — bootstrap */
(function () {
  'use strict';
  document.addEventListener('DOMContentLoaded', () => {
    // hide splash
    const sp = document.getElementById('splash');
    if (sp) {
      setTimeout(() => sp.classList.add('hidden'), 300);
      setTimeout(() => sp.remove(), 1200);
    }

    // first-time visitor analytics
    try {
      const meta = window.TS.storage.getMeta();
      if (!meta.firstSeen) {
        window.TS.storage.setMeta({ firstSeen: Date.now(), visits: 1 });
        window.TS.analytics.track('first_visit');
      } else {
        window.TS.storage.setMeta({ visits: (meta.visits || 0) + 1, lastSeen: Date.now() });
      }
    } catch {}

    // global error handler -> never expose internal info to user
    window.addEventListener('error', (e) => {
      console.warn('Global error:', e.message);
    });

    // Initial route
    window.TS.router.route();

    // Click any link with data-share-tweet to tweet (placeholder for future)
  });
})();
