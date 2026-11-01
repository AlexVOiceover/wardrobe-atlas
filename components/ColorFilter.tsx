import { Dispatch, SetStateAction } from "react";
import { TouchableOpacity, View } from "react-native";
import { ThemeText } from "./ThemeText";
import { Text } from "react-native-paper";
import { localization } from "../utils/localization";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
const ColorFilter = ({
  colors,
  setColors,
}: {
  colors: string[];
  setColors: Dispatch<SetStateAction<string[]>>;
}) => {
  const basicColors: {
    [key: string]: string;
  } = {
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
  const storedSettings = useSelector((state: RootState) => state.settings);
  return (
    <View>
      <ThemeText
        customStyle={[{ alignSelf: "center", marginTop: 4, marginVertical: 4 }]}
      >
        {localization.FilterByColor[storedSettings.language]}
      </ThemeText>
      <View style={[{ flexDirection: "row", flexWrap: "wrap", width: "100%" }]}>
        {Object.keys(basicColors).map(name => (
          <TouchableOpacity
            onPress={() => {
              if (!colors.includes(name)) {
                setColors(prev => [...prev, name]);
              } else {
                setColors(prev => prev.filter(color => color !== name));
              }
            }}
            key={name}
            style={[
              [
                {
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  width: 64,
                  height: 64,
                  margin: 4,
                },
                colors.includes(name) ? { borderWidth: 3 } : {},
                {},
              ],
            ]}
          >
            <Text
              style={{
                fontSize: 9,
                textTransform: "capitalize",
                color: "#111111",
              }}
            >
              {name}
            </Text>
            <View
              style={[
                { width: 40, height: 40 },
                { backgroundColor: basicColors[name] },
              ]}
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};
export default ColorFilter;
