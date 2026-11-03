/* پایگاه رسمی کربلایی حسین اردستانی — v20 */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/* هدر و منو */
(() => {
  const header = $('#site-header'), toggle = $('.menu-toggle'), nav = $('#main-nav');
  if (header) { const f = () => header.classList.toggle('scrolled', scrollY > 10); f(); addEventListener('scroll', f, { passive: true }); }
  if (!toggle || !nav) return;
  const close = () => { nav.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); toggle.setAttribute('aria-label', 'باز کردن منو'); };
  toggle.addEventListener('click', () => { const o = nav.classList.toggle('open'); toggle.setAttribute('aria-expanded', String(o)); toggle.setAttribute('aria-label', o ? 'بستن منو' : 'باز کردن منو'); });
  $$('a', nav).forEach(a => a.addEventListener('click', close));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
})();

/* اسلاید تصاویر بالای صفحه */
(() => {
  const s = $$('.hero-slide'); if (s.length < 2) return;
  let i = 0; setInterval(() => { s[i].classList.remove('is-active'); i = (i + 1) % s.length; s[i].classList.add('is-active'); }, 5500);
})();

/* گالری */
(() => {
  const slides = $$('.gallery-slide'), prev = $('.gallery-prev'), next = $('.gallery-next'), dots = $('.gallery-dots'), track = $('.gallery-track');
  if (!slides.length) return;
  let idx = 0;
  const show = n => {
    idx = (n + slides.length) % slides.length;
    slides.forEach((s, k) => s.classList.toggle('is-active', k === idx));
    $$('.gallery-dot', dots).forEach((d, k) => d.classList.toggle('is-active', k === idx));
  };
  slides.forEach((_, k) => { const d = document.createElement('button'); d.type = 'button'; d.className = 'gallery-dot' + (k ? '' : ' is-active'); d.setAttribute('aria-label', `نمایش تصویر ${k + 1}`); d.onclick = () => show(k); dots.appendChild(d); });
  prev.onclick = () => show(idx - 1); next.onclick = () => show(idx + 1);
  let x0 = null;
  track.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
  track.addEventListener('touchend', e => { if (x0 === null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 40) show(idx + (dx < 0 ? 1 : -1)); x0 = null; });
  document.addEventListener('keydown', e => { if (e.target.closest('input,textarea,[role=slider]')) return; if (e.key === 'ArrowRight') show(idx - 1); if (e.key === 'ArrowLeft') show(idx + 1); });
})();

/* نمایش نرم بخش‌ها */
(() => {
  const els = $$('.reveal');
  if (!('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('in')); return; }
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .08 });
  els.forEach(e => io.observe(e));
})();

/* اطلاعیه مراسم: چهار جای پوستر؛ فقط امروز تا ۲ روز آینده (به وقت تهران) */
(() => {
  const grid = $('#poster-grid'), none = $('#events-none'); if (!grid) return;
  const SLOTS = 4;
  const tehranToday = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Tehran' });
  const dayNum = iso => { const [y, m, d] = iso.split('-').map(Number); return Date.UTC(y, m - 1, d) / 864e5; };
  const jalali = iso => new Intl.DateTimeFormat('fa-IR-u-ca-persian', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(new Date(iso + 'T12:00:00Z'));
  const label = d => d === 0 ? 'امروز' : d === 1 ? 'فردا' : 'پس‌فردا';
  const lb = $('#lightbox'), lbi = $('img', lb);
  const closeLb = () => lb.classList.remove('open');
  lb.addEventListener('click', e => { if (e.target === lb || e.target.tagName === 'BUTTON') closeLb(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLb(); });
  const render = list => {
    grid.innerHTML = '';
    list.slice(0, SLOTS).forEach(p => {
      const el = document.createElement('button');
      el.type = 'button'; el.className = 'slot filled'; el.setAttribute('aria-label', 'بزرگ‌نمایی پوستر ' + (p.title || ''));
      const wrap = document.createElement('div'); wrap.className = 'slot-img';
      const img = document.createElement('img'); img.src = 'assets/posters/' + p.file; img.alt = p.title || 'اطلاعیه مراسم'; img.loading = 'lazy'; wrap.appendChild(img);
      const meta = document.createElement('div'); meta.className = 'slot-meta';
      const day = document.createElement('span'); day.className = 'poster-day' + (p.diff === 0 ? ' today' : ''); day.textContent = label(p.diff);
      const dt = document.createElement('span'); dt.className = 'poster-date'; dt.textContent = jalali(p.date);
      meta.append(day, dt); el.append(wrap, meta);
      if (p.title) { const t = document.createElement('div'); t.className = 'slot-title'; t.textContent = p.title; el.append(t); }
      el.addEventListener('click', () => { lbi.src = img.src; lbi.alt = img.alt; lb.classList.add('open'); });
      grid.appendChild(el);
    });
    none.hidden = list.length > 0;
  };
  render([]);
  fetch('assets/posters/posters.json?t=' + Date.now(), { cache: 'no-store' })
    .then(r => r.ok ? r.json() : { posters: [] })
    .then(data => {
      const today = dayNum(tehranToday());
      render((data.posters || []).map(p => ({ ...p, diff: dayNum(p.date) - today })).filter(p => p.diff >= 0 && p.diff <= 2).sort((a, b) => a.diff - b.diff));
    })
    .catch(() => {});
})();

/* پلیر صوتی ساده — بدون هیچ پردازش صوتی؛ فایل اصلی مستقیم پخش می‌شود */
(() => {
  const cards = $$('.track'); if (!cards.length) return;
  const fmt = v => Number.isFinite(v) ? String(Math.floor(v / 60)).padStart(2, '0') + ':' + String(Math.floor(v % 60)).padStart(2, '0') : '00:00';
  const audios = [];
  cards.forEach(card => {
    const audio = new Audio(); audio.preload = 'metadata'; audio.src = card.dataset.src; audios.push(audio);
    const btn = $('.t-play', card), seek = $('.t-seek', card), time = $('.t-time', card);
    const paint = () => {
      const d = audio.duration, r = d ? audio.currentTime / d : 0;
      seek.value = Math.round(r * 1000); seek.style.setProperty('--p', (r * 100) + '%');
      time.textContent = fmt(audio.currentTime) + ' / ' + fmt(d);
    };
    btn.addEventListener('click', () => {
      if (audio.paused) { audios.forEach(a => { if (a !== audio) a.pause(); }); audio.play().catch(() => {}); } else audio.pause();
    });
    seek.addEventListener('input', () => { if (audio.duration) audio.currentTime = seek.value / 1000 * audio.duration; paint(); });
    audio.addEventListener('loadedmetadata', paint);
    audio.addEventListener('timeupdate', paint);
    audio.addEventListener('play', () => { card.classList.add('is-playing'); btn.textContent = '❚❚'; btn.setAttribute('aria-label', 'توقف'); });
    audio.addEventListener('pause', () => { card.classList.remove('is-playing'); btn.textContent = '▶'; btn.setAttribute('aria-label', 'پخش'); });
    audio.addEventListener('ended', () => { audio.currentTime = 0; paint(); });
  });
})();
