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

/* Audio library: large cover + seekable player, inspired by the reference audio page. */
(() => {
  const cards = [...document.querySelectorAll('[data-audio-card]')];
  if (!cards.length) return;
  let active = null;

  const format = value => {
    if (!Number.isFinite(value)) return '00:00';
    const m = Math.floor(value / 60).toString().padStart(2,'0');
    const sec = Math.floor(value % 60).toString().padStart(2,'0');
    return `${m}:${sec}`;
  };

  const setPlayingUI = (card, playing) => {
    card.querySelectorAll('.audio-play,.audio-cover-play').forEach(b => {
      b.textContent = playing ? 'Ⅱ' : '▶';
      b.disabled = false;
    });
    const status = card.querySelector('.audio-status');
    if (status) status.textContent = playing ? 'در حال پخش' : 'حالت پخش';
    card.classList.toggle('is-playing', playing);
  };

  cards.forEach(card => {
    const src = card.dataset.src;
    const playButtons = [...card.querySelectorAll('.audio-play,.audio-cover-play')];
    const bar = card.querySelector('.audio-progress-bar');
    const track = card.querySelector('.audio-progress-large');
    const times = card.querySelectorAll('.audio-times span');
    const reset = card.querySelector('.audio-reset');
    if (!src || !playButtons.length) return;

    const audio = new Audio(src);
    audio.preload = 'metadata';

    const play = async () => {
      if (active && active !== audio) {
        active.pause();
        const oldCard = active._card;
        if (oldCard) setPlayingUI(oldCard, false);
      }
      try {
        await audio.play();
        active = audio;
        audio._card = card;
        setPlayingUI(card, true);
      } catch (err) {
        setPlayingUI(card, false);
      }
    };
    const pause = () => { audio.pause(); setPlayingUI(card, false); };

    audio.addEventListener('loadedmetadata', () => {
      playButtons.forEach(b => b.disabled = false);
      if (times[1]) times[1].textContent = format(audio.duration);
    });
    audio.addEventListener('timeupdate', () => {
      const ratio = audio.duration ? audio.currentTime / audio.duration : 0;
      if (bar) bar.style.width = `${ratio * 100}%`;
      if (times[0]) times[0].textContent = format(audio.currentTime);
      if (track) track.setAttribute('aria-valuenow', Math.round(ratio * 100));
    });
    audio.addEventListener('play', () => setPlayingUI(card, true));
    audio.addEventListener('pause', () => { if (!audio.ended) setPlayingUI(card, false); });
    audio.addEventListener('ended', () => {
      setPlayingUI(card, false);
      if (bar) bar.style.width = '0%';
      if (times[0]) times[0].textContent = '00:00';
      active = null;
    });

    playButtons.forEach(btn => btn.addEventListener('click', () => audio.paused ? play() : pause()));
    if (reset) reset.addEventListener('click', () => { audio.currentTime = 0; if (!audio.paused) play(); });

    if (track) {
      const seek = e => {
        if (!Number.isFinite(audio.duration)) return;
        const rect = track.getBoundingClientRect();
        const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
        audio.currentTime = (x / rect.width) * audio.duration;
      };
      track.addEventListener('click', seek);
      track.addEventListener('keydown', e => {
        if (!Number.isFinite(audio.duration)) return;
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          e.preventDefault();
          audio.currentTime = Math.max(0, Math.min(audio.duration, audio.currentTime + (e.key === 'ArrowRight' ? 5 : -5)));
        }
      });
    }
  });
})();
