import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { clock, num } from '../lib/format';
import { initFx } from './fx';
import { fuzzyIn, norm, prepare, read, suggest, type BootItem } from './ask';

gsap.registerPlugin(ScrollTrigger);
type Lang = 'en' | 'ar';
const boot = JSON.parse(document.getElementById('lait-boot')?.textContent || '{}') as {
  lang: Lang; items: BootItem[];
  site: { hours: { open: number; close: number }[]; tz: string; cutoff: number; whatsapp: string };
  t: any;
};
const lang = boot.lang, T = boot.t, root = document.documentElement;
const $ = <E extends Element = HTMLElement>(s: string, el: ParentNode = document) => el.querySelector(s) as E | null;
const $$ = <E extends Element = HTMLElement>(s: string, el: ParentNode = document) => [...el.querySelectorAll(s)] as E[];
const store = {
  get(k: string) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k: string, v: string) { try { localStorage.setItem(k, v); } catch { /* private mode */ } },
};
const items = prepare(boot.items);
const byId = new Map(items.map((i) => [i.id, i]));
const aed = (n: number) => `${T.menu.currency} ${num(n, lang)}`;
const wa = (text: string) => `https://wa.me/${boot.site.whatsapp}?text=${encodeURIComponent(text)}`;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
let lenis: Lenis | null = null;

/* ───────── Time in Al Ain ───────── */
function now() {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: boot.site.tz, weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  const g = (t: string) => parts.find((p) => p.type === t)?.value ?? '0';
  const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(g('weekday'));
  return { day, min: Number(g('hour')) * 60 + Number(g('minute')), ymd: `${g('year')}-${g('month')}-${g('day')}` };
}
function status() {
  const n = now(), h = boot.site.hours[n.day];
  const open = n.min >= h.open && n.min < h.close;
  const next = n.min < h.open ? h.open : boot.site.hours[(n.day + 1) % 7].open;
  return { ...n, open, close: h.close, next };
}
function paintStatus() {
  const s = status(), S = T.status;
  const text = s.open ? `${S.open} · ${S.until} ${clock(s.close, lang)}` : `${S.closed} · ${S.opens} ${clock(s.next, lang)}`;
  $$('[data-status]').forEach((el) => (el.textContent = text));
  $$('[data-status-pill]').forEach((el) => el.setAttribute('data-open', String(s.open)));
  $$('[data-status-short]').forEach((el) => (el.textContent = text));
  $$('[data-day]').forEach((el) => el.classList.toggle('is-today', Number(el.dataset.day) === s.day));
}
paintStatus();
setInterval(paintStatus, 30_000);

/* ───────── Right now: picks for this time of day ───────── */
function paintNow() {
  const s = status();
  const m = s.min;
  const slot = !s.open ? 'night' : m < 11 * 60 ? 'morning' : m < 17 * 60 ? 'day' : 'evening';
  const picks: Record<string, string[]> = {
    morning: ['butter-croissant', 'v60', 'avocado-mushroom-toast', 'fluffy-pancake'],
    day: ['pink-spicy-pasta', 'halloumi-avocado-pretzel', 'cold-lait-latte', 'cloudy-matcha'],
    evening: ['um-ali', 'cheesecake', 'flat-white', 'pistachio-latte-cold'],
    night: ['um-ali', 'cold-lait-latte', 'butter-croissant', 'v60'],
  };
  const line = $('[data-now-line]');
  if (line) line.textContent = slot === 'night' ? `${T.status.night} ${clock(s.next, lang)}` : T.status[slot];
  const list = $('[data-now-list]');
  if (!list) return;
  list.replaceChildren(...picks[slot].map((id) => {
    const it = byId.get(id)!;
    const li = document.createElement('li');
    li.innerHTML = `<button type="button" class="now-card flex w-full items-center justify-between gap-3 rounded-2xl border-[1.5px] border-line bg-milk px-4 py-3 text-start" data-tray-add="${id}" aria-pressed="false"><span><span class="block font-bold"></span><span class="t-meta block text-ink-soft"></span></span><span class="plus grid h-7 w-7 shrink-0 place-items-center rounded-full border-[1.5px] border-line text-sm">+</span></button>`;
    li.querySelector('.font-bold')!.textContent = it.n;
    li.querySelector('.t-meta')!.textContent = `${it.st} · ${aed(it.p)}`;
    return li;
  }));
}
paintNow();

