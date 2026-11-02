import type { TextStyle, ViewStyle } from "react-native";
export const theme = {
  colors: {
    background: "#ffffff",
    surface: "#f5f5f5",
    text: "#111111",
    muted: "#666666",
    border: "#e5e5e5",
    danger: "#b3261e",
    scrim: "rgba(0, 0, 0, 0.4)",
  },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24 },
  type: { title: 20, body: 16, caption: 13 },
  radius: { sm: 8 },
  touch: 44,
};
export const captionText: TextStyle = {
  color: theme.colors.muted,
  fontSize: theme.type.caption,
};
export const pickerStyle: ViewStyle = {
  borderColor: theme.colors.muted,
  borderRadius: 0,
};
