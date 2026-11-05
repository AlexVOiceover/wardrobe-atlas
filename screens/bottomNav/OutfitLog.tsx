import { View, StyleSheet, Keyboard, FlatList } from "react-native";
import { ThemeView } from "../../components/ThemeView";
import React, { useEffect, useState, useMemo } from "react";
// replaced FlashList with FlatList from react-native
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { LogComponent, OutfitNotice } from "../../components/LogComponent";
import { deleteEventLog, deleteLog } from "../../redux/itemsSlice";
import { BottomSheet } from "../../components/BottomSheet";
import { LogFilter } from "../../utils/filters";
import { localization } from "../../utils/localization";
import { useNavigation, useRoute } from "@react-navigation/native";
import { HeaderIcon, PageHeader } from "../../components/PageHeader";
import { SearchField } from "../../components/SearchField";
import { FilterChip } from "../../components/FilterChip";
import { EmptyState } from "../../components/EmptyState";
import { AddButton, ADD_BUTTON_CLEARANCE } from "../../components/AddButton";
import { theme } from "../../utils/theme";
import { setOutfitSortValue } from "../../redux/settingsSlice";
import {
  SORT_ICON,
  normalizeOutfitSort,
  outfitSortOptions,
} from "../../utils/sorts";
import { Button, Snackbar } from "react-native-paper";
export const OutfitLog = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const [search, setSearch] = useState("");
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const logsState = useSelector((state: RootState) => state.itemsList.logs);
  const dispatch = useDispatch();
  // The last logged or deleted outfit, while Undo is offered.
  const [undo, setUndo] = useState<{ message: string; run: () => void }>();
  const storedSettings = useSelector((state: RootState) => state.settings);
  // Newest worn first unless another order was chosen; remembered.
  const sortValue = normalizeOutfitSort(storedSettings.outfitSortValue);
  const [isOpen, setIsOpen] = useState(false);
  const handleOpenDrawer = () => {
    // Open or close the filter panel.
    Keyboard.dismiss();
    setIsOpen(prev => !prev);
  };
  const filteredLogs = useMemo(() => {
    return LogFilter(sortValue, logsState, search);
  }, [logsState, search, sortValue]);
  const language = storedSettings.language;
  const sortOptions = outfitSortOptions(language);
  const logOutfit = () => navigation.navigate("ItemSelector");
  // Logging, editing and Suggest come back here with what to offer Undo for.
  const notice: OutfitNotice | undefined = route?.params?.notice;
  useEffect(() => {
    if (!notice) return;
    navigation.setParams({ notice: undefined });
    if (notice.kind === "logged")
      setUndo({
        message: localization.Logged[language].replace("{name}", notice.name),
        run: () => {
          dispatch(deleteLog({ selectedLogId: notice.eventId }));
          dispatch(deleteEventLog({ selectedLogId: notice.eventId }));
        },
      });
    else
      setUndo({
        message: localization.OutfitDeleted[language].replace(
          "{name}",
          notice.name,
        ),
        run: () => dispatch(notice.restore),
      });
  }, [notice, navigation, dispatch, language]);
  return (
    <ThemeView>
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
              onPress={() =>
                dispatch(setOutfitSortValue({ sortValue: option.value }))
              }
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
              name={SORT_ICON}
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
        keyExtractor={item => item.eventId}
        ListHeaderComponent={
          <Button
            mode="outlined"
            icon="auto-fix"
            style={styles.suggest}
            onPress={() => navigation.navigate("SuggestOutfit")}
          >
            {localization.SuggestOutfit[language]}
          </Button>
        }
        ListEmptyComponent={
          logsState.length > 0 ? (
            <EmptyState message={localization.NoLogsMatch[language]} />
          ) : (
            <EmptyState
              message={localization.NoOutfitsYet[language]}
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
            notes={item.additionalNotes}
            onPress={() =>
              navigation.navigate("EventLogForm", { eventId: item.eventId })
            }
          />
        )}
      />
      <AddButton label={localization.LogOutfit[language]} onPress={logOutfit} />
      <Snackbar
        visible={!!undo}
        onDismiss={() => setUndo(undefined)}
        duration={5000}
        wrapperStyle={styles.snackbar}
        action={{
          label: localization.Undo[language],
          onPress: () => undo?.run(),
        }}
      >
        {undo?.message ?? ""}
      </Snackbar>
    </ThemeView>
  );
};
const styles = StyleSheet.create({
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },
  suggest: {
    marginBottom: theme.spacing.md,
  },
  snackbar: {
    bottom: ADD_BUTTON_CLEARANCE,
  },
  list: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
    paddingBottom: ADD_BUTTON_CLEARANCE,
  },
});
