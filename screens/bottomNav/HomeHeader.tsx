import { StyleSheet, View } from "react-native";
import { HeaderIcon } from "../../components/PageHeader";
import { SearchField } from "../../components/SearchField";
import { WardrobeSelector } from "../../components/WardrobeSelector";
import { localization } from "../../utils/localization";
import { theme } from "../../utils/theme";
type Props = {
  language: number;
  wardrobe?: string;
  onWardrobeChange: (id?: string) => void;
  filterCount: number;
  openGridSize: () => void;
  startSelecting: () => void;
  handleOpenDrawer: () => void;
  setIsSearchVisible: (v: boolean) => void;
  isSearchVisible: boolean;
  setSearch: (v: string) => void;
  search: string;
};
const HomeHeader = ({
  language,
  wardrobe,
  onWardrobeChange,
  filterCount,
  openGridSize,
  startSelecting,
  handleOpenDrawer,
  setIsSearchVisible,
  isSearchVisible,
  setSearch,
  search,
}: Props) => (
  <View>
    <View style={styles.row}>
      <WardrobeSelector
        all
        compact
        value={wardrobe}
        onChange={onWardrobeChange}
      />
      <HeaderIcon
        name="grid-outline"
        label={localization.GridSize[language]}
        onPress={openGridSize}
      />
      <HeaderIcon
        name="checkbox-outline"
        label={localization.Select[language]}
        onPress={startSelecting}
      />
      <HeaderIcon
        name="search-outline"
        label={localization.SearchPlaceholder[language]}
        onPress={() => {
          setIsSearchVisible(!isSearchVisible);
          setSearch("");
        }}
      />
      <HeaderIcon
        name="options-outline"
        label={localization.Filters[language]}
        badge={filterCount}
        onPress={handleOpenDrawer}
      />
    </View>
    {isSearchVisible && (
      <SearchField
        placeholder={localization.SearchPlaceholder[language]}
        value={search}
        onChangeText={setSearch}
        autoFocus
      />
    )}
  </View>
);
export default HomeHeader;
const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    height: 56,
    paddingLeft: theme.spacing.xs,
    paddingRight: theme.spacing.xs,
    backgroundColor: theme.colors.bar,
  },
});
