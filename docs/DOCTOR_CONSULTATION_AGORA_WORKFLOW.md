# Resqly doctor consultation workflow and launch gates

## Implemented in this branch

- Replaced the doctor waitlist entry with a two-mode consultation flow: **Online consultation** and **Doctor home visit**.
- Patients describe the concern and select one or more languages. Online requests are matched globally by language; home visits additionally require patient location and a 25 km radius.
- Doctor KYC collects languages; the backend rejects doctor KYC submission without at least one language.
- Home-visit checkout is server-created with Razorpay. A request is not broadcast until the payment signature, order ID, captured state and amount are verified server-side.
- Online video checkout is intentionally disabled until the native Agora bridge and secure RTC token service are connected and tested; the backend rejects direct API attempts too.
- Eligible doctors must be approved, online/available, and language-matched. A home visit also requires a recent location and distance within 25 km.
- Acceptance reserves the doctor as busy before assigning the request, preventing the same doctor from accepting two simultaneous requests. An active consultation prevents the doctor switching back to Available.
- Accepted requests get a five-minute join deadline in the record and patient UI. Prescriptions can be written by the assigned verified doctor and are stored in the existing consumer prescriptions collection; medicine and follow-up details render in the RX screen.
- Fixed malformed safe-area CSS and moved native edge-to-edge window configuration to after Activity creation.

## Required server configuration

For home-visit checkout, set these secrets/configuration values in the backend hosting environment, not in frontend code or Git:

- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `DOCTOR_ONLINE_PRICE_INR` (positive integer, INR; configured for future use, but online checkout remains disabled until Agora RTC is ready)
- `DOCTOR_HOME_VISIT_PRICE_INR` (positive integer, INR)

If payment credentials or the home-visit price are missing, home-visit checkout fails closed. Online checkout stays disabled even if its price is set, until Agora is integrated. This prevents charging patients for a call that cannot actually connect. Do not use production payment credentials for local testing.

## Current customer/provider workflow

1. Patient opens Doctors and chooses online video consultation or a home visit.
2. Patient describes the issue and chooses comfortable languages. Home visits capture GPS location.
3. Backend creates a Razorpay order. Checkout closes or fails → no broadcast. Verified captured payment → request broadcast.
4. Available, approved doctors with matching languages see requests. Online requests can match globally; home visits are limited to 25 km.
5. First eligible doctor to accept is assigned; the backend atomically marks that doctor busy. The patient sees a five-minute join countdown.
6. The assigned doctor can write a prescription. It is saved to the patient's existing Prescriptions/RX tab.
7. Completing the consultation releases the assigned doctor back to Available.

## Critical launch blocker: RTC video is not yet operational

The consultation room deliberately shows a safety gate rather than pretending a call is connected. The five-minute deadline is recorded and displayed, but native Agora media, join-token service, join acknowledgements, deadline-expiry cleanup/refund policy, and two-device testing are **not complete**. Do not use this build for live patient care until those items are completed and verified.

### Agora implementation gate

Target: native Android Kotlin RTC SDK integrated into the existing Capacitor app via a native Capacitor plugin. Both participants must publish and subscribe to audio/video in the same server-selected channel.

- Follow the official Agora Android Quickstart: https://docs.agora.io/en/realtime-media/rtc/get-started-sdk/android.md
- Example: https://github.com/AgoraIO/API-Examples/tree/master/Android/APIExample
- Token-server guide: https://docs.agora.io/en/realtime-media/rtc/build/authenticate-users/deploy-token-server
- Agora Skills: https://github.com/AgoraIO/skills
- In an authenticated local environment, select the correct Agora project and run `agora project env --json`, then `agora project doctor --feature rtc --json`.
- Smoke-test two participants with distinct UIDs and temporary tokens for the same channel. Never commit the App Certificate or issue tokens from the frontend.
- Production token endpoint must authorize the assigned patient/doctor, booking state and join window, and issue short-lived tokens server-side.

## Verification still required

- [ ] Frontend production build passes.
- [ ] Android Gradle debug build passes.
- [ ] Test edge-to-edge on Android 13 and Android 15+.
- [ ] Razorpay test payment: failed, dismissed, captured, replayed signature, mismatched amount and duplicate verification.
- [ ] Concurrent doctor acceptance test; busy/offline doctors receive no new requests.
- [ ] Agora CLI RTC doctor passes.
- [ ] Two-device audio/video, mic/camera controls, leave/rejoin, permissions denied, network interruption and token expiry.
- [ ] Prescription access-control test and patient RX display test.
- [ ] Decide and implement refund/no-show policy before the five-minute join deadline is enforced in production.

This document records the actual branch state, including what is still blocked. No build or device test is claimed unless a CI run confirms it.
