# Implementation Plan - Fix GitHub Action Build Failure

The GitHub Action build is failing with `error: invalid source release: 21` because the workflow in the repository root is still configured to use Java 17, while the project now requires Java 21 (due to SDK 36 and Capacitor requirements).

## Proposed Changes

### [GitHub Actions]

#### [MODIFY] [.github/workflows/build-apk.yml](file:///H:/inventory/Inventory-Managment/.github/workflows/build-apk.yml)

Update the root workflow file with the following:
- **Upgrade JDK**: Change `java-version` from `17` to `21`.
- **Add Permissions**: Add `permissions: contents: write` to allow the release creation.
- **Add Branch Trigger**: Include the worktree branch in triggers for testing if needed.
- **Enable Caching**: Add Gradle caching for faster builds.
- **Fix Preference Conflict**: Set `ANDROID_PREFS_ROOT: ""` in the build step.
- **Update Node.js**: Bump to version `22` to match the local environment.

## Verification Plan

### Manual Verification
- After applying the changes, the user should push to the `main` branch.
- Verify the build succeeds in GitHub Actions.
- Verify the APK is generated and attached to a new pre-release.
