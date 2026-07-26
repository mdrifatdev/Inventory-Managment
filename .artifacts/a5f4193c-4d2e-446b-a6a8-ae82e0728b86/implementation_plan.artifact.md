# Implementation Plan - Fix Resource Error & Optimize Build Time

This plan addresses the `color/splashscreen_background` not found error and implements caching to speed up the GitHub Action build.

## Proposed Changes

### [Expo Configuration]

#### [MODIFY] [app.json](file:///H:/inventory/Inventory-Managment/app.json)
- Add a minimal `splash` configuration with a `backgroundColor`. This ensures that `expo prebuild` generates the required Android color resources, fixing the "resource not found" error during the resource linking phase.

### [CI/CD Workflow Optimization]

#### [MODIFY] [.github/workflows/build-apk.yml](file:///H:/inventory/Inventory-Managment/.github/workflows/build-apk.yml)
- **Node.js Caching**: Enable `cache: 'npm'` in the `actions/setup-node` step to speed up dependency installation.
- **Gradle Caching**: Enable `cache: 'gradle'` in the `actions/setup-java` step. Since this step now runs *after* `npx expo prebuild`, it will correctly find the generated Gradle files and cache the downloaded dependencies and build artifacts.
- **Dependency Install**: Use `npm install --prefer-offline` to leverage the cache more effectively.
- **Remove `--clean`**: Remove the `--clean` flag from `expo prebuild`. In a fresh CI environment, this is redundant and adds extra processing time.

## Verification Plan

### Automated Verification
- Push changes and monitor the GitHub Action run.
- The build should now pass the `processReleaseResources` task.
- The total build time should be noticeably shorter due to caching.

### Manual Verification
- Verify that the resulting APK still works correctly and shows a white splash screen (default).
