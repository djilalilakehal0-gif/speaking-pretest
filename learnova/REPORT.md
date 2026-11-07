# Learnova Dark Premium: delivery report

| Phase | Scope | Commit |
|---|---|---|
| 0 | Audit plus a verified backup | `8e03c35` |
| 1 | Student dashboard | `a5319cf` |
| 2a | All student pages inside a shared shell | `0eddc8a` |
| 2b | Login, sign-up and certificate verification | (stage 2 commit) |
| 2c–2d | Modals, trainer console, admin console, final checks | (final commit) |

## Modified files
- `index.html`: `git diff --stat 8e03c35`: **577 lines added, 3 changed**. The 3 changed lines:
  1. `renderStudent()`: the login screen goes through `lxAuth()` instead of `<div class="phone">`.
  2. `renderTrainer()`: the classes `lx-t lx-console` were added to `<div class="console">`.
  3. `renderAdmin()`: the same change.
- Everything else is additions: CSS under `.lx`/`.lx-t`, Arabic and English strings, `scrDash()`, `lxShell()`, `lxAuth()`, `lxArt()`, `lxAnimate()`, `lxKey()`, and `F.dashSearch`.
- **The application logic is unchanged:** the `A` actions, `F` forms, `seed()`, `save()`, and every page function (`scrCourses`, `trToday`, `adDash`…) are untouched. The page functions are now just displayed inside the new frame.

## New components
- **Shared design system:** colour tokens (`.lx-t`) that recolour the existing components as well (cards, buttons, inputs, tables, chips, pills, slots, progress bars, modals, toasts).
- **Student frame `lxShell`:** sidebar, top bar with search, language, notifications and profile, and a tab bar on phones.
- **Student dashboard:** described in the Phase 1 section below.
- **Login screen `lxAuth`:** brand panel with an illustration, plus the existing form in a glass card.
- **Trainer and admin consoles:** dark sidebar, gradient active tab, glass statistics cards with gradient numbers.
- **Kept as they were on purpose:** the certificate (paper style, for printing) and the bank-receipt image.

## Pages migrated (all existing pages, nothing added)
- **Student (22 screens and modals):** home, courses, course, enroll, pay, learning, player, lesson, schedule, more, progress, payments, certs, certificate sheet, notifs, trainers, trainer sheet, placement, placement questions, support, verify, profile, reset-data sheet.
- **Logged out:** login, sign-up, verify.
- **Trainer (7):** today, schedule, students, homework, slots, notifs, attendance sheet.
- **Admin (15):** dash, payments, bookings, students, trainers, courses, levels, tests, att, hw, certs, notif, settings, receipt sheet, course form.

## Database and backend protection
- No backend, API or migrations exist. The key `leap-english-demo-v1` and `v: 1` are unchanged.
- An automated test after the full user journeys confirmed **the top-level schema and the record shape** for students, courses, enrollments, sessions, certs, trainers and notifs **match the backup**.
- Backup: `backup/index.original.html` (SHA-256 `5367ced3…`), `backup/seed-state.json`, `backup/schema.json`, plus the baseline git commit.

## Tests actually run (Playwright + Chromium)
**1. Screenshot pass over every screen, desktop 1440px and iPhone 13:**
- 22 student screens, 2 logged-out screens, 7 trainer screens and 15 admin screens.
- Result: all dark, no horizontal overflow, **no JavaScript errors**.

**2. End-to-end regression of user journeys: 21/21 passed.**
- Enroll in a group course → upload a receipt → admin approves → course activated, student notified → the course appears on the dashboard (KPI = 2).
- Lesson: quiz answer saved, lesson marked complete (2→3) · homework submitted, trainer notified · trainer records attendance, session ends.
- Admin issues a certificate → it appears for the student · certificate verified by ID · admin settings saved · new account created → placement test.

**3. Dashboard and accessibility checks: 42/42 passed.**
- Real data · every sidebar link opens its page inside the new frame · search · RTL↔LTR switching · keyboard focus ring (Tab) · logout and login.
- Reduced motion · about 58 FPS with the CPU throttled 4× · no horizontal overflow at 360, 390, 768, 1024 and 1440 px.

**Note:** earlier failures in these runs were test-script errors, not page errors. Causes: clicking hidden elements on the phone layout; the "add to course" button being missing on a course the student was already enrolled in; stale expectations for the old page frame. They were corrected and the full runs repeated.

## Screenshots (`docs/screenshots/`)
- **Dashboard:** `desktop-1440-ar`, `desktop-1440-en`, `tablet-820-ar`, `mobile-iphone-ar`, `4k-2560-en`.
- **Pages:** `student-course-desktop`, `student-lesson-desktop`, `student-player-mobile`, `auth-signup-desktop`, `auth-login-mobile`, `trainer-today-desktop`, `admin-dashboard-desktop`, `admin-payments-desktop`, `admin-course-form-desktop`.
- **Overview sheets:** `overview-student-pages`, `overview-admin-pages`.
- **Before:** `before-desktop-ar`.

## Remaining notes
1. **Reference images:** the converted PDF text contains no images. The design follows the written description, so a side-by-side comparison with the reference image was not possible.
2. **Theme button:** the guide mentions a theme button. The language switch was used instead, because the platform has no theme switcher.
3. **Old function kept:** `scrHome()` is still in the file, unused, as a quick way to revert the home screen.
4. **Wide-screen layout of old pages:** pages inherited from the phone design (courses, lessons…) now appear on desktop in a centred column up to 920px wide inside the new frame. Building separate desktop layouts for them would be a further phase if you want one.
5. **External resource in the test environment:** an external resource (Google Fonts or the QR library) did not load in the test environment because of the sandbox network. This is not related to the code.

---

## Phase 1 details (student dashboard)
- **Components:** hero with an illustration · progress ring and level ladder · 4 KPI cards · continue learning · upcoming lessons · explore · achievements · goal banner.
- **Data sources (real data only):** `upcomingFor`, `activeEnr`, `compPct`, `attPct`, `quizAvg`, `S.certs`, `LEVELS_ORDER`.
- **Animation:** an entrance animation runs only on the first visit to each page, using `transform`/`opacity`. Counters use `requestAnimationFrame`, and all motion stops when the user has reduced motion enabled.
