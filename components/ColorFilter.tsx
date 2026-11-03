import { Dispatch, SetStateAction } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { ThemeText } from "./ThemeText";
import { colorNames } from "../utils/localization";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { captionText, theme } from "../utils/theme";
import { clothingColors, NO_COLOR } from "../utils/colors";
const filterColors = [...Object.keys(clothingColors), NO_COLOR];
const ColorFilter = ({
  colors,
  setColors,
}: {
  colors: string[];
  setColors: Dispatch<SetStateAction<string[]>>;
}) => {
  const language = useSelector((state: RootState) => state.settings.language);
  const selectedNames = filterColors
    .filter(name => colors.includes(name))
    .map(name => colorNames[language][name]);
  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {filterColors.map(name => {
          const selected = colors.includes(name);
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={colorNames[language][name]}
              accessibilityState={{ selected }}
              onPress={() =>
                setColors(prev =>
                  prev.includes(name)
                    ? prev.filter(color => color !== name)
                    : [...prev, name],
                )
              }
              key={name}
              style={[styles.cell, selected && styles.selected]}
            >
              <View
                style={[
                  styles.swatch,
                  name === NO_COLOR
                    ? styles.noColor
                    : { backgroundColor: clothingColors[name] },
                ]}
              >
                {name === NO_COLOR && <ThemeText>?</ThemeText>}
              </View>
            </Pressable>
          );
        })}
      </View>
      {selectedNames.length > 0 && (
        <ThemeText customStyle={captionText}>
          {selectedNames.join(", ")}
        </ThemeText>
      )}
    </View>
  );
};
export default ColorFilter;
const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.sm,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs,
  },
  cell: {
    width: theme.touch,
    height: theme.touch,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  selected: {
    borderColor: theme.colors.text,
  },
  swatch: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.muted,
  },
  noColor: {
    borderStyle: "dashed",
    borderWidth: 1,
  },
});
