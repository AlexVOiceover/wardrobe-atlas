import { View, StyleSheet, Keyboard, FlatList } from "react-native";
import { ThemeView } from "../../components/ThemeView";
import React, { useEffect, useState, useMemo } from "react";
// replaced FlashList with FlatList from react-native
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { LogComponent } from "../../components/LogComponent";
import CustomModal from "../../components/CustomModal";
import { logsType } from "../../redux/itemsSlice";
import { ThemeText } from "../../components/ThemeText";
import dayjs from "dayjs";
import "dayjs/locale/es";
import { BottomSheet } from "../../components/BottomSheet";
import { LogFilter } from "../../utils/filters";
import { localization } from "../../utils/localization";
import { useNavigation } from "@react-navigation/native";
import { HeaderIcon, PageHeader } from "../../components/PageHeader";
import { SearchField } from "../../components/SearchField";
import { FilterChip } from "../../components/FilterChip";
import { EmptyState } from "../../components/EmptyState";
import { AddButton, ADD_BUTTON_CLEARANCE } from "../../components/AddButton";
import { captionText, theme } from "../../utils/theme";
export const OutfitLog = () => {
  const navigation = useNavigation<any>();
  const [search, setSearch] = useState("");
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const logsState = useSelector((state: RootState) => state.itemsList.logs);
  const [refresh, setRefresh] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalEventId, setModalEventId] = useState("");
  const [modalInfo, setModalInfo] = useState<logsType>();
  const [sortValue, setSortValue] = useState("LA");
  const [isOpen, setIsOpen] = useState(false);
  const handleOpenDrawer = () => {
    // Open or close the filter panel.
    Keyboard.dismiss();
    setIsOpen(prev => !prev);
  };
  useEffect(() => {
    let info = logsState.find(x => x.eventId === modalEventId);
    setModalInfo(info);
  }, [modalEventId, logsState]);
  const filteredLogs = useMemo(() => {
    return LogFilter(sortValue, logsState, search);
  }, [logsState, search, sortValue]);
  const storedSettings = useSelector((state: RootState) => state.settings);
  const language = storedSettings.language;
  const sortOptions = [
    { label: localization.Last_Added[language], value: "LA" },
    { label: localization.Name_Asc[language], value: "NA" },
    { label: localization.Name_Desc[language], value: "ND" },
    { label: localization.Date_Asc[language], value: "DA" },
    { label: localization.Date_Desc[language], value: "DD" },
  ];
  const eventDate = dayjs(
    modalInfo?.eventDate ? JSON.parse(modalInfo?.eventDate) : "",
  ).locale(language === 1 ? "es" : "en");
  const logOutfit = () => navigation.navigate("ItemSelector");
  return (
    <ThemeView>
      <CustomModal
        setVisible={setModalVisible}
        visible={modalVisible}
        label={modalInfo?.eventName || localization.EventName[language]}
      >
        <View style={styles.details}>
          <ThemeText>{eventDate.format("dddd, MMM DD, YYYY")}</ThemeText>
          <ThemeText customStyle={captionText}>
            {eventDate.format("h:mm A")}
          </ThemeText>
          {modalInfo?.additionalNotes && (
            <>
              <ThemeText customStyle={[captionText, styles.notes]}>
                {localization.Additional_notes[language]}
              </ThemeText>
              <ThemeText>{modalInfo?.additionalNotes}</ThemeText>
            </>
          )}
        </View>
      </CustomModal>
      <BottomSheet
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        title={localization.Sort[language]}
      >
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
      </BottomSheet>
      <PageHeader
        back={false}
        title={localization.Outfits[language]}
        actions={
          <>
            <HeaderIcon
              name="search-outline"
              label={localization.SearchPlaceholder[language]}
              onPress={() => {
                setIsSearchVisible(!isSearchVisible);
                setSearch("");
              }}
            />
            <HeaderIcon
              name="swap-vertical-outline"
              label={localization.Sort[language]}
              onPress={handleOpenDrawer}
            />
          </>
        }
      />
      {isSearchVisible && (
        <SearchField
          placeholder={localization.SearchPlaceholder[language]}
          value={search}
          onChangeText={setSearch}
          autoFocus
        />
      )}
      <FlatList
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        data={filteredLogs}
        extraData={refresh}
        keyExtractor={item => item.eventId}
        ListEmptyComponent={
          logsState.length > 0 ? (
            <EmptyState message={localization.NoLogsMatch[language]} />
          ) : (
            <EmptyState
              message={localization.ClosetHistoryEmpty[language]}
              action={localization.LogOutfit[language]}
              onAction={logOutfit}
            />
          )
        }
        renderItem={({ item }) => (
          <LogComponent
            eventName={item.eventName}
            eventDate={JSON.parse(item.eventDate)}
            eventId={item.eventId}
            setRefresh={setRefresh}
            setModalVisible={setModalVisible}
            setModalEventId={setModalEventId}
          />
        )}
      />
      <AddButton label={localization.LogOutfit[language]} onPress={logOutfit} />
    </ThemeView>
  );
};
const styles = StyleSheet.create({
  details: {
    gap: theme.spacing.xs,
  },
  notes: {
    marginTop: theme.spacing.md,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },
  list: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
    paddingBottom: ADD_BUTTON_CLEARANCE,
  },
});
