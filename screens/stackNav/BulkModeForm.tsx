import {
  WardrobeSelector,
  useWardrobeView,
} from "../../components/WardrobeSelector";
import { validWardrobeId } from "../../utils/wardrobes";
import { Button } from "react-native-paper";
import { PageHeader } from "../../components/PageHeader";
import { ThemeView } from "../../components/ThemeView";
import { CustomInput } from "../../components/CustomInput";
import { View, StyleSheet, ScrollView, Keyboard, Alert } from "react-native";
import { RootState } from "../../redux/store";
import { useDispatch, useSelector } from "react-redux";
import React, { useState, useMemo } from "react";
import { ThemeText } from "../../components/ThemeText";
import { FormErrors } from "../../components/FormErrors";
import { handleNumberChange } from "../../utils/validators";
import { addItem } from "../../redux/itemsSlice";
import DropDownPicker, { ThemeNameType } from "react-native-dropdown-picker";
import { clothesList, localization } from "../../utils/localization";
import { captionText, pickerStyle, theme } from "../../utils/theme";
import { defaultCategories } from "./Category";
import { launchImageLibrary, launchCamera } from "react-native-image-picker";
import ReactNativeBlobUtil from "react-native-blob-util";
import ImageResizer from "@bam.tech/react-native-image-resizer";
import {
  getCollectionSortValue,
  getOrderedCollectionTags,
} from "../../utils/collectionOrder";
export const BulkModeForm = ({
  navigation,
  route,
}: {
  navigation: any;
  route: any;
}) => {
  const { selectedCategory } = route.params;
  const { selected } = useWardrobeView();
  const wardrobes = useSelector((s: RootState) => s.itemsList.wardrobes);
  const [wardrobeId, setWardrobeId] = useState<string | undefined>(selected);
  const [prefix, setPrefix] = useState("");
  const [imageNum, setImageNum] = useState(2);
  const [openType, setOpenType] = useState(false);
  const [openCollection, setOpenCollection] = useState(false);
  const colorScheme = String("LIGHT") as ThemeNameType;
  const [collection, setCollection] = useState([]);
  const [type, setType] = useState("");
  const dispatch = useDispatch();
  const [errorsList, setErrorsList] = useState<string[]>([]);
  const storedSettings = useSelector((state: RootState) => state.settings);
  const collectionState = useSelector(
    (state: RootState) => state.itemsList.collectionTags,
  );
  const storedCatTypes = useSelector(
    (state: RootState) => state.CategoryList.CategoryCustomTypes,
  );
  const collectionOptions = getOrderedCollectionTags(
    collectionState,
    getCollectionSortValue(storedSettings.collectionSortValue),
  );
  const language = storedSettings.language ?? 0;
  const combiningTypesData = useMemo(() => {
    if (selectedCategory < defaultCategories.length) {
      return [
        ...(clothesList[language]?.[selectedCategory] || []),
        ...(storedCatTypes?.[selectedCategory]?.customTypes || []).map(
          item => ({
            label: item.label,
            value: item.value,
          }),
        ),
      ];
    }
    return (
      storedCatTypes?.[selectedCategory]?.customTypes.map(item => ({
        label: item.label,
        value: item.value,
      })) || []
    );
  }, [selectedCategory, language, storedCatTypes]);
  const createItemsFromUris = async (uris: string[]) => {
    try {
      for (let i = 0; i < uris.length; i++) {
        const response = await ImageResizer.createResizedImage(
          uris[i],
          500,
          500,
          "JPEG",
          40,
          0,
        );
        const imgBase64 = await ReactNativeBlobUtil.fs.readFile(
          response.uri,
          "base64",
        );
        dispatch(
          addItem({
            wardrobeId: validWardrobeId(wardrobes, wardrobeId),
            name: prefix + ` ${i + 1}`,
            collection: collection,
            category: selectedCategory,
            type: type,
            fit: "",
            season: "",
            size: "",
            sizeUnit: "",
            quantity: 1,
            purchaseDate: "",
            image: imgBase64,
            automaticColor: false,
            primaryColor: "",
            secondaryColor: "",
            tertiaryColor: "",
          }),
        );
      }
      navigation.popToTop();
    } catch (error) {
      console.error("Bulk item creation error:", error);
      Alert.alert(
        localization.ErrorTitle[language],
        `${localization.ImagesError[language]}: ${error}`,
      );
    }
  };
  const handleImagePicker = async (mode: number) => {
    if (mode === 0) {
      try {
        const response = await launchImageLibrary({
          mediaType: "photo",
          selectionLimit: imageNum,
        });
        if (response.didCancel || !response.assets) return;
        const uris = response.assets
          .map(asset => asset.uri)
          .filter((uri): uri is string => !!uri);
        createItemsFromUris(uris);
      } catch (error) {
        console.error("Gallery picker error:", error);
      }
    } else {
      const uris: string[] = [];
      for (let i = 0; i < imageNum; i++) {
        try {
          const result = await launchCamera({ mediaType: "photo" });
          if (result.didCancel) break;
          if (result.errorCode) {
            Alert.alert(
              localization.CameraError[language],
              result.errorMessage,
            );
            break;
          }
          if (result.assets?.[0]?.uri) {
            uris.push(result.assets[0].uri);
          }
        } catch (error) {
          console.error("Camera capture error:", error);
          break;
        }
      }
      if (uris.length > 0) {
        createItemsFromUris(uris);
      }
    }
  };
  const addItemHandler = (mode: number) => {
    Keyboard.dismiss();
    const errors = [];
    if (wardrobeId && !validWardrobeId(wardrobes, wardrobeId)) {
      setErrorsList([localization.WardrobeUnavailable[language]]);
      return;
    }
    if (prefix.trim().length <= 0) {
      errors.push(localization.PrefixRequired[language]);
    }
    if (errors.length > 0) {
      setErrorsList(errors);
      return;
    }
    setErrorsList([]);
    handleImagePicker(mode);
  };
  return (
    <ThemeView>
      <PageHeader title={localization.addMultiItems[language]} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <WardrobeSelector value={wardrobeId} onChange={setWardrobeId} />
        <View style={styles.formContainer}>
          <CustomInput
            mode="outlined"
            textContentType="name"
            label={localization.Prefix[language]}
            value={prefix}
            onChangeText={setPrefix}
          />

          {combiningTypesData?.length > 0 && (
            <View style={{ zIndex: 2 }}>
              <DropDownPicker
                open={openType}
                value={type}
                items={combiningTypesData}
                setOpen={setOpenType}
                setValue={setType}
                mode="SIMPLE"
                listMode="MODAL"
                placeholder={localization.Type[language]}
                style={pickerStyle}
                dropDownContainerStyle={pickerStyle}
                theme={colorScheme}
              />
            </View>
          )}

          <View style={{ zIndex: 1 }}>
            <DropDownPicker
              open={openCollection}
              value={collection}
              items={collectionOptions}
              setOpen={setOpenCollection}
              setValue={setCollection}
              multiple={true}
              theme={colorScheme}
              showBadgeDot={false}
              badgeTextStyle={{ color: theme.colors.text }}
              mode="BADGE"
              listMode="SCROLLVIEW"
              placeholder={localization.Collection[language]}
              style={pickerStyle}
              dropDownContainerStyle={pickerStyle}
            />
          </View>

          <CustomInput
            mode="outlined"
            label={localization.NumberOfItems[language]}
            value={imageNum.toString()}
            onChangeText={text =>
              handleNumberChange(() => setImageNum(Number(text)), text, 0, 30)
            }
            keyboardType="numeric"
            style={{ zIndex: 0 }}
          />

          <ThemeText customStyle={captionText}>
            {localization.bulkInfo[language]}
          </ThemeText>

          <FormErrors errors={errorsList} />

          <View style={styles.buttonGroup}>
            <Button mode="contained" onPress={() => addItemHandler(0)}>
              {localization.startLocalImages[language]}
            </Button>

            <Button mode="outlined" onPress={() => addItemHandler(1)}>
              {localization.startWCamera[language]}
            </Button>
          </View>
        </View>
      </ScrollView>
    </ThemeView>
  );
};
const styles = StyleSheet.create({
  scrollContent: {
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  formContainer: {
    gap: theme.spacing.md,
  },
  buttonGroup: {
    gap: theme.spacing.sm,
  },
});
