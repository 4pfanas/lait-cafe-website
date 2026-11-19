// Lait Cafe constants. Hours, address and rating from Google (Nov 2026); phone from their WhatsApp link.
export type Lang = 'en' | 'ar';

export const site = {
  /** Proposal mode: noindex + "Concept preview" tag + footer note. Set false once approved. */
  isConcept: true,
  tz: 'Asia/Dubai',
  phone: '+971566722284',
  phoneDisplay: '056 672 2284',
  whatsapp: '971566722284',
  orderUrl: 'https://orders.laitcafe.ae/',
  talabatUrl: 'https://www.talabat.com/uae/restaurant/47859/lait-al-jimi',
  instagram: 'https://www.instagram.com/lait.ae/',
  instagramHandle: '@lait.ae',
  tiktok: 'https://www.tiktok.com/@laitcafe.ae',
  mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Lait%20Cafe%20Al%20Jimi&query_place_id=ChIJRdEfcauzij4R09deoYgRf0o',
  geo: { lat: 24.2463151, lng: 55.7289985 },
  rating: { value: 4.1, count: 76 },
  /** Opening hours per weekday (0 = Sunday), minutes from midnight. */
  hours: [
    { open: 8 * 60, close: 23 * 60 }, // Sun
    { open: 7 * 60, close: 23 * 60 }, // Mon
    { open: 7 * 60, close: 23 * 60 }, // Tue
    { open: 7 * 60, close: 23 * 60 }, // Wed
    { open: 7 * 60, close: 23 * 60 }, // Thu
    { open: 7 * 60, close: 24 * 60 }, // Fri
    { open: 8 * 60, close: 24 * 60 }, // Sat
  ],
  /** Catering and cakes: order before 4 PM for next-day delivery. */
  cateringCutoff: 16 * 60,
  themeColor: '#FBF8F2',
} as const;

export const pathFor = (lang: Lang) => (lang === 'ar' ? '/ar/' : '/');
