import { ReactNode } from "react";
import { Text, StyleProp, TextProps, TextStyle } from "react-native";
import { theme } from "../utils/theme";
export const ThemeText = ({
  children,
  customStyle,
  ...props
}: TextProps & {
  children?: ReactNode;
  customStyle?: StyleProp<TextStyle>;
}) => (
  <Text
    {...props}
    style={[
      { color: theme.colors.text, fontSize: theme.type.body },
      customStyle,
    ]}
  >
    {children}
  </Text>
);
