# Implementation Plan - Fix Build Error (Expo Migration)

The build is failing because the GitHub Action workflow is still trying to build the project as a **Capacitor/Vite** app, but we have migrated to **React Native (Expo)**. This plan updates the CI/CD pipeline to support the new architecture.

## Proposed Changes

### [CI/CD Optimization]

#### [MODIFY] [.github/workflows/build-apk.yml](file:///H:/inventory/Inventory-Managment/.github/workflows/build-apk.yml)
- **Remove Web Build**: Remove the `npm run build` (Vite) step as it's no longer needed for a native app.
- **Add Expo Prebuild**: Add a step to run `npx expo prebuild --platform android`. This generates the native Android project from your React Native code.
- **Update Build Step**: Ensure Gradle runs on the newly generated Android project.
- **Environment Variables**: Map Supabase secrets to Expo public environment variables (`EXPO_PUBLIC_...`).

### [Cleanup]

#### [DELETE] [capacitor.config.ts](file:///H:/inventory/Inventory-Managment/capacitor.config.ts)
- Remove old Capacitor configuration to prevent confusion.
#### [DELETE] [vite.config.ts](file:///H:/inventory/Inventory-Managment/vite.config.ts)
- Remove Vite configuration as it's no longer used.
#### [DELETE] [android/](file:///H:/inventory/Inventory-Managment/android/)
- **CRITICAL**: Remove the old Capacitor-based `android` folder. Expo will generate a fresh, compatible version during the build process.

## Verification Plan

### Manual Verification
1. Push the changes to GitHub.
2. Monitor the "Build Android APK" workflow.
3. It should now:
   - Install dependencies.
   - Run `expo prebuild` successfully.
   - Run `./gradlew assembleRelease` inside the generated `android` folder.
   - Upload the resulting APK.

> [!IMPORTANT]
> The first run might take a bit longer as it generates the native code for the first time in the CI environment.
