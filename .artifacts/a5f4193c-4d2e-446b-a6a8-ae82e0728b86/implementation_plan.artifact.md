# Implementation Plan - Fix Android Locations Service Error in CI

The build is failing with `AndroidLocationsBuildService` error. This is a known issue in Android Gradle Plugin (AGP) 8.x when custom environment variables for Android preferences (`ANDROID_USER_HOME`, `ANDROID_PREFS_ROOT`) are set in a way that conflicts or confuses the internal directory creator.

## Proposed Changes

### GitHub Action Workflow

#### [MODIFY] [.github/workflows/build-apk.yml](file:///H:/inventory/Inventory-Managment/.github/workflows/build-apk.yml)

1.  **Remove custom Preference Overrides**: Remove `ANDROID_USER_HOME` and `ANDROID_PREFS_ROOT` from the build step environment. These were intended to fix a local conflict but are causing the "AndroidDirectoryCreator" failure in the standard GitHub Actions Ubuntu environment.
2.  **Standard Keystore Path**: Update the "Generate Debug Keystore" step to place the keystore in the default standard location (`~/.android/debug.keystore`). This allows Gradle to find it automatically without any custom configuration.
3.  **Ensure Directory Exists**: Add `mkdir -p ~/.android` to ensure the directory is ready.

## Verification Plan

### Manual Verification
- Push the changes to GitHub.
- Verify that the "Build release APK" step completes without the `AndroidLocationsBuildService` exception.
- Verify that the APK is successfully signed using the generated key in the default location.
