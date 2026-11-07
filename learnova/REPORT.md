# Learnova Dark Premium: Phase 1 report (student dashboard)

## Scope
Only the student dashboard (the home screen) was redesigned, as the guide requires. The other pages keep their current look until the dashboard is approved.

## Modified files
- `index.html`: **additions only** (`git diff --stat`: 449 lines added, 0 deleted)
  - A CSS block scoped under `.lx`: design tokens plus the dashboard components.
  - New strings added via `Object.assign(L, {...})`, in Arabic and English.
  - `scrDash()`, `lxArt()` (an SVG illustration), and `lxAnimate()` (counters and the progress ring).
  - `F.dashSearch`, which passes the search text to the existing course filter `U.f.q`.
  - One line in `renderStudent()` that routes `home` to `scrDash()`. One line in `render()` that toggles the page background.
- The old `scrHome()` function is still in the file unchanged, so you can revert by restoring that one line.

## New components (scoped under `.lx`)
Sidebar · top bar (search, language, notifications, profile) · hero with an illustration · learning-progress panel (ring + level ladder) · 4 KPI cards · continue learning · upcoming lessons · explore categories · achievements · next-goal banner · dark mobile tab bar.

## Real data (no invented numbers)
| Component | Source |
|---|---|
| Next class, Join/Calendar links, live status | `upcomingFor()`, `isLive()`, `calLink()` |
| Active courses, lessons completed, overall completion | `activeEnr()`, `e.done`, `c.lessons` |
| Attendance / quiz average | the mean of `attPct()` / `quizAvg()` (shows "—" when there is no data) |
| Payment alerts | `enrOf()` with statuses `booking_pending`, `payment_pending`, `rejected` |
| Achievements | `S.certs` for the student plus the current level |
| Next goal | the level after `u.level` in `LEVELS_ORDER` |

## Database and backend protection
- No backend, API or migrations exist in the project. The storage key `leap-english-demo-v1` and `v: 1` are unchanged.
- An automated test after login/logout and navigation confirmed **the data structure is identical** to `backup/schema.json`.
- Backup: `backup/index.original.html` (SHA-256 `5367ced3…` matches the uploaded file) plus `seed-state.json` plus the baseline git commit.

## Tests actually run (Playwright + Chromium)
**40 of 41 automated checks passed.** The one failure was the focus-ring check: programmatic `focus()` does not trigger `:focus-visible`. Retested with real Tab key presses, the cyan outline appears on every dashboard button.
- Navigation from the sidebar to all 10 existing screens works. Those screens still open in their original light style.
- Search → courses (the "IELTS" query returns 1 result) · continue learning → lesson player · category → filtered list · payment alert → payments · certificate → certificate sheet.
- Arabic ↔ English with correct RTL/LTR switching · logout → login with the demo account → dashboard.
- The trainer and admin consoles are unchanged · no JavaScript errors.
- Reduced motion (`prefers-reduced-motion`): animations stop and values appear immediately.
- Performance: about **58 FPS** during the entrance animation with the CPU throttled 4×, as a stand-in for a mid-range Android phone. The worst single frame was 67 ms, once.
- No horizontal scrolling at 360, 390, 768, 1024 or 1440 px.

## Screenshots inspected (`docs/screenshots/`)
`desktop-1440-ar` · `desktop-1440-en` · `tablet-820-ar` · `mobile-iphone-ar` · `4k-2560-en` · plus `before-desktop-ar` (before the change).

## Remaining notes
1. **Reference images:** the converted PDF text contains no images (as requested, the pages were not read as images). The design follows the guide's written description, so a side-by-side comparison with the image was not possible. Attaching the image files would allow a precise match.
2. The theme button from the description was replaced with a language switch, because the platform has no theme switcher and the guide says not to invent features.
3. The "Continue learning" section looks empty with a single active course, because it shows real data only.
4. In the test environment, an external resource (Google Fonts or the QR library) failed to load because of the sandbox network. This is not related to the code.
5. The remaining pages (courses, lessons, schedule, trainer, admin…) will be migrated one at a time after you approve the dashboard.
