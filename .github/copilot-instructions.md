    # GitHub Copilot Instructions — SeeThePrep

## Project Overview

Full-stack food delivery platform where customers can **watch their food being prepared in real-time** — live kitchen transparency from order placement to doorstep.

- **Backend**: .NET 8 Web API (`/src/FoodPlatform.Api/`)
- **Frontend**: Angular 17+ standalone components (`/client/src/app/`)
- **Database**: SQL Server via Entity Framework Core + Migrations
- **Auth**: JWT Bearer tokens
- **Background jobs**: Hangfire
- **Payments**: Stripe (PaymentIntents + Connect for restaurant payouts)
- **UI**: Angular Material M3 + custom dark glassmorphism design system

### Production Infrastructure
- **Frontend**: Deployed on **Vercel** → [seetheprep.com](https://seetheprep.com)
  - Deploy command: `cd client && vercel --prod`
  - Angular `fileReplacements` in `angular.json` swaps `environment.ts` → `environment.prod.ts` for prod builds
- **Backend**: Deployed on **Azure App Service** → `https://seetheprep-api.azurewebsites.net`
  - App name: `seetheprep-api`
  - Auto-deployed via GitHub Actions (`.github/workflows/azure-deploy.yml`) on push to `main` (paths: `src/**`)
  - Manual deploy: push to `main` or trigger `workflow_dispatch` in GitHub Actions
- **Database**: **Azure SQL** (managed, connected via connection string in Azure App Settings)
- **Secrets**: Stored as Azure App Settings (never in `appsettings.json` which is gitignored)
  - `Jwt__Key`, `Jwt__Issuer`, `Jwt__Audience`
  - `ConnectionStrings__DefaultConnection`
  - `Stripe__SecretKey`, `Stripe__WebhookSecret`
  - `Resend__ApiKey`, `Resend__FromAddress`
  - `Cors__AllowedOrigins__0` = `http://localhost:4200`
  - `Cors__AllowedOrigins__1` = `https://seetheprep.com`
  - `Cors__AllowedOrigins__2` = `https://www.seetheprep.com`
- **Production API URL** (in `environment.prod.ts`): `https://seetheprep-api.azurewebsites.net/api`

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
- `TiltDirective`, `ScrollRevealDirective`, `MagneticDirective` — each owns exactly one interaction behaviour

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
    customer/           # restaurant-list, restaurant-menu, checkout, order-tracking
    staff/              # dashboard
    admin/              # admin-panel
    auth/               # login, register
  shared/
    components/         # header, toast — reusable UI shells
    directives/         # tilt, scroll-reveal, magnetic — one behaviour each
    pipes/              # pure display transforms
    validators/         # uk-postcode — standalone validator factory
```

---

## Code Style Rules

### Angular / TypeScript
- **Standalone components** only — no `NgModule`
- All signals: use `signal()`, `computed()`, `effect()` — no `BehaviorSubject` in new code
- `readonly` on every injected service field and signal
- Template expressions must be pure — no method calls that cause change-detection churn; use `computed()` or pipes
- Use `@for`, `@if`, `@empty` Angular 17+ control flow — never `*ngFor` / `*ngIf`
- Pipe names: kebab-case file names, camelCase class names, kebab-case in templates
- No barrel-re-exports that create circular deps — import from the specific file

### SCSS / Styling
- Dark design system: `var(--surface-primary)`, `var(--brand-primary)`, `var(--brand-primary-rgb)`, `var(--text-primary)`, `var(--text-secondary)`, `var(--border-color)`, `var(--surface-card)`, `var(--shadow-card)`
- All interactive cards use `transform-style: preserve-3d` + `.card-glare` driven by `--glare-x`, `--glare-y`, `--glare-opacity` CSS vars (set by `TiltDirective`)
- `::ng-deep` only for Angular Material dark theme overrides; prefix with component class to reduce bleed
- No magic numbers — use CSS custom properties or `clamp()` for responsive values
- Keyframes defined globally in `styles.scss`; component SCSS only defines component-specific animations

### .NET / C#
- Controllers: thin — parse HTTP input, call service, map result to response. No business logic.
- Services: all async, return `ServiceResult<T>` for operations that can fail with domain errors
- Never `throw` generic `Exception` from a service — use `ServiceResult.Fail(...)` with a typed `OrderServiceError`
- All `DbContext` access inside the service layer — controllers never touch `DbContext`
- Registration: all services registered in `Infrastructure/ServiceCollectionExtensions.cs`

---

## UI Design System

### Visual Language
Every page uses the **dark glassmorphism + 3D interactive** design system:
- **Background**: dark radial gradients per page (each page has its own atmospheric palette)
- **Cards**: `glass-card` class — frosted glass (`backdrop-filter: blur(20px) saturate(150%)`), subtle border, `transform-style: preserve-3d`
- **3D tilt**: apply `appTilt [tiltMax]="10"` to every interactive card
- **Scroll reveal**: apply `appScrollReveal [revealDelay]="idx * 60"` for staggered entrance
- **Magnetic buttons**: apply `appMagnetic` to primary CTAs (place order, sign in, logout)

### Angular Material Usage
- `MatFormFieldModule` + `MatInputModule` — all form inputs; always add `.dark-field` class for dark theme overrides
- `MatButtonModule` — all buttons: `mat-flat-button` (primary), `mat-stroked-button` (secondary/danger)
- `MatChipsModule` — filter chips and tag displays
- `MatRippleModule` — interactive cards
- `MatTooltipModule` — action buttons (accept, reject, add to cart)
- `MatProgressBarModule` — progress indicators
- Never mix custom `<button class="btn btn-primary">` with Material buttons in the same component

### Material Icons
Use `<span class="material-symbols-rounded">icon_name</span>` for all icons.

---

## When Adding a New Feature

1. **Backend**: Create `I{Feature}Service` interface in `Services/Interfaces/` → implement in `Services/` → register in `Infrastructure/ServiceCollectionExtensions.cs` → inject into controller
2. **Frontend service**: Create `{feature}.service.ts` in `core/services/` — one HTTP concern per file
3. **Frontend component**: Standalone, inject services (never `new`), use signals, import only what is used
4. **Template**: Use `@for/@if/@empty`, Material components where applicable, `appTilt`+`appScrollReveal` on cards
5. **Styles**: Use CSS custom properties from the design system; glassmorphism `glass-card` for all card surfaces

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
