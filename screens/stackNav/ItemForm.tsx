// import { useNavigation } from "@react-navigation/native";
import {
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Button, Switch } from "react-native-paper";
import { useState } from "react";
import { BackButton } from "../../components/BackButton";
import { useDispatch, useSelector } from "react-redux";
import {
  addItem,
  updateItem,
  itemRefresher,
  deleteItem,
  resetLaundryCounter,
  laundryRefresher,
  enableLaundry4Object,
} from "../../redux/itemsSlice";
import { launchCamera, launchImageLibrary } from "react-native-image-picker";
import ColorModal from "../../components/ColorModal";
import Icon from "react-native-vector-icons/FontAwesome5";
import { CustomInput } from "../../components/CustomInput";
import { RootState } from "../../redux/store";
import DropDownPicker, { ThemeNameType } from "react-native-dropdown-picker";
import CustomModal from "../../components/CustomModal";
// import { getAllSwatches } from "react-native-palette";
import { getPalette } from "@somesoap/react-native-image-palette";
import { ThemeView } from "../../components/ThemeView";
import { ThemeText } from "../../components/ThemeText";
import { CommonActions } from "@react-navigation/native";
import { DatePicker } from "../../components/DatePicker";
import { RandomNamesP1, fitList, sizeList, seasonList } from "../../utils/data";
import ReactNativeBlobUtil from "react-native-blob-util";
import ImageResizer from "@bam.tech/react-native-image-resizer";
import {
  getCollectionSortValue,
  getOrderedCollectionTags,
} from "../../utils/collectionOrder";
import { clothesList, localization } from "../../utils/localization";
import { defaultCategories } from "./Category";
import { LaundryOptionsModal } from "../../components/LaundryOptionsModal";
import { ImageViewer } from "../../components/ImageViewer";
export function get_random<T>(list: T[]): T {
  return list[Math.floor(Math.random() * list.length)];
}
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
  const [name, setName] = useState(storedItems ? storedItems.name : "");
  const [collection, setCollection] = useState(storedItems?.collection ?? []);
  const [type, setType] = useState(storedItems ? storedItems.type : "");
  const [fit, setFit] = useState(storedItems ? storedItems.fit : "");
  const [season, setSeason] = useState(storedItems?.season ?? null);
  const [quantity, setQuantity] = useState(
    storedItems ? storedItems.quantity : 1,
  );
  const [sizeUnit, setSizeUnit] = useState(
    storedItems ? storedItems.sizeUnit : "",
  );
  const [size, setSize] = useState(storedItems ? storedItems.size : "");
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
  const [openType, setOpenType] = useState(false);
  const [openFit, setOpenFit] = useState(false);
  const [openSeason, setOpenSeason] = useState(false);
  const [openSizeUnit, setOpenSizeUnit] = useState(false);
  const [openCollection, setOpenCollection] = useState(false);
  const [isAutoOn, setIsAutoOn] = useState(
    storedItems ? storedItems.automaticColor : false,
  );
  const [LaundryCheck, setLaundryCheck] = useState(
    storedItems?.laundryable ?? true,
  );
  const colorScheme = String("LIGHT") as ThemeNameType;
  const dispatch = useDispatch();
  const [visible, setVisible] = useState(false);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [openLaundryOpt, setOpenLaundryOpt] = useState(false);
  const [maxLaundryNumber, setMaxLaundryNumber] = useState(
    storedItems ? storedItems.maxLaundryNumber : 0,
  );
  const [overrideMaxLaundry, setOverrideMaxLaundry] = useState(
    storedItems ? storedItems.overrideMaxLaundry : false,
  );
  const combiningTypesData =
    (selectedCategory ?? storedItems.category) < defaultCategories.length
      ? [
          ...(clothesList[storedSettings.language]?.[
            selectedCategory ?? storedItems.category
          ] || []),
          ...(
            storedCatTypes?.[selectedCategory ?? storedItems.category]
              ?.customTypes || []
          ).map(item => ({
            label: item.label,
            value: item.value,
          })),
        ]
      : (
          storedCatTypes?.[selectedCategory ?? storedItems.category]
            ?.customTypes || []
        ).map(item => ({
          label: item.label,
          value: item.value,
        }));
  function deleteItemHandler() {
    dispatch(deleteItem({ selectedId: storedItems.id }));
    dispatch(itemRefresher());
    dispatch(laundryRefresher());
    navigation.popToTop("Category");
  }
  function resetLaundryCounterHandler() {
    dispatch(resetLaundryCounter({ selectedId: storedItems.id }));
    dispatch(laundryRefresher());
  }
  function addItemHandler() {
    const errors = [];
    if (name.length <= 0) {
      errors.push("Please enter item name");
    }
    if (name.length > 20) {
      errors.push("Please enter a name within 20 characters");
    }
    if (!type && combiningTypesData.length > 0) {
      errors.push("Please choose a type");
    }
    if (errors.length > 0) {
      setErrorsList(errors);
      return;
    }
    setErrorsList([]);
    if (editingIndex) {
      dispatch(
        updateItem({
          itemIndex: currentIndex,
          name: name,
          collection: collection,
          category: selectedCategory,
          type: type,
          fit: fit,
          season: season,
          size: size,
          sizeUnit: sizeUnit,
          quantity: quantity === 0 ? 1 : quantity,
          purchaseDate: JSON.stringify(purchaseDate),
          image: imageUrl,
          automaticColor: isAutoOn,
          primaryColor: colors[0],
          secondaryColor: colors[1],
          tertiaryColor: colors[2],
          overrideMaxLaundry: overrideMaxLaundry,
          maxLaundryNumber: maxLaundryNumber,
        }),
      );
      dispatch(
        enableLaundry4Object({
          selectedId: storedItems.id,
          laundryValue: LaundryCheck,
        }),
      );
      dispatch(laundryRefresher());
    } else {
      dispatch(
        addItem({
          name: name,
          collection: collection,
          category: selectedCategory,
          type: type,
          fit: fit,
          season: season,
          size: size,
          sizeUnit: sizeUnit,
          quantity: quantity === 0 ? 1 : quantity,
          purchaseDate: JSON.stringify(purchaseDate),
          image: imageUrl,
          automaticColor: isAutoOn,
          primaryColor: colors[0],
          secondaryColor: colors[1],
          tertiaryColor: colors[2],
        }),
      );
    }
    navigation.popToTop("Category");
    if (!editingIndex) {
      navigation.dispatch(CommonActions.goBack());
    } else {
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
      setColors([primary, secondary, tertiary]);
      try {
        await ReactNativeBlobUtil.fs.unlink(tmp);
      } catch {}
    } catch (e) {
      console.log("colorExtractor error:", e);
    }
  };
  const handleImagePicker = async (type: number) => {
    if (type == 0) {
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
              .then(async response => {
                const base64 = await ReactNativeBlobUtil.fs.readFile(
                  response.uri,
                  "base64",
                );
                console.log("imageSize", response.size);
                setImageUrl(base64 || "");
                setImageModalVisible(false);
              })
              .catch(err => {
                console.log("image comparison error: ", err);
              });
          }
        },
      );
    } else if (1) {
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
                .then(async response => {
                  const base64 = await ReactNativeBlobUtil.fs.readFile(
                    response.uri,
                    "base64",
                  );
                  console.log("imageSize", response.size);
                  setImageUrl(base64 || "");
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
      <ColorModal
        colors={colors}
        setColors={setColors}
        visible={visible}
        setVisible={setVisible}
        colorSelection={colorSelection}
      />
      <LaundryOptionsModal
        openLaundryOpt={openLaundryOpt}
        setOpenLaundryOpt={setOpenLaundryOpt}
        LaundryCheck={LaundryCheck}
        setLandryCheck={setLaundryCheck}
        maxLaundryNumber={maxLaundryNumber}
        setMaxLaundryNumber={setMaxLaundryNumber}
        overrideMaxLaundry={overrideMaxLaundry}
        setOverrideMaxLaundry={setOverrideMaxLaundry}
      />
      <CustomModal
        setVisible={setImageModalVisible}
        visible={imageModalVisible}
        label={localization.import_image[storedSettings.language]}
      >
        <View style={[{ paddingHorizontal: 24, rowGap: 20, marginTop: 20 }]}>
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
        <BackButton
          pageTitle={
            editingIndex
              ? localization.EditingItem[storedSettings.language]
              : localization.Adding_an_item[storedSettings.language]
          }
        />
        <View style={[{ alignItems: "center", rowGap: 8 }]}>
          <View style={[{ flexDirection: "row", marginTop: 16 }]}>
            <View style={[{ width: "33.333333333333336%" }]}></View>
            <View
              style={[
                {
                  width: "33.333333333333336%",
                  flexDirection: "row",
                  justifyContent: "center",
                },
              ]}
            >
              <ImageViewer
                imageUrl={imageUrl}
                setImageModalVisible={setImageModalVisible}
              />
            </View>
            <View
              style={[
                {
                  width: "33.333333333333336%",
                  flexDirection: "row",
                  justifyContent: "center",
                  alignItems: "center",
                },
              ]}
            >
              {editingIndex && (
                <TouchableOpacity
                  onPress={() => {
                    setOpenLaundryOpt(true);
                  }}
                  style={[
                    {
                      flexDirection: "column",
                      alignItems: "center",
                      marginRight: 20,
                    },
                  ]}
                >
                  <ThemeText>
                    {localization.Laundry_Options[storedSettings.language]}
                  </ThemeText>
                  <ThemeText>{storedItems.laundryCounter}</ThemeText>
                </TouchableOpacity>
              )}
            </View>
          </View>
          <CustomInput
            mode="outlined"
            textContentType="name"
            style={[
              styles.customWidth,
              {
                textAlign: storedSettings.language == 1 ? "right" : "left",
              },
            ]}
            label={localization.Name[storedSettings.language]}
            value={name}
            onChange={text => setName(text.nativeEvent.text)}
            right={
              <Pressable
                hitSlop={{ bottom: 20, left: 20, right: 10, top: 20 }}
                onPress={() => setName(get_random(RandomNamesP1))}
              >
                <Icon name="dice" size={15} color="#111111" />
              </Pressable>
            }
          />
          {combiningTypesData?.length > 0 && (
            <View style={[{ zIndex: 2 }, styles.customWidth]}>
              <DropDownPicker
                open={openType}
                value={type}
                items={combiningTypesData}
                setOpen={setOpenType}
                setValue={setType}
                mode="SIMPLE"
                listMode="MODAL"
                placeholder={localization.Type[storedSettings.language]}
                style={{ borderColor: "#777777" }}
                dropDownContainerStyle={{ borderColor: "#777777" }}
                theme={colorScheme}
              />
            </View>
          )}
          {(selectedCategory ?? storedItems.category) < 2 && (
            <View
              style={[
                {
                  width: "80%",
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  zIndex: 3,
                },
              ]}
            >
              <View style={{ width: "49%" }}>
                <DropDownPicker
                  open={openFit}
                  value={fit}
                  items={fitList}
                  setOpen={setOpenFit}
                  setValue={setFit}
                  mode="SIMPLE"
                  placeholder={localization.Fit[storedSettings.language]}
                  style={{ borderColor: "#777777" }}
                  dropDownContainerStyle={{
                    borderColor: "#777777",
                  }}
                  theme={colorScheme}
                />
              </View>
              <View style={{ width: "49%" }}>
                <DropDownPicker
                  open={openSeason}
                  value={season}
                  items={seasonList[storedSettings.language]}
                  setOpen={setOpenSeason}
                  setValue={setSeason}
                  mode="SIMPLE"
                  placeholder={localization.Season[storedSettings.language]}
                  style={{ borderColor: "#777777" }}
                  dropDownContainerStyle={{
                    borderColor: "#777777",
                  }}
                  theme={colorScheme}
                />
              </View>
            </View>
          )}
          <View
            style={[
              {
                width: "80%",
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                zIndex: 2,
              },
            ]}
          >
            <CustomInput
              mode="outlined"
              style={{ width: "40%" }}
              label={localization.Quantity[storedSettings.language]}
              value={String(quantity)}
              onChange={text => setQuantity(Number(text.nativeEvent.text))}
              keyboardType="numeric"
              maxLength={2}
            />
            <View style={{ width: "28%" }}>
              <DropDownPicker
                open={openSizeUnit}
                value={sizeUnit}
                items={sizeList}
                setOpen={setOpenSizeUnit}
                setValue={setSizeUnit}
                mode="SIMPLE"
                placeholder={localization.Unit[storedSettings.language]}
                style={{ borderColor: "#777777", marginTop: 5 }}
                dropDownContainerStyle={{ borderColor: "#777777" }}
                theme={colorScheme}
              />
            </View>
            <CustomInput
              mode="outlined"
              style={{ width: "28%" }}
              label={localization.Size[storedSettings.language]}
              value={String(size)}
              onChange={text => setSize(text.nativeEvent.text)}
              maxLength={6}
            />
          </View>
          <DatePicker
            title={localization.Purchase_Date[storedSettings.language]}
            date={purchaseDate}
            isDatePickerVisible={isDatePickerVisible}
            setDate={setPurchaseDate}
            setDatePickerVisibility={setDatePickerVisibility}
          />
          <View style={[{ zIndex: 1 }, styles.customWidth]}>
            <DropDownPicker
              open={openCollection}
              value={collection}
              items={collectionOptions}
              setOpen={setOpenCollection}
              setValue={setCollection}
              multiple={true}
              theme={colorScheme}
              // badgeDotColors={CollectionColors}
              showBadgeDot={false}
              badgeTextStyle={{ color: "#111111" }}
              mode="BADGE"
              listMode="SCROLLVIEW"
              placeholder={localization.Collection[storedSettings.language]}
              style={{ borderColor: "#777777" }}
              dropDownContainerStyle={{ borderColor: "#777777" }}
            />
          </View>

          <View
            style={[
              [
                {},
                storedSettings.language == 1
                  ? { flexDirection: "row-reverse" }
                  : { flexDirection: "row" },
                {},
              ],
            ]}
          >
            <Icon name="info-circle" size={15} color="#111111" />
            <ThemeText customStyle={[{ marginHorizontal: 8 }]}>
              {localization.You_can_add[storedSettings.language]}
            </ThemeText>
          </View>

          <View style={[{ flexDirection: "row", alignItems: "center" }]}>
            <ThemeText>
              {localization.Automatic_color_selection[storedSettings.language]}
            </ThemeText>
            <Switch
              color="#111111"
              value={isAutoOn}
              onValueChange={onToggleSwitch}
            />
          </View>

          {!isAutoOn && (
            <View
              style={[
                {
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderWidth: 1,
                  width: "80%",
                  height: 32,
                  paddingHorizontal: 20,
                },
              ]}
            >
              <ThemeText>
                {localization.Primary_color[storedSettings.language]}
              </ThemeText>
              <Pressable
                onPress={() => {
                  setVisible(true);
                  setColorSelection(0);
                }}
              >
                <View
                  style={[
                    { height: 20, width: 20, borderWidth: 0.2 },
                    { backgroundColor: "#ffffff" },
                  ]}
                />
              </Pressable>
            </View>
          )}
          {!isAutoOn && (
            <View
              style={[
                {
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderWidth: 1,
                  width: "80%",
                  height: 32,
                  paddingHorizontal: 20,
                },
              ]}
            >
              <ThemeText>
                {localization.Secondary_color[storedSettings.language]}
              </ThemeText>
              <Pressable
                onPress={() => {
                  setVisible(true);
                  setColorSelection(1);
                }}
              >
                <View
                  style={[
                    { height: 20, width: 20, borderWidth: 0.2 },
                    { backgroundColor: "#ffffff" },
                  ]}
                />
              </Pressable>
            </View>
          )}
          {!isAutoOn && (
            <View
              style={[
                {
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderWidth: 1,
                  width: "80%",
                  height: 32,
                  paddingHorizontal: 20,
                },
              ]}
            >
              <ThemeText>
                {localization.Tertiary_color[storedSettings.language]}
              </ThemeText>
              <Pressable
                onPress={() => {
                  setVisible(true);
                  setColorSelection(2);
                }}
              >
                <View
                  style={[
                    { height: 20, width: 20, borderWidth: 0.2 },
                    { backgroundColor: "#ffffff" },
                  ]}
                />
              </Pressable>
            </View>
          )}

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
          <View
            style={[
              { flexDirection: "row", justifyContent: "center", columnGap: 20 },
            ]}
          >
            <Button mode="outlined" onPress={addItemHandler}>
              {localization.Save[storedSettings.language]}
            </Button>
            {editingIndex && (
              <Button mode="outlined" onPress={deleteItemHandler}>
                {localization.Delete[storedSettings.language]}
              </Button>
            )}
            {editingIndex &&
              (storedItems.laundryCounter ?? 0) >=
                (storedItems.overrideMaxLaundry ?? false
                  ? storedItems.maxLaundryNumber
                  : storedSettings.laundryNumber) &&
              (storedItems.laundryable ?? true) && (
                <Button mode="outlined" onPress={resetLaundryCounterHandler}>
                  {localization.Cleaned[storedSettings.language]}
                </Button>
              )}
          </View>
        </View>
      </ThemeView>
    </>
  );
};
const styles = StyleSheet.create({
  customWidth: { width: "80%" },
});
