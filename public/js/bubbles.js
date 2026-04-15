/* ════════════════════════════════════
   bubbles.js — burbujas, drag, throw, init
════════════════════════════════════ */

window.bubbles = [];

const VEL_MS = 60; // ventana de muestreo en ms para el throw

const POSITIONS = [
  [0.25, 0.42],
  [0.55, 0.38],
  [0.72, 0.65],
  [0.38, 0.68],
  [0.18, 0.70],
];

/* ── Escala el radio de las burbujas según el ancho de pantalla ── */
function getRadiusScale() {
  const w = W();
  if (w <= 360)  return 0.50;  // móvil pequeño  (≤360px)
  if (w <= 480)  return 0.58;  // móvil normal   (≤480px)
  if (w <= 768)  return 0.70;  // tablet pequeña (≤768px)
  if (w <= 1024) return 0.85;  // tablet grande  (≤1024px)
  return 1.0;                  // escritorio     (>1024px)
}

function makeBubble(sectionData, i) {
  const r = Math.round(sectionData.radius * getRadiusScale());
  const [px, py] = POSITIONS[i] || [Math.random(), Math.random()];

  const b = {
    // datos de la sección (de bubbles.json)
    ...sectionData,
    // física
    x: Math.max(r + 10, Math.min(W() - r - 10, px * W())),
    y: Math.max(r + 10, Math.min(H() - r - 10, py * H())),
    vx: (Math.random() - 0.5) * 1.2,
    vy: (Math.random() - 0.5) * 1.2,
    r,
    el: null,
    dragging: false,
    hist: [],
  };

  /* ── DOM ── */
  const el = document.createElement('div');
  el.className = 'bubble-el';
  el.style.width = el.style.height = (r * 2) + 'px';
  el.style.background = `radial-gradient(circle at 38% 35%, ${sectionData.color}55 0%, ${sectionData.color}22 55%, ${sectionData.color}08 100%)`;
  el.style.boxShadow = `0 0 0 2px ${sectionData.color}40, 0 0 40px ${sectionData.glow}, inset 0 0 30px ${sectionData.color}15`;
  el.style.cursor = 'grab';

  const emoji = document.createElement('div');
  emoji.className = 'bubble-emoji';
  emoji.textContent = sectionData.emoji;
  emoji.style.fontSize = Math.max(18, r * 0.32) + 'px';

  const label = document.createElement('div');
  label.className = 'bubble-label';
  label.textContent = sectionData.label;
  label.style.fontSize = Math.max(11, r * 0.19) + 'px';

  el.appendChild(emoji);
  el.appendChild(label);
  document.getElementById('scene').appendChild(el);
  b.el = el;

  /* ── Drag + Throw ── */
  let startX, startY, moved;

  el.addEventListener('pointerdown', e => {
    if (window.panelOpen) return;
    e.preventDefault();
    el.setPointerCapture(e.pointerId);
    b.dragging = true; moved = false;
    b.vx = 0; b.vy = 0;
    startX = e.clientX; startY = e.clientY;
    b.hist = [{ x: e.clientX, y: e.clientY, t: performance.now() }];
    b._prevDragX = e.clientX;
    b._prevDragY = e.clientY;
    el.style.cursor = 'grabbing';
    el.style.boxShadow = `0 0 0 3px ${sectionData.color}90, 0 0 70px ${sectionData.glow}, inset 0 0 40px ${sectionData.color}25`;
    el.style.filter = 'brightness(1.18)';
  });

  el.addEventListener('pointermove', e => {
    if (!b.dragging) return;
    e.preventDefault();
    const now = performance.now();
    b.hist.push({ x: e.clientX, y: e.clientY, t: now });
    while (b.hist.length > 1 && now - b.hist[0].t > VEL_MS) b.hist.shift();
    if (Math.hypot(e.clientX - startX, e.clientY - startY) > 6) moved = true;

    const prevX = b._prevDragX ?? b.x;
    const prevY = b._prevDragY ?? b.y;
    b.x = Math.max(b.r, Math.min(W() - b.r, e.clientX));
    b.y = Math.max(b.r, Math.min(H() - b.r, e.clientY));
    b.el.style.transform = `translate3d(${b.x - b.r}px,${b.y - b.r}px,0) scale(1.0001)`;

    // Velocidad instantánea del arrastre
    const dragVx = b.x - prevX;
    const dragVy = b.y - prevY;
    b._prevDragX = b.x;
    b._prevDragY = b.y;

    // Colisión de empuje con el resto de burbujas
    for (const other of window.bubbles) {
      if (other === b || other.dragging) continue;
      const dx = other.x - b.x;
      const dy = other.y - b.y;
      const dist = Math.hypot(dx, dy);
      const minDist = b.r + other.r + 2;
      if (dist < minDist && dist > 0.01) {
        // Separar superposición
        const nx = dx / dist, ny = dy / dist;
        const overlap = minDist - dist;
        other.x += nx * overlap;
        other.y += ny * overlap;
        // Transferir velocidad proporcional al impacto
        const impact = (dragVx * nx + dragVy * ny);
        if (impact > 0) {
          other.vx += nx * impact * 1.4;
          other.vy += ny * impact * 1.4;
        }
      }
    }
  });

  el.addEventListener('pointerup', () => {
    if (!b.dragging) return;
    b.dragging = false;
    el.style.cursor = 'grab';
    el.style.boxShadow = `0 0 0 2px ${sectionData.color}40, 0 0 40px ${sectionData.glow}, inset 0 0 30px ${sectionData.color}15`;
    el.style.filter = '';

    if (!moved) { openPanel(b); return; }

    // calcular velocidad de lanzamiento
    const now = performance.now();
    const recent = b.hist.filter(p => now - p.t < VEL_MS);
    if (recent.length >= 2) {
      const o = recent[0], n = recent[recent.length - 1];
      const dt = Math.max(n.t - o.t, 1);
      b.vx = (n.x - o.x) / dt * 16.67 * 1.15;
      b.vy = (n.y - o.y) / dt * 16.67 * 1.15;
    } else {
      b.vx = 0; b.vy = 0;
    }

    const spd = Math.hypot(b.vx, b.vy);
    if (spd > 28) { b.vx = b.vx / spd * 28; b.vy = b.vy / spd * 28; }
    b.hist = [];
  });

  el.addEventListener('pointercancel', () => {
    b.dragging = false;
    el.style.cursor = 'grab';
    el.style.boxShadow = `0 0 0 2px ${sectionData.color}40, 0 0 40px ${sectionData.glow}, inset 0 0 30px ${sectionData.color}15`;
    el.style.filter = '';
    b.hist = [];
  });

  return b;
}

