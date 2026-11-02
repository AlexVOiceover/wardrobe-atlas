import React from "react";
import { act, create, ReactTestRenderer } from "react-test-renderer";
import { UpdateControls } from "../components/UpdateControls";

const mockCheck = jest.fn().mockResolvedValue({ phase: "current" });
let mockPhase = "idle";
jest.mock("../utils/updateService", () => ({
  getInstalledVersion: () => ({ buildNumber: 99, versionName: "0.1.99" }),
  checkForUpdates: (...args: unknown[]) => mockCheck(...args),
}));
jest.mock("../hooks/useUpdates", () => ({
  useUpdates: () => ({ phase: mockPhase }),
}));
jest.mock("react-redux", () => ({ useSelector: () => 0 }));
jest.mock("react-native-paper", () => ({ Button: "Button" }));
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

test("Settings shows the installed package version and the app-wide banner does not", async () => {
  mockPhase = "idle";
  let view: ReactTestRenderer;
  await act(async () => {
    view = create(<UpdateControls settings />);
  });
  expect(JSON.stringify(view!.toJSON())).toContain("v0.1.99");
  await act(async () => {
    view!.update(<UpdateControls />);
  });
  expect(view!.toJSON()).toBeNull();
  mockPhase = "ready";
  await act(async () => {
    view!.update(<UpdateControls />);
  });
  expect(JSON.stringify(view!.toJSON())).not.toContain("v0.1.99");
  await act(async () => {
    view!.unmount();
  });
});

test("Settings check requests an immediate manual check and disables during work", async () => {
  mockPhase = "idle";
  let view: ReactTestRenderer;
  await act(async () => {
    view = create(<UpdateControls settings />);
  });
  const button = () => view!.root.findByType("Button" as any);
  expect(button().props.children).toBe("Check for updates");
  expect(button().props.disabled).toBe(false);
  await act(async () => {
    button().props.onPress();
  });
  expect(mockCheck).toHaveBeenCalledWith({ manual: true });
  mockPhase = "checking";
  await act(async () => {
    view!.update(<UpdateControls settings />);
  });
  expect(button().props.disabled).toBe(true);
  await act(async () => {
    view!.unmount();
  });
});
