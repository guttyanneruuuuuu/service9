/* editor.js — ThoughtSpace Editor (SVG-based)
   Features:
     - Pan (drag empty area), zoom (wheel / pinch / +/- buttons)
     - Add node (toolbar / dblclick / Enter on empty)
     - Drag nodes, snap-not-aggressive
     - Edit text via popover, color palette, shape selector
     - Connect 2 nodes with normal edge / wormhole
     - Delete selected (Del/Backspace)
     - Undo / Redo (Ctrl+Z / Ctrl+Shift+Z)
     - Save to localStorage (auto), Share link, Import via paste
     - Demo loader (?demo=1)
*/
(function (global) {
  'use strict';
  const S = global.TS;
  const { el, svg, uid, sanitizeText, isValidHexColor, toast } = S.sec;

  const PALETTE = ['#7c5cff','#00e6ff','#ff4fa3','#4ade80','#fbbf24','#f87171','#a78bfa','#ffffff'];
  const SHAPES = [
    { id: 'star',   label: '星',   emoji: '⭐' },
    { id: 'planet', label: '惑星', emoji: '🪐' },
    { id: 'nebula', label: '星雲', emoji: '🌌' },
    { id: 'note',   label: 'ノート', emoji: '📝' }
  ];

  const MAX_TEXT = 280;
  const MAX_NODES = 500;
  const MAX_NAME = 80;

  let state = null;       // current universe
  let view = { x: 0, y: 0, scale: 1 };
  let selectedNodeId = null;
  let connectingFromId = null; // when set, next click on a node creates an edge
  let connectingType = 'normal';
  let history = [];
  let historyIdx = -1;
  let svgEl, gView, edgesLayer, nodesLayer, defsEl;
  let editorPopover = null;
  let dragInfo = null;    // { mode:'node'|'pan', id?, sx, sy, ox, oy }
  let didDrag = false;
  let suppressClickAfterDrag = false;

  function pushHistory() {
    history = history.slice(0, historyIdx + 1);
    history.push(JSON.stringify({
      name: state.name, color: state.color, author: state.author, bio: state.bio,
      nodes: state.nodes, edges: state.edges
    }));
    if (history.length > 80) history.shift();
    historyIdx = history.length - 1;
  }
  function undo() {
    if (historyIdx <= 0) return;
    historyIdx--;
    Object.assign(state, JSON.parse(history[historyIdx]));
    autosave();
    redrawAll();
    toast('元に戻しました');
  }
  function redo() {
    if (historyIdx >= history.length - 1) return;
    historyIdx++;
    Object.assign(state, JSON.parse(history[historyIdx]));
    autosave();
    redrawAll();
    toast('やり直しました');
  }

  function autosave() {
    state.updatedAt = Date.now();
    S.storage.save(state);
  }

  function buildSidebar() {
    const colorRow = el('div', { class: 'color-row' });
    PALETTE.forEach(c => {
      const sw = el('button', {
        class: 'color-swatch' + (state.color === c ? ' active' : ''),
        attrs: { 'aria-label': 'Color ' + c },
        on: { click: () => {
          state.color = c;
          [...colorRow.children].forEach(x => x.classList.remove('active'));
          sw.classList.add('active');
          if (selectedNodeId) {
            const n = findNode(selectedNodeId);
            if (n) { n.color = c; pushHistory(); autosave(); redrawAll(); }
          } else {
            autosave();
          }
        }}
      });
      sw.style.background = c;
      colorRow.appendChild(sw);
    });

    const toolGrid = el('div', { class: 'tool-row' },
      SHAPES.map(s => el('button', {
        class: 'tool',
        attrs: { 'aria-label': 'Add ' + s.label, 'data-shape': s.id },
        on: { click: () => addNodeAtCenter(s.id) }
      }, [
        el('div', { class: 'emoji', text: s.emoji }),
        el('div', { text: s.label })
      ]))
    );

    return el('aside', { class: 'sidebar scrollbar' }, [
      el('div', { class: 'side-section' }, [
        el('h5', { text: 'Add a Node' }),
        toolGrid
      ]),
      el('div', { class: 'side-section' }, [
        el('h5', { text: 'Color' }),
        colorRow
      ]),
      el('div', { class: 'side-section' }, [
        el('h5', { text: 'Connect' }),
        el('button', { class: 'btn', attrs: { id: 'btn-connect-normal' }, text: '🔗 ノード同士をリンク', on: {
          click: () => startConnecting('normal')
        }}),
        el('div', { attrs: { 'aria-hidden': 'true' }, class: '', }),
        el('button', { class: 'btn', attrs: { id: 'btn-connect-worm' }, text: '🕳️ ワームホール接続', on: {
          click: () => startConnecting('wormhole')
        }})
      ]),
      el('div', { class: 'side-section' }, [
        el('h5', { text: 'Selected' }),
        el('button', { class: 'btn', text: '✏️ 編集', on: { click: () => editSelected() }}),
        el('div', {}),
        el('button', { class: 'btn', text: '🗑 削除', on: { click: () => deleteSelected() }})
      ]),
      el('div', { class: 'side-section' }, [
        el('h5', { text: 'How to' }),
        el('div', { class: 'hint' }, [
          document.createTextNode('• キャンバスを '),
          el('kbd', { text: 'ダブルクリック' }),
          document.createTextNode(' でノード追加'),
          el('br'),
          document.createTextNode('• ドラッグで移動・パン'),
          el('br'),
          document.createTextNode('• '),
          el('kbd', { text: 'Wheel' }),
          document.createTextNode(' でズーム'),
          el('br'),
          document.createTextNode('• '),
          el('kbd', { text: 'Del' }),
          document.createTextNode(' で削除'),
          el('br'),
          document.createTextNode('• '),
          el('kbd', { text: 'Ctrl+Z' }),
          document.createTextNode(' / '),
          el('kbd', { text: 'Ctrl+Y' }),
          document.createTextNode(' で履歴')
        ])
      ])
    ]);
  }

  function buildTopbar() {
    const nameInput = el('input', {
      class: 'universe-name',
      attrs: { type: 'text', maxlength: String(MAX_NAME), value: state.name || '', 'aria-label': 'Universe name' }
    });
    nameInput.value = state.name || 'My Thought Universe';
    nameInput.addEventListener('change', () => {
      state.name = sanitizeText(nameInput.value, MAX_NAME) || 'Untitled';
      pushHistory(); autosave();
      document.title = state.name + ' — ThoughtSpace';
    });

    return el('header', { class: 'topbar' }, [
      el('div', { class: 'left' }, [
        el('a', { class: 'brand', attrs: { href: '#/' } }, [
          el('span', { class: 'brand-mark' }),
          el('strong', { text: 'ThoughtSpace', class: 'hide-mobile' })
        ]),
        nameInput
      ]),
      el('div', { class: 'right' }, [
        el('button', { class: 'icon-btn', attrs: { 'aria-label': 'Undo', title: 'Undo (Ctrl+Z)' }, text: '↺', on: { click: undo }}),
        el('button', { class: 'icon-btn', attrs: { 'aria-label': 'Redo', title: 'Redo (Ctrl+Y)' }, text: '↻', on: { click: redo }}),
        el('button', { class: 'btn', attrs: { title: 'Center view' }, text: '🎯 中心へ', on: { click: () => { centerView(); }}}),
        el('button', { class: 'btn primary', text: '🔗 共有', on: { click: openShareModal }})
      ])
    ]);
  }

  function buildCanvas() {
    const wrap = el('div', { class: 'canvas-wrap' });

    svgEl = svg('svg', { id: 'universe-svg', preserveAspectRatio: 'xMidYMid meet' });

    // gradient defs for wormhole and node glows
    defsEl = svg('defs');
    const grad = svg('linearGradient', { id: 'worm-gradient', gradientUnits: 'userSpaceOnUse', x1: '0', y1: '0', x2: '1', y2: '0' });
    grad.appendChild(svg('stop', { offset: '0%', 'stop-color': '#7c5cff' }));
    grad.appendChild(svg('stop', { offset: '50%', 'stop-color': '#00e6ff' }));
    grad.appendChild(svg('stop', { offset: '100%', 'stop-color': '#ff4fa3' }));
    defsEl.appendChild(grad);
    svgEl.appendChild(defsEl);

    gView = svg('g', { 'data-role': 'viewport' });
    edgesLayer = svg('g', { 'data-role': 'edges' });
    nodesLayer = svg('g', { 'data-role': 'nodes' });
    gView.appendChild(edgesLayer);
    gView.appendChild(nodesLayer);
    svgEl.appendChild(gView);

    wrap.appendChild(svgEl);

    wrap.appendChild(el('div', { class: 'fab-zoom' }, [
      el('button', { attrs: { 'aria-label': 'Zoom in' }, text: '+', on: { click: () => zoomBy(1.2) }}),
      el('button', { attrs: { 'aria-label': 'Zoom out' }, text: '−', on: { click: () => zoomBy(1 / 1.2) }}),
      el('button', { attrs: { 'aria-label': 'Reset' }, text: '⊙', on: { click: () => { centerView(); }}}),
    ]));

    const coordBadge = el('div', { class: 'coord-badge', attrs: { id: 'coord-badge' }, text: '0, 0 · 100%' });
    wrap.appendChild(coordBadge);

    bindCanvasEvents();
    return wrap;
  }

  /* ======= core utilities ======= */
  function findNode(id) { return state.nodes.find(n => n.id === id); }
  function findEdge(id) { return state.edges.find(e => e.id === id); }

  function updateView() {
    gView.setAttribute('transform', `translate(${view.x}, ${view.y}) scale(${view.scale})`);
    const cb = document.getElementById('coord-badge');
    if (cb) cb.textContent = `${Math.round(-view.x / view.scale)}, ${Math.round(-view.y / view.scale)} · ${Math.round(view.scale * 100)}%`;
  }

  function svgClientToWorld(cx, cy) {
    const rect = svgEl.getBoundingClientRect();
    return {
      x: (cx - rect.left - view.x) / view.scale,
      y: (cy - rect.top - view.y) / view.scale
    };
  }

  function centerView(animate = false) {
    const rect = svgEl.getBoundingClientRect();
    if (state.nodes.length === 0) {
      view.x = rect.width / 2;
      view.y = rect.height / 2;
      view.scale = 1;
    } else {
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      state.nodes.forEach(n => {
        minX = Math.min(minX, n.x - n.size); minY = Math.min(minY, n.y - n.size);
        maxX = Math.max(maxX, n.x + n.size); maxY = Math.max(maxY, n.y + n.size);
      });
      const w = maxX - minX, h = maxY - minY;
      const pad = 80;
      const scale = Math.min(2, Math.max(0.2, Math.min(rect.width / (w + pad*2), rect.height / (h + pad*2))));
      view.scale = scale;
      view.x = rect.width / 2 - ((minX + maxX) / 2) * scale;
      view.y = rect.height / 2 - ((minY + maxY) / 2) * scale;
    }
    updateView();
  }

  function zoomBy(f, cx, cy) {
    const rect = svgEl.getBoundingClientRect();
    cx = cx ?? rect.width / 2;
    cy = cy ?? rect.height / 2;
    const nextScale = Math.max(0.15, Math.min(4, view.scale * f));
    const ratio = nextScale / view.scale;
    view.x = cx - (cx - view.x) * ratio;
    view.y = cy - (cy - view.y) * ratio;
    view.scale = nextScale;
    updateView();
  }

  /* ======= drawing ======= */
  function redrawAll() {
    // Selected guard
    if (selectedNodeId && !findNode(selectedNodeId)) selectedNodeId = null;

    while (edgesLayer.firstChild) edgesLayer.removeChild(edgesLayer.firstChild);
    while (nodesLayer.firstChild) nodesLayer.removeChild(nodesLayer.firstChild);

    state.edges.forEach(e => {
      const a = findNode(e.from), b = findNode(e.to);
      if (!a || !b) return;
      const path = svg('path', {
        class: 'edge-line' + (e.type === 'wormhole' ? ' wormhole' : ''),
        d: edgePath(a, b),
        'data-id': e.id
      });
      edgesLayer.appendChild(path);
    });

    state.nodes.forEach(n => nodesLayer.appendChild(buildNodeEl(n)));
    updateView();
  }

  function edgePath(a, b) {
    const dx = b.x - a.x, dy = b.y - a.y;
    const mx = (a.x + b.x) / 2 + dy * 0.1;
    const my = (a.y + b.y) / 2 - dx * 0.1;
    return `M ${a.x} ${a.y} Q ${mx} ${my} ${b.x} ${b.y}`;
  }

  function buildNodeEl(n) {
    const g = svg('g', { class: 'node-group' + (selectedNodeId === n.id ? ' selected' : ''), 'data-id': n.id, transform: `translate(${n.x},${n.y})` });
    const shape = nodeShape(n);
    g.appendChild(shape);
    // text (wrap up to ~3 lines)
    const lines = wrapText(n.text || '', Math.max(8, Math.floor(n.size / 6)));
    const text = svg('text', { class: 'node-text' });
    const lineHeight = Math.max(12, n.size * 0.22);
    const startY = -((lines.length - 1) * lineHeight) / 2;
    lines.forEach((line, i) => {
      const ts = svg('tspan', { x: 0, y: startY + i * lineHeight });
      ts.textContent = line; // textContent = safe
      ts.setAttribute('font-size', String(Math.max(11, n.size * 0.22)));
      text.appendChild(ts);
    });
    g.appendChild(text);
    return g;
  }

  function nodeShape(n) {
    const color = isValidHexColor(n.color) ? n.color : '#7c5cff';
    const size = n.size || 60;
    if (n.shape === 'planet') {
      const r = size;
      const grp = svg('g', { class: '' });
      const ring = svg('ellipse', { cx: 0, cy: 0, rx: r * 1.55, ry: r * 0.45, fill: 'none', stroke: color, 'stroke-width': '2' });
      ring.setAttribute('opacity', '0.5');
      const c = svg('circle', { class: 'node-shape', cx: 0, cy: 0, r: String(r), fill: color, stroke: '#fff', 'stroke-width': '1.5' });
      c.setAttribute('opacity', '0.9');
      grp.appendChild(ring); grp.appendChild(c);
      return grp;
    }
    if (n.shape === 'nebula') {
      const grp = svg('g');
      const blobs = 4;
      for (let i = 0; i < blobs; i++) {
        const r = size * (0.7 + Math.random() * 0.5);
        const ang = (i / blobs) * Math.PI * 2;
        const off = size * 0.3;
        const c = svg('circle', { cx: Math.cos(ang) * off, cy: Math.sin(ang) * off, r: String(r), fill: color });
        c.setAttribute('opacity', '0.35');
        grp.appendChild(c);
      }
      const core = svg('circle', { class: 'node-shape', cx: 0, cy: 0, r: String(size * 0.65), fill: color, stroke: '#fff', 'stroke-width': '1.5' });
      core.setAttribute('opacity', '0.85');
      grp.appendChild(core);
      return grp;
    }
    if (n.shape === 'note') {
      const w = size * 1.6, h = size * 1.2;
      return svg('rect', { class: 'node-shape', x: String(-w / 2), y: String(-h / 2), width: String(w), height: String(h), rx: '12', ry: '12', fill: color, stroke: '#fff', 'stroke-width': '1.5' });
    }
    // default: star (5-point)
    const r1 = size, r2 = size * 0.45;
    const pts = [];
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? r1 : r2;
      const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
      pts.push(`${(Math.cos(a) * r).toFixed(2)},${(Math.sin(a) * r).toFixed(2)}`);
    }
    return svg('polygon', { class: 'node-shape', points: pts.join(' '), fill: color, stroke: '#fff', 'stroke-width': '1.5' });
  }

  function wrapText(text, maxLine) {
    const t = sanitizeText(text, MAX_TEXT).trim();
    if (!t) return ['+'];
    const words = t.split(/\s+/);
    const lines = [];
    let cur = '';
    // Japanese-friendly: also break by char if any token too long
    const chunks = [];
    for (const w of words) {
      if (w.length > maxLine) {
        for (let i = 0; i < w.length; i += maxLine) chunks.push(w.slice(i, i + maxLine));
      } else chunks.push(w);
    }
    for (const c of chunks) {
      if ((cur + ' ' + c).trim().length <= maxLine) {
        cur = (cur ? cur + ' ' : '') + c;
      } else {
        if (cur) lines.push(cur);
        cur = c;
        if (lines.length >= 2) break;
      }
    }
    if (cur && lines.length < 3) lines.push(cur);
    if (lines.length >= 3 && t.length > lines.join(' ').length) {
      lines[2] = lines[2].slice(0, Math.max(1, maxLine - 1)) + '…';
    }
    return lines;
  }

  /* ======= interactions ======= */
  function bindCanvasEvents() {
    // Pointer down on canvas / nodes
    svgEl.addEventListener('pointerdown', onPointerDown);
    svgEl.addEventListener('pointermove', onPointerMove);
    svgEl.addEventListener('pointerup', onPointerUp);
    svgEl.addEventListener('pointercancel', onPointerUp);

    svgEl.addEventListener('dblclick', (e) => {
      const target = e.target.closest('.node-group');
      if (target) {
        selectNode(target.getAttribute('data-id'));
        editSelected();
        return;
      }
      const w = svgClientToWorld(e.clientX, e.clientY);
      addNodeAt(w.x, w.y, 'star');
    });

    svgEl.addEventListener('wheel', (e) => {
      e.preventDefault();
      const f = e.deltaY < 0 ? 1.1 : 1 / 1.1;
      const rect = svgEl.getBoundingClientRect();
      zoomBy(f, e.clientX - rect.left, e.clientY - rect.top);
    }, { passive: false });

    // Pinch zoom (touch)
    let pinch = null;
    svgEl.addEventListener('touchstart', (e) => {
      if (e.touches.length === 2) {
        pinch = pinchInfo(e.touches);
      }
    }, { passive: true });
    svgEl.addEventListener('touchmove', (e) => {
      if (e.touches.length === 2 && pinch) {
        const next = pinchInfo(e.touches);
        const f = next.dist / pinch.dist;
        const rect = svgEl.getBoundingClientRect();
        zoomBy(f, next.cx - rect.left, next.cy - rect.top);
        pinch = next;
        e.preventDefault();
      }
    }, { passive: false });
    svgEl.addEventListener('touchend', () => { pinch = null; });

    // Click on node — handled in pointerup if no drag
  }

  function pinchInfo(touches) {
    const a = touches[0], b = touches[1];
    const dx = a.clientX - b.clientX, dy = a.clientY - b.clientY;
    return { dist: Math.hypot(dx, dy), cx: (a.clientX + b.clientX) / 2, cy: (a.clientY + b.clientY) / 2 };
  }

  function onPointerDown(e) {
    if (editorPopover) closeEditor();
    const target = e.target.closest('.node-group');
    didDrag = false;
    suppressClickAfterDrag = false;
    if (target) {
      const id = target.getAttribute('data-id');
      const n = findNode(id);
      if (!n) return;
      const w = svgClientToWorld(e.clientX, e.clientY);
      dragInfo = { mode: 'node', id, sx: e.clientX, sy: e.clientY, ox: n.x, oy: n.y, wsx: w.x, wsy: w.y };
      svgEl.setPointerCapture(e.pointerId);
      selectNode(id);
    } else {
      dragInfo = { mode: 'pan', sx: e.clientX, sy: e.clientY, ox: view.x, oy: view.y };
      svgEl.classList.add('grabbing');
      svgEl.setPointerCapture(e.pointerId);
      // tap on empty -> deselect
      if (selectedNodeId) selectNode(null);
    }
  }

  function onPointerMove(e) {
    if (!dragInfo) return;
    const dx = e.clientX - dragInfo.sx;
    const dy = e.clientY - dragInfo.sy;
    if (Math.hypot(dx, dy) > 4) didDrag = true;
    if (dragInfo.mode === 'node') {
      const n = findNode(dragInfo.id);
      if (!n) return;
      n.x = dragInfo.ox + dx / view.scale;
      n.y = dragInfo.oy + dy / view.scale;
      // update only this node + its edges
      const g = nodesLayer.querySelector(`[data-id="${cssEscape(n.id)}"]`);
      if (g) g.setAttribute('transform', `translate(${n.x},${n.y})`);
      updateEdgesFor(n.id);
    } else if (dragInfo.mode === 'pan') {
      view.x = dragInfo.ox + dx;
      view.y = dragInfo.oy + dy;
      updateView();
    }
  }

  function onPointerUp(e) {
    if (!dragInfo) { svgEl.classList.remove('grabbing'); return; }
    const wasDrag = didDrag;
    if (dragInfo.mode === 'node') {
      if (wasDrag) {
        pushHistory(); autosave();
      } else {
        // tap = select / connect
        if (connectingFromId && connectingFromId !== dragInfo.id) {
          completeConnection(dragInfo.id);
        }
      }
    } else if (dragInfo.mode === 'pan') {
      svgEl.classList.remove('grabbing');
    }
    suppressClickAfterDrag = wasDrag;
    dragInfo = null;
  }

  function updateEdgesFor(nodeId) {
    state.edges.forEach(e => {
      if (e.from !== nodeId && e.to !== nodeId) return;
      const a = findNode(e.from), b = findNode(e.to);
      if (!a || !b) return;
      const path = edgesLayer.querySelector(`[data-id="${cssEscape(e.id)}"]`);
      if (path) path.setAttribute('d', edgePath(a, b));
    });
  }

  // CSS.escape polyfill-ish
  function cssEscape(s) {
    return (window.CSS && CSS.escape) ? CSS.escape(s) : String(s).replace(/[^a-zA-Z0-9_\-]/g, '\\$&');
  }

  function selectNode(id) {
    selectedNodeId = id;
    nodesLayer.querySelectorAll('.node-group').forEach(g => {
      g.classList.toggle('selected', g.getAttribute('data-id') === id);
    });
  }

  function startConnecting(type) {
    if (!selectedNodeId) {
      toast('まずノードを選択してください', 'warn');
      return;
    }
    connectingFromId = selectedNodeId;
    connectingType = type;
    svgEl.classList.add('connecting');
    toast(type === 'wormhole' ? '🕳️ もう一つのノードをタップして接続' : '🔗 もう一つのノードをタップして接続');
  }

  function cancelConnecting() {
    connectingFromId = null;
    svgEl.classList.remove('connecting');
  }

  function completeConnection(toId) {
    if (!connectingFromId || connectingFromId === toId) return cancelConnecting();
    const a = connectingFromId, b = toId;
    if (state.edges.some(e => (e.from === a && e.to === b) || (e.from === b && e.to === a))) {
      toast('既に接続されています', 'warn'); cancelConnecting(); return;
    }
    state.edges.push({ id: uid('e'), from: a, to: b, type: connectingType });
    cancelConnecting();
    pushHistory(); autosave(); redrawAll();
    toast(connectingType === 'wormhole' ? '🕳️ ワームホール開通!' : '🔗 接続しました', 'good');
    S.analytics && S.analytics.track('edge_create', { type: connectingType });
  }

  function addNodeAtCenter(shape) {
    const rect = svgEl.getBoundingClientRect();
    const w = svgClientToWorld(rect.left + rect.width / 2 + (Math.random() - .5) * 80, rect.top + rect.height / 2 + (Math.random() - .5) * 80);
    addNodeAt(w.x, w.y, shape);
  }

  function addNodeAt(x, y, shape) {
    if (state.nodes.length >= MAX_NODES) {
      toast('1宇宙あたり最大' + MAX_NODES + 'ノードまでです', 'warn');
      return;
    }
    const n = {
      id: uid('n'), x, y, text: '',
      color: state.color || '#7c5cff',
      shape: SHAPES.some(s => s.id === shape) ? shape : 'star',
      size: shape === 'note' ? 50 : 55
    };
    state.nodes.push(n);
    pushHistory(); autosave();
    redrawAll();
    selectNode(n.id);
    S.analytics && S.analytics.track('node_create', { shape: n.shape });
    // Auto-open editor for fresh node
    setTimeout(() => editSelected(), 50);
  }

  function deleteSelected() {
    if (!selectedNodeId) { toast('ノードが選択されていません', 'warn'); return; }
    const id = selectedNodeId;
    state.nodes = state.nodes.filter(n => n.id !== id);
    state.edges = state.edges.filter(e => e.from !== id && e.to !== id);
    selectedNodeId = null;
    pushHistory(); autosave(); redrawAll();
    toast('削除しました');
  }

  function editSelected() {
    if (!selectedNodeId) { toast('ノードが選択されていません', 'warn'); return; }
    const n = findNode(selectedNodeId);
    if (!n) return;
    closeEditor();

    const ta = el('textarea', { attrs: { maxlength: String(MAX_TEXT), placeholder: 'あなたの思考を書く...' } });
    ta.value = n.text || '';

    const colorRow = el('div', { class: 'color-row' });
    PALETTE.forEach(c => {
      const sw = el('button', { class: 'color-swatch' + (n.color === c ? ' active' : '') });
      sw.style.background = c;
      sw.addEventListener('click', () => {
        n.color = c;
        [...colorRow.children].forEach(x => x.classList.remove('active'));
        sw.classList.add('active');
      });
      colorRow.appendChild(sw);
    });

    const shapeRow = el('div', { class: 'tool-row', attrs: { style: 'grid-template-columns:repeat(4,1fr); width:100%;' } });
    SHAPES.forEach(s => {
      const b = el('button', { class: 'tool', attrs: { style: n.shape === s.id ? 'border-color: var(--accent); background: rgba(124,92,255,.18);' : '' } }, [
        el('div', { class: 'emoji', text: s.emoji }),
        el('div', { text: s.label })
      ]);
      b.addEventListener('click', () => {
        n.shape = s.id;
        [...shapeRow.children].forEach(c => c.setAttribute('style', ''));
        b.setAttribute('style', 'border-color: var(--accent); background: rgba(124,92,255,.18);');
      });
      shapeRow.appendChild(b);
    });

    const sizeInput = el('input', { attrs: { type: 'range', min: '30', max: '120', value: String(n.size || 60), 'aria-label': 'Size' } });
    sizeInput.addEventListener('input', () => { n.size = Number(sizeInput.value); });

    const apply = () => {
      n.text = sanitizeText(ta.value, MAX_TEXT);
      pushHistory(); autosave(); redrawAll();
      closeEditor();
    };

    const popover = el('div', { class: 'node-editor' }, [
      ta,
      el('div', { class: 'editor-row' }, [el('span', { class: 'lbl-mini', text: 'Color' }), colorRow]),
      el('div', { class: 'editor-row' }, [el('span', { class: 'lbl-mini', text: 'Shape' }), shapeRow]),
      el('div', { class: 'editor-row' }, [el('span', { class: 'lbl-mini', text: 'Size' }), sizeInput]),
      el('div', { class: 'actions' }, [
        el('button', { class: 'btn', text: 'キャンセル', on: { click: closeEditor }}),
        el('button', { class: 'btn', text: '🗑 削除', on: { click: () => { closeEditor(); deleteSelected(); }}}),
        el('button', { class: 'btn primary', text: '保存', on: { click: apply }})
      ])
    ]);

    // position near node in screen coords
    const sx = n.x * view.scale + view.x;
    const sy = n.y * view.scale + view.y;
    const rect = svgEl.getBoundingClientRect();
    const baseX = Math.min(rect.width - 340, Math.max(10, sx + (n.size||60) * view.scale + 10));
    const baseY = Math.min(rect.height - 280, Math.max(10, sy - 40));
    popover.style.left = baseX + 'px';
    popover.style.top = baseY + 'px';

    document.querySelector('.canvas-wrap').appendChild(popover);
    editorPopover = popover;

    setTimeout(() => ta.focus(), 30);

    ta.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); apply(); }
      if (e.key === 'Escape') { e.preventDefault(); closeEditor(); }
    });
  }

  function closeEditor() {
    if (editorPopover) { editorPopover.remove(); editorPopover = null; }
  }

  /* ======= share modal ======= */
  function openShareModal() {
    const url = S.share.buildShareUrl(state);
    const input = el('input', { attrs: { type: 'text', readonly: '' } });
    input.value = url;

    const copy = () => {
      input.select();
      try {
        navigator.clipboard.writeText(url).then(() => toast('リンクをコピーしました!', 'good'));
      } catch {
        document.execCommand && document.execCommand('copy');
        toast('リンクをコピーしました!', 'good');
      }
      S.analytics && S.analytics.track('share_copy', { len: url.length });
    };

    const tweet = () => {
      const text = `🌌 私の思考の宇宙「${state.name}」をThoughtSpaceで作ってみた。\n#ThoughtSpace #思考の宇宙\n${url}`;
      window.open('https://twitter.com/intent/tweet?text=' + encodeURIComponent(text), '_blank', 'noopener');
      S.analytics && S.analytics.track('share_twitter');
    };

    const exportJson = () => {
      const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = (state.name || 'universe').replace(/[^\w\-]+/g, '_') + '.json';
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      toast('JSONを書き出しました', 'good');
    };

    const modalRoot = el('div', { class: 'modal-backdrop', on: { click: (e) => { if (e.target === modalRoot) closeModal(); }}}, [
      el('div', { class: 'modal' }, [
        el('button', { class: 'icon-btn close-btn', text: '×', on: { click: closeModal }}),
        el('h3', { text: '🌌 あなたの宇宙を共有' }),
        el('p', { text: 'バックエンドゼロ。あなたの宇宙はURL自体に圧縮されます。SNSやLINEに貼るだけで、誰でもそのまま見られます。' }),
        el('div', { class: 'modal-row' }, [input, el('button', { class: 'btn primary', text: 'コピー', on: { click: copy }})]),
        el('div', { class: 'modal-row' }, [
          el('button', { class: 'btn', text: '𝕏 でポスト', on: { click: tweet }}),
          el('button', { class: 'btn', text: '📥 JSON書き出し', on: { click: exportJson }})
        ]),
        el('p', {
          attrs: { style: 'font-size:12px;color:var(--fg-2); margin-top:14px' },
          text: 'Tip: ノードや接続が多い宇宙ほどURLは長くなります。500ノードまで対応。'
        })
      ])
    ]);
    document.getElementById('modal-mount').appendChild(modalRoot);
  }

  function closeModal() {
    const root = document.getElementById('modal-mount');
    while (root.firstChild) root.removeChild(root.firstChild);
  }

  /* ======= demo ======= */
  function loadDemo() {
    const demo = {
      schema: 1,
      name: 'Welcome to your ThoughtSpace',
      author: 'ThoughtSpace',
      bio: '',
      color: '#7c5cff',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      nodes: [
        { id:'a', x:0, y:0, text:'ThoughtSpace へようこそ', color:'#7c5cff', shape:'star', size:75 },
        { id:'b', x:-220, y:-120, text:'ダブルクリックでノード追加', color:'#00e6ff', shape:'planet', size:55 },
        { id:'c', x:220, y:-120, text:'ドラッグで自由に配置', color:'#ff4fa3', shape:'nebula', size:60 },
        { id:'d', x:-220, y:120, text:'2つのノードをワームホールで接続できる', color:'#fbbf24', shape:'note', size:55 },
        { id:'e', x:220, y:120, text:'共有はURL1つだけ', color:'#4ade80', shape:'star', size:55 },
        { id:'f', x:0, y:240, text:'時系列じゃない思考SNS', color:'#a78bfa', shape:'planet', size:55 }
      ],
      edges: [
        { id:'e1', from:'a', to:'b', type:'normal' },
        { id:'e2', from:'a', to:'c', type:'normal' },
        { id:'e3', from:'a', to:'d', type:'wormhole' },
        { id:'e4', from:'a', to:'e', type:'normal' },
        { id:'e5', from:'c', to:'f', type:'wormhole' }
      ]
    };
    return demo;
  }

  /* ======= keyboard ======= */
  function bindKeys() {
    document.addEventListener('keydown', (e) => {
      // ignore when typing
      const tag = (e.target && e.target.tagName) || '';
      if (/INPUT|TEXTAREA/.test(tag)) return;
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedNodeId) {
        e.preventDefault(); deleteSelected();
      } else if ((e.key === 'z' || e.key === 'Z') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (e.shiftKey) redo(); else undo();
      } else if ((e.key === 'y' || e.key === 'Y') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault(); redo();
      } else if (e.key === 'Enter' && selectedNodeId) {
        e.preventDefault(); editSelected();
      } else if (e.key === 'Escape') {
        if (connectingFromId) cancelConnecting();
        else if (editorPopover) closeEditor();
        else if (selectedNodeId) selectNode(null);
      } else if (e.key === '+' || e.key === '=') { zoomBy(1.15); }
      else if (e.key === '-') { zoomBy(1/1.15); }
      else if (e.key === 'n' || e.key === 'N') { addNodeAtCenter('star'); }
    });
  }

  /* ======= public render ======= */
  function render(opts = {}) {
    state = S.storage.load();
    // demo mode: if `?demo=1` was in hash query
    if (opts.demo || (location.hash.includes('demo=1') && state.nodes.length === 0)) {
      state = loadDemo();
      S.storage.save(state);
    }
    history = []; historyIdx = -1; pushHistory();

    document.title = (state.name || 'Untitled') + ' — ThoughtSpace';

    const root = document.getElementById('page-app');
    root.innerHTML = '';
    const shell = el('div', { class: 'app-shell' });
    shell.appendChild(buildTopbar());
    shell.appendChild(buildSidebar());
    shell.appendChild(buildCanvas());
    root.appendChild(shell);

    redrawAll();
    setTimeout(centerView, 30);
    bindKeys();

    S.analytics && S.analytics.track('app_open', { nodes: state.nodes.length });
  }

  global.TS = global.TS || {};
  global.TS.editor = { render };
})(window);
