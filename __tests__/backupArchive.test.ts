import { NativeModules } from "react-native";

jest.mock("nanoid", () => ({ nanoid: () => "id" }));
jest.mock("react-native-get-random-values", () => ({}));

// An in-memory phone: file paths and their contents.
const mockFiles: Record<string, string> = {};
const under = (dir: string) =>
  Object.keys(mockFiles).filter(path => path.startsWith(`${dir}/`));
jest.mock("react-native-blob-util", () => ({
  fs: {
    dirs: { DocumentDir: "/docs", CacheDir: "/cache" },
    exists: async (path: string) =>
      path in mockFiles ||
      Object.keys(mockFiles).some(file => file.startsWith(`${path}/`)),
    isDir: async () => true,
    mkdir: async () => undefined,
    writeFile: async (path: string, data: string) => {
      mockFiles[path] = data;
    },
    readFile: async (path: string) => mockFiles[path],
    cp: async (from: string, to: string) => {
      mockFiles[to] = mockFiles[from];
    },
    ls: async (dir: string) =>
      under(dir).map(path => path.slice(dir.length + 1)),
    unlink: async (path: string) => {
      delete mockFiles[path];
      under(path).forEach(file => delete mockFiles[file]);
    },
  },
}));
const mockCreateDocument = jest.fn();
const mockOpenDocument = jest.fn();
jest.mock("react-native-scoped-storage", () => ({
  createDocument: (...args: unknown[]) => mockCreateDocument(...args),
  openDocument: (...args: unknown[]) => mockOpenDocument(...args),
}));
const mockState: any = {};
const mockDispatch = jest.fn();
const mockFlush = jest.fn(async () => undefined);
jest.mock("../redux/store", () => ({
  store: {
    getState: () => mockState,
    dispatch: (a: unknown) => mockDispatch(a),
  },
  persistor: { flush: () => mockFlush() },
}));

import {
  backupFileName,
  exportBackup,
  importBackup,
} from "../utils/backupArchive";

const garment = (id: string, image: string) => ({ id, name: id, image });
const wardrobe = (items: object[]) => ({
  CategoryList: { categories: [] },
  itemsList: { items, logs: [] },
  settings: { language: 0, enableHeatMap: true },
});
const zip = jest.fn();
const unzip = jest.fn();

beforeEach(() => {
  Object.keys(mockFiles).forEach(path => delete mockFiles[path]);
  mockDispatch.mockClear();
  mockCreateDocument.mockReset();
  mockOpenDocument.mockReset();
  zip.mockReset().mockResolvedValue(true);
  unzip.mockReset();
  NativeModules.WardrobeArchive = { zip, unzip };
  jest.spyOn(console, "error").mockImplementation(() => {});
});

test("backups are ZIP files named by date and time", () => {
  expect(backupFileName(new Date(2026, 10, 11, 9, 5))).toBe(
    "wardrobe-atlas-2026-11-11-0905.zip",
  );
});

