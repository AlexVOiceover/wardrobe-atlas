import type { TextStyle, ViewStyle } from "react-native";
export const theme = {
  colors: {
    background: "#ffffff",
    surface: "#f5f5f5",
    text: "#111111",
    muted: "#666666",
    border: "#e5e5e5",
    // Outlines that must stay visible on white (≥3:1), e.g. unselected chips.
    outline: "#8a8a8a",
    danger: "#b3261e",
    scrim: "rgba(0, 0, 0, 0.4)",
    // Header, tab bar and add button
    bar: "#1f4e5a",
    onBar: "#ffffff",
    onBarMuted: "rgba(255, 255, 255, 0.65)",
  },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24 },
  type: { title: 20, body: 16, caption: 13 },
  radius: { sm: 8 },
  touch: 48,
};
export const captionText: TextStyle = {
  color: theme.colors.muted,
  fontSize: theme.type.caption,
};
export const pickerStyle: ViewStyle = {
  borderColor: theme.colors.muted,
  borderRadius: 0,
};
