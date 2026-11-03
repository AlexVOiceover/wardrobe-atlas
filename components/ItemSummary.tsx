import { localization } from "../utils/localization";
import useHeatmap from "../hooks/useHeatmap";
import { useSelector } from "react-redux";
import type { RootState } from "../redux/store";
import { Image, StyleSheet, View } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import type { ItemSummaryProps } from "./ItemBox";
import { captionText, theme } from "../utils/theme";
import { ThemeText } from "./ThemeText";
export function ItemSummary({
  image,
  name,
  type,
  primary,
  secondary,
  tertiary,
  logs,
}: ItemSummaryProps) {
  const recency = useHeatmap(logs || []);
  const language = useSelector((s: RootState) => s.settings.language);
  const showRecency = useSelector((s: RootState) => s.settings.enableHeatMap);
  const swatches = [primary, secondary, tertiary].filter(Boolean);
  return (
    <View style={styles.card}>
      {image ? (
        <Image
          accessibilityLabel={name}
          source={{ uri: `data:image/*;base64,${image}` }}
          style={styles.photo}
        />
      ) : (
        <View style={[styles.photo, styles.placeholder]}>
          <Icon name="shirt-outline" size={32} color={theme.colors.muted} />
        </View>
      )}
      <ThemeText numberOfLines={2} customStyle={styles.name}>
        {name}
      </ThemeText>
      {!!type && (
        <ThemeText numberOfLines={1} customStyle={captionText}>
          {type}
        </ThemeText>
      )}
      <View style={styles.meta}>
        {swatches.map((color, index) => (
          <View
            key={index}
            style={[styles.swatch, { backgroundColor: color }]}
          />
        ))}
        {logs && (
          <ThemeText customStyle={captionText}>
            {localization.Uses[language]}: {logs.length}
          </ThemeText>
        )}
      </View>
      {showRecency && logs && (
        <ThemeText customStyle={captionText}>{recency}</ThemeText>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  card: {
    gap: theme.spacing.xs,
  },
  photo: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.surface,
    resizeMode: "cover",
  },
  placeholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  name: {
    fontWeight: "500",
  },
  meta: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: theme.spacing.xs,
  },
  swatch: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.muted,
  },
});
