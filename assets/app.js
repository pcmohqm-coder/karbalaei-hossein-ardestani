/* پایگاه رسمی کربلایی حسین اردستانی — v19 */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const toast = (msg) => { const t = $('#toast'); if (!t) return; t.textContent = msg; t.classList.add('show'); clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), 2200); };

/* منو */
(() => {
  const toggle = $('.menu-toggle'), nav = $('#main-nav');
  if (!toggle || !nav) return;
  const close = () => { nav.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); toggle.setAttribute('aria-label', 'باز کردن منو'); };
  toggle.addEventListener('click', () => { const o = nav.classList.toggle('open'); toggle.setAttribute('aria-expanded', String(o)); toggle.setAttribute('aria-label', o ? 'بستن منو' : 'باز کردن منو'); });
  $$('a', nav).forEach(a => a.addEventListener('click', close));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
})();

/* اسلایدر Hero */
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
  let timer = setInterval(() => show(idx + 1), 6500);
  [prev, next, dots].forEach(el => el.addEventListener('click', () => { clearInterval(timer); timer = setInterval(() => show(idx + 1), 9000); }));
})();

/* نمایش نرم بخش‌ها */
(() => {
  const els = $$('.reveal');
  if (!('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('in')); return; }
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .08 });
  els.forEach(e => io.observe(e));
})();

/* کپی آیدی */
(() => {
  const b = $('#copy-id'); if (!b) return;
  b.addEventListener('click', async () => {
    const t = $('#admin-id').textContent.trim();
    try { await navigator.clipboard.writeText(t); toast('آیدی کپی شد'); }
    catch { const r = document.createRange(); r.selectNodeContents($('#admin-id')); const s = getSelection(); s.removeAllRanges(); s.addRange(r); toast('آیدی انتخاب شد؛ کپی کنید'); }
  });
})();

