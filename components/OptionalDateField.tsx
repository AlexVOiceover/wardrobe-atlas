import { Pressable, StyleSheet, View } from "react-native";
import { formatDate } from "../utils/dates";
import Icon from "react-native-vector-icons/Ionicons";
import { useState } from "react";
import { useSelector } from "react-redux";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import type { RootState } from "../redux/store";
import { localization } from "../utils/localization";
import { captionText, theme } from "../utils/theme";
import { fieldBox } from "./FieldBox";
import { ThemeText } from "./ThemeText";

/** A date that may be left empty: "—" until picked, ✕ clears it. */
export const OptionalDateField = ({
  label,
  date,
  onChange,
}: {
  label: string;
  date?: Date;
  onChange: (date?: Date) => void;
}) => {
  const language = useSelector((s: RootState) => s.settings.language);
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.field}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${
          date ? formatDate(date, language) : localization.NotSet[language]
        }`}
        onPress={() => setOpen(true)}
        style={styles.value}
      >
        <ThemeText customStyle={captionText} numberOfLines={1}>
          {label}
        </ThemeText>
        <ThemeText numberOfLines={1}>
          {date ? formatDate(date, language) : "—"}
        </ThemeText>
      </Pressable>
      {date && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={localization.ClearDate[language]}
          onPress={() => onChange(undefined)}
          style={styles.clear}
        >
          <Icon name="close" size={18} color={theme.colors.muted} />
        </Pressable>
      )}
      <DateTimePickerModal
        isVisible={open}
        date={date ?? new Date()}
        display="spinner"
        mode="date"
        onConfirm={(picked: Date) => {
          setOpen(false);
          onChange(picked);
        }}
        onCancel={() => setOpen(false)}
      />
    </View>
  );
};
const styles = StyleSheet.create({
  field: {
    ...fieldBox,
    flexDirection: "row",
    alignItems: "center",
  },
  value: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: theme.spacing.sm,
    minHeight: fieldBox.minHeight,
  },
  clear: {
    width: theme.touch,
    height: theme.touch,
    justifyContent: "center",
    alignItems: "center",
  },
});
