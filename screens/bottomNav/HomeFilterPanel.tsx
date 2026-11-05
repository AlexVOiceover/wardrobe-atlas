import React from "react";
import { View, StyleSheet } from "react-native";
import { Button } from "react-native-paper";
import ColorFilter from "../../components/ColorFilter";
import { FilterChip } from "../../components/FilterChip";
import { SectionHeading } from "../../components/SectionHeading";
import { localization } from "../../utils/localization";
import { categoryTypes } from "../../utils/categories";
import type { CategoryList } from "../../redux/categoriesSlice";
import { seasonList } from "../../utils/data";
import { GRID_COLUMN_OPTIONS } from "../../redux/settingsSlice";
import { theme } from "../../utils/theme";
import { DEFAULT_CLOSET_SORT, closetSortOptions } from "../../utils/sorts";
type SetString = React.Dispatch<React.SetStateAction<string>>;
type SetArray<T> = React.Dispatch<React.SetStateAction<T[]>>;
export type HomeFilterState = {
  sortValue: string;
  seasonFilter: string[];
  categoriesFilter: any[];
  TypeFilter: string[];
  colorFilter: string[];
  collectionFilter: string[];
  // "inUse", "stored" or empty for both.
  storageFilter: string;
};
export type HomeFilterActions = {
  // The sort is remembered in settings.
  setSortValue: (value: string) => void;
  setSeasonFilter: SetArray<string>;
  setCategoriesFilter: SetArray<any>;
  setTypeFilter: SetArray<string>;
  setColorFilter: SetArray<string>;
  setCollectionFilter: SetArray<string>;
  setStorageFilter: SetString;
};
type Props = {
  filterState: HomeFilterState;
  filterActions: HomeFilterActions;
  CategoriesList: { label: string; value: number }[];
  language: number;
  categoryState: CategoryList;
  collections: { label: string; value: string }[];
  // The grid size is a view setting, kept apart from the filter count.
  columns: number;
  onColumnsChange: (columns: number) => void;
};
export const resetHomeFilters = (actions: HomeFilterActions) => {
  actions.setSortValue(DEFAULT_CLOSET_SORT);
  actions.setSeasonFilter([]);
  actions.setCategoriesFilter([]);
  actions.setTypeFilter([]);
  actions.setColorFilter([]);
  actions.setCollectionFilter([]);
  actions.setStorageFilter("");
};
const toggled = <T,>(values: T[], value: T) =>
  values.includes(value)
    ? values.filter(current => current !== value)
    : [...values, value];
const HomeFilterPanel = ({
  filterState,
  filterActions,
  CategoriesList,
  language,
  categoryState,
  collections,
  columns,
  onColumnsChange,
}: Props) => {
  const {
    sortValue,
    seasonFilter,
    categoriesFilter,
    TypeFilter,
    colorFilter,
    collectionFilter,
    storageFilter,
  } = filterState;
  const {
    setSortValue,
    setSeasonFilter,
    setCategoriesFilter,
    setTypeFilter,
    setColorFilter,
    setCollectionFilter,
    setStorageFilter,
  } = filterActions;
  const sortOptions = closetSortOptions(language);
  const typeOptions: { label: string; value: string }[] =
    categoriesFilter.length === 1
      ? categoryTypes(categoryState, categoriesFilter[0], language)
      : [];
  return (
    <View>
      <SectionHeading title={localization.Category[language]} />
      <View style={styles.chips}>
        {CategoriesList.map(option => (
          <FilterChip
            key={option.value}
            label={option.label}
            selected={categoriesFilter.includes(option.value)}
            onPress={() =>
              setCategoriesFilter(toggled(categoriesFilter, option.value))
            }
          />
        ))}
      </View>
      {typeOptions.length > 0 && (
        <>
          <SectionHeading title={localization.Type[language]} />
          <View style={styles.chips}>
            {typeOptions.map(option => (
              <FilterChip
                key={option.value}
                label={option.label}
                selected={TypeFilter.includes(option.value)}
                onPress={() => setTypeFilter(toggled(TypeFilter, option.value))}
              />
            ))}
          </View>
        </>
      )}
      <SectionHeading title={localization.Season[language]} />
      <View style={styles.chips}>
        {(seasonList[language] || []).map(option => (
          <FilterChip
            key={option.value}
            label={option.label}
            selected={seasonFilter.includes(option.value)}
            onPress={() => setSeasonFilter(toggled(seasonFilter, option.value))}
          />
        ))}
      </View>
      <SectionHeading title={localization.Storage[language]} />
      <View style={styles.chips}>
        {[
          { label: localization.InUse[language], value: "inUse" },
          { label: localization.Stored[language], value: "stored" },
        ].map(option => (
          <FilterChip
            key={option.value}
            label={option.label}
            selected={storageFilter === option.value}
            onPress={() =>
              setStorageFilter(
                storageFilter === option.value ? "" : option.value,
              )
            }
          />
        ))}
      </View>
      <SectionHeading title={localization.Color[language]} />
      <ColorFilter colors={colorFilter} setColors={setColorFilter} />
      {collections.length > 0 && (
        <>
          <SectionHeading title={localization.Collections[language]} />
          <View style={styles.chips}>
            {collections.map(option => (
              <FilterChip
                key={option.value}
                label={option.label}
                selected={collectionFilter.includes(option.value)}
                onPress={() =>
                  setCollectionFilter(toggled(collectionFilter, option.value))
                }
              />
            ))}
          </View>
        </>
      )}
      <SectionHeading title={localization.Sort[language]} />
      <View style={styles.chips}>
        {sortOptions.map(option => (
          <FilterChip
            key={option.value}
            label={option.label}
            selected={sortValue === option.value}
            onPress={() => setSortValue(option.value)}
          />
        ))}
      </View>
      <SectionHeading title={localization.GridSize[language]} />
      <View style={styles.chips}>
        {GRID_COLUMN_OPTIONS.map(option => (
          <FilterChip
            key={option}
            dense
            label={String(option)}
            accessibilityLabel={localization.Columns[language].replace(
              "{n}",
              String(option),
            )}
            selected={option === columns}
            onPress={() => onColumnsChange(option)}
          />
        ))}
      </View>
      <Button
        mode="outlined"
        style={styles.resetButton}
        onPress={() => resetHomeFilters(filterActions)}
      >
        {localization.Reset[language]}
      </Button>
    </View>
  );
};
export default HomeFilterPanel;
const styles = StyleSheet.create({
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  resetButton: {
    marginTop: theme.spacing.lg,
  },
});
