// import { useNavigation } from "@react-navigation/native";
import { StyleSheet, Text, View } from "react-native";
import { Button } from "react-native-paper";
import { useState } from "react";
import { BackButton } from "../../components/BackButton";
import { ThemeView } from "../../components/ThemeView";
import { CustomInput } from "../../components/CustomInput";
// import { TouchableOpacity } from "react-native-gesture-handler";
import ColorModal from "../../components/ColorModal";
import { useDispatch, useSelector } from "react-redux";
import { addCategory } from "../../redux/categoriesSlice";
import { CommonActions } from "@react-navigation/native";
import { localization } from "../../utils/localization";
import { RootState } from "../../redux/store";
export const CategoryForm = ({ navigation }: { navigation: any }) => {
  // const navigation = useNavigation<any>();
  const [name, setName] = useState("");
  const [visible, setVisible] = useState(false);
  const [colors, setColors] = useState([""]);
  const storedSettings = useSelector((state: RootState) => state.settings);
  const [errorsList, setErrorsList] = useState<string[]>([]);
  const dispatch = useDispatch();
  async function addCategoryHandler() {
    const errors = [];
    if (name.length <= 0) {
      errors.push("Please enter a name for this Category");
    }
    if (errors.length > 0) {
      setErrorsList(errors);
      return;
    }
    setErrorsList([]);
    dispatch(
      addCategory({
        name: name,
      }),
    );
    // navigation.popToTop("Category");
    navigation.dispatch(CommonActions.goBack());
  }
  return (
    <>
      <ColorModal
        colors={colors}
        setColors={setColors}
        visible={visible}
        setVisible={setVisible}
        colorSelection={0}
      />
      <ThemeView>
        <BackButton
          pageTitle={localization.Add_a_Category[storedSettings.language]}
        />

        <View
          style={[
            { flexDirection: "column", alignItems: "center", rowGap: 12 },
          ]}
        >
          <CustomInput
            mode="outlined"
            textContentType="name"
            style={[
              styles.customWidth,
              {
                textAlign: storedSettings.language == 1 ? "right" : "left",
              },
            ]}
            label={localization.Category_Name[storedSettings.language]}
            value={name}
            onChange={text => setName(text.nativeEvent.text)}
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
        </View>

        <Button
          // className="mb-5"
          mode="outlined"
          onPress={addCategoryHandler}
          style={[{ marginHorizontal: 40, marginVertical: 20 }]}
        >
          {localization.Save[storedSettings.language]}
        </Button>
      </ThemeView>
    </>
  );
};
export const styles = StyleSheet.create({
  customWidth: { width: "80%" },
});
