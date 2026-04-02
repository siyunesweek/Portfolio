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

/* ── Fricción proporcional a la velocidad ── */
function applyFriction(b) {
  const spd = Math.hypot(b.vx, b.vy);
  const friction = spd > 8 ? 0.980 : spd > 4 ? 0.990 : 0.996;
  b.vx *= friction;
  b.vy *= friction;
  // velocidad mínima para que nunca se queden quietas
  if (spd < 0.10) {
    const a = Math.random() * Math.PI * 2;
    b.vx = Math.cos(a) * 0.10;
    b.vy = Math.sin(a) * 0.10;
  }
}

/* ── Loop principal de física ── */
function tick() {
  if (window.panelOpen) { requestAnimationFrame(tick); return; }

  const w = W(), h = H();

  for (const b of window.bubbles) {
    if (b.dragging) continue;
    b.x += b.vx; b.y += b.vy;

    // rebote en bordes
    if (b.x - b.r < 0)  { b.x = b.r;   b.vx =  Math.abs(b.vx); }
    if (b.x + b.r > w)  { b.x = w - b.r; b.vx = -Math.abs(b.vx); }
    if (b.y - b.r < 0)  { b.y = b.r;   b.vy =  Math.abs(b.vy); }
    if (b.y + b.r > h)  { b.y = h - b.r; b.vy = -Math.abs(b.vy); }

    applyFriction(b);
  }

  // colisiones entre pares
  for (let i = 0; i < window.bubbles.length; i++)
    for (let j = i + 1; j < window.bubbles.length; j++)
      resolveCollision(window.bubbles[i], window.bubbles[j]);

  // actualizar posición DOM
  for (const b of window.bubbles)
    b.el.style.transform = `translate(${b.x - b.r}px,${b.y - b.r}px)`;

  requestAnimationFrame(tick);
}
