import { initScene } from './scene.js';

const gsap = window.gsap;
const ScrollTrigger = window.ScrollTrigger;
gsap.registerPlugin(ScrollTrigger);

const mobile = matchMedia('(max-width: 900px)').matches;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(pointer: fine)').matches;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

document.body.classList.add('loading');
const header = $('.site-header');
const burger = $('.burger');

/* ---------- Smooth scroll ---------- */
let lenis = null;
if (!reduced && window.Lenis) {
  lenis = new window.Lenis({ lerp: 0.09, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  lenis.stop();
}
$$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
  const id = a.getAttribute('href');
  if (id.length < 2) return;
  const el = $(id); if (!el) return;
  e.preventDefault();
  header.classList.remove('menu-open'); burger.setAttribute('aria-expanded', 'false');
  lenis ? lenis.scrollTo(el, { duration: 1.8 }) : el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
}));

/* ---------- 3D scene ---------- */
let scene = null;
try {
  scene = initScene({
    canvas: $('#webgl'), cssRoot: $('#css3d'),
    orbitCards: $$('.oc'), chips: $$('[data-chip]'), colLabels: $$('[data-collabel]'), panels: $$('.sp'), pings: $$('.gping'),
    mobile, reduced,
  });
} catch (err) { console.warn('3D scene unavailable', err); }

// scene number = how many [data-stage] sections have scrolled in (continuous)
const stageEls = $$('[data-stage]');
function computeStage() {
  const vh = innerHeight; let s = 0;
  for (const el of stageEls) s += clamp((vh * 0.8 - el.getBoundingClientRect().top) / (vh * 0.6), 0, 1);
  return s;
}

const fragEl = $('#fragmented');
gsap.ticker.add(() => {
  const s = computeStage();
  if (scene) scene.state.fragOut = clamp(-fragEl.getBoundingClientRect().top / (innerHeight * 0.5), 0, 1);   // page 2 scrolling away after its pin
  if (!scene) return; scene.state.target = s; scene.tick();
});

/* ---------- Split headings ---------- */
$$('[data-split]').forEach((el) => {
  const walk = (node) => {
    [...node.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
          const w = document.createElement('span'); w.className = 'w';
          const wi = document.createElement('span'); wi.className = 'wi'; wi.textContent = part;
          w.appendChild(wi); frag.appendChild(w);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n);
    });
  };
  walk(el);
});
$$('[data-split] em').forEach((em) => { em.style.background = 'none'; em.style.color = 'inherit'; });
$$('[data-split] em .wi').forEach((wi) => {
  wi.style.background = 'var(--grad-text)';
  wi.style.webkitBackgroundClip = 'text'; wi.style.backgroundClip = 'text'; wi.style.color = 'transparent';
});

/* ---------- Header ---------- */
burger.addEventListener('click', () => {
  const open = header.classList.toggle('menu-open');
  burger.setAttribute('aria-expanded', String(open));
});
$('.offer-close').addEventListener('click', () => $('.offer-bar').classList.add('closed'));
let lastY = 0;
ScrollTrigger.create({
  start: 0, end: 'max',
  onUpdate: (self) => {
    const y = self.scroll();
    header.classList.toggle('scrolled', y > 40);
    header.classList.toggle('hide', y > lastY && y > 300 && !header.classList.contains('menu-open'));
    lastY = y;
  },
});

/* ---------- Hero: rotating word + band ---------- */
const rot = $('.rotator');
const words = $$('.rw', rot);
let wi = 0;
// every rotating word stays the same size as the rest of the headline: if the longest word wouldn't fit
// beside "Every" (before the 3D shape), the whole headline scales down together; width includes the italic overhang
const heroTitle = rot.closest('.hero-title');
const sizeRot = () => {
  heroTitle.style.fontSize = '';
  const avail = (mobile ? innerWidth - 32 : innerWidth * 0.53) - rot.getBoundingClientRect().left;
  const longest = Math.max(...words.map((w) => w.getBoundingClientRect().width));
  if (longest > avail) heroTitle.style.fontSize = (parseFloat(getComputedStyle(heroTitle).fontSize) * avail / longest).toFixed(1) + 'px';
  rot.style.width = words[wi].getBoundingClientRect().width + parseFloat(getComputedStyle(rot).paddingRight) + 'px';
};
function nextWord() {
  const cur = words[wi]; wi = (wi + 1) % words.length; const nxt = words[wi];
  cur.classList.remove('on');
  gsap.fromTo(cur, { yPercent: 0, opacity: 1 }, { yPercent: -100, opacity: 0, duration: 0.6, ease: 'power3.in' });
  nxt.classList.add('on');
  gsap.fromTo(nxt, { yPercent: 100, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.8, delay: 0.35, ease: 'expo.out' });
  sizeRot();
}
addEventListener('resize', sizeRot);
const hb = $('.hb-track'); hb.innerHTML += hb.innerHTML;

