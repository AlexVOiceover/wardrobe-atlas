# Android releases and in-app updates

Status: Merged in [PR #1](https://github.com/AlexVOiceover/wardrobe-atlas/pull/1). The first main build published [v0.1.10](https://github.com/AlexVOiceover/wardrobe-atlas/releases/tag/v0.1.10). Phone update installation remains unverified.

## Contract

- Push to `main`: test, compile a signed ARM64 APK, then publish it as `Wardrobe-Atlas.apk` in a GitHub Release. PRs validate an APK without publishing; manual runs can publish from `main`.
- Use the workflow run number as Android versionCode, JS build number and tag suffix `v0.1.<number>`.
- On Android launch/resume, check recent published Releases and select the greatest valid build newer than the installed version. Ignore drafts, prereleases and invalid assets.
- Download only the expected HTTPS asset from this repository. Verify size and SHA-256 when provided, then open Android's installer. Android owns installation permission and confirmation.
- Failed/offline checks must not block app use. Throttle checks and avoid concurrent downloads.

## Implementation and compatibility

[Workflow](../../.github/workflows/android-release.yml), [update service](../../utils/updateService.ts) and [tests](../../__tests__/updateService.test.ts).

Application ID: `com.wardrobeatlas.app`. Keep the same signing key for subsequent updates. The current checked-in development key is for personal testing; a production key requires a separate setup. No credentials are embedded in the app. Public GitHub Releases are required.

No storage schema changes or migration from the upstream app. Play Store, iOS updates and silent installation are outside scope.

## Validation

The [first main build](https://github.com/AlexVOiceover/wardrobe-atlas/actions/runs/41308135011) published successfully. Six update-selection tests cover versions, release ordering, invalid responses, asset URLs, size and digest metadata.

Pending phone check: install version N, publish an owner-approved N+1, reopen the app, approve installation and confirm the version and saved data. Also check offline startup, no-update behavior and installer cancellation.
