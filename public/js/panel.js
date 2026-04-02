/* ════════════════════════════════════
   panel.js — transición y contenido
════════════════════════════════════ */

window.panelOpen   = false;
window.activeBubble = null;

const expander  = document.getElementById('expander');
const panelWrap = document.getElementById('panel-wrap');

const EASE_OUT = 'cubic-bezier(.22,.68,0,1.2)';
const EASE_IN  = 'cubic-bezier(.4,0,.6,1)';

/* ── Renderiza el contenido de una burbuja según su tipo ── */
function renderBubbleContent(bubble) {
  const site = window.SITE_DATA;

  // Burbuja de blog: filtrado de posts + enlace inteligente
  if (bubble.type === 'blog') {
    let posts = window.POSTS_DATA || [];

    // 1. Si la burbuja tiene un "filterTag", recortamos la lista
    if (bubble.filterTag) {
      posts = posts.filter(p => p.tags && p.tags.includes(bubble.filterTag));
    }

    // 2. Generamos el HTML (mostramos los 3 últimos como tenías)
    const postsHtml = (posts.length === 0)
      ? `<p style="color:var(--muted);font-size:14px;margin-bottom:24px">
           Imagination has not arrived yet, please wait 
         </p>`
      : posts.slice(0, 3).map(p => `
          <a class="blog-post" href="${p.url}">
            <div class="blog-date">${p.date}</div>
            <div class="blog-title">${p.title}</div>
            ${p.excerpt ? `<div class="blog-excerpt">${p.excerpt}</div>` : ''}
          </a>`).join('');

    // 3. Generamos la URL de "Ver todos". Si hay filtro, lo pasamos por la URL (?tag=recipes)
    const allPostsUrl = bubble.filterTag ? `/posts/?tag=${bubble.filterTag}` : '/posts/';

    // 4. Retornamos el HTML del panel
    return `<h3>Last posts</h3>
            ${postsHtml}
            ${posts.length > 0 ? `
            <a href="${allPostsUrl}" style="
              display:inline-flex;align-items:center;gap:6px;
              margin-top:20px;font-size:13px;color:#7aefd4;
              text-decoration:none;letter-spacing:0.3px;
              opacity:0.85;transition:opacity 0.2s
            " onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=0.85">
              Ver todos los posts →
            </a>` : ''}`;
  }

  // Burbujas con sections (about, projects, skills, etc.)
  if (!bubble.sections) return '';

  // 2. Procesamos el contenido normal del JSON de la burbuja
  let html = bubble.sections.map(sec => {
    let sectionHtml = `<h3>${sec.title}</h3>`;

    if (sec.type === 'text') {
      sectionHtml += `<p>${sec.content}</p>`;

    } else if (sec.type === 'pills') {
          sectionHtml += `<div class="skill-grid">` +
            sec.items.map(item => {
              // Si el item es un objeto y tiene URL, creamos un enlace <a>
              if (typeof item === 'object' && item.url) {
                return `<a href="${item.url}" target="_blank" class="skill-pill is-link">${item.name}</a>`;
              } 
              // Si es solo texto normal, lo dejamos como un <span>
              else {
                return `<span class="skill-pill">${item.name || item}</span>`;
              }
            }).join('') +
            `</div>`;

   } else if (sec.type === 'projects') {
      sectionHtml += sec.items.map(proj => {
        // 1. Decidimos si usamos un enlace <a> o un simple contenedor <div>
        const isLink = !!proj.url;
        const tag = isLink ? 'a' : 'div';
        // 2. Si es un enlace, le ponemos la URL y hacemos que se abra en pestaña nueva
        const href = isLink ? `href="${proj.url}" target="_blank" rel="noopener noreferrer"` : '';
        
        return `
        <${tag} class="project-card ${isLink ? 'is-clickable' : ''}" ${href}>
          <div class="project-card-title">${proj.title}</div>
          <div class="project-card-desc">${proj.description}</div>
          ${proj.tags.map(tag =>
            `<span class="project-tag" style="background:${proj.tagBg};color:${proj.tagColor};border:1px solid ${proj.tagBorder}">${tag}</span>`
          ).join('')}
        </${tag}>`;
      }).join('');
    }

    return sectionHtml;
  }).join('');

  // 3. Si la burbuja es la de "About", le inyectamos tu contacto al final
  if (bubble.id === 'about') {
    html += `
      <br>
      <h3>Contact</h3>
      <p>Wanna talk about something? Feel free to contact me through any social media, I always willing to discuss about phones😎</p><br>
      <p>📧 <a href="mailto:${site.email}">${site.email}</a></p>
      
      <h3>SM</h3>
      <div class="skill-grid">
        ${site.github ? `<a class="skill-pill" href="${site.github}" target="_blank">GitHub</a>` : ''}
        ${site.linkedin ? `<a class="skill-pill" href="${site.linkedin}" target="_blank">LinkedIn</a>` : ''}
      </div>
    `;
  }

  return html;
}

