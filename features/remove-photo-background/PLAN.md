# Remove photo backgrounds

Status: Owner asked for implementation and shipping on 2026-11-03. Decisions marked *(Claude)* were not asked and can be overridden.

Garment photos get their background removed on the phone, leaving the garment on a transparent background. This is the first step towards an outfit board that shows chosen garments together, which is planned next and not part of this feature.

## Goals

- Remove a garment photo's background from the garment form with one tap.
- Remove the backgrounds of every existing photo in one go from Settings.

## Non-goals

- The outfit board (next feature).
- Manual touch-up of the cutout, or cropping to the garment.
- Keeping the original photo (owner: replace it).

## How it works

- Google ML Kit **subject segmentation**, on the phone, through a small native module in the app (`WardrobeBackground`). It needs no account or key, and photos never leave the phone.
- The model comes from Google Play services. The app asks for it at install or update time, and a first use may still have to wait while it downloads. Phones without Play services can't use the feature, and the button explains this.
- The cutout keeps the photo's size and position (no cropping), so grid cards stay aligned. It's saved as **WebP with transparency** *(Claude)*: JPEG can't be transparent, and PNG would make each photo several times bigger. WebP stays close to today's JPEG sizes.

## Garment form (owner: button in the form; replace the photo)

- Under the photo: **Remove background** (shown when there is a photo). While it runs it reads "Removing background…".
- On success the photo shows the cutout. **Undo** brings back the previous photo until Save, so a bad cutout can be discarded. Saving replaces the original.
- On failure a short message appears:
  - "Background removal is getting ready; try again in a minute" while the model downloads.
  - "No garment found in this photo".
  - "Background removal isn't available on this phone" without Play services.
  - "Couldn't remove the background" for anything else.
- Photos that are already cut out don't show the button *(Claude)*.

## Settings (owner: one-off action for existing photos)

- **Photos → Remove all backgrounds.** A confirmation says it replaces the photos of N garments, can't be undone, and that a backup should be exported first.
- While it runs, progress shows ("12 / 80") with **Stop**. Garments are processed one at a time, and each saves as soon as it's done, so stopping keeps the finished ones.
- Garments without a photo, or already cut out, are skipped. Failures are skipped and counted ("3 couldn't be processed").

## Storage and compatibility

- `image` stays a base64 string. It now holds JPEG (original photos) or WebP (cutouts), and both display as before. No new fields and no persist version bump.
- A cutout is recognised by its WebP header, so the Settings action can be run again safely.
- Automatic colors are taken from the photo when it's added, before any cutout, so transparent areas don't count as colors.

## Implementation

- `android/app/build.gradle`: `com.google.android.gms:play-services-mlkit-subject-segmentation`.
- `AndroidManifest.xml`: `com.google.mlkit.vision.DEPENDENCIES = subject_segment`, so Play services downloads the model with the app.
- `WardrobeBackgroundModule.kt` (+ package, registered in `MainApplication.kt`): `removeBackground(base64)` → base64 WebP, with error codes for each failure.
- `utils/backgroundRemoval.ts`: JS wrapper, `isCutout(image)`.
- `redux/itemsSlice.ts`: `setGarmentImage({ id, image })`.
- `screens/stackNav/ItemForm.tsx`: the button, Undo and messages.
- `screens/stackNav/Settings.tsx`: the bulk action with progress and Stop.
- `utils/localization.ts`: English and Spanish texts.

## Acceptance checks

- Form: the button replaces the photo with the cutout, Undo restores it, and Save stores the cutout. Each failure shows its message. The button is hidden for cut-out photos and photo-less garments.
- Settings: the confirmation names the count, progress is shown, Stop works, and photo-less and cut-out photos are skipped. Each garment is saved as it finishes.
- Cutouts display in the Closet, the log sheet and outfits.
- `npx tsc --noEmit`, `npm run lint`, `npm test` and the Android build pass.
- Phone check by the owner: cutout quality on real clothes, speed, and the first-use model download.

## Changes found during implementation

- Only `16.0.0-beta1` of ML Kit subject segmentation exists. It's a beta from Google, but it's the only on-device option without bundling a large model.
- The Settings run stops at the first "getting ready" or "not available on this phone" result, since every other photo would fail the same way. Other failures are skipped and counted.
- An empty or near-empty cutout (under 1% of the photo kept) counts as "No garment found".

## Validation

171 tests pass across 19 suites. TypeScript and lint pass with zero warnings.

New tests cover:
- Cutouts recognised by their WebP header.
- Each native failure mapped to its message, including a phone without the native module.
- The form button: an error message, the cutout replacing the photo, Undo restoring it, Save storing the cutout, and no button for cut-out photos.
- The Settings run: confirming with the right count, skipping cut-out and photo-less garments, saving each garment as it finishes, counting failures, Stop keeping finished garments, stopping at once while the model downloads, and the "already cut out" message.

The Android build (Kotlin module and ML Kit) is checked by GitHub Actions on the PR.

Not tested on a phone:
- Cutout quality on real clothes, and the speed.
- The model download through Play services.
- The APK size increase.

## Removed: Remove all backgrounds (2026-11-10)

The owner asked to remove the "Remove all backgrounds" control from Settings.

- Removed:
  - the Settings › Photo tools section;
  - `components/BulkBackgroundRemoval.tsx`;
  - the `setGarmentImage` reducer, which only that control used;
  - its strings (PhotoTools, RemoveAllBackgrounds, ConfirmRemoveBackgrounds, BackgroundProgress, BackgroundsDone, BackgroundsSkipped, NoPhotosToProcess, Stop);
  - its tests.
- Kept: removing the background of one garment from the garment form, and the background option in bulk add.
- Saved data: unchanged; photos that were already cut out stay cut out.
- Checks: `npx tsc --noEmit`, `npm run lint` and `npm test` (29 suites, 283 tests) pass.