/* ───────── Header + mobile nav ───────── */
const header = $('[data-header]'), mobileNav = $('[data-mobile-nav]'), navBtn = $('[data-nav-open]');
function setNav(open: boolean) {
  mobileNav?.classList.toggle('is-open', open);
  navBtn?.setAttribute('aria-expanded', String(open));
  document.body.style.overflow = open ? 'hidden' : '';
  open ? lenis?.stop() : lenis?.start();
}
navBtn?.addEventListener('click', () => setNav(!mobileNav?.classList.contains('is-open')));
$$('[data-nav-close]').forEach((a) => a.addEventListener('click', () => setNav(false)));
let lastY = 0;
function onScroll(y: number) {
  header?.classList.toggle('is-scrolled', y > 30);
  if (y > lastY + 4 && y > 700 && !mobileNav?.classList.contains('is-open')) header?.classList.add('is-hidden');
  if (y < lastY - 4) header?.classList.remove('is-hidden');
  lastY = y;
}

/* ───────── Menu ───────── */
const tabs = $$<HTMLButtonElement>('[data-tab]'), panels = $$('[data-panel]');
const search = $<HTMLInputElement>('[data-menu-search]');
const filterBtns = $$<HTMLButtonElement>('[data-filter]');
const active = new Set<string>();
function selectTab(key: string, focus = false) {
  tabs.forEach((t) => { const on = t.dataset.tab === key; t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; if (on && focus) t.focus(); });
  panels.forEach((p) => (p.hidden = p.dataset.panel !== key));
  applyFilters();
  ScrollTrigger.refresh();
}
tabs.forEach((t, i) => {
  t.addEventListener('click', () => selectTab(t.dataset.tab!));
  t.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const fwd = (e.key === 'ArrowRight') !== (lang === 'ar');
    selectTab(tabs[(i + (fwd ? 1 : tabs.length - 1)) % tabs.length].dataset.tab!, true);
  });
});
filterBtns.forEach((b) => b.addEventListener('click', () => {
  const f = b.dataset.filter!;
  if (active.has(f)) active.delete(f); else { active.add(f); if (f === 'hot') active.delete('cold'); if (f === 'cold') active.delete('hot'); }
  filterBtns.forEach((x) => x.setAttribute('aria-pressed', String(active.has(x.dataset.filter!))));
  applyFilters();
}));
function applyFilters() {
  const q = norm(search?.value ?? '').split(' ').filter(Boolean);
  const filtering = q.length > 0 || active.size > 0;
  // While searching, look across every chapter so nothing hides behind a tab
  panels.forEach((panel) => {
    const selected = tabs.find((t) => t.dataset.tab === panel.dataset.panel)?.getAttribute('aria-selected') === 'true';
    let shown = 0;
    $$('[data-section]', panel).forEach((sec) => {
      let n = 0;
      $$<HTMLLIElement>('.menu-item', sec).forEach((li) => {
        const it = byId.get(li.dataset.id!)!;
        let ok = [...active].every((f) => it.t.includes(f));
        if (ok && q.length) ok = q.every((w) => it.hay.includes(w) || (w.length >= 4 && fuzzyIn(it.hay, w)));
        li.hidden = !ok;
        li.classList.toggle('is-hit', ok && q.length > 0);
        if (ok) n++;
      });
      sec.hidden = n === 0;
      shown += n;
    });
    panel.hidden = filtering ? shown === 0 : !selected;
    $('[data-menu-empty]', panel)?.classList.toggle('is-shown', !filtering && shown === 0);
  });
  if (filtering && panels.every((p) => p.hidden)) {
    const first = panels.find((p) => p.dataset.panel === tabs.find((t) => t.getAttribute('aria-selected') === 'true')?.dataset.tab);
    if (first) { first.hidden = false; $('[data-menu-empty]', first)?.classList.add('is-shown'); }
  }
}
let searchT = 0;
search?.addEventListener('input', () => { clearTimeout(searchT); searchT = window.setTimeout(applyFilters, 90); });
selectTab(tabs[status().min < 11 * 60 ? 0 : 0]?.dataset.tab ?? 'coffee');

