# Implementation Plan - Fix APK Build Failure

The build is failing because certain AndroidX dependencies require a minimum `compileSdk` of 36. Although I downgraded it to 35 for "stability," it caused a compilation error.

## Proposed Changes

### Android Configuration

#### [MODIFY] [variables.gradle](file:///H:/inventory/Inventory-Managment/.claude/worktrees/ecstatic-swirles-b0e7e4/android/variables.gradle)
- Revert `compileSdkVersion` and `targetSdkVersion` to **`36`** to satisfy dependency requirements.

#### [MODIFY] [android/app/build.gradle](file:///H:/inventory/Inventory-Managment/.claude/worktrees/ecstatic-swirles-b0e7e4/android/app/build.gradle)
- Increment `versionCode` to **`3`**.

### GitHub Action Workflow

#### [MODIFY] [.github/workflows/build-apk.yml](file:///H:/inventory/Inventory-Managment/.github/workflows/build-apk.yml)
- Explicitly set `ANDROID_PREFS_ROOT` to the same directory as `ANDROID_USER_HOME` to ensure maximum compatibility across all Gradle versions and plugins.

## Verification Plan

### Manual Verification
1.  Push changes.
2.  Monitor GitHub Actions for build success.
3.  Download the `app-universal-release.apk`.
4.  **Uninstall old app** from phone.
5.  Install new APK.
