/* security.js — XSS-safe DOM helpers, sanitization, validation
   ThoughtSpace
*/
(function (global) {
  'use strict';

  // Escape any string for safe HTML insertion (we mostly use textContent, this is a fallback)
  function escapeHtml(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Strip control chars (zero-width and the like) which are XSS amplifiers + harmful for layout
  function sanitizeText(s, maxLen) {
    if (s == null) return '';
    let str = String(s);
    // remove control chars except common whitespace
    str = str.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
    // normalize line endings
    str = str.replace(/\r\n?/g, '\n');
    // optional length cap
    if (typeof maxLen === 'number' && str.length > maxLen) {
      str = str.slice(0, maxLen);
    }
    return str;
  }

  // Validate hex color (#RRGGBB or #RGB)
  function isValidHexColor(s) {
    return typeof s === 'string' && /^#([0-9a-fA-F]{3}){1,2}$/.test(s);
  }

  // Build a DOM element safely
  // tag: string | options: { class, id, text, attrs:{}, on:{} } | children: Array<Node|string>
  function el(tag, options = {}, children = []) {
    const e = document.createElement(tag);
    if (options.class) e.className = options.class;
    if (options.id) e.id = options.id;
    if (options.text != null) e.textContent = String(options.text);
    if (options.html != null) {
      // ONLY use html for trusted sources — do not pass user input here
      e.innerHTML = options.html;
    }
    if (options.attrs) {
      for (const [k, v] of Object.entries(options.attrs)) {
        if (v === false || v == null) continue;
        // Block dangerous attrs: only allow data-*, aria-*, and a known safe set
        if (!isAttrSafe(k)) continue;
        e.setAttribute(k, String(v));
      }
    }
    if (options.on) {
      for (const [evt, handler] of Object.entries(options.on)) {
        if (typeof handler === 'function') e.addEventListener(evt, handler);
      }
    }
    if (Array.isArray(children)) {
      for (const c of children) {
        if (c == null) continue;
        if (typeof c === 'string') e.appendChild(document.createTextNode(c));
        else e.appendChild(c);
      }
    }
    return e;
  }

  const SAFE_ATTRS = new Set([
    'href', 'target', 'rel', 'src', 'alt', 'title', 'role',
    'type', 'name', 'value', 'placeholder', 'maxlength', 'minlength',
    'min', 'max', 'step', 'pattern', 'autocomplete',
    'tabindex', 'disabled', 'checked', 'readonly', 'required',
    'd', 'cx', 'cy', 'r', 'x', 'y', 'x1','x2','y1','y2', 'width', 'height',
    'fill', 'stroke', 'stroke-width', 'viewBox', 'transform', 'preserveAspectRatio',
    'points', 'rx', 'ry', 'gradientUnits', 'offset', 'stop-color', 'stop-opacity'
  ]);
  function isAttrSafe(k) {
    if (k.startsWith('data-')) return true;
    if (k.startsWith('aria-')) return true;
    if (k === 'for' || k === 'class' || k === 'id') return true;
    return SAFE_ATTRS.has(k);
  }

  // SVG element builder (separate XML namespace)
  const SVG_NS = 'http://www.w3.org/2000/svg';
  function svg(tag, attrs = {}, children = []) {
    const e = document.createElementNS(SVG_NS, tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v === false || v == null) continue;
      if (!isAttrSafe(k) && !k.startsWith('data-') && !k.startsWith('aria-')) continue;
      e.setAttribute(k, String(v));
    }
    if (Array.isArray(children)) {
      for (const c of children) {
        if (c == null) continue;
        if (typeof c === 'string') e.appendChild(document.createTextNode(c));
        else e.appendChild(c);
      }
    }
    return e;
  }

  // crypto-safe id
  function uid(prefix = 'n') {
    const arr = new Uint8Array(8);
    (global.crypto || global.msCrypto).getRandomValues(arr);
    return prefix + '_' + Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Toast notification
  function toast(message, type = '') {
    const area = document.getElementById('toast-area');
    if (!area) return;
    const t = el('div', { class: 'toast ' + (type || ''), text: message });
    area.appendChild(t);
    setTimeout(() => {
      t.style.transition = 'opacity .25s, transform .25s';
      t.style.opacity = '0';
      t.style.transform = 'translateY(8px)';
      setTimeout(() => t.remove(), 280);
    }, 2600);
  }

  // Simple rate limiter (e.g., to prevent malicious autocreate spam in shared mode)
  function makeRateLimiter(limit, windowMs) {
    let bucket = [];
    return function tryHit() {
      const now = Date.now();
      bucket = bucket.filter(t => now - t < windowMs);
      if (bucket.length >= limit) return false;
      bucket.push(now);
      return true;
    };
  }

  global.TS = global.TS || {};
  global.TS.sec = {
    escapeHtml, sanitizeText, isValidHexColor, isAttrSafe,
    el, svg, uid, toast, makeRateLimiter
  };
})(window);
