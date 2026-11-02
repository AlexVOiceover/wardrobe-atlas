import { View } from "react-native";
import { Button, Searchbar } from "react-native-paper";
import { localization } from "../../utils/localization";
type Props = {
  navigation: any;
  storedSettings: any;
  isDarkMode: boolean;
  handleOpenDrawer: () => void;
  setOpenColorFilter: (v: boolean) => void;
  setIsSearchVisible: (v: boolean) => void;
  isSearchVisible: boolean;
  searchFocus: any;
  setSearch: (v: string) => void;
  search: string;
};
const HomeHeader = ({
  navigation,
  storedSettings,
  handleOpenDrawer,
  setOpenColorFilter,
  setIsSearchVisible,
  isSearchVisible,
  searchFocus,
  setSearch,
  search,
}: Props) => {
  const language = storedSettings.language ?? 0;
  return (
    <View style={{ padding: 8, gap: 8 }}>
      <Button mode="outlined" onPress={() => navigation.navigate("Wardrobes")}>
        {localization.ManageWardrobes[language]}
      </Button>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4 }}>
        <Button mode="outlined" onPress={() => navigation.navigate("Settings")}>
          {localization.Settings[language]}
        </Button>
        <Button
          mode="outlined"
          onPress={() => navigation.navigate("CollectionForm")}
        >
          {localization.Collection[language]}
        </Button>
        <Button
          mode="outlined"
          onPress={() => navigation.navigate("ClosetInfo")}
        >
          {localization.ClosetInfo[language]}
        </Button>
        <Button
          mode="outlined"
          onPress={() => {
            handleOpenDrawer();
            setOpenColorFilter(true);
          }}
        >
          {localization.FilterByColor[language]}
        </Button>
        <Button
          mode="outlined"
          onPress={() => {
            handleOpenDrawer();
            setOpenColorFilter(false);
          }}
        >
          {["Filters", "Filtros"][language]}
        </Button>
        <Button
          mode="outlined"
          onPress={() => {
            setIsSearchVisible(!isSearchVisible);
            setSearch("");
          }}
        >
          {localization.SearchPlaceholder[language]}
        </Button>
      </View>
      {isSearchVisible && (
        <Searchbar
          placeholder={localization.SearchPlaceholder[language]}
          value={search}
          ref={searchFocus}
          onChangeText={setSearch}
          autoFocus
        />
      )}
    </View>
  );
};
export default HomeHeader;