/* ───────── Your table (tray) ───────── */
let tray: Record<string, number> = {};
try { tray = JSON.parse(store.get('lait-tray') || '{}'); } catch { tray = {}; }
for (const id of Object.keys(tray)) if (!byId.has(id) || !(tray[id] > 0)) delete tray[id];
const dialog = $<HTMLDialogElement>('[data-tray]'), fab = $<HTMLButtonElement>('[data-tray-open]');
function trayText() {
  const ids = Object.keys(tray);
  const total = ids.reduce((a, id) => a + tray[id] * byId.get(id)!.p, 0);
  return `${T.tray.message}\n${ids.map((id) => `• ${num(tray[id], lang)} × ${byId.get(id)!.n}`).join('\n')}\n${T.tray.total}: ${aed(total)}`;
}
function renderTray(bump = false) {
  store.set('lait-tray', JSON.stringify(tray));
  const ids = Object.keys(tray);
  const count = ids.reduce((a, id) => a + tray[id], 0);
  const total = ids.reduce((a, id) => a + tray[id] * byId.get(id)!.p, 0);
  if (fab) {
    fab.hidden = count === 0;
    $('[data-tray-count]', fab)!.textContent = num(count, lang);
    $('[data-tray-total-fab]', fab)!.textContent = aed(total);
    if (bump) { fab.classList.remove('bump'); void fab.offsetWidth; fab.classList.add('bump'); }
  }
  $$<HTMLElement>('[data-tray-add]').forEach((b) => {
    const id = b.dataset.trayAdd!; if (!id) return;
    const on = !!tray[id];
    b.setAttribute('aria-pressed', String(on));
    b.setAttribute('aria-label', `${on ? T.menu.remove : T.menu.add}: ${byId.get(id)?.n ?? ''}`);
    const p = b.classList.contains('now-card') ? $('.plus', b) : null;
    if (p) p.textContent = on ? '✓' : '+';
  });
  const list = $('[data-tray-list]');
  if (list) list.replaceChildren(...ids.map((id) => {
    const it = byId.get(id)!;
    const li = document.createElement('li');
    li.className = 'flex items-center gap-3 border-b border-line py-4';
    li.innerHTML = `<div class="min-w-0 flex-1"><p class="font-bold"></p><p class="text-[0.8rem] text-ink-soft"></p></div>
      <div class="flex items-center gap-1 rounded-full border-[1.5px] border-line p-0.5">
        <button type="button" class="grid h-7 w-7 place-items-center rounded-full hover:bg-paper" data-q="-1" aria-label="−">−</button>
        <span class="t-num w-6 text-center text-sm font-bold"></span>
        <button type="button" class="grid h-7 w-7 place-items-center rounded-full hover:bg-paper" data-q="1" aria-label="+">+</button></div>`;
    li.querySelectorAll('p')[0].textContent = it.n;
    li.querySelectorAll('p')[1].textContent = `${aed(it.p)} · ${it.st}`;
    li.querySelector('span')!.textContent = num(tray[id], lang);
    li.querySelectorAll<HTMLButtonElement>('[data-q]').forEach((b) => b.addEventListener('click', () => {
      tray[id] = (tray[id] || 0) + Number(b.dataset.q); if (tray[id] <= 0) delete tray[id]; renderTray();
    }));
    return li;
  }));
  const empty = $('[data-tray-empty]');
  empty?.classList.toggle('hidden', count > 0); empty?.classList.toggle('flex', count === 0);
  const tt = $('[data-tray-total]'); if (tt) tt.textContent = aed(total);
  const w = $<HTMLAnchorElement>('[data-tray-wa]'); if (w) w.href = wa(trayText());
}
document.addEventListener('click', (e) => {
  const b = (e.target as Element).closest<HTMLElement>('[data-tray-add]');
  if (!b || !b.dataset.trayAdd) return;
  const id = b.dataset.trayAdd;
  if (tray[id]) delete tray[id]; else tray[id] = 1;
  renderTray(true);
});
fab?.addEventListener('click', () => { dialog?.showModal(); lenis?.stop(); });
$('[data-tray-close]')?.addEventListener('click', () => dialog?.close());
dialog?.addEventListener('close', () => lenis?.start());
dialog?.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
$('[data-tray-clear]')?.addEventListener('click', () => { tray = {}; renderTray(); });
$('[data-tray-copy]')?.addEventListener('click', async (e) => {
  const b = e.currentTarget as HTMLButtonElement;
  try { await navigator.clipboard.writeText(trayText()); } catch { /* clipboard blocked */ }
  b.textContent = b.dataset.done!; setTimeout(() => (b.textContent = b.dataset.label!), 1600);
});
renderTray();

