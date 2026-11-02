import { Keyboard, StyleSheet, View } from "react-native";
import { Button } from "react-native-paper";
import { useMemo, useState } from "react";
import { PageHeader } from "../../components/PageHeader";
import { ThemeView } from "../../components/ThemeView";
import { CustomInput } from "../../components/CustomInput";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { addCollection, moveCollection } from "../../redux/itemsSlice";
import { colors as appColors } from "./../../utils/colors";
import { localization } from "../../utils/localization";
import { CollectionList } from "../../components/CollectionList";
import { FilterChip } from "../../components/FilterChip";
import { FormErrors } from "../../components/FormErrors";
import { SectionHeading } from "../../components/SectionHeading";
import {
  COLLECTION_SORT_VALUES,
  getCollectionSortValue,
  getOrderedCollectionTags,
} from "../../utils/collectionOrder";
import { setCollectionSortValue } from "../../redux/settingsSlice";
import { theme } from "../../utils/theme";
export const CollectionForm = () => {
  const [name, setName] = useState("");
  const [refresh, setRefresh] = useState(false);
  const CollectionsState = useSelector(
    (state: RootState) => state.itemsList.collectionTags,
  );
  const storedSettings = useSelector((state: RootState) => state.settings);
  const sortValue = getCollectionSortValue(storedSettings.collectionSortValue);
  const [errorsList, setErrorsList] = useState<string[]>([]);
  const dispatch = useDispatch();
  const language = storedSettings.language;
  const orderedCollections = useMemo(
    () => getOrderedCollectionTags(CollectionsState, sortValue),
    [CollectionsState, sortValue],
  );
  const sortOptions = useMemo(
    () => [
      {
        label: localization.Custom[language],
        value: COLLECTION_SORT_VALUES.CUSTOM,
      },
      {
        label: localization.Name_Asc[language],
        value: COLLECTION_SORT_VALUES.NAME_ASC,
      },
      {
        label: localization.Name_Desc[language],
        value: COLLECTION_SORT_VALUES.NAME_DESC,
      },
    ],
    [language],
  );
  const addCollectionHandler = async () => {
    const errors = [];
    if (name.length <= 0) {
      errors.push(localization.CollectionNameRequired[language]);
    }
    if (name.length > 20) {
      errors.push(localization.NameTooLong[language]);
    }
    if (
      CollectionsState.find(x => x.label.toLowerCase() === name.toLowerCase())
    ) {
      errors.push(localization.NameTaken[language]);
    }
    if (errors.length > 0) {
      setErrorsList(errors);
      return;
    }
    setErrorsList([]);
    dispatch(
      addCollection({
        name: name,
        color: appColors.defaultCollectionColor,
      }),
    );
  };
  const moveCollectionHandler = (value: string, direction: "up" | "down") => {
    dispatch(moveCollection({ value, direction }));
    setRefresh(prev => !prev);
  };
  return (
    <ThemeView>
      <PageHeader title={localization.Collections[language]} />
      <View style={styles.form}>
        <CustomInput
          mode="outlined"
          textContentType="name"
          label={localization.Collection_name[language]}
          value={name}
          onChange={text => setName(text.nativeEvent.text)}
        />
        <FormErrors errors={errorsList} />
        <Button
          mode="contained"
          onPress={() => {
            addCollectionHandler();
            Keyboard.dismiss();
          }}
        >
          {localization.Save[language]}
        </Button>
        <SectionHeading title={localization.Sort[language]} />
        <View style={styles.chips}>
          {sortOptions.map(option => (
            <FilterChip
              key={option.value}
              label={option.label}
              selected={sortValue === option.value}
              onPress={() =>
                dispatch(
                  setCollectionSortValue({ collectionSortValue: option.value }),
                )
              }
            />
          ))}
        </View>
      </View>
      <CollectionList
        collections={orderedCollections}
        sortValue={sortValue}
        refresh={refresh}
        setRefresh={setRefresh}
        emptyText={localization.There_is_no_collection[language]}
        onMoveCollection={moveCollectionHandler}
      />
    </ThemeView>
  );
};
const styles = StyleSheet.create({
  form: {
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
});
