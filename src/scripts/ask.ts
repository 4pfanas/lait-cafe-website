// "Ask Lait": an in-browser reader for cravings in English or Arabic.
// Finds concepts (with negation: "no coffee", "بدون قهوة"), a budget and free words, then ranks the menu.

export type BootItem = { id: string; n: string; d: string; st: string; s: string; c: string; p: number; t: string[]; h: string };
type Prepared = BootItem & { hay: string };

export function norm(s: string) {
  return s
    .toLowerCase()
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .replace(/[ً-ْـ]/g, '')
    .replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي')
    .replace(/[’'`]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

const DRINK = ['classic-hot', 'flavored', 'iced', 'brewed', 'gathering', 'iced-tea', 'shakes', 'juices'];
const COFFEE = ['classic-hot', 'flavored', 'iced', 'brewed', 'gathering'];
const isDrink = (it: Prepared) => DRINK.includes(it.s);
const has = (...w: string[]) => (it: Prepared) => w.some((x) => it.hay.includes(x));
const sec = (...s: string[]) => (it: Prepared) => s.includes(it.s);
const tag = (t: string) => (it: Prepared) => it.t.includes(t);
const or = (...f: ((it: Prepared) => boolean)[]) => (it: Prepared) => f.some((g) => g(it));
const not = (f: (it: Prepared) => boolean) => (it: Prepared) => !f(it);

const isCoffee = (it: Prepared) => COFFEE.includes(it.s) && !has('no coffee', 'matcha', 'chocolate')(it);

type Concept = { q: string[]; match: (it: Prepared) => boolean };
const C: Record<string, Concept> = {
  coffee: { q: ['coffee', 'caffeine', 'espresso', 'latte', 'cappuccino', 'americano', 'cortado', 'piccolo', 'flat', 'قهوه', 'كوفي', 'لاتيه', 'اسبريسو', 'كابتشينو'], match: isCoffee },
  strong: { q: ['strong', 'bold', 'intense', 'awake', 'wake', 'tired', 'black', 'قوي', 'قويه', 'مركز', 'تعبان', 'نعسان'], match: or(has('strong', 'black'), sec('brewed')) },
  sweet: { q: ['sweet', 'sugar', 'treat', 'craving', 'حلو', 'سكر', 'حالي'], match: or(has('sweet'), sec('desserts', 'shakes')) },
  dessert: { q: ['dessert', 'cake', 'desserts', 'حلى', 'حلا', 'حلويات', 'كيك', 'كيكه'], match: sec('desserts', 'acai') },
  cold: { q: ['cold', 'iced', 'ice', 'chilled', 'refreshing', 'hot day', 'بارد', 'مثلج', 'ايس', 'منعش'], match: tag('cold') },
  warm: { q: ['warm', 'hot', 'cozy', 'cosy', 'دافي', 'دافئ', 'ساخن', 'حار'], match: or(tag('hot'), has('warm')) },
  creamy: { q: ['creamy', 'milky', 'milk', 'smooth', 'كريمي', 'حليب'], match: has('creamy', 'milk') },
  matcha: { q: ['matcha', 'ماتشا'], match: has('matcha') },
  tea: { q: ['tea', 'شاي'], match: has(' tea', 'tea ') },
  fruity: { q: ['fruity', 'fruit', 'berry', 'strawberry', 'mango', 'passion', 'peach', 'orange', 'فواكه', 'فاكهه', 'فراوله', 'خوخ', 'برتقال'], match: has('fruity', 'berry', 'strawberry', 'passion', 'peach', 'orange') },
  chocolate: { q: ['chocolate', 'choc', 'cocoa', 'oreo', 'شوكولا', 'شوكولاته', 'اوريو'], match: has('chocolate', 'oreo') },
  pistachio: { q: ['pistachio', 'فستق', 'بستاشيو'], match: has('pistachio') },
  spicy: { q: ['spicy', 'spice', 'heat', 'kick', 'حار', 'حاره', 'سبايسي'], match: has('spicy') },
  cheese: { q: ['cheese', 'cheesy', 'halloumi', 'mozzarella', 'feta', 'جبن', 'جبنه', 'حلومي', 'موزاريلا'], match: has('cheese', 'halloumi', 'mozzarella', 'feta') },
  chicken: { q: ['chicken', 'دجاج'], match: has('chicken') },
  veg: { q: ['vegetarian', 'veggie', 'veg', 'meatless', 'نباتي'], match: tag('V') },
  light: { q: ['light', 'fresh', 'خفيف'], match: or(has('light', 'fresh'), sec('salads', 'acai', 'iced-tea')) },
  healthy: { q: ['healthy', 'diet', 'acai', 'salad', 'صحي', 'دايت', 'اساي', 'سلطه'], match: or(has('healthy'), sec('salads', 'acai')) },
  hearty: { q: ['hungry', 'starving', 'filling', 'hearty', 'meal', 'lunch', 'dinner', 'جوعان', 'جيعان', 'مشبع', 'غدا', 'عشا'], match: or(has('hearty', 'dinner', 'lunch'), sec('pasta')) },
  breakfast: { q: ['breakfast', 'morning', 'brunch', 'فطور', 'صباح', 'ريوق'], match: or(has('breakfast'), sec('croissants')) },
  share: { q: ['share', 'sharing', 'friends', 'family', 'group', 'everyone', 'office', 'مشاركه', 'اصحاب', 'اصدقاء', 'عائله', 'العائله', 'الكل', 'جماعه'], match: tag('share') },
  crispy: { q: ['crispy', 'crunchy', 'fried', 'fries', 'مقرمش', 'كرسبي', 'بطاطس', 'بطاطا'], match: has('crispy', 'fries') },
  pasta: { q: ['pasta', 'باستا', 'معكرونه'], match: has('pasta', 'risotto') },
  kids: { q: ['kids', 'kid', 'child', 'children', 'اطفال', 'ولد', 'بنت'], match: has('kids') },
  local: { q: ['arabic', 'local', 'traditional', 'emirati', 'um ali', 'zaatar', 'عربي', 'شعبي', 'زعتر', 'ام علي'], match: has('local', 'traditional') },
  nocoffee: { q: ['decaf'], match: not(isCoffee) },
};
const TRIGGER = new Map<string, string>();
for (const [k, v] of Object.entries(C)) for (const w of v.q) TRIGGER.set(norm(w), k);
const NEG = new Set(['no', 'not', 'without', 'avoid', 'except', 'non', 'dont', 'nothing', 'zero', 'بدون', 'لا', 'غير', 'بلا', 'مش', 'ما', 'مو']);
const BREAK = new Set(['but', 'and', 'or', 'with', 'لكن', 'بس', 'و', 'مع', 'او']);
const STOP = new Set(['something', 'some', 'want', 'like', 'would', 'please', 'give', 'me', 'i', 'im', 'a', 'an', 'the', 'to', 'for', 'of', 'in', 'on', 'it', 'is', 'very', 'really', 'feel', 'feeling', 'mood', 'today', 'now', 'can', 'get', 'eat', 'drink', 'have', 'under', 'below', 'less', 'than', 'aed', 'dhs', 'my', 'we', 'us', 'whole', 'all', 'maybe', 'perhaps', 'kind', 'sort', 'ربما', 'يمكن',
  'شي', 'شيء', 'اريد', 'ابغى', 'ابي', 'عطني', 'انا', 'في', 'من', 'على', 'الى', 'جدا', 'اليوم', 'الحين', 'اكل', 'اشرب', 'اقل', 'تحت', 'درهم', 'كلها', 'كل', 'نفسي']);

export type Reading = { include: string[]; exclude: string[]; budget?: number; free: string[]; drink?: boolean };

function lookup(tok: string): string | undefined {
  if (TRIGGER.has(tok)) return TRIGGER.get(tok);
  for (const p of ['وال', 'بال', 'لل', 'ال', 'و', 'ب']) if (tok.startsWith(p) && tok.length - p.length >= 2 && TRIGGER.has(tok.slice(p.length))) return TRIGGER.get(tok.slice(p.length));
  if (tok.endsWith('s') && TRIGGER.has(tok.slice(0, -1))) return TRIGGER.get(tok.slice(0, -1));
}

export function read(text: string): Reading {
  let t = norm(text);
  let budget: number | undefined;
  const bud = t.match(/(?:under|below|less than|max|up to|within|budget|اقل من|تحت|حدود|لحد|حتي|ميزانيه)\s*(?:aed|dhs|درهم)?\s*(\d{1,3})/) || t.match(/(\d{1,3})\s*(?:aed|dhs|dirhams?|درهم)?\s*(?:or less|max|او اقل)/);
  if (bud) { budget = Number(bud[1]); t = t.replace(bud[0], ' '); }
  // two-word phrases first
  t = t.replace(/\bum ali\b/g, 'umali').replace(/ام علي/g, 'امعلي');
  const toks = t.split(/\s+/).filter(Boolean);
  const include = new Set<string>(), exclude = new Set<string>(), free: string[] = [];
  let negLeft = 0;
  for (const w of toks) {
    if (BREAK.has(w)) { negLeft = 0; continue; }
    if (NEG.has(w)) { negLeft = 3; continue; }
    if (w === 'umali' || w === 'امعلي') { include.add('local'); free.push('um ali'); continue; }
    let c = lookup(w);
    // "hot" means temperature unless they asked for spice; "حار" is spice in food talk
    if (c === 'warm' && (w === 'حار') && !/قهوه|شاي|مشروب/.test(t)) c = 'spicy';
    if (c) {
      if (negLeft > 0) { if (c === 'coffee') include.add('nocoffee'); else exclude.add(c); negLeft--; }
      else include.add(c);
      continue;
    }
    if (negLeft > 0) negLeft--;
    if (!STOP.has(w) && !/^\d+$/.test(w) && w.length >= 3) free.push(w);
  }
  for (const e of exclude) include.delete(e);
  if (include.has('nocoffee')) include.delete('coffee');
  const drink = /\b(drink|drinks|beverage|sip)\b|مشروب|اشرب/.test(t);
  return { include: [...include], exclude: [...exclude], budget, free, drink };
}

export const prepare = (items: BootItem[]): Prepared[] => items.map((it) => ({ ...it, hay: ' ' + norm(it.h) + ' ' }));

export function lev1(a: string, b: string) {
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0, j = 0, e = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { i++; j++; continue; }
    if (++e > 1) return false;
    if (a.length > b.length) i++; else if (b.length > a.length) j++; else { i++; j++; }
  }
  return e + (a.length - i) + (b.length - j) <= 1;
}
export const fuzzyIn = (hay: string, t: string) => hay.split(' ').some((w) => w.length >= 3 && (lev1(w, t) || (w.length > t.length && lev1(w.slice(0, t.length), t))));

export type Pick = { item: Prepared; why: string[]; score: number };
export function suggest(items: Prepared[], r: Reading): Pick[] {
  const asks = r.include.length + r.free.length;
  if (!asks && !r.exclude.length && !r.budget && !r.drink) return [];
  const wantsDrink = r.include.some((k) => ['coffee', 'strong', 'tea', 'matcha'].includes(k));
  const wantsFood = r.include.some((k) => ['dessert', 'spicy', 'cheese', 'chicken', 'hearty', 'pasta', 'crispy', 'breakfast', 'healthy', 'local'].includes(k));
  const out: Pick[] = [];
  for (const it of items) {
    if (r.exclude.some((e) => C[e].match(it))) continue;
    if (r.budget && it.p > r.budget) continue;
    if (it.s === 'juices' && !r.free.length) continue; // water and soda are never the answer
    // temperature is a hard condition: "cold" never returns a hot drink or a warm croissant
    if (r.include.includes('cold') && !it.t.includes('cold') && !['desserts', 'acai'].includes(it.s)) continue;
    if (r.include.includes('warm') && it.t.includes('cold')) continue;
    if (r.include.includes('nocoffee') && isCoffee(it)) continue;
    if (r.drink && !isDrink(it)) continue;
    const why = r.include.filter((k) => C[k].match(it));
    let score = why.length * 3;
    let freeHit = false;
    const name = ' ' + norm(it.n) + ' ';
    for (const f of r.free) {
      if (it.hay.includes(f)) { score += name.includes(f) ? 5 : 3; freeHit = true; }
      else if (f.length >= 4 && fuzzyIn(it.hay, f)) { score += 3; freeHit = true; }
    }
    if (asks && score === 0) continue;
    if (!freeHit) {
      if (wantsDrink && !wantsFood && !isDrink(it)) continue;
      if (wantsFood && !wantsDrink && isDrink(it) && !r.include.includes('cold')) score -= 2;
    }
    if (r.include.length > 1 && why.length === r.include.length) score += 2;
    if (it.t.includes('sig')) score += 0.8;
    if (it.s === 'beans') score -= 3;
    if (r.include.includes('dessert') && !C.dessert.match(it)) score -= 2.5;
    out.push({ item: it, why, score });
  }
  out.sort((a, b) => b.score - a.score || a.item.p - b.item.p);
  const picks: Pick[] = [], used = new Set<string>();
  for (const p of out) if (picks.length < 3 && !used.has(p.item.s)) { picks.push(p); used.add(p.item.s); }
  for (const p of out) { if (picks.length >= 3) break; if (!picks.includes(p)) picks.push(p); }
  return picks.slice(0, 3);
}
