import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { ThemeView } from "../../components/ThemeView";
import { ThemeText } from "../../components/ThemeText";
import { HeaderIcon, PageHeader } from "../../components/PageHeader";
import { CustomInput } from "../../components/CustomInput";
import { useRef, useState } from "react";
import { DatePicker } from "../../components/DatePicker";
import { useDispatch, useSelector } from "react-redux";
import { updateEventLog } from "../../redux/itemsSlice";
import { Button } from "react-native-paper";
import { countText, localization } from "../../utils/localization";
import { RootState } from "../../redux/store";
import { FormErrors } from "../../components/FormErrors";
import { SectionHeading } from "../../components/SectionHeading";
import { GarmentPhoto } from "../../components/GarmentPhoto";
import { GarmentPicker } from "../../components/GarmentPicker";
import { deleteOutfit, returnToOutfits } from "../../components/LogComponent";
import { theme } from "../../utils/theme";
import { useDiscardGuard } from "../../hooks/useDiscardGuard";

const sameIds = (a: string[], b: string[]) =>
  a.length === b.length && a.every(id => b.includes(id));

/**
 * Edits a logged outfit: name, when it was worn, notes and its garments.
 * Save is the header ✓; Delete returns to Outfits, which offers Undo.
 */
export const EventLogForm = ({
  navigation,
  route,
}: {
  navigation: any;
  route: any;
}) => {
  const { eventId }: { eventId: string } = route.params;
  const dispatch = useDispatch();
  const { items, logs } = useSelector((state: RootState) => state.itemsList);
  const language = useSelector((state: RootState) => state.settings.language);
  const log = logs.find(x => x.eventId === eventId);
  // What the form showed when it opened, to tell whether anything changed.
  const initial = useRef({
    name: log?.eventName ?? "",
    notes: log?.additionalNotes ?? "",
    date: log ? new Date(JSON.parse(log.eventDate)) : new Date(),
    garmentIds: items
      .filter(garment => garment.logIds?.includes(eventId))
      .map(garment => garment.id),
  }).current;
  const [eventName, setEventName] = useState(initial.name);
  const [eventDate, setEventDate] = useState(initial.date);
  const [additionalNotes, setAdditionalNotes] = useState(initial.notes);
  const [garmentIds, setGarmentIds] = useState(initial.garmentIds);
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [errorsList, setErrorsList] = useState<string[]>([]);
  // While adding garments: the ticks in the full-screen picker.
  const [picking, setPicking] = useState<string[]>();
  const nameChanged = eventName !== initial.name;
  const notesChanged = additionalNotes !== initial.notes;
  const dateChanged = eventDate.getTime() !== initial.date.getTime();
  const garmentsChanged = !sameIds(garmentIds, initial.garmentIds);
  const { leave, dialog } = useDiscardGuard(
    !!log && (nameChanged || notesChanged || dateChanged || garmentsChanged),
    language,
  );
  // Deleted while open
  if (!log)
    return (
      <ThemeView>
        <PageHeader />
      </ThemeView>
    );
  const garments = garmentIds.flatMap(id => {
    const garment = items.find(other => other.id === id);
    return garment ? [garment] : [];
  });
  const save = () => {
    if (eventName.trim().length === 0) {
      setErrorsList([localization.EventNameRequired[language]]);
      return;
    }
    setErrorsList([]);
    // Only what changed is written, so untouched fields keep their format.
    dispatch(
      updateEventLog({
        eventId,
        eventName: nameChanged ? eventName.trim() : undefined,
        eventDate: dateChanged ? JSON.stringify(eventDate) : undefined,
        additionalNotes: notesChanged ? additionalNotes : undefined,
        garmentIds: garmentsChanged ? garmentIds : undefined,
      }),
    );
    leave(() => navigation.goBack());
  };
  const remove = () => {
    const deleted = deleteOutfit(dispatch, logs, items, eventId);
    if (!deleted) return;
    leave(() => returnToOutfits(navigation, { kind: "deleted", ...deleted }));
  };
  return (
    <ThemeView>
      {dialog}
      <PageHeader
        title={localization.EditOutfit[language]}
        actions={
          <HeaderIcon
            name="checkmark"
            label={localization.Save[language]}
            onPress={save}
          />
        }
      />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.form}
      >
        <CustomInput
          mode="outlined"
          label={localization.Name[language]}
          value={eventName}
          onChange={text => setEventName(text.nativeEvent.text)}
        />
        <DatePicker
          title={localization.When[language]}
          type="both"
          date={eventDate}
          maximumDate={new Date()}
          isDatePickerVisible={isDatePickerVisible}
          setDate={setEventDate}
          setDatePickerVisibility={setDatePickerVisibility}
        />
        <CustomInput
          mode="outlined"
          textArea={true}
          label={localization.Additional_notes[language]}
          value={additionalNotes}
          onChange={text => setAdditionalNotes(text.nativeEvent.text)}
        />
        <FormErrors errors={errorsList} />
        <View>
          <SectionHeading
            title={countText(
              localization.GarmentCount,
              localization.GarmentsCount,
              garments.length,
              language,
            )}
          />
          {garments.map(garment => {
            const name = garment.name || localization.Garment[language];
            return (
              <View key={garment.id} style={styles.garmentRow}>
                <GarmentPhoto image={garment.image} size={56} />
                <ThemeText numberOfLines={2} customStyle={styles.garmentName}>
                  {name}
                </ThemeText>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={localization.RemoveNamed[
                    language
                  ].replace("{name}", name)}
                  onPress={() =>
                    setGarmentIds(current =>
                      current.filter(id => id !== garment.id),
                    )
                  }
                  style={styles.removeButton}
                >
                  <Icon name="close" size={22} color={theme.colors.muted} />
                </Pressable>
              </View>
            );
          })}
        </View>
        <Button
          mode="outlined"
          icon="plus"
          onPress={() => setPicking(garmentIds)}
        >
          {localization.AddGarments[language]}
        </Button>
        <Button
          mode="text"
          icon="delete-outline"
          textColor={theme.colors.danger}
          style={styles.delete}
          onPress={remove}
        >
          {localization.DeleteOutfit[language]}
        </Button>
      </ScrollView>
      <Modal
        visible={!!picking}
        animationType="none"
        onRequestClose={() => setPicking(undefined)}
      >
        <GarmentPicker
          title={localization.AddGarments[language]}
          picked={picking ?? []}
          setPicked={update =>
            setPicking(current =>
              typeof update === "function" ? update(current ?? []) : update,
            )
          }
          onBack={() => setPicking(undefined)}
          footer={
            <Button
              mode="contained"
              onPress={() => {
                setGarmentIds(picking ?? []);
                setPicking(undefined);
              }}
            >
              {localization.Done[language]}
            </Button>
          }
        />
      </Modal>
    </ThemeView>
  );
};
const styles = StyleSheet.create({
  form: {
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  garmentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
  garmentName: {
    flex: 1,
  },
  removeButton: {
    width: theme.touch,
    height: theme.touch,
    justifyContent: "center",
    alignItems: "center",
  },
  delete: {
    marginTop: theme.spacing.lg,
  },
});
