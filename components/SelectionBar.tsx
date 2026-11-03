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
    <Icon name={icon} size={22} color={theme.colors.onBar} />
    <ThemeText numberOfLines={1} customStyle={styles.actionLabel}>
      {label}
    </ThemeText>
  </Pressable>
);

/** Replaces the add button while garments are being selected in the Closet. */
export function SelectionBar({
  count,
  language,
  canStore,
  canUnstore,
  onClose,
  onSelectAll,
  onStore,
  onUnstore,
  onLog,
  onMove,
}: {
  count: number;
  language: number;
  canStore: boolean;
  canUnstore: boolean;
  onClose: () => void;
  onSelectAll: () => void;
  onStore: () => void;
  onUnstore: () => void;
  onLog: () => void;
  onMove: () => void;
}) {
  return (
    <View style={styles.bar}>
      <View style={styles.top}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={localization.EndSelection[language]}
          onPress={onClose}
          style={styles.icon}
        >
          <Icon name="close" size={24} color={theme.colors.onBar} />
        </Pressable>
        <ThemeText accessibilityLiveRegion="polite" customStyle={styles.count}>
          {localization.SelectedCount[language].replace("{n}", String(count))}
        </ThemeText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={localization.SelectAll[language]}
          onPress={onSelectAll}
          style={styles.selectAll}
        >
          <ThemeText customStyle={styles.selectAllLabel}>
            {localization.SelectAll[language]}
          </ThemeText>
        </Pressable>
      </View>
      <View style={styles.actions}>
        <Action
          icon="archive-outline"
          label={localization.Store[language]}
          disabled={!canStore}
          onPress={onStore}
        />
        <Action
          icon="shirt-outline"
          label={localization.Unstore[language]}
          disabled={!canUnstore}
          onPress={onUnstore}
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
  bar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.bar,
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
    color: theme.colors.onBar,
    fontWeight: "600",
  },
  selectAll: {
    minHeight: theme.touch,
    justifyContent: "center",
    paddingHorizontal: theme.spacing.md,
  },
  selectAllLabel: {
    color: theme.colors.onBar,
    textDecorationLine: "underline",
  },
  actions: {
    flexDirection: "row",
  },
  action: {
    flex: 1,
    minHeight: 56,
    justifyContent: "center",
    alignItems: "center",
    gap: 2,
  },
  actionLabel: {
    color: theme.colors.onBar,
    fontSize: theme.type.caption,
  },
  disabled: {
    opacity: 0.4,
  },
});
