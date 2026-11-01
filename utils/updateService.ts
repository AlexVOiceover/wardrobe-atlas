import { AppState, Platform } from "react-native";
import ReactNativeBlobUtil from "react-native-blob-util";
import { BUILD_NUMBER } from "./buildInfo";

const REPO = "AlexVOiceover/wardrobe-atlas";
const RELEASES_API = `https://api.github.com/repos/${REPO}/releases?per_page=20`;
const APK_NAME = "Wardrobe-Atlas.apk";
const CHECK_INTERVAL_MS = 60_000;
const APK_MIME = "application/vnd.android.package-archive";

type ReleaseAsset = {
  name?: unknown;
  browser_download_url?: unknown;
  size?: unknown;
  digest?: unknown;
};

type GitHubRelease = {
  tag_name?: unknown;
  draft?: unknown;
  prerelease?: unknown;
  assets?: unknown;
};

type AvailableUpdate = {
  buildNumber: number;
  url: string;
  size: number;
  sha256?: string;
};

let checkInProgress = false;
let lastCheckedAt = 0;

export function parseBuildNumber(tag: unknown): number | null {
  if (typeof tag !== "string") return null;
  const match = /^v0\.1\.([1-9]\d*)$/.exec(tag);
  if (!match) return null;
  const number = Number(match[1]);
  return Number.isSafeInteger(number) ? number : null;
}

export function findNewestUpdate(
  releases: unknown,
  installedBuild: number,
): AvailableUpdate | null {
  if (!Array.isArray(releases)) return null;

  let newest: AvailableUpdate | null = null;
  for (const item of releases as GitHubRelease[]) {
    if (!item || item.draft || item.prerelease) continue;
    const buildNumber = parseBuildNumber(item.tag_name);
    if (buildNumber === null || buildNumber <= installedBuild) continue;
    if (!Array.isArray(item.assets)) continue;

    const asset = (item.assets as ReleaseAsset[]).find(a => a?.name === APK_NAME);
    if (!asset || typeof asset.browser_download_url !== "string") continue;

    const expectedUrl = `https://github.com/${REPO}/releases/download/v0.1.${buildNumber}/${APK_NAME}`;
    if (asset.browser_download_url !== expectedUrl) continue;

    const size = Number(asset.size);
    if (!Number.isSafeInteger(size) || size < 1024 * 1024) continue;

    let sha256: string | undefined;
    if (typeof asset.digest === "string") {
      const digestMatch = /^sha256:([a-fA-F0-9]{64})$/.exec(asset.digest);
      if (digestMatch) sha256 = digestMatch[1].toLowerCase();
    }
    if (!newest || buildNumber > newest.buildNumber) {
      newest = { buildNumber, url: expectedUrl, size, sha256 };
    }
  }
  return newest;
}

async function fetchAvailableUpdate(): Promise<AvailableUpdate | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);
  try {
    const response = await fetch(RELEASES_API, {
      headers: { Accept: "application/vnd.github+json" },
      signal: controller.signal,
    });
    if (!response.ok) return null;
    return findNewestUpdate(await response.json(), BUILD_NUMBER);
  } finally {
    clearTimeout(timeout);
  }
}

async function downloadAndOfferInstall(update: AvailableUpdate): Promise<void> {
  const path = `${ReactNativeBlobUtil.fs.dirs.CacheDir}/wardrobe-atlas-v0.1.${update.buildNumber}.apk`;
  if (await ReactNativeBlobUtil.fs.exists(path)) {
    await ReactNativeBlobUtil.fs.unlink(path);
  }

  try {
    const response = await ReactNativeBlobUtil.config({ path })
      .fetch("GET", update.url);
    if (response.info().status !== 200) throw new Error("APK download failed");

    const stat = await ReactNativeBlobUtil.fs.stat(path);
    if (Number(stat.size) !== update.size) throw new Error("APK file size mismatch");

    if (update.sha256) {
      const hash = await ReactNativeBlobUtil.fs.hash(path, "sha256");
      if (hash.toLowerCase() !== update.sha256) {
        throw new Error("APK SHA-256 verification failed");
      }
    }

    // Stock Android will display the system package installer for user approval.
    // Sideloaded apps cannot install their own APK updates silently.
    await ReactNativeBlobUtil.android.actionViewIntent(path, APK_MIME);
  } catch (error) {
    // Never attempt to install a truncated or unverified download.
    if (await ReactNativeBlobUtil.fs.exists(path)) {
      await ReactNativeBlobUtil.fs.unlink(path).catch(() => undefined);
    }
    throw error;
  }
}

async function checkForUpdates(): Promise<void> {
  if (Platform.OS !== "android" || checkInProgress) return;
  const now = Date.now();
  if (now - lastCheckedAt < CHECK_INTERVAL_MS) return;
  lastCheckedAt = now;
  checkInProgress = true;
  try {
    const update = await fetchAvailableUpdate();
    if (update) await downloadAndOfferInstall(update);
  } catch (error) {
    // Network/installer failures must never prevent offline app use.
    console.warn("Wardrobe Atlas update check failed:", error);
  } finally {
    checkInProgress = false;
  }
}

/** Run on initial launch and after returning to the foreground. */
export function startAutomaticUpdates(): () => void {
  if (Platform.OS !== "android") return () => undefined;

  const timer = setTimeout(() => {
    void checkForUpdates();
  }, 1500);

  const subscription = AppState.addEventListener("change", state => {
    if (state === "active") void checkForUpdates();
  });

  return () => {
    clearTimeout(timer);
    subscription.remove();
  };
}
