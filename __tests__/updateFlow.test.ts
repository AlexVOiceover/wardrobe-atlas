const mockInstaller = {
  buildNumber: 19,
  versionName: "0.1.19",
  canInstallPackages: jest.fn(),
  openInstallSettings: jest.fn(),
  installApk: jest.fn(),
};
const mockAppState = { currentState: "active", addEventListener: jest.fn() };
let mockCached = false;
const mockFs = {
  dirs: { CacheDir: "/cache" },
  exists: jest.fn(),
  stat: jest.fn(),
  hash: jest.fn(),
  unlink: jest.fn(),
  ls: jest.fn(),
};
const mockDownload = jest.fn();
const mockConfig = jest.fn(() => ({ fetch: mockDownload }));
const mockFetch = jest.fn();
const mockRemove = jest.fn();

jest.mock("react-native", () => ({
  AppState: mockAppState,
  NativeModules: { WardrobeUpdates: mockInstaller },
  Platform: { OS: "android" },
}));
jest.mock("react-native-blob-util", () => ({
  __esModule: true,
  default: { fs: mockFs, config: mockConfig },
}));
jest.mock("../utils/buildInfo", () => ({ BUILD_NUMBER: 19 }));

const digest = "a".repeat(64);
const release = (build: number, assets = true) => ({
  tag_name: `v0.1.${build}`,
  assets: assets
    ? [
        {
          name: "Wardrobe-Atlas.apk",
          size: 8_000_000,
          digest: `sha256:${digest}`,
          browser_download_url: `https://github.com/AlexVOiceover/wardrobe-atlas/releases/download/v0.1.${build}/Wardrobe-Atlas.apk`,
        },
      ]
    : [],
});
const response = (data: unknown, status = 200) => ({
  ok: status === 200,
  status,
  json: async () => data,
});
let service: typeof import("../utils/updateService");
beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
  jest.useFakeTimers();
  jest.spyOn(console, "warn").mockImplementation(() => undefined);
  mockCached = false;
  mockInstaller.buildNumber = 19;
  mockInstaller.versionName = "0.1.19";
  mockInstaller.canInstallPackages.mockResolvedValue(true);
  mockInstaller.openInstallSettings.mockResolvedValue(true);
  mockInstaller.installApk.mockResolvedValue(true);
  mockAppState.currentState = "active";
  mockAppState.addEventListener.mockReturnValue({ remove: mockRemove });
  mockFs.exists.mockImplementation(async () => mockCached);
  mockFs.stat.mockResolvedValue({ size: 8_000_000 });
  mockFs.hash.mockResolvedValue(digest);
  mockFs.ls.mockImplementation(async () =>
    mockCached ? ["wardrobe-atlas-v0.1.21.apk"] : [],
  );
  mockFs.unlink.mockImplementation(async () => {
    mockCached = false;
  });
  mockDownload.mockImplementation(() => {
    mockCached = true;
    return Object.assign(Promise.resolve({ info: () => ({ status: 200 }) }), {
      progress: jest.fn((_config, callback) => {
        callback(2_000_000, 8_000_000);
      }),
    });
  });
  mockFetch.mockReset().mockResolvedValue(response([release(19)]));
  globalThis.fetch = mockFetch;
  service = require("../utils/updateService");
});
afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
  jest.restoreAllMocks();
});

test("manual checking bypasses the automatic cooldown and reports download progress", async () => {
  await service.checkForUpdates();
  await service.checkForUpdates();
  expect(mockFetch).toHaveBeenCalledTimes(1);
  const progress: number[] = [];
  const unsubscribe = service.subscribeToUpdates(() => {
    const state = service.getUpdateState();
    if (state.progress !== undefined) progress.push(state.progress);
  });
  mockFetch.mockResolvedValue(response([release(21)]));
  expect((await service.checkForUpdates({ manual: true })).phase).toBe(
    "installing",
  );
  expect(mockFetch).toHaveBeenCalledTimes(2);
  expect(progress).toContain(25);
  expect(mockInstaller.installApk).toHaveBeenCalledWith(
    "/cache/wardrobe-atlas-v0.1.21.apk",
  );
  unsubscribe();
});

test("concurrent manual and automatic checks share one download and installer", async () => {
  let finish!: (value: unknown) => void;
  mockFetch.mockImplementation(
    () =>
      new Promise(resolve => {
        finish = resolve;
      }),
  );
  const first = service.checkForUpdates();
  const second = service.checkForUpdates({ manual: true });
  expect(first).toBe(second);
  finish(response([release(21)]));
  await Promise.all([first, second]);
  expect(mockFetch).toHaveBeenCalledTimes(1);
  expect(mockDownload).toHaveBeenCalledTimes(1);
  expect(mockInstaller.installApk).toHaveBeenCalledTimes(1);
});

test("uses actual installed package metadata instead of the embedded fallback", async () => {
  mockInstaller.buildNumber = 99;
  mockInstaller.versionName = "0.1.99";
  mockFetch.mockResolvedValue(response([release(21)]));
  expect(service.getInstalledVersion()).toEqual({
    buildNumber: 99,
    versionName: "0.1.99",
  });
  expect((await service.checkForUpdates({ manual: true })).phase).toBe(
    "current",
  );
  expect(mockDownload).not.toHaveBeenCalled();
});

