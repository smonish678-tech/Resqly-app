# Resqly doctor consultation workflow and launch gates

## Implemented in this branch

- Replaced the doctor waitlist entry with a two-mode consultation flow: **Online consultation** and **Doctor home visit**.
- Patients describe the concern and select one or more languages. Online requests are matched globally by language; home visits additionally require patient location and a 25 km radius.
- Doctor KYC collects languages; the backend rejects doctor KYC submission without at least one language.
- Home-visit checkout is server-created with Razorpay. A request is not broadcast until the payment signature, order ID, captured state and amount are verified server-side.
- The native Android Agora room, server-issued short-lived RTC token endpoint, participant join/leave tracking, and five-minute join window are implemented in this branch. Online checkout still fails closed unless the backend has Agora App ID + App Certificate, Razorpay credentials, and a positive price configured.
- Eligible doctors must be approved, online/available, and language-matched. A home visit also requires a recent location and distance within 25 km.
- Acceptance reserves the doctor as busy before assigning the request, preventing the same doctor from accepting two simultaneous requests. An active consultation prevents the doctor switching back to Available.
- Online requests record and display a five-minute join deadline; home visits do not use a video timer. The assigned doctor starts a home visit before writing its prescription. Online prescriptions remain gated until a real RTC call is marked active. Prescriptions are stored in the existing consumer collection; medicine and follow-up details render in RX.
- Fixed malformed safe-area CSS and moved native edge-to-edge window configuration to after Activity creation.

## Required server configuration

For home-visit checkout, set these secrets/configuration values in the backend hosting environment, not in frontend code or Git:

- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `DOCTOR_ONLINE_PRICE_INR` (positive integer, INR)
- `DOCTOR_HOME_VISIT_PRICE_INR` (positive integer, INR)
- `AGORA_APP_ID`
- `AGORA_APP_CERTIFICATE` (backend secret only; never expose it to the app)

If payment credentials/prices are missing, checkout fails closed. Online checkout also requires both Agora server credentials. The app never contains the App Certificate; Android obtains only a short-lived token for the assigned patient/doctor. Do not use production payment credentials for local testing.

## Current customer/provider workflow

1. Patient opens Doctors and chooses online video consultation or a home visit.
2. Patient describes the issue and chooses comfortable languages. Home visits capture GPS location.
3. Backend creates a Razorpay order. Checkout closes or fails → no broadcast. Verified captured payment → request broadcast.
4. Available, approved doctors with matching languages see requests. Online requests can match globally; home visits are limited to 25 km.
5. First eligible doctor to accept is assigned; the backend atomically marks that doctor busy. Online requests have a five-minute join countdown; home visits proceed without a video timer.
6. For home visits, the doctor starts the visit, writes the prescription and marks the visit complete. Online prescriptions are blocked until RTC is genuinely active.
7. Completing the visit releases the assigned doctor back to Available. If a paid request expires or an online join window expires, the backend attempts a refund and notifies the patient; failed refunds are marked for support follow-up.

## Verification still required before live patient care

The native Agora Android room and server token endpoint are implemented, and a CI debug APK build is being verified. Actual calls still need to be tested on two Android devices with a real Agora project and server secrets; RTC credentials, camera/mic permission handling, network recovery, token refresh and both-side leave/rejoin must be verified before charging patients for online care. Five-minute/no-acceptance refund cleanup exists in code but still needs Razorpay sandbox and concurrency/race-condition testing. Do not use this build for live patient care until those items are completed and verified.

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

- [x] Frontend production build passes in GitHub Actions.
- [ ] Android Gradle debug build passes in GitHub Actions.
- [ ] Test edge-to-edge on Android 13 and Android 15+.
- [ ] Razorpay test payment: failed, dismissed, captured, replayed signature, mismatched amount and duplicate verification.
- [ ] Concurrent doctor acceptance test; busy/offline doctors receive no new requests.
- [ ] In an authenticated Agora CLI environment, run `agora project env --json` and `agora project doctor --feature rtc --json` for the selected project.
- [ ] Two-device audio/video, mic/camera controls, leave/rejoin, permissions denied, network interruption and token expiry.
- [ ] Prescription access-control test and patient RX display test.
- [ ] Verify the implemented refund/no-show behavior in Razorpay sandbox, including concurrent expiry/refund attempts.

This document records the actual branch state, including what is still blocked. No build or device test is claimed unless a CI run confirms it.
