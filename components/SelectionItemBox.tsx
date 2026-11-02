import { Pressable, StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { Dispatch, SetStateAction } from "react";
import { ItemSummary } from "./ItemSummary";
import type { ItemSummaryProps } from "./ItemBox";
import { theme } from "../utils/theme";
export const SelectionItemBox = ({
  selectedIdCollector,
  setSelectedIdCollector,
  ...item
}: ItemSummaryProps & {
  selectedIdCollector: string[];
  setSelectedIdCollector: Dispatch<SetStateAction<string[]>>;
}) => {
  const selected = selectedIdCollector.includes(item.id);
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={item.name}
      accessibilityState={{ checked: selected }}
      onPress={() =>
        setSelectedIdCollector(current =>
          current.includes(item.id)
            ? current.filter(id => id !== item.id)
            : [...current, item.id],
        )
      }
    >
      <ItemSummary {...item} />
      <Icon
        name={selected ? "checkmark-circle" : "ellipse-outline"}
        size={26}
        color={selected ? theme.colors.text : theme.colors.muted}
        style={styles.check}
      />
    </Pressable>
  );
};
const styles = StyleSheet.create({
  check: {
    position: "absolute",
    top: theme.spacing.sm,
    right: theme.spacing.sm,
  },
});
