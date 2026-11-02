import { AppState, NativeModules, Platform } from "react-native";
import ReactNativeBlobUtil from "react-native-blob-util";
import { BUILD_NUMBER } from "./buildInfo";

const REPO = "AlexVOiceover/wardrobe-atlas";
const RELEASES_API = `https://api.github.com/repos/${REPO}/releases?per_page=20`;
const APK_NAME = "Wardrobe-Atlas.apk";
const CHECK_INTERVAL_MS = 60_000;
const ACTIVE_POLL_MS = 5 * 60_000;

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
type Installer = {
  buildNumber: number;
  versionName: string;
  canInstallPackages(): Promise<boolean>;
  openInstallSettings(): Promise<boolean>;
  installApk(path: string): Promise<boolean>;
};
export type UpdatePhase =
  | "idle"
  | "checking"
  | "downloading"
  | "permission"
  | "ready"
  | "installing"
  | "current"
  | "error";
export type UpdateError =
  | "network"
  | "rate-limit"
  | "verification"
  | "installation"
  | "unavailable"
  | "unsupported";
export type UpdateState = {
  phase: UpdatePhase;
  availableVersion?: string;
  progress?: number;
  error?: UpdateError;
};
const nativeInstaller = (): Installer | undefined =>
  NativeModules.WardrobeUpdates;
export function getInstalledVersion() {
  const native = nativeInstaller();
  const buildNumber = Number(native?.buildNumber ?? BUILD_NUMBER);
  return {
    buildNumber,
    versionName:
      native?.versionName ||
      (buildNumber > 0 ? `0.1.${buildNumber}` : "Development"),
  };
}
let snapshot: UpdateState = { phase: "idle" };
const listeners = new Set<() => void>();
let inFlight: Promise<UpdateState> | undefined;
let lastCheckedAt: number | undefined;
let pending: { update: AvailableUpdate; path: string } | undefined;
let lastOfferedBuild = 0;
export const getUpdateState = () => snapshot;
export const subscribeToUpdates = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
function setState(phase: UpdatePhase, values: Omit<UpdateState, "phase"> = {}) {
  snapshot = {
    phase,
    availableVersion: pending ? `0.1.${pending.update.buildNumber}` : undefined,
    ...values,
  };
  listeners.forEach(listener => listener());
}
class UpdateFailure extends Error {
  constructor(readonly reason: UpdateError) {
    super(reason);
  }
}
function run(task: () => Promise<void>): Promise<UpdateState> {
  if (inFlight) return inFlight;
  inFlight = (async () => {
    try {
      await task();
    } catch (error) {
      const code = (error as { code?: string })?.code;
      const reason =
        error instanceof UpdateFailure
          ? error.reason
          : code === "INSTALL_PERMISSION"
          ? undefined
          : "installation";
      if (reason) {
        console.warn("Update attempt failed", error);
        setState("error", { error: reason });
      } else setState("permission");
    }
    return snapshot;
  })().finally(() => {
    inFlight = undefined;
  });
  return inFlight;
}
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

    const asset = (item.assets as ReleaseAsset[]).find(
      a => a?.name === APK_NAME,
    );
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
  const timer = setTimeout(() => controller.abort(), 12_000);
  try {
    const response = await fetch(RELEASES_API, {
      headers: {
        Accept: "application/vnd.github+json",
        "Cache-Control": "no-cache",
      },
      signal: controller.signal,
    });
    if (!response.ok)
      throw new UpdateFailure(
        response.status === 403 || response.status === 429
          ? "rate-limit"
          : "network",
      );
    const releases: unknown = await response.json();
    if (!Array.isArray(releases)) throw new UpdateFailure("network");
    const installed = getInstalledVersion().buildNumber;
    const update = findNewestUpdate(releases, installed);
    if (
      !update &&
      releases.some(
        (release: GitHubRelease) =>
          !release?.draft &&
          !release?.prerelease &&
          (parseBuildNumber(release?.tag_name) ?? 0) > installed,
      )
    )
      throw new UpdateFailure("unavailable");
    return update;
  } catch (error) {
    if (error instanceof UpdateFailure) throw error;
    throw new UpdateFailure("network");
  } finally {
    clearTimeout(timer);
  }
}

