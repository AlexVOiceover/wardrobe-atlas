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
import { SEASONS, seasonList, sizeList } from "../../utils/data";
import { STYLES, defaultStyles } from "../../utils/styles";
import { FilterChip } from "../../components/FilterChip";
import ReactNativeBlobUtil from "react-native-blob-util";
import ImageResizer from "@bam.tech/react-native-image-resizer";
import {
  getCollectionSortValue,
  getOrderedCollectionTags,
} from "../../utils/collectionOrder";
import { localization, styleNames } from "../../utils/localization";
import { categoryTypes, visibleCategories } from "../../utils/categories";
import { ImageViewer } from "../../components/ImageViewer";
import {
  isCutout,
  removeBackground,
  type BackgroundError,
} from "../../utils/backgroundRemoval";
import {
  GARMENT_MODEL,
  downloadGarmentModel,
  garmentPart,
  hasGarmentModel,
  isolateGarment,
} from "../../utils/garmentIsolation";
import { OptionalDateField } from "../../components/OptionalDateField";
import { FormErrors } from "../../components/FormErrors";
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
  const categoryState = useSelector((state: RootState) => state.CategoryList);
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
  const [category, setCategory] = useState<number>(
    selectedCategory ?? storedItems?.category ?? -1,
  );
  const [type, setType] = useState(storedItems ? storedItems.type : "");
  const [stored, setStored] = useState(storedItems?.stored === true);
  // New garments' styles follow the subcategory until a chip is tapped.
  const [garmentStyles, setGarmentStyles] = useState<string[]>(
    storedItems?.styles ?? [],
  );
  const [stylesEdited, setStylesEdited] = useState(Boolean(storedItems));
  const [seasons, setSeasons] = useState<string[]>(
    storedItems?.seasons ?? [...SEASONS],
  );
  const shownStyles = stylesEdited ? garmentStyles : defaultStyles(type);
  const toggleStyle = (style: string) => {
    setGarmentStyles(
      STYLES.filter(value =>
        value === style
          ? !shownStyles.includes(value)
          : shownStyles.includes(value),
      ),
    );
    setStylesEdited(true);
  };
  const toggleSeason = (season: string) =>
    setSeasons(current =>
      // Kept in calendar order whatever the tapping order.
      SEASONS.filter(value =>
        value === season ? !current.includes(value) : current.includes(value),
      ),
    );
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
  // The photo before its background was removed, for Undo until Save.
  const [photoBeforeCutout, setPhotoBeforeCutout] = useState<string>();
  const [cutoutStatus, setCutoutStatus] = useState<
    "" | "working" | BackgroundError | "noModel" | "downloadFailed"
  >("");
  // Download progress of the garment model, while it downloads.
  const [modelProgress, setModelProgress] = useState<number>();
  const [modelPromptVisible, setModelPromptVisible] = useState(false);
  const cutoutMessages: Record<
    BackgroundError | "noModel" | "downloadFailed",
    readonly string[]
  > = {
    preparing: localization.BackgroundPreparing,
    noSubject: localization.BackgroundNoSubject,
    unsupported: localization.BackgroundUnsupported,
    failed: localization.BackgroundFailed,
    noModel: localization.GarmentModelMissing,
    downloadFailed: localization.GarmentModelDownloadFailed,
  };
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
  const [openCategory, setOpenCategory] = useState(false);
  const [openSizeUnit, setOpenSizeUnit] = useState(false);
  const [openCollection, setOpenCollection] = useState(false);
  const [isAutoOn, setIsAutoOn] = useState(
    storedItems ? storedItems.automaticColor === true : true,
  );
  const colorScheme = String("LIGHT") as ThemeNameType;
  const dispatch = useDispatch();
  const [visible, setVisible] = useState(false);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  // Tops and bottoms keep only the garment; shoes and accessories only lose
  // the background.
  const part = garmentPart(category);
  const cutOut = async () => {
    const original = imageUrl;
    if (part && !(await hasGarmentModel())) {
      setModelPromptVisible(true);
      return;
    }
    setCutoutStatus("working");
    const result = part
      ? await isolateGarment(original, part)
      : await removeBackground(original);
    if ("image" in result) {
      setPhotoBeforeCutout(original);
      setImageUrl(result.image);
      setCutoutStatus("");
    } else setCutoutStatus(result.error);
  };
  const downloadModel = async () => {
    setCutoutStatus("");
    setModelProgress(0);
    const downloaded = await downloadGarmentModel(setModelProgress);
    setModelProgress(undefined);
    if (downloaded) await cutOut();
    else setCutoutStatus("downloadFailed");
  };
  const categoryOptions = visibleCategories(
    categoryState,
    storedSettings.language,
  ).map(option => ({ label: option.label, value: option.index }));
  // Types belong to a category, so choosing another one clears the type.
  const chooseCategory = (next: any) => {
    const value = typeof next === "function" ? next(category) : next;
    if (typeof value === "number" && value !== category) {
      setCategory(value);
      setType("");
    }
  };
  const combiningTypesData = categoryTypes(
    categoryState,
    category,
    storedSettings.language,
  );
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
          category: category,
          type: type,
          fit: storedItems?.fit ?? "",
          seasons: seasons,
          stored: stored,
          styles: shownStyles,
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
          category: category,
          type: type,
          fit: storedItems?.fit ?? "",
          seasons: seasons,
          stored: stored,
          styles: shownStyles,
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
                setPhotoBeforeCutout(undefined);
                setCutoutStatus("");
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
                  setPhotoBeforeCutout(undefined);
                  setCutoutStatus("");
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
  return (
    <>
      <ConfirmationDialog
        visible={deleteVisible}
        setVisible={setDeleteVisible}
        message={localization.ConfirmDeleteGarment[storedSettings.language]}
        onConfirm={deleteItemHandler}
      />
      <ConfirmationDialog
        visible={modelPromptVisible}
        setVisible={setModelPromptVisible}
        title={localization.DownloadGarmentModel[storedSettings.language]}
        message={localization.ConfirmGarmentModelDownload[
          storedSettings.language
        ].replace("{mb}", String(GARMENT_MODEL.megabytes))}
        onConfirm={downloadModel}
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
          <View style={styles.topRow}>
            <ImageViewer
              size={152}
              imageUrl={imageUrl}
              setImageModalVisible={setImageModalVisible}
            />
            <View style={styles.topFields}>
              <WardrobeSelector value={wardrobeId} onChange={setWardrobeId} />
              <CustomInput
                mode="outlined"
                dense
                label={localization.Brand[storedSettings.language]}
                value={brand}
                onChange={text => setBrand(text.nativeEvent.text)}
              />
              <OptionalDateField
                label={localization.Purchase_Date[storedSettings.language]}
                date={hasPurchaseDate ? purchaseDate : undefined}
                onChange={date => {
                  setHasPurchaseDate(Boolean(date));
                  if (date) {
                    setPurchaseDate(date);
                  }
                }}
              />
            </View>
          </View>
          {/* Earlier cutouts of tops and bottoms may still show the person. */}
          {!!imageUrl &&
            (!!part || !isCutout(imageUrl) || photoBeforeCutout) && (
              <View style={styles.cutout}>
                <View style={styles.cutoutActions}>
                  {photoBeforeCutout ? (
                    <Button
                      icon="undo"
                      compact
                      onPress={() => {
                        setImageUrl(photoBeforeCutout);
                        setPhotoBeforeCutout(undefined);
                      }}
                    >
                      {localization.Undo[storedSettings.language]}
                    </Button>
                  ) : (
                    <Button
                      icon="content-cut"
                      compact
                      disabled={
                        cutoutStatus === "working" ||
                        modelProgress !== undefined
                      }
                      onPress={cutOut}
                    >
                      {modelProgress !== undefined
                        ? localization.DownloadingGarmentModel[
                            storedSettings.language
                          ].replace("{percent}", String(modelProgress))
                        : (part
                            ? cutoutStatus === "working"
                              ? localization.IsolatingGarment
                              : localization.IsolateGarment
                            : cutoutStatus === "working"
                            ? localization.RemovingBackground
                            : localization.RemoveBackground)[
                            storedSettings.language
                          ]}
                    </Button>
                  )}
                </View>
                {cutoutStatus !== "" && cutoutStatus !== "working" && (
                  <ThemeText
                    accessibilityLiveRegion="polite"
                    customStyle={captionText}
                  >
                    {cutoutMessages[cutoutStatus][storedSettings.language]}
                  </ThemeText>
                )}
              </View>
            )}
          <View style={styles.pairRow}>
            <View style={styles.pairField}>
              <DropDownPicker
                open={openCategory}
                value={
                  categoryOptions.some(o => o.value === category)
                    ? category
                    : null
                }
                items={categoryOptions}
                setOpen={setOpenCategory}
                setValue={chooseCategory}
                mode="SIMPLE"
                listMode="MODAL"
                placeholder={localization.Category[storedSettings.language]}
                style={[pickerStyle, styles.picker]}
                dropDownContainerStyle={pickerStyle}
                theme={colorScheme}
              />
            </View>
            {combiningTypesData?.length > 0 && (
              <View style={styles.pairField}>
                <DropDownPicker
                  open={openType}
                  value={type}
                  items={combiningTypesData}
                  setOpen={setOpenType}
                  setValue={setType}
                  mode="SIMPLE"
                  listMode="MODAL"
                  placeholder={localization.Type[storedSettings.language]}
                  style={[pickerStyle, styles.picker]}
                  dropDownContainerStyle={pickerStyle}
                  theme={colorScheme}
                />
              </View>
            )}
          </View>

          <View style={styles.seasons}>
            <ThemeText customStyle={styles.sectionLabel}>
              {localization.Seasons[storedSettings.language]}
            </ThemeText>
            <View style={styles.seasonChips}>
              {(seasonList[storedSettings.language] ?? []).map(option => (
                <FilterChip
                  key={option.value}
                  label={option.label}
                  selected={seasons.includes(option.value)}
                  onPress={() => toggleSeason(option.value)}
                />
              ))}
            </View>
          </View>
          <View style={styles.seasons}>
            <ThemeText customStyle={styles.sectionLabel}>
              {localization.Styles[storedSettings.language]}
            </ThemeText>
            <View style={styles.seasonChips}>
              {STYLES.map(value => (
                <FilterChip
                  key={value}
                  label={styleNames[storedSettings.language][value]}
                  selected={shownStyles.includes(value)}
                  onPress={() => toggleStyle(value)}
                />
              ))}
            </View>
          </View>
          <View style={styles.storageRow}>
            <ThemeText customStyle={styles.sectionLabel}>
              {localization.InStorage[storedSettings.language]}
            </ThemeText>
            <Switch
              accessibilityLabel={
                localization.InStorage[storedSettings.language]
              }
              value={stored}
              onValueChange={setStored}
            />
          </View>
          <View style={styles.colors}>
            <View style={styles.colorsHeader}>
              <ThemeText customStyle={styles.sectionLabel}>
                {localization.Colors[storedSettings.language]}
              </ThemeText>
              <ThemeText customStyle={captionText}>
                {localization.Auto[storedSettings.language]}
              </ThemeText>
              <Switch
                accessibilityLabel={
                  localization.Automatic_color_selection[
                    storedSettings.language
                  ]
                }
                value={isAutoOn}
                onValueChange={onToggleSwitch}
              />
            </View>
            <View style={styles.swatches}>
              {[
                localization.Primary_color,
                localization.Secondary_color,
                localization.Tertiary_color,
              ]
                .slice(0, colorSlots)
                .map((label, index) => (
                  <View key={index}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={label[storedSettings.language]}
                      onPress={() => {
                        // Choosing a color by hand turns automatic colors off.
                        setIsAutoOn(false);
                        setColorSelection(index);
                        setVisible(true);
                      }}
                      style={[
                        styles.colorSwatch,
                        {
                          backgroundColor:
                            colors[index] || theme.colors.surface,
                        },
                      ]}
                    >
                      {!colors[index] && (
                        <Icon
                          name="color-palette-outline"
                          size={20}
                          color={theme.colors.muted}
                        />
                      )}
                    </Pressable>
                    {index > 0 && !isAutoOn && (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`${
                          localization.RemoveColor[storedSettings.language]
                        }: ${label[storedSettings.language]}`}
                        onPress={() => removeColor(index)}
                        hitSlop={8}
                        style={styles.removeColor}
                      >
                        <Icon
                          name="close"
                          size={14}
                          color={theme.colors.background}
                        />
                      </Pressable>
                    )}
                  </View>
                ))}
              {!isAutoOn && colorSlots < 3 && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={
                    colorSlots === 1
                      ? localization.AddSecondaryColor[storedSettings.language]
                      : localization.AddTertiaryColor[storedSettings.language]
                  }
                  accessibilityState={{ disabled: !colors[colorSlots - 1] }}
                  disabled={!colors[colorSlots - 1]}
                  onPress={() => setColorSlots(colorSlots + 1)}
                  style={[
                    styles.colorSwatch,
                    styles.addColor,
                    !colors[colorSlots - 1] && styles.disabled,
                  ]}
                >
                  <Icon name="add" size={22} color={theme.colors.text} />
                </Pressable>
              )}
            </View>
          </View>

          <CustomInput
            mode="outlined"
            dense
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
              dense
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
                style={[pickerStyle, styles.picker, { marginTop: 6 }]}
                dropDownContainerStyle={pickerStyle}
                theme={colorScheme}
              />
            </View>
            <CustomInput
              mode="outlined"
              dense
              style={styles.sizeField}
              label={localization.Size[storedSettings.language]}
              value={String(size)}
              onChange={text => setSize(text.nativeEvent.text)}
              maxLength={6}
            />
          </View>
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
              listMode="MODAL"
              placeholder={localization.Collection[storedSettings.language]}
              style={pickerStyle}
              dropDownContainerStyle={pickerStyle}
            />
          </View>

          <FormErrors errors={errorsList} />
          <View style={styles.actions}>
            {editingIndex && (
              <Button
                mode="outlined"
                style={styles.action}
                textColor={theme.colors.danger}
                onPress={() => setDeleteVisible(true)}
              >
                {localization.Delete[storedSettings.language]}
              </Button>
            )}
            <Button
              mode="contained"
              style={styles.action}
              onPress={addItemHandler}
            >
              {localization.Save[storedSettings.language]}
            </Button>
          </View>
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
  topRow: {
    flexDirection: "row",
    gap: theme.spacing.md,
  },
  topFields: {
    flex: 1,
    justifyContent: "space-between",
    gap: theme.spacing.sm,
  },
  cutout: {
    marginTop: -theme.spacing.sm,
  },
  cutoutActions: {
    flexDirection: "row",
  },
  pairRow: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    zIndex: 2,
  },
  pairField: {
    flex: 1,
  },
  picker: {
    minHeight: 48,
  },
  colors: {
    gap: theme.spacing.sm,
  },
  seasons: {
    gap: theme.spacing.xs,
  },
  storageRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: theme.touch,
  },
  seasonChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },
  colorsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  sectionLabel: {
    flex: 1,
    fontWeight: "600",
  },
  swatches: {
    flexDirection: "row",
    gap: theme.spacing.md,
  },
  colorSwatch: {
    width: theme.touch,
    height: theme.touch,
    borderRadius: theme.radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.muted,
    justifyContent: "center",
    alignItems: "center",
  },
  addColor: {
    borderStyle: "dashed",
    borderWidth: 1,
  },
  disabled: {
    opacity: 0.4,
  },
  removeColor: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.muted,
    justifyContent: "center",
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
  actions: {
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  action: {
    flex: 1,
  },
});
