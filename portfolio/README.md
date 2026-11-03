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

The site is static, so it has no server of its own. The form picks the first channel that is configured:

1. **Form endpoint** (`NEXT_PUBLIC_CONTACT_ENDPOINT`, e.g. Formspree): the message is POSTed as JSON (`name`, `email`, `subject`, `message`) and delivered without leaving the page.
2. **WhatsApp (active now)** (`contact.whatsapp` in `src/content/site.ts`): the button reads "Send via WhatsApp". It opens WhatsApp (the app on phones, WhatsApp Web on computers) with the message ready for your number, and the visitor presses send. Nothing is stored on the site, and the message text follows the page language.
3. **Email** (`contact.email`): opens the visitor's email app with the message ready.

Even with an endpoint set, the WhatsApp card stays in "Prefer a direct line?". To switch WhatsApp off, set `whatsapp: ''`.

To use an endpoint instead: create one (for example at [Formspree](https://formspree.io)). For GitHub Pages, add it as the repository variable `PORTFOLIO_CONTACT_ENDPOINT` (**Settings → Secrets and variables → Actions → Variables**). For local builds, set it in `.env.local`. A public form URL is safe in client code. **Never put secret API keys in `NEXT_PUBLIC_*` variables.**

## Deployment

### Netlify (address without "github", e.g. `https://djilali.netlify.app`)

`netlify.toml` at the repository root holds all the settings: base `portfolio`, build `npm ci && npm run build`, publish `out`, Node 22. It also skips builds when nothing in `portfolio/` changed.

1. Sign in at [app.netlify.com](https://app.netlify.com) with **GitHub**.
2. **Add new project → Import an existing project → GitHub →** `speaking-pretest`. The settings are filled in from `netlify.toml`; click **Deploy**.
3. **Project configuration → Change project name →** `djilali` (or any free name). The site becomes `https://djilali.netlify.app`.
4. **Deploys → Trigger deploy** once more, so canonical and Open Graph links use the new name. Netlify passes its address to the build as `URL`.

After that, every push to `main` that touches `portfolio/` redeploys automatically. A custom domain (e.g. `djilali.dev`) can be added later under **Domain management**.

### GitHub Pages

`.github/workflows/pages.yml` builds with `NEXT_PUBLIC_BASE_PATH=/speaking-pretest/portfolio`.

### Other hosts

Build with an empty `NEXT_PUBLIC_BASE_PATH`, set `NEXT_PUBLIC_SITE_URL` to the final address and serve `out/`. Cloudflare Pages also passes its address automatically (`CF_PAGES_URL`).

## Performance & accessibility notes

- The hero sphere is a ~2 KB canvas (no WebGL library). It loads after the main content and pauses when it is off-screen or the tab is hidden. It uses fewer points on phones and low-power devices and draws a single still frame when reduced motion is requested.
- The hero entrance is pure CSS, so text paints before JavaScript loads. Other reveals use IntersectionObserver through Motion and run once.
- The custom cursor, magnetic buttons, 3D tilt and pointer parallax are enabled only for a mouse or trackpad without reduced motion. The cursor's animation loop sleeps when the cursor is idle.
- Accessibility: skip link, landmarks, one `h1` and ordered headings, focus-visible rings, and a mobile menu with a focus trap that closes on Escape. Form errors are linked to their fields with `aria-describedby`, and form status is announced through `aria-live`.
