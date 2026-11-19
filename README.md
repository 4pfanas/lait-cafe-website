# Lait Cafe · concept website

A bilingual (English and Arabic, right-to-left) concept website for **Lait Cafe, Al Jimi, Al Ain**, built as a proposal to replace laitcafe.ae. It is a static [Astro](https://astro.build) site: no server, no database, free to host on Cloudflare Pages, Netlify or Vercel.

| | |
|---|---|
| English | `/` |
| Arabic (RTL) | `/ar/` |
| Stack | Astro 7, Tailwind CSS v4, GSAP + ScrollTrigger, Lenis smooth scroll, three.js |
| Node | 22.23.4 or newer (`.nvmrc` says 22) |

> **Concept mode is on.** Search engines are told not to index the site, and a "Concept preview" pill is shown. Set `isConcept: false` in `src/data/site.ts` once Lait approves it.

## Quick start

```bash
npm install
npm run dev        # local preview at http://localhost:4321
npm run build      # writes the static site to dist/
npm run preview    # serves dist/ locally
```

## What is on the page

Sections appear in this order (`src/components/Home.astro`):

| # | Section | What it does |
|---|---|---|
| 1 | **The pour** (`Intro`) | A scroll-driven 3D intro built with three.js: milk pours into a Lait cup, a latte-art heart forms, and the milk fills the screen to reveal the page. "Skip" jumps past it. It is skipped automatically for reduced motion and when WebGL is missing. |
| 2 | **Hero** | Headline, a live **Open now / Closed** pill in Al Ain time, a handwritten note whose last word rotates, and an arch photo with cursor parallax and tilt. A large faint "Lait" watermark drifts behind it. |
| 3 | **Signatures** | Six best-sellers with real Google review quotes. Each card leans toward the cursor and shows a name-and-price tag next to it. |
| 4 | **Menu explorer** | All 98 items with prices from Talabat. Tabs, typo-tolerant search ("pistacho" finds pistachio), filters (signature, meat-free, hot, iced) and a "Right now" suggestion by time of day. |
| 5 | **Your table** (tray) | Tap + on any item to build a list with a running total, then send it on WhatsApp or show it at the counter. Saved on the visitor's device. |
| 6 | **Ask Lait** | Type a craving in English or Arabic ("something cold and sweet, no coffee, under 30"). The browser picks three menu items and explains why. It runs fully client-side, with no AI service and no running cost. |
| 7 | **Catering builder** | Choose the box contents, guests, date and ribbon text. A live drawing of the box updates as you go and the order goes to WhatsApp. It enforces the real "order before 4 PM for next-day delivery" rule with a countdown. |
| 8 | **The room and reviews** | Photos and four guest reviews. |
| 9 | **Beans** | Two 250 g coffee bags (Brazil, Ethiopia) that can be added to the table. |
| 10 | **From bean to cup** (`Moment`) | A dark espresso band. The page curves into it, beans drift down, a cup doodle tumbles, and the headline lights up word by word while you scroll. |
| 11 | **Clock** | A big dial showing real Al Ain time, with two drinks orbiting it as you scroll. Corners show the address, today's hours, the phone number and the Google rating. |
| 12 | **Visit** | Address, directions, an hours table with today highlighted, call button and a WhatsApp newsletter sign-up. |
| 13 | **Receipt** | A thermal-printer slot with a receipt that slides out on scroll. Its lines and prices come from the real menu, and it ends with Order now and WhatsApp buttons. |
| 14 | **Footer** | Links, a large handwritten watermark, and a compact header logo that shrinks after you scroll. |

### Motion effects

The hover, cursor and scroll effects live in `src/scripts/fx.ts`:

- cursor parallax on hero layers (`data-depth`)
- 3D lean toward the cursor (`data-tilt`)
- a cursor-following info tag (`data-tag`)
- a rotating script word (`data-rotate`)
- scroll-scrubbed scenes for the watermark, beans, cup, clock orbit and receipt
- a live analogue clock in Al Ain time

Older motion (smooth scroll, hero entrance, reveals, self-drawing doodles, image drift, the pour) is in `src/scripts/site.ts` and `src/scripts/intro.ts`.

**Accessibility.** With `prefers-reduced-motion`, smooth scroll, GSAP scenes, cursor effects and the 3D intro are all switched off and the page renders statically. Cursor effects are also skipped on touch devices. Arabic uses real RTL layout, with its own typefaces.

## Where to edit things

| To change | Edit |
|---|---|
| Menu items and prices | `src/data/menu.ts` (Arabic names in `src/data/menu-ar.json`) |
| All wording, both languages | `src/data/content.ts` (the `fx` block holds the newer sections) |
| Phone, WhatsApp, hours, links, cut-off time, concept mode | `src/data/site.ts` |
| Colours, fonts, spacing, buttons | `src/styles/global.css` (the `@theme` block at the top) |
| Photos | `src/assets/images/`, named by slot; see `IMAGE-PROMPTS.md` |
| Section order | `src/components/Home.astro` |

Brand tokens: milk `#fbf8f2`, paper `#f2ece2`, crema `#e6dccd`, ink `#1c1a17`, cognac `#b05a26`, espresso `#3b2a20`. Fonts: Instrument Serif (display), Manrope (text), Caveat Brush (handwriting), IBM Plex Sans Arabic and Noto Naskh Arabic.

## Project structure

```
src/
  pages/            index.astro (EN), ar/index.astro (AR)
  layouts/          Layout.astro (fonts, SEO, JSON-LD, motion flags)
  components/       one file per section, plus ui/ and art/ (Button, SmartImage, Doodle, Logo)
  data/             site.ts, content.ts, menu.ts, menu-ar.json
  lib/              format.ts, images.ts, menuL10n.ts
  scripts/          site.ts (main client logic), fx.ts (effects), intro.ts (3D pour), ask.ts (Ask Lait)
  styles/           global.css
public/             favicon, robots.txt
```

Reference mockups (`*.png`), the intro preview video and the folder of Talabat source photos sit at the repo root for design reference only; they are not used by the build.

## How it works

- **One content file per language.** `content.ts` holds every string in English and Arabic. Pages render with a `lang` prop, and a small JSON block (`#lait-boot`) hands the menu, hours and strings to the browser.
- **Live status.** Opening hours are stored per weekday in `site.ts` and evaluated in the `Asia/Dubai` time zone, so "Open now" and the clock are right for every visitor.
- **Ask Lait.** `src/scripts/ask.ts` is a small keyword and fuzzy-match recommender over the menu. No network calls.
- **Orders.** Nothing is submitted to a server. The tray, catering builder and receipt build a pre-filled WhatsApp message.

## Deploying

Run `npm run build` and upload `dist/`. On Cloudflare Pages, Netlify or Vercel, use build command `npm run build` and output directory `dist`. Update `site` in `astro.config.mjs` to the final domain.

## Content and credit

Menu names and prices are as listed on Talabat (November 2026). Photos come from Lait's Talabat and Instagram (@lait.ae) and should be used with Lait's permission; one image (`room-cushion`) is generated. This is an unofficial concept and is not the official Lait website.
