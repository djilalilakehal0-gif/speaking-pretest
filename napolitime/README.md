# NAPOLITIME — Taste the Moment.

Single-page restaurant website for a Neapolitan pizza & gourmet burger brand.
React 19 · TypeScript · Vite · Tailwind CSS 4 · Framer Motion · GSAP (ScrollTrigger) · Lottie.

Published by the Pages workflow at `/napolitime/` (e.g. `https://<user>.github.io/speaking-pretest/napolitime/`).

```bash
cd napolitime
npm install
npm run dev        # http://localhost:5960
npm run build      # typecheck + production build into dist/
```

## Where to edit things

| What | File |
| --- | --- |
| Name, address, phone, e-mail, socials, opening hours, delivery fees | `src/config/site.ts` |
| Menu (products, prices in €, ingredients, allergens, tags) | `src/data/menu.ts` |
| Meal deals, reviews, ingredient copy | `src/data/content.ts` |
| Photos | `scripts/photos.json` → `node scripts/fetch-photos.mjs` (writes `public/img/*-640.webp` + `*-1280.webp`) |

**Demo content:** the address, phone, e-mail, social links, prices and reviews are placeholders.
While `site.isDemo` is `true` a notice is shown in the footer. Replace the sample reviews with real ones before launch.

Food photography comes from Unsplash (Unsplash License, free for commercial use); sources and photographers are listed in `scripts/photos.json`.

## Ordering — what is real and what is not

The cart, quantities, delivery/pickup choice, fees, minimum order and form validation all work in the browser.
**No payment is taken on the site, and an order is never shown as confirmed unless a real backend confirms it.**

* **No backend configured (default):** after validation the customer sees a clear "online ordering isn't connected yet — your order has *not* been placed" message, with buttons to call the restaurant, send the order by e-mail (pre-filled), or copy the order text.
* **Backend configured:** set `VITE_ORDER_ENDPOINT` (build time; for GitHub Pages use the repository variable `NAPOLITIME_ORDER_ENDPOINT`). The site sends:

```json
POST <VITE_ORDER_ENDPOINT>   Content-Type: application/json
{
  "fulfilment": "delivery" | "pickup",
  "items": [{ "id": "margherita", "qty": 2 }],
  "customer": { "name": "", "phone": "", "email": "", "address": "", "postcode": "", "notes": "" },
  "clientTotal": 23.5
}
```

The endpoint must use HTTPS, allow CORS from the site's origin, **recompute prices from item ids on the server**
(never trust `clientTotal`), and answer `2xx` with `{ "orderId": "A123", "message": "optional text" }`.
Any other answer is shown to the customer as "not sent". Error responses may include `{ "error": "message" }`.

Newsletter: `VITE_NEWSLETTER_ENDPOINT` (repository variable `NAPOLITIME_NEWSLETTER_ENDPOINT`) receives `POST { "email" }`.
Without it, the form opens a pre-filled e-mail to the restaurant instead.

Customer details are kept in memory only; the browser stores just the cart (product ids + quantities) and favourites.

## Motion & accessibility

* Loader, hero parallax, pinned pizza → burger transition (GSAP ScrollTrigger); staggered reveals, filters, drawer, modal (Framer Motion); "added to cart" burst (Lottie, `src/lottie/added.json`, loaded lazily).
* Custom animated SVG icon set in `src/components/icons/Icons.tsx`: stroke draw-on, flame flicker, scooter wheels, clock hands, cart bounce, heart/plus→check/menu→close morphs.
* `prefers-reduced-motion` is respected everywhere (Framer `MotionConfig`, GSAP `matchMedia`, CSS, canvas particles off).
* Skip link, focus-trapped dialogs with Escape, labelled controls, live regions for cart updates and errors.

## Android app

The same site is packaged as an Android app with [Capacitor](https://capacitorjs.com) (`capacitor.config.json`, app id `com.napolitime.app`).

**Automatic build:** every push to `main` that touches `napolitime/` runs
`.github/workflows/build-napolitime-apk.yml` (or run it by hand: Actions → *Build NAPOLITIME Android APK* → Run workflow).
It publishes a signed `NAPOLITIME.apk` in Releases under the tag `napolitime-1.N`. Permanent download link:

```
https://github.com/djilalilakehal0-gif/speaking-pretest/releases/download/napolitime-1.<N>/NAPOLITIME.apk
```

The APK is signed with the same key and `KEYSTORE_PASSWORD` secret as the Speaking Pre-Test app, and every build gets a
higher version number, so new versions install over the old one.

**Local build** (needs Android Studio or the Android SDK + JDK 21):

```bash
npm run android:sync     # build the site and copy it into android/
npx cap open android     # open in Android Studio, or: cd android && ./gradlew assembleDebug
```

App behaviour: the hardware back button closes the cart / product details / menu first, then scrolls to the top, then
exits; phone, e-mail, map and social links open the phone's dialer, mail app, Maps or browser.
Icon and splash screen come from `assets/` (regenerate with `node scripts/make-app-assets.cjs`).
The app works offline for browsing once installed (all photos and fonts are bundled); ordering follows the same rules as the website.
