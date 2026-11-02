import { StyleSheet, View } from "react-native";
import { Button } from "react-native-paper";
import { theme } from "../utils/theme";
import { ThemeText } from "./ThemeText";
export const EmptyState = ({
  message,
  action,
  onAction,
}: {
  message: string;
  action?: string;
  onAction?: () => void;
}) => (
  <View style={styles.container}>
    <ThemeText customStyle={styles.message}>{message}</ThemeText>
    {action && (
      <Button mode="outlined" onPress={onAction}>
        {action}
      </Button>
    )}
  </View>
);
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  message: {
    color: theme.colors.muted,
    textAlign: "center",
  },
});
