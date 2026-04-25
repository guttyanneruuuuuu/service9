/* storage.js — local persistence for ThoughtSpace universes
   - Versioned schema
   - Validates data on read
*/
(function (global) {
  'use strict';
  const KEY = 'thoughtspace.universe.v1';
  const META_KEY = 'thoughtspace.meta.v1';
  const SCHEMA_VERSION = 1;

  const DEFAULT = () => ({
    schema: SCHEMA_VERSION,
    name: 'My Thought Universe',
    author: '',
    bio: '',
    color: '#7c5cff',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    nodes: [],   // {id, x, y, text, color, shape:'star'|'planet'|'nebula'|'note', size}
    edges: []    // {id, from, to, type:'normal'|'wormhole'}
  });

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return DEFAULT();
      const obj = JSON.parse(raw);
      return validate(obj) ? migrate(obj) : DEFAULT();
    } catch (e) {
      console.warn('[ThoughtSpace] storage load failed', e);
      return DEFAULT();
    }
  }

  function save(state) {
    try {
      state.schema = SCHEMA_VERSION;
      state.updatedAt = Date.now();
      localStorage.setItem(KEY, JSON.stringify(state));
      return true;
    } catch (e) {
      // Quota exceeded — try to reduce by removing transient fields if any
      console.warn('[ThoughtSpace] save failed', e);
      return false;
    }
  }

  function clear() {
    localStorage.removeItem(KEY);
  }

  function validate(obj) {
    if (!obj || typeof obj !== 'object') return false;
    if (!Array.isArray(obj.nodes) || !Array.isArray(obj.edges)) return false;
    return true;
  }

  function migrate(obj) {
    // future-proof: if obj.schema < SCHEMA_VERSION, transform
    return obj;
  }

  // Stats / meta (used count, last opened, etc.) — kept separate so loss is not fatal
  function getMeta() {
    try {
      return JSON.parse(localStorage.getItem(META_KEY) || '{}') || {};
    } catch { return {}; }
  }
  function setMeta(patch) {
    const m = { ...getMeta(), ...patch };
    try { localStorage.setItem(META_KEY, JSON.stringify(m)); } catch {}
    return m;
  }

  global.TS = global.TS || {};
  global.TS.storage = { load, save, clear, getMeta, setMeta, DEFAULT };
})(window);
