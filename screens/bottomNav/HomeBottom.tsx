import { useWardrobeView } from "../../components/WardrobeSelector";
import { filterByWardrobe } from "../../utils/wardrobes";
import { localization as l } from "../../utils/localization";
import { ScrollView, Keyboard, StyleSheet, View } from "react-native";
import { ThemeView } from "../../components/ThemeView";
import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { ItemBox, garmentSummary } from "../../components/ItemBox";
import { deleteEventLog, deleteLog, item } from "../../redux/itemsSlice";
import { Snackbar } from "react-native-paper";
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
  filterItemsBySearch,
} from "../../utils/filters";
import {
  getCollectionSortValue,
  getOrderedCollectionTags,
} from "../../utils/collectionOrder";
import {
  closetSections,
  lastUseDates,
  visibleCategories,
} from "../../utils/categories";
import { ClosetSections } from "../../components/ClosetSections";
import { QuickLogSheet } from "../../components/QuickLogSheet";
import { AddButton, ADD_BUTTON_CLEARANCE } from "../../components/AddButton";
import { EmptyState } from "../../components/EmptyState";
import { cardDensity } from "../../components/GarmentGrid";
import { FilterChip } from "../../components/FilterChip";
import { ActiveFilters } from "../../components/ActiveFilters";
import {
  GRID_COLUMN_OPTIONS,
  normalizeGridColumns,
  setGridColumns,
  toggleSection,
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
  const [seasonFilter, setSeasonFilter] = useState<string[]>([]);
  const [colorFilter, setColorFilter] = useState<string[]>([]);
  const [collectionFilter, setCollectionFilter] = useState<string[]>([]);
  const filterState: HomeFilterState = {
    sortValue,
    seasonFilter,
    categoriesFilter,
    TypeFilter,
    colorFilter,
    collectionFilter,
  };
  const filterActions: HomeFilterActions = {
    setSortValue,
    setSeasonFilter,
    setCategoriesFilter,
    setTypeFilter,
    setColorFilter,
    setCollectionFilter,
  };
  const storedSettings = useSelector((state: RootState) => state.settings);
  const categoryState = useSelector((state: RootState) => state.CategoryList);
  const language = storedSettings.language;
  const CategoriesList = visibleCategories(categoryState, language).map(
    category => ({ label: category.label, value: category.index }),
  );
  const collections = getOrderedCollectionTags(
    itemsState.collectionTags,
    getCollectionSortValue(storedSettings.collectionSortValue),
  ).map(tag => ({ label: tag.label, value: tag.value }));
  const [isOpen, setIsOpen] = useState(false);
  const [isGridSizeOpen, setIsGridSizeOpen] = useState(false);
  const [logging, setLogging] = useState<item>();
  const [lastLog, setLastLog] = useState<{ eventId: string; name: string }>();
  const dispatch = useDispatch();
  const columns = normalizeGridColumns(storedSettings.gridColumns);
  const density = cardDensity(columns);
  const editGarment = (garment: item) =>
    navigation.navigate("ItemForm", { editingIndex: garment.id });
  // The type is shown by the heading above, so cards leave it out.
  const renderGarment = (garment: item) => (
    <ItemBox
      {...garmentSummary(garment)}
      type=""
      density={density}
      onPress={() => setLogging(garment)}
      onLongPress={() => editGarment(garment)}
    />
  );
  const handleOpenDrawer = () => {
    Keyboard.dismiss();
    setIsOpen(prev => !prev);
  };
  const lastUsed = useMemo(
    () => lastUseDates(itemsState.items, itemsState.logs),
    [itemsState.items, itemsState.logs],
  );
  const sections = useMemo(() => {
    const garments = HomeFilter(
      {
        categories: categoriesFilter,
        sortValue,
        types: TypeFilter,
        seasons: seasonFilter,
        colors: colorFilter,
        collections: collectionFilter,
        lastUsed,
      },
      [...filterByWardrobe(itemsState.items, activeWardrobe)],
      false,
    );
    return closetSections(
      filterItemsBySearch(garments, search),
      categoryState,
      language,
    );
  }, [
    activeWardrobe,
    itemsState.items,
    categoriesFilter,
    sortValue,
    TypeFilter,
    seasonFilter,
    colorFilter,
    collectionFilter,
    lastUsed,
    search,
    categoryState,
    language,
  ]);
  useEffect(() => {
    if (categoriesFilter.length !== 1) setTypeFilter([]);
  }, [categoriesFilter]);
  const filterCount = activeFilterCount(filterState);
  const isEmpty = sections.length === 0;
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
          categoryState={categoryState}
          collections={collections}
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

      <ActiveFilters
        filterState={filterState}
        filterActions={filterActions}
        CategoriesList={CategoriesList}
        categoryState={categoryState}
        collections={collections}
        language={language}
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
        <ClosetSections
          sections={sections}
          collapsed={storedSettings.collapsedSections ?? []}
          onToggle={key => dispatch(toggleSection({ key }))}
          columns={columns}
          renderGarment={renderGarment}
        />
      </ScrollView>
      <AddButton label={l.AddGarment[language]} onPress={addGarment} />
      <QuickLogSheet
        garment={logging}
        lastUsed={logging ? lastUsed[logging.id] : undefined}
        language={language}
        onClose={() => setLogging(undefined)}
        onEdit={editGarment}
        onLogged={setLastLog}
      />
      <Snackbar
        visible={!!lastLog}
        onDismiss={() => setLastLog(undefined)}
        duration={5000}
        wrapperStyle={styles.snackbar}
        action={{
          label: l.Undo[language],
          onPress: () => {
            if (!lastLog) return;
            dispatch(deleteLog({ selectedLogId: lastLog.eventId }));
            dispatch(deleteEventLog({ selectedLogId: lastLog.eventId }));
          },
        }}
      >
        {lastLog ? l.Logged[language].replace("{name}", lastLog.name) : ""}
      </Snackbar>
    </ThemeView>
  );
}
const styles = StyleSheet.create({
  scrollViewContent: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
    paddingBottom: ADD_BUTTON_CLEARANCE,
  },
  snackbar: {
    bottom: ADD_BUTTON_CLEARANCE,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },
});
