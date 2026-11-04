import { Pressable, StyleSheet, Text } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { theme } from "../utils/theme";
/** A toggle chip; dense ones are shorter for tight forms. */
export const FilterChip = ({
  label,
  selected,
  onPress,
  icon,
  dense = false,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  icon?: string;
  dense?: boolean;
}) => (
  <Pressable
    accessibilityRole="button"
    accessibilityLabel={label}
    accessibilityState={{ selected }}
    onPress={onPress}
    style={[styles.chip, dense && styles.dense, selected && styles.selected]}
  >
    {icon && (
      <Icon
        name={icon}
        size={16}
        color={selected ? theme.colors.background : theme.colors.text}
      />
    )}
    <Text style={[styles.label, selected && styles.selectedLabel]}>
      {label}
    </Text>
  </Pressable>
);
const styles = StyleSheet.create({
  chip: {
    minHeight: theme.touch,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  dense: {
    minHeight: 40,
    paddingHorizontal: 12,
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
