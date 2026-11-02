import { ReactNode } from "react";
import { Text, StyleProp, TextStyle } from "react-native";
export const ThemeText = ({
  children,
  customStyle,
}: {
  children?: ReactNode;
  customStyle?: StyleProp<TextStyle>;
}) => (
  <Text style={[{ color: "#111111", fontSize: 16 }, customStyle]}>
    {children}
  </Text>
);
