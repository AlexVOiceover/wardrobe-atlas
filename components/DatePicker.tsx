import { Pressable } from "react-native";
import { ThemeText } from "./ThemeText";
import dayjs from "dayjs";
import { Dispatch, SetStateAction } from "react";
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
            width: "80%",
            height: 48,
            borderWidth: 1,
            borderColor: "#777777",
            flexDirection: "row",
            justifyContent: "space-between",
            paddingHorizontal: 8,
            alignItems: "center",
          },
          {
            backgroundColor: "#ffffff",
          },
        ]}
      >
        <ThemeText>{title}</ThemeText>
        <ThemeText>{date ? dayjs(date).format("DD/MM/YYYY") : ""}</ThemeText>
        {(type === "time" || type === "both") && (
          <ThemeText>
            {date ? dayjs(date).format("h:mm a") : "Select Date"}
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
