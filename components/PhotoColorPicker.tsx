import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  GestureResponderEvent,
  Image,
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { getSegmentsAverageColor } from "@somesoap/react-native-image-palette";
import ReactNativeBlobUtil from "react-native-blob-util";
import { useSelector } from "react-redux";
import type { RootState } from "../redux/store";
import { localization } from "../utils/localization";
import { normalizeHex, sampleSegment } from "../utils/photoColor";
import { captionText, theme } from "../utils/theme";
import { ThemeText } from "./ThemeText";

/** Tap on the garment photo to sample a color from that spot. */
export const PhotoColorPicker = ({
  image,
  onSample,
}: {
  image: string;
  onSample: (color: string) => void;
}) => {
  const language = useSelector((s: RootState) => s.settings.language);
  const [aspectRatio, setAspectRatio] = useState(1);
  const [available, setAvailable] = useState(0);
  const [marker, setMarker] = useState<{ x: number; y: number }>();
  const [sampling, setSampling] = useState(false);
  const [failed, setFailed] = useState(false);
  const file = useRef<string | undefined>(undefined);
  const uri = `data:image/jpeg;base64,${image}`;

  useEffect(() => {
    Image.getSize(
      uri,
      (width, height) => height > 0 && setAspectRatio(width / height),
      () => setAspectRatio(1),
    );
    setMarker(undefined);
    setFailed(false);
    // The palette library reads files, so the photo is written to the cache
    // on first tap and removed when the photo changes or the picker closes.
    return () => {
      const path = file.current;
      file.current = undefined;
      if (path) {
        ReactNativeBlobUtil.fs.unlink(path).catch(() => {});
      }
    };
  }, [uri]);

  const photoFile = async () => {
    if (!file.current) {
      const path = `${
        ReactNativeBlobUtil.fs.dirs.CacheDir
      }/picker_${Date.now()}.jpg`;
      await ReactNativeBlobUtil.fs.writeFile(path, image, "base64");
      file.current = path;
    }
    return `file://${file.current}`;
  };

  // The photo box matches the image exactly, so tap positions map onto it.
  const width = Math.min(available, MAX_HEIGHT * aspectRatio);
  const size = { width, height: width / aspectRatio };

  const sample = async (event: GestureResponderEvent) => {
    const { locationX: x, locationY: y } = event.nativeEvent;
    if (!size.width || !size.height) {
      return;
    }
    setMarker({ x, y });
    setSampling(true);
    setFailed(false);
    try {
      const [color] = await getSegmentsAverageColor(await photoFile(), [
        sampleSegment(x, y, size.width, size.height),
      ]);
      onSample(normalizeHex(color));
    } catch (error) {
      console.log("photo color error:", error);
      setFailed(true);
    } finally {
      setSampling(false);
    }
  };

  return (
    <View
      style={styles.container}
      onLayout={(event: LayoutChangeEvent) =>
        setAvailable(event.nativeEvent.layout.width)
      }
    >
      <Pressable
        accessibilityRole="imagebutton"
        accessibilityLabel={localization.TapPhotoForColor[language]}
        onPress={sample}
        style={[styles.photo, size]}
      >
        <Image source={{ uri }} style={styles.image} />
        {marker && (
          <View
            pointerEvents="none"
            style={[
              styles.marker,
              { left: marker.x - MARKER / 2, top: marker.y - MARKER / 2 },
            ]}
          >
            <View style={styles.markerInner} />
          </View>
        )}
        {sampling && (
          <ActivityIndicator style={styles.loading} color={theme.colors.bar} />
        )}
      </Pressable>
      <ThemeText
        customStyle={[captionText, failed && { color: theme.colors.danger }]}
      >
        {failed
          ? localization.PhotoColorFailed[language]
          : localization.TapPhotoForColor[language]}
      </ThemeText>
    </View>
  );
};
const MARKER = 24;
const MAX_HEIGHT = 280;
const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.sm,
  },
  photo: {
    alignSelf: "center",
    backgroundColor: theme.colors.surface,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  marker: {
    position: "absolute",
    width: MARKER,
    height: MARKER,
    borderRadius: MARKER / 2,
    // Dark outer ring and white inner ring stay visible on any garment
    borderWidth: 2,
    borderColor: theme.colors.text,
  },
  markerInner: {
    flex: 1,
    borderRadius: MARKER / 2,
    borderWidth: 2,
    borderColor: theme.colors.onBar,
  },
  loading: {
    position: "absolute",
    top: theme.spacing.sm,
    right: theme.spacing.sm,
  },
});
