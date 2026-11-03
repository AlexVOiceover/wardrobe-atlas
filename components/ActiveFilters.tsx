import { Pressable, ScrollView, StyleSheet, Text } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import type {
  HomeFilterActions,
  HomeFilterState,
} from "../screens/bottomNav/HomeFilterPanel";
import { clothesList, colorNames, localization } from "../utils/localization";
import { seasonList } from "../utils/data";
import { theme } from "../utils/theme";

type Chip = { key: string; label: string; remove: () => void };

/** Removable chips for the filters that hide garments, shown above the list. */
export const ActiveFilters = ({
  filterState,
  filterActions,
  CategoriesList,
  storedCatTypes,
  language,
}: {
  filterState: HomeFilterState;
  filterActions: HomeFilterActions;
  CategoriesList: { label: string; value: number }[];
  storedCatTypes: any[];
  language: number;
}) => {
  const { seasonFilter, categoriesFilter, TypeFilter, colorFilter } =
    filterState;
  const typeLabels: { label: string; value: string }[] = [
    ...((clothesList as any)[language] ?? []).flat(),
    ...(storedCatTypes ?? []).flatMap(
      (category: any) => category?.customTypes ?? [],
    ),
  ];
  const chips: Chip[] = [
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
    ...(seasonFilter
      ? [
          {
            key: "season",
            label:
              seasonList[language]?.find(
                option => option.value === seasonFilter,
              )?.label ?? seasonFilter,
            remove: () => filterActions.setSeasonFilter(""),
          },
        ]
      : []),
    ...colorFilter.map(value => ({
      key: `color-${value}`,
      label: colorNames[language]?.[value] ?? value,
      remove: () =>
        filterActions.setColorFilter(prev =>
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
          accessibilityLabel={`${localization.RemoveFilter[language]}: ${chip.label}`}
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
        // Clears what the chips show; sort order stays as chosen.
        onPress={() => {
          filterActions.setCategoriesFilter([]);
          filterActions.setTypeFilter([]);
          filterActions.setSeasonFilter("");
          filterActions.setColorFilter([]);
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
