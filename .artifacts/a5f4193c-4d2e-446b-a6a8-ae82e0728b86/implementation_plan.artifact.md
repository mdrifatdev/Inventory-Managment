# Implementation Plan - Fix Invalid Package Error

The "package appears to be invalid" error usually occurs when the APK's architecture doesn't match the device or when there's a signing compatibility issue.

## Proposed Changes

### Android Build Configuration

#### [MODIFY] [android/app/build.gradle](file:///H:/inventory/Inventory-Managment/.claude/worktrees/ecstatic-swirles-b0e7e4/android/app/build.gradle)
- **Enable Universal APK**: Set `universalApk true`. This will generate an `app-universal-release.apk` that works on all devices (arm64, armv7, etc.), eliminating the "invalid package" error caused by architecture mismatch.
- **Explicit Signing Compatibility**: Ensure `v1SigningEnabled` and `v2SigningEnabled` are active in the signing configuration to support a wider range of Android versions.

### CI/CD Workflow

#### [MODIFY] [.github/workflows/build-apk.yml](file:///H:/inventory/Inventory-Managment/.github/workflows/build-apk.yml)
- Update the artifact path to specifically highlight the **Universal APK**, as that is the one most users should install.

## Verification Plan

### Manual Verification
1.  Push the changes to GitHub.
2.  Wait for the GitHub Action to finish.
3.  Download the **`app-universal-release.apk`** from the GitHub Release.
4.  Verify that it installs correctly on your device.
