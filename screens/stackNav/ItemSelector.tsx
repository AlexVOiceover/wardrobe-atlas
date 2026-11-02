import { useSelector } from "react-redux";
import { ThemeView } from "../../components/ThemeView";
import { ScrollView, View, StyleSheet } from "react-native";
import React, { useState, useMemo } from "react";
import { CollectionContainer } from "../../components/CollectionContainer";
import {
  filterCollectionsBySearch,
  filterItemsBySearch,
} from "../../utils/filters";
import {
  getCollectionSortValue,
  getOrderedCollectionTags,
} from "../../utils/collectionOrder";
import { Button, Snackbar } from "react-native-paper";
import { RootState } from "../../redux/store";
import { item } from "../../redux/itemsSlice";
import { SelectionItemBox } from "../../components/SelectionItemBox";
import { useNavigation } from "@react-navigation/native";
import { PageHeader } from "../../components/PageHeader";
import { garmentSummary } from "../../components/ItemBox";
import { GarmentGrid } from "../../components/GarmentGrid";
import { SearchField } from "../../components/SearchField";
import { localization } from "../../utils/localization";
import { theme } from "../../utils/theme";
export const ItemSelector = () => {
  const itemsState = useSelector((state: RootState) => state.itemsList);
  const storedSettings = useSelector((state: RootState) => state.settings);
  const [search, setSearch] = useState("");
  const [selectedIdCollector, setSelectedIdCollector] = useState<string[]>([]);
  const navigation = useNavigation<any>();
  const [visible, setVisible] = useState(false);
  const onToggleSnackBar = () => setVisible(!visible);
  const onDismissSnackBar = () => setVisible(false);
  const groupedData = useMemo(() => {
    let collections: item[][] = [];
    let tags = getOrderedCollectionTags(
      itemsState.collectionTags,
      getCollectionSortValue(storedSettings.collectionSortValue),
    );
    let items = itemsState.items;
    if (tags.length > 0) {
      for (let i = 0; i < tags.length; i++) {
        const col = items.filter(x => x.collection?.includes(tags[i].value));
        collections.push(col);
      }
    }
    const nonCollected = items.filter(
      x => !x.collection || x.collection.length === 0,
    );
    return {
      tags,
      collections: filterCollectionsBySearch(collections, search),
      nonCollected: filterItemsBySearch(nonCollected, search),
    };
  }, [
    itemsState.items,
    itemsState.collectionTags,
    search,
    storedSettings.collectionSortValue,
  ]);
  const language = storedSettings.language;
  const renderGarment = (garment: item) => (
    <SelectionItemBox
      {...garmentSummary(garment)}
      setSelectedIdCollector={setSelectedIdCollector}
      selectedIdCollector={selectedIdCollector}
    />
  );
  return (
    <ThemeView>
      <PageHeader title={localization.SelectItems[language]} />
      <SearchField
        value={search}
        placeholder={localization.SearchPlaceholder[language]}
        onChangeText={setSearch}
      />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {groupedData.tags.map((collection, index) => {
          const collectionItems = groupedData.collections[index];
          if (!collectionItems || collectionItems.length === 0) return null;
          return (
            <CollectionContainer
              key={`col-${collection.value}`}
              label={collection.label}
            >
              <GarmentGrid
                garments={collectionItems}
                renderGarment={renderGarment}
              />
            </CollectionContainer>
          );
        })}
        {groupedData.nonCollected.length > 0 && (
          <GarmentGrid
            garments={groupedData.nonCollected}
            renderGarment={renderGarment}
          />
        )}
      </ScrollView>
      <View style={styles.footer}>
        <Button
          mode="contained"
          onPress={() => {
            if (selectedIdCollector.length > 0) {
              navigation.navigate("EventLogForm", {
                selectedIDs: selectedIdCollector,
              });
            } else {
              onToggleSnackBar();
            }
          }}
        >
          {localization.Next[language]}
        </Button>
      </View>
      <Snackbar visible={visible} onDismiss={onDismissSnackBar}>
        {localization.SelectAtLeastOneItem[language]}
      </Snackbar>
    </ThemeView>
  );
};
const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.md,
  },
  footer: {
    padding: theme.spacing.md,
  },
});
