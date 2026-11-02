import { useState } from "react";
import { Pressable, ScrollView } from "react-native";
import { Button } from "react-native-paper";
import Icon from "react-native-vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { ThemeView } from "../../components/ThemeView";
import { PageHeader } from "../../components/PageHeader";
import { ListRow } from "../../components/ListRow";
import { ConfirmationDialog } from "../../components/ConfirmationDialog";
import { delCategory } from "../../redux/categoriesSlice";
import { localization } from "../../utils/localization";
import { theme } from "../../utils/theme";
import { defaultCategories } from "./Category";
export function ManageCategories() {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch();
  const categories = useSelector((s: RootState) => s.CategoryList.Categories);
  const { language } = useSelector((s: RootState) => s.settings);
  const [deleting, setDeleting] = useState<number>();
  return (
    <ThemeView>
      <ConfirmationDialog
        visible={deleting !== undefined}
        setVisible={() => setDeleting(undefined)}
        message={localization.ConfirmDeleteCategory[language]}
        onConfirm={() => dispatch(delCategory({ index: deleting }))}
      />
      <PageHeader title={localization.Categories[language]} />
      <ScrollView
        contentContainerStyle={{
          padding: theme.spacing.md,
          gap: theme.spacing.md,
        }}
      >
        {[...defaultCategories, ...categories].map(item => {
          const title = item.name[language] || item.name[0];
          return (
            <ListRow
              key={item.index}
              title={title}
              onPress={() =>
                navigation.navigate("EditCategory", {
                  categoryIndex: item.index,
                })
              }
              right={
                item.index >= defaultCategories.length ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`${localization.Delete[language]}: ${title}`}
                    hitSlop={11}
                    onPress={() => setDeleting(item.index)}
                  >
                    <Icon
                      name="trash-outline"
                      size={22}
                      color={theme.colors.danger}
                    />
                  </Pressable>
                ) : undefined
              }
            />
          );
        })}
        <Button
          mode="outlined"
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
