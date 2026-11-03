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
import { visibleCategories } from "../../utils/categories";
export function Category() {
  const navigation = useNavigation<any>();
  const categoryState = useSelector((s: RootState) => s.CategoryList);
  const { language } = useSelector((s: RootState) => s.settings);
  const [bulk, setBulk] = useState(false);
  const categories = visibleCategories(categoryState, language);
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
        {categories.length === 0 && (
          <ListRow
            title={localization.NoCategories[language]}
            onPress={() => navigation.navigate("ManageCategories")}
          />
        )}
        {categories.map(item => (
          <ListRow
            key={item.index}
            title={item.label}
            onPress={() =>
              navigation.navigate(bulk ? "BulkModeForm" : "ItemForm", {
                selectedCategory: item.index,
              })
            }
          />
        ))}
      </ScrollView>
    </ThemeView>
  );
}
