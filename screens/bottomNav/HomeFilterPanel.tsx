import React from "react";
import { View, StyleSheet } from "react-native";
import { Button } from "react-native-paper";
import ColorFilter from "../../components/ColorFilter";
import { FilterChip } from "../../components/FilterChip";
import { SectionHeading } from "../../components/SectionHeading";
import { localization } from "../../utils/localization";
import { clothesList } from "../../utils/localization";
import { seasonList } from "../../utils/data";
import { theme } from "../../utils/theme";
type SetString = React.Dispatch<React.SetStateAction<string>>;
type SetArray<T> = React.Dispatch<React.SetStateAction<T[]>>;
export type HomeFilterState = {
  sortValue: string;
  seasonFilter: string;
  categoriesFilter: any[];
  TypeFilter: string[];
  colorFilter: string[];
};
export type HomeFilterActions = {
  setSortValue: SetString;
  setSeasonFilter: SetString;
  setCategoriesFilter: SetArray<any>;
  setTypeFilter: SetArray<string>;
  setColorFilter: SetArray<string>;
};
type Props = {
  filterState: HomeFilterState;
  filterActions: HomeFilterActions;
  CategoriesList: { label: string; value: number }[];
  language: number;
  storedCatTypes: any[];
};
export const resetHomeFilters = (actions: HomeFilterActions) => {
  actions.setSortValue("LA");
  actions.setSeasonFilter("");
  actions.setCategoriesFilter([]);
  actions.setTypeFilter([]);
  actions.setColorFilter([]);
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
  storedCatTypes,
}: Props) => {
  const { sortValue, seasonFilter, categoriesFilter, TypeFilter, colorFilter } =
    filterState;
  const {
    setSortValue,
    setSeasonFilter,
    setCategoriesFilter,
    setTypeFilter,
    setColorFilter,
  } = filterActions;
  const sortOptions = [
    { label: localization.Last_Added[language], value: "LA" },
    { label: localization.Name_Asc[language], value: "NA" },
    { label: localization.Name_Desc[language], value: "ND" },
    { label: localization.PurchaseDateAsc[language], value: "PDA" },
    { label: localization.PurchaseDateDesc[language], value: "PDD" },
  ];
  const typeOptions: { label: string; value: string }[] =
    categoriesFilter.length === 1
      ? ((clothesList as any)[language][categoriesFilter[0]] ?? []).concat(
          storedCatTypes[categoriesFilter[0]]?.customTypes || [],
        )
      : [];
  return (
    <View>
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
            selected={seasonFilter === option.value}
            onPress={() =>
              setSeasonFilter(seasonFilter === option.value ? "" : option.value)
            }
          />
        ))}
      </View>
      <SectionHeading title={localization.Color[language]} />
      <ColorFilter colors={colorFilter} setColors={setColorFilter} />
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
