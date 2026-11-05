import { Image, StyleSheet, View } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { theme } from "../utils/theme";

/** A garment's square photo, or a shirt where it has none. */
export function GarmentPhoto({
  image,
  size,
  label,
}: {
  image: string;
  size: number;
  label?: string;
}) {
  const frame = [styles.photo, { width: size, height: size }];
  return image ? (
    <View accessibilityLabel={label} style={frame}>
      <Image
        source={{ uri: `data:image/*;base64,${image}` }}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      />
    </View>
  ) : (
    <View accessibilityLabel={label} style={[frame, styles.placeholder]}>
      <Icon
        name="shirt-outline"
        size={size * 0.45}
        color={theme.colors.muted}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  photo: {
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.surface,
    overflow: "hidden",
  },
  placeholder: {
    justifyContent: "center",
    alignItems: "center",
  },
});
