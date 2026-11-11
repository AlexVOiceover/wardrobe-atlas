import { NativeModules } from "react-native";
import {
  GARMENT_MODEL,
  downloadGarmentModel,
  garmentModelPath,
  garmentPart,
  isolateGarment,
} from "../utils/garmentIsolation";

const mockFiles: Record<string, number> = {};
const mockDownload = {
  status: 200,
  size: 0,
  hash: "",
  progress: [] as number[],
};
jest.mock("react-native-blob-util", () => ({
  __esModule: true,
  default: {
    fs: {
      dirs: { DocumentDir: "/docs" },
      // The garment photo, read for the native tool; cutouts are saved anew.
      readFile: async () => "/9j/photo",
      writeFile: async () => undefined,
      isDir: async () => true,
      stat: async (path: string) => {
        if (!(path in mockFiles)) throw new Error("missing");
        return { size: mockFiles[path] };
      },
      unlink: async (path: string) => {
        delete mockFiles[path];
      },
      hash: async () => mockDownload.hash,
      mv: async (from: string, to: string) => {
        mockFiles[to] = mockFiles[from];
        delete mockFiles[from];
      },
    },
    config: ({ path }: { path: string }) => ({
      fetch: () => {
        const task: any = Promise.resolve().then(() => {
          mockFiles[path] = mockDownload.size;
          return { info: () => ({ status: mockDownload.status }) };
        });
        task.progress = (_: unknown, report: (received: number) => void) =>
          mockDownload.progress.forEach(received => report(received));
        return task;
      },
    }),
  },
}));

const native = (impl: () => Promise<string>) => {
  NativeModules.WardrobeBackground = { isolateGarment: jest.fn(impl) };
  return NativeModules.WardrobeBackground.isolateGarment as jest.Mock;
};
const failWith = (code: string) => () =>
  Promise.reject(Object.assign(new Error(code), { code }));
const goodDownload = () =>
  Object.assign(mockDownload, {
    status: 200,
    size: GARMENT_MODEL.size,
    hash: GARMENT_MODEL.sha256,
    progress: [GARMENT_MODEL.size / 2],
  });

beforeEach(() => {
  Object.keys(mockFiles).forEach(path => delete mockFiles[path]);
});
afterEach(() => {
  delete NativeModules.WardrobeBackground;
});

test("tops keep the upper garment, bottoms the lower one, shoes and accessories none", () => {
  expect([0, 1, 2, 3, 7].map(garmentPart)).toEqual([
    "upper",
    "lower",
    undefined,
    undefined,
    "any",
  ]);
});

test("the model is downloaded, checked and kept; a bad download leaves nothing", async () => {
  const progress: number[] = [];
  goodDownload();
  expect(await downloadGarmentModel(p => progress.push(p))).toBe(true);
  expect(progress).toEqual([50, 100]);
  expect(mockFiles).toEqual({ [garmentModelPath()]: GARMENT_MODEL.size });

  Object.keys(mockFiles).forEach(path => delete mockFiles[path]);
  mockDownload.hash = "something else";
  expect(await downloadGarmentModel(() => undefined)).toBe(false);
  expect(mockFiles).toEqual({});
  goodDownload();
  mockDownload.status = 404;
  expect(await downloadGarmentModel(() => undefined)).toBe(false);
  expect(mockFiles).toEqual({});
});

test("isolating needs the module and the model, and passes on each failure", async () => {
  expect(await isolateGarment("shirt.jpg", "upper")).toEqual({
    error: "unsupported",
  });
  const isolate = native(async () => "UklGRtop");
  expect(await isolateGarment("shirt.jpg", "upper")).toEqual({
    error: "noModel",
  });
  mockFiles[garmentModelPath()] = GARMENT_MODEL.size;
  // The cutout is a new WebP photo file.
  expect(await isolateGarment("shirt.jpg", "upper")).toEqual({
    image: expect.stringMatching(/^[\w-]+\.webp$/),
  });
  expect(isolate).toHaveBeenLastCalledWith(
    "/9j/photo",
    garmentModelPath(),
    "upper",
  );
  native(failWith("NO_SUBJECT"));
  expect(await isolateGarment("shirt.jpg", "lower")).toEqual({
    error: "noSubject",
  });
  native(failWith("OTHER"));
  expect(await isolateGarment("shirt.jpg", "lower")).toEqual({
    error: "failed",
  });
  // A model that can't be loaded is removed, so the next try downloads it.
  native(failWith("NO_MODEL"));
  expect(await isolateGarment("shirt.jpg", "lower")).toEqual({
    error: "noModel",
  });
  expect(mockFiles).toEqual({});
});
