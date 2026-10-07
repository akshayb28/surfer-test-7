# Surfer Test — Architecture & Engineering Plan

## 1. Architecture: Modular Monolith (Next.js App Router)
- **Frontend + BFF:** Next.js 15 + TypeScript (App Router, Server Components, Server Actions).
- **Styling:** Tailwind CSS + shadcn/ui + React Hook Form + Zod.
- **DB:** PostgreSQL (Supabase/Neon) + Prisma ORM.
- **Auth:** Auth.js (NextAuth v5) — credentials + Google OAuth; role on session.
- **Storage:** Cloudflare R2 (S3-compatible). Public bucket for avatars; PRIVATE bucket for KYC with short-lived signed URLs.
- **Payments:** Razorpay (abstracted behind `services/payments/provider.ts` interface).
- **Email:** Resend via `services/notifications/provider.ts` interface (SMS/WhatsApp later).
- **Deploy:** Vercel + managed Postgres + R2. No Docker/K8s at MVP.

## 2. Folder Structure
```
surfer-test/
├── app/
│   ├── (public)/            # landing, search, guide profiles (SEO-friendly)
│   ├── (tourist)/tourist/   # dashboard, bookings, messages
│   ├── (guide)/guide/       # dashboard, availability, earnings, kyc
│   ├── (admin)/admin/       # all admin sections
│   ├── api/                 # webhooks (razorpay), signed-url, etc.
│   └── auth/                # Auth.js routes
├── components/              # ui/ (shadcn), guides/, booking/, admin/
├── lib/                     # prisma client, auth, rbac, utils, constants
├── services/                # business logic (swappable providers)
│   ├── payments/            # razorpay.ts, types.ts, index.ts
│   ├── storage/             # r2.ts, types.ts
│   ├── notifications/       # resend.ts, email-templates/
│   └── bookings/ reviews/ kyc/ payouts/
├── emails/                  # React Email templates
├── prisma/                  # schema.prisma, migrations/, seed.ts
├── validations/             # zod schemas (mirror of form inputs)
├── types/                   # shared TS types
├── tests/                   # unit + integration + e2e (Playwright)
└── middleware.ts            # route guard by role
```

## 3. API / Server Action Surface
All mutations are Server Actions with Zod validation + `requireRole()` check. Key actions:

| Area | Actions |
|---|---|
| auth | register, login, oauth callbacks |
| search | `searchDestinations(q)`, `listGuides(filters)` |
| booking | `createBookingRequest`, `payBooking`, `acceptBooking`, `rejectBooking`, `startTour`, `completeTour`, `cancelBooking` |
| review | `createReview`, `respondToReview`, `moderateReview` |
| guide | `submitGuideApplication`, `updateProfile`, `setAvailability`, `setPricing`, `requestPayout` |
| admin | `reviewKyc`, `setGuideStatus`, `setUserStatus`, `manageLocation`, `resolveDispute`, `processRefund`, `markPayout`, `updateSettings` |
| messaging | `sendMessage`, `getConversation` |
| api routes | `POST /api/webhooks/razorpay`, `GET /api/files/signed-url` |

## 4. Role / Permission Matrix
| Capability | Tourist | Guide | Admin |
|---|---|---|---|
| Search / view public profiles | ✓ | ✓ | ✓ |
| Book / pay | ✓ | – | – |
| Manage own profile | ✓ (tourist scope) | ✓ (guide scope) | – |
| Accept/reject own bookings | – | ✓ | – |
| Message in own bookings | ✓ | ✓ | (read for disputes) |
| Submit/review KYC | apply | – | verify |
| Manage users/guides/locations | – | – | ✓ |
| Refunds / disputes / payouts | request | request | ✓ |
| View revenue analytics | – | own earnings only | ✓ |
| Moderate reviews | – | respond to own | ✓ |

Enforcement: `lib/rbac.ts` + session role; every Server Action re-checks ownership (booking.touristId === session.user.id) to prevent IDOR. Admin actions write to `AdminAction` audit log.

## 5. Provider Abstractions
```ts
// services/payments/types.ts
interface PaymentProvider {
  createOrder(amount: number, currency: 'INR', reference: string): Promise<OrderResult>;
  verifyWebhookSignature(rawBody: string, signature: string): boolean;
  refund(paymentProviderId: string, amount?: number): Promise<RefundResult>;
}
// services/notifications/types.ts
interface NotificationProvider {
  send(to: string, template: string, vars: Record<string, string>): Promise<void>;
}
```
Swap Razorpay → another gateway by implementing the interface; no call sites change.

## 6. Security Checklist
- [ ] RBAC server-side on every action; ownership checks on all ID lookups
- [ ] Zod validate all inputs; Prisma parameterized queries
- [ ] Rate limit auth + booking + messaging endpoints (Upstash Ratelimit)
- [ ] Razorpay webhook signature verification (raw body, before parsing)
- [ ] KYC bucket private; access only via signed URLs issued after role check
- [ ] Audit log for: KYC decisions, guide status changes, refunds, disputes, payouts, user suspensions
- [ ] Secure headers (via next.config / middleware), CSRF via Server Actions origin checks
- [ ] .env for all secrets; committed `.env.example` only
- [ ] Soft delete on users/guides; no hard deletes of financial records

## 7. Implementation Roadmap
- **Phase 1 — Foundation (w1):** repo, Tailwind+shadcn, Prisma schema+migrate+seed, Auth.js (email+Google), RBAC, landing page with hero search.
- **Phase 2 — Guide system (w2):** application form + KYC upload (private R2), admin review queue, guide profile CRUD, availability & pricing, tour types.
- **Phase 3 — Tourist system (w3):** destination search + guide listing + filters, guide profile page, booking request flow with availability/double-booking guard.
- **Phase 4 — Payments (w4):** Razorpay order creation, checkout, webhook → confirm booking, commission split records, refunds (admin), test mode.
- **Phase 5 — Communication (w5):** per-booking chat (polling → WebSocket if time allows), email notifications via event hooks.
- **Phase 6 — Reviews & support (w6):** post-completion review, report/block, dispute workflow with admin resolution.
- **Phase 7 — Admin & analytics (w7):** full dashboard — revenue, bookings, top guides/destinations, payout processing.
- **Phase 8 — Hardening & deploy (w8):** unit/integration/e2e tests (booking flow, webhook, authz), security pass, Vercel + managed PG + R2 deploy, README.

**Exit criteria per phase:** tests pass, no regressions, demo-able increment.

## 8. Env Vars (.env.example)
DATABASE_URL, AUTH_SECRET, AUTH_GOOGLE_ID/SECRET, RAZORPAY_KEY_ID/SECRET/WEBHOOK_SECRET, R2_ACCOUNT_ID/ACCESS_KEY/SECRET/BUCKET_PRIVATE/BUCKET_PUBLIC, RESEND_API_KEY, NEXT_PUBLIC_APP_URL, COMMISSION_PERCENT (fallback default).
