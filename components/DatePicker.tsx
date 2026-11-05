import { Pressable } from "react-native";
import { ThemeText } from "./ThemeText";
import { formatDate, formatDateTime, formatTime } from "../utils/dates";
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
  maximumDate,
}: {
  title: string;
  isDatePickerVisible: boolean;
  date: Date;
  setDate: (date: Date) => void;
  setDatePickerVisibility: Dispatch<SetStateAction<boolean>>;
  type?: "date" | "time" | "both";
  // Later picks are brought back to this date.
  maximumDate?: Date;
}) => {
  const language = useSelector((s: RootState) => s.settings.language);
  const safeDate =
    date && (date as any).getTime
      ? (date as unknown as Date)
      : new Date((date as unknown as any) || Date.now());
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          date ? `${title}: ${formatDateTime(date, language)}` : title
        }
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
        <ThemeText>{date ? formatDate(date, language) : ""}</ThemeText>
        {(type === "time" || type === "both") && (
          <ThemeText>
            {date
              ? formatTime(date)
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
        maximumDate={maximumDate}
        is24Hour
        onConfirm={(picked: Date) => {
          setDatePickerVisibility(false);
          setDate(maximumDate && picked > maximumDate ? maximumDate : picked);
        }}
        onCancel={() => {
          setDatePickerVisibility(false);
        }}
      />
    </>
  );
};