/* ───────── Ask Lait ───────── */
const askForm = $<HTMLFormElement>('[data-ask-form]'), askInput = $<HTMLTextAreaElement>('[data-ask-input]');
const askOut = $('[data-ask-out]'), tpl = $<HTMLTemplateElement>('[data-ask-card]');
const W = T.ask.words as Record<string, string>;
let askTimer = 0;
function ask(text: string) {
  if (!askOut) return;
  const r = read(text);
  askOut.innerHTML = `<p class="t-hand text-[1.6rem] text-milk/70"></p>`;
  askOut.firstElementChild!.textContent = T.ask.thinking;
  clearTimeout(askTimer);
  askTimer = window.setTimeout(() => {
    const picks = suggest(items, r);
    askOut.replaceChildren();
    const chips = [...r.include.map((k) => W[k] ?? k), ...r.exclude.map((k) => `${T.ask.not} ${W[k] ?? k}`), ...(r.budget ? [`${T.ask.budget} ${num(r.budget, lang)}`] : []), ...r.free.slice(0, 3).map((f) => `“${f}”`)];
    if (!chips.length) { const p = document.createElement('p'); p.className = 't-body text-milk/70'; p.textContent = T.ask.idle; askOut.append(p); return; }
    const heard = document.createElement('div'); heard.className = 'ask-heard';
    const lab = document.createElement('span'); lab.className = 't-hand me-1 text-[1.3rem] text-milk/70'; lab.textContent = T.ask.heard;
    heard.append(lab, ...chips.map((c) => Object.assign(document.createElement('span'), { className: 'pill', textContent: c })));
    askOut.append(heard);
    if (!picks.length) { const p = document.createElement('p'); p.className = 't-body mt-8 text-milk/80'; p.textContent = T.ask.none; askOut.append(p); return; }
    const h = document.createElement('p'); h.className = 't-hand mt-8 text-[1.7rem] text-cognac'; h.textContent = T.ask.picks;
    const ul = document.createElement('ul'); ul.className = 'mt-3 grid gap-3 md:grid-cols-3';
    picks.forEach((pk, i) => {
      const li = tpl!.content.firstElementChild!.cloneNode(true) as HTMLLIElement;
      const f = (k: string) => li.querySelector<HTMLElement>(`[data-f="${k}"]`)!;
      f('section').textContent = pk.item.st; f('name').textContent = pk.item.n; f('desc').textContent = pk.item.d; f('price').textContent = aed(pk.item.p);
      const why = pk.why.map((k) => W[k] ?? k);
      if (!why.length && r.free.length) why.push(`“${r.free[0]}”`);
      f('why').textContent = why.join(' · ');
      li.querySelector<HTMLElement>('[data-tray-add]')!.dataset.trayAdd = pk.item.id;
      ul.append(li);
      setTimeout(() => li.classList.add('in'), 60 + i * 130);
    });
    askOut.append(h, ul);
    renderTray();
  }, 550);
}
askForm?.addEventListener('submit', (e) => { e.preventDefault(); if (askInput?.value.trim()) ask(askInput.value); });
askInput?.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); askForm?.requestSubmit(); } });
$$<HTMLButtonElement>('[data-ask-example]').forEach((b) => b.addEventListener('click', () => { if (askInput) askInput.value = b.textContent!.trim(); ask(b.textContent!.trim()); }));

