# Resqly V1 Plan (Provider Acquisition + Consumer Pre-Launch)

## 1) Objectives
- Ship a **single mobile-first web app** with role-based routing: **/consumer/** and **/provider/**.
- Enable **consumer pre-launch**: mock OTP login, emergency profile, service interest → **waitlist capture**.
- Enable **provider acquisition**: OTP/email auth, category-based KYC uploads (base64), approval status gating, provider dashboard.
- Add **hidden admin** flow to manually approve/reject providers (no admin dashboard in V1).
- Include required **compliance pages** + delete-account/data deletion request flow.

## 2) Implementation Steps

### Phase 1: Core POC (skip)
- Not needed (CRUD + simple auth + file uploads with mock OTP; no 3rd-party integrations).

### Phase 2: V1 App Development (end-to-end)
**Backend (FastAPI + MongoDB)**
1. Project setup: FastAPI app, config, Mongo client, CORS, pydantic models, indexes.
2. Auth:
   - Mock OTP endpoints: request OTP (returns `123456`), verify OTP → JWT.
   - Email/password endpoints for providers (register/login/forgot-password reset token).
   - JWT middleware + role-based guards (`consumer`, `provider`, `admin`).
3. Core APIs (CRUD + state):
   - Users: get/update profile, emergency profile fields.
   - Waitlist: create entry; prevent duplicates by phone.
   - Providers: create/update, set category, service area, languages, specializations, bank details.
   - Provider documents: upload/list/update verification_status (store base64 + metadata).
   - Provider approval: status machine (Pending/Approved/Rejected/Resubmit).
   - Orders/reviews/notifications: list endpoints + seed/empty-state support.
4. Hidden admin:
   - `/admin/login` with env password → admin JWT.
   - `/admin/providers?status=pending` list + `/admin/providers/{id}/decision` approve/reject with reason.

**Frontend (React + Router + shadcn/ui, lucide-react)**
5. Design system (shared): tokens (colors), Button/Card/FormField, mobile container (max 480px), bottom nav.
6. App shell + routing:
   - Landing `/` → choose role: **Continue as Consumer** or **Join as Resqly Ranger**.
   - Route groups with guards: `/consumer/*`, `/provider/*`, `/admin/*`.
7. Consumer flow:
   - OTP login (phone → OTP screen; accept `123456`; optionally show OTP inline).
   - Profile + Emergency Profile forms (editable anytime).
   - Home: location header, notifications icon, hero CTA, services grid, Ranger CTA.
   - Service card details: “We are onboarding…” + Join Waitlist.
   - Waitlist form (name/phone/city/location) + success state.
8. Provider flow:
   - Login: OTP or email/password + forgot password.
   - Onboarding: category select → KYC checklist (dynamic by category) → submit.
   - Approval status screen: Pending/Approved/Rejected/Resubmit with guidance.
   - Approved dashboard: availability toggle (Available/Busy/Offline), KPI cards, quick actions.
   - Tabs/screens: Orders, Earnings, Reviews, Documents, Profile (with language + specialization multiselect).
9. Compliance + support:
   - Privacy, Terms, Support, Contact Us.
   - Delete Account + Data Deletion Request flow + permission explanation screens.
10. Data seeding + empty states:
   - Provide clear empty states for orders/reviews/notifications.

**Phase 2 user stories (at least 5)**
1. As a new user, I can pick **Consumer** or **Resqly Ranger** from the landing page.
2. As a consumer, I can login with my phone using **mock OTP** and reach my home screen.
3. As a consumer, I can complete and edit my **Emergency Profile** anytime.
4. As a consumer, I can tap any service and **join the waitlist** for my city.
5. As a provider, I can select my category and upload **all required KYC documents**.
6. As a provider, I can see my **approval status** and what to do next.
7. As an approved provider, I can view my dashboard and change **availability status**.

**Conclude Phase 2**
- Run **testing_agent_v3** for end-to-end flows (consumer login → waitlist; provider onboarding → pending; admin approve → provider dashboard).

### Phase 3: Hardening + UX polish + testing
1. Validation + error handling: strong API validations, duplicate prevention, clearer toasts.
2. Provider profile completion % calculation + display consistency.
3. Improve documents UX: per-doc status badges, resubmission flow, upload size limits.
4. Notifications: basic list + mark-as-read.
5. Accessibility + performance: form focus states, skeleton loaders.

**Phase 3 user stories (at least 5)**
1. As a provider, I can see which exact document is rejected and re-upload only that document.
2. As a provider, I can view profile completion % and understand missing fields.
3. As a consumer, I can see clear success/error feedback for waitlist submission.
4. As an admin, I can reject a provider with a reason that the provider can read.
5. As a user, I can request account/data deletion and receive a confirmation.

**Conclude Phase 3**
- Run **testing_agent_v3** again and fix regressions.

### Phase 4: Optional next features (post-V1)
- Lightweight admin dashboard UI (still hidden) + provider analytics.
- Export providers/waitlist CSV.
- Real OTP provider (Twilio/MSG91) when credentials available.

## 3) Next Actions
1. Scaffold repo: `backend/` FastAPI + `frontend/` React + shared env samples.
2. Implement backend auth (mock OTP + JWT) and core collections/models.
3. Implement landing + consumer OTP flow + waitlist (first end-to-end vertical slice).
4. Implement provider onboarding + KYC uploads + approval gating.
5. Implement hidden admin approve/reject endpoints + minimal admin UI.
6. Run testing_agent_v3; iterate until green.

## 4) Success Criteria
- Consumer can: login (mock OTP) → complete emergency profile → join waitlist from service card.
- Provider can: signup/login → select category → upload all required docs → see pending → after admin approval access dashboard.
- Admin can: login (hidden) → list pending providers → approve/reject with reason.
- All pages render mobile-first with shared design system and no broken routes.
- Testing_agent_v3 completes at least one full consumer and provider journey without failures.
