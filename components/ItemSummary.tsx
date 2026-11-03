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
  density = "full",
  stored = false,
  selected,
}: ItemSummaryProps) {
  const recency = useHeatmap(logs || []);
  const language = useSelector((s: RootState) => s.settings.language);
  const showRecency = useSelector((s: RootState) => s.settings.enableHeatMap);
  const swatches = [primary, secondary, tertiary].filter(Boolean);
  return (
    <View style={styles.card}>
      <View style={[styles.frame, selected && styles.selectedFrame]}>
        {/* Stored garments are faded and carry a box icon. */}
        <View style={stored && styles.faded}>
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
        </View>
        {stored && (
          <View
            accessibilityLabel={localization.InStorage[language]}
            style={[styles.badge, styles.storedBadge]}
          >
            <Icon name="archive-outline" size={14} color={theme.colors.text} />
          </View>
        )}
        {selected !== undefined && (
          <View style={[styles.badge, styles.selectBadge]}>
            <Icon
              name={selected ? "checkmark-circle" : "ellipse-outline"}
              size={24}
              color={selected ? theme.colors.bar : theme.colors.background}
            />
          </View>
        )}
      </View>
      {density !== "photo" && (
        <ThemeText
          numberOfLines={density === "full" ? 2 : 1}
          customStyle={[styles.name, density === "name" && styles.smallName]}
        >
          {name}
        </ThemeText>
      )}
      {density === "full" && (
        <>
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
        </>
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
  frame: {
    borderRadius: theme.radius.sm,
    borderWidth: 2,
    borderColor: "transparent",
  },
  selectedFrame: {
    borderColor: theme.colors.bar,
  },
  faded: {
    opacity: 0.45,
  },
  badge: {
    position: "absolute",
    top: theme.spacing.xs,
    justifyContent: "center",
    alignItems: "center",
  },
  storedBadge: {
    left: theme.spacing.xs,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: theme.colors.background,
  },
  selectBadge: {
    right: theme.spacing.xs,
    borderRadius: 12,
    backgroundColor: "rgba(0, 0, 0, 0.25)",
  },
  placeholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  name: {
    fontWeight: "500",
  },
  smallName: {
    fontSize: theme.type.caption,
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