/* ───────── Catering builder ───────── */
const cater = $<HTMLFormElement>('[data-cater]');
if (cater) {
  const K = T.catering;
  const dateIn = $<HTMLInputElement>('[data-cater-date]', cater)!;
  const ribbonIn = $<HTMLInputElement>('[data-cater-ribbon]', cater)!;
  const send = $<HTMLAnchorElement>('[data-cater-send]')!, hint = $('[data-cater-hint]')!;
  const list = $('[data-box-list]')!, meta = $('[data-box-meta]')!, bow = $('[data-bow]'), ribbonText = $('[data-ribbon-text]')!;
  const boxItems = $('[data-box-items]')!;
  const addDays = (ymd: string, d: number) => { const t = new Date(ymd + 'T12:00:00Z'); t.setUTCDate(t.getUTCDate() + d); return t.toISOString().slice(0, 10); };
  function paintCutoff() {
    const s = now();
    const left = boot.site.cutoff - s.min;
    const el = $('[data-cutoff-text]');
    if (el) el.textContent = left > 0 ? `${K.cutoff} ${Math.floor(left / 60)}h ${String(left % 60).padStart(2, '0')}m ${K.cutoffLeft}.` : K.cutoffMissed;
    const min = addDays(s.ymd, left > 0 ? 1 : 2);
    dateIn.min = min;
    if (!dateIn.value || dateIn.value < min) dateIn.value = min;
  }
  paintCutoff(); setInterval(paintCutoff, 60_000);
  const dots: Record<string, string> = { croissants: '#d9a35b', sandwiches: '#a8b77e', sweets: '#f0d27a', cookies: '#b9875a', cake: '#f2c6b4', coffee: '#3b2a20' };
  function update(tie = false) {
    const fd = new FormData(cater!);
    const what = (fd.getAll('what') as string[]);
    const labels = what.map((v) => $<HTMLInputElement>(`input[value="${v}"]`, cater!)!.dataset.label!);
    list.replaceChildren(...labels.map((l) => Object.assign(document.createElement('li'), { className: 'flex items-center gap-2 font-semibold', innerHTML: '<span class="h-1.5 w-1.5 rounded-full bg-cognac"></span>' + '<span></span>' })));
    [...list.children].forEach((li, i) => (li.lastElementChild!.textContent = labels[i]));
    const date = dateIn.value ? new Intl.DateTimeFormat(lang === 'ar' ? 'ar-AE' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(new Date(dateIn.value + 'T12:00:00Z')) : '';
    meta.textContent = [fd.get('guests') ? `${fd.get('guests')} ${K.guestsUnit}` : '', date].filter(Boolean).join(' · ');
    const msg = String(fd.get('ribbon') || '').trim();
    ribbonText.textContent = msg || 'LAiT · LAiT · LAiT';
    if (tie && bow) { bow.classList.remove('tie'); void (bow as any).getBBox?.(); bow.classList.add('tie'); }
    // treats appear in the box window
    boxItems.innerHTML = what.slice(0, 6).map((v, i) => `<circle cx="${128 + (i % 3) * 32}" cy="${140 + Math.floor(i / 3) * 28}" r="11" fill="${dots[v]}" stroke="var(--color-ink)" stroke-width="1.2"/>`).join('');
    const ok = what.length > 0;
    send.setAttribute('aria-disabled', String(!ok));
    hint.hidden = ok;
    const name = String(fd.get('name') || '').trim();
    const text = [K.message, ...labels.map((l) => `• ${l}`), `${fd.get('guests')} ${K.guestsUnit}`, date, msg ? `Ribbon: “${msg}”` : '', name ? `— ${name}` : ''].filter(Boolean).join('\n');
    send.href = ok ? wa(text) : '#';
  }
  cater.addEventListener('change', (e) => update((e.target as HTMLInputElement).name === 'what'));
  ribbonIn.addEventListener('input', () => update());
  ribbonIn.addEventListener('change', () => update(true));
  cater.addEventListener('input', (e) => { if ((e.target as HTMLInputElement).name === 'name') update(); });
  update();
}

/* ───────── Motion ───────── */
if (!reduce) {
  lenis = new Lenis({ duration: 1.1, smoothWheel: true });
  lenis.on('scroll', (e: any) => { ScrollTrigger.update(); onScroll(e.scroll); });
  gsap.ticker.add((t) => lenis!.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);

  const tl = gsap.timeline({ paused: true, defaults: { ease: 'expo.out' }, onComplete: () => root.classList.remove('js-motion') });
  tl.fromTo('[data-hero-line]', { yPercent: 105 }, { yPercent: 0, y: 0, duration: 1.4, stagger: 0.1 }, 0.1)
    .fromTo('[data-hero-fade]', { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 1.1, stagger: 0.08 }, 0.4);
  ScrollTrigger.create({ trigger: '.hero', start: 'top 75%', once: true, onEnter: () => tl.play() });

  gsap.set('[data-reveal]', { opacity: 0, y: 26 });
  ScrollTrigger.batch('[data-reveal]', { start: 'top 90%', once: true, onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 1.1, stagger: 0.07, ease: 'expo.out' }) });

  // doodles draw themselves when they come into view
  $$<SVGSVGElement>('svg[data-draw]').forEach((svg) => {
    svg.querySelectorAll<SVGGeometryElement>('path,circle,ellipse').forEach((p) => { try { p.style.setProperty('--len', String(Math.ceil(p.getTotalLength()) + 2)); } catch { /* no length */ } });
    ScrollTrigger.create({ trigger: svg, start: 'top 92%', once: true, onEnter: () => svg.classList.add('is-drawn') });
  });
  $$('[data-drift]').forEach((el) => gsap.fromTo(el, { yPercent: -5, scale: 1.1 }, { yPercent: 5, ease: 'none', scrollTrigger: { trigger: el.parentElement!, start: 'top bottom', end: 'bottom top', scrub: true } }));
  gsap.from('[data-footer-mark]', { yPercent: 25, opacity: 0.3, ease: 'none', scrollTrigger: { trigger: 'footer', start: 'top bottom', end: 'bottom bottom', scrub: true } });

  document.addEventListener('click', (e) => {
    const a = (e.target as Element).closest<HTMLAnchorElement>('a[href^="#"]');
    if (!a || a.getAttribute('href') === '#') return;
    const id = a.getAttribute('href')!;
    const el = id === '#top' ? document.body : document.querySelector(id);
    if (!el) return;
    e.preventDefault();
    lenis!.scrollTo(el as HTMLElement, { offset: id === '#hero' ? 0 : -60 });
  });
  const intro = $('[data-intro]');
  if (intro) setupIntro(intro);
} else {
  root.classList.remove('js-motion');
  $$('svg[data-draw]').forEach((s) => s.classList.add('is-drawn'));
  addEventListener('scroll', () => onScroll(scrollY), { passive: true });
  root.classList.add('intro-static');
}
initFx({ reduce, lang, hours: boot.site.hours, tz: boot.site.tz, fmt: clock });
$$('[data-open-menu]').forEach((a) => a.addEventListener('click', () => selectTab(a.dataset.openMenu!)));
$$<HTMLAnchorElement>('[data-lang-switch]').forEach((a) => a.addEventListener('click', (e) => {
  if (reduce || e.metaKey || e.ctrlKey) return;
  e.preventDefault(); root.classList.add('is-leaving'); setTimeout(() => (location.href = a.href), 260);
}));
addEventListener('pageshow', () => root.classList.remove('is-leaving'));