test("permission return resumes a verified cached APK and cancellation does not reopen it", async () => {
  mockInstaller.canInstallPackages.mockResolvedValue(false);
  mockFetch.mockResolvedValue(response([release(21)]));
  const stop = service.startAutomaticUpdates();
  await jest.advanceTimersByTimeAsync(1500);
  expect(service.getUpdateState().phase).toBe("permission");
  expect(mockInstaller.installApk).not.toHaveBeenCalled();
  await service.allowUpdateInstallation();
  expect(mockInstaller.openInstallSettings).toHaveBeenCalledTimes(1);
  mockInstaller.canInstallPackages.mockResolvedValue(true);
  const foreground = mockAppState.addEventListener.mock.calls[0][1];
  foreground("active");
  await jest.advanceTimersByTimeAsync(0);
  expect(service.getUpdateState().phase).toBe("installing");
  expect(mockDownload).toHaveBeenCalledTimes(1);
  expect(mockInstaller.installApk).toHaveBeenCalledTimes(1);
  foreground("active");
  expect(service.getUpdateState().phase).toBe("ready");
  await jest.advanceTimersByTimeAsync(5 * 60_000);
  expect(mockInstaller.installApk).toHaveBeenCalledTimes(1);
  await service.resumePendingUpdate();
  expect(mockInstaller.installApk).toHaveBeenCalledTimes(2);
  expect(mockDownload).toHaveBeenCalledTimes(1);
  stop();
  expect(mockRemove).toHaveBeenCalledTimes(1);
});

test("foreground polling notices releases published while the app remains open", async () => {
  const stop = service.startAutomaticUpdates();
  await jest.advanceTimersByTimeAsync(1500);
  expect(service.getUpdateState().phase).toBe("current");
  mockFetch.mockResolvedValue(response([release(21)]));
  await jest.advanceTimersByTimeAsync(5 * 60_000);
  expect(mockInstaller.installApk).toHaveBeenCalledTimes(1);
  stop();
});

test("background polling does not perform network requests", async () => {
  mockAppState.currentState = "background";
  const stop = service.startAutomaticUpdates();
  await jest.advanceTimersByTimeAsync(6 * 60_000);
  expect(mockFetch).not.toHaveBeenCalled();
  stop();
});

test("HTTP rate limits remain visible and a manual retry is not locked out", async () => {
  mockFetch.mockResolvedValue(response({}, 403));
  expect(await service.checkForUpdates({ manual: true })).toMatchObject({
    phase: "error",
    error: "rate-limit",
  });
  mockFetch.mockResolvedValue(response([release(19)]));
  expect((await service.checkForUpdates({ manual: true })).phase).toBe(
    "current",
  );
});

test.each(["network", "malformed", "publishing"])(
  "%s failures are not reported as up to date",
  async kind => {
    if (kind === "network") mockFetch.mockRejectedValue(new Error("offline"));
    if (kind === "malformed") mockFetch.mockResolvedValue(response({}));
    if (kind === "publishing")
      mockFetch.mockResolvedValue(response([release(21, false)]));
    expect(await service.checkForUpdates({ manual: true })).toMatchObject({
      phase: "error",
      error: kind === "publishing" ? "unavailable" : "network",
    });
    expect(mockInstaller.installApk).not.toHaveBeenCalled();
  },
);

test.each(["size", "digest"])(
  "a bad %s download is deleted and never installed",
  async kind => {
    mockFetch.mockResolvedValue(response([release(21)]));
    if (kind === "size") mockFs.stat.mockResolvedValue({ size: 10 });
    else mockFs.hash.mockResolvedValue("b".repeat(64));
    expect(await service.checkForUpdates({ manual: true })).toMatchObject({
      phase: "error",
      error: "verification",
    });
    expect(mockInstaller.installApk).not.toHaveBeenCalled();
    expect(mockFs.unlink).toHaveBeenCalledWith(
      "/cache/wardrobe-atlas-v0.1.21.apk",
    );
  },
);

test("installer failures stay retryable without another download", async () => {
  mockFetch.mockResolvedValue(response([release(21)]));
  mockInstaller.installApk.mockRejectedValueOnce(
    new Error("installer unavailable"),
  );
  expect(await service.checkForUpdates({ manual: true })).toMatchObject({
    phase: "error",
    error: "installation",
  });
  await service.checkForUpdates({ manual: true });
  expect(mockInstaller.installApk).toHaveBeenCalledTimes(2);
  expect(mockDownload).toHaveBeenCalledTimes(1);
});

test("cache cleanup only deletes this updater's APK files", async () => {
  mockFs.ls.mockResolvedValue([
    "photo.jpg",
    "notes.apk",
    "wardrobe-atlas-v0.1.9.apk",
    "wardrobe-atlas-v0.1.bad.apk",
  ]);
  await service.checkForUpdates({ manual: true });
  expect(mockFs.unlink.mock.calls).toEqual([
    ["/cache/wardrobe-atlas-v0.1.9.apk"],
  ]);
});

test("late download progress cannot overwrite installation status", async () => {
  let progress!: (received: number, total: number) => void;
  mockFetch.mockResolvedValue(response([release(21)]));
  mockDownload.mockImplementation(() => {
    mockCached = true;
    return Object.assign(Promise.resolve({ info: () => ({ status: 200 }) }), {
      progress: jest.fn((_config, callback) => {
        progress = callback;
      }),
    });
  });
  await service.checkForUpdates({ manual: true });
  expect(service.getUpdateState().phase).toBe("installing");
  progress(8_000_000, 8_000_000);
  expect(service.getUpdateState().phase).toBe("installing");
});
