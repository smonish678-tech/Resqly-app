# Resqly Android — Capacitor Build Guide

## Overview

The Android app wraps the React frontend in Capacitor. Build configuration and signing
material must be kept outside Git. The repository must never be the source of a keystore,
keystore password, admin password, or production environment file.

Application identity:
- **applicationId** `com.resqly.app`
- **Current version code**: check `frontend/android/app/build.gradle` before release; always increment for a Play Store update.
- **Backend URL**: configure the GitHub Actions repository variable `REACT_APP_BACKEND_URL`. The workflow fallback is for build/test purposes only; verify the target before a release build.

## Configure the backend URL

In GitHub, open **Settings → Secrets and variables → Actions → Variables** and set
`REACT_APP_BACKEND_URL` to the deployed HTTPS API origin (without the trailing `/api`).
The Android workflow injects this at build time. Do not commit a local `.env`.
For local development, create an ignored `frontend/.env` with your development URL.

If the backend URL is missing, the frontend displays a useful configuration error on API calls
instead of silently selecting an Emergent preview URL.

## Configure a signed Android release

1. **Do not retrieve a keystore from Git.** The prior repository version contained signing material and an admin credential; treat those as exposed.
2. First determine whether this application is enrolled in **Google Play App Signing** and whether a key rotation is required or available. Preserve an offline backup of any valid production signing key until the Play Console migration path has been confirmed. Do not casually replace the upload/app-signing key for a published app.
3. In GitHub, open **Settings → Secrets and variables → Actions → Secrets** and set the following secrets from a secure password-manager/offline source:
   - `RESQLY_KEYSTORE_BASE64`
   - `RESQLY_KEYSTORE_PASSWORD`
   - `RESQLY_KEY_ALIAS`
   - `RESQLY_KEY_PASSWORD`
4. Remove any old tracked keystore/password files from your local clones, and rotate the exposed admin credential and JWT secret in the hosting environment. Changing the JWT secret invalidates current sessions.
5. After security review, run the **Android Build (APK + AAB)** workflow and verify the AAB in Google Play Console.

If no trustworthy backup of the former key exists, stop before attempting a production upload. Confirm the Play App Signing state and the official key reset/upgrade path first.

## Build and test

- A successful React web bundle does not prove the APK builds.
- Run the Android build workflow and check that both the web bundle and `assembleDebug` succeed.
- Install the debug APK on a physical device and verify location permission, file upload, back navigation, safe areas, font scaling, and all critical service flows.
- Keep online doctor checkout disabled unless real two-device Agora calls, participant join tracking, payment verification, and refund tests pass.

## Backend launch requirements

The API now requires a strong `JWT_SECRET` and a private non-default `ADMIN_PASSWORD`. Set both in the hosting provider's environment/secrets panel. Configure `APP_ENV=production` and set an explicit comma-separated `CORS_ORIGINS` allowlist for approved web origins. Wildcard CORS is rejected.

This repository currently does not include an SMS or email delivery provider. Production OTP and provider password-reset routes intentionally fail closed until a real delivery service is configured. Use `APP_ENV=development` only on an isolated local dev environment with private local secrets; demo codes/tokens must never be exposed on production.

## Important secret-rotation note

Removing a secret from the current tree does not erase past Git objects, forks, caches, or clones. Rotate the exposed admin password and JWT secret, check GitHub Actions/hosting logs, and perform a coordinated Git-history cleanup only after preserving needed non-secret work. Do not print credentials in issues, PR descriptions, or chat.
