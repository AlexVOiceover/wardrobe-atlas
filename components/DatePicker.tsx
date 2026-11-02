import { Pressable } from "react-native";
import { ThemeText } from "./ThemeText";
import dayjs from "dayjs";
import { Dispatch, SetStateAction } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../redux/store";
import { localization } from "../utils/localization";
import { theme } from "../utils/theme";
import DateTimePickerModal from "react-native-modal-datetime-picker";
export const DatePicker = ({
  title = "Date",
  isDatePickerVisible,
  date,
  setDate,
  setDatePickerVisibility,
  type = "date",
}: {
  title: string;
  isDatePickerVisible: boolean;
  date: Date;
  setDate: Dispatch<SetStateAction<Date>>;
  setDatePickerVisibility: Dispatch<SetStateAction<boolean>>;
  type?: "date" | "time" | "both";
}) => {
  const language = useSelector((s: RootState) => s.settings.language);
  const safeDate =
    date && (date as any).getTime
      ? (date as unknown as Date)
      : new Date((date as unknown as any) || Date.now());
  return (
    <>
      <Pressable
        onPress={() => {
          setDatePickerVisibility(true);
        }}
        style={[
          {
            width: "100%",
            height: 48,
            borderWidth: 1,
            borderColor: theme.colors.muted,
            flexDirection: "row",
            justifyContent: "space-between",
            paddingHorizontal: 12,
            alignItems: "center",
          },
          {
            backgroundColor: theme.colors.background,
          },
        ]}
      >
        <ThemeText>{title}</ThemeText>
        <ThemeText>{date ? dayjs(date).format("DD/MM/YYYY") : ""}</ThemeText>
        {(type === "time" || type === "both") && (
          <ThemeText>
            {date
              ? dayjs(date).format("h:mm a")
              : localization.SelectDate[language]}
          </ThemeText>
        )}
      </Pressable>
      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        date={safeDate}
        display={
          type === "both" ? "inline" : type === "date" ? "spinner" : "clock"
        }
        mode={type === "both" ? "datetime" : type === "date" ? "date" : "time"}
        onConfirm={(picked: Date) => {
          setDatePickerVisibility(false);
          setDate(picked);
        }}
        onCancel={() => {
          setDatePickerVisibility(false);
        }}
      />
    </>
  );
};
