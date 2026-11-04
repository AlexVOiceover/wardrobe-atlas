import React from "react";
import { act, create, ReactTestRenderer } from "react-test-renderer";
import { StyleSheet, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import MyTabs from "../routers/BottomTabNav";
import { theme } from "../utils/theme";

jest.mock("react-redux", () => ({
  useSelector: (selector: (state: unknown) => unknown) =>
    selector({ settings: { language: "en" } }),
}));
jest.mock("react-native-vector-icons/Ionicons", () => "Icon");
jest.mock("../screens/bottomNav/HomeBottom", () => ({
  HomeBottom: () => null,
}));
jest.mock("../screens/bottomNav/OutfitLog", () => ({ OutfitLog: () => null }));
jest.mock("../screens/bottomNav/More", () => ({ More: () => null }));
jest.mock("../screens/bottomNav/Collections", () => ({
  Collections: () => null,
}));

// Android 3-button navigation bar under edge-to-edge
const NAV_BAR = 48;

test("tab bar does not add the navigation bar inset the root SafeAreaView already applies", async () => {
  let tree!: ReactTestRenderer;
  await act(async () => {
    tree = create(
      <SafeAreaProvider
        initialMetrics={{
          frame: { x: 0, y: 0, width: 400, height: 800 },
          insets: { top: 24, left: 0, right: 0, bottom: NAV_BAR },
        }}
      >
        <NavigationContainer>
          <MyTabs />
        </NavigationContainer>
      </SafeAreaProvider>,
    );
  });
  const bottomPaddings = tree.root
    .findAllByType(View)
    .map(view => StyleSheet.flatten(view.props.style)?.paddingBottom)
    .filter(padding => typeof padding === "number");
  expect(bottomPaddings).not.toContain(NAV_BAR);
  const backgrounds = tree.root
    .findAllByType(View)
    .map(view => StyleSheet.flatten(view.props.style)?.backgroundColor);
  expect(backgrounds).toContain(theme.colors.bar);
  expect(
    tree.root.findAllByProps({ children: "Closet" }).length,
  ).toBeGreaterThan(0);
});
