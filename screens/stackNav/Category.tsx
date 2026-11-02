import { useState } from "react";
import { ScrollView } from "react-native";
import { Switch } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { ThemeView } from "../../components/ThemeView";
import { PageHeader } from "../../components/PageHeader";
import { ListRow } from "../../components/ListRow";
import { localization } from "../../utils/localization";
import { theme } from "../../utils/theme";
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
  const categories = useSelector((s: RootState) => s.CategoryList.Categories);
  const { language } = useSelector((s: RootState) => s.settings);
  const [bulk, setBulk] = useState(false);
  return (
    <ThemeView>
      <PageHeader title={localization.ChooseCategory[language]} />
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: theme.spacing.md }}
      >
        <ListRow
          title={localization.addMultiItems[language]}
          right={<Switch value={bulk} onValueChange={setBulk} />}
        />
        {[...defaultCategories, ...categories].map(item => (
          <ListRow
            key={item.index}
            title={item.name[language] || item.name[0]}
            onPress={() =>
              navigation.navigate(bulk ? "BulkModeForm" : item.screen, {
                selectedCategory: item.index,
              })
            }
          />
        ))}
      </ScrollView>
    </ThemeView>
  );
}
