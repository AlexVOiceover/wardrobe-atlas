import { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import type { item } from "../redux/itemsSlice";
import { theme } from "../utils/theme";
// How much a garment card shows at a given grid size
export type CardDensity = "full" | "name" | "photo";
export const cardDensity = (columns: number): CardDensity =>
  columns <= 2 ? "full" : columns <= 4 ? "name" : "photo";
// Cell width and gap as percentages of the grid width; 2 columns keeps 48% cells.
export const gridCellLayout = (columns: number) => {
  const gap = columns <= 2 ? 4 : 2;
  return { width: (100 - gap * (columns - 1)) / columns, gap };
};
export function GarmentGrid({
  garments,
  renderGarment,
  columns = 2,
}: {
  garments: item[];
  renderGarment: (garment: item) => ReactNode;
  columns?: number;
}) {
  const { width, gap } = gridCellLayout(columns);
  return (
    <View style={styles.grid}>
      {garments.map((garment, index) => (
        <View
          key={garment.id}
          style={{
            width: `${width}%`,
            marginRight: (index + 1) % columns === 0 ? 0 : `${gap}%`,
          }}
        >
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
    rowGap: theme.spacing.md,
  },
});
