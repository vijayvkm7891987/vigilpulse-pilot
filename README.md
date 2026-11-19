# VigilPulse PW-HEWS — Pilot-Ready Mobile Prototype

Privacy-Preserving Population & Workforce Health Early Warning System (React Native / Expo TypeScript).

## Quick Start (Local Mobile & Web Preview)
```bash
# 1. Install dependencies
npm install

# 2. Launch Expo development server (scan QR code with Expo Go on iOS/Android, or press 'w' for web)
npx expo start
```

## Features Included in This Prototype
- **15-Second Anonymous Worker Check-In:** 5-category syndromic check-in (`App.tsx`).
- **Hard Privacy Gate (`k >= 10`):** Select `LAB-UNIT-09` (7 participants) in the app to see live k-anonymity cell suppression in action.
- **EWMA & Composite WPRI Engine:** `src/engine/earlyWarningEngine.ts` fuses syndromic signals, WBGT heat stress, PM2.5, and aggregate absenteeism.
- **HL7 FHIR R4 MeasureReport Export:** Inspect the zero-PII FHIR R4 JSON summary directly in the Health Command tab.

## Generate a Live Deployment Link (PWA via Vercel)
```bash
npm run build:web
npx vercel --prod ./dist
```

## Build an Installable Android Pilot APK (Expo EAS)
```bash
npm install -g eas-cli
eas login
eas build -p android --profile preview
```

## Automated APK Builds via GitHub Actions (Zero Secrets Required)
This repository includes `.github/workflows/build-apk.yml`. Every push to `main` (or manual trigger via **Actions -> Build VigilPulse Android APK -> Run workflow**) automatically:
1. Runs `npx expo prebuild --platform android --non-interactive --clean`.
2. Compiles a standalone, JS-bundled Android APK via Gradle (`./gradlew assembleRelease`).
3. Attaches `vigilpulse-pilot-<commit-sha>.apk` directly as a downloadable artifact in the GitHub Actions run summary (no double-zipping, retained for 30 days).
