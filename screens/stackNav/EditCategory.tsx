import { Keyboard, StyleSheet, View, FlatList } from "react-native";
import { ThemeView } from "../../components/ThemeView";
import { localization } from "../../utils/localization";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { PageHeader } from "../../components/PageHeader";
import { useState } from "react";
import { CustomInput } from "../../components/CustomInput";
import { Button } from "react-native-paper";
import {
  addTypeToCategory,
  deleteType,
  renameType,
} from "../../redux/categoriesSlice";
import { clearGarmentType } from "../../redux/itemsSlice";
import { EditableNameRow } from "../../components/EditableNameRow";
import { ConfirmationDialog } from "../../components/ConfirmationDialog";
import { FormErrors } from "../../components/FormErrors";
import { categoryLabel, categoryTypes } from "../../utils/categories";
import { deleteMessage } from "./ManageCategories";
import { theme } from "../../utils/theme";
export const EditCategory = ({ route }: { navigation: any; route: any }) => {
  const { categoryIndex } = route.params;
  const { language } = useSelector((state: RootState) => state.settings);
  const categoryState = useSelector((state: RootState) => state.CategoryList);
  const garments = useSelector((state: RootState) => state.itemsList.items);
  const [errorsList, setErrorsList] = useState<string[]>([]);
  const [newType, setNewType] = useState("");
  const [deleting, setDeleting] = useState<string>();
  const dispatch = useDispatch();
  const types = categoryTypes(categoryState, categoryIndex, language);
  const affected = garments.filter(
    g => g.category === categoryIndex && g.type === deleting,
  ).length;
  const nameError = (name: string, value?: string) =>
    !name
      ? localization.TypeNameRequired[language]
      : types.some(
          type =>
            type.value !== value &&
            type.label.toLowerCase() === name.toLowerCase(),
        )
      ? localization.NameTaken[language]
      : undefined;
  function addTypeHandler() {
    const error = nameError(newType.trim());
    if (error) {
      setErrorsList([error]);
      return;
    }
    setErrorsList([]);
    dispatch(
      addTypeToCategory({ index: categoryIndex, typeName: newType.trim() }),
    );
    setNewType("");
  }
  return (
    <ThemeView>
      <ConfirmationDialog
        visible={deleting !== undefined}
        setVisible={() => setDeleting(undefined)}
        message={deleteMessage(
          localization.ConfirmDeleteType[language],
          affected,
          language,
        )}
        onConfirm={() => {
          dispatch(deleteType({ category: categoryIndex, value: deleting }));
          if (affected > 0)
            dispatch(
              clearGarmentType({ category: categoryIndex, value: deleting }),
            );
        }}
      />
      <PageHeader
        title={
          categoryLabel(categoryState, categoryIndex, language) ??
          localization.Edit_Category[language]
        }
      />
      <View style={styles.form}>
        <CustomInput
          mode="outlined"
          textContentType="name"
          label={localization.Add_Type[language]}
          value={newType}
          onChangeText={setNewType}
        />
        <FormErrors errors={errorsList} />
        <Button
          mode="contained"
          onPress={() => {
            addTypeHandler();
            Keyboard.dismiss();
          }}
        >
          {localization.Save[language]}
        </Button>
      </View>
      <FlatList
        contentContainerStyle={styles.list}
        data={types}
        keyExtractor={type => type.value}
        renderItem={({ item: type }) => (
          <EditableNameRow
            label={type.label}
            language={language}
            validate={name => nameError(name, type.value)}
            onRename={name =>
              dispatch(
                renameType({
                  category: categoryIndex,
                  value: type.value,
                  name,
                }),
              )
            }
            onDelete={() => setDeleting(type.value)}
          />
        )}
      />
    </ThemeView>
  );
};
const styles = StyleSheet.create({
  form: {
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  list: {
    padding: theme.spacing.md,
  },
});
