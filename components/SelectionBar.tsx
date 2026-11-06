import { Pressable, StyleSheet, View } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { localization } from "../utils/localization";
import { theme } from "../utils/theme";
import { ThemeText } from "./ThemeText";

export const SELECTION_BAR_CLEARANCE = 140;

const Action = ({
  icon,
  label,
  disabled,
  onPress,
}: {
  icon: string;
  label: string;
  disabled: boolean;
  onPress: () => void;
}) => (
  <Pressable
    accessibilityRole="button"
    accessibilityLabel={label}
    accessibilityState={{ disabled }}
    disabled={disabled}
    onPress={onPress}
    style={[styles.action, disabled && styles.disabled]}
  >
    <Icon name={icon} size={22} color={theme.colors.bar} />
    {/* Two lines at most, so a long Spanish label never gets cut. */}
    <ThemeText numberOfLines={2} customStyle={styles.actionLabel}>
      {label}
    </ThemeText>
  </Pressable>
);

/** Replaces the add button while garments are being selected in the Closet. */
export function SelectionBar({
  count,
  language,
  storing,
  allSelected,
  onClose,
  onSelectAll,
  onStore,
  onLog,
  onMove,
}: {
  count: number;
  language: number;
  // One button: Store while any ticked garment is in use, else Unstore.
  storing: boolean;
  // Every visible garment is ticked, so the link deselects them.
  allSelected: boolean;
  onClose: () => void;
  onSelectAll: () => void;
  onStore: () => void;
  onLog: () => void;
  onMove: () => void;
}) {
  const selectAllLabel = allSelected
    ? localization.DeselectAll[language]
    : localization.SelectAll[language];
  return (
    <View style={styles.bar}>
      <View style={styles.top}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={localization.EndSelection[language]}
          onPress={onClose}
          style={styles.icon}
        >
          <Icon name="close" size={24} color={theme.colors.text} />
        </Pressable>
        <ThemeText accessibilityLiveRegion="polite" customStyle={styles.count}>
          {localization.SelectedCount[language].replace("{n}", String(count))}
        </ThemeText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={selectAllLabel}
          onPress={onSelectAll}
          style={styles.selectAll}
        >
          <ThemeText customStyle={styles.selectAllLabel}>
            {selectAllLabel}
          </ThemeText>
        </Pressable>
      </View>
      <View style={styles.actions}>
        <Action
          icon={storing ? "archive-outline" : "shirt-outline"}
          label={
            storing
              ? localization.Store[language]
              : localization.Unstore[language]
          }
          disabled={count === 0}
          onPress={onStore}
        />
        <Action
          icon="checkmark-done-outline"
          label={localization.LogUse[language]}
          disabled={count === 0}
          onPress={onLog}
        />
        <Action
          icon="swap-horizontal-outline"
          label={localization.Move[language]}
          disabled={count === 0}
          onPress={onMove}
        />
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  // Light with a coloured edge, so it doesn't merge with the tab bar below.
  bar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.background,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderColor: theme.colors.bar,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    elevation: 8,
    paddingBottom: theme.spacing.xs,
  },
  top: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 52,
  },
  icon: {
    width: 52,
    minHeight: theme.touch,
    justifyContent: "center",
    alignItems: "center",
  },
  count: {
    flex: 1,
    color: theme.colors.text,
    fontWeight: "600",
  },
  selectAll: {
    minHeight: theme.touch,
    justifyContent: "center",
    paddingHorizontal: theme.spacing.md,
  },
  selectAllLabel: {
    color: theme.colors.bar,
    textDecorationLine: "underline",
  },
  actions: {
    flexDirection: "row",
  },
  action: {
    flex: 1,
    paddingHorizontal: theme.spacing.xs,
    minHeight: 56,
    justifyContent: "center",
    alignItems: "center",
    gap: 2,
  },
  actionLabel: {
    color: theme.colors.text,
    fontSize: theme.type.caption,
    textAlign: "center",
  },
  disabled: {
    opacity: 0.4,
  },
});
