# 🚘 Driving School Dashboard

A small driving-school management dashboard built with **Angular 17**. It manages drivers, routes, driver-to-route assignments, and a monthly driver-availability calendar. All data is seeded from a mock JSON file and lives entirely in local (in-memory) state — there is no backend or database.

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Features Implemented](#features-implemented)
3. [Pages & Routes](#pages--routes)
4. [Data Model](#data-model)
5. [State Management (DataService)](#state-management-dataservice)
6. [Mock Data](#mock-data)
7. [Setup Instructions](#setup-instructions)
8. [npm Scripts](#npm-scripts)
9. [Project Structure](#project-structure)
10. [Styling & Design Tokens](#styling--design-tokens)
11. [Layout & Animations](#layout--animations)
12. [Assumptions Made](#assumptions-made)
13. [Known Limitations](#known-limitations)
14. [Testing](#testing)
15. [Troubleshooting](#troubleshooting)

---

## Tech Stack

| Tool | Version | Purpose |
|---|---|---|
| Angular | ^17.3.0 (CLI 17.3.17) | Framework — standalone components, no NgModules |
| TypeScript | ~5.4.2 | Strict typed code |
| RxJS | ~7.8.0 | `firstValueFrom` for the one-shot JSON fetch |
| Express | ^4.18.2 | Production SSR server (`server.ts`) |
| Zone.js | ~0.14.3 | Change detection runtime |
| Karma / Jasmine | 6.x / 5.x | Unit tests (run in Chrome) |

Key architectural choices:

- **Standalone components** with the new template control flow (`@if`, `@for`, `@empty`) — no NgModules anywhere.
- **Signals-based state** — a single root-injectable `DataService` holds `drivers` and `routes` as signals; every page derives its view with `computed()`, so any change (assign, add, toggle) is reflected everywhere instantly.
- **Typed reactive forms** (`FormBuilder.nonNullable.group`) with declarative validators and inline error messages.
- **SSR + hydration** — Express + `CommonEngine` server, `provideClientHydration()` to avoid re-render flicker, and prerendering enabled for production builds.
- **One global stylesheet** (`src/styles.css`) with CSS custom-property design tokens; the per-component `.css` files exist but are intentionally empty.

---

## Features Implemented

### Dashboard (`/`)
- Four animated KPI cards: total routes, assigned routes, unassigned routes, and available drivers (x / total).
- Global search matching route name, origin, destination, or assigned driver name (routes) and name, license, or phone (drivers).
- Route status filter pills (All / Assigned / Unassigned) and a driver availability dropdown (All / Available / Off duty), combined with search.
- Routes & assignments table with a per-row driver assignment select — assign any driver, or choose “— None —” to unassign; off-duty drivers are labelled “(off duty)”.
- Driver list with initials avatars, availability badges, and a one-click “Set off duty / Set available” toggle.
- Assigning or unassigning a driver **pulses** the affected KPI cards (Web Animations API — replays on every change).

### Drivers (`/drivers`)
- Reactive “Add a new driver” form with typed, non-nullable controls and inline validation errors:
  - name: required, 3–60 characters;
  - license: required, 3–12 characters of letters/digits/dashes (`^[A-Za-z0-9][A-Za-z0-9-]{2,11}$`);
  - phone: required, 7+ digits with optional `+`, spaces, parentheses, dashes (`^[+0-9][0-9\s()-]{6,16}$`);
  - “Available for assignments” checkbox (default on).
- Success notice after adding; the form resets on submit; invalid submits mark all fields as touched.
- Live search by name, license, or phone.
- Driver cards showing initials avatar, license, phone, number of assigned routes, number of marked days off, availability badge, and the availability toggle button.
- Empty state when no drivers match the search.

### Routes (`/routes`)
- Reactive “Add a new route” form with validation: route name (3–60 chars), required origin/destination (≤ 40 chars), and departure time (`HH:mm`, via a `type="time"` input guarded by `/^([01]\d|2[0-3]):[0-5]\d$/`, default `08:00`).
- New routes are added as **unassigned**, with a success notice; invalid submits mark fields as touched.
- All-routes table with live search (name, origin, destination, driver), status filter pills (All / Assigned / Unassigned), and a per-row assign/unassign select.
- Empty state when no routes match.

### Availability Calendar (`/calendar`)
- Month grid (Sun–Sat headers) with previous / today / next navigation and a long month/year label (`en-US` locale).
- Always renders **6 full weeks (42 cells)**; days from adjacent months are dimmed; today is highlighted.
- Per-day chips for every available driver: green when available that day, dashed/struck-through when marked off.
- Click a driver chip to toggle that specific day off or back on — updates instantly across all pages via the shared state.
- Legend explaining chip colors and that off-duty drivers are hidden.

### Cross-cutting
- Page `<title>` per route; wildcard paths redirect to the Dashboard; `routerLinkActive` highlighting in the sidebar.
- Loading states while the JSON seed loads; empty states for every list.
- Accessibility basics: `aria-label`s on icon-only controls, search inputs, filter groups, and the navigation; `role="status"` on success notices; semantic headings/tables/lists.

---

## Pages & Routes

| Path | Component | Page `<title>` |
|---|---|---|
| `/` | `DashboardComponent` | Dashboard · Driving School |
| `/drivers` | `DriversComponent` | Drivers · Driving School |
| `/routes` | `RoutesComponent` | Routes · Driving School |
| `/calendar` | `CalendarComponent` | Availability Calendar · Driving School |
| `**` (anything else) | — | Redirects to `/` |

---

## Data Model

Defined in `src/app/Core/Models/models.ts`:

```ts
export interface Driver {
  id: string;                 // "d1", "d2", … (generated client-side)
  name: string;
  license: string;
  phone: string;
  available: boolean;          // overall availability flag
  unavailableDates: string[];  // ISO dates (yyyy-MM-dd) individually marked off
}

export interface DriveRoute {
  id: string;                  // "r1", "r2", … (generated client-side)
  name: string;
  origin: string;
  destination: string;
  scheduledTime: string;        // 24h "HH:mm" string
  assignedDriverId: string | null;
}

export interface DashboardData {
  drivers: Driver[];
  routes: DriveRoute[];
}
```

Helpers exported from the same file:

| Function | Example |
|---|---|
| `initialsOf(name)` | `"AJ"` for `"Alice Johnson"` (first two initials — avatars) |
| `firstNameOf(name)` | `"Alice"` for `"Alice Johnson"` (calendar chip label) |

---

## State Management (DataService)

`src/app/Core/Services/data.service.ts` — `@Injectable({ providedIn: 'root' })`, constructed once, shared by all pages. Seed data is fetched from `/assets/data.json` via `HttpClient`; every mutation afterwards lives in memory only.

| Member | Kind | Description |
|---|---|---|
| `drivers` | `signal<Driver[]>` | All drivers |
| `routes` | `signal<DriveRoute[]>` | All routes |
| `loaded` | `signal<boolean>` | Flips true once the JSON has loaded |
| `load()` | method | Fetches the seed JSON once; a failure allows a later retry |
| `driverById(id)` | method | Finds a driver by id (null-safe) |
| `driverName(id)` | method | Driver name or `''` for null/unknown |
| `addDriver(input)` | method | Prepends a driver, generates the next `dN` id |
| `addRoute(input)` | method | Prepends a route as unassigned, generates the next `rN` id |
| `assignDriver(routeId, driverId)` | method | Assigns a driver to a route (`null` = unassign) |
| `toggleAvailability(driverId)` | method | Flips the overall `available` flag |
| `toggleDriverDate(driverId, dateIso)` | method | Adds/removes one ISO date from `unavailableDates` |
| `isAvailableOn(driver, dateIso)` | method | `available && !unavailableDates.includes(dateIso)` |

IDs are generated as `d1, d2, …` / `r1, r2, …` by scanning the current max numeric id and adding 1 (`nextId`). They only need to be unique within a session.

---

## Mock Data

`src/assets/data.json` — 4 drivers and 4 routes:

```json
{
  "drivers": [
    { "id": "d1", "name": "Alice Johnson", "license": "DL-48291", "phone": "+1 555-0142", "available": true,  "unavailableDates": [] },
    { "id": "d2", "name": "Bob Smith",    "license": "DL-77104", "phone": "+1 555-0198", "available": false, "unavailableDates": [] },
    { "id": "d3", "name": "Carla Gomez", "license": "DL-91562", "phone": "+1 555-0117", "available": true,  "unavailableDates": [] },
    { "id": "d4", "name": "Daniel Osei",  "license": "DL-33870", "phone": "+1 555-0163", "available": true,  "unavailableDates": [] }
  ],
  "routes": [
    { "id": "r1", "name": "Route A — City Loop",       "origin": "Main Station",  "destination": "Riverside Park", "scheduledTime": "08:00", "assignedDriverId": "d1" },
    { "id": "r2", "name": "Route B — Airport Shuttle", "origin": "Central Depot", "destination": "Terminal 2",    "scheduledTime": "09:30", "assignedDriverId": null },
    { "id": "r3", "name": "Route C — Campus Express",  "origin": "North Gate",     "destination": "University",    "scheduledTime": "07:15", "assignedDriverId": "d3" },
    { "id": "r4", "name": "Route D — Harbor Run",      "origin": "Fish Market",    "destination": "Old Harbor",   "scheduledTime": "14:00", "assignedDriverId": null }
  ]
}
```

Edit this file to change what the app loads on startup (changes require a page reload — mutations are never written back).

---

## Setup Instructions

### Prerequisites

- [Node.js](https://nodejs.org/) **18.13+ or 20.x** (LTS recommended — required by Angular CLI 17)
- npm (bundled with Node.js)
- Google Chrome (only needed to run unit tests)

### Install

```bash
npm install
```

### Development server

```bash
npm start
```

Navigate to `http://localhost:4200/`. The app reloads automatically when source files change.

### Production build (SSR, prerendered)

```bash
npm run build
```

Artifacts land in `dist/driving-dashboard/` (browser + server bundles).

### Serve the production build

```bash
npm run serve:ssr:driving-dashboard
```

Serves the built app with the Express/SSR server at `http://localhost:4000/` (configurable via the `PORT` environment variable — see `server.ts`).

### Unit tests

```bash
npm test
```

Runs the Karma/Jasmine specs in Chrome.

---

## npm Scripts

| Script | Command | What it does |
|---|---|---|
| `start` | `ng serve` | Dev server at `localhost:4200` with live reload |
| `build` | `ng build` | Production build (SSR + prerender) into `dist/` |
| `watch` | `ng build --watch --configuration development` | Rebuild on every change |
| `test` | `ng test` | Karma/Jasmine unit tests in Chrome |
| `serve:ssr:driving-dashboard` | `node dist/driving-dashboard/server/server.mjs` | Runs the built SSR server on port 4000 |

---

## Project Structure

```
driving-dashboard/
├── server.ts                           # Express + CommonEngine SSR server (port 4000)
├── angular.json                        # SSR entry, prerender: true, build budgets
├── package.json
└── src/
    ├── index.html                      # viewport meta, <app-root>
    ├── main.ts / main.server.ts        # browser / server bootstrap
    ├── styles.css                      # ALL global styles, design tokens, responsive tiers
    ├── assets/
    │   └── data.json                   # mock seed data (4 drivers, 4 routes)
    └── app/
        ├── app.component.ts/.html/.css # App shell: sidebar + topbar + main area
        ├── app.config.ts               # provideRouter, provideClientHydration, provideHttpClient(withFetch)
        ├── app.config.server.ts        # server-side bootstrap providers
        ├── app.routes.ts               # route table + page titles + wildcard redirect
        ├── app.component.spec.ts       # shell specs (title, 4 nav links)
        ├── Core/
        │   ├── Models/models.ts        # Driver, DriveRoute, DashboardData + name helpers
        │   └── Services/
        │       ├── data.service.ts     # signals-based in-memory store
        │       └── data.service.spec.ts
        └── Pages/
            ├── Dashboard/dashboard/    # KPIs, search, filters, assignment table, driver list
            ├── Drivers/drivers/        # add-driver form + driver cards
            ├── Routes/routes/          # add-route form + routes table
            └── calendar/calendar/      # monthly availability calendar
```

Each page folder holds the standalone component (`*.ts`), template (`*.html`), a spec file (`*.spec.ts`), and an intentionally empty per-component stylesheet (all styles are global).

---

## Styling & Design Tokens

All styling lives in **`src/styles.css`**, organized in labeled sections: layout helpers, sidebar, topbar, cards, stats, badges, buttons, forms, toolbar/search/filters, tables, driver lists/cards, notices, split layouts, calendar, loading states, and the responsive tiers.

Design tokens are CSS custom properties on `:root`:

| Token | Value | Use |
|---|---|---|
| `--bg` | `#eef2f7` | Page background |
| `--surface` | `#ffffff` | Cards, sidebar, topbar |
| `--border` | `#dde5ee` | All hairline borders |
| `--text` / `--text-muted` | `#17233a` / `#5d6c85` | Primary / secondary text |
| `--primary` / `--primary-strong` / `--primary-soft` | `#2f6bff` / `#1e54dd` / `#e8efff` | Buttons, active nav, focus rings |
| `--success` / `--success-bg` | `#15803d` / `#dcfce7` | Available badges/chips |
| `--warning` / `--warning-bg` | `#92400e` / `#fef3c7` | Unassigned badges |
| `--danger` / `--danger-bg` | `#b91c1c` / `#fee2e2` | Validation errors |
| `--radius` / `--shadow` / `--shadow-lift` | `12px` / soft / hover shadows | Cards and elevation |

---

## Layout & Animations

### Sidebar Navigation
- Replaced the top navigation bar with a fixed left sidebar containing the brand, the four nav links (Dashboard, Drivers, Routes, Calendar) and a demo-data note
- The active route is highlighted in the sidebar (`routerLinkActive`)
- Responsive behavior is mobile-first around a single `min-width: 1024px` breakpoint:
  - **≥ 1024px (desktop):** the sidebar is a static sticky column that stays in view while the page scrolls; no topbar
  - **< 1024px (tablet/phone):** the sidebar becomes an off-canvas drawer — a sticky topbar with a ☰ menu button opens it, and tapping the backdrop or a nav link closes it
- No page footer — the demo-data note lives at the bottom of the sidebar instead

### Responsive grids (all pages)
- Dashboard KPI cards: 4 columns ≥ 1024px, 2 columns below, 1 column ≤ 560px
- Dashboard content and the Drivers/Routes "form + list" split: two columns ≥ 1280px, stacked below — sections stay full-width through the 1024–1279px range so tables keep enough room
- Routes page: its form column is 320px (instead of 360px) so the 4-column table gets extra width, and schedule text wraps instead of overflowing
- Data tables (Dashboard, Routes): tables scroll inside their card when needed, and ≤ 720px each row becomes one stacked card with uppercase field labels (`data-label`) — no horizontal scrolling
- Driver cards auto-fill (`minmax(240px, 1fr)`); driver rows wrap fluidly, with the availability badge + toggle dropping to a right-aligned second line on narrow screens
- Stacked form cards are capped at 560px so they don't stretch too wide; form controls render at 16px below 1024px so iOS Safari doesn't zoom the viewport on focus
- The calendar compacts its cells/chips on phones (≤ 640px): tighter cells, ellipsized availability chips, month label on its own line — the grid can never overflow the viewport

### Animations
Added smooth micro-interactions and transitions throughout the dashboard (all disabled under `prefers-reduced-motion`):
- **KPI stat cards:** staggered fade/slide/scale pop-in on load (0.45s with per-card delays), a hover lift (via the `translate` property so it composes with the entrance keyframes), and a continuous soft pulse ring around the stat icons
- **Assignment feedback:** assigning or unassigning a driver pulses the "Assigned routes" / "Unassigned routes" cards via the Web Animations API (`element.animate`), so the pulse replays on every change
- **Rows:** table rows and driver-list rows enter with a staggered fade/slide-in (0.32s, per-`nth-child` delays)
- **Transitions:** smooth hover/focus transitions on buttons, inputs, filter pills, and nav links; the mobile drawer slides in/out and its backdrop fades (0.3s ease)

---

## Assumptions Made

1. **No real backend.** Data is seeded from the static mock file `src/assets/data.json`, fetched via `HttpClient`. There is no REST API and no database.
2. **No persistence.** Every change (adding drivers/routes, assigning drivers, marking days off, toggling availability) lives in memory only. Reloading the page resets the app to the seed data — nothing is written back to `data.json`, `localStorage`, or a server.
3. **IDs are generated client-side** as simple `d1, d2, …` / `r1, r2, …` sequences (max existing numeric id + 1). They are not UUIDs and only need to be unique within a session.
4. **Assignment does not enforce availability.** An off-duty driver can still be assigned to a route (the select marks them “(off duty)” as a hint; KPIs don't validate against it).
5. **The calendar shows only drivers flagged as available overall.** Off-duty drivers are hidden until set back to available; their existing day-off marks are preserved.
6. **Availability is two-level:** an overall `available` flag per driver, plus individual `unavailableDates` for specific days. A driver shows as off on a given day if either the flag is off or the day is marked.
7. **The calendar always renders six full weeks (42 cells)** per month, including leading/trailing days from adjacent months (dimmed), so the grid height is stable.
8. **Times are plain 24-hour `HH:mm` strings** without timezone or duration handling; no scheduling/conflict detection between routes.
9. **Search is a case-insensitive substring match** on a fixed set of fields. No fuzzy matching, no pagination — the dataset is small.
10. **Phone and license validation is pattern-based and generic**, not tied to any specific country format.
11. **Single-user, single-session app** — no authentication, roles, or concurrent editing.
12. **The UI is English-only** (month labels use the `en-US` locale).
13. **Deleting/editing existing drivers and routes is intentionally not implemented** — the assignment select's “— None —” option is the only way to unassign a driver.

---

## Known Limitations

- **Everything resets on reload** (in-memory state by design — see assumptions).
- **SSR ships a loading state:** the seed JSON is fetched with a relative URL, which Node can't resolve during server rendering — the server-rendered HTML shows the loading message and the data appears right after hydration. Purely cosmetic on slow connections.
- **The KPI hover lift uses the CSS `translate` property** (Chrome 104+ / Safari 14.1+ / Firefox 72+). Older browsers simply don't get the lift — everything else works.
- **Tests require Chrome** (Karma `ChromeLauncher`); no headless CI configuration is set up.
- **`npm test` can fail to bundle** until the `node:test` import in `dashboard.component.spec.ts` is removed — see [Testing → Known quirk](#known-quirk).
- **No delete or edit operations** for drivers/routes.
- The `anyComponentStyle` build budget (4kb error) encourages keeping all styles global.

---

## Testing

Unit tests are written with **Karma + Jasmine** and run in Chrome via `npm test`. Spec files exist for the app shell, the `DataService`, and every page component.

### What is covered
- `app.component.spec.ts` — the shell creates; the `title` property equals `'driving-dashboard'`; the sidebar renders exactly 4 nav links and the "Dashboard" label
- `data.service.spec.ts` — the signals-based store, the widest coverage in the suite:
  - loading: the `/assets/data.json` GET is expected and flushed, then `loaded()` is true, driver/route counts match the seed, and `driverName('d1')` resolves
  - id generation: `addDriver` prepends with generated id `d3`; `addRoute` prepends as **unassigned** with generated id `r3`
  - assignment: `assignDriver` sets and clears `assignedDriverId` on a route
  - availability: `toggleAvailability` flips the flag; `toggleDriverDate` adds then removes a date; `isAvailableOn` is false on a marked day
- `dashboard.component.spec.ts` — the page renders "Assigned" / "Unassigned" statuses and the seeded driver name
- `drivers.component.spec.ts` — the page renders the add-driver `<form>` and the seeded driver card
- `routes.component.spec.ts` — the page renders the add-route `<form>` and the route status badges
- `calendar.component.spec.ts` — the grid renders exactly **42 `.cal-cell` elements** (six weeks) with weekday headers, and only globally available drivers appear (Alice yes, off-duty Bob no)

### How the tests are set up
- **Real store, fake HTTP:** every page/service spec registers `provideHttpClient()` + `provideHttpClientTesting()`, so `HttpTestingController` intercepts the `/assets/data.json` request and flushes a small inline seed — no real backend or asset server needed
- **Seeding happens in `beforeEach`:** `httpMock.expectOne('/assets/data.json').flush(seed)` followed by `fixture.detectChanges()` guarantees each test starts from a fresh, loaded store
- **No leaked requests between tests:** `afterEach(() => httpMock.verify())` fails the run if any expected HTTP call was left unanswered or an unexpected one was made
- **Router in the shell spec:** `provideRouter([])` gives `routerLink`/`routerLinkActive` an empty route table to bind against, without real navigation
- **Assertions go through the DOM:** specs read `fixture.nativeElement` (`textContent`, `querySelector('form')`, `.cal-cell` counts) — the same markup a user sees

### Running the tests
- `npm test` — launches Chrome (via Karma's `ChromeLauncher`) in **watch mode** and re-runs on file changes
- `npm test -- --watch=false` — a single run, useful in CI
- Chrome must be installed; no headless-browser CI configuration is set up

### Known quirk
- `dashboard.component.spec.ts` imports `{ describe, beforeEach, afterEach, it } from 'node:test'` — a Node-only module that Jasmine already provides as globals. The bundler cannot resolve `node:test` in a browser test run, which can break the whole suite; deleting that import line is the fix.

---

## Troubleshooting

- **"My CSS/layout changes don't show up."** Stop and restart `ng serve`, then hard-refresh the browser (Ctrl+F5). If you're looking at the SSR production server on **port 4000**, it serves whatever is in `dist/` — rebuild with `npm run build` after any code change, otherwise you're viewing the old build.
- **Port confusion:** `4200` = live dev server; `4000` = built SSR server. They are different processes serving different builds.
- **Unit tests won't start:** Chrome must be installed (Karma launches it via `karma-chrome-launcher`).
- **Animations look disabled:** check the OS/browser "reduce motion" setting — the app honors `prefers-reduced-motion: reduce` by disabling all entrance animations.
- **Inputs zoom the page on iPhone:** already handled — form controls render at 16px below 1024px. If you still see zoom, confirm you're on the latest CSS (see the first bullet).

---

## Further Help

- Angular CLI commands: `ng help` or the [Angular CLI Overview and Command Reference](https://angular.io/cli).
- Scaffolding new code: `ng generate component component-name` (also `directive|pipe|service|class|guard|interface|enum`).
