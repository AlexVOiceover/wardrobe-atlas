import { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { captionText, theme } from "../utils/theme";
import { ThemeText } from "./ThemeText";
export const ListRow = ({
  title,
  subtitle,
  icon,
  right,
  onPress,
}: {
  title: string;
  subtitle?: string;
  icon?: string;
  right?: ReactNode;
  onPress?: () => void;
}) => (
  <Pressable
    accessible={!!onPress}
    accessibilityRole={onPress ? "button" : undefined}
    accessibilityLabel={title}
    disabled={!onPress}
    onPress={onPress}
    style={styles.row}
  >
    {icon && <Icon name={icon} size={22} color={theme.colors.text} />}
    <View style={styles.text}>
      <ThemeText numberOfLines={2}>{title}</ThemeText>
      {subtitle && <ThemeText customStyle={captionText}>{subtitle}</ThemeText>}
    </View>
    {right}
    {onPress && !right && (
      <Icon name="chevron-forward" size={18} color={theme.colors.muted} />
    )}
  </Pressable>
);
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
