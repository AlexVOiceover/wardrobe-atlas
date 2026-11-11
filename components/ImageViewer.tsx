import { localization } from "../utils/localization";
import { useSelector } from "react-redux";
import type { RootState } from "../redux/store";
import { Image, Pressable, StyleSheet } from "react-native";
import { theme } from "../utils/theme";
import { ThemeText } from "./ThemeText";
import { photoUri } from "../utils/photoStore";
/**
 * The garment's photo. It is `width` wide and fills the height its parent
 * gives it, never shorter than a square. A tap adds a photo, or opens the
 * one there.
 */
export const ImageViewer = ({
  imageUrl,
  onPress,
  width = 160,
  fit = "cover",
}: {
  width?: number;
  // "contain" shows the whole image, for cut-outs on a plain background.
  fit?: "cover" | "contain";
  imageUrl: string;
  onPress: () => void;
}) => {
  const language = useSelector((s: RootState) => s.settings.language);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        imageUrl !== ""
          ? localization.ViewPhoto[language]
          : localization.ChoosePhoto[language]
      }
      onPress={onPress}
      style={{
        width,
        flexGrow: 1,
        minHeight: width,
        borderRadius: theme.radius.sm,
        overflow: "hidden",
        backgroundColor: theme.colors.surface,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {imageUrl !== "" ? (
        // Out of the layout, so the photo's own size can't stretch the frame.
        <Image
          source={{ uri: photoUri(imageUrl) }}
          style={[StyleSheet.absoluteFill, { resizeMode: fit }]}
        />
      ) : (
        <ThemeText>{localization.AddPhoto[language]}</ThemeText>
      )}
    </Pressable>
  );
};
