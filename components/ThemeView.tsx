import { ReactNode } from "react";
import { View, StyleProp, ViewStyle } from "react-native";
import { theme } from "../utils/theme";
export const ThemeView = ({
  children,
  customStyle,
}: {
  children: ReactNode;
  customStyle?: StyleProp<ViewStyle>;
}) => (
  <View
    style={[{ flex: 1, backgroundColor: theme.colors.background }, customStyle]}
  >
    {children}
  </View>
);
