import { Keyboard, StyleSheet, View, FlatList } from "react-native";
import { ThemeView } from "../../components/ThemeView";
import { clothesList, localization } from "../../utils/localization";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { PageHeader } from "../../components/PageHeader";
import { useEffect, useState } from "react";
import { CustomInput } from "../../components/CustomInput";
import { Button } from "react-native-paper";
import { addTypeToCategory } from "../../redux/categoriesSlice";
import { EditItemList } from "../../components/EditItemList";
import { FormErrors } from "../../components/FormErrors";
import { theme } from "../../utils/theme";
export const EditCategory = ({ route }: { navigation: any; route: any }) => {
  const { categoryIndex } = route.params;
  const storedSettings = useSelector((state: RootState) => state.settings);
  const [refresh, setRefresh] = useState(false);
  const [catData, setCatData] = useState<any>([]);
  const [errorsList, setErrorsList] = useState<string[]>([]);
  const [newType, setNewType] = useState("");
  const dispatch = useDispatch();
  const storedCatTypes = useSelector(
    (state: RootState) => state.CategoryList?.CategoryCustomTypes ?? [],
  );
  useEffect(() => {
    try {
      setCatData([
        ...clothesList[storedSettings.language][categoryIndex],
        ...(storedCatTypes[categoryIndex]?.customTypes || []),
      ]);
    } catch {
      setCatData(storedCatTypes[categoryIndex]?.customTypes);
    }
  }, [refresh, storedCatTypes, categoryIndex, storedSettings.language]);
  function addTypeHandler(index: number, allList: any[]) {
    const errors = [];
    if (newType.length <= 0) {
      errors.push(localization.TypeNameRequired[storedSettings.language]);
    }
    if (newType.length > 20) {
      errors.push(localization.NameTooLong[storedSettings.language]);
    }
    if (allList?.find(x => x.label.toLowerCase() === newType.toLowerCase())) {
      errors.push(localization.NameTaken[storedSettings.language]);
    }
    if (errors.length > 0) {
      setErrorsList(errors);
      return;
    }
    setErrorsList([]);
    dispatch(
      addTypeToCategory({
        index: index,
        typeName: newType,
      }),
    );
    setNewType("");
  }
  return (
    <ThemeView>
      <PageHeader title={localization.Edit_Category[storedSettings.language]} />
      <View style={styles.form}>
        <CustomInput
          mode="outlined"
          textContentType="name"
          label={localization.Add_Type[storedSettings.language]}
          value={newType}
          onChange={(text: any) => setNewType(text.nativeEvent.text)}
        />
        <FormErrors errors={errorsList} />
        <Button
          mode="contained"
          onPress={() => {
            addTypeHandler(categoryIndex, catData);
            Keyboard.dismiss();
          }}
        >
          {localization.Save[storedSettings.language]}
        </Button>
      </View>
      <FlatList
        contentContainerStyle={styles.list}
        extraData={refresh}
        data={catData}
        renderItem={({ item, index }) => (
          <EditItemList
            item={item}
            setRefresh={setRefresh}
            CollectionsState={catData}
            isCatType={true}
            catIndex={categoryIndex}
            ignoreNum={
              clothesList[storedSettings.language][categoryIndex]?.length
            }
            currentIndex={index}
            key={index}
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
