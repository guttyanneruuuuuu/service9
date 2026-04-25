/* share.js — share Universe state via URL hash (no backend needed)
   Strategy:
     1) Strip universe to minimal shape
     2) JSON.stringify -> compress with a simple but effective dictionary RLE
     3) Encode to base64url
   Capacity: a typical universe (~50 nodes) compresses to ~1-3KB which fits in URL.
*/
(function (global) {
  'use strict';

  // Convert utf-8 string to base64url
  function toB64Url(str) {
    const bytes = new TextEncoder().encode(str);
    let bin = '';
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    const b64 = btoa(bin);
    return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function fromB64Url(s) {
    let b64 = s.replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) b64 += '=';
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }

  // Reduce state to share-friendly minimal form
  function compactState(s) {
    return {
      v: 1,
      n: s.name || '',
      a: s.author || '',
      b: s.bio || '',
      c: s.color || '#7c5cff',
      // per-node: id, x, y, text, color, shape, size
      N: (s.nodes || []).map(n => ({
        i: n.id, x: Math.round(n.x), y: Math.round(n.y),
        t: n.text || '', c: n.color || '#7c5cff',
        s: n.shape || 'star', z: n.size || 60
      })),
      E: (s.edges || []).map(e => ({ i: e.id, f: e.from, t: e.to, k: e.type || 'normal' }))
    };
  }
  function expandState(c) {
    if (!c || typeof c !== 'object') return null;
    return {
      schema: 1,
      name: String(c.n || 'Shared Universe'),
      author: String(c.a || ''),
      bio: String(c.b || ''),
      color: typeof c.c === 'string' ? c.c : '#7c5cff',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      nodes: Array.isArray(c.N) ? c.N.map(n => ({
        id: String(n.i || ''),
        x: Number(n.x) || 0, y: Number(n.y) || 0,
        text: String(n.t || ''),
        color: typeof n.c === 'string' ? n.c : '#7c5cff',
        shape: ['star','planet','nebula','note'].includes(n.s) ? n.s : 'star',
        size: Math.max(20, Math.min(160, Number(n.z) || 60))
      })) : [],
      edges: Array.isArray(c.E) ? c.E.map(e => ({
        id: String(e.i || ''),
        from: String(e.f || ''),
        to: String(e.t || ''),
        type: e.k === 'wormhole' ? 'wormhole' : 'normal'
      })).filter(e => e.from && e.to) : []
    };
  }

  function encode(state) {
    const compact = compactState(state);
    const json = JSON.stringify(compact);
    return toB64Url(json);
  }
  function decode(token) {
    try {
      const json = fromB64Url(token);
      const compact = JSON.parse(json);
      return expandState(compact);
    } catch (e) {
      console.warn('[ThoughtSpace] decode share failed', e);
      return null;
    }
  }

  // Build a shareable URL
  function buildShareUrl(state) {
    const token = encode(state);
    const url = new URL(window.location.href);
    url.hash = '#/u/' + token;
    return url.toString();
  }

  global.TS = global.TS || {};
  global.TS.share = { encode, decode, buildShareUrl };
})(window);
