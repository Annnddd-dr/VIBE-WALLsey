# VIBEWALLseyy

Premium wall-poster e-commerce platform with a cinematic sunrise/night-sky identity. Next.js 14 (App Router) + TypeScript + Tailwind, Prisma/PostgreSQL, NextAuth, Razorpay, Resend.

> **The atmosphere creates the emotion. The UI creates the clarity.**

## Stack

- **Frontend:** Next.js 14, React 18, TypeScript, Tailwind CSS, Framer Motion, lucide-react
- **Backend:** Next.js Route Handlers (API routes), TypeScript
- **Database:** PostgreSQL via Prisma ORM
- **Auth:** NextAuth (credentials + Google OAuth), bcrypt password hashing, email verification
- **Payments:** Razorpay (Checkout + server-side order creation + webhook signature verification) + Cash on Delivery
- **Email:** Resend (gracefully no-ops if `RESEND_API_KEY` isn't set — logs to console instead)
- **Image storage:** Cloudinary (admin uploads + custom-poster submissions)

## Visual identity

Two global environments, cross-fading over ~1s when toggled:

- **Light — SUNRISE:** warm ivory base (#FFF9F0), golden light diffusion, extremely slow breathing sun-glow and faint rising motes.
- **Dark — CLEAR NIGHT SKY:** deep navy/near-black (#05070D), canvas-rendered starfield with per-star twinkling, and one very subtle shooting star every ~9–18s.
- Toggle via the ☀/☾ button in the header (persists in localStorage, no flash on reload).
- Honors `prefers-reduced-motion` (static frames, no large animation).
- `/admin` is excluded — the panel stays a light, professional SaaS surface.

## What's built

- Full Prisma schema: users/auth, addresses, categories, products, variants (size × material × frame), inventory, cart, wishlist, orders, order items, payments, shipments, coupons, coupon usage, reviews, notifications.
- Storefront: cinematic home (hero, category cards, "PEOPLE ARE LOVING", How It Works, customer-wall gallery), shop (filter/sort/paginate), product detail with variant pricing, cart page + slide-out drawer, fullscreen search, mobile bottom navigation.
- **Custom poster studio** (`/custom`): upload artwork, choose size/material/frame, live framed preview, room visualizer, server-side pricing, one-click add-to-cart.
- Auth: email/password registration with email verification, sign-in, password reset flow, Google OAuth (if configured).
- **Checkout is server-authoritative end to end:** cart contents, prices, stock, and coupon discounts are all re-derived from the database on every request — nothing is trusted from the client. See `src/lib/pricing.ts` and `src/lib/orders.ts`.
- Razorpay: order creation, client-side Checkout, server-side HMAC signature verification (`/api/checkout/verify`), plus an idempotent webhook (`/api/webhooks/razorpay`) as the authoritative source of truth for payment state.
- Inventory is decremented transactionally only on confirmed payment (or COD commit), guarding against oversells and duplicate webhook/retry confirmations.
- **Public order tracking** (`/track-order`): order number + email/mobile lookup with an animated six-stage timeline — no login required.
- Account area: order history, order details with fulfillment timeline, address book with default address.
- Admin panel (`/admin`, gated by role — OWNER/ADMIN/MANAGER/STAFF): dashboard, analytics, products (full CRUD + Cloudinary uploads), categories CRUD, orders with status + shipment tracking, custom orders queue, customers, review moderation (approve/hide/delete with rating recompute), shipping overview, coupons, settings overview.
- SEO: per-product metadata, OpenGraph, JSON-LD product schema, `sitemap.xml`, `robots.txt`.
- Seed script: categories, ~33 products with 5 sizes × 3 materials × 4 frames = 60 variants each (SKU/price/stock), sample coupons, and an OWNER admin account.

## Getting started

```bash
npm install
cp .env.example .env       # then fill in the values below
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```

Visit `http://localhost:3000`.

### Environment variables

| Variable | Required for | Notes |
|---|---|---|
| `DATABASE_URL` | Everything | PostgreSQL connection string |
| `NEXTAUTH_URL`, `NEXTAUTH_SECRET` | Auth | `openssl rand -base64 32` for the secret |
| `GOOGLE_CLIENT_ID` / `SECRET` | Google sign-in | Optional — the Google button simply won't appear if unset |
| `RAZORPAY_KEY_ID` / `KEY_SECRET` | Online payments | From Razorpay dashboard → Settings → API Keys |
| `RAZORPAY_WEBHOOK_SECRET` | Payment webhook | Set the same secret when adding the webhook URL in Razorpay |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Checkout UI | Publishable key, safe for the browser |
| `RESEND_API_KEY`, `EMAIL_FROM` | Transactional email | Without it, emails are logged to console instead of sent |
| `CLOUDINARY_*` | Image uploads | Admin product images + custom-poster submissions |
| `NEXT_PUBLIC_SITE_URL` | Emails, sitemap, OG tags | e.g. `https://vibewallsey.com` in production |
| `FREE_SHIPPING_THRESHOLD_INR` | Shipping | Cart value above which shipping is free (default 500) |
| `FLAT_SHIPPING_RATE_INR` | Shipping | Flat fee below the threshold (default 99) |

### Creating the first admin

The seed script creates one:
```
email: owner@vibewallsey.com
password: ChangeMe123!
```
**Change this password immediately.**

To promote any other user, update their `role` column to `ADMIN`, `MANAGER`, or `STAFF` via Prisma Studio (`npm run db:studio`).

### Razorpay setup

1. Create a Razorpay account, get **Test Mode** API keys first.
2. Set `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` / `NEXT_PUBLIC_RAZORPAY_KEY_ID`.
3. In the Razorpay dashboard, add a webhook pointing to `https://<your-domain>/api/webhooks/razorpay`, subscribed to at least `payment.captured` and `payment.failed`. Set `RAZORPAY_WEBHOOK_SECRET` to match.
4. Test with Razorpay's test card/UPI credentials before going live.

### Deployment

1. Push to a git repo, import into Vercel.
2. Add all environment variables from `.env.example` in the Vercel project settings.
3. Use a managed Postgres (Neon, Supabase, RDS, Railway, etc.) for `DATABASE_URL`.
4. Run `npx prisma migrate deploy` as part of your release step.
5. Point the Razorpay webhook at your production domain.

## Project structure

```
prisma/schema.prisma       Database schema
prisma/seed.ts             Sample data
src/lib/                   Server logic: prisma, auth, pricing, orders, razorpay, email, cart
src/components/
  background/              AtmosphericBackground (Sunrise + NightSky layers)
  theme/                   ThemeProvider + animated ThemeToggle
  layout/                  Navbar, Footer, SearchOverlay, MobileBottomNav
  product/ cart/ ui/       Storefront components
src/app/                   Routes (App Router) + API routes under src/app/api/
```
