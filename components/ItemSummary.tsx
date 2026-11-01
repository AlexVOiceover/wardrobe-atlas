import useHeatmap from "../hooks/useHeatmap";
import { useSelector } from "react-redux";
import type { RootState } from "../redux/store";
import { Image, Text, View } from "react-native";
import type { ItemSummaryProps } from "./ItemBox";
export function ItemSummary({
  image,
  name,
  type,
  primary,
  secondary,
  tertiary,
  logs,
}: ItemSummaryProps) {
  const recency = useHeatmap(logs || []);
  const showRecency = useSelector((s: RootState) => s.settings.enableHeatMap);
  return (
    <View style={{ gap: 4 }}>
      {image !== "" && (
        <Image
          accessibilityLabel={name}
          source={{ uri: `data:image/*;base64,${image}` }}
          style={{ width: 112, height: 112, resizeMode: "contain" }}
        />
      )}
      <Text style={{ color: "#111111" }}>{name}</Text>
      <Text style={{ color: "#111111" }}>{type}</Text>
      <Text style={{ color: "#111111" }}>
        {[primary, secondary, tertiary].filter(Boolean).join(" / ")}
      </Text>
      {logs && <Text style={{ color: "#111111" }}>Uses: {logs.length}</Text>}
      {showRecency && logs && (
        <Text style={{ color: "#333333" }}>{recency}</Text>
      )}
    </View>
  );
}
