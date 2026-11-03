import {
  WardrobeSelector,
  useWardrobeView,
} from "../../components/WardrobeSelector";
import { validWardrobeId } from "../../utils/wardrobes";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { Button, Switch } from "react-native-paper";
import { useState } from "react";
import { PageHeader } from "../../components/PageHeader";
import { ConfirmationDialog } from "../../components/ConfirmationDialog";
import { useDispatch, useSelector } from "react-redux";
import {
  addItem,
  updateItem,
  itemRefresher,
  deleteItem,
} from "../../redux/itemsSlice";
import { setLastWardrobe } from "../../redux/settingsSlice";
import { garmentName } from "../../utils/garmentName";
import { launchCamera, launchImageLibrary } from "react-native-image-picker";
import ColorModal from "../../components/ColorModal";
import { CustomInput } from "../../components/CustomInput";
import { RootState } from "../../redux/store";
import DropDownPicker, { ThemeNameType } from "react-native-dropdown-picker";
import CustomModal from "../../components/CustomModal";
import { getPalette } from "@somesoap/react-native-image-palette";
import { ThemeView } from "../../components/ThemeView";
import { ThemeText } from "../../components/ThemeText";
import { DatePicker } from "../../components/DatePicker";
import { sizeList } from "../../utils/data";
import ReactNativeBlobUtil from "react-native-blob-util";
import ImageResizer from "@bam.tech/react-native-image-resizer";
import {
  getCollectionSortValue,
  getOrderedCollectionTags,
} from "../../utils/collectionOrder";
import { clothesList, localization } from "../../utils/localization";
import { defaultCategories } from "./Category";
import { ImageViewer } from "../../components/ImageViewer";
import { FormErrors } from "../../components/FormErrors";
import { ListRow } from "../../components/ListRow";
import { captionText, pickerStyle, theme } from "../../utils/theme";
export const ItemForm = ({
  navigation,
  route,
}: {
  navigation: any;
  route: any;
}) => {
  const { selectedCategory, editingIndex } = route.params;
  const collectionState = useSelector(
    (state: RootState) => state.itemsList.collectionTags,
  );
  const currentIndex = useSelector((state: RootState) =>
    state.itemsList.items.findIndex(x => x.id === editingIndex),
  );
  const storedItems = useSelector(
    (state: RootState) => state.itemsList.items[currentIndex],
  );
  const storedSettings = useSelector((state: RootState) => state.settings);
  const storedCatTypes = useSelector(
    (state: RootState) => state.CategoryList.CategoryCustomTypes,
  );
  const collectionOptions = getOrderedCollectionTags(
    collectionState,
    getCollectionSortValue(storedSettings.collectionSortValue),
  );
  const { selected } = useWardrobeView();
  const wardrobes = useSelector((s: RootState) => s.itemsList.wardrobes);
  // New garments start in the wardrobe of the last garment saved.
  const [wardrobeId, setWardrobeId] = useState<string | undefined>(
    storedItems
      ? storedItems.wardrobeId
      : validWardrobeId(wardrobes, storedSettings.lastWardrobeId) ?? selected,
  );
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [name, setName] = useState(storedItems ? storedItems.name : "");
  // Until the user types a name, it follows color, brand and type.
  const [nameEdited, setNameEdited] = useState(Boolean(storedItems?.name));
  const [brand, setBrand] = useState(storedItems?.brand ?? "");
  const [collection, setCollection] = useState(storedItems?.collection ?? []);
  const [type, setType] = useState(storedItems ? storedItems.type : "");
  const [quantity, setQuantity] = useState(
    storedItems ? storedItems.quantity : 1,
  );
  const [sizeUnit, setSizeUnit] = useState(
    storedItems ? storedItems.sizeUnit : "",
  );
  const [size, setSize] = useState(storedItems ? storedItems.size : "");
  // No purchase date unless the user sets one; a default date would be wrong data.
  const [hasPurchaseDate, setHasPurchaseDate] = useState(
    Boolean(storedItems?.purchaseDate),
  );
  const [purchaseDate, setPurchaseDate] = useState(
    storedItems && storedItems.purchaseDate
      ? new Date(JSON.parse(storedItems.purchaseDate))
      : new Date(),
  );
  const [imageUrl, setImageUrl] = useState<string>(
    storedItems ? storedItems.image : "",
  );
  const [errorsList, setErrorsList] = useState<string[]>([]);
  const [colors, setColors] = useState([
    storedItems?.primaryColor || "",
    storedItems?.secondaryColor || "",
    storedItems?.tertiaryColor || "",
  ]);
  const [colorSelection, setColorSelection] = useState(0);
  // Secondary and tertiary colors are optional; show them only when set or added.
  const [colorSlots, setColorSlots] = useState(
    storedItems?.tertiaryColor ? 3 : storedItems?.secondaryColor ? 2 : 1,
  );
  const removeColor = (index: number) => {
    // Removing secondary moves tertiary up so shown rows stay contiguous.
    setColors(prev => {
      const next = [...prev.filter((_, i) => i !== index), ""];
      return next.slice(0, 3);
    });
    setColorSlots(prev => prev - 1);
  };
  const savedColors = colors.map((color, index) =>
    index < colorSlots ? color : "",
  );
  const [openType, setOpenType] = useState(false);
  const [openSizeUnit, setOpenSizeUnit] = useState(false);
  const [openCollection, setOpenCollection] = useState(false);
  const [isAutoOn, setIsAutoOn] = useState(
    storedItems ? storedItems.automaticColor === true : true,
  );
  const colorScheme = String("LIGHT") as ThemeNameType;
  const dispatch = useDispatch();
  const [visible, setVisible] = useState(false);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const combiningTypesData =
    (selectedCategory ?? storedItems?.category) < defaultCategories.length
      ? [
          ...(clothesList[storedSettings.language]?.[
            selectedCategory ?? storedItems?.category
          ] || []),
          ...(
            storedCatTypes?.[selectedCategory ?? storedItems?.category]
              ?.customTypes || []
          ).map(item => ({
            label: item.label,
            value: item.value,
          })),
        ]
      : (
          storedCatTypes?.[selectedCategory ?? storedItems?.category]
            ?.customTypes || []
        ).map(item => ({
          label: item.label,
          value: item.value,
        }));
  const generatedName = garmentName({
    primaryColor: colors[0],
    brand,
    typeLabel:
      combiningTypesData.find(option => option.value === type)?.label ?? type,
    language: storedSettings.language,
  });
  const displayedName = nameEdited ? name : generatedName;
  function deleteItemHandler() {
    dispatch(deleteItem({ selectedId: storedItems.id }));
    dispatch(itemRefresher());
    navigation.popToTop();
  }
  function addItemHandler() {
    const errors = [];
    if (wardrobeId && !validWardrobeId(wardrobes, wardrobeId)) {
      setErrorsList([
        localization.WardrobeUnavailable[storedSettings.language],
      ]);
      return;
    }
    // An empty name is filled in as "Color Brand Type" on Save.
    const finalName = displayedName.trim() || generatedName;
    if (finalName.length <= 0) {
      errors.push(localization.NameRequired[storedSettings.language]);
    }
    if (!type && combiningTypesData.length > 0) {
      errors.push(localization.TypeRequired[storedSettings.language]);
    }
    if (errors.length > 0) {
      setErrorsList(errors);
      return;
    }
    setErrorsList([]);
    if (editingIndex) {
      dispatch(
        updateItem({
          id: editingIndex,
          wardrobeId: validWardrobeId(wardrobes, wardrobeId),
          name: finalName,
          brand: brand.trim(),
          collection: collection,
          category: selectedCategory,
          type: type,
          fit: storedItems?.fit ?? "",
          season: storedItems?.season,
          size: size,
          sizeUnit: sizeUnit,
          quantity: quantity === 0 ? 1 : quantity,
          purchaseDate: hasPurchaseDate ? JSON.stringify(purchaseDate) : "",
          image: imageUrl,
          automaticColor: isAutoOn,
          primaryColor: savedColors[0],
          secondaryColor: savedColors[1],
          tertiaryColor: savedColors[2],
        }),
      );
    } else {
      dispatch(
        addItem({
          wardrobeId: validWardrobeId(wardrobes, wardrobeId),
          name: finalName,
          brand: brand.trim(),
          collection: collection,
          category: selectedCategory,
          type: type,
          fit: storedItems?.fit ?? "",
          season: storedItems?.season,
          size: size,
          sizeUnit: sizeUnit,
          quantity: quantity === 0 ? 1 : quantity,
          purchaseDate: hasPurchaseDate ? JSON.stringify(purchaseDate) : "",
          image: imageUrl,
          automaticColor: isAutoOn,
          primaryColor: savedColors[0],
          secondaryColor: savedColors[1],
          tertiaryColor: savedColors[2],
        }),
      );
    }
    dispatch(
      setLastWardrobe({ wardrobeId: validWardrobeId(wardrobes, wardrobeId) }),
    );
    navigation.popToTop();
    if (editingIndex) {
      dispatch(itemRefresher());
    }
  }
  const onToggleSwitch = (val: boolean) => {
    setIsAutoOn(val);
    if (val && imageUrl) {
      colorsExtractor(imageUrl);
    }
  };
  const colorsExtractor = async (base64: string) => {
    try {
      const tmp = `${
        ReactNativeBlobUtil.fs.dirs.CacheDir
      }/palette_${Date.now()}.jpg`;
      await ReactNativeBlobUtil.fs.writeFile(tmp, base64, "base64");
      const uri = `file://${tmp}`;
      const pal: any = await getPalette(uri);
      // Simple mapping similar to previous lib
      const primary =
        pal.dominant || pal.vibrant || pal.darkVibrant || "#777777";
      const secondary = pal.muted || pal.vibrant || "#999999";
      const tertiary = pal.darkVibrant || "#555555";
      // Only fill the color rows that are shown
      setColors(
        [primary, secondary, tertiary].map((color, index) =>
          index < colorSlots ? color : "",
        ),
      );
      try {
        await ReactNativeBlobUtil.fs.unlink(tmp);
      } catch {}
    } catch (e) {
      console.log("colorExtractor error:", e);
    }
  };
  const handleImagePicker = async (source: number) => {
    if (source === 0) {
      await launchImageLibrary(
        {
          mediaType: "photo",
          selectionLimit: 1,
        },
        response => {
          if (response.didCancel) {
            console.log("Image picker cancelled");
          } else if (response.errorCode) {
            console.log("Image picker error: ", response.errorMessage);
          } else if (response.assets?.[0]?.uri) {
            ImageResizer.createResizedImage(
              response.assets[0].uri!,
              500,
              500,
              "JPEG",
              40,
              0,
              null,
            )
              .then(async resized => {
                const base64 = await ReactNativeBlobUtil.fs.readFile(
                  resized.uri,
                  "base64",
                );
                console.log("imageSize", resized.size);
                setImageUrl(base64 || "");
                if (isAutoOn && base64) {
                  colorsExtractor(base64);
                }
                setImageModalVisible(false);
              })
              .catch(err => {
                console.log("image comparison error: ", err);
              });
          }
        },
      );
    } else {
      try {
        await launchCamera(
          {
            mediaType: "photo",
          },
          response => {
            if (response.didCancel) {
              console.log("Image picker cancelled");
            } else if (response.errorCode) {
              console.log("Image picker error: ", response.errorMessage);
            } else if (response.assets?.[0]?.uri) {
              ImageResizer.createResizedImage(
                response.assets[0].uri!,
                500,
                500,
                "JPEG",
                40,
                0,
                null,
              )
                .then(async resized => {
                  const base64 = await ReactNativeBlobUtil.fs.readFile(
                    resized.uri,
                    "base64",
                  );
                  console.log("imageSize", resized.size);
                  setImageUrl(base64 || "");
                  if (isAutoOn && base64) {
                    colorsExtractor(base64);
                  }
                  setImageModalVisible(false);
                })
                .catch(err => {
                  console.log("image comparison error: ", err);
                });
            }
          },
        );
      } catch (error) {
        console.log("permission error", error);
      }
    }
  };
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  return (
    <>
      <ConfirmationDialog
        visible={deleteVisible}
        setVisible={setDeleteVisible}
        message={localization.ConfirmDeleteGarment[storedSettings.language]}
        onConfirm={deleteItemHandler}
      />
      <ColorModal
        colors={colors}
        setColors={setColors}
        visible={visible}
        setVisible={setVisible}
        colorSelection={colorSelection}
        image={imageUrl || undefined}
      />

      <CustomModal
        setVisible={setImageModalVisible}
        visible={imageModalVisible}
        label={localization.import_image[storedSettings.language]}
      >
        <View style={{ rowGap: theme.spacing.md }}>
          <Button mode="outlined" onPress={() => handleImagePicker(1)}>
            {localization.Use_Camera[storedSettings.language]}
          </Button>
          <Button mode="outlined" onPress={() => handleImagePicker(0)}>
            {localization.import_from_device[storedSettings.language]}
          </Button>
          <Button mode="outlined" onPress={() => setImageUrl("")}>
            {localization.Reset_Image[storedSettings.language]}
          </Button>
        </View>
      </CustomModal>
      <ThemeView>
        <PageHeader
          title={
            editingIndex
              ? localization.EditingItem[storedSettings.language]
              : localization.Adding_an_item[storedSettings.language]
          }
        />
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <View style={styles.photo}>
            <ImageViewer
              imageUrl={imageUrl}
              setImageModalVisible={setImageModalVisible}
            />
          </View>
          <WardrobeSelector value={wardrobeId} onChange={setWardrobeId} />
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
                placeholder={localization.Type[storedSettings.language]}
                style={pickerStyle}
                dropDownContainerStyle={pickerStyle}
                theme={colorScheme}
              />
            </View>
          )}
          <CustomInput
            mode="outlined"
            label={localization.Brand[storedSettings.language]}
            value={brand}
            onChange={text => setBrand(text.nativeEvent.text)}
          />
          <ListRow
            title={
              localization.Automatic_color_selection[storedSettings.language]
            }
            right={<Switch value={isAutoOn} onValueChange={onToggleSwitch} />}
          />

          {!isAutoOn &&
            [
              localization.Primary_color,
              localization.Secondary_color,
              localization.Tertiary_color,
            ]
              .slice(0, colorSlots)
              .map((label, index) => (
                <ListRow
                  key={index}
                  title={label[storedSettings.language]}
                  onPress={() => {
                    setVisible(true);
                    setColorSelection(index);
                  }}
                  right={
                    <View style={styles.colorActions}>
                      <View
                        style={[
                          styles.colorSwatch,
                          {
                            backgroundColor:
                              colors[index] || theme.colors.surface,
                          },
                        ]}
                      />
                      {index > 0 && (
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={`${
                            localization.RemoveColor[storedSettings.language]
                          }: ${label[storedSettings.language]}`}
                          onPress={() => removeColor(index)}
                          style={styles.removeColor}
                        >
                          <Icon
                            name="close"
                            size={20}
                            color={theme.colors.muted}
                          />
                        </Pressable>
                      )}
                    </View>
                  }
                />
              ))}
          {!isAutoOn && colorSlots < 3 && (
            <Button
              mode="text"
              icon="plus"
              disabled={!colors[colorSlots - 1]}
              onPress={() => setColorSlots(colorSlots + 1)}
            >
              {colorSlots === 1
                ? localization.AddSecondaryColor[storedSettings.language]
                : localization.AddTertiaryColor[storedSettings.language]}
            </Button>
          )}

          <CustomInput
            mode="outlined"
            textContentType="name"
            label={localization.Name[storedSettings.language]}
            value={displayedName}
            onChange={text => {
              // Clearing the name lets it follow color, brand and type again.
              setName(text.nativeEvent.text);
              setNameEdited(text.nativeEvent.text.length > 0);
            }}
          />
          <View style={styles.sizeRow}>
            <CustomInput
              mode="outlined"
              style={styles.sizeField}
              label={localization.Quantity[storedSettings.language]}
              value={String(quantity)}
              onChange={text => setQuantity(Number(text.nativeEvent.text))}
              keyboardType="numeric"
              maxLength={2}
            />
            <View style={styles.sizeField}>
              <DropDownPicker
                open={openSizeUnit}
                value={sizeUnit}
                items={sizeList}
                setOpen={setOpenSizeUnit}
                setValue={setSizeUnit}
                mode="SIMPLE"
                listMode="MODAL"
                placeholder={localization.Unit[storedSettings.language]}
                style={[pickerStyle, { marginTop: 5 }]}
                dropDownContainerStyle={pickerStyle}
                theme={colorScheme}
              />
            </View>
            <CustomInput
              mode="outlined"
              style={styles.sizeField}
              label={localization.Size[storedSettings.language]}
              value={String(size)}
              onChange={text => setSize(text.nativeEvent.text)}
              maxLength={6}
            />
          </View>
          <ListRow
            title={localization.Purchase_Date[storedSettings.language]}
            right={
              <Switch
                value={hasPurchaseDate}
                onValueChange={setHasPurchaseDate}
              />
            }
          />
          {hasPurchaseDate && (
            <DatePicker
              title={localization.Purchase_Date[storedSettings.language]}
              date={purchaseDate}
              isDatePickerVisible={isDatePickerVisible}
              setDate={setPurchaseDate}
              setDatePickerVisibility={setDatePickerVisibility}
            />
          )}
          <View style={{ zIndex: 1, gap: theme.spacing.xs }}>
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
              placeholder={localization.Collection[storedSettings.language]}
              style={pickerStyle}
              dropDownContainerStyle={pickerStyle}
            />
            <ThemeText customStyle={captionText}>
              {localization.You_can_add[storedSettings.language]}
            </ThemeText>
          </View>

          <FormErrors errors={errorsList} />
          <Button mode="contained" onPress={addItemHandler}>
            {localization.Save[storedSettings.language]}
          </Button>
          {editingIndex && (
            <Button
              textColor={theme.colors.danger}
              onPress={() => setDeleteVisible(true)}
            >
              {localization.Delete[storedSettings.language]}
            </Button>
          )}
        </ScrollView>
      </ThemeView>
    </>
  );
};
const styles = StyleSheet.create({
  content: {
    padding: theme.spacing.md,
    paddingBottom: 40,
    gap: theme.spacing.md,
  },
  photo: {
    alignItems: "center",
  },
  sizeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    zIndex: 2,
  },
  sizeField: {
    flex: 1,
  },
  colorActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
  },
  removeColor: {
    width: theme.touch,
    height: theme.touch,
    justifyContent: "center",
    alignItems: "center",
  },
  colorSwatch: {
    width: 24,
    height: 24,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.muted,
  },
});
