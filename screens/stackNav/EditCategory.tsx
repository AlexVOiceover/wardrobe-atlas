import { Keyboard, StyleSheet, Text, View, FlatList } from "react-native";
import { ThemeView } from "../../components/ThemeView";
import { clothesList, localization } from "../../utils/localization";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { BackButton } from "../../components/BackButton";
import { useEffect, useState } from "react";
import { CustomInput } from "../../components/CustomInput";
import { Button } from "react-native-paper";
import { addTypeToCategory } from "../../redux/categoriesSlice";
import { EditItemList } from "../../components/EditItemList";
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
      errors.push("Please enter a name for this Type");
    }
    if (newType.length > 20) {
      errors.push("Please enter a name within 20 characters max");
    }
    if (allList?.find(x => x.label.toLowerCase() === newType.toLowerCase())) {
      errors.push("Please enter a different name");
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
      <BackButton
        pageTitle={localization.Edit_Category[storedSettings.language]}
      />
      <View
        style={[
          {
            flexDirection: "column",
            alignItems: "center",
            rowGap: 12,
            marginTop: 16,
          },
        ]}
      >
        <CustomInput
          mode="outlined"
          textContentType="name"
          style={styles.customWidth}
          label={localization.Add_Type[storedSettings.language]}
          value={newType}
          onChange={(text: any) => setNewType(text.nativeEvent.text)}
        />
        {errorsList.length > 0 && (
          <View>
            {errorsList.map((error, index) => {
              return (
                <Text key={index} style={[{}]}>
                  {error}
                </Text>
              );
            })}
          </View>
        )}
        <Button
          mode="outlined"
          onPress={() => {
            addTypeHandler(categoryIndex, catData);
            Keyboard.dismiss();
          }}
          style={[{ marginHorizontal: 40, marginVertical: 20 }]}
        >
          {localization.Save[storedSettings.language]}
        </Button>
      </View>
      <FlatList
        numColumns={1}
        extraData={refresh}
        data={catData}
        renderItem={({ item, index }) => (
          <View
            style={{
              display: "flex",
              flex: 1,
              alignItems: "center",
            }}
          >
            {/* <CategoryItem key={index} type={item} /> */}
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
          </View>
        )}
      />
      <View />
    </ThemeView>
  );
};
const styles = StyleSheet.create({
  customWidth: { width: "80%" },
});
