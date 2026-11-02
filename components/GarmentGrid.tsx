import { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import type { item } from "../redux/itemsSlice";
import { theme } from "../utils/theme";
export function GarmentGrid({
  garments,
  renderGarment,
}: {
  garments: item[];
  renderGarment: (garment: item) => ReactNode;
}) {
  return (
    <View style={styles.grid}>
      {garments.map(garment => (
        <View key={garment.id} style={styles.cell}>
          {renderGarment(garment)}
        </View>
      ))}
    </View>
  );
}
const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: theme.spacing.md,
  },
  cell: {
    width: "48%",
  },
});
