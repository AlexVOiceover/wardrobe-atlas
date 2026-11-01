# Feature: Android releases and in-app updates

Status: In progress — owner explicitly authorized implementation on 2026-11-01.

## Goal and motivation
After every push to `main`, GitHub Actions must build and publish an installable Wardrobe Atlas APK as a GitHub Release. On opening/resuming the Android app, check the newest published release and, if newer, download the APK and hand it to Android's system installer.

## Scope and UX
- Build an installable **release-mode** Android APK in GitHub Actions without a local development machine.
- Automatically publish the APK to a new GitHub Release after successful `main` builds; support manual workflow runs.
- When Wardrobe Atlas becomes active, check GitHub Releases; silently do nothing when offline or current.
- If a newer release exists, download it to app cache and open the Android package installer automatically.
- The user may need to grant "Install unknown apps" to Wardrobe Atlas once and approve each installation. **Silent unattended APK installation is prohibited by stock Android for a regular sideloaded app; do not misrepresent this limitation.**
- Make the app visibly named "Wardrobe Atlas", with its own Android application ID; do not change the upstream repository.

## Non-goals
- Updating the original Closet-Archive installation or migrating its private data (install the fork separately; original can be uninstalled).
- Google Play / Play in-app updates, silent root/device-owner installs, iOS, redesign.
- Shipping a production signing key without secure secret management.

## Technical approach
- `.github/workflows/android-release.yml`: `main` push builds and creates a GitHub Release containing `Wardrobe-Atlas.apk`; pull requests build for validation, but cannot publish releases. Use Java 17, Node 22 and Android SDK/NDK required by project.
- Each workflow run has a unique monotonically increasing `github.run_number` versionCode and matching release tag `v0.1.<run_number>`; embed build number into the React Native JS bundle. Publish **only after** successful build.
- Initial internal builds reuse the repository's existing checked-in Android debug keystore, which stays the same between CI runs so APK updates can replace each other. **This is not secure enough for distributing production updates.** Before wider use, replace with a private, persistent release keystore provided through encrypted GitHub Actions secrets; changing signing keys after installs ordinarily requires reinstalling.
- `utils/updateService.ts` checks GitHub's latest non-prerelease release API, parses the expected version tag, verifies a download URL under this repository's HTTPS GitHub Releases path, and compares it with embedded build number.
- Download using the project's already-installed `react-native-blob-util` and request installation using its Android file-opening API. Add Android Internet / package-install permissions.
- Avoid repeated in-flight requests and excessive checks after returning from the installer.

## Data and backwards compatibility
- No changes to Redux storage or user data.
- Different application ID `com.wardrobeatlas.app`, so the fork is installed independently. Later APKs use the same ID and signing certificate.
- Builds for the internal test phase are signed with a stable **development** key already in the project. Treat them as testing builds, not secure distribution.

## Failure modes and risks
- No internet, GitHub downtime/rate limit, missing APK, invalid release metadata: app remains usable.
- Incomplete APK download or installer cancellation: app remains usable; retries on a later launch.
- GitHub Releases must be public for unauthenticated app downloads. Private repositories need a different authenticated distribution strategy; **never put a GitHub token in the app**.
- Android permission to install unknown APKs and confirmation are controlled by the OS.
- Out-of-order workflow releases: no silent downgrade, only install versions newer than current.
- Existing lockfile and React Native native dependencies may need CI fixes discovered by the first build; do not claim tests pass without logs.

## Acceptance criteria
1. Push to `main` triggers build and, if successful, publishes `Wardrobe-Atlas.apk` as the latest GitHub Release.
2. `pull_request` builds validate changes without publishing a release.
3. Fresh APK installs as Wardrobe Atlas. After installing version N, opening it with release N+1 available fetches newer APK and opens Android installer.
4. No available update: no prompts. Missing Internet or failed check: startup unaffected.
5. No code is merged to `main` or live release published before explicit owner's review/merge approval.

## Test plan
- Test release tag parsing, build comparison, download URL safety and bad responses.
- Run available local static checks; obtain CI build logs and manual APK test after merge (CI cannot publish an actual `main` release before authorization).
- Manual: approve PR/merge only on request; download first published APK from Releases; install; push another commit to `main` with authorization; reopen app; confirm download and Android installer prompt; verify data remains.

## Decisions / limitations
- User requested automatic installation. Android installation approval cannot be bypassed; app automates check and download then asks the operating system to install.
- Upstream app appearance remains untouched in this feature.
- Build/deploy automation is configured by this feature, but first GitHub `main` release awaits explicit permission to merge.
