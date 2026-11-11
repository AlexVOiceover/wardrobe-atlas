import {
  WardrobeSelector,
  useWardrobeView,
} from "../../components/WardrobeSelector";
import { validWardrobeId } from "../../utils/wardrobes";
import { Button } from "react-native-paper";
import { PageHeader } from "../../components/PageHeader";
import { ThemeView } from "../../components/ThemeView";
import { CustomInput } from "../../components/CustomInput";
import { ListRow } from "../../components/ListRow";
import { View, StyleSheet, ScrollView, Keyboard, Alert } from "react-native";
import { RootState } from "../../redux/store";
import { useDispatch, useSelector } from "react-redux";
import React, { useState, useMemo } from "react";
import { ThemeText } from "../../components/ThemeText";
import { FormErrors } from "../../components/FormErrors";
import { addItem } from "../../redux/itemsSlice";
import { setLastWardrobe } from "../../redux/settingsSlice";
import DropDownPicker, { ThemeNameType } from "react-native-dropdown-picker";
import { localization } from "../../utils/localization";
import { captionText, pickerStyle, theme } from "../../utils/theme";
import { categoryTypes } from "../../utils/categories";
import { SEASONS } from "../../utils/data";
import { garmentName } from "../../utils/garmentName";
import { extractColors } from "../../utils/extractColors";
import { removeBackground } from "../../utils/backgroundRemoval";
import { launchImageLibrary, launchCamera } from "react-native-image-picker";
import { savePhotoFile } from "../../utils/photoStore";
import ImageResizer from "@bam.tech/react-native-image-resizer";
import {
  getCollectionSortValue,
  getOrderedCollectionTags,
} from "../../utils/collectionOrder";
// The most photos added in one go.
export const MAX_BULK_PHOTOS = 30;
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
  const storedSettings = useSelector((state: RootState) => state.settings);
  // Like a single new garment: the wardrobe of the last garment saved.
  const [wardrobeId, setWardrobeId] = useState<string | undefined>(
    validWardrobeId(wardrobes, storedSettings.lastWardrobeId) ?? selected,
  );
  const [prefix, setPrefix] = useState("");
  const [removeBackgrounds, setRemoveBackgrounds] = useState(false);
  const [openType, setOpenType] = useState(false);
  const [openCollection, setOpenCollection] = useState(false);
  const colorScheme = String("LIGHT") as ThemeNameType;
  const [collection, setCollection] = useState([]);
  const [type, setType] = useState("");
  const dispatch = useDispatch();
  const [errorsList, setErrorsList] = useState<string[]>([]);
  // Photos done and in total, while garments are being added.
  const [progress, setProgress] = useState<{ done: number; total: number }>();
  const collectionState = useSelector(
    (state: RootState) => state.itemsList.collectionTags,
  );
  const categoryState = useSelector((state: RootState) => state.CategoryList);
  const collectionOptions = getOrderedCollectionTags(
    collectionState,
    getCollectionSortValue(storedSettings.collectionSortValue),
  );
  const language = storedSettings.language ?? 0;
  const combiningTypesData = useMemo(
    () => categoryTypes(categoryState, selectedCategory, language),
    [categoryState, selectedCategory, language],
  );
  const typeLabel =
    combiningTypesData.find(option => option.value === type)?.label ?? type;
  const createItemsFromUris = async (uris: string[]) => {
    const savedWardrobe = validWardrobeId(wardrobes, wardrobeId);
    setProgress({ done: 0, total: uris.length });
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
        let image = await savePhotoFile(response.uri);
        if (removeBackgrounds) {
          // A photo that can't be cut out keeps its background.
          const cutout = await removeBackground(image);
          if ("image" in cutout) image = cutout.image;
        }
        const colors = await extractColors(image);
        const name = prefix.trim()
          ? `${prefix.trim()} ${i + 1}`
          : garmentName({ primaryColor: colors[0], typeLabel, language }) ||
            `${localization.Garment[language]} ${i + 1}`;
        dispatch(
          addItem({
            wardrobeId: savedWardrobe,
            name,
            collection: collection,
            category: selectedCategory,
            type: type,
            fit: "",
            seasons: [...SEASONS],
            size: "",
            sizeUnit: "",
            quantity: 1,
            purchaseDate: "",
            image,
            automaticColor: true,
            primaryColor: colors[0] ?? "",
            secondaryColor: colors[1] ?? "",
            tertiaryColor: colors[2] ?? "",
          }),
        );
        setProgress({ done: i + 1, total: uris.length });
      }
      dispatch(setLastWardrobe({ wardrobeId: savedWardrobe }));
      const wardrobe = wardrobes.find(w => w.id === savedWardrobe);
      navigation.popTo("StackNavHome", {
        screen: "Closet",
        params: {
          saved: wardrobe
            ? localization.SavedTo[language].replace("{name}", wardrobe.name)
            : localization.Saved[language],
        },
      });
    } catch (error) {
      console.error("Bulk item creation error:", error);
      setProgress(undefined);
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
          selectionLimit: MAX_BULK_PHOTOS,
        });
        if (response.didCancel || !response.assets) return;
        const uris = response.assets
          .map(asset => asset.uri)
          .filter((uri): uri is string => !!uri)
          .slice(0, MAX_BULK_PHOTOS);
        if (uris.length > 0) await createItemsFromUris(uris);
      } catch (error) {
        console.error("Gallery picker error:", error);
      }
    } else {
      // One photo after another until the camera is closed.
      const uris: string[] = [];
      while (uris.length < MAX_BULK_PHOTOS) {
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
          } else break;
        } catch (error) {
          console.error("Camera capture error:", error);
          break;
        }
      }
      if (uris.length > 0) {
        await createItemsFromUris(uris);
      }
    }
  };
  const addItemHandler = (mode: number) => {
    Keyboard.dismiss();
    if (wardrobeId && !validWardrobeId(wardrobes, wardrobeId)) {
      setErrorsList([localization.WardrobeUnavailable[language]]);
      return;
    }
    setErrorsList([]);
    return handleImagePicker(mode);
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
          <View style={styles.field}>
            <CustomInput
              mode="outlined"
              textContentType="name"
              label={localization.Prefix[language]}
              value={prefix}
              onChangeText={setPrefix}
            />
            <ThemeText customStyle={captionText}>
              {localization.PrefixHint[language]}
            </ThemeText>
          </View>

          {combiningTypesData?.length > 0 && (
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
          )}

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
            listMode="MODAL"
            placeholder={localization.Collection[language]}
            style={pickerStyle}
            dropDownContainerStyle={pickerStyle}
          />

          <ListRow
            title={localization.RemoveBackgrounds[language]}
            switchValue={removeBackgrounds}
            onSwitch={setRemoveBackgrounds}
          />

          <ThemeText customStyle={captionText}>
            {localization.bulkInfo[language]}
          </ThemeText>

          <FormErrors errors={errorsList} />

          {progress ? (
            <ThemeText accessibilityLiveRegion="polite">
              {localization.AddingGarments[language]
                .replace("{done}", String(progress.done))
                .replace("{total}", String(progress.total))}
            </ThemeText>
          ) : (
            <View style={styles.buttonGroup}>
              <Button mode="contained" onPress={() => addItemHandler(0)}>
                {localization.startLocalImages[language]}
              </Button>

              <Button mode="outlined" onPress={() => addItemHandler(1)}>
                {localization.startWCamera[language]}
              </Button>
            </View>
          )}
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
  field: {
    gap: theme.spacing.xs,
  },
  buttonGroup: {
    gap: theme.spacing.sm,
  },
});
