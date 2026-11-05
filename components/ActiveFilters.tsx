import { Pressable, ScrollView, StyleSheet, Text } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import type {
  HomeFilterActions,
  HomeFilterState,
} from "../screens/bottomNav/HomeFilterPanel";
import { colorNames, localization } from "../utils/localization";
import { categoryTypes } from "../utils/categories";
import type { CategoryList } from "../redux/categoriesSlice";
import { seasonList } from "../utils/data";
import { theme } from "../utils/theme";
import { DEFAULT_CLOSET_SORT, sortLabel } from "../utils/sorts";

type Chip = {
  key: string;
  label: string;
  remove: () => void;
  // What removing it does, when it isn't removing a filter.
  removeLabel?: string;
};

/**
 * Removable chips for the filters that hide garments, and for a sort other
 * than the default, shown above the list.
 */
export const ActiveFilters = ({
  filterState,
  filterActions,
  CategoriesList,
  categoryState,
  collections,
  language,
}: {
  filterState: HomeFilterState;
  filterActions: HomeFilterActions;
  CategoriesList: { label: string; value: number }[];
  categoryState: CategoryList;
  collections: { label: string; value: string }[];
  language: number;
}) => {
  const {
    sortValue,
    seasonFilter,
    categoriesFilter,
    TypeFilter,
    colorFilter,
    collectionFilter,
    storageFilter,
  } = filterState;
  // Type filters only exist while a single category is selected.
  const typeLabels =
    categoriesFilter.length === 1
      ? categoryTypes(categoryState, categoriesFilter[0], language)
      : [];
  const chips: Chip[] = [
    ...(sortValue !== DEFAULT_CLOSET_SORT
      ? [
          {
            key: "sort",
            label: sortLabel(sortValue, language),
            remove: () => filterActions.setSortValue(DEFAULT_CLOSET_SORT),
            removeLabel: localization.ResetSort[language],
          },
        ]
      : []),
    ...categoriesFilter.map(value => ({
      key: `category-${value}`,
      label:
        CategoriesList.find(option => option.value === value)?.label ??
        String(value),
      remove: () =>
        filterActions.setCategoriesFilter(prev =>
          prev.filter(current => current !== value),
        ),
    })),
    ...TypeFilter.map(value => ({
      key: `type-${value}`,
      label: typeLabels.find(option => option.value === value)?.label ?? value,
      remove: () =>
        filterActions.setTypeFilter(prev =>
          prev.filter(current => current !== value),
        ),
    })),
    ...seasonFilter.map(value => ({
      key: `season-${value}`,
      label:
        seasonList[language]?.find(option => option.value === value)?.label ??
        value,
      remove: () =>
        filterActions.setSeasonFilter(prev =>
          prev.filter(current => current !== value),
        ),
    })),
    ...colorFilter.map(value => ({
      key: `color-${value}`,
      label: colorNames[language]?.[value] ?? value,
      remove: () =>
        filterActions.setColorFilter(prev =>
          prev.filter(current => current !== value),
        ),
    })),
    ...(storageFilter
      ? [
          {
            key: "storage",
            label:
              storageFilter === "stored"
                ? localization.Stored[language]
                : localization.InUse[language],
            remove: () => filterActions.setStorageFilter(""),
          },
        ]
      : []),
    ...collectionFilter.map(value => ({
      key: `collection-${value}`,
      label: collections.find(option => option.value === value)?.label ?? value,
      remove: () =>
        filterActions.setCollectionFilter(prev =>
          prev.filter(current => current !== value),
        ),
    })),
  ];
  if (chips.length === 0) {
    return null;
  }
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      keyboardShouldPersistTaps="handled"
    >
      {chips.map(chip => (
        <Pressable
          key={chip.key}
          accessibilityRole="button"
          accessibilityLabel={`${
            chip.removeLabel ?? localization.RemoveFilter[language]
          }: ${chip.label}`}
          onPress={chip.remove}
          hitSlop={4}
          style={styles.chip}
        >
          <Text style={styles.label}>{chip.label}</Text>
          <Icon name="close" size={16} color={theme.colors.background} />
        </Pressable>
      ))}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={localization.ClearAll[language]}
        // Clears what the chips show, the sort included.
        onPress={() => {
          filterActions.setSortValue(DEFAULT_CLOSET_SORT);
          filterActions.setCategoriesFilter([]);
          filterActions.setTypeFilter([]);
          filterActions.setSeasonFilter([]);
          filterActions.setColorFilter([]);
          filterActions.setCollectionFilter([]);
          filterActions.setStorageFilter("");
        }}
        hitSlop={4}
        style={styles.clear}
      >
        <Text style={styles.clearLabel}>{localization.ClearAll[language]}</Text>
      </Pressable>
    </ScrollView>
  );
};
const styles = StyleSheet.create({
  row: {
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    alignItems: "center",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    minHeight: 36,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.text,
  },
  label: {
    color: theme.colors.background,
    fontSize: theme.type.caption,
  },
  clear: {
    minHeight: 36,
    justifyContent: "center",
    paddingHorizontal: theme.spacing.sm,
  },
  clearLabel: {
    color: theme.colors.text,
    fontSize: theme.type.caption,
    textDecorationLine: "underline",
  },
});
