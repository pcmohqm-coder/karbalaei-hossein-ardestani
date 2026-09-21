(() => {
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('#main-nav');
  if (toggle && nav) {
    const closeMenu = (restoreFocus = false) => {
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'باز کردن منو');
      if (restoreFocus) toggle.focus();
    };
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'بستن منو' : 'باز کردن منو');
    });
    nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => closeMenu()));
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && nav.classList.contains('open')) closeMenu(true); });
  }

  const heroSlides = document.querySelectorAll('.hero-slide');
  if (heroSlides.length > 1) {
    let current = 0;
    window.setInterval(() => {
      heroSlides[current].classList.remove('is-active');
      current = (current + 1) % heroSlides.length;
      heroSlides[current].classList.add('is-active');
    }, 5000);
  }

  const slides = Array.from(document.querySelectorAll('.gallery-slide'));
  const prev = document.querySelector('.gallery-prev');
  const next = document.querySelector('.gallery-next');
  const dots = document.querySelector('.gallery-dots');
  if (slides.length && prev && next && dots) {
    let index = 0;
    slides.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.type = 'button'; dot.className = 'gallery-dot' + (i === 0 ? ' is-active' : '');
      dot.setAttribute('aria-label', `نمایش تصویر ${i + 1}`);
      dot.addEventListener('click', () => show(i));
      dots.appendChild(dot);
    });
    const show = (i) => {
      index = (i + slides.length) % slides.length;
      slides.forEach((s, n) => s.classList.toggle('is-active', n === index));
      dots.querySelectorAll('.gallery-dot').forEach((d, n) => d.classList.toggle('is-active', n === index));
    };
    prev.addEventListener('click', () => show(index - 1));
    next.addEventListener('click', () => show(index + 1));
    document.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight') show(index - 1);
      if (e.key === 'ArrowLeft') show(index + 1);
    });
  }
})();

/* Audio library: files can be added later without changing the player markup. */
(() => {
  const cards = document.querySelectorAll('[data-audio-card]');
  if (!cards.length) return;
  let active = null;
  cards.forEach(card => {
    const src = card.dataset.src;
    const btn = card.querySelector('.audio-play');
    const bar = card.querySelector('.audio-progress-bar');
    const times = card.querySelectorAll('.audio-times span');
    if (!src || !btn) return;
    const audio = new Audio();
    audio.preload = 'metadata';
    audio.src = src;
    audio.addEventListener('loadedmetadata', () => {
      btn.disabled = false;
      if (times[1]) times[1].textContent = format(audio.duration);
    });
    audio.addEventListener('timeupdate', () => {
      const ratio = audio.duration ? audio.currentTime / audio.duration : 0;
      if (bar) bar.style.width = `${ratio * 100}%`;
      if (times[0]) times[0].textContent = format(audio.currentTime);
    });
    audio.addEventListener('ended', () => { btn.textContent = '▶'; if (bar) bar.style.width = '0%'; });
    btn.addEventListener('click', () => {
      if (active && active !== audio) { active.pause(); document.querySelectorAll('.audio-play').forEach(b => b.textContent = '▶'); }
      if (audio.paused) { audio.play(); btn.textContent = 'Ⅱ'; active = audio; }
      else { audio.pause(); btn.textContent = '▶'; }
    });
  });
  function format(value) { if (!Number.isFinite(value)) return '00:00'; const m = Math.floor(value / 60).toString().padStart(2,'0'); const s = Math.floor(value % 60).toString().padStart(2,'0'); return `${m}:${s}`; }
})();
