# Implementation Plan - Fix "Invalid Package" Installation Error

The "App not installed as package appears to be invalid" error is likely caused by one of three things:
1.  **Signature Mismatch**: Every time GitHub builds the app, it generates a *new* temporary key. If you have an old version installed, Android will block the new one because the keys don't match.
2.  **SDK Version Mismatch**: The project was targeting SDK 36 (Android 16?), which is currently in preview/unstable. Switching to the stable SDK 35 (Android 15) is safer.
3.  **Architecture Mismatch**: Using the architecture-specific APKs instead of the Universal one.

## Proposed Changes

### Android Configuration

#### [MODIFY] [variables.gradle](file:///H:/inventory/Inventory-Managment/.claude/worktrees/ecstatic-swirles-b0e7e4/android/variables.gradle)
- Change `compileSdkVersion` and `targetSdkVersion` from `36` to **`35`** (Stable Android 15).

#### [MODIFY] [android/app/build.gradle](file:///H:/inventory/Inventory-Managment/.claude/worktrees/ecstatic-swirles-b0e7e4/android/app/build.gradle)
- Increment `versionCode` to `2` to ensure Android sees it as an update (though uninstalling is still recommended).

## Verification Plan

### Manual Verification
1.  **CRITICAL**: **Uninstall the existing "Inventory Manager" app from your phone first.** This is required because the GitHub build key changes every time.
2.  Push the changes.
3.  Download **`app-universal-release.apk`** from the GitHub Release.
4.  Install on device.

> [!IMPORTANT]
> You **MUST** uninstall any previous version of the app before installing a new build from GitHub Actions.
