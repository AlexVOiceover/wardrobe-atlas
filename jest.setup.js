/* eslint-env jest */
// Native file access isn't available under Jest. Photo files live under
// /docs/photos here; tests that need file behaviour mock this themselves.
jest.mock("react-native-blob-util", () => ({
  fs: {
    dirs: { DocumentDir: "/docs", CacheDir: "/cache" },
    isDir: jest.fn(() => Promise.resolve(true)),
    mkdir: jest.fn(() => Promise.resolve()),
    exists: jest.fn(() => Promise.resolve(true)),
    writeFile: jest.fn(() => Promise.resolve()),
    readFile: jest.fn(() => Promise.resolve("")),
    cp: jest.fn(() => Promise.resolve()),
    ls: jest.fn(() => Promise.resolve([])),
    unlink: jest.fn(() => Promise.resolve()),
  },
}));
