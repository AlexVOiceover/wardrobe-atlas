import { StyleSheet, Text, View } from "react-native";
import { ThemeView } from "../../components/ThemeView";
import { BackButton } from "../../components/BackButton";
import { CustomInput } from "../../components/CustomInput";
import { useState } from "react";
import { DatePicker } from "../../components/DatePicker";
import { useDispatch, useSelector } from "react-redux";
import { addEventLog, addLog } from "../../redux/itemsSlice";
import { nanoid } from "nanoid";
import { CommonActions } from "@react-navigation/native";
import { Button } from "react-native-paper";
import { localization } from "../../utils/localization";
import { RootState } from "../../redux/store";
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
      errors.push("Please enter a name for this event");
    }
    if (eventName.length > 20) {
      errors.push("Please enter a name within 20 characters");
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
    navigation.popToTop("Category");
    navigation.dispatch(CommonActions.goBack());
  }
  return (
    <ThemeView>
      <>
        <BackButton
          pageTitle={localization.EventInfo[storedSettings.language]}
        />
        <View style={[{ alignItems: "center", rowGap: 12, marginTop: 16 }]}>
          <CustomInput
            mode="outlined"
            textContentType="name"
            label={localization.EventName[storedSettings.language]}
            value={eventName}
            onChange={text => setEventName(text.nativeEvent.text)}
            style={[
              { marginBottom: 20 },
              [
                styles.customWidth,
                {
                  textAlign: "left",
                },
              ],
            ]}
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
            style={[
              styles.customWidth,
              {
                textAlign: "left",
              },
            ]}
            textArea={true}
            label={localization.Additional_notes[storedSettings.language]}
            value={additionalNotes}
            onChange={text => setAdditionalNotes(text.nativeEvent.text)}
          />
          {errorsList.length > 0 && (
            <View>
              {errorsList.map((error, index) => {
                return (
                  <Text key={index} style={[{}]}>
                    {error}
                  </Text>
                );
              })}
            </View>
          )}
          <Button
            // className="mb-5"
            mode="outlined"
            onPress={addEventHandler}
          >
            {localization.Save[storedSettings.language]}
          </Button>
        </View>
      </>
    </ThemeView>
  );
};
const styles = StyleSheet.create({
  customWidth: { width: "80%" },
});
