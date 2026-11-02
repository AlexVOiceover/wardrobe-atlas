import { Text, View } from "react-native";
import { getInstalledVersion } from "../utils/updateService";
export function AppHeader() {
  const { versionName } = getInstalledVersion();
  return (
    <View
      style={{
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderBottomWidth: 1,
        flexDirection: "row",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
      }}
    >
      <Text
        accessibilityRole="header"
        style={{ color: "#111111", fontSize: 18 }}
      >
        Wardrobe Atlas
      </Text>
      <Text testID="app-version" style={{ color: "#333333", fontSize: 14 }}>
        {versionName === "Development" ? versionName : `v${versionName}`}
      </Text>
    </View>
  );
}
