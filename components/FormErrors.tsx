import { View } from "react-native";
import { theme } from "../utils/theme";
import { ThemeText } from "./ThemeText";
export const FormErrors = ({ errors }: { errors: string[] }) =>
  errors.length > 0 ? (
    <View accessibilityRole="alert">
      {errors.map(error => (
        <ThemeText key={error} customStyle={{ color: theme.colors.danger }}>
          {error}
        </ThemeText>
      ))}
    </View>
  ) : null;
