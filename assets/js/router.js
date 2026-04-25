/* router.js — minimal hash router for ThoughtSpace */
(function (global) {
  'use strict';
  const S = global.TS;

  const pages = {
    lp: document.getElementById('page-lp'),
    app: document.getElementById('page-app'),
    viewer: document.getElementById('page-viewer'),
    p404: document.getElementById('page-404')
  };

  function showPage(name) {
    Object.entries(pages).forEach(([k, el]) => {
      if (!el) return;
      el.classList.toggle('hidden', k !== name);
    });
  }

  function parseHash() {
    let raw = location.hash || '#/';
    if (!raw.startsWith('#')) raw = '#' + raw;
    // strip leading #/
    let path = raw.slice(1);
    if (path.startsWith('/')) path = path.slice(1);
    // split on '?'
    const [rest, q] = path.split('?');
    const parts = rest.split('/').filter(Boolean);
    const query = {};
    if (q) {
      q.split('&').forEach(p => {
        const [k, v] = p.split('=');
        query[decodeURIComponent(k)] = v != null ? decodeURIComponent(v) : '';
      });
    }
    return { parts, query };
  }

  function route() {
    const { parts, query } = parseHash();
    if (parts.length === 0) {
      S.lp.render('home');
      showPage('lp');
      return;
    }
    if (parts[0] === 'manifesto') {
      S.lp.render('manifesto');
      showPage('lp');
      return;
    }
    if (parts[0] === 'privacy') {
      S.lp.render('privacy');
      showPage('lp');
      return;
    }
    if (parts[0] === 'app') {
      S.editor.render({ demo: query.demo === '1' });
      showPage('app');
      return;
    }
    if (parts[0] === 'u' && parts[1]) {
      S.viewer.render(parts[1]);
      showPage('viewer');
      return;
    }
    // 404
    pages.p404.innerHTML = '';
    const notFound = S.sec.el('section', { class: 'section', attrs: { style: 'min-height:100vh; display:flex; align-items:center; justify-content:center;' } }, [
      S.sec.el('div', { class: 'container', attrs: { style: 'text-align:center;' } }, [
        S.sec.el('h2', { text: '🌑 404' }),
        S.sec.el('p', { class: 'lead', text: 'そのページは宇宙の彼方です。' }),
        S.sec.el('a', { class: 'cta-big', attrs: { href: '#/' }, text: 'ホームへ戻る' })
      ])
    ]);
    pages.p404.appendChild(notFound);
    showPage('p404');
  }

  window.addEventListener('hashchange', route);

  global.TS = global.TS || {};
  global.TS.router = { route };
})(window);
