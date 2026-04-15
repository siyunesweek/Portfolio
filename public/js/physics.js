/* ════════════════════════════════════
   physics.js — fondo, física, tick loop
════════════════════════════════════ */

const W = () => window.innerWidth;
const H = () => window.innerHeight;

window.activeWaves = [];

/* ── waveCanvas: overlay para las ondas (canvas 2D, mucho más rápido que DOM) ── */
let waveCanvas, wCtx;
function initWaveCanvas() {
  waveCanvas = document.getElementById('waveCanvas');
  waveCanvas.width  = W();
  waveCanvas.height = H();
  wCtx = waveCanvas.getContext('2d');
}

const MAX_CONCURRENT_WAVES = 3;
const WAVE_DURATION = 1200;
const WAVE_COOLDOWN = 350;
const WAVE_MAX_VEL  = 18;
let lastDropTime = -Infinity;

const WANDER_FORCE = 0.018;
const WANDER_TURN  = 0.08;

/* ── Eventos cósmicos: Agujero Negro → Agujero Blanco ── */
const COSMIC_INTERVAL = 20000; // ms entre eventos
const BH_DURATION     = 3000;  // ms fase agujero negro
const WH_DURATION     = 2000;  // ms fase agujero blanco
let cosmicEvent    = null;     // { phase:'bh'|'wh', x, y, startTime, whImpulsed }
let lastCosmicTime = -COSMIC_INTERVAL; // el primero sale pronto

