# Walkthrough - Fix APK Installation Error

I have updated the project configuration to resolve the "Invalid Package" error during installation.

## Changes Made

### 1. SDK Stability Update
- **File**: `variables.gradle`
- **Change**: Downgraded `compileSdkVersion` and `targetSdkVersion` from `36` (preview) to **`35`** (Stable Android 15).
- **Reason**: Using preview SDK versions can sometimes lead to installation failures on devices running stable Android versions.

### 2. Version Increment
- **File**: `android/app/build.gradle`
- **Change**: Incremented `versionCode` to **`2`**.
- **Reason**: Helps Android recognize the new APK as a distinct build from the previous one.

## CRITICAL: How to Install Successfully

> [!CAUTION]
> **You MUST uninstall the existing app first.**
>
> Because the APKs built by GitHub Actions use a temporary signing key that changes every time, Android will refuse to "update" the existing app. You will always see an "Invalid Package" or "App not installed" error if an older version is already on your phone.

### Steps:
1.  **Delete** the "Inventory Manager" app from your phone.
2.  **Push** these changes to GitHub.
3.  **Download** the new **`app-universal-release.apk`** from the latest GitHub Release.
4.  **Install** the new file.

> [!SUCCESS]
> Following these steps will ensure a clean installation using the optimized universal build.