/* اطلاعیه مراسم: فقط امروز تا ۲ روز آینده (به وقت تهران) */
(() => {
  const grid = $('#poster-grid'), empty = $('#events-empty'); if (!grid) return;
  const tehranToday = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Tehran' });
  const dayNum = iso => { const [y, m, d] = iso.split('-').map(Number); return Date.UTC(y, m - 1, d) / 864e5; };
  const jalali = iso => new Intl.DateTimeFormat('fa-IR-u-ca-persian', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(new Date(iso + 'T12:00:00Z'));
  const label = d => d === 0 ? 'امروز' : d === 1 ? 'فردا' : 'پس‌فردا';
  const lb = $('#lightbox'), lbi = $('img', lb);
  const closeLb = () => lb.classList.remove('open');
  lb.addEventListener('click', e => { if (e.target === lb || e.target.tagName === 'BUTTON') closeLb(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLb(); });
  const showEmpty = () => { empty.hidden = false; };
  fetch('assets/posters/posters.json?t=' + Date.now(), { cache: 'no-store' })
    .then(r => r.ok ? r.json() : { posters: [] })
    .then(data => {
      const today = dayNum(tehranToday());
      const list = (data.posters || [])
        .map(p => ({ ...p, diff: dayNum(p.date) - today }))
        .filter(p => p.diff >= 0 && p.diff <= 2)
        .sort((a, b) => a.diff - b.diff);
      if (!list.length) return showEmpty();
      list.forEach(p => {
        const el = document.createElement('button');
        el.type = 'button'; el.className = 'poster';
        el.setAttribute('aria-label', 'بزرگ‌نمایی پوستر ' + (p.title || ''));
        const img = document.createElement('img'); img.src = 'assets/posters/' + p.file; img.alt = p.title || 'اطلاعیه مراسم'; img.loading = 'lazy';
        const meta = document.createElement('div'); meta.className = 'poster-meta';
        const day = document.createElement('span'); day.className = 'poster-day' + (p.diff === 0 ? ' today' : ''); day.textContent = label(p.diff);
        const dt = document.createElement('span'); dt.className = 'poster-date'; dt.textContent = jalali(p.date);
        meta.append(day, dt); el.append(img, meta);
        if (p.title) { const t = document.createElement('div'); t.className = 'poster-title'; t.textContent = p.title; el.append(t); }
        el.addEventListener('click', () => { lbi.src = img.src; lbi.alt = img.alt; lb.classList.add('open'); });
        grid.appendChild(el);
      });
    })
    .catch(showEmpty);
})();

/* پلیر صوتی */
(() => {
  const root = $('#player'); if (!root) return;
  const audio = $('#audio-el');
  const items = $$('.pl-item', root);
  const el = id => document.getElementById(id);
  const playBtn = el('p-play'), wave = el('p-wave'), cur = el('p-cur'), dur = el('p-dur');
  const BARS = 64;
  const fmt = v => Number.isFinite(v) ? String(Math.floor(v / 60)).padStart(2, '0') + ':' + String(Math.floor(v % 60)).padStart(2, '0') : '00:00';
  /* موج صوتی: شکل ثابت و یکتا برای هر اثر */
  const bars = [];
  for (let i = 0; i < BARS; i++) { const b = document.createElement('i'); wave.appendChild(b); bars.push(b); }
  const shape = seed => {
    let s = 0; for (const c of seed) s = (s * 31 + c.charCodeAt(0)) >>> 0;
    const rnd = () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
    bars.forEach((b, i) => { const env = .45 + .35 * Math.sin(i / BARS * Math.PI); const h = Math.max(.14, Math.min(1, env * (.45 + rnd() * .85))); b.style.height = (h * 100) + '%'; });
  };
  let idx = 0, speeds = [1, 1.25, 1.5, .75], si = 0;
  const paint = () => {
    const r = audio.duration ? audio.currentTime / audio.duration : 0;
    const on = Math.round(r * BARS);
    bars.forEach((b, i) => b.classList.toggle('on', i < on));
    cur.textContent = fmt(audio.currentTime);
    wave.setAttribute('aria-valuenow', Math.round(r * 100));
  };
  const setPlaying = p => {
    root.classList.toggle('is-playing', p);
    playBtn.textContent = p ? '⏸' : '▶'; playBtn.setAttribute('aria-label', p ? 'توقف' : 'پخش');
    if ('mediaSession' in navigator) navigator.mediaSession.playbackState = p ? 'playing' : 'paused';
  };
  const load = (n, autoplay) => {
    idx = (n + items.length) % items.length;
    const it = items[idx];
    items.forEach((x, k) => x.classList.toggle('active', k === idx));
    audio.src = it.dataset.src; audio.playbackRate = speeds[si];
    el('p-cover').src = it.dataset.cover; el('p-title').textContent = it.dataset.title;
    el('p-dl').href = it.dataset.src; shape(it.dataset.title);
    dur.textContent = '00:00'; paint();
    if ('mediaSession' in navigator && window.MediaMetadata) navigator.mediaSession.metadata = new MediaMetadata({ title: it.dataset.title, artist: 'کربلایی حسین اردستانی', artwork: [{ src: it.dataset.cover, sizes: '800x800', type: 'image/jpeg' }] });
    if (autoplay) audio.play().catch(() => setPlaying(false));
  };
  const toggle = () => { if (!audio.src) load(idx, false); audio.paused ? audio.play().catch(() => setPlaying(false)) : audio.pause(); };
  playBtn.onclick = toggle;
  el('p-next').onclick = () => load(idx + 1, true);
  el('p-prev').onclick = () => { if (audio.currentTime > 3) audio.currentTime = 0; else load(idx - 1, true); };
  el('p-back').onclick = () => { audio.currentTime = Math.max(0, audio.currentTime - 10); };
  el('p-fwd').onclick = () => { if (audio.duration) audio.currentTime = Math.min(audio.duration, audio.currentTime + 10); };
  el('p-speed').onclick = e => { si = (si + 1) % speeds.length; audio.playbackRate = speeds[si]; e.currentTarget.textContent = speeds[si] + '×'; };
  el('p-vol').oninput = e => { audio.volume = Number(e.target.value); };
  items.forEach((it, k) => it.addEventListener('click', () => { if (k === idx && audio.src) toggle(); else load(k, true); }));
  audio.addEventListener('loadedmetadata', () => { dur.textContent = fmt(audio.duration); });
  audio.addEventListener('timeupdate', paint);
  audio.addEventListener('play', () => setPlaying(true));
  audio.addEventListener('pause', () => setPlaying(false));
  audio.addEventListener('ended', () => load(idx + 1, items.length > 1));
  /* جابه‌جایی با کلیک/کشیدن روی موج */
  const seekAt = x => { if (!audio.duration) return; const r = wave.getBoundingClientRect(); audio.currentTime = Math.max(0, Math.min(1, (x - r.left) / r.width)) * audio.duration; };
  let drag = false;
  wave.addEventListener('pointerdown', e => { drag = true; wave.setPointerCapture(e.pointerId); seekAt(e.clientX); });
  wave.addEventListener('pointermove', e => { if (drag) seekAt(e.clientX); });
  wave.addEventListener('pointerup', () => { drag = false; });
  wave.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); audio.currentTime = Math.max(0, audio.currentTime - 5); }
    if (e.key === 'ArrowRight') { e.preventDefault(); if (audio.duration) audio.currentTime = Math.min(audio.duration, audio.currentTime + 5); }
  });
  if ('mediaSession' in navigator) {
    const ms = navigator.mediaSession;
    ms.setActionHandler('play', toggle); ms.setActionHandler('pause', toggle);
    ms.setActionHandler('nexttrack', () => load(idx + 1, true)); ms.setActionHandler('previoustrack', () => load(idx - 1, true));
  }
  load(0, false);
})();