/* ── Abre el panel con transición desde la burbuja ── */
function openPanel(bubble) {
  if (window.panelOpen) return;
  window.panelOpen = true;
  window.activeBubble = bubble;

  const s = bubble;

  document.getElementById('panel-icon').textContent = s.emoji;
  document.getElementById('panel-title').textContent = s.label;
  document.getElementById('panel-accent-bar').style.background = s.color;
  document.getElementById('panel-content').innerHTML = renderBubbleContent(s);
  document.getElementById('panel').scrollTop = 0;

  bubble.el.style.opacity = '0';
  expander.style.display = 'block';

  // posición inicial = la burbuja
  expander.style.transition = 'none';
  expander.style.left   = (bubble.x - bubble.r) + 'px';
  expander.style.top    = (bubble.y - bubble.r) + 'px';
  expander.style.width  = (bubble.r * 2) + 'px';
  expander.style.height = (bubble.r * 2) + 'px';
  expander.style.borderRadius = '50%';
  expander.style.background = `radial-gradient(circle at 38% 35%, ${s.color}55 0%, ${s.color}22 55%, ${s.color}08 100%)`;
  expander.style.boxShadow = `0 0 0 2px ${s.color}60, 0 0 60px ${s.glow}`;
  expander.style.opacity = '1';

  // animación a pantalla completa
  requestAnimationFrame(() => requestAnimationFrame(() => {
    expander.style.transition =
      `left .58s ${EASE_OUT}, top .58s ${EASE_OUT},` +
      `width .58s ${EASE_OUT}, height .58s ${EASE_OUT},` +
      `border-radius .58s ${EASE_OUT},` +
      `background .45s ease, box-shadow .35s ease`;
    expander.style.left   = '0px';
    expander.style.top    = '0px';
    expander.style.width  = window.innerWidth + 'px';
    expander.style.height = window.innerHeight + 'px';
    expander.style.borderRadius = '0px';
    expander.style.background = 'rgba(10,10,15,0.97)';
    expander.style.boxShadow = 'none';
  }));

  setTimeout(() => {
    // 1. Mostramos el panel (esto ya lo hacías)
    panelWrap.classList.add('visible');

    // ¡LA MADRE DE TODAS LAS EXPLOSIONES DE CONFETI!
    confetti({
      particleCount: 350,         // Pasamos de 120 a 350 papelitos
      spread: 130,                // Una explosión mucho más ancha (casi cubre toda la pantalla)
      startVelocity: 70,          // Sale disparado con más fuerza hacia arriba
      origin: { y: 0.55 },        // Lo subimos un pelín para que caiga desde más alto
      colors: [bubble.color, '#ffffff', '#c8b8ff', '#7aefd4', '#f7c45e'], // ¡Todos los colores de tu web!
      disableForReducedMotion: true
    });
  
  }, 440);
}

/* ── Cierra el panel con transición de vuelta a la burbuja ── */
function closePanel() {
  if (!window.panelOpen || !window.activeBubble) return;
  const bubble = window.activeBubble;
  const s = bubble;

  panelWrap.classList.remove('visible');

  setTimeout(() => {
    expander.style.transition =
      `left .5s ${EASE_IN}, top .5s ${EASE_IN},` +
      `width .5s ${EASE_IN}, height .5s ${EASE_IN},` +
      `border-radius .5s ${EASE_IN},` +
      `background .3s ease .1s, box-shadow .3s ease .15s`;
    expander.style.left   = (bubble.x - bubble.r) + 'px';
    expander.style.top    = (bubble.y - bubble.r) + 'px';
    expander.style.width  = (bubble.r * 2) + 'px';
    expander.style.height = (bubble.r * 2) + 'px';
    expander.style.borderRadius = '50%';
    expander.style.background = `radial-gradient(circle at 38% 35%, ${s.color}55 0%, ${s.color}22 55%, ${s.color}08 100%)`;
    expander.style.boxShadow = `0 0 0 2px ${s.color}60, 0 0 60px ${s.glow}`;

    setTimeout(() => {
      expander.style.display = 'none';
      bubble.el.style.transition = 'opacity .2s ease';
      bubble.el.style.opacity = '1';
      setTimeout(() => bubble.el.style.transition = '', 220);
      window.panelOpen = false;
      window.activeBubble = null;
    }, 520);
  }, 230);
}

document.getElementById('close-btn').addEventListener('click', closePanel);
document.addEventListener('keydown', e => { if (e.key === 'Escape') closePanel(); });
