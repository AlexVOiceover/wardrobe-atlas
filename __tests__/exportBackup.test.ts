const mockCreateDocument = jest.fn();
jest.mock("react-native-scoped-storage", () => ({
  createDocument: (...args: unknown[]) => mockCreateDocument(...args),
}));
jest.mock("../redux/store", () => ({ store: { getState: () => ({}) } }));
jest.mock("../utils/wardrobeData", () => ({
  createWardrobeBackup: () => ({ formatVersion: 1 }),
}));
import { backupFileName, exportStoreToJson } from "../utils/exportStoreToJson";

test("backup files are named by date and time", () => {
  expect(backupFileName(new Date(2026, 10, 8, 9, 5))).toBe(
    "wardrobe-atlas-2026-11-08-0905.json",
  );
});

test("Export lets Android ask where to save a dated backup", async () => {
  mockCreateDocument.mockResolvedValue("content://saved");
  expect(await exportStoreToJson()).toBe(true);
  const [name, type, text] = mockCreateDocument.mock.calls[0];
  expect(name).toMatch(/^wardrobe-atlas-\d{4}-\d{2}-\d{2}-\d{4}\.json$/);
  expect(type).toBe("application/json");
  expect(JSON.parse(text)).toEqual({ formatVersion: 1 });
});
