import { ScrollView, StyleSheet } from "react-native";
import { ThemeView } from "../../components/ThemeView";
import { PageHeader } from "../../components/PageHeader";
import { CustomInput } from "../../components/CustomInput";
import { useState } from "react";
import { DatePicker } from "../../components/DatePicker";
import { useDispatch, useSelector } from "react-redux";
import { addEventLog, addLog } from "../../redux/itemsSlice";
import { nanoid } from "nanoid";
import { Button } from "react-native-paper";
import { localization } from "../../utils/localization";
import { RootState } from "../../redux/store";
import { FormErrors } from "../../components/FormErrors";
import { theme } from "../../utils/theme";
export const EventLogForm = ({
  navigation,
  route,
}: {
  navigation: any;
  route: any;
}) => {
  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState(new Date());
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [errorsList, setErrorsList] = useState<string[]>([]);
  const { selectedIDs } = route.params;
  const dispatch = useDispatch();
  const storedSettings = useSelector((state: RootState) => state.settings);
  async function addEventHandler() {
    const generatedId = nanoid(); // event Id
    const errors = [];
    if (eventName.length <= 0) {
      errors.push(localization.EventNameRequired[storedSettings.language]);
    }
    if (errors.length > 0) {
      setErrorsList(errors);
      return;
    }
    setErrorsList([]);
    dispatch(
      addEventLog({
        eventDate: JSON.stringify(eventDate),
        eventName: eventName,
        eventId: generatedId,
        logTime: JSON.stringify(new Date()),
        additionalNotes: additionalNotes,
      }),
    );
    selectedIDs.forEach((id: string) => {
      dispatch(addLog({ selectedId: id, logId: generatedId }));
    });
    navigation.popToTop();
  }
  return (
    <ThemeView>
      <PageHeader title={localization.EventInfo[storedSettings.language]} />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.form}
      >
        <CustomInput
          mode="outlined"
          textContentType="name"
          label={localization.EventName[storedSettings.language]}
          value={eventName}
          onChange={text => setEventName(text.nativeEvent.text)}
        />
        <DatePicker
          title={localization.EventDate[storedSettings.language]}
          type="both"
          date={eventDate}
          isDatePickerVisible={isDatePickerVisible}
          setDate={setEventDate}
          setDatePickerVisibility={setDatePickerVisibility}
        />
        <CustomInput
          mode="outlined"
          textContentType="name"
          textArea={true}
          label={localization.Additional_notes[storedSettings.language]}
          value={additionalNotes}
          onChange={text => setAdditionalNotes(text.nativeEvent.text)}
        />
        <FormErrors errors={errorsList} />
        <Button mode="contained" onPress={addEventHandler}>
          {localization.Save[storedSettings.language]}
        </Button>
      </ScrollView>
    </ThemeView>
  );
};
const styles = StyleSheet.create({
  form: {
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
});
