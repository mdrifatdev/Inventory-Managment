# Implementation Plan - Fix CI Build Error (Missing Gradle Files)

The GitHub Action build is failing because `actions/setup-java` is trying to cache Gradle files before they exist. In an Expo managed project, the `android` directory is generated dynamically during the build.

## Proposed Changes

### [GitHub Actions]

#### [MODIFY] [.github/workflows/build-apk.yml](file:///H:/inventory/Inventory-Managment/.github/workflows/build-apk.yml)
- **Disable initial Gradle caching**: Remove `cache: 'gradle'` from the early `Setup Java JDK` step.
- **Reorder Steps**: Ensure `npm ci` and `npx expo prebuild` run *before* any step that expects the `android` folder to exist.
- **Optimization**: Move the Java and Android SDK setup to just before the Gradle build for better logical flow, or simply remove the caching requirement that's causing the crash.

## Verification Plan

### Manual Verification
- Push changes and verify that the "Setup Java JDK" step no longer crashes.
- Verify that `npx expo prebuild` correctly generates the `android` folder.
- Verify that the Gradle build finds the generated files and completes successfully.