/* ---------- Loader → intro ---------- */
function runLoader() {
  const count = $('.loader-count'), bar = $('.loader-bar span'), o = { v: 0 };
  gsap.timeline({ onComplete: intro })
    .to(o, { v: 100, duration: reduced ? 0.2 : 1.2, ease: 'power2.inOut', onUpdate: () => { count.textContent = Math.round(o.v); bar.style.width = o.v + '%'; } })
    .to('#loader', { yPercent: -100, duration: reduced ? 0.2 : 1, ease: 'expo.inOut' }, '+=0.1')
    .set('#loader', { display: 'none' });
}
function intro() {
  document.body.classList.remove('loading');
  lenis && lenis.start();
  sizeRot();
  if (scene) gsap.to(scene.state, { intro: 1, duration: reduced ? 0.1 : 2.4, ease: 'power2.out' });
  gsap.timeline()
    .from('.nav > *', { y: -20, opacity: 0, duration: 0.8, stagger: 0.08, ease: 'power3.out' }, 0)
    .from('.hero-live', { y: 20, opacity: 0, duration: 0.8, ease: 'power3.out' }, 0.2)
    .from('.hero-title .li', { yPercent: 110, duration: 1.3, stagger: 0.12, ease: 'expo.out' }, 0.35)
    .from('.hero-lead', { y: 24, opacity: 0, duration: 1, ease: 'power3.out' }, 0.8)
    .from('.hero-ctas > *', { y: 24, opacity: 0, duration: 0.9, stagger: 0.08, ease: 'power3.out' }, 0.95)
    .from('.hero-trust li', { y: 12, opacity: 0, duration: 0.7, stagger: 0.06, ease: 'power3.out' }, 1.1)
    .from('.oc-in', { scale: 0.7, opacity: 0, duration: 1.1, stagger: 0.08, ease: 'expo.out' }, 0.6)
    .from('.hero-band', { yPercent: 100, duration: 1, ease: 'expo.out' }, 1.0);
  if (!reduced) setInterval(() => { if (!document.hidden) nextWord(); }, 2400);
}

/* ---------- Hero → Ecosystem: copy lifts away, orb dissolves into particles ---------- */
gsap.timeline({
  scrollTrigger: {
    trigger: '#hero', start: 'top top', end: mobile ? '+=90%' : '+=130%', scrub: 1, pin: true,
    onUpdate: (self) => { if (scene) scene.state.hero = self.progress; },
  },
})
  .to('.hero-copy', { y: -120, opacity: 0, duration: 1, ease: 'power2.in' }, 0)
  .to('.hero-band', { opacity: 0, duration: 0.4 }, 0)
  .to({}, { duration: 1.6 });

/* ---------- Scene 2: problem → fix → how (pinned) ----------
   act 1 (0–.34): the problem; each card gets a red-ink problem stamp, the particles leave
   act 2 (.36–.66): "Qura puts it back together", cards fly into a three-column board and flip to their fixed side
   act 3 (.66–1): the columns are named after the module that fixed them (scene.js reads state.frag) */
