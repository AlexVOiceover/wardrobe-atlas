# Fields stay above the keyboard

Status: Owner asked for implementation on 2026-11-04 ("when editing those the android keyboard covers them… check that in ALL the app"). Decisions marked *(Claude)* were not asked and can be overridden.

## Problem

The app targets Android 16 (SDK 36). From Android 15, apps are drawn edge to edge and `adjustResize` no longer shrinks the app when the keyboard opens. Fields low on a screen (Name, Quantity and Size on the garment form, for example) ended up behind the keyboard.

## Goals

- On every screen, the field being typed in stays visible above the keyboard.

## Non-goals

- Redesigning any form.

## Implementation

- `MainActivity` (Android 15 and later only): when the keyboard opens, the app's content view gets bottom padding equal to the keyboard height, so the app shrinks above it as it used to. Earlier Android versions still resize on their own, so they're left alone.
- Every screen with text fields scrolls (garment form, bulk form, outfit form, Settings, Wardrobes), and Android's scroll view keeps the focused field in view when it shrinks.
- The safe-area padding under the app drops to zero while the keyboard is up, because it's measured against the app's new bottom edge.
- The bottom tab bar hides while the keyboard is open *(Claude)*; otherwise it would sit on top of the keyboard.
- The search field and the dialogs drawn inside the app (such as the color picker's HEX field) are covered by the same fix.
- Centred panels (new collection, rename, …) are separate windows that React Native already resizes for the keyboard; they're unchanged.

## Storage and migration

- None.

## Acceptance checks (on a phone)

- Garment form: tap Name, Quantity or Size; each stays visible above the keyboard.
- Same for the bulk form, outfit form, Settings name and a new wardrobe.
- Closet search: the tab bar doesn't float above the keyboard.
- New collection and Rename panels: the field and buttons stay visible.
- Closing the keyboard leaves no gap at the bottom.

## Validation

- Can't be built locally (needs Java 17); the CI Android build validates the Kotlin.
- `tsc`, lint and tests pass.
- Not yet checked on a phone, which is the real test here.
