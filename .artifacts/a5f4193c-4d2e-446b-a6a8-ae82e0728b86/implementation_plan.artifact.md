# Implementation Plan - Fix Dependency Errors & Finalize Native Migration

The GitHub Action is failing because of a dependency conflict between the old React 19 web-related packages and the new React 18.2.0 required by React Native. This plan cleans up those conflicts and removes the remaining web development traces.

## Proposed Changes

### [Dependency Management]

#### [MODIFY] [package.json](file:///H:/inventory/Inventory-Managment/package.json)
- Removed `dexie`, `dexie-react-hooks`, and `react-dom` to eliminate web-specific logic and conflicts.
- Ensured all dependencies align with React 18.2.0.

#### [MODIFY] [.github/workflows/build-apk.yml](file:///H:/inventory/Inventory-Managment/.github/workflows/build-apk.yml)
- Changed `npm ci` to `npm install --legacy-peer-deps`.
- **Reason**: The existing `package-lock.json` contains references to React 19 from the old web project. `--legacy-peer-deps` allows the build to proceed while the lock file transitions to the native dependencies.

### [Cleanup]

#### [DELETE] Remaining Web Files
- Successfully removed `metadata.json` and `tsconfig.json` (web-configured).
- The project is now 100% focused on React Native / Expo.

## Verification Plan

### Manual Verification
1. Push changes to GitHub.
2. Monitor GitHub Actions.
3. The "Install dependencies" step should now pass using `--legacy-peer-deps`.
4. The build should proceed to `expo prebuild` and then Gradle.

> [!SUCCESS]
> Removing the obsolete web dependencies and allowing flexible peer dependency resolution will clear the path for the native build to succeed.
