/* ════════════════════════════════════
   physics.js — fondo, física, tick loop
════════════════════════════════════ */

const W = () => window.innerWidth;
const H = () => window.innerHeight;

/* ── Background estático de partículas ── */
function initBg() {
  const canvas = document.getElementById('bgCanvas');
  canvas.width = W(); canvas.height = H();
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const g = ctx.createRadialGradient(W() * .6, H() * .3, 0, W() * .6, H() * .3, W() * .8);
  g.addColorStop(0, 'rgba(60,40,120,0.18)');
  g.addColorStop(.5, 'rgba(30,10,60,0.08)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < 80; i++) {
    ctx.beginPath();
    ctx.arc(
      Math.random() * canvas.width,
      Math.random() * canvas.height,
      Math.random() * 1.5 + .5, 0, Math.PI * 2
    );
    ctx.fillStyle = `rgba(255,255,255,${Math.random() * .4 + .05})`;
    ctx.fill();
  }
}

/* ── Colisión círculo-círculo ── */
function resolveCollision(a, b) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const dist = Math.hypot(dx, dy);
  const min = a.r + b.r + 2;
  if (dist >= min || dist < .001) return;

  const nx = dx / dist, ny = dy / dist;
  const ov = (min - dist) * .5;
  if (!a.dragging) { a.x -= nx * ov; a.y -= ny * ov; }
  if (!b.dragging) { b.x += nx * ov; b.y += ny * ov; }

  const dot = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
  if (dot <= 0) return;
  const imp = dot * (1 + .78) / 2;
  if (!a.dragging) { a.vx -= imp * nx; a.vy -= imp * ny; }
  if (!b.dragging) { b.vx += imp * nx; b.vy += imp * ny; }
}

/* ── Loop principal de física (delta-time) ── */
let lastT = 0;

function tick(now) {
  if (!lastT) { lastT = now; requestAnimationFrame(tick); return; }

  if (window.panelOpen) { lastT = now; requestAnimationFrame(tick); return; }

  // dt normalizado: 1.0 = 16.67ms (60fps). Capeado para evitar saltos enormes.
  const dt = Math.min((now - lastT) / 16.667, 3);
  lastT = now;

  const w = W(), h = H();

  for (const b of window.bubbles) {
    if (b.dragging) continue;

    b.x += b.vx * dt;
    b.y += b.vy * dt;

    // rebote en bordes
    if (b.x - b.r < 0)  { b.x = b.r;     b.vx =  Math.abs(b.vx); }
    if (b.x + b.r > w)  { b.x = w - b.r;  b.vx = -Math.abs(b.vx); }
    if (b.y - b.r < 0)  { b.y = b.r;     b.vy =  Math.abs(b.vy); }
    if (b.y + b.r > h)  { b.y = h - b.r;  b.vy = -Math.abs(b.vy); }

    // fricción (escalada por dt para consistencia)
    const spd = Math.hypot(b.vx, b.vy);
    const friction = Math.pow(spd > 8 ? 0.985 : spd > 3 ? 0.992 : 0.997, dt);
    b.vx *= friction;
    b.vy *= friction;
  }

  // colisiones entre pares
  for (let i = 0; i < window.bubbles.length; i++)
    for (let j = i + 1; j < window.bubbles.length; j++)
      resolveCollision(window.bubbles[i], window.bubbles[j]);

  // dead-zone después de colisiones
  for (const b of window.bubbles) {
    if (b.dragging) continue;
    if (Math.abs(b.vx) < 0.05 && Math.abs(b.vy) < 0.05) {
      b.vx = 0;
      b.vy = 0;
    }
  }

  // actualizar posición DOM
  for (const b of window.bubbles)
    b.el.style.transform = `translate3d(${b.x - b.r}px,${b.y - b.r}px,0) scale(1.0001)`;

  requestAnimationFrame(tick);
}
