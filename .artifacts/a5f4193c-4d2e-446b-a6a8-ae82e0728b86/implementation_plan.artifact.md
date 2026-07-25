# Implementation Plan - Fix Missing Debug Keystore in CI

The GitHub Action build is failing because it cannot find the `debug.keystore` file. This usually happens in CI environments where the default Android preferences directory hasn't been initialized or is pointing to an unexpected location.

## Proposed Changes

### [GitHub Actions]

#### [MODIFY] [.github/workflows/build-apk.yml](file:///H:/inventory/Inventory-Managment/.github/workflows/build-apk.yml)

1.  **Remove `ANDROID_PREFS_ROOT: ""`**: This variable might be causing Gradle to look in the project directory instead of the standard user home.
2.  **Explicitly set `ANDROID_USER_HOME`**: Set it to a known writable location (`${{ github.workspace }}/.android`).
3.  **Generate Debug Keystore**: Add a step to manually generate a `debug.keystore` if it doesn't exist. This ensures that the `packageDebug` task always has a valid keystore to sign the debug APK.

```yaml
      - name: Generate Debug Keystore
        run: |
          mkdir -p .android
          keytool -genkey -v -keystore .android/debug.keystore -storepass android -alias androiddebugkey -keypass android -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=Android Debug,O=Android,C=US"
```

4.  **Update Build Step**: Pass the `ANDROID_USER_HOME` to the Gradle build.

## Verification Plan

### Manual Verification
- Push the changes to GitHub.
- Verify that the "Generate Debug Keystore" step runs successfully.
- Verify that the "Build debug APK" step completes without the "missing keystore" error.
- Verify the APK is generated.
