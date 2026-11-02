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
jest.mock("../components/CustomInput", () => ({ CustomInput: "CustomInput" }));
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
    return true;
  });
  let tree: ReactTestRenderer;
  await act(async () => {
    tree = create(<Settings />);
  });
  const buttons = () => tree!.root.findAllByType("Button" as any);
  expect(buttons().map(b => b.props.children)).toEqual(["Export", "Import"]);
  expect(tree!.root.findByType("UpdateControls" as any).props.settings).toBe(
    true,
  );
  await act(async () => {
    await buttons()[0].props.onPress();
  });
  expect(mockExport).toHaveBeenCalledTimes(1);
  expect(tree!.root.findByType("Snackbar" as any).props.children).toBe(
    "Exported to destination",
  );
  await act(async () => {
    await buttons()[1].props.onPress();
  });
  expect(mockImport).toHaveBeenCalledTimes(1);
  expect(tree!.root.findByType("Snackbar" as any).props.children).toBe(
    "Imported successfully",
  );
  expect(tree!.root.findByType("Switch" as any).props.value).toBe(true);
});
