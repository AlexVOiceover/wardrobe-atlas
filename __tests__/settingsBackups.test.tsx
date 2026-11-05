import React from "react";
import { act, create, ReactTestRenderer } from "react-test-renderer";
import { Settings } from "../screens/stackNav/Settings";

const mockDispatch = jest.fn();
const mockExport = jest.fn();
const mockImport = jest.fn();
jest.mock("react-redux", () => ({
  useSelector: (select: Function) =>
    select({ settings: { language: 0, name: "Alex", enableHeatMap: false } }),
  useDispatch: () => mockDispatch,
}));
jest.mock("react-native-vector-icons/Ionicons", () => "Icon");
jest.mock("react-native-paper", () => ({
  Button: "Button",
  Snackbar: "Snackbar",
  Switch: "Switch",
}));
jest.mock("../components/PageHeader", () => ({ PageHeader: "PageHeader" }));
jest.mock("../components/ConfirmationDialog", () => ({
  ConfirmationDialog: "ConfirmationDialog",
}));
jest.mock("../components/CustomInput", () => ({ CustomInput: "CustomInput" }));
jest.mock("../components/BulkBackgroundRemoval", () => ({
  BulkBackgroundRemoval: "BulkBackgroundRemoval",
}));
jest.mock("../components/UpdateControls", () => ({
  UpdateControls: "UpdateControls",
}));
jest.mock("../utils/exportStoreToJson", () => ({
  exportStoreToJson: () => mockExport(),
}));
jest.mock("../utils/importStoreFromJson", () => ({
  importStoreFromJson: (sync: Function) => mockImport(sync),
}));

test("Settings retains working JSON backup actions and update controls after text-copy removal", async () => {
  mockExport.mockResolvedValue(true);
  mockImport.mockImplementation(async sync => {
    sync(true);
    return "imported";
  });
  let tree: ReactTestRenderer;
  await act(async () => {
    tree = create(<Settings />);
  });
  const buttons = () =>
    tree!.root
      .findAllByType("Button" as any)
      .filter(b => b.props.children !== "Export first");
  expect(buttons().map(b => b.props.children)).toEqual(["Export", "Import"]);
  expect(tree!.root.findByType("UpdateControls" as any).props.settings).toBe(
    true,
  );
  expect(
    tree!.root.findAllByType("BulkBackgroundRemoval" as any),
  ).toHaveLength(1);
  await act(async () => {
    await buttons()[0].props.onPress();
  });
  expect(mockExport).toHaveBeenCalledTimes(1);
  expect(tree!.root.findByType("Snackbar" as any).props.children).toBe(
    "Exported to destination",
  );
  // Import asks first.
  const dialog = () => tree!.root.findByType("ConfirmationDialog" as any);
  act(() => buttons()[1].props.onPress());
  expect(mockImport).not.toHaveBeenCalled();
  expect(dialog().props.visible).toBe(true);
  expect(dialog().props.confirmLabel).toBe("Import");
  await act(async () => {
    await dialog().props.onConfirm();
  });
  expect(mockImport).toHaveBeenCalledTimes(1);
  expect(tree!.root.findByType("Snackbar" as any).props.children).toBe(
    "Imported successfully",
  );
  expect(tree!.root.findByType("Switch" as any).props.value).toBe(true);
});

test("Import offers Export first, then asks again; a bad file shows an error", async () => {
  mockExport.mockReset();
  mockImport.mockReset();
  mockExport.mockResolvedValue(true);
  mockImport.mockResolvedValue("invalid");
  let tree: ReactTestRenderer;
  await act(async () => {
    tree = create(<Settings />);
  });
  const button = (text: string) =>
    tree!.root
      .findAllByType("Button" as any)
      .find(b => b.props.children === text)!;
  const dialog = () => tree!.root.findByType("ConfirmationDialog" as any);
  act(() => button("Import").props.onPress());
  expect(dialog().props.title).toBe("Replace everything with the backup?");
  await act(async () => {
    await button("Export first").props.onPress();
  });
  expect(mockExport).toHaveBeenCalledTimes(1);
  expect(mockImport).not.toHaveBeenCalled();
  expect(dialog().props.visible).toBe(true);
  await act(async () => {
    await dialog().props.onConfirm();
  });
  expect(tree!.root.findByType("Snackbar" as any).props.children).toBe(
    "Couldn't import: this file isn't a Wardrobe Atlas backup.",
  );
  // Choosing no file says nothing.
  mockImport.mockResolvedValue("cancelled");
  act(() => tree!.root.findByType("Snackbar" as any).props.onDismiss());
  await act(async () => {
    await dialog().props.onConfirm();
  });
  expect(tree!.root.findByType("Snackbar" as any).props.visible).toBe(false);
});
