import { useEffect, useMemo, useState } from "react";
import { BackHandler, ScrollView, StyleSheet, View } from "react-native";
import { Button, Snackbar } from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../../redux/store";
import {
  deleteCollection,
  deleteEventLog,
  deleteLog,
  setCollectionGarments,
  updateCollection,
  type item,
} from "../../redux/itemsSlice";
import { normalizeGridColumns } from "../../redux/settingsSlice";
import { closetSections, lastUseDates } from "../../utils/categories";
import { countText, localization as l } from "../../utils/localization";
import { theme } from "../../utils/theme";
import { ThemeView } from "../../components/ThemeView";
import { HeaderIcon, PageHeader } from "../../components/PageHeader";
import { EmptyState } from "../../components/EmptyState";
import { ItemBox, garmentSummary } from "../../components/ItemBox";
import { GarmentGrid, cardDensity } from "../../components/GarmentGrid";
import { ClosetSections } from "../../components/ClosetSections";
import { QuickLogSheet, logGarments } from "../../components/QuickLogSheet";
import { ConfirmationDialog } from "../../components/ConfirmationDialog";
import { CollectionNameSheet } from "../../components/CollectionNameSheet";

const BAR_CLEARANCE = 88;

/**
 * One collection's garments. They can be logged together as an outfit, or
 * some of them after a long press starts selecting; "Add or remove garments"
 * ticks them from the whole closet. A new collection opens in that mode.
 */
