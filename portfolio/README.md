# DJILALI — Developer Portfolio

Personal portfolio for Djilali, Software Developer and Full-Stack Engineer.
Next.js 16 (App Router, static export), React 19, TypeScript, Tailwind CSS 4, Motion for React, Lucide icons and Geist fonts.

The Pages workflow publishes it at **https://djilalilakehal0-gif.github.io/speaking-pretest/portfolio/**.

```bash
cd portfolio
npm install
npm run dev         # http://localhost:5970
npm run typecheck   # TypeScript check
npm run build       # static site in out/
```

## Languages

The site is available in three languages, with a switcher (EN · FR · ع) in the header and the mobile menu:

| Language | URL | Text file |
| --- | --- | --- |
| English | `/portfolio/` | `src/content/locales/en.ts` |
| Français | `/portfolio/fr/` | `src/content/locales/fr.ts` |
| العربية (right-to-left) | `/portfolio/ar/` | `src/content/locales/ar.ts` |

All three files have the same keys, and TypeScript fails the build if one is missing. The Arabic page uses the Readex Pro font, has no letter-spacing (which would break Arabic letter joining) and mirrors arrows and the timeline. Each page declares its language alternates (`hreflang`) for search engines.

## Editing content

- **Text in each language:** `src/content/locales/{en,fr,ar}.ts`.
- **Shared data** (the same in every language) is in **`src/content/site.ts`**:

| What | Where |
| --- | --- |
| Email, phone, LinkedIn, X, Instagram (empty = hidden) | `contact`, `socials` |
| Statistics (use real numbers only; `null` hides one) | `stats` |
| Tech stack | `stack` |
| Projects: links, tags, screenshot (`concept: true` adds a "Concept" label) | `projects` |
| Timeline links | `journey` |

### Photos

- Official portrait: `public/img/portrait.webp`, `portrait-sm.webp`, `portrait.jpg` (2:3) and `avatar.webp` (square). To change the photo, replace these files and keep the same names.
- Social share image (1200×630): `public/img/og.jpg`.
- Project screenshots: put a 1200×750 `name.webp` and a 720×450 `name-sm.webp` in `public/img/projects/`, then set `image: '/img/projects/name.webp'`. Projects without a screenshot show a designed UI preview.

DEVSPACE and NEXORA are example **concepts**. They are labelled "Concept" on the site. Replace them with real work when you can.

## Contact form

The site is static, so it has no server of its own. The form sends a JSON `POST` (`name`, `email`, `subject`, `message`) to whatever endpoint you set:

1. Create a form endpoint, for example at [Formspree](https://formspree.io): a new form gives a URL like `https://formspree.io/f/abcdwxyz`. A serverless function of your own also works.
2. For the GitHub Pages build: **Settings → Secrets and variables → Actions → Variables → New repository variable**. Name it `PORTFOLIO_CONTACT_ENDPOINT` and paste the URL as the value.
3. For local builds: copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_CONTACT_ENDPOINT`.

A public form URL is safe to put in client code. **Never put secret API keys in `NEXT_PUBLIC_*` variables.**

Without an endpoint, the form falls back to opening the visitor's email app if `contact.email` is set. With neither, the form tells the visitor it isn't connected yet and points to your profiles. It never pretends a message was sent.

## Deployment

- **GitHub Pages:** handled by `.github/workflows/pages.yml`, which builds with `NEXT_PUBLIC_BASE_PATH=/speaking-pretest/portfolio`.
- **Vercel / Netlify / own domain:** build with an empty `NEXT_PUBLIC_BASE_PATH`, set `NEXT_PUBLIC_SITE_URL` to the final URL (used for Open Graph and canonical links) and serve `out/`.

## Performance & accessibility notes

- The hero sphere is a ~2 KB canvas (no WebGL library). It loads after the main content and pauses when it is off-screen or the tab is hidden. It uses fewer points on phones and low-power devices and draws a single still frame when reduced motion is requested.
- The hero entrance is pure CSS, so text paints before JavaScript loads. Other reveals use IntersectionObserver through Motion and run once.
- The custom cursor, magnetic buttons, 3D tilt and pointer parallax are enabled only for a mouse or trackpad without reduced motion. The cursor's animation loop sleeps when the cursor is idle.
- Accessibility: skip link, landmarks, one `h1` and ordered headings, focus-visible rings, and a mobile menu with a focus trap that closes on Escape. Form errors are linked to their fields with `aria-describedby`, and form status is announced through `aria-live`.
