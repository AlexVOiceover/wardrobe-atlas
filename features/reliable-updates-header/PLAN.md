# Reliable in-app updates and version header

Status: Owner explicitly requested implementation and automatic update delivery on 2026-11-02. Include the previously unmerged core cleanup; publish after checks pass. Future requested app changes should be delivered through the in-app update route unless review-only work is requested.

## Contract
- A shared header on every screen shows Wardrobe Atlas and the installed Android package version. Superseded by the [UI first pass](../ui-first-pass/PLAN.md): the version now lives in Settings. Remove the welcome greeting and its unused strings.
- Automatic checks on launch, resume and periodically while foregrounded; manual Settings check bypasses cooldown. Share one in-flight operation.
- Show checking/downloading/ready/permission/error/current status in English and Spanish. No OS reminders or notification system.
- Verify downloaded size/hash, retain a verified cached APK across the install-permission round trip, and resume from Android settings. Do not immediately reopen the installer after cancellation.
- Native Android bridge reads actual installed package metadata, opens the app's unknown-source settings and starts the installer for a newer same-package APK in app cache. Android approval remains required.
- Keep update failures visible and retryable, while offline wardrobe use continues. Distinguish publication/rate-limit/network/download/installation failures from up-to-date.
- Serialize main builds and verify APK package/version before publishing; verify the public release/asset before claiming delivery. Do not send APK download links by default.

## Verification
Test manual cooldown bypass, active polling, concurrent checks, network/HTTP errors, invalid downloads, permission return, installer cancellation, cached retries, installed-version metadata and Settings/header wiring. Run the existing suite, TypeScript, lint and signed APK CI. Merge and verify main publication. Device installation and launcher/UI confirmation remain on-device checks.

## Local verification

37 behavior tests pass, including manual retry/cooldown bypass, concurrent calls, foreground-only polling, installed metadata, cached permission return, cancellation without reopening, rate limits, corrupt downloads, installer failure recovery, late progress events, header and Settings wiring. TypeScript and targeted ESLint pass. Workflow YAML and the APK verification shell parse. Production JS bundling and signed APK compilation are checked before publication.
