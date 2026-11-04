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
    orbitCards: $$('.oc'), chips: $$('[data-chip]'), panels: $$('.sp'),
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

// TEMP: scene number badge for review (remove before launch)
const SCENES = ['Hero', 'Ecosystem', 'Fragmented', 'Verified', 'The market', 'Know who decides', 'Night · AI', 'Morning · SEND & Care', 'Connected', 'Join'];
const tagN = $('#sceneTag b'), tagT = $('#sceneTag span');
let tagLast = -1;
function updateTag(s) {
  const n = Math.min(SCENES.length - 1, Math.round(s));
  if (n !== tagLast) { tagLast = n; tagN.textContent = n; tagT.textContent = SCENES[n]; }
}

gsap.ticker.add(() => {
  const s = computeStage();
  updateTag(s);
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
const sizeRot = () => { rot.style.width = words[wi].getBoundingClientRect().width + 'px'; };
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

/* ---------- Scene 2: fragmented — particles leave, cards stay ---------- */
const blurIn = { opacity: 0, y: 50, filter: 'blur(12px)' };
const blurOn = { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1, ease: 'power2.out' };
const blurOut = { opacity: 0, y: -50, filter: 'blur(12px)', duration: 1, ease: 'power2.in' };
gsap.timeline({
  scrollTrigger: {
    trigger: '#fragmented', start: 'top top', end: mobile ? '+=130%' : '+=180%', scrub: 1, pin: true,
    onUpdate: (self) => { if (scene) scene.state.fragExit = clamp((self.progress - 0.3) / 0.4, 0, 1); },
  },
})
  .fromTo('.frag-line[data-i="0"]', blurIn, blurOn, 0)
  .to('.frag-line[data-i="0"]', blurOut, 1.4)
  .fromTo('.frag-line[data-i="1"]', blurIn, blurOn, 2)
  .to('.frag-line[data-i="1"]', blurOut, 3.4)
  .fromTo('.frag-line[data-i="2"]', blurIn, blurOn, 4)
  .to({}, { duration: 1 });

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

/* ---------- Scene 4: live marketplace ticker (on the podium) ---------- */
const pool = [
  ['Fully Managed Renal Services', 'London · Commissioning organisation', 'Closes in 29 days'],
  ['Community Smoking Cessation', 'Wolverhampton · Commissioning organisation', 'Closes in 27 days'],
  ['BME Mental Health Provision', 'Cardiff · Named contacts', 'Closes in 24 days'],
  ['Band 6 Sonographer', 'Leeds · NHS Trust', 'Posted 4m ago'],
  ['Locum GP Sessions', 'Bristol · GP practice', 'Posted 12m ago'],
  ['Radiography Workforce Supply', 'Dublin · Health service', 'Closes in 18 days'],
  ['Registered Nurses, ICU', 'Sydney · Private hospital', 'Posted 1h ago'],
  ['SEND Teaching Assistants', 'Manchester · Special school', 'Posted 22m ago'],
];
const list = $('#liveList');
let pi = 0;
const li = ([t, s, c]) => { const el = document.createElement('li'); el.innerHTML = `<b>${t}</b><small>${s}</small><em>${c}</em>`; return el; };
for (let k = 0; k < 4; k++) list.appendChild(li(pool[pi++ % pool.length]));
setInterval(() => {
  if (document.hidden) return;
  const el = li(pool[pi++ % pool.length]);
  list.prepend(el);
  gsap.from(el, { height: 0, opacity: 0, paddingTop: 0, paddingBottom: 0, duration: 0.7, ease: 'power3.out' });
  gsap.fromTo(el, { backgroundColor: 'rgba(0,163,155,.10)' }, { backgroundColor: 'rgba(0,163,155,0)', duration: 2 });
  const last = list.lastElementChild;
  gsap.to(last, { opacity: 0, duration: 0.4, onComplete: () => last.remove() });
  const n = 64 + Math.floor(Math.random() * 8);
  $$('.live-n').forEach((x) => (x.textContent = n));
}, 2800);

/* ---------- Scene 6: AI match ring fills when night falls ---------- */
ScrollTrigger.create({
  trigger: '#night', start: 'top 55%',
  onEnter: () => gsap.to('#spNight .arc', { strokeDashoffset: 314 * 0.08, duration: 1.8, ease: 'power3.out' }),
  onLeaveBack: () => gsap.set('#spNight .arc', { strokeDashoffset: 314 }),
});

/* ---------- Scene 7: digest rows arrive like mail ---------- */
ScrollTrigger.create({
  trigger: '#morning', start: 'top 55%',
  onEnter: () => gsap.fromTo('#spMorning .mock-row', { x: 40, opacity: 0 }, { x: 0, opacity: 1, duration: 0.8, stagger: 0.25, ease: 'power3.out' }),
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
