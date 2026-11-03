# Steady update messages

Status: Owner asked for the fix on 2026-11-03 ("the updating related messages cannot move anything that is on the screen").

Update messages appeared for a split second at the top of the app and pushed every screen down, for example when checking for updates in Settings or on launch. Update messages must never move anything on screen.

## Goals

- The app-wide update message floats over the screen and never takes layout space.
- It only appears when there is something to know or do. It doesn't appear for checking, idle or up to date.
- In Settings, the update section keeps its size while the status changes.

## Non-goals

- Changing how updates are checked, downloaded or installed.
- Changing the texts.

## Behaviour

**App-wide message:**
- A card overlaid at the top of the screen, over the header. It shows for downloading (with progress), permission needed, ready to install, installing and errors.
- It has a ✕ to hide it until the update state changes.
- "Checking…" and "You are up to date" are never shown here, which removes the flash.

**Settings:**
- Order: Check for updates, version, then the status line.
- The status line always reserves two lines, so changing texts don't change its height.
- The Open Android settings and Install update buttons appear last, below the status line, so nothing below them moves.

## Implementation

- `components/UpdateControls.tsx`: banner phases, overlay style, dismiss, Settings order and fixed status height.
- `App.tsx`: render the banner after the navigator so it overlays it.
- The ✕ reuses the existing "Close" label.

## Storage

None.

## Acceptance checks

- The banner renders nothing for idle, checking and current, and is absolutely positioned when shown. ✕ hides it until the phase changes.
- The Settings status line has a fixed minimum height, and the version comes before it.
- Types, lint and tests pass.
- Phone check by the owner: Check for updates in Settings and app launch no longer move the screen.

## Validation

153 tests pass across 18 suites. TypeScript and lint pass with zero warnings.

New tests cover:
- The banner rendering nothing for idle, checking and up to date.
- The banner being absolutely positioned.
- ✕ hiding it until the state changes.
- The Settings status keeping a two-line minimum height and sitting below the version.

Not tested on a phone yet.
