# GitHub Copilot Instructions — SeeThePrep

## Project Overview

Full-stack food delivery platform where customers can **watch their food being prepared in real-time** — live kitchen transparency from order placement to doorstep.

- **Backend**: .NET 8 Web API (`/src/FoodPlatform.Api/`)
- **Frontend**: Angular 19+ standalone components (`/client/src/app/`)
- **Database**: PostgreSQL (Neon) via Entity Framework Core + Migrations
- **Auth**: JWT Bearer tokens
- **Background jobs**: Hangfire
- **Payments**: Stripe (PaymentIntents + Connect for restaurant payouts)
- **UI**: Angular Material M3 + **warm cream light theme** design system

### Production Infrastructure
- **Frontend**: Deployed on **Vercel** → [seetheprep.com](https://seetheprep.com)
  - Deploy command: `cd client && vercel --prod`
  - Angular `fileReplacements` in `angular.json` swaps `environment.ts` → `environment.prod.ts` for prod builds
- **Backend**: Deployed on **Render** (Docker) → `https://seetheprep-api.onrender.com`
  - Service name: `seetheprep-api`
  - Defined in `render.yaml` at repo root — Render auto-deploys on push to `main` (Docker build)
  - Manual deploy: push to `main` or trigger a manual deploy in the Render dashboard
  - ⚠️ Free tier spins down after 15 min of inactivity (~30s cold start on first request)
- **Database**: **Neon** (serverless PostgreSQL) — connection string stored as a Render secret env var
  - Connection string format: `postgresql://user:pass@host/neondb?sslmode=require`
  - EF Core migrations run automatically on startup (`app.MigrateAsync()` in `Program.cs`)
- **Secrets**: Stored as Render Environment Variables (Dashboard → seetheprep-api → Environment)
  - `Jwt__Key`, `Jwt__Issuer`, `Jwt__Audience`
  - `ConnectionStrings__DefaultConnection` (Neon connection string)
  - `Stripe__SecretKey`, `Stripe__WebhookSecret`
  - `Resend__ApiKey`, `Resend__FromAddress`
  - `Angelcam__AccessToken`
  - CORS origins are set directly in `render.yaml` (non-secret)
- **Production API URL** (in `environment.prod.ts`): `https://seetheprep-api.onrender.com/api`

### Delivery Model
Delivery is **restaurant-managed** — every restaurant handles its own dispatch and drivers in-house. We do **not** build a courier marketplace, driver app, or platform-side driver assignment. The platform's role for delivery is:
- Capture the customer address and ETA
- Surface restaurant-reported status updates (e.g. `OutForDelivery`, `Delivered`)
- Optionally allow the restaurant to attach a driver name / contact / live location when they choose to share it
Do not introduce a `Driver`/`Courier` entity, role, or feature folder unless explicitly requested.

---

## SOLID Principles — Enforced Throughout

Every new file, class, service, component, or directive **must** follow all five SOLID principles. Add a JSDoc/XML-doc comment per class noting which principle(s) it demonstrates if it has a non-obvious design decision.

### S — Single Responsibility Principle
Each class/service owns exactly one concern.

**Backend examples:**
- `IJwtTokenService` / `JwtTokenService` — JWT generation only; no auth logic
- `IPasswordHasher` / `BcryptPasswordHasher` — hashing only; swap algorithm without touching `AuthService`
- `IAdminOrderService` vs `IAdminRestaurantService` — admin order ops separated from admin restaurant ops
- `IRestaurantQueryService` — read-only public queries; mutation is separate
- `OrderPollingService` (Angular) — polling responsibility extracted from `OrderTracking` component

**Frontend examples:**
- `HygieneStarsPipe`, `HygieneLabelPipe` — display formatting only
- `MenuItemEmojiPipe`, `RestaurantEmojiPipe`, `DietaryIconPipe` — emoji mapping only
- `OrderStatusEmojiPipe`, `OrderStatusLabelPipe` — status display only
- `IdempotencyKeyService` — idempotency key generation only
- `TokenStorageService` — localStorage read/write only; no business logic
- `TiltDirective`, `ScrollRevealDirective`, `MagneticDirective`, `ParallaxHoverDirective`, `RadialSelectDirective`, `StaggerRevealDirective` — each owns exactly one interaction behaviour

### O — Open/Closed Principle
Extend behaviour without modifying existing code.

**Backend:**
- `IPasswordHasher` interface allows swapping BCrypt → Argon2 without touching `AuthService`
- `ServiceResult<T>` struct — new error types can be added to `OrderServiceError` enum without changing callers

**Frontend:**
- `ORDER_STATUS_FLOW` constant in `models/index.ts` — add a new status by updating the array; no component changes needed
- `nextOrderStatus()` function in models — `Dashboard` calls this; no hardcoded transition arrays in components
- Pipes are `pure: true` by default — extend with new mappings without changing consumers

### L — Liskov Substitution Principle
Any implementation of an interface must be fully substitutable.

**Backend:**
- All service interfaces (`IAuthService`, `IOrderService`, `IMenuService`, etc.) are fully implemented by their concrete classes
- `IPasswordHasher` is injected into `AuthService` — any compliant hasher works
- Tests can supply mock implementations of any `I*Service` interface without side effects

**Frontend:**
- `AuthService` exposes `isLoggedIn()`, `isAdmin()`, `isStaff()`, `currentUser()` — `AuthGuard` and `AuthInterceptor` depend on the interface contract only

### I — Interface Segregation Principle
No class is forced to implement methods it doesn't use.

**Backend examples:**
- `IAdminOrderService` (3 methods) ≠ `IAdminRestaurantService` (4 methods) — not one fat `IAdminService`
- `IRestaurantQueryService` (read-only, 4 methods) ≠ menu/order mutation interfaces
- `IJwtTokenService` has exactly 1 method: `GenerateToken(User)`

**Frontend:**
- Services expose focused method sets: `RestaurantService` (list/get/getMenu), `OrderService` (place/list/accept/reject/cancel/dispute), `CartService` (addItem/removeItem/clear/computed signals)

### D — Dependency Inversion Principle
High-level modules depend on abstractions, not concrete implementations.

**Backend:**
- All controllers inject `I*Service` interfaces; no `new ConcreteService()` anywhere
- `Program.cs` wires everything via `AddApplicationServices()` extension — one registration point
- `AuthService` injects `IPasswordHasher` and `IJwtTokenService`; no `new BcryptPasswordHasher()` inside

**Frontend:**
- Components inject services via Angular DI; no `new ServiceName()` in components
- `AuthInterceptor` injects `TokenStorageService` — not `AuthService` — to avoid circular deps
- `Router` is injected into `Header` component, NOT into `AuthService` (avoids circular dependency)

---

## Architecture Map

```
/src/FoodPlatform.Api/
  Controllers/          # Thin — delegate to I*Service, map HTTP concerns only
  Services/
    Interfaces/         # I*Service contracts (DIP boundary)
    *.cs                # Concrete implementations
  Data/
    FoodPlatformDbContext.cs
    Entities/           # EF Core entities
  DTOs/
    Dtos.cs             # Request/response shapes only (no business logic)
  Infrastructure/       # Extension methods: AddDatabase, AddJwtAuthentication,
                        #   AddHangfireJobs, AddApplicationServices, AddApiCors

/client/src/app/
  core/
    auth/               # AuthGuard, AuthInterceptor, AuthService
    models/             # index.ts — all shared interfaces + ORDER_STATUS_FLOW
    services/           # One service per concern; thin Angular wrappers over HTTP
  features/
    customer/
      restaurant-list/  # Route "/" — marketing landing page + postcode search only
      restaurants-browse/ # Route "/restaurants" — grid, filters, search (PLANNED SPLIT)
      restaurant-menu/  # Route "/restaurant/:id"
      checkout/
      order-tracking/
      my-orders/
      profile/
    staff/              # dashboard
    admin/              # admin-panel
    auth/               # login, register, forgot-password, reset-password, verify-email
  shared/
    components/         # header, toast, logo, live-stream-player — reusable UI shells
    directives/         # tilt, scroll-reveal, magnetic, parallax-hover,
                        #   radial-select, stagger-reveal — one behaviour each
    pipes/              # pure display transforms
    validators/         # uk-postcode — standalone validator factory
```

### Planned: Home / Restaurants Split
`restaurant-list` (currently both marketing + browse grid) will be split:
- `restaurant-list` stays at `/` — marketing hero, postcode search, USP sections
- New `restaurants-browse` at `/restaurants` — compact strip header, cuisine/dietary filters, restaurant grid
- All `routerLink="/"` "Browse Restaurants" buttons → `/restaurants`
- Header "Restaurants" nav link → `/restaurants`
- Hero scroll cue / "Order now" CTA → `router.navigate(['/restaurants'])`
- Postcode search on home page → `router.navigate(['/restaurants'], { queryParams: { q: postcode } })`

---

## Code Style Rules

### Angular / TypeScript
- **Standalone components** only — no `NgModule`
- All signals: use `signal()`, `computed()`, `effect()` — no `BehaviorSubject` in new code
- `readonly` on every injected service field and signal
- Template expressions must be pure — no method calls that cause change-detection churn; use `computed()` or pipes
- Use `@for`, `@if`, `@empty` Angular 19 control flow — never `*ngFor` / `*ngIf`
- Pipe names: kebab-case file names, camelCase class names, kebab-case in templates
- No barrel-re-exports that create circular deps — import from the specific file
- **Keep files under 500 lines** — split into focused components/services if exceeded

### SCSS / Styling — Warm Cream Light Theme
The design system is a **warm cream light theme**. Do NOT use old dark-mode tokens.

**Core CSS custom properties:**
- Background: `var(--bg, #fffcf7)` — NOT `--surface-primary`
- Primary brand: `var(--primary)` = `#ff6b1a` orange — NOT `--brand-primary`
- Text: `var(--text)`, `var(--text-secondary)`, `var(--text-muted)`
- Borders: `var(--border)`, `var(--border-light)`, `var(--border-strong)`
- Soft background: `var(--bg-soft, #fff6ec)`
- Shadows: `var(--shadow-md)`, `var(--shadow-sm)`

**Brand SCSS variables (use in component SCSS files):**
- `$brand: #ff6b1a`, `$brand-pink: #ff3d8a`, `$live: #00d4aa`, `$green: #1a9b5a`

**Typography:**
- `var(--font-display)` = Fraunces (display/headings, italic serif)
- `var(--font-sans)` = Plus Jakarta Sans (body/UI)
- `var(--font-mono)` = JetBrains Mono (numbers/countdown)

**Page backgrounds:** `radial-gradient` per page using brand colours at 6–12% opacity over `var(--bg, #fffcf7)`.

**Cards:** `.glass-card` = `background: #fff; border: 1px solid var(--border); border-radius: 20px; box-shadow: var(--shadow-md)`

**Interactive cards:** `appTilt [tiltMax]="10"` + `appScrollReveal [revealDelay]="idx * 60"`

**`::ng-deep`** only for Angular Material light-theme overrides (field bg `#fafaf8`, border `var(--border)`, label `var(--text-secondary)`); always prefix with the component class.

**No magic numbers** — use CSS custom properties or `clamp()`.

### Angular Material Usage
- `MatFormFieldModule` + `MatInputModule` — all form inputs; add `.dark-field` class for overrides
- `MatButtonModule` — `mat-flat-button` (primary), `mat-stroked-button` (secondary/danger)
- `MatChipsModule` — filter chips and tag displays
- `MatRippleModule` — interactive cards
- `MatTooltipModule` — action buttons
- `MatProgressBarModule` — progress indicators
- Never mix custom `<button class="btn">` with Material buttons in the same component

### Material Icons
Use `<span class="material-symbols-rounded">icon_name</span>` for all icons.

### .NET / C#
- Controllers: thin — parse HTTP input, call service, map result to response. No business logic.
- Services: all async, return `ServiceResult<T>` for operations that can fail with domain errors
- Never `throw` generic `Exception` from a service — use `ServiceResult.Fail(...)` with a typed `OrderServiceError`
- All `DbContext` access inside the service layer — controllers never touch `DbContext`
- Registration: all services registered in `Infrastructure/ServiceCollectionExtensions.cs`

---

## UI Design System

### Visual Language
Every page uses the **warm cream light theme**:
- **Background**: `#fffcf7` (warm cream) with per-page radial gradient tints in brand colours
- **Cards**: `.glass-card` — white bg, `var(--border)` border, 20px radius, `var(--shadow-md)`
- **3D tilt**: `appTilt [tiltMax]="10"` on every interactive card
- **Scroll reveal**: `appScrollReveal [revealDelay]="idx * 60"` for staggered entrance
- **Magnetic buttons**: `appMagnetic` on primary CTAs
- **Parallax hover**: `appParallaxHover` on hero sections
- **Stagger reveal**: `appStaggerReveal` on headline words

### Header (`shared/components/header/`)
Flat minimal header — **do not add pill containers or cards to the nav**:
- Logo: bare `<app-logo>` wordmark, no border/card
- Nav: flat links, `::after` 2px orange underline active state
- Scrolled: `is-scrolled` class → `backdrop-filter: blur(20px)` + hairline border
- Logged out: ghost `btn-signin` + filled `btn-getstarted`
- Logged in: avatar pill with dropdown sheet
- No live-kitchens pill (removed)

---

## When Adding a New Feature

1. **Backend**: Create `I{Feature}Service` → implement → register in `ServiceCollectionExtensions.cs` → inject into controller
2. **Frontend service**: `{feature}.service.ts` in `core/services/` — one HTTP concern per file
3. **Frontend component**: Standalone, signals, import only what is used, under 500 lines
4. **Template**: `@for`/`@if`, Material components, `appTilt`+`appScrollReveal` on cards
5. **Styles**: Warm cream tokens; `.glass-card` for card surfaces; per-page radial-gradient background

---

## Common Pitfalls to Avoid

- ❌ Don't add business logic to controllers — delegate to `I*Service`
- ❌ Don't call `new` on services in Angular components — always inject via DI
- ❌ Don't use `*ngFor`/`*ngIf` — use `@for`/`@if`
- ❌ Don't import `CommonModule` — import specific pipes (`DatePipe`, `CurrencyPipe`) individually
- ❌ Don't hardcode order status arrays — use `ORDER_STATUS_FLOW` from `core/models`
- ❌ Don't put CSS in `styles.scss` that belongs in a component's own `.scss` file
- ❌ Don't use `throw new Exception("message")` from services — use `ServiceResult.Fail`
- ❌ Don't put `Router` into `AuthService` — inject it into the component/guard that needs navigation
- ❌ Don't use old dark-mode tokens (`--surface-primary`, `--brand-primary`, `--brand-primary-rgb`, `--text-primary`, `--border-color`, `--surface-card`) — use warm cream tokens
- ❌ Don't exceed 500 lines per file — split into focused components/services
- ❌ Don't commit `*-original.mp4` files — compressed versions only
- ❌ Don't use `routerLink="/"` for "Browse Restaurants" links — use `routerLink="/restaurants"` (after the split)
