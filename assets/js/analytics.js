/* analytics.js — privacy-friendly, no-cookie, no-PII local analytics
   Events are stored in localStorage and aggregated.
   The user can view their own usage at /#/stats — useful insight,
   no third-party tracking, no IP collection (we are static).
   When this site is deployed with a backend, this can be flushed to it;
   for now we keep it local. Honors Do-Not-Track.
*/
(function (global) {
  'use strict';

  const KEY = 'thoughtspace.analytics.v1';
  const SESSION_KEY = 'thoughtspace.session.v1';
  const MAX_EVENTS = 500;

  function dntEnabled() {
    return navigator.doNotTrack === '1' || global.doNotTrack === '1' || navigator.msDoNotTrack === '1';
  }

  function getStore() {
    try { return JSON.parse(localStorage.getItem(KEY) || '{"events":[],"counters":{}}'); }
    catch { return { events: [], counters: {} }; }
  }
  function setStore(s) {
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {}
  }

  function getOrCreateSession() {
    try {
      const cur = JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null');
      if (cur && cur.id) return cur;
      const id = 's_' + Math.random().toString(36).slice(2, 10);
      const s = { id, startedAt: Date.now() };
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(s));
      return s;
    } catch { return { id: 's_anon', startedAt: Date.now() }; }
  }

  function track(name, data = {}) {
    if (dntEnabled()) return;
    const store = getStore();
    const ev = {
      n: String(name).slice(0, 64),
      t: Date.now(),
      // No URL queries, no IP, no UA fingerprint — just route
      r: (location.hash || '#/').slice(0, 80),
      // stripped data: only primitives, max length 200 chars total
      d: stripData(data),
      s: getOrCreateSession().id
    };
    store.events.push(ev);
    if (store.events.length > MAX_EVENTS) store.events = store.events.slice(-MAX_EVENTS);
    store.counters[ev.n] = (store.counters[ev.n] || 0) + 1;
    setStore(store);
  }

  function stripData(d) {
    if (!d || typeof d !== 'object') return {};
    const out = {};
    let charBudget = 200;
    for (const [k, v] of Object.entries(d)) {
      if (charBudget <= 0) break;
      let s;
      if (typeof v === 'number' || typeof v === 'boolean') s = v;
      else if (typeof v === 'string') s = v.slice(0, 60);
      else continue;
      out[k] = s;
      charBudget -= (String(s).length + k.length + 4);
    }
    return out;
  }

  function getStats() { return getStore(); }
  function clearStats() { setStore({ events: [], counters: {} }); }

  global.TS = global.TS || {};
  global.TS.analytics = { track, getStats, clearStats };

  // page-view auto track (lightweight)
  window.addEventListener('hashchange', () => track('page_view'));
  document.addEventListener('DOMContentLoaded', () => track('page_view'));
})(window);
