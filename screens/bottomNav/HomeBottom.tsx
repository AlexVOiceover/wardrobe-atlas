import { useWardrobeView } from "../../components/WardrobeSelector";
import { filterByWardrobe } from "../../utils/wardrobes";
import { localization as l } from "../../utils/localization";
import { ScrollView, Keyboard, StyleSheet, View } from "react-native";
import { ThemeView } from "../../components/ThemeView";
import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { ItemBox, garmentSummary } from "../../components/ItemBox";
import { item } from "../../redux/itemsSlice";
import { useNavigation } from "@react-navigation/native";
import { BottomSheet } from "../../components/BottomSheet";
import HomeFilterPanel, {
  HomeFilterActions,
  HomeFilterState,
  resetHomeFilters,
} from "./HomeFilterPanel";
import HomeHeader from "./HomeHeader";
import {
  HomeFilter,
  activeFilterCount,
  filterCollectionsBySearch,
  filterItemsBySearch,
} from "../../utils/filters";
import {
  getCollectionSortValue,
  getOrderedCollectionTags,
} from "../../utils/collectionOrder";
import { defaultCategories } from "../stackNav/Category";
import { CollectionContainer } from "../../components/CollectionContainer";
import { AddButton, ADD_BUTTON_CLEARANCE } from "../../components/AddButton";
import { EmptyState } from "../../components/EmptyState";
import { cardDensity, GarmentGrid } from "../../components/GarmentGrid";
import { FilterChip } from "../../components/FilterChip";
import {
  GRID_COLUMN_OPTIONS,
  normalizeGridColumns,
  setGridColumns,
} from "../../redux/settingsSlice";
import { theme } from "../../utils/theme";
export function HomeBottom() {
  //this is the main page
  const navigation = useNavigation<any>();
  const itemsState = useSelector((state: RootState) => state.itemsList);
  const { selected, select } = useWardrobeView();
  const activeWardrobe =
    selected && !itemsState.wardrobes.some(w => w.id === selected)
      ? undefined
      : selected;
  useEffect(() => {
    if (activeWardrobe !== selected) select(undefined);
  }, [activeWardrobe, selected, select]);
  const [search, setSearch] = useState("");
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [sortValue, setSortValue] = useState("LA");
  const [categoriesFilter, setCategoriesFilter] = useState<any[]>([]);
  const [TypeFilter, setTypeFilter] = useState<string[]>([]);
  const [seasonFilter, setSeasonFilter] = useState("");
  const [colorFilter, setColorFilter] = useState<string[]>([]);
  const filterState: HomeFilterState = {
    sortValue,
    seasonFilter,
    categoriesFilter,
    TypeFilter,
    colorFilter,
  };
  const filterActions: HomeFilterActions = {
    setSortValue,
    setSeasonFilter,
    setCategoriesFilter,
    setTypeFilter,
    setColorFilter,
  };
  const storedSettings = useSelector((state: RootState) => state.settings);
  const storedCategories = useSelector(
    (state: RootState) => state.CategoryList.Categories,
  );
  const storedCatTypes = useSelector(
    (state: RootState) => state.CategoryList.CategoryCustomTypes,
  );
  const CategoriesList = defaultCategories
    .concat(storedCategories)
    ?.map(cat => ({
      label: cat.name[storedSettings.language ?? 0] || cat.name[0],
      value: cat.index,
    }));
  const [isOpen, setIsOpen] = useState(false);
  const [isGridSizeOpen, setIsGridSizeOpen] = useState(false);
  const dispatch = useDispatch();
  const columns = normalizeGridColumns(storedSettings.gridColumns);
  const density = cardDensity(columns);
  const renderGarment = (garment: item) => (
    <ItemBox {...garmentSummary(garment)} density={density} />
  );
  const handleOpenDrawer = () => {
    Keyboard.dismiss();
    setIsOpen(prev => !prev);
  };
  const groupedCollectionsRaw = useMemo(() => {
    let final: item[][] = [];
    let tags = getOrderedCollectionTags(
      itemsState.collectionTags,
      getCollectionSortValue(storedSettings.collectionSortValue),
    );
    let items = filterByWardrobe(itemsState.items, activeWardrobe);
    if (tags.length > 0) {
      for (let i = 0; i < tags.length; i++) {
        const col = items.filter(x => x.collection?.includes(tags[i].value));
        final.push(col);
      }
    } else {
      final.push([]);
    }
    const nonColRaw = items.filter(
      x => !x.collection || x.collection.length === 0,
    );
    return { final, nonColRaw, tags };
  }, [
    activeWardrobe,
    itemsState.items,
    itemsState.collectionTags,
    storedSettings.collectionSortValue,
  ]);
  const filteredData = useMemo(() => {
    const filters = {
      categories: categoriesFilter,
      sortValue: sortValue,
      types: TypeFilter,
      season: seasonFilter,
      colors: colorFilter,
    };
    const filteredCol = HomeFilter(
      filters,
      [...groupedCollectionsRaw.final],
      true,
    ) as item[][];
    const filteredNon = HomeFilter(
      filters,
      [...groupedCollectionsRaw.nonColRaw],
      false,
    ) as item[];
    return {
      collections: filterCollectionsBySearch(filteredCol, search),
      nonCollectnized: filterItemsBySearch(filteredNon, search),
    };
  }, [
    groupedCollectionsRaw,
    categoriesFilter,
    sortValue,
    TypeFilter,
    seasonFilter,
    colorFilter,
    search,
  ]);
  useEffect(() => {
    if (categoriesFilter.length !== 1) setTypeFilter([]);
  }, [categoriesFilter]);
  const language = storedSettings.language;
  const filterCount = activeFilterCount(filterState);
  const isEmpty =
    !filteredData.collections.some(group => group.length) &&
    !filteredData.nonCollectnized.length;
  const addGarment = () => navigation.navigate("Category");
  return (
    <ThemeView>
      <BottomSheet
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        title={l.Filters[language]}
      >
        <HomeFilterPanel
          filterState={filterState}
          filterActions={filterActions}
          CategoriesList={CategoriesList}
          language={language}
          storedCatTypes={storedCatTypes}
        />
      </BottomSheet>

      <BottomSheet
        isOpen={isGridSizeOpen}
        setIsOpen={setIsGridSizeOpen}
        title={l.GridSize[language]}
      >
        <View style={styles.chips}>
          {GRID_COLUMN_OPTIONS.map(option => (
            <FilterChip
              key={option}
              label={l.Columns[language].replace("{n}", String(option))}
              selected={option === columns}
              onPress={() => {
                dispatch(setGridColumns({ gridColumns: option }));
                setIsGridSizeOpen(false);
              }}
            />
          ))}
        </View>
      </BottomSheet>

      <HomeHeader
        language={language}
        wardrobe={activeWardrobe}
        onWardrobeChange={select}
        filterCount={filterCount}
        openGridSize={() => {
          Keyboard.dismiss();
          setIsGridSizeOpen(true);
        }}
        handleOpenDrawer={handleOpenDrawer}
        setIsSearchVisible={setIsSearchVisible}
        isSearchVisible={isSearchVisible}
        setSearch={setSearch}
        search={search}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollViewContent}
      >
        {isEmpty &&
          (filterCount > 0 || search ? (
            <EmptyState
              message={l.NoWardrobeItems[language]}
              action={l.ClearWardrobeFilters[language]}
              onAction={() => {
                setSearch("");
                resetHomeFilters(filterActions);
              }}
            />
          ) : (
            <EmptyState
              message={l.NoGarmentsYet[language]}
              action={l.AddGarment[language]}
              onAction={addGarment}
            />
          ))}
        {groupedCollectionsRaw.tags.map((collection, index) => {
          const collectionItems = filteredData.collections[index];
          if (!collectionItems || collectionItems.length === 0) return null;
          return (
            <CollectionContainer
              key={`collection-${collection.value}`}
              label={collection.label}
            >
              <GarmentGrid
                garments={collectionItems}
                renderGarment={renderGarment}
                columns={columns}
              />
            </CollectionContainer>
          );
        })}

        {filteredData.nonCollectnized.length > 0 && (
          <GarmentGrid
            garments={filteredData.nonCollectnized}
            renderGarment={renderGarment}
            columns={columns}
          />
        )}
      </ScrollView>
      <AddButton label={l.AddGarment[language]} onPress={addGarment} />
    </ThemeView>
  );
}
const styles = StyleSheet.create({
  scrollViewContent: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.md,
    paddingBottom: ADD_BUTTON_CLEARANCE,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },
});
