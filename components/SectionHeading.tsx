import { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { theme } from "../utils/theme";
import { ThemeText } from "./ThemeText";
export const SectionHeading = ({
  title,
  right,
}: {
  title: string;
  right?: ReactNode;
}) => (
  <View style={styles.row}>
    <ThemeText numberOfLines={2} customStyle={styles.title}>
      {title}
    </ThemeText>
    {right}
  </View>
);
const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: theme.touch,
  },
  title: {
    flex: 1,
    fontWeight: "600",
  },
});