const blurIn = { opacity: 0, y: 50, filter: 'blur(12px)' };
const blurOn = { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1, ease: 'power2.out' };
const blurOut = { opacity: 0, y: -50, filter: 'blur(12px)', duration: 1, ease: 'power2.in' };
gsap.timeline({
  scrollTrigger: {
    trigger: '#fragmented', start: 'top top', end: mobile ? '+=240%' : '+=320%', scrub: 1, pin: true,
    onUpdate: (self) => { if (scene) { scene.state.frag = self.progress; scene.state.fragExit = clamp((self.progress - 0.16) / 0.24, 0, 1); } },
  },
})
  .fromTo('.frag-line[data-i="0"]', blurIn, blurOn, 0)
  .to('.frag-line[data-i="0"]', blurOut, 1.5)
  .set('.frag-line[data-i="1"]', { opacity: 1 }, 1.9)
  .fromTo('.frag-three > span', { opacity: 0, y: 40, filter: 'blur(10px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.6, stagger: 0.35, ease: 'power2.out' }, 1.9)
  .to('.frag-line[data-i="1"]', blurOut, 3.2)
  .fromTo('.frag-line[data-i="2"]', blurIn, blurOn, 3.7)
  .fromTo('.frag-line[data-i="3"]', blurIn, blurOn, 6.8)
  .to({}, { duration: 2.2 });

/* ---------- Reveals ---------- */
$$('.reveal').forEach((el) => {
  gsap.from(el, { y: 40, opacity: 0, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none reverse' } });
});
$$('[data-split]').forEach((el) => {
  gsap.from($$('.wi', el), { yPercent: 110, duration: 1.1, stagger: 0.05, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none reverse' } });
});

/* ---------- Counters ---------- */
$$('[data-count]').forEach((el) => {
  const end = +el.dataset.count, suf = el.dataset.suffix || '', o = { v: 0 };
  ScrollTrigger.create({
    trigger: el, start: 'top 90%', once: true,
    onEnter: () => gsap.to(o, { v: end, duration: 2, ease: 'power3.out', onUpdate: () => (el.textContent = Math.round(o.v).toLocaleString('en-GB') + suf) }),
  });
});

/* ---------- Scene 6: live marketplace ticker (beside the film) ---------- */
// [title, sector (optional), place, closes-in days]; the blurred tail mimics the locked full title
const pool = [
  ['Procurement for Additional NHS', '', 'Cardiff', 30],
  ['Flexible Framework Agreement', 'Mental Health & Substance Misuse', 'Ayr', 30],
  ['Community Smoking Cessation', '', 'Wolverhampton', 28],
  ['Smoking Cessation', '', 'Wolverhampton', 26],
  ['BME Mental Health', 'Mental Health & Substance Misuse', 'Cardiff', 23],
  ['Fully Managed Renal Services', 'Renal', 'London', 29],
  ['Radiography Workforce Supply', 'Diagnostics', 'Dublin', 18],
  ['SEND Teaching Assistants', 'SEND & Care', 'Manchester', 21],
  ['Registered Nurses, ICU', '', 'Sydney', 14],
];
const list = $('#liveList');
let pi = 0;
const li = ([t, sec, place, d]) => {
  const el = document.createElement('li');
  el.innerHTML = `<i class="ld"></i><div class="lt"><b>${t} <span class="lock">provision of specialist services</span></b>`
    + `<small>${sec ? `<em>${sec}</em> · ` : ''}${place} <span class="lock">commissioning organisation</span></small></div>`
    + `<div class="lc"><small>Closes</small><b>in ${d} days</b></div>`;
  return el;
};
for (let k = 0; k < 5; k++) list.appendChild(li(pool[pi++ % pool.length]));
setInterval(() => {
  if (document.hidden) return;
  const el = li(pool[pi++ % pool.length]);
  list.prepend(el);
  gsap.from(el, { height: 0, opacity: 0, paddingTop: 0, paddingBottom: 0, marginBottom: 0, duration: 0.7, ease: 'power3.out' });
  gsap.fromTo(el, { boxShadow: '0 0 0 1px rgba(0,194,184,.8), 0 0 22px rgba(0,194,184,.45)' }, { boxShadow: '0 0 0 1px rgba(0,194,184,0), 0 0 0 rgba(0,194,184,0)', duration: 2.2 });
  const last = list.lastElementChild;
  gsap.to(last, { opacity: 0, duration: 0.4, onComplete: () => last.remove() });
  const n = 63 + Math.floor(Math.random() * 6);
  $$('.live-n').forEach((x) => (x.textContent = n));
}, 3200);

/* ---------- Scene 6: the film. Frame swings up flat, lenses pop, the board slides in ---------- */
const filmTl = gsap.timeline({
  scrollTrigger: mobile
    ? { trigger: '#film', start: 'top 80%', end: 'top 20%', scrub: 1 }
    : { trigger: '#film', start: 'top top', end: '+=120%', scrub: 1, pin: true, refreshPriority: -1 },   // after the verified pin above it
});
filmTl
  .fromTo('.film-head', { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6 }, 0)
  .fromTo('.film-frame', { rotationX: 28, rotationY: -10, scale: 0.78, y: 160, opacity: 0, transformPerspective: 1600 },
    { rotationX: 0, rotationY: 0, scale: 1, y: 0, opacity: 1, duration: 1.4, ease: 'power2.out' }, 0.1)
  .fromTo('.film-title', { y: 40, opacity: 0, filter: 'blur(10px)' }, { y: 0, opacity: 1, filter: 'blur(0px)', duration: 0.6 }, 0.9)
  .fromTo('.lens span', { y: 26, opacity: 0, scale: 0.8 }, { y: 0, opacity: 1, scale: 1, duration: 0.4, stagger: 0.09, ease: 'back.out(2)' }, 1.15)
  .fromTo('.film-play', { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.45, ease: 'back.out(2.2)' }, 1.5)
  .fromTo('.live-board', { x: 140, rotationY: -24, opacity: 0, transformPerspective: 1600 },
    { x: 0, rotationY: 0, opacity: 1, duration: 1.1, ease: 'power2.out' }, 0.7)
  .fromTo('.live-cta', { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4 }, 1.8)
  .to({}, { duration: 0.6 });

const video = $('#filmVideo'), poster = $('.film-poster'), note = $('.film-note');
$('.film-play').addEventListener('click', async () => {
  try {
    if (video.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) throw new Error('no video file');
    await video.play();
    video.controls = true;
    gsap.to(poster, { opacity: 0, scale: 1.04, duration: 0.6, ease: 'power2.inOut', onComplete: () => (poster.style.display = 'none') });
  } catch {
    note.textContent = 'Video file not added yet (assets/qura-overview.mp4)';
    gsap.fromTo(note, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.4 });
  }
});

/* ---------- Scene 7: community cards rise in 3D, photos settle ---------- */
gsap.fromTo('.way', { y: 120, rotationX: 22, opacity: 0, transformPerspective: 1400, transformOrigin: '50% 100%' },
  { y: 0, rotationX: 0, opacity: 1, duration: 1.2, stagger: 0.14, ease: 'expo.out', scrollTrigger: { trigger: '.ways', start: 'top 85%', toggleActions: 'play none none reverse' } });
$$('.way-photo img').forEach((img) => {
  gsap.fromTo(img, { scale: 1.25, yPercent: -6 }, { scale: 1.02, yPercent: 0, ease: 'none', scrollTrigger: { trigger: img, start: 'top bottom', end: 'bottom 35%', scrub: true } });
});

/* ---------- Scene 4: the handover sheet fills in, line by line ---------- */
ScrollTrigger.create({
  trigger: '#night', start: 'top 55%',
  onEnter: () => {
    gsap.fromTo('#spNight .sh-log li', { opacity: 0, x: -24 }, { opacity: 1, x: 0, duration: 0.6, stagger: 0.22, ease: 'power3.out' });
    gsap.fromTo('#spNight .tick', { scale: 0 }, { scale: 1, duration: 0.4, stagger: 0.22, delay: 0.35, ease: 'back.out(3)' });
    gsap.fromTo('#spNight .stamp-ink', { scale: 2.2, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.45, delay: 0.9, ease: 'back.out(2)' });
  },
});

/* ---------- Scene 5: the email arrives, roles slot in ---------- */
ScrollTrigger.create({
  trigger: '#morning', start: 'top 55%',
  onEnter: () => {
    gsap.fromTo('#spMorning .ml-new', { scale: 0 }, { scale: 1, duration: 0.5, ease: 'back.out(3)' });
    gsap.fromTo('#spMorning .ml-roles li', { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.18, delay: 0.2, ease: 'power3.out' });
  },
});

/* ---------- Scene 3: verification (pinned on desktop) ---------- */
const mm = gsap.matchMedia();
mm.add('(min-width: 901px)', () => {
  const v = gsap.timeline({ scrollTrigger: { trigger: '#verified', start: 'top top', end: '+=180%', pin: true, scrub: 1 } });
  v.fromTo('.vcard', { rotationY: -30, rotationX: 12, y: 40, opacity: 0.3 }, { rotationY: 0, rotationX: 0, y: 0, opacity: 1, duration: 4, ease: 'none' }, 0)
    .to('.vbar span', { scaleX: 1, duration: 4, ease: 'none' }, 0);
  $$('.vstep').forEach((st, k) => {
    v.to(st, { opacity: 1, duration: 0.4 }, k)
      .to($$('.vchecks i')[k], { '--k': 1, duration: 0.3, ease: 'back.out(3)' }, k + 0.3)
      .to($$('.vchecks li')[k], { color: '#101d38', duration: 0.3 }, k + 0.3);
    if (k < 3) v.to(st, { opacity: 0.45, duration: 0.3 }, k + 0.85);
  });
  v.to('.stamp', { opacity: 1, scale: 1, duration: 0.35, ease: 'back.out(2)' }, 3.7)
    .fromTo('.vcard-glare', { x: '-60%' }, { x: '60%', duration: 0.8 }, 3.6)
    .to({}, { duration: 0.6 });
});
mm.add('(max-width: 900px)', () => {
  gsap.set('.vchecks i', { '--k': 1 });
  gsap.set('.vbar span', { scaleX: 1 });
  gsap.set('.stamp', { opacity: 1, scale: 1 });
});

/* ---------- Cursor + magnetic ---------- */
if (fine && !reduced) {
  const dot = $('.cursor-dot'), ring = $('.cursor-ring');
  const dx = gsap.quickTo(dot, 'x', { duration: 0.1 }), dy = gsap.quickTo(dot, 'y', { duration: 0.1 });
  const rx = gsap.quickTo(ring, 'x', { duration: 0.45, ease: 'power3' }), ry = gsap.quickTo(ring, 'y', { duration: 0.45, ease: 'power3' });
  addEventListener('pointermove', (e) => { dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY); });
  $$('a, button').forEach((el) => {
    el.addEventListener('pointerenter', () => ring.classList.add('hover'));
    el.addEventListener('pointerleave', () => ring.classList.remove('hover'));
  });
  $$('.magnetic').forEach((el) => {
    const mx = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3' }), my = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3' });
    el.addEventListener('pointermove', (e) => { const r = el.getBoundingClientRect(); mx((e.clientX - r.left - r.width / 2) * 0.3); my((e.clientY - r.top - r.height / 2) * 0.4); });
    el.addEventListener('pointerleave', () => { mx(0); my(0); });
  });
} else {
  $$('.cursor-dot, .cursor-ring').forEach((el) => (el.style.display = 'none'));
}

/* ---------- Go ---------- */
addEventListener('load', () => ScrollTrigger.refresh());
document.fonts?.ready.then(() => { sizeRot(); ScrollTrigger.refresh(); });
runLoader();

/* ---------- Offer strip: rises in, the 12 counts up, days-left countdown ---------- */
gsap.fromTo('.offer-strip', { y: 60, opacity: 0 },
  { y: 0, opacity: 1, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: '.offer', start: 'top 88%', toggleActions: 'play none none reverse' } });
gsap.fromTo('.os-copy > *', { y: 20, opacity: 0 },
  { y: 0, opacity: 1, duration: 0.8, stagger: 0.08, delay: 0.15, ease: 'power3.out', scrollTrigger: { trigger: '.offer', start: 'top 88%', toggleActions: 'play none none reverse' } });
const obNum = $('.ob-num'), obCount = { v: 1 };
ScrollTrigger.create({
  trigger: '.offer', start: 'top 80%',
  onEnter: () => gsap.fromTo(obCount, { v: 1 }, { v: 12, duration: 1.4, ease: 'power3.out', onUpdate: () => (obNum.textContent = Math.round(obCount.v)) }),
});
// days left, and a bar showing how much of the offer window remains (window opened 22 September 2026, the launch)
const OFFER_END = new Date(2026, 11, 31), OFFER_START = new Date(2026, 8, 22);
const daysLeft = Math.max(0, Math.ceil((OFFER_END - new Date()) / 864e5));
$('.oc-days').textContent = daysLeft;
$('.os-bar').style.setProperty('--left', (clamp((OFFER_END - new Date()) / (OFFER_END - OFFER_START), 0, 1) * 100).toFixed(1) + '%');