describe("Export", () => {
  beforeEach(() => {
    Object.assign(
      mockState,
      wardrobe([
        garment("shirt", "shirt.jpg"),
        garment("cut", "cut.webp"),
        garment("bare", ""),
      ]),
    );
    mockFiles["/docs/photos/shirt.jpg"] = "jpeg";
    mockFiles["/docs/photos/cut.webp"] = "webp";
  });

  test("asks where to save, then zips the data and each garment's photo", async () => {
    mockCreateDocument.mockResolvedValue({ uri: "content://drive/backup" });
    expect(await exportBackup()).toBe(true);
    expect(mockCreateDocument).toHaveBeenCalledWith(
      expect.stringMatching(/^wardrobe-atlas-.*\.zip$/),
      "application/zip",
      "",
      "utf8",
    );
    const [entries, uri] = zip.mock.calls[0];
    expect(uri).toBe("content://drive/backup");
    expect(entries).toEqual({
      "wardrobe.json": "/cache/backup-export/wardrobe.json",
      "photos/shirt.jpg": "/docs/photos/shirt.jpg",
      "photos/cut.webp": "/docs/photos/cut.webp",
    });
  });

  test("the data names the photos and holds no image data", async () => {
    let data = "";
    mockCreateDocument.mockResolvedValue({ uri: "content://x" });
    zip.mockImplementation(async (entries: Record<string, string>) => {
      data = mockFiles[entries["wardrobe.json"]];
    });
    await exportBackup();
    const saved = JSON.parse(data);
    expect(saved.formatVersion).toBe(3);
    expect(saved.itemsList.items.map((g: any) => g.image)).toEqual([
      "shirt.jpg",
      "cut.webp",
      "",
    ]);
    // The working copy is removed afterwards.
    expect(under("/cache/backup-export")).toEqual([]);
  });

  test("cancelling the picker saves nothing", async () => {
    mockCreateDocument.mockResolvedValue(null);
    expect(await exportBackup()).toBe(false);
    expect(zip).not.toHaveBeenCalled();
  });
});

describe("Import", () => {
  const unpacks = (files: Record<string, string>) =>
    unzip.mockImplementation(async (_uri: string, dir: string) => {
      Object.entries(files).forEach(([name, data]) => {
        mockFiles[`${dir}/${name}`] = data;
      });
    });
  const imported = () =>
    mockDispatch.mock.calls.find(
      ([action]) => action.type === "itemsList/importItems",
    )?.[0].payload;

  test("replaces everything with the backup, bringing its photos in", async () => {
    mockFiles["/docs/photos/old.jpg"] = "old photo";
    mockOpenDocument.mockResolvedValue({ uri: "content://drive/b.zip" });
    unpacks({
      "wardrobe.json": JSON.stringify(
        wardrobe([garment("shirt", "shirt.jpg"), garment("lost", "lost.jpg")]),
      ),
      "photos/shirt.jpg": "jpeg",
    });
    const sync = jest.fn();
    expect(await importBackup(sync)).toBe("imported");
    expect(mockOpenDocument).toHaveBeenCalledWith(false);
    expect(unzip).toHaveBeenCalledWith(
      "content://drive/b.zip",
      "/cache/backup-import",
    );
    // A photo missing from the backup leaves that garment without one.
    expect(imported().items.map((g: any) => [g.id, g.image])).toEqual([
      ["shirt", "shirt.jpg"],
      ["lost", ""],
    ]);
    expect(mockFiles["/docs/photos/shirt.jpg"]).toBe("jpeg");
    // The replaced data's photos are deleted, and so is the unpacked copy.
    expect(mockFiles["/docs/photos/old.jpg"]).toBeUndefined();
    expect(under("/cache/backup-import")).toEqual([]);
    expect(mockFlush).toHaveBeenCalled();
    expect(sync).toHaveBeenCalledWith(true);
  });

  test("a file that isn't a backup changes nothing", async () => {
    mockFiles["/docs/photos/old.jpg"] = "old photo";
    mockOpenDocument.mockResolvedValue({ uri: "content://notes.txt" });
    unpacks({});
    expect(await importBackup(jest.fn())).toBe("invalid");
    unpacks({ "wardrobe.json": '{"not":"a backup"}' });
    expect(await importBackup(jest.fn())).toBe("invalid");
    // The native unzip refuses entries that would leave its folder.
    unzip.mockRejectedValue(new Error("Unexpected entry: ../x"));
    expect(await importBackup(jest.fn())).toBe("invalid");
    expect(mockDispatch).not.toHaveBeenCalled();
    expect(mockFiles["/docs/photos/old.jpg"]).toBe("old photo");
  });

  test("cancelling the picker changes nothing", async () => {
    mockOpenDocument.mockResolvedValue(null);
    expect(await importBackup(jest.fn())).toBe("cancelled");
    expect(unzip).not.toHaveBeenCalled();
  });
});
