// Merges the Arabic menu (src/data/menu-ar.json, when present) over the English source; English is the fallback.
import type { Lang } from '../data/site';
import { chapters, allItems, type Item, type Section, type Chapter } from '../data/menu';

type Loose = Record<string, any>;
const files = import.meta.glob<{ default: Loose }>('/src/data/menu-ar.json', { eager: true });
const AR: Loose = Object.values(files)[0]?.default ?? {};

export const itemText = (it: Item, lang: Lang) =>
  lang === 'en' ? { name: it.name, desc: it.desc ?? '' } : { name: AR.items?.[it.id]?.name || it.name, desc: it.desc ? AR.items?.[it.id]?.desc || it.desc : '' };
export const sectionTitle = (s: Section, lang: Lang) => (lang === 'en' ? s.title : AR.sections?.[s.id]?.title || s.title);
export const chapterText = (c: Chapter, lang: Lang) =>
  lang === 'en' ? { title: c.title, note: c.note } : { title: AR.chapters?.[c.id]?.title || c.title, note: AR.chapters?.[c.id]?.note || c.note };

const secById = new Map(chapters.flatMap((c) => c.sections.map((s) => [s.id, s] as const)));
export const findItem = (id: string) => allItems().find((x) => x.id === id)!;

/** Compact data for the client: search, the tray and "Ask Lait". */
export function clientMenu(lang: Lang) {
  return allItems().map((it) => {
    const en = itemText(it, 'en'), ar = itemText(it, 'ar');
    const s = secById.get(it.section)!;
    return {
      id: it.id,
      n: lang === 'ar' ? ar.name : en.name,
      d: lang === 'ar' ? ar.desc : en.desc,
      st: sectionTitle(s, lang),
      s: it.section,
      c: it.chapter,
      p: it.price,
      t: it.tags ?? [],
      h: [en.name, en.desc, ar.name, ar.desc, it.k ?? '', s.title, it.section, it.chapter].join(' '),
    };
  });
}
