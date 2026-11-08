# Google Drive backup

Status: **replaced on 2026-11-08** by the simpler approach in "Replaced by Export/Import" at the end. The in-app Drive connection was removed. The sections below record what was built and why it was dropped.

## Goals

- Back up the whole wardrobe to the owner's Google Drive with one tap.
- Restore from a list of Drive backups inside the app, e.g. on a new phone.
- Keep the existing manual Export/Import (file picker) working as before.

## Non-goals

- Dropbox (possible later with the same backup logic).
- Syncing between two phones at the same time (backups are snapshots, not live sync).
- Automatic backups of any kind (owner: "not automatically, backup only manually").

## UX

Settings › Backup gains a **Google Drive** section:

- **Not connected:** "Back up to Google Drive" button → Google's account chooser and consent ("See, edit, create and delete only the specific Google Drive files you use with this app").
- **Connected:** account email, "Last backup: today 14:05" (or "Never"), **Back up now**, **Restore from Drive**, **Disconnect**.
- **Back up now:** shows progress, then "Backed up to Google Drive" or the error with Retry. On mobile data it asks first: "You're not on Wi-Fi. This backup is about 24 MB. Back up anyway?" *(Claude: how "Wi-Fi only" applies when backups are manual)*.
- **Restore from Drive:** a list of backups (date, time, size), newest first. Choosing one asks first, like Import ("Replace everything with this backup?"), with "Back up current first".
- Backups live in a visible **Wardrobe Atlas backups** folder in Drive. After each successful upload only the newest **3** are kept; older ones the app made are deleted.

## Implementation

