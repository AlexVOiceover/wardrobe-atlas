import { ReactNode } from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { captionText, theme } from "../utils/theme";
import { ThemeText } from "./ThemeText";

/**
 * The look every small form field shares: the same border and height, with
 * its label in small text inside the box above the value.
 */
export const FieldBox = ({
  label,
  children,
  right,
  style,
}: {
  label: string;
  children: ReactNode;
  // Buttons at the right edge, e.g. ✕ or arrows
  right?: ReactNode;
  style?: StyleProp<ViewStyle>;
}) => (
  <View style={[styles.box, style]}>
    <View style={styles.value}>
      <ThemeText customStyle={captionText} numberOfLines={1}>
        {label}
      </ThemeText>
      {children}
    </View>
    {right}
  </View>
);
export const fieldBox = {
  borderWidth: 1,
  borderColor: theme.colors.muted,
  minHeight: 52,
};
const styles = StyleSheet.create({
  box: {
    ...fieldBox,
    flexDirection: "row",
    alignItems: "center",
  },
  value: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: theme.spacing.sm,
  },
});
