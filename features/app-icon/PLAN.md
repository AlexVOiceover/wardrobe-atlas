# App icon

Status: on 2026-11-09 the owner chose option C from three proposals and said "implement C". Implemented on `feature/app-icon`.

## Goals

- Replace the black "WA" letters on light grey with an icon that says "clothes" at a glance.
- Look right in every launcher shape (circle, squircle, rounded square), at small sizes, and as the Android 13+ themed icon.

## Non-goals

- No change to the app name, the in-app colours or the splash screen.
- No raster (PNG) icons; the icon stays vector-only, as before.

## Design (option C, "Shirt on a hanger")

- A white T-shirt on an amber hanger (`#F2B35B`), on the app's teal bar colour (`#1F4E5A`, `theme.colors.bar`).
- Drawn on Android's 108 × 108 adaptive canvas, with everything inside the central 66-unit safe zone, so no launcher shape cuts it.
- Options A (hanger and map pin) and B (open wardrobe) were shown on the comparison page and not chosen.

## Implementation

- `res/drawable/ic_launcher_foreground.xml`: the shirt, the hook and the hanger shoulders.
- `res/drawable/ic_launcher_monochrome.xml` (new): the themed icon is the shirt and hook only. The shoulder lines are drawn over the shirt, so in one colour they would vanish.
- `res/values/colors.xml`: `launcher_background` goes from `#F5F5F5` to `#1F4E5A`.
- `res/mipmap-anydpi-v33/*`: the themed icon uses the new monochrome drawable.
- `res/mipmap-anydpi/*` (Android 7, which has no adaptive icons): the same design, scaled 1.4× on a teal rounded square or circle.
- `mipmap-anydpi-v26/*` are unchanged; they pick up the new foreground and background.

## Storage and migration

None. Only Android resources change.

## Edge cases

- Some launchers cache icons. If the old icon stays after updating, restarting the phone or the launcher refreshes it.

## Acceptance checks

- The Android build compiles the vector resources (CI `android` check).
- On the phone, after updating: the home screen and app drawer show the teal icon with the white shirt and amber hanger, with nothing cut off. With themed icons on, it shows the shirt and hook in the theme colour.

## Validation

- The XML files parse.
- `npx tsc --noEmit`, `npm run lint` and `npm test` pass; no JavaScript changed.
- The CI Android build compiles the resources.
- Not yet checked on a phone.
