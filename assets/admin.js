/* پنل انتشار پوستر — از GitHub API برای ثبت فایل در مخزن سایت استفاده می‌کند. */
(() => {
  const $ = s => document.querySelector(s);
  const API = 'https://api.github.com';
  const JSON_PATH = 'assets/posters/posters.json';
  let token = '', repo = '', branch = 'main', chosen = null, selDate = null, blob = null;

  const tehranToday = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Tehran' });
  const dayNum = iso => { const [y, m, d] = iso.split('-').map(Number); return Date.UTC(y, m - 1, d) / 864e5; };
  const addDays = (iso, n) => new Date((dayNum(iso) + n) * 864e5).toISOString().slice(0, 10);
  const jal = (iso, o) => new Intl.DateTimeFormat('fa-IR-u-ca-persian', { ...o, timeZone: 'UTC' }).format(new Date(iso + 'T12:00:00Z'));
  const say = (el, cls, t) => { el.innerHTML = ''; if (!t) return; const d = document.createElement('div'); d.className = 'msg ' + cls; d.textContent = t; el.appendChild(d); };

  const gh = async (path, opt = {}) => {
    const r = await fetch(API + path, { ...opt, headers: { Accept: 'application/vnd.github+json', Authorization: 'Bearer ' + token, 'Content-Type': 'application/json', ...(opt.headers || {}) } });
    if (r.status === 404 && opt.allow404) return null;
    if (!r.ok) { let m = r.status; try { m = (await r.json()).message || m; } catch {} throw new Error(m); }
    return r.json();
  };
  const b64 = str => btoa(unescape(encodeURIComponent(str)));
  const unb64 = s => decodeURIComponent(escape(atob(s.replace(/\n/g, ''))));

  const readDb = async () => {
    const f = await gh(`/repos/${repo}/contents/${JSON_PATH}?ref=${branch}`, { allow404: true });
    if (!f) return { sha: null, data: { posters: [] } };
    let data; try { data = JSON.parse(unb64(f.content)); } catch { data = { posters: [] }; }
    if (!Array.isArray(data.posters)) data.posters = [];
    return { sha: f.sha, data };
  };
  const writeDb = (data, sha, message) => gh(`/repos/${repo}/contents/${JSON_PATH}`, { method: 'PUT', body: JSON.stringify({ message, content: b64(JSON.stringify(data, null, 2) + '\n'), branch, ...(sha ? { sha } : {}) }) });
  const deleteFile = async (file) => {
    const f = await gh(`/repos/${repo}/contents/assets/posters/${file}?ref=${branch}`, { allow404: true });
    if (f) await gh(`/repos/${repo}/contents/assets/posters/${file}`, { method: 'DELETE', body: JSON.stringify({ message: 'حذف پوستر ' + file, sha: f.sha, branch }) });
  };

  /* ورود */
  const login = async () => {
    token = $('#token').value.trim(); repo = $('#repo').value.trim();
    const m = $('#login-msg');
    if (!token || !/^[\w.-]+\/[\w.-]+$/.test(repo)) return say(m, 'err', 'کلید و نام مخزن را درست وارد کنید.');
    say(m, 'info', 'در حال بررسی…');
    try {
      const info = await gh(`/repos/${repo}`);
      if (!info.permissions || !info.permissions.push) throw new Error('این کلید اجازه‌ی نوشتن در مخزن را ندارد.');
      branch = info.default_branch;
      if ($('#remember').checked) { try { localStorage.setItem('adm', JSON.stringify({ token, repo })); } catch {} }
      $('#login').hidden = true; $('#app').hidden = false; say(m, '', '');
      buildDays(); refresh();
    } catch (e) { say(m, 'err', 'ورود ناموفق بود: ' + e.message); }
  };
  $('#login-btn').onclick = login;
  $('#logout').onclick = () => { try { localStorage.removeItem('adm'); } catch {} location.reload(); };
  try { const s = JSON.parse(localStorage.getItem('adm') || 'null'); if (s) { $('#token').value = s.token; $('#repo').value = s.repo; $('#remember').checked = true; login(); } } catch {}

  /* انتخاب روز */
  const buildDays = () => {
    const box = $('#days'); box.innerHTML = '';
    const t = tehranToday();
    ['امروز', 'فردا', 'پس‌فردا'].forEach((n, i) => {
      const iso = addDays(t, i);
      const b = document.createElement('button'); b.type = 'button'; b.className = 'day'; b.setAttribute('aria-pressed', 'false');
      b.innerHTML = `<b>${n}</b><small>${jal(iso, { weekday: 'long' })}<br>${jal(iso, { day: 'numeric', month: 'long' })}</small>`;
      b.onclick = () => { selDate = iso; [...box.children].forEach(c => c.setAttribute('aria-pressed', String(c === b))); check(); };
      box.appendChild(b);
    });
  };
  const check = () => { $('#publish').disabled = !(selDate && blob); };

  /* انتخاب و فشرده‌سازی تصویر */
  $('#file').onchange = async e => {
    const f = e.target.files[0]; if (!f) return;
    const m = $('#pub-msg');
    try {
      const bmp = await createImageBitmap(f);
      const max = 1600, k = Math.min(1, max / Math.max(bmp.width, bmp.height));
      const c = document.createElement('canvas'); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
      const ctx = c.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height); ctx.drawImage(bmp, 0, 0, c.width, c.height);
      blob = c.toDataURL('image/jpeg', .86).split(',')[1];
      const p = $('#preview'); p.src = 'data:image/jpeg;base64,' + blob; p.hidden = false;
      $('#drop-text').textContent = 'تصویر انتخاب شد — برای تغییر دوباره کلیک کنید';
      say(m, '', ''); check();
    } catch { blob = null; say(m, 'err', 'این فایل به‌عنوان تصویر خوانده نشد.'); check(); }
  };

  /* فهرست */
  const refresh = async () => {
    const box = $('#current'); box.innerHTML = '';
    try {
      const { data } = await readDb(); const t = dayNum(tehranToday());
      const live = data.posters.filter(p => dayNum(p.date) >= t).sort((a, b) => a.date.localeCompare(b.date));
      if (!live.length) { box.innerHTML = '<small style="color:var(--muted)">پوستر فعالی وجود ندارد.</small>'; return; }
      live.forEach(p => {
        const r = document.createElement('div'); r.className = 'row';
        r.innerHTML = `<img alt=""><div><strong></strong><br><small></small></div><button class="del" type="button">حذف</button>`;
        r.querySelector('img').src = `assets/posters/${p.file}?t=${Date.now()}`;
        r.querySelector('strong').textContent = p.title || 'بدون عنوان';
        r.querySelector('small').textContent = jal(p.date, { weekday: 'long', day: 'numeric', month: 'long' });
        r.querySelector('.del').onclick = async ev => {
          if (!confirm('این پوستر حذف شود؟')) return;
          ev.target.disabled = true;
          try { const cur = await readDb(); cur.data.posters = cur.data.posters.filter(x => x.id !== p.id); await writeDb(cur.data, cur.sha, 'حذف پوستر'); await deleteFile(p.file); } catch (e) { alert('خطا: ' + e.message); }
          refresh();
        };
        box.appendChild(r);
      });
    } catch (e) { box.innerHTML = ''; say(box, 'err', 'خواندن فهرست ناموفق بود: ' + e.message); }
  };

  /* انتشار */
  $('#publish').onclick = async () => {
    const m = $('#pub-msg'), btn = $('#publish'); btn.disabled = true;
    try {
      say(m, 'info', 'در حال ارسال تصویر…');
      const id = Date.now().toString(36);
      const file = `${selDate}-${id}.jpg`;
      await gh(`/repos/${repo}/contents/assets/posters/${file}`, { method: 'PUT', body: JSON.stringify({ message: 'افزودن پوستر ' + selDate, content: blob, branch }) });
      say(m, 'info', 'در حال ثبت در فهرست…');
      const cur = await readDb(); const t = dayNum(tehranToday());
      const expired = cur.data.posters.filter(p => dayNum(p.date) < t);
      cur.data.posters = cur.data.posters.filter(p => dayNum(p.date) >= t);
      cur.data.posters.push({ id, file, date: selDate, title: $('#title').value.trim() });
      await writeDb(cur.data, cur.sha, 'انتشار اطلاعیه مراسم ' + selDate);
      for (const p of expired) { try { await deleteFile(p.file); } catch {} }
      say(m, 'ok', 'پوستر منتشر شد. ظرف یکی دو دقیقه روی سایت دیده می‌شود.');
      blob = null; selDate = null; $('#file').value = ''; $('#preview').hidden = true; $('#title').value = '';
      $('#drop-text').textContent = 'انتخاب تصویر پوستر (JPG یا PNG)';
      [...$('#days').children].forEach(c => c.setAttribute('aria-pressed', 'false'));
      refresh();
    } catch (e) { say(m, 'err', 'انتشار ناموفق بود: ' + e.message); }
    check();
  };
})();
