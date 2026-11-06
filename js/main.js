/* Qura — product-led redesign
   Natural scrolling everywhere, with two choreographed moments:
   1. scattered records → connected platform (#platform)
   2. night → morning (#overnight)                                  */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const seg = (p, a, b) => clamp((p - a) / (b - a));
  const ease = (t) => 1 - Math.pow(1 - t, 3);
  const lerp = (a, b, t) => a + (b - a) * t;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGsap = !!(window.gsap && window.ScrollTrigger);
  const desktop = () => innerWidth > 1080;
  if (hasGsap) gsap.registerPlugin(ScrollTrigger);

  /* ---------- header ---------- */
  const header = $('.site-header');
  const onScroll = () => header.classList.toggle('scrolled', scrollY > 24);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ---------- platform film: plays only when the visitor chooses ---------- */
  const player = $('[data-player]');
  if (player) {
    const v = $('video', player), fill = $('[data-fill]', player), time = $('[data-time]', player), msg = $('[data-msg]', player);
    const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
    const say = (t) => { msg.textContent = t; msg.classList.toggle('on', !!t); if (t) setTimeout(() => msg.classList.remove('on'), 3200); };
    const sync = () => {
      player.classList.toggle('playing', !v.paused);
      player.classList.toggle('muted', v.muted);
      $('[data-toggle]', player).setAttribute('aria-label', v.paused ? 'Play' : 'Pause');
      $('[data-mute]', player).setAttribute('aria-label', v.muted ? 'Unmute' : 'Mute');
    };
    const play = () => {
      if (!player.classList.contains('started')) { v.currentTime = 0; player.classList.add('started'); }
      v.play().catch(() => say('The film could not start. Check your connection and try again.'));
    };
    $('[data-play]', player).addEventListener('click', () => { play(); $('[data-toggle]', player).focus({ preventScroll: true }); });
    $('[data-toggle]', player).addEventListener('click', () => (v.paused ? play() : v.pause()));
    $('[data-mute]', player).addEventListener('click', () => { v.muted = !v.muted; sync(); });
    $('[data-track]', player).addEventListener('click', (e) => {
      const r = e.currentTarget.getBoundingClientRect();
      if (v.duration) v.currentTime = clamp((e.clientX - r.left) / r.width) * v.duration;
    });
    v.addEventListener('timeupdate', () => {
      if (!v.duration) return;
      fill.style.width = (v.currentTime / v.duration) * 100 + '%';
      time.textContent = `${fmt(v.currentTime)} / ${fmt(v.duration)}`;
    });
    ['play', 'pause', 'volumechange'].forEach((e) => v.addEventListener(e, sync));
    v.addEventListener('ended', () => { player.classList.remove('started'); sync(); });
    v.addEventListener('error', () => say('The film is unavailable right now.'));
    // pause when scrolled well out of view
    new IntersectionObserver(([en]) => { if (!en.isIntersecting && !v.paused) v.pause(); }, { threshold: 0.15 }).observe(player);
    sync();
  }

  /* ---------- hero: rotating word ---------- */
  const rot = $('.rot');
  if (rot) {
    const words = $$('.rw', rot);
    let cur = 0;
    const fit = () => { rot.style.width = words[cur].getBoundingClientRect().width + 'px'; };
    fit();
    if (document.fonts) document.fonts.ready.then(fit);
    addEventListener('resize', fit);
    setInterval(() => {
      if (document.hidden) return;
      const prev = words[cur];
      cur = (cur + 1) % words.length;
      prev.classList.remove('on'); prev.classList.add('out');
      words[cur].classList.remove('out'); words[cur].classList.add('on');
      setTimeout(() => prev.classList.remove('out'), 650);
      fit();
    }, 2600);
  }

  /* ---------- film: frame settles to full size as it arrives ---------- */
  if (hasGsap && !reduced) {
    gsap.fromTo('#showcase', { scale: 0.92 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '.showcase-frame', start: 'top 95%', end: 'top 25%', scrub: true } });
  }

  /* =========================================================
     PROBLEM → FIX → HOW
     Act 1  scattered records get red problem stamps
     Act 2  they fly into a three-column board and flip to their fixed side
     Act 3  each column is named after the Qura module that fixed it
     ========================================================= */
  const frag = $('.frag');
  const pin = $('.frag-pin');
  const cards = $$('.fc', frag);
  const lines = $$('.fl', frag);
  const labels = $$('.colbl', frag);
  const threeSpans = $$('.frag-three span', frag);
  // scattered start, as a fraction of the free area (x, y) plus rotation
  const SCAT = [
    [0.02, 0.42, -8], [0.10, 0.95, 6],             // clinicians
    [0.18, 0.02, 4], [0.34, 1.0, -5], [0.64, 0.98, 7], // providers
    [0.78, 0.0, -6], [0.98, 0.44, 5], [0.90, 0.92, -4], // suppliers
  ];
  let geo = null;

  function layoutFrag() {
    const W = pin.clientWidth, H = pin.clientHeight;
    const nav = 64, cw = Math.min(264, (W - 120 - 2 * 36) / 3), ch = 96, gx = 36;
    cards.forEach((c) => (c.style.width = cw + 'px'));
    const topLine = lines[2];
    const tlBottom = topLine.offsetTop + topLine.offsetHeight;
    const labelsY = tlBottom + 26;
    const boardY = labelsY + 52;
    const avail = H - 110 - boardY;
    const step = Math.max(ch + 6, Math.min(ch + 16, (avail - ch) / 2));
    const x0 = W / 2 - (3 * cw + 2 * gx) / 2;
    geo = {
      W, H, cw, ch,
      slots: cards.map((c) => {
        const col = +c.dataset.col, row = +c.dataset.row;
        return { x: x0 + col * (cw + gx), y: boardY + row * step };
      }),
      from: cards.map((c, i) => {
        const [fx, fy, r] = SCAT[i];
        return { x: 16 + fx * (W - cw - 32), y: nav + 30 + fy * (H - nav - 30 - ch - 40), r };
      }),
    };
    labels.forEach((l) => {
      const col = +l.dataset.col;
      l.style.transform = `translate(${x0 + col * (cw + gx)}px, ${labelsY}px)`;
    });
  }

  function renderFrag(p) {
    if (!geo) return;
    // headlines
    const vis = [
      Math.min(seg(p, -0.05, 0.0), 1 - seg(p, 0.16, 0.2)),
      Math.min(seg(p, 0.2, 0.23), 1 - seg(p, 0.36, 0.4)),
      seg(p, 0.41, 0.46),
      seg(p, 0.78, 0.84),
    ];
    lines.forEach((l, i) => {
      l.style.opacity = vis[i].toFixed(3);
      const dy = (1 - vis[i]) * 18;
      l.style.transform = l.classList.contains('top') || l.classList.contains('bottom')
        ? `translate(-50%, ${dy}px)` : `translate(-50%, calc(-50% + ${dy}px))`;
      l.style.visibility = vis[i] > 0.001 ? 'visible' : 'hidden';
    });
    threeSpans.forEach((s, i) => s.style.setProperty('--o', ease(seg(p, 0.21 + i * 0.035, 0.25 + i * 0.035)).toFixed(3)));
    // cards
    cards.forEach((c, k) => {
      const f = geo.from[k], t = geo.slots[k];
      const fly = ease(seg(p, 0.4 + k * 0.014, 0.55 + k * 0.014));
      const bob = (1 - fly) * Math.sin(p * 14 + k * 1.7) * 8;
      const x = lerp(f.x, t.x, fly), y = lerp(f.y, t.y, fly) + bob;
      const r = lerp(f.r, 0, fly);
      const lift = Math.sin(fly * Math.PI) * 0.06; // a little lift mid-flight
      c.style.transform = `translate(${x}px, ${y}px) rotate(${r}deg) scale(${1 + lift})`;
      c.style.setProperty('--st', ease(seg(p, 0.03 + k * 0.016, 0.06 + k * 0.016)).toFixed(3));
      c.style.setProperty('--flip', ease(seg(p, 0.52 + k * 0.018, 0.62 + k * 0.018)).toFixed(3));
      c.style.zIndex = fly > 0 && fly < 1 ? 5 : 2;
    });
    // column labels: names first, then the module that fixed them
    labels.forEach((l) => {
      l.style.opacity = seg(p, 0.6, 0.66).toFixed(3);
      l.style.setProperty('--mod', ease(seg(p, 0.68, 0.76)).toFixed(3));
    });
  }

  function staticFrag() {
    frag.classList.add('static');
    cards.forEach((c) => {
      const s = $('.stamp', c);
      if (s && !$('.was', c)) {
        const was = document.createElement('small');
        was.className = 'was'; was.textContent = 'Before: ' + s.textContent;
        $('.back', c).appendChild(was);
      }
    });
  }

  if (frag) {
    if (hasGsap && !reduced && desktop()) {
      ScrollTrigger.create({
        trigger: frag, pin: pin, start: 'top top', end: '+=300%', scrub: 0.6,
        onRefresh: (st) => { layoutFrag(); renderFrag(st.progress); },
        onUpdate: (st) => renderFrag(st.progress),
      });
      layoutFrag(); renderFrag(0);
    } else {
      staticFrag();
    }
  }

  /* =========================================================
     AUDIENCE PANELS — click, keyboard and hover
     ========================================================= */
  const panels = $$('.panel');
  const tabs = panels.map((p) => $('.panel-tab', p));
  function openPanel(i, focus) {
    panels.forEach((p, j) => {
      const on = i === j;
      p.classList.toggle('is-open', on);
      tabs[j].setAttribute('aria-selected', on);
      tabs[j].tabIndex = on ? 0 : -1;
      $('.panel-body', p).toggleAttribute('inert', !on);
    });
    if (focus) tabs[i].focus();
  }
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => openPanel(i));
    t.addEventListener('keydown', (e) => {
      const n = tabs.length;
      const map = { ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1, ArrowUp: i - 1, Home: 0, End: n - 1 };
      if (e.key in map) { e.preventDefault(); openPanel((map[e.key] + n) % n, true); }
    });
  });
  // the open panel's tab ignores pointer events, so keep it focusable via its body
  if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
    let hoverT;
    panels.forEach((p, i) => {
      p.addEventListener('mouseenter', () => { clearTimeout(hoverT); hoverT = setTimeout(() => { if (innerWidth > 760) openPanel(i); }, 140); });
      p.addEventListener('mouseleave', () => clearTimeout(hoverT));
    });
  }
  openPanel(0);

  /* =========================================================
     NIGHT → MORNING
     ========================================================= */
  const day = $('.day');
  const consoleEl = $('.console');
  const opp = $('[data-opp]');
  const logItems = $$('.cn-log li');
  const counters = $$('[data-count-night]');
  const clockEl = $('[data-clock]');
  let oppNight = 0, oppMorning = 0;

  function measureOpp() {
    const cr = consoleEl.getBoundingClientRect();
    const log = $('.cn-log').getBoundingClientRect();
    const label = $('.cm-label').getBoundingClientRect();
    oppNight = log.bottom - cr.top + 14;
    oppMorning = label.bottom - cr.top + 8;
  }
  const fmtClock = (mins) => `${String(Math.floor(mins / 60) % 24).padStart(2, '0')}:${String(Math.floor(mins % 60)).padStart(2, '0')}`;

  function renderDay(p) {
    // 0–.30 night work · .36–.72 night becomes morning · .74–.9 next actions
    const m = ease(seg(p, 0.36, 0.72));
    day.style.setProperty('--m', m.toFixed(3));
    day.classList.toggle('is-morning', m > 0.5);
    logItems.forEach((li, i) => li.style.setProperty('--li', seg(p, 0.02 + i * 0.055, 0.06 + i * 0.055).toFixed(3)));
    counters.forEach((c) => { c.textContent = Math.round(+c.dataset.countNight * ease(seg(p, 0.0, 0.3))).toLocaleString('en-GB'); });
    const found = seg(p, 0.12, 0.18);
    opp.style.opacity = found.toFixed(3);
    opp.style.setProperty('--oy', lerp(oppNight, oppMorning, m) + 'px');
    opp.style.setProperty('--act', ease(seg(p, 0.74, 0.88)).toFixed(3));
    // clock: 23:10 → 02:14 during night work, then on to 07:00
    const night = lerp(23 * 60 + 10, 26 * 60 + 14, seg(p, 0, 0.18));
    clockEl.textContent = fmtClock(p < 0.36 ? night : lerp(26 * 60 + 14, 31 * 60, m));
  }

  if (day) {
    if (hasGsap && !reduced && desktop()) {
      ScrollTrigger.create({
        trigger: day, pin: '.day-pin', start: 'top top', end: '+=210%', scrub: 0.6,
        onRefresh: (st) => { measureOpp(); renderDay(st.progress); },
        onUpdate: (st) => renderDay(st.progress),
      });
    } else {
      // static: show the morning result, the night log stays readable in the copy
      const show = () => { measureOpp(); renderDay(1); };
      show(); addEventListener('resize', show);
    }
  }

  /* ---------- offer: days left ---------- */
  const daysEl = $('[data-days]');
  if (daysEl) {
    const end = new Date(2026, 11, 31, 23, 59, 59);
    const d = Math.max(0, Math.ceil((end - new Date()) / 864e5));
    daysEl.textContent = d;
  }

  /* ---------- light reveals ---------- */
  const rv = $$('.aud-head, .offer-card, .proof, .close-main, .settings-row');
  if (!reduced && 'IntersectionObserver' in window) {
    rv.forEach((el) => el.classList.add('rv'));
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.15 });
    rv.forEach((el) => io.observe(el));
  }

  // fonts change measurements; refresh pins once they are in
  if (hasGsap && document.fonts) document.fonts.ready.then(() => ScrollTrigger.refresh());
})();
