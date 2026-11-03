# Wardrobe Atlas

An Android wardrobe app built with React Native and TypeScript. Track clothes, wardrobes, categories and outfits. Data stays on the phone, with JSON backup export and import. English and Spanish.

## Install

Download `Wardrobe-Atlas.apk` from [Releases](https://github.com/AlexVOiceover/wardrobe-atlas/releases/latest) and open it on an ARM64 Android 7.0+ phone. The app checks for new releases and offers to install them.

## Develop

Requirements: Node.js 22, Java 17 and an Android SDK (platform 36, build tools 35.0.0, NDK 27.1.12297006).

```sh
npm ci
npm start
npm run android   # in a second terminal, with a phone connected over USB
```

Under WSL, the device is reached through the Windows `adb.exe`.

Checks:

```sh
npx tsc --noEmit
npm run lint
npm test
```

Pull requests build an APK. Pushes to `main` publish a Release tagged `v0.1.<run_number>`.

See the [feature plans](features/README.md) and the [working agreement](AGENTS.md).

## Origin

Fork of [Closet-Archive](https://github.com/bahaaTuffaha/Project-ClosetArchive) by Bahaa Tuffaha. [MIT license](License).
