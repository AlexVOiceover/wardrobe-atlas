import { ScrollView, View } from "react-native";
import { Button } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { ThemeView } from "../../components/ThemeView";
import { BackButton } from "../../components/BackButton";
import { delCategory } from "../../redux/categoriesSlice";
import { localization } from "../../utils/localization";
export const defaultCategories = [
  localization.Tops,
  localization.Bottoms,
  localization.Shoes,
  localization.Accessories,
].map((name, index) => ({
  name,
  index,
  screen: "ItemForm",
  spriteSheet: null,
}));
export function Category() {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch();
  const categories = useSelector((s: RootState) => s.CategoryList.Categories);
  const { language } = useSelector((s: RootState) => s.settings);
  return (
    <ThemeView>
      <BackButton />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        {[...defaultCategories, ...categories].map(item => (
          <View key={item.index} style={{ borderWidth: 1, padding: 8, gap: 8 }}>
            <Button
              onPress={() =>
                navigation.navigate("ModeScreen", {
                  screenName: item.screen,
                  selectedCategory: item.index,
                })
              }
            >
              {item.name[language] || item.name[0]}
            </Button>
            <Button
              onPress={() =>
                navigation.navigate("EditCategory", {
                  categoryIndex: item.index,
                })
              }
            >
              Edit
            </Button>
            {item.index >= 4 && (
              <Button
                onPress={() => dispatch(delCategory({ index: item.index }))}
              >
                Delete
              </Button>
            )}
          </View>
        ))}
        <Button
          onPress={() =>
            navigation.navigate("CategoryForm", { selectedCategory: -1 })
          }
        >
          {localization.Add_New_Category[language]}
        </Button>
      </ScrollView>
    </ThemeView>
  );
}
