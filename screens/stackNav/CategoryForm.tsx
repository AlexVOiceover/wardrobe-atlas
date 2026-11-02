import { StyleSheet, View } from "react-native";
import { Button } from "react-native-paper";
import { useState } from "react";
import { PageHeader } from "../../components/PageHeader";
import { ThemeView } from "../../components/ThemeView";
import { CustomInput } from "../../components/CustomInput";
import { FormErrors } from "../../components/FormErrors";
import { useDispatch, useSelector } from "react-redux";
import { addCategory } from "../../redux/categoriesSlice";
import { CommonActions } from "@react-navigation/native";
import { localization } from "../../utils/localization";
import { RootState } from "../../redux/store";
import { theme } from "../../utils/theme";
export const CategoryForm = ({ navigation }: { navigation: any }) => {
  const [name, setName] = useState("");
  const storedSettings = useSelector((state: RootState) => state.settings);
  const [errorsList, setErrorsList] = useState<string[]>([]);
  const dispatch = useDispatch();
  async function addCategoryHandler() {
    const errors = [];
    if (name.length <= 0) {
      errors.push(localization.CategoryNameRequired[storedSettings.language]);
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
    navigation.dispatch(CommonActions.goBack());
  }
  return (
    <ThemeView>
      <PageHeader
        title={localization.Add_a_Category[storedSettings.language]}
      />
      <View style={styles.form}>
        <CustomInput
          mode="outlined"
          textContentType="name"
          label={localization.Category_Name[storedSettings.language]}
          value={name}
          onChange={text => setName(text.nativeEvent.text)}
        />
        <FormErrors errors={errorsList} />
        <Button mode="contained" onPress={addCategoryHandler}>
          {localization.Save[storedSettings.language]}
        </Button>
      </View>
    </ThemeView>
  );
};
const styles = StyleSheet.create({
  form: {
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.md,
  },
});
