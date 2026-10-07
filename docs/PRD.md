# Surfer Test — Product Requirements Document (PRD)

**Working title:** Surfer Test (renameable) · **v0.1 — MVP** · Last updated: 2026-10-06

## 1. Summary
A location-based marketplace connecting tourists visiting India with verified local student/young-adult guides. The platform facilitates discovery, booking, payment, messaging, and reviews, and takes a commission on each completed booking.

## 2. Goals (MVP)
- Tourist can search any Indian destination and discover, book, pay, message, and review a verified local guide.
- Student guide can apply, pass KYC, manage profile/availability/pricing, accept bookings, track earnings, and receive payouts.
- Admin can verify guides, manage users/locations/bookings/payments/reviews/disputes, and view revenue analytics.

## 3. Non-Goals (MVP)
Native apps, AI itinerary planner, GPS tracking, video calls, wallets, subscriptions, microservices, loyalty program.

## 4. Roles
| Role | Description |
|---|---|
| TOURIST | End user booking guides |
| GUIDE | Verified local guide (must pass KYC; may be student-verified) |
| ADMIN | Platform operator with audit-logged actions |

## 5. Key Flows

### 5.1 Tourist booking flow
Search destination → results (guide cards) → guide profile → pick date/time/duration/party size/meeting point/tour type → request booking → pay via Razorpay → guide accepts → tour happens → mark completed → review & rating → guide payout (admin-triggered).

### 5.2 Guide onboarding flow
Apply (profile + KYC + agreements) → status PENDING_VERIFICATION → KYC under review → APPROVED or REJECTED (with reason, re-verification possible) → build profile → set availability/pricing → go live.

### 5.3 Dispute flow
Either party or admin flags booking → status DISPUTED → admin reviews → resolve (complete / refund full / partial refund / cancel) → all actions audit-logged.

## 6. Functional Requirements (condensed)
- **Auth:** email/password + Google OAuth (phone OTP later). Auth.js.
- **Search:** DB-driven search over Destination/Attraction/City/State; guides matched via GuideLocation coverage.
- **Guides:** filter by price, rating, language, availability, tour type, experience.
- **Availability:** days, time slots, blocked dates, max bookings/day; system blocks double-booking (unique constraint on guide+date+time window + transactional check).
- **Booking statuses:** REQUESTED → PENDING_PAYMENT → CONFIRMED → GUIDE_ACCEPTED → IN_PROGRESS → COMPLETED | CANCELLED | DISPUTED | REFUNDED.
- **Payments:** Razorpay orders, webhook signature verification, commission split (configurable %), refund support, manual admin payouts.
- **Messaging:** per-booking conversation, text only, simple polling or lightweight WebSocket.
- **Notifications:** email first (Resend), event-driven, provider-agnostic interface for SMS/WhatsApp later.
- **Reviews:** 1–5 stars + text; only for COMPLETED bookings; one review per booking per tourist; admin moderation.
- **Safety:** KYC verification, emergency contacts, report/block, safety guidelines, admin support, no continuous GPS.

## 7. Non-Functional
- Security: RBAC enforced server-side, Zod validation, rate limiting, secure headers, private KYC storage with signed URLs, webhook verification, audit logs.
- Performance: mobile-first responsive PWA-ready UI; indexed DB queries for search.
- Scalability: modular monolith; providers (payment, storage, email, notifications) behind interfaces so they can be swapped.
- Compliance: minimum-necessary KYC data; KYC docs never publicly accessible; soft deletion; audit trail.

## 8. Success Metrics (MVP)
Verified-guide approval rate, bookings/week, completion rate, GMV, take rate, average rating, dispute rate <2%.

## 9. Monetization
Commission % per completed booking (PlatformSettings.commissionPercent), configurable by admin.