/* ───────── The pour (three.js, loaded only here) ───────── */
function setupIntro(intro: HTMLElement) {
  const canvas = $<HTMLCanvasElement>('[data-intro-canvas]', intro)!;
  const copy = $('[data-intro-copy]', intro), hint = $('[data-intro-hint]', intro), skip = $('[data-intro-skip]', intro);
  const milk = $('[data-intro-milk]', intro)!, done = $('[data-intro-done]', intro);
  const sm = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  import('./intro').then(({ startIntro, webglOK }) => {
    if (!webglOK()) { root.classList.add('intro-static'); ScrollTrigger.refresh(); return; }
    const scene = startIntro({ canvas });
    scene.start();
    root.classList.add('intro-active');
    const paint = (p: number) => {
      scene.setProgress(p);
      const f = 1 - sm(0.02, 0.14, p);
      if (copy) { copy.style.opacity = String(f); copy.style.transform = `translateY(${-30 * (1 - f)}px)`; }
      if (hint) hint.style.opacity = String(f);
      if (done) done.style.opacity = String(sm(0.62, 0.7, p) * (1 - sm(0.8, 0.86, p)));
      if (skip) skip.style.opacity = String(1 - sm(0.82, 0.9, p));
      milk.style.opacity = String(sm(0.84, 0.97, p));
      root.classList.toggle('intro-active', p < 0.95);
    };
    paint(0);
    if (location.search.includes('capture')) (window as any).__laitPaint = paint;
    ScrollTrigger.create({ trigger: intro, start: 'top top', end: 'bottom bottom', scrub: 0.5, onUpdate: (st) => paint(st.progress) });
    new IntersectionObserver(([e]) => (e.isIntersecting ? scene.play() : scene.pause())).observe(intro);
  }).catch((err) => { console.error('[lait intro]', err); root.classList.add('intro-static'); });
}
