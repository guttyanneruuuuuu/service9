/* stars.js — animated starfield background, GPU-friendly
*/
(function () {
  'use strict';

  const canvas = document.getElementById('stars-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let stars = [];
  let dpr = Math.min(window.devicePixelRatio || 1, 2);
  let running = true;
  let prefersReduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = innerWidth * dpr;
    canvas.height = innerHeight * dpr;
    canvas.style.width = innerWidth + 'px';
    canvas.style.height = innerHeight + 'px';
    initStars();
  }

  function initStars() {
    const count = Math.floor((innerWidth * innerHeight) / (prefersReduce ? 18000 : 8000));
    stars = [];
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        z: Math.random() * 0.6 + 0.4,
        r: Math.random() * 1.4 + 0.2,
        twinkle: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.05 + 0.02
      });
    }
  }

  let last = 0;
  function frame(t) {
    if (!running) return;
    const dt = Math.min(50, t - last);
    last = t;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const s of stars) {
      s.twinkle += s.speed;
      const alpha = 0.5 + Math.sin(s.twinkle) * 0.4;
      ctx.fillStyle = `rgba(255,255,255,${(alpha * s.z).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r * s.z * dpr, 0, Math.PI * 2);
      ctx.fill();
      // slow drift
      if (!prefersReduce) {
        s.x += s.z * 0.05 * dpr;
        if (s.x > canvas.width) s.x = 0;
      }
    }
    requestAnimationFrame(frame);
  }

  document.addEventListener('visibilitychange', () => {
    running = !document.hidden;
    if (running) requestAnimationFrame(frame);
  });

  window.addEventListener('resize', resize);
  resize();
  requestAnimationFrame(frame);
})();
