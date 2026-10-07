# Surfer Test — Explore India with a Local

A production-shaped MVP marketplace connecting tourists with verified local student guides across India.
**Stack:** Next.js 15 (App Router, Server Actions) · TypeScript · PostgreSQL + Prisma · Auth.js (email + Google) · Razorpay · Cloudflare R2 · Resend · Tailwind + shadcn-style components.

## Features
- **Tourists:** destination/attraction search, guide discovery with filters, booking + Razorpay checkout, chat, reviews, cancellations with tiered refunds, disputes & reports.
- **Guides:** application with KYC, availability & pricing, booking accept/reject/start/complete, earnings & payout tracking, public review responses.
- **Admin:** analytics dashboard, user/guide management, KYC review queue (signed private docs), location management, bookings, disputes with refunds, payout processing, review moderation, reports, audit log, settings.

## Quick start
```bash
npm install
cp .env.example .env        # fill in secrets (see below)
npx prisma migrate dev --name init
npm run db:seed             # demo data + logins below
npm run dev                 # http://localhost:3000
```

### Demo accounts (password: `password123`)
| Role | Email |
|---|---|
| Admin | `admin@surfer.test` |
| Guides | `rahul@guide.test` · `priya@guide.test` · `arjun@guide.test` · `sneha@guide.test` · `vikram@guide.test` |
| Tourist | `tourist@demo.test` |

### Required env vars
See `.env.example`. Minimum to boot: `DATABASE_URL`, `AUTH_SECRET`. Payments need Razorpay **test** keys (test card `4111 1111 1111 1111`); email is skipped gracefully without a Resend key; KYC uploads need R2 keys.

## Scripts
| Command | Purpose |
|---|---|
| `npm run dev` / `build` / `start` | Next.js lifecycle |
| `npm run db:migrate` / `db:seed` / `db:studio` | Prisma workflows |
| `npm test` | Vitest unit/integration (webhook signature, policy, booking & review guards) |
| `npm run test:e2e` | Playwright booking-flow + RBAC tests (needs seeded dev server + Razorpay test keys) |

## Architecture
Modular monolith. Business logic lives in `services/` behind provider interfaces (`payments`, `storage`, `notifications`) so gateways/buckets/emailers are swappable. All mutations are Server Actions validated with Zod and authorized server-side (`lib/rbac.ts`) — including ownership checks on every booking lookup to prevent IDOR. Sensitive admin actions write to the append-only `AdminAction` audit log.

Key design notes:
- **Double-booking guard:** transactional count check against `maxBookingsPerDay` inside `createBookingRequest`.
- **Review integrity:** `Review.bookingId` is unique → exactly one review per booking, only when `COMPLETED`.
- **KYC privacy:** only last-4 ID digits stored; documents live in a private R2 bucket, served via short-lived signed URLs after a role check (`/api/files/signed-url`).
- **Payments:** webhook signature verified against the raw body before parsing; handler is idempotent.

## Deploy
1. Vercel (framework: Next.js) + managed Postgres (Neon/Supabase) + Cloudflare R2 (public bucket for avatars, private bucket for KYC).
2. Set all env vars from `.env.example`.
3. Release step: `npx prisma migrate deploy`.
4. Configure the Razorpay webhook → `https://<host>/api/webhooks/razorpay` with `payment.captured`, `payment.failed`, `refund.processed`.

## Docs
- `docs/PRD.md` — product requirements
- `docs/ARCHITECTURE.md` — system design, permission matrix, roadmap
