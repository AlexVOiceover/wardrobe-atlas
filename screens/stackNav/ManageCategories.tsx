import { useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { Button } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { ThemeView } from "../../components/ThemeView";
import { ThemeText } from "../../components/ThemeText";
import { PageHeader } from "../../components/PageHeader";
import { EditableNameRow } from "../../components/EditableNameRow";
import { ConfirmationDialog } from "../../components/ConfirmationDialog";
import {
  delCategory,
  renameCategory,
  restoreDefaultCategories,
} from "../../redux/categoriesSlice";
import { clearGarmentCategory } from "../../redux/itemsSlice";
import { visibleCategories } from "../../utils/categories";
import { localization } from "../../utils/localization";
import { theme } from "../../utils/theme";

/** Confirmation text for deleting a category or type used by garments. */
export const deleteMessage = (
  question: string,
  garments: number,
  language: number,
) =>
  garments > 1
    ? `${question}\n${localization.GarmentsMoveToOther[language].replace(
        "{n}",
        String(garments),
      )}`
    : garments === 1
    ? `${question}\n${localization.GarmentMovesToOther[language]}`
    : question;

export function ManageCategories() {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch();
  const categoryState = useSelector((s: RootState) => s.CategoryList);
  const garments = useSelector((s: RootState) => s.itemsList.items);
  const { language } = useSelector((s: RootState) => s.settings);
  const [deleting, setDeleting] = useState<number>();
  const categories = visibleCategories(categoryState, language);
  const affected = garments.filter(g => g.category === deleting).length;
  return (
    <ThemeView>
      <ConfirmationDialog
        visible={deleting !== undefined}
        setVisible={() => setDeleting(undefined)}
        message={deleteMessage(
          localization.ConfirmDeleteCategory[language],
          affected,
          language,
        )}
        onConfirm={() => {
          dispatch(delCategory({ index: deleting }));
          if (affected > 0)
            dispatch(clearGarmentCategory({ category: deleting }));
        }}
      />
      <PageHeader title={localization.Categories[language]} />
      <ScrollView contentContainerStyle={styles.content}>
        {categories.length === 0 && (
          <ThemeText>{localization.NoCategories[language]}</ThemeText>
        )}
        {categories.map(category => (
          <EditableNameRow
            key={category.index}
            label={category.label}
            language={language}
            onPress={() =>
              navigation.navigate("EditCategory", {
                categoryIndex: category.index,
              })
            }
            validate={name =>
              !name
                ? localization.CategoryNameRequired[language]
                : categories.some(
                    other =>
                      other.index !== category.index &&
                      other.label.toLowerCase() === name.toLowerCase(),
                  )
                ? localization.NameTaken[language]
                : undefined
            }
            onRename={name =>
              dispatch(renameCategory({ index: category.index, name }))
            }
            onDelete={() => setDeleting(category.index)}
          />
        ))}
        <Button
          mode="outlined"
          onPress={() =>
            navigation.navigate("CategoryForm", { selectedCategory: -1 })
          }
        >
          {localization.Add_New_Category[language]}
        </Button>
        <Button onPress={() => dispatch(restoreDefaultCategories())}>
          {localization.RestoreDefaultCategories[language]}
        </Button>
      </ScrollView>
    </ThemeView>
  );
}
const styles = StyleSheet.create({
  content: {
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
});
