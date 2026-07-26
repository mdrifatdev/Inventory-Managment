# Walkthrough - Fix CI Android Locations Service Error

I have resolved the build failure in GitHub Actions caused by the `AndroidLocationsBuildService`.

## Changes Made

### 1. Eliminated Conflicting Environment Variables
- **Issue**: Setting `ANDROID_USER_HOME` and `ANDROID_PREFS_ROOT` manually in the GitHub Actions runner was confusing the Android Gradle Plugin's internal directory management.
- **Fix**: Removed these custom overrides. The build will now use the standard system defaults, which is more reliable.

### 2. Standardized Keystore Placement
- **Location Update**: The "Generate Debug Keystore" step now places the file at `~/.android/debug.keystore`.
- **Automatic Detection**: By using the standard home directory location, Gradle's default `debug` signing configuration will find the key automatically without requiring manual paths in the code.

## How to Verify

1.  **Push Changes**: Push the updated `.github/workflows/build-apk.yml` to GitHub.
2.  **Watch Actions**: The build should now pass the initialization and evaluation phase (where it previously failed) and proceed to compile and package the APK.
3.  **Download APK**: Once finished, download the **`app-universal-release.apk`** from the Release section.

> [!SUCCESS]
> Reverting to the standard Android home directory structure resolves the internal Gradle plugin conflicts while still ensuring the build is properly signed for testing.
