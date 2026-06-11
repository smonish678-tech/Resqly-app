# Resqly Android — Capacitor Build Guide

## Overview
This repo includes a fully configured **Capacitor** Android wrapper around the existing
React frontend. **No code from the web app has been rewritten** — Capacitor loads the
exact same `frontend/build/` output inside a native Android WebView.

| Component | Status |
|---|---|
| Capacitor config (`frontend/capacitor.config.ts`) | ✅ committed |
| Android native project (`frontend/android/`) | ✅ committed |
| App icon (Resqly logo) + splash (123 assets) | ✅ generated |
| Permissions in `AndroidManifest.xml` | ✅ INTERNET, LOCATION, CAMERA, READ_MEDIA_IMAGES, DIAL |
| Build pipeline (`.github/workflows/android-build.yml`) | ✅ committed |
| Release signing config (`frontend/android/app/build.gradle`) | ✅ env-driven |
| One-time release keystore | ✅ generated (see "Secrets to add" below) |

App identity:
- **applicationId** `com.resqly.app`
- **App name** `Resqly`
- **Version** `1.0.0` (versionCode 1)
- **Bundled backend URL** `https://resqly-launch.emergent.host` (overridable per build)

---

## Step-by-step: From this repo to a working APK

### 1. Push the code to GitHub
From your local clone (or directly from Emergent's "Push to GitHub"):
```bash
git add .
git commit -m "Add Capacitor Android wrapper"
git push origin main
```
The workflow file lives at `.github/workflows/android-build.yml` and will trigger
automatically on push to `main`/`master`.

### 2. (Optional but recommended) Add GitHub Actions secrets for signed Play Store builds
Go to **Settings → Secrets and variables → Actions → New repository secret** and add **all four**:

| Secret name | Value |
|---|---|
| `RESQLY_KEYSTORE_BASE64` | _(see `frontend/.release-keystore.b64.txt` — copy the full base64 string)_ |
| `RESQLY_KEYSTORE_PASSWORD` | _(see "Keystore credentials" section below)_ |
| `RESQLY_KEY_ALIAS` | `resqly-release` |
| `RESQLY_KEY_PASSWORD` | _(same as keystore password — see below)_ |

If any of these are missing, the workflow still builds a **Debug APK** but skips the
signed release build.

### 3. Trigger the build
Either:
- **Push any change to `frontend/**`** → workflow runs automatically, OR
- Go to **Actions tab → "Android Build (APK + AAB)" → Run workflow**.

### 4. Download artifacts
After the workflow finishes (~8 min), open the run and scroll to **Artifacts**:

| Artifact | What it is | Use for |
|---|---|---|
| `resqly-debug-apk` | `app-debug.apk` | Sideload on test phones |
| `resqly-release-apk` | `app-release.apk` | Sideload to test exactly what the Play Store will distribute |
| `resqly-release-aab` | `app-release.aab` | **Upload to Google Play Console** |

To install the debug APK on an Android phone:
1. Enable **Developer Options → USB Debugging** _or_ allow installs from unknown sources.
2. Transfer the APK to the phone (USB / Drive / Email).
3. Tap it and confirm install.

---

## Local build (alternative to GitHub Actions)
If you have **Android Studio** + **JDK 17** installed locally:

```bash
cd frontend
yarn install
yarn android:assets          # regenerate icons (one-time, when logo changes)
yarn android:build:debug     # → android/app/build/outputs/apk/debug/app-debug.apk
yarn android:build:release   # → android/app/build/outputs/bundle/release/app-release.aab
```

For signed release builds locally, set these env vars before running:
```bash
export RESQLY_KEYSTORE_PATH=$(pwd)/release-signing.jks
export RESQLY_KEYSTORE_PASSWORD='<paste>'
export RESQLY_KEY_ALIAS='resqly-release'
export RESQLY_KEY_PASSWORD='<paste>'
yarn android:build:release
```

---

## How the backend URL gets baked into the APK
- The build reads `REACT_APP_BACKEND_URL` from `frontend/.env.production` at compile time.
- In GitHub Actions, the workflow's `env:` block overrides this with the value of the
  `REACT_APP_BACKEND_URL` repository **variable** (Settings → Variables → Actions), falling
  back to `https://resqly-launch.emergent.host`.
- To point a new build at staging/production: just change the variable; no code edits.

---

## Updating the app (post-launch flow)

1. Make your React changes as usual; deploy the web version to Emergent.
2. Bump version in `frontend/android/app/build.gradle`:
   ```gradle
   versionCode 2          // monotonic integer, never reuse
   versionName "1.0.1"    // semver shown to users
   ```
3. Push to `main` → GitHub Actions builds a fresh signed AAB.
4. Upload the AAB to Google Play Console → Submit for review.

> Note: most UI/logic changes don't require a new APK — the WebView loads bundled HTML,
> but if you switch the Capacitor config to remote-content mode, web changes can ship
> instantly without a Play Store update. (Not enabled by default for security.)

---

## Permissions explained (what the user sees)

| Permission | When it's requested | Why |
|---|---|---|
| Location (fine + coarse) | First time user opens Location Picker or Emergency Request | GPS for "Find ambulance near me" |
| Camera | First time user uploads a prescription / lab report / profile photo | Take photo directly |
| Photos & media | Same | Pick existing image from gallery |
| Network | Always (no prompt) | API calls to backend |
| Dial intent | Tapping "Call 108" | Opens dialer with number pre-filled |

No background location, no contacts, no microphone, no SMS read — minimal footprint.

---

## Keystore credentials (one-time pickup — save in your password manager and delete the local files)

The release signing keystore was generated during scaffolding. Pick these up **once**,
store them in your password manager, then delete the source files:

- **Keystore file**: `frontend/release-signing.jks`
- **Base64 (for `RESQLY_KEYSTORE_BASE64` secret)**: `frontend/.release-keystore.b64.txt`
- **Alias**: `resqly-release`
- **Password (store + key)**: see the chat transcript where this was generated. _If you lost it,
  generate a new keystore — but be aware that once an app is published with one key, you cannot
  switch keys without using Play App Signing key rotation._
- **Validity**: 10,000 days (~27 years)

After you've stored the credentials securely, run:
```bash
rm frontend/release-signing.jks frontend/.release-keystore.b64.txt
```

> ⚠️ **Critical**: Losing this keystore means you can never publish an update to the same
> Play Store listing. Back it up in **at least 2 places** before deleting from the repo.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| Workflow fails at `assembleDebug` with "SDK not found" | Set `ANDROID_HOME` via `android-actions/setup-android@v3` (already done in workflow) |
| App opens then shows blank white screen | Backend URL wrong / unreachable. Check `REACT_APP_BACKEND_URL` GitHub variable. |
| Location/camera permission popups don't appear | The Capacitor plugin's `requestPermissions()` must run **before** the API call. Already wired in `Geolocation.requestPermissions()` / `Camera.requestPermissions()` flows. |
| "Upload failed" on file upload | Production backend's `CORS_ORIGINS` must include `https://localhost` (the Capacitor WebView origin). Currently `*` so OK. |
| Release build fails: keystore not found | Check that all 4 GitHub secrets are set (`RESQLY_KEYSTORE_*`). |

---

## Files added / modified by this setup

| File | Purpose |
|---|---|
| `frontend/capacitor.config.ts` | Capacitor app config (id, name, splash, plugins) |
| `frontend/android/` (full native project) | Android Studio project Capacitor scaffolded |
| `frontend/android/app/src/main/AndroidManifest.xml` | Permissions added |
| `frontend/android/app/build.gradle` | Signing config + version |
| `frontend/resources/icon.{svg,png}` | Source app icon |
| `frontend/resources/splash.{svg,png}` | Source splash |
| `frontend/resources/icon-foreground.png` | Adaptive icon foreground |
| `frontend/resources/icon-background.png` | Adaptive icon background |
| `frontend/.env.production` | Backend URL baked at build time |
| `frontend/package.json` | Added `cap:sync` / `android:*` scripts and Capacitor deps |
| `frontend/.gitignore` | Ignores android/build outputs + keystore files |
| `.github/workflows/android-build.yml` | CI build pipeline |

**Nothing in `backend/`, `frontend/src/`, or any existing React component was modified.**
