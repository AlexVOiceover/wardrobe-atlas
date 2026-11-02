import { View } from "react-native";
import { Button } from "react-native-paper";
import { ThemeView } from "../../components/ThemeView";
import { BackButton } from "../../components/BackButton";
import { localization } from "../../utils/localization";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
export const ModeScreen = ({
  navigation,
  route,
}: {
  navigation: any;
  route: any;
}) => {
  const { selectedCategory, screenName } = route.params;
  const { language } = useSelector((s: RootState) => s.settings);
  return (
    <ThemeView>
      <BackButton />
      <View style={{ padding: 16, gap: 16 }}>
        <Button
          mode="outlined"
          onPress={() => navigation.navigate(screenName, { selectedCategory })}
        >
          {localization.addSingleItem[language]}
        </Button>
        <Button
          mode="outlined"
          onPress={() =>
            navigation.navigate("BulkModeForm", { selectedCategory })
          }
        >
          {localization.addMultiItems[language]}
        </Button>
      </View>
    </ThemeView>
  );
};
