# Resqly doctor consultation workflow and Agora integration gate

## Current implementation audit

- The consumer app routes `/consumer/service/:serviceKey` to `ConsumerServiceDetail`.
- `doctor` currently uses the generic waitlist form. It does not create an appointment, process a doctor-consultation payment, issue a call invitation, or join an RTC room.
- The current FastAPI backend has provider categories and KYC metadata for doctors, but no doctor appointment/call-token endpoints were found in `backend/server.py`.
- The Android shell is a Capacitor app. Native Kotlin RTC should be exposed to the existing React app through a Capacitor plugin; a standalone Activity that is not reachable from the app would not complete the customer journey.

## Proposed customer workflow

1. Sign in to Resqly and finish the consumer profile.
2. Open **Doctor** from the service grid.
3. Choose consultation mode (video or voice), specialty, and an available verified doctor.
4. Review the doctor's credentials, fee, and available time; choose instant or scheduled consultation.
5. Confirm patient details and optional reason/symptoms. Show a privacy notice and state that this is not an emergency service.
6. Confirm booking and payment. The backend must atomically reserve the slot and record payment state before marking the appointment confirmed.
7. Show the appointment card under Bookings, with appointment time, doctor, payment state, cancel/reschedule rules, and a reminder.
8. For scheduled appointments, allow the doctor to mark ready; enable **Join consultation** only for the booked patient and assigned doctor in the permitted time window.
9. Backend authorizes the appointment participant and returns a short-lived Agora RTC token for a server-selected channel and UID. The App Certificate must remain server-side; never ship it in the app or frontend.
10. Join the call. Show local preview, remote participant, connection state, mic/camera toggles, camera switch, and leave action. Handle permission denial, reconnecting, remote user departure, and token expiry.
11. On leave, record start/end time and status server-side. Show consultation completed and next steps; preserve medical records only through explicit, access-controlled workflows.

## Agora implementation plan

Target: native Android Kotlin RTC SDK using the Communication profile, integrated into the current Capacitor app through a native Capacitor plugin. Both participants publish and subscribe to audio/video in the same channel.

- Follow the official Agora Android Quickstart and API-Examples Android project.
- Use the Agora Skills repository as implementation guidance.
- First smoke test: two participants, distinct UIDs, same channel, valid temporary token per UID. Generate tokens in Agora Console (Manage credentials → Generate Temp Token); use the exact same channel string and UID when generating and joining.
- The Agora CLI readiness gate must be run in a local authenticated environment: `agora project env --json`, then `agora project doctor --feature rtc --json`. Select the intended Agora project and do not paste secrets into chat or commit them.
- Production: implement an authenticated backend token endpoint that checks the current user's role, appointment ownership/assignment, appointment state and allowed join window before issuing a short-lived RTC token. Store App ID and App Certificate in server-side secrets. Never accept arbitrary channel/UID/token requests from untrusted clients.
- Add call metadata endpoints and idempotent lifecycle updates only after the current booking/payment model is defined.

## Verification checklist

- [ ] Frontend production build passes.
- [ ] Android Gradle debug build passes.
- [ ] Test edge-to-edge on Android 13 and Android 15+; confirm status/navigation contrast, touch targets and keyboard/insets.
- [ ] Agora CLI project doctor passes for RTC.
- [ ] Two participants join with distinct UIDs and matching per-UID temporary tokens.
- [ ] Verify audio both directions, video both directions, mic mute/unmute, camera on/off, leave/rejoin, permissions denied, and token expiry.
- [ ] Backend authorization tests prove that an unrelated consumer cannot mint a token or join another patient's channel.

## Current limitations

This document is an audit and implementation gate, not a claim that RTC calling is already operational. The current execution environment could not clone GitHub to run Gradle/frontend builds, and no authenticated Agora CLI session/project credentials or Android devices are available here. The doctor booking backend and Agora call bridge must be implemented and tested before the service is described as production-ready.
