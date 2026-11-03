# Keep only the garment

Status: Owner asked for implementation and shipping on 2026-11-03. Decisions marked *(Claude)* were not asked and can be overridden.

Background removal keeps the whole person. A photo of a fleece being worn still shows the face and the trousers. This feature keeps only the garment the photo is for.

## Goals

- For tops and bottoms, the garment form's photo button keeps only that garment: no face, hands, trousers or top.
- It also works on photos that were already cut out with background removal, so those can be fixed.

## Non-goals

- Shoes and accessories. The model doesn't recognise them, so they keep background removal.
- Re-running every photo from Settings. "Remove all backgrounds" is unchanged (possible later).
- Cropping to the garment, or touching up the cutout by hand.

## Choosing the model (owner: test on real photos first, licence first)

Three options were run on 16 of the owner's photos:

| Option | Result | Licence |
|---|---|---|
| SegFormer B2 clothes | Best: separate top, bottom and shoes | NVIDIA SegFormer licence: research or evaluation only. **Ruled out** |
| MediaPipe selfie multiclass | Top and trousers always together | Apache 2.0 |
| **U²-Net cloth segmentation** (chosen) | Upper, lower and full-body garments kept apart. Works on 15 of 16 photos | MIT ([levindabhi/cloth-segmentation](https://github.com/levindabhi/cloth-segmentation); LiteRT build from [litert-community](https://huggingface.co/litert-community/Cloth-Segmentation-U2Net-LiteRT)) |

The U²-Net model was trained on iMaterialist-Fashion; the dataset's own terms weren't checked.

## How it works

- The model runs on the phone with LiteRT (TensorFlow Lite). Photos never leave the phone.
- The model is 176 MB, about four times the app, so it isn't bundled. The first use asks: "Keeping only the garment needs a 176 MB download, once… Use Wi-Fi if you can." **Yes** downloads it with progress on the button, then isolates the photo.
- The download is pinned to one model revision. Its size and SHA-256 are checked before use. A failed or damaged download is deleted and can be retried.
- Which garment is kept, by category:
  - Tops → upper body.
  - Bottoms → lower body.
  - Custom categories → whichever garment covers the most.
  - If the requested part isn't found, a full-body garment (dress or overall) is used instead *(Claude)*.
  - Shoes and accessories → background removal, as before.
- The cutout is the garment's area, solid inside. Specks smaller than a tenth of the biggest region are dropped. Like background removal, it keeps the photo's size and is saved as transparent WebP.

## Garment form

- Tops, bottoms and custom categories: **Keep only the garment** ("Isolating the garment…" while it runs). It shows on cut-out photos too, so they can be redone.
- Shoes and accessories: **Remove background**, unchanged.
- **Undo** until Save, and the failure messages, work as before. Two messages are new: a failed download, and a missing or damaged model.

## Storage and compatibility

- No data changes: `image` stays a base64 string (JPEG or WebP).
- The model is saved in the app's documents folder as `garment-model-u2net-37e0b75.tflite`. It isn't part of backups.

## Implementation

- `android/app/build.gradle`: `com.google.ai.edge.litert:litert:1.4.2`.
- `WardrobeBackgroundModule.kt`: `isolateGarment(base64, modelPath, part)`.
  - Runs at 768×768, picks the class, keeps the main regions and scales the mask to the photo.
  - Keeps the interpreter loaded between photos.
  - Error codes: `NO_SUBJECT`, `NO_MODEL`, `FAILED`.
- `utils/garmentIsolation.ts`: part by category, model download and verification, and the JS wrapper.
- `screens/stackNav/ItemForm.tsx`: the button, the download prompt and progress.
- `utils/localization.ts`: English and Spanish texts.

## Acceptance checks

- A top's photo keeps only the top, and a bottom's only the bottom. Shoes and accessories still use background removal.
- The first use asks before downloading, shows progress, then isolates. A failed download changes nothing and says so.
- Earlier cutouts of tops and bottoms can be isolated again.
- `npx tsc --noEmit`, `npm run lint`, `npm test` and the Android build pass.
- Phone check by the owner: quality on real photos, speed, download.

## Validation

- 186 tests pass across 21 suites. TypeScript and lint pass with zero warnings.
- New tests cover:
  - Part by category.
  - The download: progress, verification, and nothing left behind after a bad hash or HTTP error.
  - The wrapper's error mapping, including deleting a model that can't be loaded.
  - The form: tops calling "upper" without background removal, redoing an old cutout of a bottom, the download prompt with progress and then isolation, and a failed download.
- The mask post-processing was checked with a Python copy of the Kotlin steps on the owner's 16 photos. The Kotlin itself is compiled by GitHub Actions on the PR; there's no Java 17 locally.

Known limitations:
- The trousers cutout includes the shoes, which the model counts as part of the lower body.
- Hands resting on a garment sometimes stay in.
- A black T-shirt worn with black shorts came out patchy.
- Speed on a phone is untested. Expect a few seconds; it ran at 1.5 s on a desktop CPU.
