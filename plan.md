# Resqly V1 Plan (Provider Acquisition + Consumer Pre-Launch)

## 1) Objectives
- Ship a **single mobile-first web app** with role-based routing: **/consumer/** and **/provider/**.
- Enable **consumer pre-launch**: mock OTP login, emergency profile, service interest → **waitlist capture**.
- Enable **provider acquisition**: OTP/email auth, category-based KYC uploads (base64), approval status gating, provider dashboard.
- Add **hidden admin** flow to manually approve/reject providers (admin UI kept minimal/hidden).
- Include required **compliance pages** + delete-account/data deletion request flow.
- Ensure **end-to-end correctness** via automated testing of key journeys (consumer + provider + admin).

**Current status:** All Phase 2 V1 development is **completed** (backend + frontend + hidden admin + compliance pages) and **tested green**.

## 2) Implementation Steps

### Phase 1: Core POC (skip)
- Not needed (CRUD + simple auth + file uploads with mock OTP; no 3rd-party integrations).

### Phase 2: V1 App Development (end-to-end) — **COMPLETED**

**Backend (FastAPI + MongoDB) — COMPLETED**
1. Project setup: FastAPI app, config, Mongo client, CORS, pydantic models, indexes. ✅
2. Auth: ✅
   - Mock OTP endpoints: request OTP (returns `123456`), verify OTP → JWT.
   - Email/password endpoints for providers (register/login/forgot-password reset token).
   - JWT auth + role-based guards (`consumer`, `provider`, `admin`).
3. Core APIs (CRUD + state): ✅
   - Users: get/update profile, emergency profile fields.
   - Waitlist: create entry; prevent duplicates by phone + service_interest.
   - Providers: create/update, set category, service area, languages, specializations, bank details.
   - Provider documents: upload/list/delete; store base64 + metadata + verification status.
   - Provider approval: status machine (`incomplete`, `pending`, `approved`, `rejected`, `resubmit`) + rejection reason.
   - Orders/reviews/notifications: list endpoints + empty-state support.
   - Delete-account/data deletion request endpoint.
4. Hidden admin: ✅
   - `/api/admin/login` with env password → admin JWT.
   - `/api/admin/providers` list (filter by status) + `/api/admin/providers/{id}/decision` approve/reject/resubmit with reason.
   - `/api/admin/stats` for dashboard metrics.

**Frontend (React + Router + shadcn/ui, lucide-react) — COMPLETED**
5. Design system (shared): tokens (colors), Card/Button/Form patterns, mobile container (max ~480px), bottom nav. ✅
   - **Inline SVG Resqly logo** added to avoid external asset permission issues. ✅
6. App shell + routing: ✅
   - Landing `/` → choose role: **Continue as Consumer** or **Join as Resqly Ranger**.
   - Route groups with guards: `/consumer/*`, `/provider/*`, `/admin/*`.
7. Consumer flow: ✅
   - OTP login (phone → OTP screen; accept `123456`; OTP displayed for demo).
   - Onboarding (name/city/blood group/hospital) + profile edit.
   - Home: location header, notifications icon, hero CTA, services grid, Ranger CTA.
   - Service detail: “We are onboarding…” + Join Waitlist form.
   - Waitlist (priority access) + success state.
   - Emergency profile + multiple emergency contacts + persistence.
8. Provider flow: ✅
   - Login: OTP or email/password + forgot password + reset token flow.
   - Onboarding: category select → KYC checklist (dynamic by category) → upload docs → submit.
   - Approval status screen: Pending/Approved/Rejected/Resubmit with guidance.
   - Approved dashboard: availability toggle (Available/Busy/Offline), KPI cards, quick actions.
   - Screens: Orders, Earnings, Reviews, Documents, Profile (photo + languages + specialization multiselect + bank details), Support.
9. Admin UI (hidden): ✅
   - Admin login → dashboard stats + filters → provider detail review → approve/reject/resubmit.
10. Compliance + support: ✅
   - Privacy, Terms, Support, Contact Us, Delete Account/Data Deletion, Permissions explanation.

**Phase 2 user stories — COMPLETED**
1. As a new user, I can pick **Consumer** or **Resqly Ranger** from the landing page. ✅
2. As a consumer, I can login with my phone using **mock OTP** and reach my home screen. ✅
3. As a consumer, I can complete and edit my **Emergency Profile** anytime. ✅
4. As a consumer, I can tap any service and **join the waitlist** for my city. ✅
5. As a provider, I can select my category and upload **all required KYC documents**. ✅
6. As a provider, I can see my **approval status** and what to do next. ✅
7. As an approved provider, I can view my dashboard and change **availability status**. ✅

**Conclude Phase 2 — COMPLETED**
- Ran **testing_agent_v3** for end-to-end flows (consumer login → onboarding → home → waitlist; provider onboarding → KYC → pending; admin approve → provider dashboard). ✅
- Test results: **30 backend API tests + 19 user-story E2E tests; 100% passing**. ✅

### Phase 3: Hardening + UX polish + testing (post-V1) — **NEXT (optional)**
1. Validation + error handling: stronger client/server validations, clearer toasts, stricter formats. 
2. Provider profile completion %: refine weighting, show “missing items” checklist.
3. Documents UX: per-doc rejection reason, partial resubmission, client-side previews, size/type guidance.
4. Notifications: mark-as-read + notification settings.
5. Accessibility + performance: focus states, skeleton loaders, pagination for admin lists.
6. Security hardening: rate limiting OTP endpoints, remove OTP exposure in response for production, audit logging for admin decisions.

**Phase 3 user stories (at least 5)**
1. As a provider, I can see which exact document is rejected and re-upload only that document.
2. As a provider, I can view profile completion % and understand missing fields.
3. As a consumer, I can see clear success/error feedback for waitlist submission.
4. As an admin, I can reject a provider with a reason that the provider can read.
5. As a user, I can request account/data deletion and receive a confirmation.

**Conclude Phase 3**
- Run **testing_agent_v3** again and fix regressions.

### Phase 4: Optional next features (post-V1)
- Lightweight admin dashboard improvements (still hidden) + exports (CSV).
- Provider/consumer analytics dashboards.
- Real OTP provider (Twilio/MSG91) when credentials available.
- File storage migration (S3/Supabase Storage/GCS) instead of base64 in Mongo.

## 3) Next Actions
1. **Demo readiness**: Share preview URL, confirm primary flows, capture product screenshots.
2. **Production readiness checklist (when needed)**:
   - Replace mock OTP with SMS provider; remove OTP from response.
   - Replace base64 doc storage with object storage.
   - Add rate-limits + audit logs for admin actions.
   - Configure stricter CORS, secrets management, and monitoring.
3. **Scale onboarding**: build CSV export, provider outreach pipeline, and city/category targeting.

## 4) Success Criteria
- Consumer can: login (mock OTP) → complete onboarding/emergency profile → join waitlist from service card/priority access.
- Provider can: signup/login → select category → upload required docs → submit → see pending → after admin approval access dashboard and set availability.
- Admin can: login (hidden) → list/filter providers → approve/reject/resubmit with reason.
- All pages render mobile-first with shared design system and no broken routes.
- Testing_agent_v3 completes at least one full consumer and provider journey without failures. **(Achieved: 100% pass.)**
