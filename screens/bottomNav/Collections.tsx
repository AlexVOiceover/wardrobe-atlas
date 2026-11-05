import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../../redux/store";
import {
  addCollection,
  moveCollection,
  newCollectionValue,
} from "../../redux/itemsSlice";
import { setCollectionSortValue } from "../../redux/settingsSlice";
import {
  COLLECTION_SORT_VALUES,
  getCollectionSortValue,
  getOrderedCollectionTags,
} from "../../utils/collectionOrder";
import { defaultCollectionColor } from "../../utils/colors";
import { countText, localization as l } from "../../utils/localization";
import { captionText, theme } from "../../utils/theme";
import { SORT_ICON } from "../../utils/sorts";
import { ThemeView } from "../../components/ThemeView";
import { HeaderIcon, PageHeader } from "../../components/PageHeader";
import { ListRow } from "../../components/ListRow";
import { EmptyState } from "../../components/EmptyState";
import { AddButton, ADD_BUTTON_CLEARANCE } from "../../components/AddButton";
import { BottomSheet } from "../../components/BottomSheet";
import { FilterChip } from "../../components/FilterChip";
import { ThemeText } from "../../components/ThemeText";
import { CollectionNameSheet } from "../../components/CollectionNameSheet";

/** Every collection with its garment count; one opens its own page. */
export const Collections = ({ navigation }: { navigation: any }) => {
  const { collectionTags, items } = useSelector((s: RootState) => s.itemsList);
  const settings = useSelector((s: RootState) => s.settings);
  const language = settings.language;
  const sortValue = getCollectionSortValue(settings.collectionSortValue);
  const collections = getOrderedCollectionTags(collectionTags, sortValue);
  const dispatch = useDispatch();
  const [isNaming, setIsNaming] = useState(false);
  const [isOrderOpen, setIsOrderOpen] = useState(false);
  const sortOptions = [
    { label: l.Custom[language], value: COLLECTION_SORT_VALUES.CUSTOM },
    { label: l.Name_Asc[language], value: COLLECTION_SORT_VALUES.NAME_ASC },
    { label: l.Name_Desc[language], value: COLLECTION_SORT_VALUES.NAME_DESC },
  ];
  const garmentCount = (value: string) =>
    countText(
      l.GarmentCount,
      l.GarmentsCount,
      items.filter(garment => garment.collection?.includes(value)).length,
      language,
    );
  return (
    <ThemeView>
      <PageHeader
        back={false}
        title={l.Collections[language]}
        actions={
          collections.length > 1 && (
            <HeaderIcon
              name={SORT_ICON}
              label={l.Order[language]}
              onPress={() => setIsOrderOpen(true)}
            />
          )
        }
      />
      <ScrollView contentContainerStyle={styles.content}>
        {collections.length === 0 ? (
          <EmptyState
            message={l.NoCollectionsYet[language]}
            action={l.NewCollection[language]}
            onAction={() => setIsNaming(true)}
          />
        ) : (
          collections.map(collection => (
            <ListRow
              key={collection.value}
              icon="albums-outline"
              title={collection.label}
              subtitle={garmentCount(collection.value)}
              onPress={() =>
                navigation.navigate("Collection", { value: collection.value })
              }
            />
          ))
        )}
      </ScrollView>
      <AddButton
        label={l.NewCollection[language]}
        onPress={() => setIsNaming(true)}
      />
      <CollectionNameSheet
        isOpen={isNaming}
        setIsOpen={setIsNaming}
        title={l.NewCollection[language]}
        language={language}
        collections={collectionTags}
        onSave={name => {
          // The id the store gives it, which may be "Name (2)".
          const value = newCollectionValue(collectionTags, name);
          dispatch(addCollection({ name, color: defaultCollectionColor }));
          // Straight to choosing its garments.
          navigation.navigate("Collection", { value, edit: true });
        }}
      />
      <BottomSheet
        isOpen={isOrderOpen}
        setIsOpen={setIsOrderOpen}
        title={l.Order[language]}
      >
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
        {/* The custom order is set here, one step at a time. */}
        {sortValue === COLLECTION_SORT_VALUES.CUSTOM && (
          <ThemeText customStyle={[captionText, styles.hint]}>
            {l.CustomOrderHint[language]}
          </ThemeText>
        )}
        {sortValue === COLLECTION_SORT_VALUES.CUSTOM &&
          collections.map((collection, index) => (
            <View key={collection.value} style={styles.orderRow}>
              <ThemeText numberOfLines={1} customStyle={styles.orderLabel}>
                {collection.label}
              </ThemeText>
              {(["up", "down"] as const).map(direction => {
                const disabled =
                  direction === "up"
                    ? index === 0
                    : index === collections.length - 1;
                return (
                  <Pressable
                    key={direction}
                    accessibilityRole="button"
                    accessibilityLabel={`${
                      direction === "up"
                        ? l.MoveUp[language]
                        : l.MoveDown[language]
                    }: ${collection.label}`}
                    accessibilityState={{ disabled }}
                    disabled={disabled}
                    onPress={() =>
                      dispatch(
                        moveCollection({ value: collection.value, direction }),
                      )
                    }
                    style={styles.orderButton}
                  >
                    <Icon
                      name={direction === "up" ? "arrow-up" : "arrow-down"}
                      size={20}
                      color={disabled ? theme.colors.border : theme.colors.text}
                    />
                  </Pressable>
                );
              })}
            </View>
          ))}
      </BottomSheet>
    </ThemeView>
  );
};
const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.md,
    paddingBottom: ADD_BUTTON_CLEARANCE,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  hint: {
    marginBottom: theme.spacing.xs,
  },
  orderRow: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  orderLabel: {
    flex: 1,
  },
  orderButton: {
    width: theme.touch,
    height: theme.touch,
    justifyContent: "center",
    alignItems: "center",
  },
});
