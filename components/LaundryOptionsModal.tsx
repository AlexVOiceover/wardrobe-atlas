import { Dispatch, SetStateAction } from "react";
import { View } from "react-native";
import { ThemeText } from "./ThemeText";
import { localization } from "../utils/localization";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { Button, Checkbox, Dialog, Portal } from "react-native-paper";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { CustomInput } from "./CustomInput";
import { handleNumberChange } from "../utils/validators";
export const LaundryOptionsModal = ({
  openLaundryOpt,
  setOpenLaundryOpt,
  LaundryCheck,
  setLandryCheck,
  overrideMaxLaundry,
  setOverrideMaxLaundry,
  maxLaundryNumber,
  setMaxLaundryNumber,
}: {
  openLaundryOpt: boolean;
  setOpenLaundryOpt: Dispatch<SetStateAction<boolean>>;
  LaundryCheck: boolean;
  setLandryCheck: Dispatch<SetStateAction<boolean>>;
  overrideMaxLaundry: boolean;
  setOverrideMaxLaundry: Dispatch<SetStateAction<boolean>>;
  maxLaundryNumber: number;
  setMaxLaundryNumber: Dispatch<SetStateAction<number>>;
}) => {
  const storedSettings = useSelector((state: RootState) => state.settings);
  const rtl = storedSettings.language == 1 ? "flex-row-reverse" : "flex-row";
  return (
    <Portal>
      <Dialog
        visible={openLaundryOpt}
        onDismiss={() => setOpenLaundryOpt(false)}
        style={{
          minHeight: 200,
          backgroundColor: "#ffffff",
        }}
      >
        <Dialog.Title style={[{ alignSelf: "center" }]}>
          {localization.Laundry_Options[storedSettings.language]}
        </Dialog.Title>
        <Dialog.Content>
          <View style={[{ rowGap: 8 }]}>
            <View
              style={[
                [
                  {},
                  rtl === "flex-row-reverse"
                    ? { flexDirection: "row-reverse" }
                    : { flexDirection: "row" },
                  { alignItems: "center", justifyContent: "flex-start" },
                ],
              ]}
            >
              <Checkbox
                status={LaundryCheck ? "checked" : "unchecked"}
                onPress={() => {
                  setLandryCheck(prev => !prev);
                }}
                color="#111111"
              />
              <MaterialCommunityIcons
                name="bell-ring"
                size={25}
                color="#111111"
              />
              <ThemeText customStyle={[{ marginHorizontal: 4 }]}>
                {localization.Washable[storedSettings.language]}
              </ThemeText>
            </View>
            <View
              style={[
                [
                  {},
                  rtl === "flex-row-reverse"
                    ? { flexDirection: "row-reverse" }
                    : { flexDirection: "row" },
                  { justifyContent: "flex-start", alignItems: "center" },
                ],
              ]}
            >
              <Checkbox
                disabled={!LaundryCheck}
                status={overrideMaxLaundry ? "checked" : "unchecked"}
                onPress={() => {
                  setOverrideMaxLaundry(prev => !prev);
                }}
              />
              <ThemeText>
                {localization.Override_Laundry[storedSettings.language]}
              </ThemeText>
              <CustomInput
                mode="outlined"
                textContentType="name"
                value={String(maxLaundryNumber || 0)}
                disabled={!overrideMaxLaundry}
                onChange={text =>
                  handleNumberChange(
                    () => {
                      setMaxLaundryNumber(Number(text.nativeEvent.text));
                    },
                    text.nativeEvent.text,
                    0,
                    30,
                  )
                }
                keyboardType="numeric"
                style={[{ height: 40, width: 50, marginHorizontal: 20 }]}
              />
            </View>
          </View>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={() => setOpenLaundryOpt(false)}>
            {localization.Close[storedSettings.language]}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};
