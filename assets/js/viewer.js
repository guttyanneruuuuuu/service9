/* viewer.js — Read-only universe viewer for shared links
*/
(function (global) {
  'use strict';
  const S = global.TS;
  const { el, svg, sanitizeText, isValidHexColor, toast } = S.sec;

  function render(token) {
    const root = document.getElementById('page-viewer');
    root.innerHTML = '';

    const data = S.share.decode(token);
    if (!data) {
      root.appendChild(buildError());
      return;
    }

    const wrap = el('div', { class: 'viewer-shell' });

    wrap.appendChild(el('header', { class: 'viewer-info' }, [
      el('a', { class: 'brand', attrs: { href: '#/' } }, [
        el('span', { class: 'brand-mark' }),
        el('strong', { text: 'ThoughtSpace', class: 'hide-mobile' })
      ]),
      el('div', { class: 'meta', attrs: { style: 'flex:1; text-align:center; padding: 0 12px;' } }, [
        el('strong', { text: data.name || 'Shared Universe' }),
        el('small', { text: (data.author ? '@' + sanitizeText(data.author, 24) + ' · ' : '') + (data.nodes.length + ' nodes · ' + data.edges.length + ' connections') })
      ]),
      el('div', { attrs: { style: 'display:flex; gap:6px;' } }, [
        el('a', { class: 'btn', text: '🌌 自分も作る', attrs: { href: '#/app' }}),
        el('button', { class: 'btn primary', text: '📋 リンクをコピー', on: {
          click: () => {
            const url = location.href;
            try { navigator.clipboard.writeText(url).then(() => toast('リンクをコピー!', 'good')); }
            catch { toast('コピーに失敗', 'bad'); }
          }
        }})
      ])
    ]));

    const canvasWrap = el('div', { class: 'canvas-wrap', attrs: { style: 'flex:1; position:relative;' } });
    const svgEl = svg('svg', { id: 'viewer-svg', preserveAspectRatio: 'xMidYMid meet' });
    canvasWrap.appendChild(svgEl);

    // gradient defs
    const defsEl = svg('defs');
    const grad = svg('linearGradient', { id: 'worm-gradient', gradientUnits: 'userSpaceOnUse', x1: '0', y1: '0', x2: '1', y2: '0' });
    grad.appendChild(svg('stop', { offset: '0%', 'stop-color': '#7c5cff' }));
    grad.appendChild(svg('stop', { offset: '50%', 'stop-color': '#00e6ff' }));
    grad.appendChild(svg('stop', { offset: '100%', 'stop-color': '#ff4fa3' }));
    defsEl.appendChild(grad);
    svgEl.appendChild(defsEl);

    const gView = svg('g');
    const edgesLayer = svg('g');
    const nodesLayer = svg('g');
    gView.appendChild(edgesLayer);
    gView.appendChild(nodesLayer);
    svgEl.appendChild(gView);

    let view = { x: 0, y: 0, scale: 1 };
    function updateTransform() { gView.setAttribute('transform', `translate(${view.x},${view.y}) scale(${view.scale})`); }

    // draw
    data.edges.forEach(e => {
      const a = data.nodes.find(n => n.id === e.from), b = data.nodes.find(n => n.id === e.to);
      if (!a || !b) return;
      const dx = b.x - a.x, dy = b.y - a.y;
      const mx = (a.x + b.x) / 2 + dy * 0.1, my = (a.y + b.y) / 2 - dx * 0.1;
      const path = svg('path', {
        class: 'edge-line' + (e.type === 'wormhole' ? ' wormhole' : ''),
        d: `M ${a.x} ${a.y} Q ${mx} ${my} ${b.x} ${b.y}`
      });
      edgesLayer.appendChild(path);
    });
    data.nodes.forEach(n => nodesLayer.appendChild(buildNodeEl(n)));

    function fit() {
      const rect = svgEl.getBoundingClientRect();
      if (data.nodes.length === 0) {
        view = { x: rect.width/2, y: rect.height/2, scale: 1 };
      } else {
        let minX=Infinity, minY=Infinity, maxX=-Infinity, maxY=-Infinity;
        data.nodes.forEach(n => {
          minX = Math.min(minX, n.x - n.size); minY = Math.min(minY, n.y - n.size);
          maxX = Math.max(maxX, n.x + n.size); maxY = Math.max(maxY, n.y + n.size);
        });
        const w = maxX-minX, h = maxY-minY, pad = 80;
        const scale = Math.min(2, Math.max(0.2, Math.min(rect.width/(w+pad*2), rect.height/(h+pad*2))));
        view = { scale, x: rect.width/2 - ((minX+maxX)/2)*scale, y: rect.height/2 - ((minY+maxY)/2)*scale };
      }
      updateTransform();
    }

    // pan + zoom
    let drag = null;
    svgEl.addEventListener('pointerdown', (e) => {
      drag = { sx: e.clientX, sy: e.clientY, ox: view.x, oy: view.y };
      svgEl.classList.add('grabbing');
      svgEl.setPointerCapture(e.pointerId);
    });
    svgEl.addEventListener('pointermove', (e) => {
      if (!drag) return;
      view.x = drag.ox + (e.clientX - drag.sx);
      view.y = drag.oy + (e.clientY - drag.sy);
      updateTransform();
    });
    svgEl.addEventListener('pointerup', () => { drag = null; svgEl.classList.remove('grabbing'); });
    svgEl.addEventListener('wheel', (e) => {
      e.preventDefault();
      const f = e.deltaY < 0 ? 1.1 : 1/1.1;
      const rect = svgEl.getBoundingClientRect();
      const cx = e.clientX - rect.left, cy = e.clientY - rect.top;
      const next = Math.max(0.15, Math.min(4, view.scale * f));
      const ratio = next / view.scale;
      view.x = cx - (cx - view.x) * ratio;
      view.y = cy - (cy - view.y) * ratio;
      view.scale = next;
      updateTransform();
    }, { passive: false });

    canvasWrap.appendChild(el('div', { class: 'fab-zoom' }, [
      el('button', { text: '+', on: { click: () => zoom(1.2) }}),
      el('button', { text: '−', on: { click: () => zoom(1/1.2) }}),
      el('button', { text: '⊙', on: { click: fit }})
    ]));

    function zoom(f) {
      const rect = svgEl.getBoundingClientRect();
      const cx = rect.width/2, cy = rect.height/2;
      const next = Math.max(0.15, Math.min(4, view.scale * f));
      const ratio = next / view.scale;
      view.x = cx - (cx - view.x) * ratio;
      view.y = cy - (cy - view.y) * ratio;
      view.scale = next;
      updateTransform();
    }

    wrap.appendChild(canvasWrap);
    root.appendChild(wrap);

    requestAnimationFrame(fit);
    window.addEventListener('resize', fit);

    document.title = (data.name || 'Shared Universe') + ' — ThoughtSpace';
    S.analytics && S.analytics.track('viewer_open', { nodes: data.nodes.length });
  }

  function buildNodeEl(n) {
    const g = svg('g', { class: 'node-group', transform: `translate(${n.x},${n.y})` });
    g.appendChild(nodeShape(n));
    const lines = wrapText(n.text || '', Math.max(8, Math.floor(n.size / 6)));
    const text = svg('text', { class: 'node-text' });
    const lh = Math.max(12, n.size * 0.22);
    const startY = -((lines.length-1)*lh)/2;
    lines.forEach((ln, i) => {
      const ts = svg('tspan', { x: 0, y: startY + i*lh });
      ts.textContent = ln;
      ts.setAttribute('font-size', String(Math.max(11, n.size*0.22)));
      text.appendChild(ts);
    });
    g.appendChild(text);
    return g;
  }

  function nodeShape(n) {
    const color = isValidHexColor(n.color) ? n.color : '#7c5cff';
    const size = n.size || 60;
    if (n.shape === 'planet') {
      const grp = svg('g');
      const ring = svg('ellipse', { cx:0, cy:0, rx: size*1.55, ry: size*0.45, fill:'none', stroke:color, 'stroke-width':'2' });
      ring.setAttribute('opacity','0.5');
      const c = svg('circle', { class:'node-shape', cx:0, cy:0, r:String(size), fill:color, stroke:'#fff', 'stroke-width':'1.5' });
      c.setAttribute('opacity','0.9');
      grp.appendChild(ring); grp.appendChild(c);
      return grp;
    }
    if (n.shape === 'nebula') {
      const grp = svg('g');
      for (let i=0; i<4; i++) {
        const r = size*(0.7+Math.random()*0.5), ang=(i/4)*Math.PI*2, off=size*0.3;
        const c = svg('circle', { cx:Math.cos(ang)*off, cy:Math.sin(ang)*off, r:String(r), fill:color });
        c.setAttribute('opacity','0.35');
        grp.appendChild(c);
      }
      const core = svg('circle', { class:'node-shape', cx:0, cy:0, r:String(size*0.65), fill:color, stroke:'#fff', 'stroke-width':'1.5' });
      core.setAttribute('opacity','0.85');
      grp.appendChild(core);
      return grp;
    }
    if (n.shape === 'note') {
      const w=size*1.6, h=size*1.2;
      return svg('rect', { class:'node-shape', x:String(-w/2), y:String(-h/2), width:String(w), height:String(h), rx:'12', ry:'12', fill:color, stroke:'#fff', 'stroke-width':'1.5' });
    }
    const r1=size, r2=size*0.45, pts=[];
    for (let i=0;i<10;i++) {
      const r = i%2===0 ? r1 : r2;
      const a = (i/10)*Math.PI*2 - Math.PI/2;
      pts.push(`${(Math.cos(a)*r).toFixed(2)},${(Math.sin(a)*r).toFixed(2)}`);
    }
    return svg('polygon', { class:'node-shape', points:pts.join(' '), fill:color, stroke:'#fff', 'stroke-width':'1.5' });
  }

  function wrapText(text, maxLine) {
    const t = sanitizeText(text, 280).trim();
    if (!t) return [''];
    const words = t.split(/\s+/), chunks=[];
    for (const w of words) {
      if (w.length > maxLine) for (let i=0;i<w.length;i+=maxLine) chunks.push(w.slice(i,i+maxLine));
      else chunks.push(w);
    }
    const lines=[]; let cur='';
    for (const c of chunks) {
      if ((cur+' '+c).trim().length <= maxLine) cur = (cur?cur+' ':'') + c;
      else { if (cur) lines.push(cur); cur = c; if (lines.length >= 2) break; }
    }
    if (cur && lines.length < 3) lines.push(cur);
    if (lines.length >= 3 && t.length > lines.join(' ').length) lines[2] = lines[2].slice(0, Math.max(1, maxLine-1)) + '…';
    return lines;
  }

  function buildError() {
    return el('section', { class: 'section', attrs: { style: 'min-height:100vh; display:flex; align-items:center; justify-content:center;' } }, [
      el('div', { class: 'container', attrs: { style: 'text-align:center; max-width:480px;' } }, [
        el('h2', { text: '🌑 宇宙が見つかりませんでした' }),
        el('p', { class: 'lead', text: 'リンクが破損しているか、正しい形式ではない可能性があります。' }),
        el('a', { class: 'cta-big', attrs: { href: '#/' }, text: 'ホームに戻る' })
      ])
    ]);
  }

  global.TS = global.TS || {};
  global.TS.viewer = { render };
})(window);
