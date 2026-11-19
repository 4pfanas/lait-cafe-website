// Brewns-style effects for Lait: cursor parallax, tilt, cursor tag, rotating word, scroll-driven bean/clock/receipt scenes.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

interface Ctx { reduce: boolean; lang: 'en' | 'ar'; hours: { open: number; close: number }[]; tz: string; fmt: (min: number, lang: 'en' | 'ar') => string }
const $ = <E extends Element = HTMLElement>(s: string, el: ParentNode = document) => el.querySelector(s) as E | null;
const $$ = <E extends Element = HTMLElement>(s: string, el: ParentNode = document) => [...el.querySelectorAll(s)] as E[];

export function initFx(ctx: Ctx) {
  liveClock(ctx);
  const header = $('[data-header]');
  const compact = () => header?.classList.toggle('is-compact', scrollY > 80);
  addEventListener('scroll', compact, { passive: true }); compact();
  if (ctx.reduce) return;
  gsap.registerPlugin(ScrollTrigger);
  rotateWord();
  heroParallax();
  tilt();
  cursorTag();
  scenes();
}

function liveClock({ tz, hours, fmt, lang }: Ctx) {
  const hh = $('[data-hand="h"]'), mm = $('[data-hand="m"]'), ss = $('[data-hand="s"]');
  const dig = $('[data-digital]'), today = $('[data-today-hours]');
  if (!hh || !mm || !ss) return;
  const f = new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: 'numeric', minute: 'numeric', second: 'numeric', weekday: 'short', hourCycle: 'h23' });
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const tick = () => {
    const p = Object.fromEntries(f.formatToParts(new Date()).map((x) => [x.type, x.value])) as Record<string, string>;
    const h = +p.hour, m = +p.minute, s = +p.second;
    hh.style.rotate = `${(h % 12) * 30 + m * 0.5}deg`;
    mm.style.rotate = `${m * 6 + s * 0.1}deg`;
    ss.style.rotate = `${s * 6}deg`;
    if (dig) dig.textContent = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    if (today) {
      const d = hours[days.indexOf(p.weekday)];
      today.textContent = d && d.close > d.open ? `${fmt(d.open, lang)} – ${fmt(d.close, lang)}` : today.dataset.closed || '';
    }
  };
  tick(); setInterval(tick, 1000);
}

function rotateWord() {
  const el = $('[data-rotate]'); if (!el) return;
  const words: string[] = JSON.parse(el.dataset.rotate || '[]'); if (words.length < 2) return;
  let i = 0;
  setInterval(() => {
    gsap.to(el, { yPercent: -60, opacity: 0, duration: 0.35, ease: 'power2.in', onComplete: () => {
      i = (i + 1) % words.length; el.textContent = words[i];
      gsap.fromTo(el, { yPercent: 60, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.5, ease: 'expo.out' });
    } });
  }, 2600);
}

function heroParallax() {
  const hero = $('[data-hero]'); if (!hero || matchMedia('(hover: none)').matches) return;
  const layers = $$('[data-depth]', hero).map((el) => ({ d: +(el.dataset.depth || 0), x: gsap.quickTo(el, 'x', { duration: 0.9, ease: 'power3.out' }), y: gsap.quickTo(el, 'y', { duration: 0.9, ease: 'power3.out' }) }));
  hero.addEventListener('pointermove', (e) => {
    const r = hero.getBoundingClientRect();
    const nx = (e.clientX - r.left) / r.width - 0.5, ny = (e.clientY - r.top) / r.height - 0.5;
    layers.forEach((l) => { l.x(-nx * l.d * 1.6); l.y(-ny * l.d * 1.6); });
  });
  hero.addEventListener('pointerleave', () => layers.forEach((l) => { l.x(0); l.y(0); }));
}

function tilt() {
  if (matchMedia('(hover: none)').matches) return;
  $$('[data-tilt]').forEach((el) => {
    const max = +(el.dataset.tilt || 8);
    const rx = gsap.quickTo(el, 'rotationX', { duration: 0.6, ease: 'power3.out' });
    const ry = gsap.quickTo(el, 'rotationY', { duration: 0.6, ease: 'power3.out' });
    gsap.set(el, { transformPerspective: 900 });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width - 0.5, ny = (e.clientY - r.top) / r.height - 0.5;
      ry(nx * max * 2); rx(-ny * max * 2);
    });
    el.addEventListener('pointerleave', () => { rx(0); ry(0); });
  });
}

function cursorTag() {
  const tag = $('[data-cursor-tag]'), txt = $('[data-cursor-tag-text]');
  if (!tag || !txt || matchMedia('(hover: none)').matches) return;
  const x = gsap.quickTo(tag, 'x', { duration: 0.35, ease: 'power3.out' }), y = gsap.quickTo(tag, 'y', { duration: 0.35, ease: 'power3.out' });
  let cur: Element | null = null;
  document.addEventListener('pointermove', (e) => {
    x(e.clientX + 18); y(e.clientY + 18);
    const t = (e.target as Element).closest('[data-tag]');
    if (t !== cur) { cur = t; if (t) txt.textContent = (t as HTMLElement).dataset.tag || ''; tag.classList.toggle('on', !!t); }
  });
  document.addEventListener('pointerleave', () => tag.classList.remove('on'));
}

function scenes() {
  const wm = $('[data-wm]');
  if (wm) gsap.fromTo(wm, { yPercent: 40 }, { yPercent: -6, ease: 'none', scrollTrigger: { trigger: '[data-hero]', start: 'top top', end: 'bottom top', scrub: true } });

  const moment = $('[data-moment]');
  if (moment) {
    gsap.fromTo(moment, { borderTopLeftRadius: '6rem', borderTopRightRadius: '6rem', scale: 0.94 }, { borderTopLeftRadius: '0rem', borderTopRightRadius: '0rem', scale: 1, ease: 'none', scrollTrigger: { trigger: moment, start: 'top bottom', end: 'top 25%', scrub: true } });
    const words = $$('[data-word]', moment);
    gsap.to(words, { opacity: 1, stagger: 0.18, ease: 'none', scrollTrigger: { trigger: moment, start: 'top 65%', end: 'center 40%', scrub: true } });
    $$<SVGSVGElement>('[data-bean]', moment).forEach((b) => {
      const sp = +(b.dataset.bean || 1);
      gsap.fromTo(b, { y: -80 * sp }, { y: 160 * sp, rotation: `+=${(+(b.dataset.spin || 1)) * 140}`, ease: 'none', scrollTrigger: { trigger: moment, start: 'top bottom', end: 'bottom top', scrub: 1 } });
    });
    const cup = $('[data-tumble]', moment);
    if (cup) gsap.fromTo(cup, { rotation: -70, y: -60 }, { rotation: 14, y: 20, ease: 'none', scrollTrigger: { trigger: moment, start: 'top 80%', end: 'bottom 40%', scrub: 1 } });
  }

  const clock = $('[data-clock]');
  if (clock) {
    const st = { trigger: clock, start: 'top bottom', end: 'bottom top', scrub: 1 };
    gsap.fromTo('[data-orbit]', { rotation: -40 }, { rotation: 320, ease: 'none', scrollTrigger: st });
    gsap.fromTo('[data-planet]', { rotation: 40 }, { rotation: -320, ease: 'none', scrollTrigger: st });
  }

  const paper = $('[data-receipt-paper]');
  if (paper) gsap.fromTo(paper, { yPercent: -102 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: '[data-receipt]', start: 'top 55%', end: 'center 45%', scrub: 0.8 } });
}
