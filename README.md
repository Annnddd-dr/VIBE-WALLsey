# POSTERraxx

Premium wall-poster e-commerce app for the Indian market. Next.js 14 (App Router) + TypeScript + Tailwind, Prisma/PostgreSQL, NextAuth, Razorpay, Resend.

## Stack

- **Frontend:** Next.js 14, React 18, TypeScript, Tailwind CSS, Framer Motion, lucide-react
- **Backend:** Next.js Route Handlers (API routes), TypeScript
- **Database:** PostgreSQL via Prisma ORM
- **Auth:** NextAuth (credentials + Google OAuth), bcrypt password hashing, email verification
- **Payments:** Razorpay (Checkout + server-side order creation + webhook signature verification)
- **Email:** Resend (gracefully no-ops if `RESEND_API_KEY` isn't set — logs to console instead)
- **Image storage:** Cloudinary-ready (not wired to an upload flow yet — see Known Limitations)

## What's built

- Full Prisma schema: users/auth, addresses, categories, products, variants (size × material × frame), inventory, cart, wishlist, orders, order items, payments, shipments, coupons, coupon usage, reviews, notifications.
- Storefront: home, shop (filter/sort/paginate), category pages, product detail with variant pricing, cart page + slide-out drawer, fullscreen search.
- Auth: email/password registration with email verification, sign-in, Google OAuth (if configured).
- **Checkout is server-authoritative end to end:** cart contents, prices, stock, and coupon discounts are all re-derived from the database on every request — nothing is trusted from the client. See `src/lib/pricing.ts` and `src/lib/orders.ts`.
- Razorpay: order creation, client-side Checkout, server-side HMAC signature verification (`/api/checkout/verify`), plus an idempotent webhook (`/api/webhooks/razorpay`) as the authoritative source of truth for payment state. Also supports Cash on Delivery as a configurable method.
- Inventory is decremented transactionally only on confirmed payment (or COD commit), guarding against oversells and duplicate webhook/retry confirmations.
- Admin dashboard (`/admin`, gated by role — OWNER/ADMIN/MANAGER/STAFF): stats, recent orders, product list, order list with status updates (which trigger a status email).
- Account area: order history, order status.
- SEO: per-product metadata, OpenGraph, JSON-LD product schema, `sitemap.xml`, `robots.txt`.
- Seed script: 12 categories, ~33 products, each with 5 sizes × 3 materials × 4 frames = 60 variants with independent SKU/price/stock, plus two sample coupons and an OWNER admin account.

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
| `GOOGLE_CLIENT_ID` / `SECRET` | Google sign-in | Optional — omitted, Google button just won't appear as a working provider |
| `RAZORPAY_KEY_ID` / `KEY_SECRET` | Online payments | From Razorpay dashboard → Settings → API Keys |
| `RAZORPAY_WEBHOOK_SECRET` | Payment webhook | Set the same secret when adding the webhook URL in Razorpay |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Checkout UI | Same as `RAZORPAY_KEY_ID`, public-safe (publishable key only) |
| `RESEND_API_KEY`, `EMAIL_FROM` | Transactional email | Without it, emails are logged to console instead of sent |
| `CLOUDINARY_*` | Image uploads | Only needed once you build an admin image-upload flow (see limitations) |
| `NEXT_PUBLIC_SITE_URL` | Emails, sitemap, OG tags | e.g. `https://posterraxx.com` in production |

### Creating the first admin

The seed script creates one:
```
email: owner@posterraxx.com
password: ChangeMe123!
```
**Change this password immediately** (e.g. via Prisma Studio: `npm run db:studio`, or build a password-change flow) — it's a well-known default from this README.

To promote any other existing user to admin, update their `role` column to `ADMIN`, `MANAGER`, or `STAFF` directly in the database (or via Prisma Studio).

### Razorpay setup

1. Create a Razorpay account, get **Test Mode** API keys first.
2. Set `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` / `NEXT_PUBLIC_RAZORPAY_KEY_ID`.
3. In the Razorpay dashboard, add a webhook pointing to `https://<your-domain>/api/webhooks/razorpay`, subscribed to at least `payment.captured` and `payment.failed`. Set `RAZORPAY_WEBHOOK_SECRET` to match.
4. Test with Razorpay's test card/UPI credentials before going live.

### Deployment

Deployment-ready for Vercel:
1. Push to a git repo, import into Vercel.
2. Add all environment variables from `.env.example` in the Vercel project settings.
3. Use a managed Postgres (Neon, Supabase, RDS, Railway, etc.) for `DATABASE_URL`.
4. Run `npx prisma migrate deploy` as part of your build/release step (or manually against the production DB before first deploy).
5. Point the Razorpay webhook at your production domain.

## Known limitations (be aware before treating this as launch-ready)

- **No admin product create/edit/image-upload UI yet.** The admin product page is read-only; creating/editing products currently goes through Prisma Studio or direct DB writes. The Cloudinary env vars are wired but there's no upload endpoint yet — that's the next piece to build.
- **No customer address book / saved addresses UI**, no wishlist persistence UI (schema supports it), no review-submission form (schema + display support it, submission doesn't exist yet).
- **No OTP/phone auth** — only email/password and Google OAuth are implemented, per NextAuth's supported providers. Phone OTP would need a provider like Twilio/MSG91 wired in separately.
- **Custom poster designer, room preview, abandoned-cart recovery emails, Shiprocket integration** are all deferred — the schema and architecture (modular shipping/payment layers) support adding them without a rewrite, but the actual UI/integration code isn't built.
- **Coupon UI is minimal** (apply-by-code on cart/checkout); there's no admin coupon-creation screen yet.
- No automated test suite included yet (Vitest is in devDependencies, ready to use).
- This was built and reviewed for logic/type-correctness but **has not been run through a live `npm install && npm run build`** in this environment (no package-registry network access here) — do that locally as your first step; fix any dependency-version drift if newer/older package releases changed an API slightly since these versions were pinned.

## Project structure

```
prisma/schema.prisma       Database schema
prisma/seed.ts             Sample data
src/lib/                   Server logic: prisma client, auth, pricing, orders, razorpay, email, cart
src/components/            UI components (ui/, layout/, cart/, product/, marketing/)
src/app/                   Routes (App Router) + API routes under src/app/api/
```