- Library: `@react-native-google-signin/google-signin` (free edition) for sign-in and access tokens; Drive REST v3 through `fetch` (multipart upload, list, download, delete). No Google server code.
- Scope: `https://www.googleapis.com/auth/drive.file` (only files and folders the app created; no Google verification needed).
- Backup content: the same JSON as Export (`createWardrobeBackup`), so a Drive backup can also be imported by hand and vice versa. File name `wardrobe-atlas-YYYY-MM-DD-HHmm.json`.
- Large backups (photos are inside): resumable upload; Wi-Fi check via `@react-native-community/netinfo`.
- New optional setting `driveLastBackupAt` (backward compatible; kept through load; a restored backup doesn't overwrite it). Sign-in itself is kept by Google Play services; no tokens stored by the app.
- Code:
  - `utils/driveBackup.ts`: find/create the folder, resumable upload, list, download, prune to 3; `DriveError` with the HTTP status.
  - `utils/googleAccount.ts`: configure (scope `drive.file`, Web client optional), connected account (silent), connect, disconnect (revoke + sign out), `withDriveToken` (renews an expired token once).
  - `components/DriveBackup.tsx`: the Settings section; restore list in a centred panel; confirmations reuse `ConfirmationDialog`.
  - `utils/importStoreFromJson.ts` gains `applyBackup` (shared by Import and Drive restore); `utils/exportStoreToJson.ts` gains `backupText` (shared by Export and Drive backup).
- Libraries (exact versions): `@react-native-google-signin/google-signin` 16.1.5, `@react-native-community/netinfo` 12.0.1.

## Owner setup (one time, ~10 minutes, needs your Google account)

1. https://console.cloud.google.com → create project "Wardrobe Atlas".
2. APIs & Services › Library → enable **Google Drive API**.
3. OAuth consent screen → External, app name "Wardrobe Atlas", your email; add scope `drive.file`; add yourself as a test user, then **Publish app** (non-sensitive scopes need no review).
4. Credentials › Create credentials › OAuth client ID › **Android**: package `com.wardrobeatlas.app`, SHA-1 `5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25`.
5. *Optional:* a **Web application** client is only needed for ID tokens or server access, which the app doesn't use. If Google asks for it later, put its client ID in `GOOGLE_WEB_CLIENT_ID` in `utils/googleAccount.ts`; it is not a secret.

## Storage and migration

- Settings gain an optional `driveLastBackupAt`; older stores load without it ("Never"). Backup file format unchanged.

## Edge cases

- No network: "Couldn't reach Google Drive · Retry". Mobile data: asks first (see UX).
- Signed out or access revoked in the Google account: show "Reconnect Google Drive".
- Restore of a backup made by an older app version: goes through the same reader as Import.
- Very large backups: upload keeps going only while the app is alive; an interrupted upload leaves no partial file (resumable session discarded).

## Risks

- The app is signed with the key committed to the repository (`android/app/debug.keystore`). Google ties the OAuth client to that key's fingerprint, so anyone with the repo could build an app that uses the same OAuth client; they would still need your consent to see your files. Changing to a private key would make installed apps refuse the update (uninstall needed), so this plan keeps the current key.
- Sign-in only works on phones with Google Play services.

## Decisions (owner, 2026-11-08)

- **D1** A visible "Wardrobe Atlas backups" folder.
- **D2** No automatic backups; manual "Back up now" only.
- **D3** Keep the newest 3 backups.
- **D4** Wi-Fi only: on mobile data, Back up now asks first *(Claude's reading for manual backups)*.

## Acceptance checks

- Connect asks for the Google account and the limited Drive permission; Disconnect signs out.
- Back up now creates `wardrobe-atlas-YYYY-MM-DD-HHmm.json` in "Wardrobe Atlas backups"; a fourth backup deletes the oldest.
- On mobile data, Back up now asks first.
- Restore from Drive lists backups newest first and asks before replacing everything; the result matches Import of the same file.
- A Drive backup can be imported with the manual Import, and the manual Export still works.
- Errors (offline, access revoked) show a message with Retry or Reconnect; nothing is lost.

## Implemented (2026-11-08)

- As planned, with these details:
  - The Web client ID turned out to be optional (only access tokens are used), so setup step 5 is optional.
  - The two buttons are stacked so Spanish labels fit; Disconnect is a small text button under them.
  - Restoring a file that isn't a backup changes nothing and says "Couldn't restore that backup".
  - Losing the Google sign-in (removed account or revoked access) shows "Google Drive needs connecting again" and the Connect button.
  - Off Wi-Fi (mobile data or unknown), Back up now asks with the backup's size.

## Validation

- `npx tsc --noEmit`, `npm run lint`, `npm test` pass (297 tests; 13 new in `__tests__/driveBackup.test.tsx`: Drive calls with a fake Drive, token renewal, and the Settings section).
- Settings tests stub the Drive section, which loads native Google code.
- Not checked on a phone; connecting needs the Google Cloud setup. The Android build in CI is the first check of the native libraries.

## Follow-up (2026-11-08)

- On the owner's phone, Connect opened the account chooser and then failed with the general "Couldn't connect to Google" message. The released APK was checked: package `com.wardrobeatlas.app`, SHA-1 `5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25`, matching the setup instructions.
- The message now ends with Google's code and text (e.g. "(10: DEVELOPER_ERROR)") so the cause in the Google Cloud setup can be identified.

## Replaced by Export/Import (2026-11-08)

On the phone, Connect failed with Google's error 10 (DEVELOPER_ERROR). An in-app Drive connection needs a Google Cloud project with an Android OAuth client and a consent screen. While that screen is in Testing, only listed test users can connect, and they must reconnect about every 7 days. The owner found this too complex and chose the simpler way, asking for the obsolete code to be cleaned up.

- Removed the Settings Google Drive section, `components/DriveBackup.tsx`, `utils/driveBackup.ts`, `utils/googleAccount.ts`, their tests and strings, the `driveLastBackupAt` setting, and the `@react-native-google-signin/google-signin` and `@react-native-community/netinfo` dependencies. Export and Import are back to their code from before PR #44.
- Export already opens Android's "save as" picker, and Import its "open" picker. Both list Google Drive when the Drive app is installed, so no Google Cloud setup is needed. A caption under Export and Import now says so.
- Exported files are named `wardrobe-atlas-YYYY-MM-DD-HHmm.json` instead of `store.json`, so copies in Drive are easy to tell apart.
- Saved data: a stored `driveLastBackupAt` is dropped on the next load, because settings normalisation keeps only known keys. Nothing else changes.
- Not kept: the in-app list of Drive backups, keeping the newest 3, and the mobile-data check. Old copies are managed in the Drive app.
- The Google Cloud project, if created, is no longer used and can be deleted.

Validation: `npx tsc --noEmit`, `npm run lint` and `npm test` (29 suites, 287 tests) pass. Not yet checked on a phone: choosing Drive in the save and open pickers.
