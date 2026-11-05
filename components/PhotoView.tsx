import {
  ActivityIndicator,
  Image,
  Modal,
  StyleSheet,
  View,
} from "react-native";
import { Button } from "react-native-paper";
import { localization } from "../utils/localization";
import { theme } from "../utils/theme";
import { HeaderIcon } from "./PageHeader";
import { ThemeText } from "./ThemeText";
/**
 * The garment's photo on the whole screen, with everything that can be done
 * to it as labelled buttons. Buttons left out (undefined handlers) don't show.
 */
export function PhotoView({
  visible,
  image,
  language,
  cutoutLabel,
  busy,
  message,
  onCutout,
  onFix,
  onChange,
  onRemove,
  onClose,
}: {
  visible: boolean;
  image: string;
  language: number;
  // Says what the cut-out button does: remove the background, keep only the
  // garment, or undo.
  cutoutLabel: string;
  busy: boolean;
  // A cut-out error, shown in red.
  message?: string;
  onCutout?: () => void;
  onFix?: () => void;
  onChange: () => void;
  onRemove: () => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} animationType="none" onRequestClose={onClose}>
      <View style={styles.screen}>
        <View style={styles.bar}>
          <HeaderIcon
            name="close"
            label={localization.Close[language]}
            onPress={onClose}
          />
          <ThemeText numberOfLines={1} customStyle={styles.title}>
            {localization.Photo[language]}
          </ThemeText>
        </View>
        <View style={styles.frame}>
          {image !== "" && (
            <Image
              accessibilityLabel={localization.Photo[language]}
              source={{ uri: `data:image/*;base64,${image}` }}
              style={StyleSheet.absoluteFill}
              resizeMode="contain"
            />
          )}
          {busy && (
            <View pointerEvents="none" style={styles.busy}>
              <ActivityIndicator color={theme.colors.background} />
            </View>
          )}
        </View>
        <View style={styles.actions}>
          {!!message && (
            <ThemeText
              accessibilityLiveRegion="polite"
              customStyle={styles.message}
            >
              {message}
            </ThemeText>
          )}
          <Button mode="outlined" onPress={onChange}>
            {localization.ChangePhoto[language]}
          </Button>
          {onCutout && (
            <Button mode="outlined" disabled={busy} onPress={onCutout}>
              {cutoutLabel}
            </Button>
          )}
          {onFix && (
            <Button mode="outlined" disabled={busy} onPress={onFix}>
              {localization.FixCutout[language]}
            </Button>
          )}
          <Button
            mode="outlined"
            textColor={theme.colors.danger}
            disabled={busy}
            onPress={onRemove}
          >
            {localization.RemovePhoto[language]}
          </Button>
        </View>
      </View>
    </Modal>
  );
}
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    height: 56,
    paddingHorizontal: theme.spacing.xs,
    backgroundColor: theme.colors.bar,
  },
  title: {
    flex: 1,
    color: theme.colors.onBar,
    fontSize: theme.type.title,
    fontWeight: "600",
  },
  // Grey shows through where a cut-out has no background.
  frame: {
    flex: 1,
    margin: theme.spacing.md,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.surface,
    overflow: "hidden",
  },
  busy: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
  },
  actions: {
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.md,
  },
  message: {
    color: theme.colors.danger,
    fontSize: theme.type.caption,
  },
});