export function Collection({
  navigation,
  route,
}: {
  navigation: any;
  route: any;
}) {
  const { value, edit }: { value: string; edit?: boolean } = route.params;
  const { collectionTags, items, logs } = useSelector(
    (s: RootState) => s.itemsList,
  );
  const settings = useSelector((s: RootState) => s.settings);
  const categoryState = useSelector((s: RootState) => s.CategoryList);
  const language = settings.language;
  const dispatch = useDispatch();
  const collection = collectionTags.find(tag => tag.value === value);
  const garments = items.filter(garment => garment.collection?.includes(value));
  const columns = normalizeGridColumns(settings.gridColumns);
  const density = cardDensity(columns);
  // While editing: ids of the ticked garments, saved together.
  const [editing, setEditing] = useState(edit === true);
  const [picked, setPicked] = useState<string[]>(() =>
    edit === true ? garments.map(garment => garment.id) : [],
  );
  // Select mode: the garments "Log outfit" logs.
  const [selecting, setSelecting] = useState(false);
  const [ticked, setTicked] = useState<string[]>([]);
  const [collapsed, setCollapsed] = useState<string[]>([]);
  const [isRenaming, setIsRenaming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [logging, setLogging] = useState<string[]>([]);
  const [undo, setUndo] = useState<{ message: string; run: () => void }>();
  useEffect(() => {
    if (!editing && !selecting) return;
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        setEditing(false);
        setSelecting(false);
        setTicked([]);
        return true;
      },
    );
    return () => subscription.remove();
  }, [editing, selecting]);
  const sections = useMemo(
    () => (editing ? closetSections(items, categoryState, language) : []),
    [editing, items, categoryState, language],
  );
  const lastUsed = useMemo(() => lastUseDates(items, logs), [items, logs]);
  // Deleted while open
  if (!collection)
    return (
      <ThemeView>
        <PageHeader />
      </ThemeView>
    );
  const stopSelecting = () => {
    setSelecting(false);
    setTicked([]);
  };
  const startEditing = () => {
    stopSelecting();
    setPicked(garments.map(garment => garment.id));
    setEditing(true);
  };
  const toggleTicked = (id: string) =>
    setTicked(current =>
      current.includes(id)
        ? current.filter(other => other !== id)
        : [...current, id],
    );
  const saveEditing = () => {
    dispatch(setCollectionGarments({ value, ids: picked }));
    setEditing(false);
  };
  const togglePicked = (id: string) =>
    setPicked(current =>
      current.includes(id)
        ? current.filter(other => other !== id)
        : [...current, id],
    );
  const editGarment = (garment: item) =>
    navigation.navigate("ItemForm", { editingIndex: garment.id });
  const offerUndo = (log: { eventId: string; name: string }) =>
    setUndo({
      message: l.Logged[language].replace("{name}", log.name),
      run: () => {
        dispatch(deleteLog({ selectedLogId: log.eventId }));
        dispatch(deleteEventLog({ selectedLogId: log.eventId }));
      },
    });
  const loggingGarments = items.filter(garment => logging.includes(garment.id));
  if (editing)
    return (
      <ThemeView>
        <PageHeader
          back={false}
          title={countText(
            l.GarmentCount,
            l.GarmentsCount,
            picked.length,
            language,
          )}
          actions={
            <>
              <HeaderIcon
                name="close"
                label={l.Cancel[language]}
                onPress={() => setEditing(false)}
              />
              <HeaderIcon
                name="checkmark"
                label={l.Save[language]}
                onPress={saveEditing}
              />
            </>
          }
        />
        <ScrollView contentContainerStyle={styles.content}>
          <ClosetSections
            sections={sections}
            collapsed={collapsed}
            onToggle={key =>
              setCollapsed(current =>
                current.includes(key)
                  ? current.filter(other => other !== key)
                  : [...current, key],
              )
            }
            columns={columns}
            renderGarment={garment => (
              <ItemBox
                {...garmentSummary(garment)}
                type=""
                density={density}
                selected={picked.includes(garment.id)}
                onPress={() => togglePicked(garment.id)}
                onLongPress={() => togglePicked(garment.id)}
              />
            )}
          />
        </ScrollView>
      </ThemeView>
    );
  return (
    <ThemeView>
      <PageHeader
        title={
          selecting
            ? countText(
                l.GarmentCount,
                l.GarmentsCount,
                ticked.length,
                language,
              )
            : collection.label
        }
        actions={
          selecting ? (
            <HeaderIcon
              name="close"
              label={l.Cancel[language]}
              onPress={stopSelecting}
            />
          ) : (
            <>
              <HeaderIcon
                name="create-outline"
                label={l.Rename[language]}
                onPress={() => setIsRenaming(true)}
              />
              <HeaderIcon
                name="trash-outline"
                label={l.Delete[language]}
                onPress={() => setIsDeleting(true)}
              />
            </>
          )
        }
      />
      <ScrollView
        contentContainerStyle={[styles.content, styles.withBar]}
        showsVerticalScrollIndicator={false}
      >
        {garments.length === 0 ? (
          <EmptyState
            message={l.NoGarmentsInCollection[language]}
            action={l.EditCollectionGarments[language]}
            onAction={startEditing}
          />
        ) : (
          <GarmentGrid
            garments={garments}
            columns={columns}
            renderGarment={garment => (
              // As in the Closet: tap opens the garment sheet, a double tap
              // logs at once and a long press starts selecting with it ticked.
              <ItemBox
                {...garmentSummary(garment)}
                density={density}
                selected={selecting ? ticked.includes(garment.id) : undefined}
                onPress={() =>
                  selecting
                    ? toggleTicked(garment.id)
                    : setLogging([garment.id])
                }
                onDoubleTap={
                  selecting
                    ? undefined
                    : () =>
                        offerUndo(logGarments(dispatch, [garment], language))
                }
                onLongPress={() => {
                  if (selecting) return toggleTicked(garment.id);
                  setSelecting(true);
                  setTicked([garment.id]);
                }}
              />
            )}
          />
        )}
      </ScrollView>
      {garments.length > 0 && (
        <View style={styles.bar}>
          {selecting ? (
            // Only the ticked garments.
            <Button
              mode="contained"
              style={styles.action}
              disabled={ticked.length === 0}
              onPress={() => setLogging(ticked)}
            >
              {l.LogOutfitCount[language].replace("{n}", String(ticked.length))}
            </Button>
          ) : (
            <>
              <Button
                mode="outlined"
                style={styles.action}
                onPress={startEditing}
              >
                {l.EditCollectionGarments[language]}
              </Button>
              <Button
                mode="contained"
                style={styles.action}
                onPress={() => setLogging(garments.map(garment => garment.id))}
              >
                {l.LogAsOutfit[language]}
              </Button>
            </>
          )}
        </View>
      )}
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
      <CollectionNameSheet
        isOpen={isRenaming}
        setIsOpen={setIsRenaming}
        title={l.Rename[language]}
        language={language}
        collections={collectionTags}
        initial={collection.label}
        onSave={newName =>
          dispatch(updateCollection({ name: collection.value, newName }))
        }
      />
      <ConfirmationDialog
        visible={isDeleting}
        setVisible={setIsDeleting}
        title={`${l.Delete[language]}: ${collection.label}`}
        message={l.DeleteCollectionMessage[language]}
        onConfirm={() => {
          dispatch(deleteCollection({ name: collection.value }));
          navigation.goBack();
        }}
      />
      <Snackbar
        visible={!!undo}
        onDismiss={() => setUndo(undefined)}
        duration={5000}
        wrapperStyle={styles.snackbar}
        action={{ label: l.Undo[language], onPress: () => undo?.run() }}
      >
        {undo?.message ?? ""}
      </Snackbar>
    </ThemeView>
  );
}
const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    padding: theme.spacing.md,
  },
  withBar: {
    paddingBottom: BAR_CLEARANCE,
  },
  bar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border,
  },
  action: {
    flex: 1,
  },
  snackbar: {
    bottom: BAR_CLEARANCE,
  },
});