async function verifyFile(
  path: string,
  update: AvailableUpdate,
): Promise<void> {
  try {
    const stat = await ReactNativeBlobUtil.fs.stat(path);
    if (Number(stat.size) !== update.size) throw new Error("size");
    if (
      update.sha256 &&
      (await ReactNativeBlobUtil.fs.hash(path, "sha256")).toLowerCase() !==
        update.sha256
    )
      throw new Error("digest");
  } catch {
    throw new UpdateFailure("verification");
  }
}
async function removeFile(path: string) {
  await ReactNativeBlobUtil.fs.unlink(path).catch(() => undefined);
}
async function cleanCachedApks(keep?: string) {
  try {
    const dir = ReactNativeBlobUtil.fs.dirs.CacheDir;
    const names = await ReactNativeBlobUtil.fs.ls(dir);
    await Promise.all(
      names
        .filter(
          name =>
            /^wardrobe-atlas-v0\.1\.[1-9]\d*\.apk$/.test(name) &&
            `${dir}/${name}` !== keep,
        )
        .map(name => removeFile(`${dir}/${name}`)),
    );
  } catch {
    /* Cache maintenance must not prevent updating. */
  }
}
async function getVerifiedApk(update: AvailableUpdate): Promise<string> {
  const path = `${ReactNativeBlobUtil.fs.dirs.CacheDir}/wardrobe-atlas-v0.1.${update.buildNumber}.apk`;
  await cleanCachedApks(path);
  if (await ReactNativeBlobUtil.fs.exists(path)) {
    try {
      await verifyFile(path, update);
      return path;
    } catch {
      await removeFile(path);
    }
  }
  setState("downloading", {
    availableVersion: `0.1.${update.buildNumber}`,
    progress: 0,
  });
  let acceptingProgress = true;
  try {
    const task = ReactNativeBlobUtil.config({ path, timeout: 120_000 }).fetch(
      "GET",
      update.url,
    );
    task.progress({ interval: 500 }, (received, total) => {
      if (!acceptingProgress) return;
      const progress =
        Number(total) > 0
          ? Math.min(100, Math.round((Number(received) / Number(total)) * 100))
          : undefined;
      setState("downloading", {
        availableVersion: `0.1.${update.buildNumber}`,
        progress,
      });
    });
    const response = await task;
    acceptingProgress = false;
    if (response.info().status !== 200) throw new UpdateFailure("network");
    await verifyFile(path, update);
    return path;
  } catch (error) {
    await removeFile(path);
    if (error instanceof UpdateFailure) throw error;
    throw new UpdateFailure("network");
  } finally {
    acceptingProgress = false;
  }
}

async function offerPending(force: boolean): Promise<void> {
  if (!pending) return;
  if (AppState.currentState !== "active") {
    setState("ready");
    return;
  }
  if (!force && lastOfferedBuild === pending.update.buildNumber) {
    setState("ready");
    return;
  }
  const installer = nativeInstaller();
  if (!installer) throw new UpdateFailure("unsupported");
  if (!(await installer.canInstallPackages())) {
    setState("permission");
    return;
  }
  await verifyFile(pending.path, pending.update);
  setState("installing");
  await installer.installApk(pending.path);
  lastOfferedBuild = pending.update.buildNumber;
}

export function checkForUpdates({
  manual = false,
}: { manual?: boolean } = {}): Promise<UpdateState> {
  if (inFlight) return inFlight;
  if (Platform.OS !== "android") {
    setState("error", { error: "unsupported" });
    return Promise.resolve(snapshot);
  }
  if (
    !manual &&
    pending &&
    (snapshot.phase === "permission" ||
      (snapshot.phase === "ready" &&
        lastOfferedBuild !== pending.update.buildNumber))
  )
    return resumePendingUpdate(false);
  if (
    !manual &&
    lastCheckedAt !== undefined &&
    Date.now() - lastCheckedAt < CHECK_INTERVAL_MS
  )
    return Promise.resolve(snapshot);
  return run(async () => {
    lastCheckedAt = Date.now();
    setState("checking");
    const update = await fetchAvailableUpdate();
    if (!update) {
      pending = undefined;
      await cleanCachedApks();
      setState("current");
      return;
    }
    const path = await getVerifiedApk(update);
    pending = { update, path };
    await offerPending(manual);
  });
}
export function resumePendingUpdate(force = true): Promise<UpdateState> {
  return run(() => offerPending(force));
}
export async function allowUpdateInstallation(): Promise<void> {
  try {
    const installer = nativeInstaller();
    if (!installer) throw new UpdateFailure("unsupported");
    await installer.openInstallSettings();
  } catch {
    setState("error", { error: "installation" });
  }
}

/** Automatic checks stay in the foreground and never silently install an APK. */
export function startAutomaticUpdates(): () => void {
  if (Platform.OS !== "android" || Number(BUILD_NUMBER) <= 0)
    return () => undefined;
  const check = () => {
    if (AppState.currentState === "active") void checkForUpdates();
  };
  const timer = setTimeout(check, 1500);
  const polling = setInterval(check, ACTIVE_POLL_MS);
  const subscription = AppState.addEventListener("change", state => {
    if (state !== "active") return;
    if (snapshot.phase === "installing") {
      setState("ready");
      return;
    }
    check();
  });
  return () => {
    clearTimeout(timer);
    clearInterval(polling);
    subscription.remove();
  };
}
