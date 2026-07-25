# Implementation Plan - Fix GitHub Action for Auto Build

The goal is to fix the GitHub Action workflow for building the Android APK. Based on the local build success and common CI issues, several improvements are needed.

## Proposed Changes

### [Component Name]

#### [MODIFY] [build-apk.yml](file:///H:/inventory/Inventory-Managment/.claude/worktrees/ecstatic-swirles-b0e7e4/.github/workflows/build-apk.yml)

- **Update JDK Version**: Change Java version from `17` to `21` to match the local environment and modern Android requirements (SDK 36).
- **Add Branch Trigger**: Include the current working branch `claude/ecstatic-swirles-b0e7e4` in the push triggers so the build runs on this branch.
- **Add Permissions**: Explicitly add `permissions: contents: write` to allow the workflow to create a GitHub Release and upload the APK.
- **Add Gradle Caching**: Enable caching in `actions/setup-java` to speed up builds.
- **Set ANDROID_HOME**: Explicitly set the `ANDROID_HOME` and `ANDROID_SDK_ROOT` if needed, although `setup-android` usually handles this.
- **Release Body**: Improve the release body to include more context.

## Verification Plan

### Manual Verification
- The user must push the changes to the `claude/ecstatic-swirles-b0e7e4` branch on GitHub.
- Observe the "Build Android APK" workflow in the GitHub Actions tab.
- Verify that:
  - The build succeeds.
  - An artifact named `inventory-manager-debug` is uploaded.
  - A pre-release is created with the APK attached.
