import { ReactNode } from "react";
import { View, StyleProp, ViewStyle } from "react-native";
export const ThemeView = ({
  children,
  customStyle,
}: {
  children: ReactNode;
  customStyle?: StyleProp<ViewStyle>;
}) => (
  <View style={[{ flex: 1, backgroundColor: "#ffffff" }, customStyle]}>
    {children}
  </View>
);
