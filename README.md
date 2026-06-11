# Resqly V1

> Healthcare emergency platform — Consumer pre-launch + Provider acquisition.
> FastAPI · React · MongoDB · Supabase Storage · Capacitor Android wrapper.

## Architecture
```
React SPA (CRA + craco)  ─▶  FastAPI (server.py)  ─▶  MongoDB
        │                              │
        │ Capacitor 7                  │ Supabase Storage
        ▼                              ▼
   Android APK                  4 buckets:
   (com.resqly.app)               prescriptions
                                  lab-reports
                                  provider-documents
                                  profile-images
```

## Repo layout
| Path | Purpose |
|---|---|
| `backend/` | FastAPI app (`server.py`), Pydantic models, Supabase upload routes |
| `backend/rate_limit.py` | In-memory rate limiter (OTP, admin login) |
| `frontend/src/` | React app — pages, components, hooks |
| `frontend/android/` | Capacitor-generated native Android project |
| `frontend/capacitor.config.ts` | Capacitor configuration |
| `frontend/resources/` | Source app icon + splash assets |
| `.github/workflows/android-build.yml` | CI to build Debug APK + signed Release AAB |
| `docs/ANDROID_BUILD.md` | Step-by-step Android build guide |

## Local development

### Backend
```bash
cd backend
cp .env.example .env       # fill in real values
pip install -r requirements.txt
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

### Frontend
```bash
cd frontend
yarn install
yarn start                  # http://localhost:3000
```

### Android (Capacitor)
See [`docs/ANDROID_BUILD.md`](docs/ANDROID_BUILD.md). Short version:
```bash
cd frontend
yarn build
yarn android:build:debug    # → android/app/build/outputs/apk/debug/app-debug.apk
```

## Deployment status
- **Backend**: production deployment at `https://resqly-launch.emergent.host`
- **Android**: GitHub Actions workflow at `.github/workflows/android-build.yml`
  - Artifacts: Debug APK + signed Release AAB (Play Store ready)
  - Triggers: push to `main` / manual run via Actions tab

## Required environment variables
See `backend/.env.example` and `frontend/.env.example`. Do not commit real `.env` files.

## Security
- Admin endpoints (`/api/admin/*`) require admin JWT; 5 failed logins / 15min IP lockout.
- OTP requests rate-limited: 1/60s per phone, 5/hour per IP.
- Supabase service-role key is server-side only — never bundled in frontend.
- SMS OTP is mocked for V1 (`mock_otp` returned in response); Twilio deferred.

## License
Proprietary — © Resqly. All rights reserved.
