import { Pressable, StyleSheet, Text } from "react-native";
import { theme } from "../utils/theme";
export const FilterChip = ({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) => (
  <Pressable
    accessibilityRole="button"
    accessibilityLabel={label}
    accessibilityState={{ selected }}
    onPress={onPress}
    style={[styles.chip, selected && styles.selected]}
  >
    <Text style={[styles.label, selected && styles.selectedLabel]}>
      {label}
    </Text>
  </Pressable>
);
const styles = StyleSheet.create({
  chip: {
    minHeight: theme.touch,
    justifyContent: "center",
    paddingHorizontal: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  selected: {
    backgroundColor: theme.colors.text,
    borderColor: theme.colors.text,
  },
  label: {
    color: theme.colors.text,
    fontSize: theme.type.caption,
  },
  selectedLabel: {
    color: theme.colors.background,
  },
});
