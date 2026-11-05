import { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Switch } from "react-native-paper";
import Icon from "react-native-vector-icons/Ionicons";
import { captionText, theme } from "../utils/theme";
import { ThemeText } from "./ThemeText";
/**
 * A row with a title and an optional subtitle. With `onPress` it is a button;
 * with `switchValue` and `onSwitch` the whole row is a switch.
 */
export const ListRow = ({
  title,
  subtitle,
  icon,
  right,
  onPress,
  switchValue,
  onSwitch,
}: {
  title: string;
  subtitle?: string;
  icon?: string;
  right?: ReactNode;
  onPress?: () => void;
  switchValue?: boolean;
  onSwitch?: (value: boolean) => void;
}) => {
  const isSwitch = switchValue !== undefined && !!onSwitch;
  const press = isSwitch ? () => onSwitch(!switchValue) : onPress;
  return (
    <Pressable
      accessible={!!press}
      accessibilityRole={isSwitch ? "switch" : press ? "button" : undefined}
      accessibilityState={isSwitch ? { checked: switchValue } : undefined}
      accessibilityLabel={subtitle ? `${title}, ${subtitle}` : title}
      disabled={!press}
      onPress={press}
      style={styles.row}
    >
      {icon && <Icon name={icon} size={22} color={theme.colors.text} />}
      <View style={styles.text}>
        <ThemeText numberOfLines={2}>{title}</ThemeText>
        {subtitle && <ThemeText customStyle={captionText}>{subtitle}</ThemeText>}
      </View>
      {isSwitch ? (
        // The row takes the tap, so the switch only shows the state.
        <View
          pointerEvents="none"
          importantForAccessibility="no-hide-descendants"
        >
          <Switch value={switchValue} />
        </View>
      ) : (
        right
      )}
      {onPress && !right && !isSwitch && (
        <Icon name="chevron-forward" size={18} color={theme.colors.muted} />
      )}
    </Pressable>
  );
};
const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    minHeight: 56,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  text: {
    flex: 1,
  },
});
