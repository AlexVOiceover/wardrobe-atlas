import { findNewestUpdate, parseBuildNumber } from "../utils/updateService";

jest.mock("react-native-blob-util", () => ({
  __esModule: true,
  default: { fs: { dirs: { CacheDir: "/cache" } } },
}));

const asset = (version: number, overrides = {}) => ({
  name: "Wardrobe-Atlas.apk",
  size: 80_000_000,
  browser_download_url:
    `https://github.com/AlexVOiceover/wardrobe-atlas/releases/download/v0.1.${version}/Wardrobe-Atlas.apk`,
  ...overrides,
});

const release = (version: number, options = {}) => ({
  tag_name: `v0.1.${version}`,
  draft: false,
  prerelease: false,
  assets: [asset(version)],
  ...options,
});

describe("GitHub APK release selection", () => {
  test("only accepts the exact version tag format", () => {
    expect(parseBuildNumber("v0.1.31")).toBe(31);
    expect(parseBuildNumber("v0.1.0")).toBeNull();
    expect(parseBuildNumber("v0.2.31")).toBeNull();
    expect(parseBuildNumber("v0.1.31-beta")).toBeNull();
    expect(parseBuildNumber("v0.1.99999999999999999999")).toBeNull();
  });

  test("chooses the greatest available build regardless of release ordering", () => {
    const result = findNewestUpdate([release(7), release(11), release(9)], 8);
    expect(result?.buildNumber).toBe(11);
  });

  test("ignores installed, draft, prerelease and malformed entries", () => {
    const result = findNewestUpdate([
      release(7),
      release(10, { draft: true }),
      release(11, { prerelease: true }),
      release(12, { assets: [] }),
    ], 7);
    expect(result).toBeNull();
  });

  test("rejects asset URLs outside the exact release URL", () => {
    const result = findNewestUpdate([
      release(20, { assets: [asset(20, {
        browser_download_url: "https://example.com/malware.apk",
      })] }),
    ], 1);
    expect(result).toBeNull();
  });

  test("validates archive size and understands GitHub SHA-256 digest", () => {
    const digest = "ab".repeat(32);
    const result = findNewestUpdate([
      release(20, { assets: [asset(20, { size: 80, digest: `sha256:${digest}` })] }),
      release(21, { assets: [asset(21, { digest: `sha256:${digest}` })] }),
    ], 1);
    expect(result?.buildNumber).toBe(21);
    expect(result?.sha256).toBe(digest);
  });

  test("returns null for bad API payloads", () => {
    expect(findNewestUpdate(null, 1)).toBeNull();
    expect(findNewestUpdate({}, 1)).toBeNull();
  });
});