function createDrop(x, y, excludedBubble = null) {
  const now = performance.now();
  // Cooldown: ignorar si se ha creado una onda muy recientemente
  if (now - lastDropTime < WAVE_COOLDOWN) return;
  lastDropTime = now;

  // Limpiar ondas expiradas y limitar concurrencia
  if (window.activeWaves.length >= MAX_CONCURRENT_WAVES) {
    window.activeWaves.shift();
  }

  const maxHitRadius = 2000;
  const speed = maxHitRadius / WAVE_DURATION;

  const wave = {
    x, y,
    startTime: now,
    speed,
    maxRadius: maxHitRadius,
    duration: WAVE_DURATION,
    strength: 1200,
    hitBubbles: new Set(excludedBubble ? [excludedBubble] : [])
  };
  window.activeWaves.push(wave);
}

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

  // Redimensionar también el canvas de ondas
  if (waveCanvas) {
    waveCanvas.width  = W();
    waveCanvas.height = H();
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
  requestAnimationFrame(tick); // siempre programar el siguiente frame PRIMERO
  try {
  if (!lastT) { lastT = now; return; }
  if (window.panelOpen) { lastT = now; return; }

  const dt = Math.min((now - lastT) / 16.667, 3);
  lastT = now;

  const w = W(), h = H();

  // ── Dibujar ondas y torbellino en canvas ──
  if (wCtx) {
    wCtx.clearRect(0, 0, w, h);

    // Ondas
    for (let i = window.activeWaves.length - 1; i >= 0; i--) {
      const wv = window.activeWaves[i];
      const elapsed = now - wv.startTime;
      const progress = elapsed / wv.duration;
      if (progress >= 1) continue;
      const radius = elapsed * wv.speed;
      const alpha  = (1 - progress) * 0.55;
      wCtx.beginPath();
      wCtx.arc(wv.x, wv.y, radius, 0, Math.PI * 2);
      wCtx.strokeStyle = `rgba(122,239,212,${alpha.toFixed(3)})`;
      wCtx.lineWidth = 2 - progress * 1.5;
      wCtx.stroke();
    }

    // ── Evento cósmico visual ──
    if (cosmicEvent) {
      const cElapsed = now - cosmicEvent.startTime;
      const cx = cosmicEvent.x, cy = cosmicEvent.y;

      if (cosmicEvent.phase === 'bh') {
        // ── Agujero negro ──
        const prog = cElapsed / BH_DURATION;
        const fade = Math.min(prog * 4, 1) * Math.min((1 - prog) * 6, 1);

        // Zona oscura exterior: oscurece el área alrededor
        const dimGrd = wCtx.createRadialGradient(cx, cy, 28, cx, cy, 160);
        dimGrd.addColorStop(0,   `rgba(0,0,0,${(fade * 0.75).toFixed(3)})`);
        dimGrd.addColorStop(0.6, `rgba(0,0,0,${(fade * 0.40).toFixed(3)})`);
        dimGrd.addColorStop(1,   'rgba(0,0,0,0)');
        wCtx.beginPath();
        wCtx.arc(cx, cy, 160, 0, Math.PI * 2);
        wCtx.fillStyle = dimGrd;
        wCtx.fill();

        // Anillo fotónico: línea fina blanca/gris en el borde del horizonte
        wCtx.beginPath();
        wCtx.arc(cx, cy, 30, 0, Math.PI * 2);
        wCtx.strokeStyle = `rgba(200,200,200,${(fade * 0.4).toFixed(3)})`;
        wCtx.lineWidth = 1.5;
        wCtx.stroke();

        // Disco negro sólido central (el agujero negro propiamente)
        wCtx.beginPath();
        wCtx.arc(cx, cy, 28, 0, Math.PI * 2);
        wCtx.fillStyle = `rgba(0,0,0,${fade.toFixed(3)})`;
        wCtx.fill();

      } else {
        // ── Agujero blanco ──
        const prog = cElapsed / WH_DURATION;
        const fade = 1 - prog; // va desapareciendo

        // Anillos expansivos brillantes
        for (let ri = 0; ri < 4; ri++) {
          const ringProg = Math.max(0, prog - ri * 0.12);
          const radius   = ringProg * 320;
          const alpha    = (1 - ringProg) * fade * 0.7;
          if (alpha <= 0) continue;
          wCtx.beginPath();
          wCtx.arc(cx, cy, radius, 0, Math.PI * 2);
          wCtx.strokeStyle = `rgba(220,240,255,${alpha.toFixed(3)})`;
          wCtx.lineWidth   = 3 - ringProg * 2;
          wCtx.stroke();
        }

        // Núcleo blanco brillante
        const coreGrd = wCtx.createRadialGradient(cx, cy, 0, cx, cy, 60);
        coreGrd.addColorStop(0, `rgba(255,255,255,${(fade * 0.9).toFixed(3)})`);
        coreGrd.addColorStop(0.4, `rgba(180,220,255,${(fade * 0.6).toFixed(3)})`);
        coreGrd.addColorStop(1, 'rgba(100,180,255,0)');
        wCtx.beginPath();
        wCtx.arc(cx, cy, 60, 0, Math.PI * 2);
        wCtx.fillStyle = coreGrd;
        wCtx.fill();
      }
    }
  }

  // Física de ondas: empuje a burbujas
  for (let i = window.activeWaves.length - 1; i >= 0; i--) {
    const wWave = window.activeWaves[i];
    const elapsed = now - wWave.startTime;
    const currentRadius = elapsed * wWave.speed;

    if (elapsed > wWave.duration) {
      window.activeWaves.splice(i, 1);
      continue;
    }

    for (const b of window.bubbles) {
      if (b.dragging || wWave.hitBubbles.has(b)) continue;
      const dx = b.x - wWave.x;
      const dy = b.y - wWave.y;
      const dist = Math.hypot(dx, dy);
      if (currentRadius >= dist - b.r) {
        wWave.hitBubbles.add(b);
        const effDist = Math.max(dist, 60);
        const pushForce = wWave.strength / effDist;
        const nx = dist > 0.1 ? dx / dist : (Math.random() - 0.5);
        const ny = dist > 0.1 ? dy / dist : (Math.random() - 0.5);
        b.vx += nx * pushForce;
        b.vy += ny * pushForce;
        const spd = Math.hypot(b.vx, b.vy);
        if (spd > WAVE_MAX_VEL) { b.vx = b.vx / spd * WAVE_MAX_VEL; b.vy = b.vy / spd * WAVE_MAX_VEL; }
      }
    }
  }

  // ── Evento cósmico: lifecycle + física ──
  // Crear nuevo evento si toca
  if (!cosmicEvent && !window.panelOpen && now - lastCosmicTime >= COSMIC_INTERVAL) {
    lastCosmicTime = now;
    const margin = 100;
    cosmicEvent = {
      phase: 'bh',
      x: margin + Math.random() * (w - margin * 2),
      y: margin + Math.random() * (h - margin * 2),
      startTime: now,
      whImpulsed: false,
    };
  }

  if (cosmicEvent) {
    const cElapsed = now - cosmicEvent.startTime;

    if (cosmicEvent.phase === 'bh') {
      // ─ Transición BH → WH ─
      if (cElapsed >= BH_DURATION) {
        cosmicEvent.phase = 'wh';
        cosmicEvent.startTime = now;
      } else {
        // Física de aspiro: fuerza centripetal hacia el centro
        const prog = cElapsed / BH_DURATION;
        const fade = Math.min(prog * 4, 1) * Math.min((1 - prog) * 6, 1);
        for (const b of window.bubbles) {
          if (b.dragging) continue;
          const dx = cosmicEvent.x - b.x; // hacia el centro (positivo = inward)
          const dy = cosmicEvent.y - b.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 5) continue;
          const str = 1400 * fade / Math.max(dist, 50);
          b.vx += (dx / dist) * str * dt;
          b.vy += (dy / dist) * str * dt;
          // Cap para que no se cuele dentro de la singularidad
          const spd = Math.hypot(b.vx, b.vy);
          if (spd > 22) { b.vx = b.vx / spd * 22; b.vy = b.vy / spd * 22; }
        }
      }

    } else {
      // ─ Fase WH ─
      if (cElapsed >= WH_DURATION) {
        cosmicEvent = null; // evento terminado
      } else {
        // Impulso explosivo único al inicio del agujero blanco
        if (!cosmicEvent.whImpulsed) {
          cosmicEvent.whImpulsed = true;
          for (const b of window.bubbles) {
            if (b.dragging) continue;
            const dx = b.x - cosmicEvent.x;
            const dy = b.y - cosmicEvent.y;
            const dist = Math.hypot(dx, dy);
            const nx = dist > 0.1 ? dx / dist : (Math.random() * 2 - 1);
            const ny = dist > 0.1 ? dy / dist : (Math.random() * 2 - 1);
            // Fuerza inversamente proporcional a distancia pero con mínimo
            const impulse = 18 + 500 / Math.max(dist, 80);
            b.vx = nx * impulse;
            b.vy = ny * impulse;
          }
        }
        // Pequeña fuerza repulsiva continua durante WH para mantener el efecto
        const prog = cElapsed / WH_DURATION;
        for (const b of window.bubbles) {
          if (b.dragging) continue;
          const dx = b.x - cosmicEvent.x;
          const dy = b.y - cosmicEvent.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 5) continue;
          const str = 200 * (1 - prog) / Math.max(dist, 60);
          b.vx += (dx / dist) * str * dt;
          b.vy += (dy / dist) * str * dt;
        }
      }
    }
  }

  for (const b of window.bubbles) {
    if (b.dragging) continue;
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    if (b.x - b.r < 0)  { b.x = b.r;     b.vx =  Math.abs(b.vx); }
    if (b.x + b.r > w)  { b.x = w - b.r;  b.vx = -Math.abs(b.vx); }
    if (b.y - b.r < 0)  { b.y = b.r;     b.vy =  Math.abs(b.vy); }
    if (b.y + b.r > h)  { b.y = h - b.r;  b.vy = -Math.abs(b.vy); }
    const spd = Math.hypot(b.vx, b.vy);
    const friction = Math.pow(spd > 8 ? 0.985 : spd > 3 ? 0.992 : 0.994, dt);
    b.vx *= friction;
    b.vy *= friction;
  }

  for (let i = 0; i < window.bubbles.length; i++)
    for (let j = i + 1; j < window.bubbles.length; j++)
      resolveCollision(window.bubbles[i], window.bubbles[j]);

  // Wander: fuerza suave continua — las burbujas nunca se detienen
  for (const b of window.bubbles) {
    if (b.dragging) continue;
    if (b.wanderAngle === undefined) b.wanderAngle = Math.random() * Math.PI * 2;
    b.wanderAngle += (Math.random() - 0.5) * WANDER_TURN * dt;
    b.vx += Math.cos(b.wanderAngle) * WANDER_FORCE * dt;
    b.vy += Math.sin(b.wanderAngle) * WANDER_FORCE * dt;
  }

  for (const b of window.bubbles)
    b.el.style.transform = `translate3d(${b.x - b.r}px,${b.y - b.r}px,0) scale(1.0001)`;

  } catch (e) {
    console.error('[tick]', e);
  }
}
