# App icon

Status: two rounds.
- 2026-11-09: the owner chose "shirt on a hanger" (option C of the first proposals), published in v0.1.108.
- Same day: the owner asked for a stack of T-shirts like a "layers" icon, but piled side by side, with one shirt in a different colour for the garment the app helps you find. They chose option A of the second proposals and said "implement A and ship it", published in v0.1.110.
- 2026-11-10: the owner found five shirts a bit too busy and asked for four. Implemented on `feature/four-shirts-icon`.

## Goals

- An icon that says "clothes" at a glance and hints at what the app does: find the garment you're looking for.
- Look right in every launcher shape (circle, squircle, rounded square), at small sizes, and as the Android 13+ themed icon.

## Non-goals

- No change to the app name, the in-app colours or the splash screen.
- No raster (PNG) icons; the icon stays vector-only.

## Design (current: four shirts, the amber one lifted)

- Four T-shirts stand side by side in perspective, like the owner's reference "layers" icon turned sideways. Five was the first version; four is less busy and gives each shirt more room.
- All the shirts are white except the second, which is amber (`#F2B35B`) and raised out of the row, as if the app pulled it out. With four shirts there is no exact middle, so the amber one sits second from the left, with one shirt behind it and two in front.
- The background is the app's teal bar colour (`#1F4E5A`, `theme.colors.bar`).
- Each shirt's visible part is computed so the shirts never overlap, with a real gap between them. This keeps the single-colour themed icon readable.
- Everything is fitted inside the central 66-unit safe zone of Android's 108 × 108 adaptive canvas, so no launcher shape cuts it.
- Not chosen in the second round: B (five shirts in a row, nothing lifted) and D (front-facing pile). The four-shirt layout is option C from that round.

## Implementation

- `features/app-icon/generate_icon.py` draws the shirts with shapely and writes the vector files. Rerun it to tweak the design (number of shirts, angle, gap, lift).
- It writes these files:
  - `res/drawable/ic_launcher_foreground.xml`
  - `res/drawable/ic_launcher_monochrome.xml`, with the same shapes in one colour
  - `res/mipmap-anydpi/ic_launcher.xml` and `ic_launcher_round.xml`, for Android 7: the same design, scaled 1.4× on a teal rounded square or circle
- From the first round, these are kept:
  - `launcher_background` set to `#1F4E5A` in `res/values/colors.xml`
  - the themed icon pointing at `ic_launcher_monochrome` in `mipmap-anydpi-v33/*`

## Storage and migration

None. Only Android resources change.

## Edge cases

- Some launchers cache icons. If the old icon stays after updating, restarting the phone or the launcher refreshes it.

## Acceptance checks

- The Android build compiles the vector resources (CI `android` check).
- On the phone, after updating: four shirts, three white and one lifted amber, on teal, with nothing cut off. With themed icons on, the same shapes in the theme colour, with the gaps visible.

## Validation

- The generated XML files parse.
- I rendered the vector path data in Chrome: the adaptive icon in a circle at 160 and 48 px, the themed icon, and both Android 7 icons. All look right.
- `npx tsc --noEmit`, `npm run lint` and `npm test` pass; no JavaScript changed.
- The CI Android build compiles the resources.
- Not yet checked on a phone.