/* ── Init ── */
function initBubbles() {
  window.bubbles = [];
  document.getElementById('scene').innerHTML = '';
  // BUBBLES_DATA viene inyectado por index.njk desde bubbles.json
  window.BUBBLES_DATA.forEach((s, i) => window.bubbles.push(makeBubble(s, i)));
}

initBg();
initWaveCanvas();
initBubbles();
requestAnimationFrame(tick);

window.addEventListener('resize', () => {
  initBg();
  window.bubbles.forEach(b => {
    b.x = Math.max(b.r + 10, Math.min(W() - b.r - 10, b.x));
    b.y = Math.max(b.r + 10, Math.min(H() - b.r - 10, b.y));
  });
});

// Listener para el fondo (clicks en espacio vacío)
document.getElementById('bgCanvas').addEventListener('pointerdown', (e) => {
  if (window.panelOpen) return;
  if (window.createDrop) window.createDrop(e.clientX, e.clientY);
  requestDeviceMotionPermission();
});
document.getElementById('scene').addEventListener('pointerdown', (e) => {
  if (window.panelOpen) return;
  if (e.target.id === 'scene') {
    if (window.createDrop) window.createDrop(e.clientX, e.clientY);
  }
  requestDeviceMotionPermission();
});

/* ── Shake / DeviceMotion ── */
let lastShakeTime = 0;
let lastAcc = { x: null, y: null, z: null };
const SHAKE_THRESHOLD = 15;
let motionPermissionGranted = false;

function requestDeviceMotionPermission() {
  if (motionPermissionGranted) return;
  if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
    DeviceMotionEvent.requestPermission()
      .then(response => {
        if (response == 'granted') {
          motionPermissionGranted = true;
        }
      })
      .catch(console.error);
  } else {
    motionPermissionGranted = true;
  }
}

window.addEventListener('devicemotion', (e) => {
  const acc = e.accelerationIncludingGravity;
  if (!acc || acc.x === null) return;
  
  if (lastAcc.x !== null) {
    const deltaX = Math.abs(acc.x - lastAcc.x);
    const deltaY = Math.abs(acc.y - lastAcc.y);
    const deltaZ = Math.abs(acc.z - lastAcc.z);
    
    if (deltaX + deltaY + deltaZ > SHAKE_THRESHOLD) {
      const now = performance.now();
      if (now - lastShakeTime > 200) {
        lastShakeTime = now;
        window.bubbles.forEach(b => {
          if (!b.dragging) {
            // Repartir una velocidad explosiva aleatoria
            b.vx += (Math.random() - 0.5) * 40;
            b.vy += (Math.random() - 0.5) * 40;
          }
        });
      }
    }
  }
  lastAcc = { x: acc.x, y: acc.y, z: acc.z };
});
