import { StyleSheet } from "react-native";
import { Searchbar } from "react-native-paper";
import { theme } from "../utils/theme";
export const SearchField = ({
  value,
  onChangeText,
  placeholder,
  autoFocus = false,
}: {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  autoFocus?: boolean;
}) => (
  <Searchbar
    placeholder={placeholder}
    value={value}
    onChangeText={onChangeText}
    onClearIconPress={() => onChangeText("")}
    autoFocus={autoFocus}
    elevation={0}
    style={styles.bar}
    inputStyle={styles.input}
  />
);
const styles = StyleSheet.create({
  bar: {
    height: theme.touch,
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
  },
  input: {
    minHeight: 0,
    fontSize: theme.type.body,
  },
});
