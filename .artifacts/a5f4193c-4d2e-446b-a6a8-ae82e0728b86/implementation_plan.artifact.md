# Implementation Plan - Fix GitHub Action Build (Expo Prebuild & Assets)

The build is likely failing during `npx expo prebuild` because the required asset files (icons and splash screen) specified in `app.json` are missing from the repository root. Additionally, I will optimize the dependency installation to handle the React 19 to 18 transition more cleanly.

## Proposed Changes

### [Assets & Configuration]

#### [NEW] [assets/](file:///H:/inventory/Inventory-Managment/assets/)
- Create the `assets` directory.
- Add placeholder images for `icon.png`, `splash.png`, and `adaptive-icon.png` so `expo prebuild` can succeed.

#### [MODIFY] [app.json](file:///H:/inventory/Inventory-Managment/app.json)
- Update paths to ensure they point correctly to the new assets.

### [CI/CD Workflow]

#### [MODIFY] [.github/workflows/build-apk.yml](file:///H:/inventory/Inventory-Managment/.github/workflows/build-apk.yml)
- **Delete `package-lock.json`**: In CI, we will delete the existing lock file before `npm install`. This forces a fresh resolution that respects the React 18 downgrade, avoiding `ERESOLVE` errors entirely.
- **Expo Prebuild Flags**: Add `--no-install` to `prebuild` since we already do a full install.
- **Gradle Permissions**: Ensure `gradlew` is executable in the generated directory.

### [Dependencies]

#### [MODIFY] [package.json](file:///H:/inventory/Inventory-Managment/package.json)
- Add `react-native-reanimated` (required for some NativeWind/Navigation animations).
- Add `expo-constants` (often needed for Supabase/Config access).

## Verification Plan

### Manual Verification
1. Push changes.
2. Monitor GitHub Actions.
3. The build should now:
   - Generate fresh dependencies.
   - Find the placeholder icons and complete `prebuild`.
   - Compile the APK using Gradle.

> [!IMPORTANT]
> Deleting the lock file in CI is a temporary measure to bridge the gap between the old Web lock file and the new Native dependencies.
