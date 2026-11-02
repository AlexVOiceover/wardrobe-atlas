import { Dispatch, SetStateAction } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { ThemeText } from "./ThemeText";
import { colorNames } from "../utils/localization";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { theme } from "../utils/theme";
const basicColors: { [key: string]: string } = {
  yellow: "#FEFD00",
  yellow_Orange: "#F8A900",
  yellow_Green: "#48FE00",
  orange: "#F67300",
  green: "#206F00",
  red_Orange: "#F53C00",
  blue_Green: "#31A6A6",
  red: "#F40000",
  blue: "#1420FF",
  red_Violet: "#BE0FAA",
  blue_Violet: "#66169F",
  violet: "#AC1DFF",
  black: "#000",
  white: "#fff",
  gray: "#808080",
  unknown: "",
};
const ColorFilter = ({
  colors,
  setColors,
}: {
  colors: string[];
  setColors: Dispatch<SetStateAction<string[]>>;
}) => {
  const language = useSelector((state: RootState) => state.settings.language);
  return (
    <View style={styles.grid}>
      {Object.keys(basicColors).map(name => {
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
              style={[styles.swatch, { backgroundColor: basicColors[name] }]}
            >
              {name === "unknown" && <ThemeText>?</ThemeText>}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
};
export default ColorFilter;
const styles = StyleSheet.create({
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
});
