# Bilingual categories and subcategories

Status: Owner asked for implementation and shipping on 2026-11-03. Decisions marked *(Claude)* were not asked and can be overridden.

Categories and types the user adds, and renames of built-in ones, have a single name shown in both app languages. They get an English and a Spanish name. The user types one, and the other is filled in by on-device translation and can be corrected. "Type" is renamed "Subcategory", and the Categories page shows each category's subcategories nested inside it.

## Goals

- Every category and subcategory the user adds or renames has an English and a Spanish name.
- When typing in one language, the other fills in automatically with an on-device translation.
- "Type" becomes "Subcategory" ("Subcategoría") everywhere.
- The Categories page lists subcategories under their category, with add, rename and delete in place.

## Non-goals

- Other app languages, or translating garment names, brands, collections or wardrobes.
- Translating existing custom names automatically. Existing names keep the same text in both languages until the user edits them.

## Translation (owner: on-device)

- The translation uses Google ML Kit's on-device translator, through a small native module in the app (`WardrobeTranslator`). No account or key is needed.
- The first translation downloads the English↔Spanish language pack (about 30 MB), which needs an internet connection. After that it works offline. Text never leaves the phone.
- The download is allowed on any network *(Claude)*, so the first translation works right away. A note says "Translating…" while it runs.
- If translation fails (offline before the first download, or any error), the other field gets a copy of the typed text and a note says "Translation not available; edit it if needed".
- A field the user has typed in themselves is never overwritten by the translation.

## Name sheet

Add and rename both use one sheet:

```
Add subcategory
English  [Raincoat        ]
Español  [Chubasquero     ]   Translating…
                    [Cancel] [Save]
```

- The field for the app's language comes first and gets the keyboard. The other is translated about half a second after typing stops.
- Both names are required, and each must be unique among visible siblings in its own language (categories among categories, subcategories within their category).
- Renaming starts with both current names. Translation only runs once the user changes the first field.

## Categories page (owner: foldable categories)

```
▾ Tops                       ✎  🗑
     T-Shirt                 ✎  🗑
     Shirt                   ✎  🗑
     + Add subcategory
▸ Bottoms                    ✎  🗑
[ Add category ]
[ Restore default categories ]
```

- Tapping a category folds or unfolds it. All start folded *(Claude)*, and folds aren't remembered.
- Delete keeps today's confirmation, with garments moving to Other.
- The separate "Add category" and "Edit category" screens are removed; everything happens on this page in the name sheet.

## Subcategory wording

"Type" → "Subcategory" / "Subcategoría" in the garment form, bulk add, the filter sheet and messages ("Please choose a subcategory", "Add subcategory", delete confirmation).

## Storage and compatibility

- **Custom categories:** `name` is now always `[English, Spanish]`. A single stored name is used for both.
- **Custom subcategories:** gain `labels: [English, Spanish]`. `label` is kept as a fallback for older data. `value` is unchanged, so garments stay attached.
- **Renamed built-ins:** `categoryNames` and `typeNames` values become `[English, Spanish]`. An older single text is used for both.
- Older data and backups load unchanged. No persist version bump.

## Implementation

- `android/app/build.gradle`: `com.google.mlkit:translate`.
- `android/.../WardrobeTranslatorModule.kt` (+ package, registered in `MainApplication.kt`): `translate(text, source, target)`, downloading the model if needed.
- `utils/translate.ts`: JS wrapper. It returns nothing when the module is missing or fails.
- `components/NameSheet.tsx`: the two-language sheet.
- `redux/categoriesSlice.ts`, `utils/categories.ts`, `utils/wardrobeData.ts`: two-language names and normalization.
- `screens/stackNav/ManageCategories.tsx`: foldable list with nested subcategories.
- Remove `EditCategory.tsx`, `CategoryForm.tsx`, `components/EditableNameRow.tsx` and their routes.
- `utils/localization.ts`: Subcategory wording and the new texts.

## Acceptance checks

- Adding a category or subcategory saves both names. The other field fills with the translation, or a copy when translation fails. A field typed by hand isn't overwritten.
- Renaming built-in and custom entries saves both names, and each language shows its own.
- Older single names load into both languages, and the new names survive a backup round trip.
- The Categories page folds, shows nested subcategories, and adds, renames and deletes in place.
- No "Type" label left in the UI.
- `npx tsc --noEmit`, `npm run lint`, `npm test` and the Android build pass.
- Phone check by the owner: first translation downloads the language pack, and later translations work offline.

## Changes found during implementation

- The existing `@react-native-ml-kit/translate-text` package wasn't used: its Android setup sets the package name inside the manifest (`package=` in `AndroidManifest.xml`), which this app's Android Gradle plugin 8 rejects. A 40-line module in the app calls `com.google.mlkit:translate` directly instead.
- Save stays available while translating, because the first translation waits for the language pack download. Saving early copies the typed name into the empty field.
- Older custom subcategories keep their single `label` until renamed, and it shows in both languages.

## Validation

164 tests pass across 18 suites. TypeScript and lint pass with zero warnings.

New tests cover:
- The Categories page folding and showing nested subcategories.
- Renaming a subcategory with the other language filled by translation.
- The duplicate-name check in both languages.
- Deleting with a garment count.
- Adding a category when translation is unavailable (copied text and a note).
- A typed field never being overwritten.
- Adding a subcategory in both languages.
- Each language showing its own name, with older single names in both.
- New and old names through a backup round trip.

The Android build (Kotlin module and ML Kit) is checked by GitHub Actions on the PR.

Not tested on a phone:
- The first translation downloading the language pack, and later translations working offline.
- The APK size increase from ML Kit.
