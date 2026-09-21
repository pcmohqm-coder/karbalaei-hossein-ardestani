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

/* Audio library v14 — reference-style player with waveform, speed, volume, download and favorite controls. */
(() => {
  const cards = [...document.querySelectorAll('[data-audio-card]')];
  if (!cards.length) return;
  let active = null;
  const format = v => { if (!Number.isFinite(v)) return '00:00'; const m=Math.floor(v/60).toString().padStart(2,'0'); const s=Math.floor(v%60).toString().padStart(2,'0'); return `${m}:${s}`; };
  const ui = (card, playing) => {
    card.classList.toggle('is-playing', playing);
    card.querySelectorAll('.main-play-pro,.cover-play-pro').forEach(b => { b.disabled=false; b.textContent=playing?'Ⅱ':'▶'; });
    const mode=card.querySelector('.mode-pro'); if(mode) mode.textContent=playing?'در حال پخش':'حالت پخش';
  };
  cards.forEach(card => {
    const src=card.dataset.src; if(!src) return;
    const audio=new Audio(src); audio.preload='metadata'; audio.volume=1;
    const playBtns=card.querySelectorAll('.main-play-pro,.cover-play-pro');
    const wave=card.querySelector('.wave-pro'), fill=card.querySelector('.wave-fill');
    const current=card.querySelector('.current-time'), total=card.querySelector('.total-time');
    const volume=card.querySelector('.volume-pro input'), speed=card.querySelector('.speed-pro');
    const reset=card.querySelector('.reset-pro'), fav=card.querySelector('.favorite-pro');
    const bars=[...card.querySelectorAll('.wave-pro i')];
    const play=async()=>{ if(active&&active!==audio){active.pause();ui(active._card,false);} try{await audio.play();active=audio;audio._card=card;ui(card,true);}catch(e){ui(card,false);} };
    const pause=()=>{audio.pause();ui(card,false);};
    audio.addEventListener('loadedmetadata',()=>{playBtns.forEach(b=>b.disabled=false);if(total)total.textContent=format(audio.duration);});
    audio.addEventListener('timeupdate',()=>{const r=audio.duration?audio.currentTime/audio.duration:0;if(current)current.textContent=format(audio.currentTime);if(fill)fill.style.width=`${r*100}%`;if(wave){wave.setAttribute('aria-valuenow',Math.round(r*100));bars.forEach((b,i)=>b.style.background=i/bars.length<=r?'#c8a65d':'#554b42');}});
    audio.addEventListener('play',()=>ui(card,true));
    audio.addEventListener('pause',()=>{if(!audio.ended)ui(card,false);});
    audio.addEventListener('ended',()=>{ui(card,false);audio.currentTime=0;if(current)current.textContent='00:00';if(fill)fill.style.width='0%';active=null;bars.forEach(b=>b.style.background='#554b42');});
    playBtns.forEach(b=>b.addEventListener('click',()=>audio.paused?play():pause()));
    if(wave){const seek=e=>{if(!Number.isFinite(audio.duration))return;const r=wave.getBoundingClientRect();const x=Math.max(0,Math.min(r.width,e.clientX-r.left));audio.currentTime=(x/r.width)*audio.duration;};wave.addEventListener('click',seek);wave.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();audio.currentTime=Math.max(0,Math.min(audio.duration,audio.currentTime+(e.key==='ArrowRight'?5:-5)));}});}
    if(volume)volume.addEventListener('input',()=>audio.volume=Number(volume.value));
    if(speed)speed.addEventListener('click',()=>{const next=audio.playbackRate===1?1.25:audio.playbackRate===1.25?1.5:audio.playbackRate===1.5?.75:1;audio.playbackRate=next;speed.dataset.speed=next;speed.textContent=`${next}×`;});
    if(reset)reset.addEventListener('click',()=>{audio.currentTime=0;if(current)current.textContent='00:00';if(!audio.paused)play();});
    if(fav)fav.addEventListener('click',()=>{fav.classList.toggle('is-favorite');fav.firstChild.textContent=fav.classList.contains('is-favorite')?'♥ ':'♡ ';});
  });
})();
