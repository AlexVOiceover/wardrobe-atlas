import {
  WardrobeSelector,
  useWardrobeView,
} from "../../components/WardrobeSelector";
import { validWardrobeId } from "../../utils/wardrobes";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { Button, Snackbar, Switch } from "react-native-paper";
import { useRef, useState } from "react";
import { HeaderIcon, PageHeader } from "../../components/PageHeader";
import { ConfirmationDialog } from "../../components/ConfirmationDialog";
import { useDispatch, useSelector } from "react-redux";
import {
  addItem,
  updateItem,
  itemRefresher,
  deleteItem,
} from "../../redux/itemsSlice";
import { setLastSizeUnit, setLastWardrobe } from "../../redux/settingsSlice";
import { garmentName } from "../../utils/garmentName";
import { launchCamera, launchImageLibrary } from "react-native-image-picker";
import ColorModal from "../../components/ColorModal";
import { CustomInput } from "../../components/CustomInput";
import { RootState } from "../../redux/store";
import DropDownPicker, { ThemeNameType } from "react-native-dropdown-picker";
import CustomModal from "../../components/CustomModal";
import { ThemeView } from "../../components/ThemeView";
import { ThemeText } from "../../components/ThemeText";
import { SEASONS, seasonList, sizeList } from "../../utils/data";
import { STYLES, defaultStyles } from "../../utils/styles";
import { FilterChip } from "../../components/FilterChip";
import { SectionHeading } from "../../components/SectionHeading";
import ReactNativeBlobUtil from "react-native-blob-util";
import ImageResizer from "@bam.tech/react-native-image-resizer";
import {
  getCollectionSortValue,
  getOrderedCollectionTags,
} from "../../utils/collectionOrder";
import { localization, styleNames } from "../../utils/localization";
import { categoryTypes, visibleCategories } from "../../utils/categories";
import { ImageViewer } from "../../components/ImageViewer";
import { PhotoView } from "../../components/PhotoView";
import {
  isCutout,
  removeBackground,
  type BackgroundError,
} from "../../utils/backgroundRemoval";
import { MAX_COLORS, extractColors } from "../../utils/extractColors";
import { CutoutEditor } from "../../components/CutoutEditor";
import {
  GARMENT_MODEL,
  downloadGarmentModel,
  garmentPart,
  hasGarmentModel,
  isolateGarment,
} from "../../utils/garmentIsolation";
import { OptionalDateField } from "../../components/OptionalDateField";
import { FieldBox, fieldBox } from "../../components/FieldBox";
import { FormErrors } from "../../components/FormErrors";
import { useDiscardGuard } from "../../hooks/useDiscardGuard";
import { captionText, pickerStyle, theme } from "../../utils/theme";
// The photo's width; it is as tall as the fields beside it.
const PHOTO_WIDTH = 112;
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
  // Typed as text so it can be emptied; an empty quantity saves as 1.
  const initialQuantity = storedItems ? storedItems.quantity : 1;
  const [quantityText, setQuantityText] = useState(
    initialQuantity ? String(initialQuantity) : "",
  );
  const quantity =
    quantityText === (initialQuantity ? String(initialQuantity) : "")
      ? initialQuantity === 0
        ? 1
        : initialQuantity
      : Number(quantityText) || 1;
  // New garments start with the unit last used.
  const [sizeUnit, setSizeUnit] = useState(
    storedItems ? storedItems.sizeUnit : storedSettings.lastSizeUnit ?? "",
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
  // Set by a Save without a subcategory, until one is chosen.
  const [typeMissing, setTypeMissing] = useState(false);
  // "Saved to London" after Save & add next.
  const [savedNotice, setSavedNotice] = useState("");
  const scrollRef = useRef<ScrollView>(null);
  // The photo before its background was removed, for Undo until Save.
  const [photoBeforeCutout, setPhotoBeforeCutout] = useState<string>();
  const [cutoutStatus, setCutoutStatus] = useState<
    "" | "working" | "done" | BackgroundError | "noModel" | "downloadFailed"
  >("");
  // Download progress of the garment model, while it downloads.
  const [modelProgress, setModelProgress] = useState<number>();
  const [modelPromptVisible, setModelPromptVisible] = useState(false);
  const [editorVisible, setEditorVisible] = useState(false);
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
  // Counts color reads from the photo, so a late one can't overwrite a newer
  // photo or a color chosen by hand.
  const extraction = useRef(0);
  // Choosing, adding or removing a color by hand turns automatic colors off.
  const colorsByHand = () => {
    extraction.current++;
    setIsAutoOn(false);
  };
  const removeColor = (index: number) => {
    colorsByHand();
    // Removing secondary moves tertiary up so shown rows stay contiguous.
    setColors(prev => {
      const next = [...prev.filter((_, i) => i !== index), ""];
      return next.slice(0, MAX_COLORS);
    });
    setColorSlots(prev => prev - 1);
  };
  const addColorSlot = () => {
    colorsByHand();
    setColorSlots(colorSlots + 1);
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
  // The photo on the whole screen, with its actions.
  const [photoViewVisible, setPhotoViewVisible] = useState(false);
  // Tops and bottoms keep only the garment; shoes and accessories only lose
  // the background.
  const part = garmentPart(category);
  const cutOut = async () => {
    const original = imageUrl;
    if (part && !(await hasGarmentModel())) {
      // The question can't show over the full-screen photo.
      setPhotoViewVisible(false);
      setModelPromptVisible(true);
      return;
    }
    setCutoutStatus("working");
    const result = part
      ? await isolateGarment(original, part)
      : await removeBackground(original);
    if ("image" in result) {
      setPhotoBeforeCutout(original);
      changePhoto(result.image);
      setCutoutStatus("done");
    } else setCutoutStatus(result.error);
  };
  const undoCutout = () => {
    if (!photoBeforeCutout) return;
    changePhoto(photoBeforeCutout);
    setPhotoBeforeCutout(undefined);
    setCutoutStatus("");
  };
  const removePhoto = () => {
    setImageUrl("");
    setPhotoBeforeCutout(undefined);
    setCutoutStatus("");
    setPhotoViewVisible(false);
  };
  const downloadModel = async () => {
    setCutoutStatus("");
    setModelProgress(0);
    const downloaded = await downloadGarmentModel(setModelProgress);
    setModelProgress(undefined);
    if (downloaded) await cutOut();
    else setCutoutStatus("downloadFailed");
  };
  const cutoutBusy = cutoutStatus === "working" || modelProgress !== undefined;
  // Earlier cutouts of tops and bottoms may still show the person.
  const canCutout =
    !!imageUrl && (!!part || !isCutout(imageUrl) || !!photoBeforeCutout);
  const cutoutError =
    cutoutStatus !== "" && cutoutStatus !== "working" && cutoutStatus !== "done"
      ? cutoutMessages[cutoutStatus][storedSettings.language]
      : undefined;
  // The photo view's cut-out button: its label says what it does.
  const cutoutLabel = (
    photoBeforeCutout
      ? localization.Undo
      : modelProgress !== undefined
      ? localization.DownloadingGarmentModel
      : part
      ? cutoutStatus === "working"
        ? localization.IsolatingGarment
        : localization.IsolateGarment
      : cutoutStatus === "working"
      ? localization.RemovingBackground
      : localization.RemoveBackground
  )[storedSettings.language].replace("{percent}", String(modelProgress ?? 0));
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
  // What Save would store; the form is changed when it differs from the
  // first render. The automatic name counts only once typed over.
  const formValues = JSON.stringify([
    wardrobeId,
    nameEdited ? name : "",
    brand,
    collection,
    category,
    type,
    stored,
    shownStyles,
    seasons,
    quantity,
    sizeUnit,
    size,
    hasPurchaseDate ? purchaseDate.getTime() : "",
    imageUrl,
    isAutoOn,
    savedColors,
  ]);
  const initialValues = useRef(formValues);
  // After Save & add next, the emptied form is the new starting point.
  const rebase = useRef(false);
  if (rebase.current) {
    rebase.current = false;
    initialValues.current = formValues;
  }
  const { leave, dialog: discardDialog } = useDiscardGuard(
    formValues !== initialValues.current,
    storedSettings.language,
  );
  const typeError =
    typeMissing && !type && combiningTypesData.length > 0
      ? localization.TypeRequired[storedSettings.language]
      : undefined;
  const savedMessage = (id?: string) => {
    const found = wardrobes.find(w => w.id === id);
    return found
      ? localization.SavedTo[storedSettings.language].replace(
          "{name}",
          found.name,
        )
      : localization.Saved[storedSettings.language];
  };
  function deleteItemHandler() {
    dispatch(deleteItem({ selectedId: storedItems.id }));
    dispatch(itemRefresher());
    leave(() => navigation.popToTop());
  }
  // Stores the garment; false when something is missing.
  function saveGarment() {
    const errors = [];
    if (wardrobeId && !validWardrobeId(wardrobes, wardrobeId)) {
      setErrorsList([
        localization.WardrobeUnavailable[storedSettings.language],
      ]);
      return false;
    }
    if (!type && combiningTypesData.length > 0) {
      // The subcategory sits beside the photo, at the top.
      setTypeMissing(true);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return false;
    }
    // An empty name is filled in as "Color Brand Type" on Save.
    const finalName = displayedName.trim() || generatedName;
    if (finalName.length <= 0) {
      errors.push(localization.NameRequired[storedSettings.language]);
    }
    if (errors.length > 0) {
      setErrorsList(errors);
      return false;
    }
    setErrorsList([]);
    const garment = {
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
      quantity: quantity,
      purchaseDate: hasPurchaseDate ? JSON.stringify(purchaseDate) : "",
      image: imageUrl,
      automaticColor: isAutoOn,
      primaryColor: savedColors[0],
      secondaryColor: savedColors[1],
      tertiaryColor: savedColors[2],
    };
    if (editingIndex) {
      dispatch(updateItem({ id: editingIndex, ...garment }));
    } else {
      dispatch(addItem(garment));
    }
    dispatch(setLastWardrobe({ wardrobeId: garment.wardrobeId }));
    dispatch(setLastSizeUnit({ sizeUnit: garment.sizeUnit }));
    return true;
  }
  function addItemHandler() {
    if (!saveGarment()) return;
    if (editingIndex) {
      leave(() => navigation.popToTop());
      dispatch(itemRefresher());
    } else {
      // New garments come from the Closet, which says where it went.
      const saved = savedMessage(validWardrobeId(wardrobes, wardrobeId));
      leave(() =>
        navigation.popTo("StackNavHome", {
          screen: "Closet",
          params: { saved },
        }),
      );
    }
  }
  // New garments: save, then start the next one in the same place.
  function saveAndAddNext() {
    if (!saveGarment()) return;
    extraction.current++;
    setImageUrl("");
    setPhotoBeforeCutout(undefined);
    setCutoutStatus("");
    setName("");
    setNameEdited(false);
    setBrand("");
    setType("");
    setColors(["", "", ""]);
    setColorSlots(1);
    setIsAutoOn(true);
    setSize("");
    setQuantityText("1");
    setTypeMissing(false);
    // Category, wardrobe, collection, storage, seasons, hand-picked styles,
    // size unit and purchase date stay for the next garment.
    rebase.current = true;
    setSavedNotice(savedMessage(validWardrobeId(wardrobes, wardrobeId)));
    scrollRef.current?.scrollTo({ y: 0, animated: false });
    setImageModalVisible(true);
  }
  // A new version of the photo; automatic colors follow it.
  const changePhoto = (photo: string) => {
    setImageUrl(photo);
    if (isAutoOn && photo) colorsExtractor(photo);
  };
  const onToggleSwitch = (val: boolean) => {
    extraction.current++;
    setIsAutoOn(val);
    if (val && imageUrl) {
      colorsExtractor(imageUrl);
    }
  };
  // Automatic colors: every color read from the photo, up to three.
  const colorsExtractor = async (base64: string) => {
    const read = ++extraction.current;
    const found = await extractColors(base64);
    if (read !== extraction.current || found.length === 0) return;
    setColors(
      Array.from({ length: MAX_COLORS }, (_, index) => found[index] ?? ""),
    );
    setColorSlots(found.length);
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
      {discardDialog}
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
        confirmLabel={localization.Download[storedSettings.language]}
        destructive={false}
        onConfirm={downloadModel}
      />
      <PhotoView
        visible={photoViewVisible && !!imageUrl}
        image={imageUrl}
        language={storedSettings.language}
        cutoutLabel={cutoutLabel}
        busy={cutoutBusy}
        message={cutoutError}
        onCutout={
          canCutout ? (photoBeforeCutout ? undoCutout : cutOut) : undefined
        }
        onFix={
          isCutout(imageUrl)
            ? () => {
                setPhotoViewVisible(false);
                setEditorVisible(true);
              }
            : undefined
        }
        onChange={() => {
          setPhotoViewVisible(false);
          setImageModalVisible(true);
        }}
        onRemove={removePhoto}
        onClose={() => setPhotoViewVisible(false)}
      />
      {isCutout(imageUrl) && (
        <CutoutEditor
          visible={editorVisible}
          image={imageUrl}
          original={photoBeforeCutout}
          language={storedSettings.language}
          onCancel={() => setEditorVisible(false)}
          onDone={edited => {
            setEditorVisible(false);
            changePhoto(edited);
          }}
        />
      )}
      <ColorModal
        colors={colors}
        setColors={next => {
          // Only a color confirmed by hand turns automatic colors off.
          colorsByHand();
          setColors(next);
        }}
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
        </View>
      </CustomModal>
      <ThemeView>
        <PageHeader
          title={
            editingIndex
              ? localization.EditGarment[storedSettings.language]
              : localization.Adding_an_item[storedSettings.language]
          }
          actions={
            <HeaderIcon
              name="checkmark"
              label={localization.Save[storedSettings.language]}
              onPress={addItemHandler}
            />
          }
        />
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <View style={styles.topRow}>
            <View style={styles.photo}>
              <ImageViewer
                width={PHOTO_WIDTH}
                fit={isCutout(imageUrl) ? "contain" : "cover"}
                imageUrl={imageUrl}
                onPress={() =>
                  imageUrl
                    ? setPhotoViewVisible(true)
                    : setImageModalVisible(true)
                }
              />
              {cutoutBusy && (
                <View pointerEvents="none" style={styles.photoBusy}>
                  <ActivityIndicator color={theme.colors.background} />
                  {modelProgress !== undefined && (
                    <ThemeText customStyle={styles.photoBusyText}>
                      {`${modelProgress}%`}
                    </ThemeText>
                  )}
                </View>
              )}
              {isCutout(imageUrl) && !cutoutBusy && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={
                    localization.FixCutout[storedSettings.language]
                  }
                  hitSlop={6}
                  onPress={() => setEditorVisible(true)}
                  style={styles.photoAction}
                >
                  <Icon name="brush" size={20} color={theme.colors.text} />
                </Pressable>
              )}
            </View>
            <View style={styles.topFields}>
              {/* The pickers open as modals, so they need no zIndex here. */}
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
              {combiningTypesData?.length > 0 && (
                <View>
                  <DropDownPicker
                    open={openType}
                    value={type}
                    items={combiningTypesData}
                    setOpen={setOpenType}
                    setValue={setType}
                    mode="SIMPLE"
                    listMode="MODAL"
                    placeholder={
                      localization.TypeRequiredLabel[storedSettings.language]
                    }
                    style={[
                      pickerStyle,
                      styles.picker,
                      !!typeError && styles.pickerError,
                    ]}
                    dropDownContainerStyle={pickerStyle}
                    theme={colorScheme}
                  />
                  {!!typeError && (
                    <ThemeText
                      accessibilityLiveRegion="polite"
                      customStyle={styles.fieldError}
                    >
                      {typeError}
                    </ThemeText>
                  )}
                </View>
              )}
              <CustomInput
                mode="outlined"
                dense
                label={localization.Brand[storedSettings.language]}
                value={brand}
                onChange={text => setBrand(text.nativeEvent.text)}
              />
            </View>
          </View>
          {!!cutoutError && (
            <ThemeText
              accessibilityLiveRegion="polite"
              customStyle={styles.cutoutError}
            >
              {cutoutError}
            </ThemeText>
          )}
          {cutoutStatus === "done" && photoBeforeCutout && (
            <View style={styles.cutoutDone}>
              <ThemeText
                accessibilityLiveRegion="polite"
                customStyle={captionText}
              >
                {localization.BackgroundRemoved[storedSettings.language]}
              </ThemeText>
              <Button compact onPress={undoCutout}>
                {localization.Undo[storedSettings.language]}
              </Button>
            </View>
          )}
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
                        // Automatic colors stay on until a color is confirmed.
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
                    {index > 0 && (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`${
                          localization.RemoveColor[storedSettings.language]
                        }: ${label[storedSettings.language]}`}
                        onPress={() => removeColor(index)}
                        hitSlop={12}
                        style={styles.removeColor}
                      >
                        <Icon
                          name="close"
                          size={16}
                          color={theme.colors.background}
                        />
                      </Pressable>
                    )}
                  </View>
                ))}
              {colorSlots < MAX_COLORS && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={
                    colorSlots === 1
                      ? localization.AddSecondaryColor[storedSettings.language]
                      : localization.AddTertiaryColor[storedSettings.language]
                  }
                  accessibilityState={{ disabled: !colors[colorSlots - 1] }}
                  disabled={!colors[colorSlots - 1]}
                  onPress={addColorSlot}
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
            {isAutoOn && (
              <ThemeText customStyle={captionText}>
                {localization.ColorsFromPhoto[storedSettings.language]}
              </ThemeText>
            )}
          </View>

          <View>
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
            {!nameEdited && (
              <ThemeText customStyle={[captionText, styles.helper]}>
                {localization.AutomaticName[storedSettings.language]}
              </ThemeText>
            )}
          </View>
          <View style={styles.seasons}>
            <ThemeText customStyle={styles.sectionLabel}>
              {localization.Seasons[storedSettings.language]}
            </ThemeText>
            <View style={styles.seasonChips}>
              {(seasonList[storedSettings.language] ?? []).map(option => (
                <FilterChip
                  dense
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
                  dense
                  key={value}
                  label={styleNames[storedSettings.language][value]}
                  selected={shownStyles.includes(value)}
                  onPress={() => toggleStyle(value)}
                />
              ))}
            </View>
          </View>

          <SectionHeading
            title={localization.Details[storedSettings.language]}
          />
          <View style={styles.fieldRow}>
            <View style={styles.half}>
              <WardrobeSelector value={wardrobeId} onChange={setWardrobeId} />
            </View>
            {/* A tick box, so it's clear whether the garment is stored. */}
            <Pressable
              accessibilityRole="checkbox"
              accessibilityLabel={localization.InStorage[storedSettings.language]}
              accessibilityState={{ checked: stored }}
              onPress={() => setStored(!stored)}
              style={[styles.half, styles.storageBox]}
            >
              <Icon
                name={stored ? "checkbox" : "square-outline"}
                size={24}
                color={stored ? theme.colors.bar : theme.colors.muted}
              />
              <Icon
                name="archive-outline"
                size={20}
                color={theme.colors.text}
              />
              <ThemeText numberOfLines={1} customStyle={styles.storageText}>
                {localization.InStorage[storedSettings.language]}
              </ThemeText>
            </Pressable>
          </View>
          <View style={styles.fieldRow}>
            <FieldBox
              label={localization.Size[storedSettings.language]}
              style={styles.half}
            >
              <TextInput
                accessibilityLabel={localization.Size[storedSettings.language]}
                value={String(size ?? "")}
                onChangeText={setSize}
                maxLength={6}
                style={styles.boxInput}
              />
            </FieldBox>
            <View style={styles.half}>
              <DropDownPicker
                open={openSizeUnit}
                value={sizeUnit}
                items={sizeList}
                setOpen={setOpenSizeUnit}
                setValue={setSizeUnit}
                mode="SIMPLE"
                listMode="MODAL"
                placeholder={localization.Unit[storedSettings.language]}
                style={[pickerStyle, styles.boxPicker]}
                dropDownContainerStyle={pickerStyle}
                theme={colorScheme}
              />
            </View>
          </View>
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
            style={[pickerStyle, styles.boxPicker]}
            dropDownContainerStyle={pickerStyle}
          />
          <View style={styles.fieldRow}>
            <View style={styles.half}>
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
            <FieldBox
              label={localization.Quantity[storedSettings.language]}
              style={styles.half}
              right={
                <View style={styles.stepper}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={
                      localization.LessQuantity[storedSettings.language]
                    }
                    disabled={quantity <= 1}
                    onPress={() => setQuantityText(String(quantity - 1))}
                    style={[styles.step, quantity <= 1 && styles.disabled]}
                  >
                    <Icon
                      name="chevron-down"
                      size={22}
                      color={theme.colors.text}
                    />
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={
                      localization.MoreQuantity[storedSettings.language]
                    }
                    disabled={quantity >= 99}
                    onPress={() => setQuantityText(String(quantity + 1))}
                    style={[styles.step, quantity >= 99 && styles.disabled]}
                  >
                    <Icon
                      name="chevron-up"
                      size={22}
                      color={theme.colors.text}
                    />
                  </Pressable>
                </View>
              }
            >
              <TextInput
                accessibilityLabel={
                  localization.Quantity[storedSettings.language]
                }
                value={quantityText}
                onChangeText={text =>
                  setQuantityText(text.replace(/[^0-9]/g, ""))
                }
                keyboardType="numeric"
                maxLength={2}
                style={styles.boxInput}
              />
            </FieldBox>
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
          {!editingIndex && (
            <Button mode="outlined" onPress={saveAndAddNext}>
              {localization.SaveAndAddNext[storedSettings.language]}
            </Button>
          )}
        </ScrollView>
        <Snackbar
          visible={!!savedNotice}
          onDismiss={() => setSavedNotice("")}
          duration={3000}
        >
          {savedNotice}
        </Snackbar>
      </ThemeView>
    </>
  );
};
const styles = StyleSheet.create({
  content: {
    padding: theme.spacing.md,
    paddingBottom: 40,
    gap: theme.spacing.sm,
  },
  topRow: {
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  topFields: {
    flex: 1,
    justifyContent: "space-between",
    gap: theme.spacing.sm,
  },
  // Stretches to the height of the fields beside it, so no space is left
  // under the photo and the corner buttons stay on it.
  photo: {
    alignSelf: "stretch",
  },
  photoAction: {
    position: "absolute",
    right: theme.spacing.xs,
    bottom: theme.spacing.xs,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.muted,
    justifyContent: "center",
    alignItems: "center",
  },
  photoBusy: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: theme.radius.sm,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
    gap: theme.spacing.xs,
  },
  cutoutError: {
    color: theme.colors.danger,
    fontSize: theme.type.caption,
  },
  cutoutDone: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
  },
  photoBusyText: {
    color: theme.colors.background,
    fontSize: theme.type.caption,
  },
  picker: {
    minHeight: 40,
  },
  pickerError: {
    borderColor: theme.colors.danger,
    borderWidth: 2,
  },
  fieldError: {
    color: theme.colors.danger,
    fontSize: theme.type.caption,
  },
  helper: {
    paddingHorizontal: theme.spacing.xs,
    paddingTop: 2,
  },
  colors: {
    gap: theme.spacing.sm,
  },
  seasons: {
    gap: theme.spacing.xs,
  },
  seasonChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs,
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
    gap: theme.spacing.sm,
  },
  colorSwatch: {
    width: 40,
    height: 40,
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
  // 24dp, with a hitSlop of 12 around it.
  removeColor: {
    position: "absolute",
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.muted,
    justifyContent: "center",
    alignItems: "center",
  },
  fieldRow: {
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  half: {
    flex: 1,
  },
  storageBox: {
    ...fieldBox,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
  },
  storageText: {
    flexShrink: 1,
  },
  boxInput: {
    padding: 0,
    fontSize: theme.type.body,
    color: theme.colors.text,
  },
  boxPicker: {
    minHeight: fieldBox.minHeight,
  },
  stepper: {
    flexDirection: "row",
  },
  step: {
    width: 40,
    minHeight: fieldBox.minHeight,
    justifyContent: "center",
    alignItems: "center",
  },
  actions: {
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  action: {
    flex: 1,
  },
});
