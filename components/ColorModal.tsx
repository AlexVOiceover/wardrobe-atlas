import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { View, Image, Keyboard, StyleSheet } from "react-native";
import ColorPicker from "react-native-wheel-color-picker";
import { Button, HelperText, TextInput } from "react-native-paper";
import CustomModal from "./CustomModal";
import { localization } from "../utils/localization";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { FilterChip } from "./FilterChip";
import { PhotoColorPicker } from "./PhotoColorPicker";
import { ThemeText } from "./ThemeText";
import { theme } from "../utils/theme";
const HEX_COLOR_PATTERN = /^#([0-9A-F]{3}){1,2}$/i;
const ColorModal = ({
  setVisible,
  visible,
  colors,
  setColors,
  colorSelection,
  image,
}: {
  image?: string;
  colors: string[];
  colorSelection: number;
  setColors: Dispatch<SetStateAction<string[]>>;
  setVisible: Dispatch<SetStateAction<boolean>>;
  visible: boolean;
}) => {
  const initialColor = colors[colorSelection] || "#000000";
  const [draftColor, setDraftColor] = useState(initialColor);
  const [inputValue, setInputValue] = useState(initialColor);
  const storedSettings = useSelector((state: RootState) => state.settings);
  const language = storedSettings.language;
  const [mode, setMode] = useState<"photo" | "wheel">("wheel");
  const isValidHex = HEX_COLOR_PATTERN.test(inputValue);
  const savedColor = colors[colorSelection] || "#000000";
  const hasChanged = draftColor !== savedColor;
  useEffect(() => {
    if (visible) {
      setDraftColor(savedColor);
      setInputValue(savedColor);
      setMode(image ? "photo" : "wheel");
    }
  }, [visible, savedColor, image]);
  const updateDraftColor = (color: string) => {
    setDraftColor(color);
    setInputValue(color);
  };
  const confirmColor = () => {
    if (!isValidHex) {
      return;
    }
    const updatedColors = [...colors];
    updatedColors[colorSelection] = inputValue;
    setColors(updatedColors);
    setVisible(false);
  };
  const handleInputChange = (text: string) => {
    setInputValue(text);
  };
  const syncHexToPicker = () => {
    if (HEX_COLOR_PATTERN.test(inputValue)) {
      setDraftColor(inputValue.toUpperCase());
    }
  };
  return (
    <CustomModal
      visible={visible}
      setVisible={setVisible}
      label={localization.Pick_A_Color[storedSettings.language]}
      minHeight={250}
    >
      <>
        {image && (
          <View style={styles.tabs}>
            <FilterChip
              label={localization.FromPhoto[language]}
              selected={mode === "photo"}
              onPress={() => setMode("photo")}
            />
            <FilterChip
              label={localization.ColorWheel[language]}
              selected={mode === "wheel"}
              onPress={() => setMode("wheel")}
            />
          </View>
        )}
        {mode === "photo" && image ? (
          <View style={styles.photoMode}>
            <PhotoColorPicker image={image} onSample={updateDraftColor} />
            <View style={styles.preview}>
              <View
                style={[styles.previewSwatch, { backgroundColor: draftColor }]}
              />
              <ThemeText>{draftColor}</ThemeText>
            </View>
            <Button
              mode="contained"
              disabled={!isValidHex || !hasChanged}
              onPress={confirmColor}
            >
              {localization.UseColor[language]}
            </Button>
          </View>
        ) : (
          <>
            {/* The photo stays in view to compare with the chosen color. */}
            {image && (
              <View style={styles.compare}>
                <Image
                  accessibilityLabel={localization.Photo[language]}
                  source={{ uri: `data:image/jpeg;base64,${image}` }}
                  style={styles.comparePhoto}
                  resizeMode="contain"
                />
                <View
                  testID="wheel-swatch"
                  style={[
                    styles.compareSwatch,
                    { backgroundColor: draftColor },
                  ]}
                >
                  <ThemeText customStyle={styles.swatchLabel}>
                    {draftColor}
                  </ThemeText>
                </View>
              </View>
            )}
            <View style={[{ height: 280, padding: 16 }]}>
              <ColorPicker
                onInteractionStart={() => Keyboard.dismiss()}
                color={draftColor}
                onColorChange={updateDraftColor}
                thumbSize={40}
                sliderSize={40}
                noSnap={true}
                row={false}
                swatches={false}
                sliderHidden={false}
                wheelHidden={false}
              />
            </View>
            <TextInput
              mode="outlined"
              theme={{ roundness: 0 }}
              label="HEX"
              value={inputValue}
              onChangeText={handleInputChange}
              autoCapitalize="none"
              autoCorrect={false}
              spellCheck={false}
              keyboardType="default"
              right={
                <TextInput.Icon
                  icon="check"
                  disabled={!isValidHex}
                  onPress={syncHexToPicker}
                />
              }
              style={[{ margin: 8 }]}
            />
            <HelperText
              type="error"
              visible={inputValue.length > 0 && !isValidHex}
            >
              {localization.InvalidHex[storedSettings.language]}
            </HelperText>
            <Button
              mode="outlined"
              disabled={!isValidHex || !hasChanged}
              onPress={confirmColor}
              style={[{ margin: 8 }]}
            >
              {localization.Save[storedSettings.language]}
            </Button>
          </>
        )}
      </>
    </CustomModal>
  );
};
export default ColorModal;
const styles = StyleSheet.create({
  tabs: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
  },
  photoMode: {
    gap: theme.spacing.sm,
    padding: theme.spacing.sm,
  },
  preview: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  compare: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
  },
  comparePhoto: {
    width: 96,
    height: 96,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.surface,
  },
  compareSwatch: {
    flex: 1,
    height: 96,
    borderRadius: theme.radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.muted,
    justifyContent: "flex-end",
    padding: theme.spacing.xs,
  },
  // Readable on both light and dark colors
  swatchLabel: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.85)",
    color: "#000000",
    paddingHorizontal: theme.spacing.xs,
    borderRadius: theme.radius.sm,
  },
  previewSwatch: {
    width: 32,
    height: 32,
    borderRadius: theme.radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.muted,
  },
});
