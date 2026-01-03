# Environment Switching Guide

This document provides a clear checklist and understanding of how to switch between **Production** and **Staging** environments for the Sewvee app.

## Summary of Environments

| Feature | Production | Staging (Dev) |
| :--- | :--- | :--- |
| **App Name** | Sewvee | Sewvee (Dev) |
| **Package ID** | `com.sewvee.app` | `com.sewvee.app.staging` |
| **Firestore Database** | `users`, `orders`, etc. | `staging_users`, `staging_orders`, etc. |
| **Firebase Config** | `google-services.json` | `google-services-staging.json` |
| **Native Identity** | Production Icons/Splashes | Dev-branded Icons/Splashes |

---

## 🚀 How to Switch (Checklist)

### 1. Switching to STAGING (Development)
- [ ] **Run the staging script**:
  ```bash
  ./scripts/build_local_staging.sh
  ```
- [ ] **What happens behind the scenes**:
  - `EAS_BUILD_PROFILE` is set to `staging`.
  - `npx expo prebuild --clean` regenerates the `android/` folder specifically for staging.
  - The app installs as a *separate* app on your phone (Sewvee Dev).
- [ ] **Verify**:
  - Open the app.
  - Look for **"SEWVEE (DEV) • STAGING"** at the bottom of the login screen.

### 2. Switching to PRODUCTION
- [ ] **Run the production script**:
  ```bash
  ./scripts/build_local_production_apk.sh
  ```
- [ ] **What happens behind the scenes**:
  - `EAS_BUILD_PROFILE` is set to `production`.
  - `npx expo prebuild --clean` regenerates the `android/` folder for production.
  - Signing keys (`sewvee-prod.jks`) are restored from the `secrets/` folder.
  - `fix_gradle_signing.js` patches the native code to use release signing.
- [ ] **Verify**:
  - Open the app.
  - Look for **"SEWVEE • PRODUCTION"** at the bottom of the login screen.

---

## ⚠️ Critical Rules
- **Never build directly in `android/`**: Always use the scripts in the `scripts/` folder. Building directly via `gradlew` without running `prebuild` first can lead to "hybrid" apps where the native environment doesn't match the JS logic.
- **Login Issues**: If you see "User not found", check the label at the bottom of the login screen. You are likely trying to log into the Production app with a Staging account (or vice versa).
