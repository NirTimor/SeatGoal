# Guide to setting up and publishing a website for purchasing tickets for football games in Israel

## Step 0 — Bootstrapping (1-2 days)
### 0.1 Creating a monorepo and folders
- Install pnpm and Turborepo, create a folder structure `apps/web`, `apps/api`, `packages/types`.
- Prepare `turbo.json` and `pnpm-workspace.yaml` files.

**DoD:** Structure is correct, `pnpm -w` command ran successfully.

**Claude Code Prompt:**
> Set up a monorepo with Turborepo and apps/web, apps/api, packages/types. Create a short README with installation and running instructions.

**Cursor Prompt:**
> Verify the monorepo structure with Turborepo and add scripts to package.json at the root level (`dev`, `build`, `lint`, `test`).

### 0.2 Creating Next.js (apps/web)
- Run `pnpm create next-app . --ts`.
- Install TailwindCSS, postcss, autoprefixer, i18next, next-intl.
- Update `tailwind.config.js` and `globals.css`.

**DoD:** `pnpm dev` is running a sample website.

**Cursor Prompt:**
> Set up Next.js 14 with Tailwind and next-intl, he/en support (with RTL when needed), and a blank homepage.

### 0.3 Creating NestJS (apps/api)
- Create a new NestJS project and add modules: Events, Seats, Cart, Checkout, Webhooks.

**DoD:** Local server is running and returning a healthy `/health`.

**Claude Code Prompt:**
> Create NestJS with basic modules, each with an empty Controller and Service.

### 0.4 Common Types Package
- Create a `packages/types` package with Zod.
- Add Event, Seat, HoldRequest, Order, etc. schemas.

**Claude Code Prompt:**
> Create Zod schemas for Event, Seat, HoldRequest, Order, CheckoutSession, etc. Export to index.ts.

### 0.5 GitHub + CI
- Upload to GitHub.
- Add CI in Actions that runs build/lint/test.

**Claude Code Prompt:**
> Write a CI file with pnpm build/lint/test and cache enabled.

---

## Step 1 — DB/Infra (3–4 days)

### 1.1 Postgres + Prisma
- Set up a DB in Neon/Supabase.
- Write a schema based on stadiums, seats, events, tickets_inventory, orders, etc. tables.

**Claude Code Prompt:**
> Build schema.prisma with the defined models, including indexes and FK. Run first migration.

### 1.2 Redis for Holds/Locks
- Install ioredis.
- Create RedisService with holdSeat, releaseHold, extendHold functions.

**Claude Code Prompt:**
> Create RedisService with SETNX and TTL to lock seats + RateLimiter by IP.

### 1.3 Auth
- Frontend: Clerk/Auth0 step.
- Backend: Write Guard for JWT.

**Cursor Prompt:**
> Clerk step, create SignIn/SignUp, verify RTL.

**Claude Code Prompt:**
> Create Guard that validates JWT and adds userId.

### 1.4 Basic Endpoints
- `GET /events`, `GET /events/:id/seats` with Redis cache.

**Claude Code Prompt:**
> Write Controllers with Redis cache (short TTL) and validation with Zod.

**Cursor Prompt:**
> Create pages in Next.js that display events and event details with TanStack Query.

---

## Step 2 — Basic Frontend (4–6 days)

### 2.1 i18n + RTL
**Cursor Prompt:**
> Implement next-intl with he/en, LocaleSwitcher, and full RTL support.

### 2.2 Seat Map Component (MVP)
- Load SVG of the stadium.
- Enable Pan/Zoom, Selection, and Tooltip.

**Cursor Prompt:**
> Create `<SeatMap stadiumId eventId />` with Pan/Zoom and Highlight by status.

### 2.3 Hold + Timer
- API: `POST /cart/hold` that returns holdId and expiresAt.

**Claude Code Prompt:**
> Write `POST /cart/hold` with SETNX per session and TTL.

**Cursor Prompt:**
> Integrate API Hold and show a 10 minute timer.

### 2.4 Checkout Redirect
- `POST /checkout/session` creates a session with a payment provider and returns a redirectUrl.

**Claude Code Prompt:**
> Write an Endpoint that creates a session with a Sandbox provider and keeps an order in PENDING state.

**Cursor Prompt:**
> Connect to the Checkout call and router.push(redirectUrl).

---

## Step 3 — Real checkout + Webhooks (2–4 days)

### 3.1 Payment Webhook
**Claude Code Prompt:**
> Write a WebhooksModule with signature verification and order update to PAID.

### 3.2 Success/Failure Page
**Cursor Prompt:**
> Create `/checkout/success` and `/checkout/fail` that display order details.

---

## Step 4 — Performance and Stability (3–5 days)

### 4.1 Cache + ETag
**Claude Code Prompt:**
> Add Redis cache, ETag and Cache-Control headers, and load test with k6.

**Cursor Prompt:**
> Manage caching in TanStack Query, reduce polling.

### 4.2 SVG/Canvas Optimizations
**Cursor Prompt:**
> Move heavy maps to Canvas, perform efficient hit-testing.

---

## Step 5 — Content, Legality, and Launch (2–3 days)

### 5.1 Terms of Service/Privacy
**Claude Code Prompt:**
> Create ToS/Privacy/Refund Policy in Hebrew/English Markdown.

**Cursor Prompt:**
> Create `/legal/*` pages that load the Markdown content.

### 5.2 SEO and Analytics
**Cursor Prompt:**
> Add Metadata API, sitemap.xml, Plausible/Umami.

### 5.3 Deployment and Distribution
**Claude Code Prompt:**
> Create vercel.json/wrangler.toml, set ENV secrets, and auto-deploy.

**Cursor Prompt:**
> Verify Preview for each PR and automatic Lighthouse testing.

---

## Critical Tests Before Preview
- [ ] Hold/Release OK under load.
- [ ] Webhook closes transactions without Double Sell.
- [ ] Full i18n.
- [ ] Real payment process in Sandbox environment.
- [ ] CI/CD runs automatically and deployment is fine.