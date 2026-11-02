import { View } from "react-native";
import { Button } from "react-native-paper";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { localization } from "../../utils/localization";
import { ThemeView } from "../../components/ThemeView";
import { BackButton } from "../../components/BackButton";
export const AddNewCloths = ({ navigation }: { navigation: any }) => {
  const { language } = useSelector((state: RootState) => state.settings);
  return (
    <ThemeView>
      <BackButton />
      <View style={{ padding: 16, gap: 16 }}>
        <Button mode="outlined" onPress={() => navigation.navigate("Category")}>
          {localization.Add_a_new[language]}
        </Button>
        <Button
          mode="outlined"
          onPress={() => navigation.navigate("ItemSelector")}
        >
          {localization.Record_a_log[language]}
        </Button>
      </View>
    </ThemeView>
  );
};
