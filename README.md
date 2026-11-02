# Wardrobe Atlas

A minimal Android wardrobe app built with React Native and TypeScript. Manage clothes, physical wardrobes, categories, collections and outfit logs. Data is stored locally, with JSON backup export and import.

English and Spanish are supported. The interface uses plain lists, forms and system fonts. Garment photos and colors remain functional; decorative artwork, custom animations and appearance editors have been removed.

## Install

Download `Wardrobe-Atlas.apk` from [Releases](https://github.com/AlexVOiceover/wardrobe-atlas/releases/latest) and open it on an ARM64 Android device running Android 7.0 or later. Allow installation from the browser or file manager when Android requests it.

Releases contain the version on `main`. To test changes before merge, download the APK artifact ZIP from the corresponding [pull request build](https://github.com/AlexVOiceover/wardrobe-atlas/actions), extract it and open the APK.

The app checks published GitHub Releases on launch, on return and periodically while open. Settings includes Check for updates, with visible download/error status and installation-permission guidance. Settings shows the installed Android version. Android requires approval to install an update. Current builds use the repository's development signing key and are for personal testing.

Wardrobes group clothes by physical location. Each garment record (including its full quantity) can belong to one wardrobe or remain Unassigned. Manage wardrobes from Home; assign them in garment and bulk creation forms. Deleting a wardrobe keeps its clothes and history. Backups include all wardrobes and clothes regardless of the current filter. New wardrobe backups require a compatible app version.

## Develop

Requirements: Node.js 22, Java 17 and an Android SDK with platform 36, build tools 35.0.0 and NDK 27.1.12297006, with `JAVA_HOME` and `ANDROID_HOME` set. See [Android configuration](android/build.gradle) and [CI](.github/workflows/android-release.yml).

```sh
npm ci
npm start
```

Turn on USB debugging on an ARM64 Android device and connect it. In a second terminal:

```sh
npm run android
```

This installs Wardrobe Atlas Dev (`com.wardrobeatlas.app.debug`) alongside the released app, with its own separate data. Code changes reload from Metro; rerun the command after native changes.

Under WSL, the build runs in Linux and the script reaches the device through the Windows `adb.exe`, found automatically or set with `ADB`. WSL2 has no KVM by default, so use a phone rather than an emulator.

Checks:

```sh
npx tsc --noEmit
npm run lint
npm test
```

Build an ARM64 APK from `android/`:

```sh
./gradlew :app:assembleRelease -PreactNativeArchitectures=arm64-v8a
```

On Windows use `.\gradlew.bat`. Output: `android/app/build/outputs/apk/release/app-release.apk`.

## Repository

- `screens/`, `components/`, `routers/`: interface and navigation.
- `redux/`, `utils/`, `hooks/`: persisted state and app behavior.
- `android/`, `ios/`: native projects; Android is the validated target.
- `__tests__/`: behavior tests.
- [Feature plans](features/README.md) and [working agreement](AGENTS.md).

Pull requests build and test an APK without publishing. Pushes to `main` build and publish a Release tagged `v0.1.<run_number>`. Each run embeds its build number so the app can identify newer releases.

## Origin

Fork of [Closet-Archive](https://github.com/bahaaTuffaha/Project-ClosetArchive) by Bahaa Tuffaha. Distributed under the [MIT license](License).
