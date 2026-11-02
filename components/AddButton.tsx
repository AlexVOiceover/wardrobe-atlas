import { Pressable, StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { theme } from "../utils/theme";
export const AddButton = ({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) => (
  <Pressable
    accessibilityRole="button"
    accessibilityLabel={label}
    onPress={onPress}
    style={styles.button}
  >
    <Icon name="add" size={28} color={theme.colors.background} />
  </Pressable>
);
export const ADD_BUTTON_CLEARANCE = 88;
const styles = StyleSheet.create({
  button: {
    position: "absolute",
    right: theme.spacing.md,
    bottom: theme.spacing.md,
    width: 56,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.text,
  },
});
