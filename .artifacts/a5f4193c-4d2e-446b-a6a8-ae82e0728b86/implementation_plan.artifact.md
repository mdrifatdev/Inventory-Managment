# Implementation Plan - Fix NativeWind Async PostCSS Error

The build is failing during the "createBundleReleaseJsAndAssets" task with the error: `Use process(css).then(cb) to work with async plugins`. This is a known incompatibility between NativeWind v2 and Tailwind CSS versions 3.3.3 or higher, as they introduce asynchronous PostCSS features that NativeWind v2 cannot handle synchronously.

## Proposed Changes

### [Dependency Fix]

#### [MODIFY] [package.json](file:///H:/inventory/Inventory-Managment/package.json)
- Ensure `tailwindcss` is pinned exactly to `3.3.2` (no caret `^`).
- **Remove all leftover web dependencies**: I will double-check for any remaining web-only packages that might be causing resolution issues in CI.

### [PostCSS Configuration]

#### [NEW] [postcss.config.js](file:///H:/inventory/Inventory-Managment/postcss.config.js)
- Create a minimal `postcss.config.js` to explicitly control the plugin pipeline and ensure it remains synchronous.

```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
  },
};
```

### [Metro Optimization]

#### [NEW] [metro.config.js](file:///H:/inventory/Inventory-Managment/metro.config.js)
- Create a standard `metro.config.js` to ensure the bundler is correctly configured for Expo and NativeWind.

### [CI/CD Workflow Update]

#### [MODIFY] [.github/workflows/build-apk.yml](file:///H:/inventory/Inventory-Managment/.github/workflows/build-apk.yml)
- Add a step to clear the Metro cache before building.
- Ensure `npm install` uses `--force` if necessary to override persistent lockfile mismatches.

## Verification Plan

### Automated Verification
- The primary verification will be the successful completion of the GitHub Action "Build Release APK" job.

### Manual Verification
- If you have a local environment, run `./gradlew assembleRelease` in the `android` folder (after `npx expo prebuild`) to verify the fix.
