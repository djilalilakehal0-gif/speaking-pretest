# Learnova: audit and backup (Phase 0)

## Architecture
- **One file:** `index.html` holds all the CSS, JavaScript and data. It uses plain JavaScript with no framework and has no build step.
- **No backend:** there is no server, API, migrations or real authentication.
- **Database:** the browser's `localStorage` under the key `leap-english-demo-v1`. The state object has `v: 1` and is created by `seed()` on first launch. It is saved through `save()`.
- **External dependencies:** Google Fonts and `qrcodejs@1.0.0` from cdnjs (used to draw the QR code on certificates).
- **Navigation:** there is no URL routing. The current screen lives in the `U.screen` variable, and `go()`, `back()` and `tabGo()` move between screens. Events are delegated through `data-a` (the `A` actions object) and `data-f` (the `F` forms object).
- **Roles (demo switcher):** student, trainer, admin.
- **Animation:** none, apart from a `pulse` on the live-class dot. There is no GSAP or Framer Motion.

## Existing screens
| Role | Screens |
|---|---|
| Student | auth (login / sign-up / forgot password), home, courses, course, enroll, pay, learning, player, lesson, schedule, more, progress, payments, certs, notifs, trainers, placement, support, verify, profile |
| Trainer | today, schedule, students, homework, slots, notifs |
| Admin | dash, payments, bookings, students, trainers, courses, levels, tests, att, hw, certs, notif, settings |

These screens **do not exist**, so they are not added: messages, exams separate from the placement test, actual video playback.

## Data structure (database schema)
The full shape is in `backup/schema.json`. Top-level keys:
`v, ui, settings, levels, cats, trainers, courses, students, enrollments, sessions, homework, certs, qs, mapping, notifs, notes`

## Student dashboard data dependencies (`scrHome`)
- `me()` → name, level
- `upcomingFor()` → next class (link, calendar, live badge) and upcoming classes
- `activeEnr()` and `compPct()` → my courses and completion
- `enrOf()` filtered by `booking_pending | payment_pending | rejected` → payment alerts
- `S.cats` → explore categories
- `unread()` → notification count
- `waLink()` → WhatsApp contact

## Backups
- `backup/index.original.html`: an exact copy of the original file. Its SHA-256 matches the uploaded ZIP:
  `5367ced3ba7861835486fac1413cd156fc3102da5ef7e59e459c7f4b4c936a59`
- `backup/seed-state.json`: a full export of the database after first launch, saved with the existing `save()` function.
- `backup/schema.json`: the structure of the data, for comparison after the changes.
- The git commit containing the original file is a second backup.

## Protection rules followed
The key `leap-english-demo-v1`, the version `v: 1`, the structure of `S` and `seed()`, and the logic in `A`/`F` are not changed. The redesign only adds CSS and display functions.
