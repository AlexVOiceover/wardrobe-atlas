import { useWardrobeView } from "../../components/WardrobeSelector";
import { filterByWardrobe } from "../../utils/wardrobes";
import { countText, localization as l } from "../../utils/localization";
import { BackHandler, ScrollView, Keyboard, StyleSheet } from "react-native";
import { ThemeView } from "../../components/ThemeView";
import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { ItemBox, garmentSummary } from "../../components/ItemBox";
import {
  deleteEventLog,
  deleteLog,
  item,
  setGarmentsStored,
  setGarmentsWardrobe,
} from "../../redux/itemsSlice";
import {
  SelectionBar,
  SELECTION_BAR_CLEARANCE,
} from "../../components/SelectionBar";
import { MoveSheet } from "../../components/MoveSheet";
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
import {
  ClosetSections,
  visibleGarments,
} from "../../components/ClosetSections";
import { QuickLogSheet, logGarments } from "../../components/QuickLogSheet";
import { AddButton, ADD_BUTTON_CLEARANCE } from "../../components/AddButton";
import { EmptyState } from "../../components/EmptyState";
import { cardDensity } from "../../components/GarmentGrid";
import { ActiveFilters } from "../../components/ActiveFilters";
import {
  normalizeGridColumns,
  setClosetSortValue,
  setGridColumns,
  toggleSection,
} from "../../redux/settingsSlice";
import { normalizeClosetSort } from "../../utils/sorts";
import { theme } from "../../utils/theme";
export function HomeBottom({ route }: { route?: any } = {}) {
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
  const [categoriesFilter, setCategoriesFilter] = useState<any[]>([]);
  const [TypeFilter, setTypeFilter] = useState<string[]>([]);
  const [seasonFilter, setSeasonFilter] = useState<string[]>([]);
  const [colorFilter, setColorFilter] = useState<string[]>([]);
  const [collectionFilter, setCollectionFilter] = useState<string[]>([]);
  const [storageFilter, setStorageFilter] = useState("");
  const storedSettings = useSelector((state: RootState) => state.settings);
  const dispatch = useDispatch();
  // Remembered across restarts, like the Collections order.
  const sortValue = normalizeClosetSort(storedSettings.closetSortValue);
  const setSortValue = (value: string) =>
    dispatch(setClosetSortValue({ sortValue: value }));
  const filterState: HomeFilterState = {
    sortValue,
    seasonFilter,
    categoriesFilter,
    TypeFilter,
    colorFilter,
    collectionFilter,
    storageFilter,
  };
  const filterActions: HomeFilterActions = {
    setSortValue,
    setSeasonFilter,
    setCategoriesFilter,
    setTypeFilter,
    setColorFilter,
    setCollectionFilter,
    setStorageFilter,
  };
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
  // Garments in the log sheet, by id so they stay current after edits.
  const [logging, setLogging] = useState<string[]>([]);
  // A message, with Undo when it can be undone.
  const [undo, setUndo] = useState<{ message: string; run?: () => void }>();
  // A new garment's form comes back with where it was saved.
  const saved: string | undefined = route?.params?.saved;
  useEffect(() => {
    if (!saved) return;
    navigation.setParams({ saved: undefined });
    setUndo({ message: saved });
  }, [saved, navigation]);
  // Select mode: ids of the ticked garments.
  const [selecting, setSelecting] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [isMoveOpen, setIsMoveOpen] = useState(false);
  const stopSelecting = () => {
    setSelecting(false);
    setPicked([]);
  };
  const togglePicked = (id: string) =>
    setPicked(current =>
      current.includes(id)
        ? current.filter(value => value !== id)
        : [...current, id],
    );
  useEffect(() => {
    if (!selecting) return;
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        setSelecting(false);
        setPicked([]);
        return true;
      },
    );
    return () => subscription.remove();
  }, [selecting]);
  // Back closes the search field first, as it ends select mode.
  useEffect(() => {
    if (!isSearchVisible) return;
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        setIsSearchVisible(false);
        setSearch("");
        return true;
      },
    );
    return () => subscription.remove();
  }, [isSearchVisible]);
  const columns = normalizeGridColumns(storedSettings.gridColumns);
  const density = cardDensity(columns);
  const offerUndo = (log: { eventId: string; name: string }) =>
    setUndo({
      message: l.Logged[language].replace("{name}", log.name),
      run: () => {
        dispatch(deleteLog({ selectedLogId: log.eventId }));
        dispatch(deleteEventLog({ selectedLogId: log.eventId }));
      },
    });
  // A double tap logs a use now, without the dialog.
  const logNow = (garment: item) =>
    offerUndo(logGarments(dispatch, [garment], language));
  const editGarment = (garment: item) =>
    navigation.navigate("ItemForm", { editingIndex: garment.id });
  // A long press starts selecting, with that garment ticked.
  const startSelectingWith = (garment: item) => {
    Keyboard.dismiss();
    setSelecting(true);
    setPicked([garment.id]);
  };
  // The type is shown by the heading above, so cards leave it out.
  const renderGarment = (garment: item) => (
    <ItemBox
      {...garmentSummary(garment)}
      type=""
      density={density}
      selected={selecting ? picked.includes(garment.id) : undefined}
      onPress={() =>
        selecting ? togglePicked(garment.id) : setLogging([garment.id])
      }
      onLongPress={() =>
        selecting ? togglePicked(garment.id) : startSelectingWith(garment)
      }
      onDoubleTap={selecting ? undefined : () => logNow(garment)}
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
        storage: storageFilter,
        lastUsed,
      },
      [...filterByWardrobe(itemsState.items, activeWardrobe)],
      false,
    );
    return closetSections(
      filterItemsBySearch(garments, search, {
        categoryState,
        collectionTags: itemsState.collectionTags,
      }),
      categoryState,
      language,
    );
  }, [
    itemsState.collectionTags,
    activeWardrobe,
    itemsState.items,
    categoriesFilter,
    sortValue,
    TypeFilter,
    seasonFilter,
    colorFilter,
    collectionFilter,
    storageFilter,
    lastUsed,
    search,
    categoryState,
    language,
  ]);
  const pickedGarments = itemsState.items.filter(garment =>
    picked.includes(garment.id),
  );
  const loggingGarments = itemsState.items.filter(garment =>
    logging.includes(garment.id),
  );
  const storePicked = (stored: boolean) => {
    const changed = pickedGarments.filter(g => (g.stored === true) !== stored);
    const ids = changed.map(g => g.id);
    dispatch(setGarmentsStored({ ids, stored }));
    stopSelecting();
    setUndo({
      message: countText(
        stored ? l.GarmentStored : l.GarmentUnstored,
        stored ? l.GarmentsStored : l.GarmentsUnstored,
        ids.length,
        language,
      ),
      run: () => dispatch(setGarmentsStored({ ids, stored: !stored })),
    });
  };
  const movePicked = (wardrobe: { id: string; name: string }) => {
    // Remembered per garment so Undo puts each back where it was.
    const previous = pickedGarments.map(g => [g.id, g.wardrobeId ?? ""]);
    dispatch(
      setGarmentsWardrobe({
        ids: pickedGarments.map(g => g.id),
        wardrobeId: wardrobe.id,
      }),
    );
    stopSelecting();
    setUndo({
      message: l.MovedTo[language].replace("{name}", wardrobe.name),
      run: () =>
        previous.forEach(([id, wardrobeId]) =>
          dispatch(setGarmentsWardrobe({ ids: [id], wardrobeId })),
        ),
    });
  };
  useEffect(() => {
    if (categoriesFilter.length !== 1) setTypeFilter([]);
  }, [categoriesFilter]);
  const filterCount = activeFilterCount(filterState);
  const isEmpty = sections.length === 0;
  // A chosen wardrobe with nothing in it while other wardrobes have clothes.
  const emptyWardrobe =
    isEmpty &&
    activeWardrobe !== undefined &&
    filterCount === 0 &&
    !search &&
    itemsState.items.length > 0 &&
    filterByWardrobe(itemsState.items, activeWardrobe).length === 0;
  const wardrobeName =
    activeWardrobe === ""
      ? l.Unassigned[language]
      : itemsState.wardrobes.find(w => w.id === activeWardrobe)?.name ?? "";
  const collapsed = storedSettings.collapsedSections ?? [];
  // Select all ticks only what can be seen: folded sections are left out.
  const visibleIds = visibleGarments(sections, collapsed).map(g => g.id);
  const allVisiblePicked =
    visibleIds.length > 0 && visibleIds.every(id => picked.includes(id));
  const addGarment = () => navigation.navigate("Category");
  return (
    <ThemeView>
      <BottomSheet
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        title={l.ViewAndFilters[language]}
      >
        <HomeFilterPanel
          filterState={filterState}
          filterActions={filterActions}
          CategoriesList={CategoriesList}
          language={language}
          categoryState={categoryState}
          collections={collections}
          columns={columns}
          onColumnsChange={option =>
            dispatch(setGridColumns({ gridColumns: option }))
          }
        />
      </BottomSheet>

      <HomeHeader
        language={language}
        wardrobe={activeWardrobe}
        onWardrobeChange={select}
        filterCount={filterCount}
        startSelecting={() => {
          Keyboard.dismiss();
          setSelecting(true);
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
        contentContainerStyle={[
          styles.scrollViewContent,
          selecting && styles.selectingContent,
        ]}
      >
        {isEmpty &&
          (emptyWardrobe ? (
            <EmptyState
              message={l.NoClothesIn[language].replace("{name}", wardrobeName)}
              action={l.ShowAllWardrobes[language]}
              onAction={() => select(undefined)}
            />
          ) : filterCount > 0 || search ? (
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
          collapsed={collapsed}
          onToggle={key => dispatch(toggleSection({ key }))}
          columns={columns}
          renderGarment={renderGarment}
        />
      </ScrollView>
      {selecting ? (
        <SelectionBar
          count={pickedGarments.length}
          language={language}
          // Store while any ticked garment is in use, else take them out.
          storing={
            pickedGarments.length === 0 || pickedGarments.some(g => !g.stored)
          }
          allSelected={allVisiblePicked}
          onClose={stopSelecting}
          onSelectAll={() =>
            setPicked(current =>
              allVisiblePicked
                ? current.filter(id => !visibleIds.includes(id))
                : [...current, ...visibleIds.filter(id => !current.includes(id))],
            )
          }
          onStore={() =>
            storePicked(
              pickedGarments.length === 0 || pickedGarments.some(g => !g.stored),
            )
          }
          onLog={() => setLogging(pickedGarments.map(g => g.id))}
          onMove={() => setIsMoveOpen(true)}
        />
      ) : (
        <AddButton label={l.AddGarment[language]} onPress={addGarment} />
      )}
      <MoveSheet
        isOpen={isMoveOpen}
        setIsOpen={setIsMoveOpen}
        language={language}
        onMove={movePicked}
      />
      <QuickLogSheet
        garments={loggingGarments}
        lastUsed={
          loggingGarments.length === 1
            ? lastUsed[loggingGarments[0].id]
            : undefined
        }
        language={language}
        onClose={() => setLogging([])}
        onEdit={editGarment}
        onLogged={log => {
          stopSelecting();
          offerUndo(log);
        }}
      />
      <Snackbar
        visible={!!undo}
        onDismiss={() => setUndo(undefined)}
        duration={5000}
        wrapperStyle={
          selecting ? styles.snackbarOverSelection : styles.snackbar
        }
        action={
          undo?.run
            ? { label: l.Undo[language], onPress: () => undo.run?.() }
            : undefined
        }
      >
        {undo?.message ?? ""}
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
  snackbarOverSelection: {
    bottom: SELECTION_BAR_CLEARANCE,
  },
  selectingContent: {
    paddingBottom: SELECTION_BAR_CLEARANCE,
  },
});
