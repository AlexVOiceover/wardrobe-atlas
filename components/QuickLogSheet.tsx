import { Dispatch, SetStateAction, useState } from "react";
import { Image, Pressable, StyleSheet, View } from "react-native";
import { Button, Switch } from "react-native-paper";
import Icon from "react-native-vector-icons/Ionicons";
import dayjs from "dayjs";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { useDispatch } from "react-redux";
import "react-native-get-random-values";
import { nanoid } from "nanoid";
import {
  addEventLog,
  addLog,
  setGarmentsStored,
  type item,
} from "../redux/itemsSlice";
import { countText, localization } from "../utils/localization";
import { captionText, theme } from "../utils/theme";
import { BottomSheet } from "./BottomSheet";
import { ThemeText } from "./ThemeText";

export const usageSummary = (
  uses: number,
  lastUsed: string | undefined,
  language: number,
) => {
  if (uses === 0) return localization.NotUsedYet[language];
  const count =
    uses === 1
      ? localization.UsedOnce[language]
      : localization.UsedTimes[language].replace("{n}", String(uses));
  return lastUsed
    ? `${count} · ${localization.LastUsedOn[language].replace(
        "{date}",
        dayjs(lastUsed).format("DD/MM/YYYY"),
      )}`
    : count;
};

/**
 * Logs one use of the given garments as a single Outfits entry. "When" starts
 * as now and can be moved to an earlier time. With one garment it also shows
 * its uses, its storage switch and Edit.
 */
export function QuickLogSheet({
  garments,
  lastUsed,
  language,
  onClose,
  onEdit,
  onLogged,
}: {
  garments: item[];
  lastUsed?: string;
  language: number;
  onClose: () => void;
  onEdit: (garment: item) => void;
  onLogged: (log: { eventId: string; name: string }) => void;
}) {
  const dispatch = useDispatch();
  const garment = garments.length === 1 ? garments[0] : undefined;
  const [when, setWhen] = useState<Date>();
  const [pickerOpen, setPickerOpen] = useState(false);
  const close = () => {
    setWhen(undefined);
    onClose();
  };
  const setOpen: Dispatch<SetStateAction<boolean>> = value => {
    if (!(typeof value === "function" ? value(true) : value)) close();
  };
  const logUse = () => {
    if (garments.length === 0) return;
    const eventId = nanoid();
    const name = garment
      ? garment.name.trim() || localization.Garment[language]
      : localization.Outfit[language];
    dispatch(
      addEventLog({
        eventId,
        eventName: name,
        eventDate: JSON.stringify(when ?? new Date()),
        logTime: JSON.stringify(new Date()),
      }),
    );
    garments.forEach(selected =>
      dispatch(addLog({ selectedId: selected.id, logId: eventId })),
    );
    close();
    onLogged({ eventId, name });
  };
  const whenLabel = when
    ? dayjs(when).format("DD/MM/YYYY · HH:mm")
    : localization.Now[language];
  return (
    <BottomSheet
      isOpen={garments.length > 0}
      setIsOpen={setOpen}
      title={
        garment
          ? garment.name || localization.Garment[language]
          : localization.Outfit[language]
      }
    >
      {garments.length > 0 && (
        <View style={styles.content}>
          {!garment && (
            <ThemeText customStyle={captionText}>
              {countText(
                localization.GarmentCount,
                localization.GarmentsCount,
                garments.length,
                language,
              )}
            </ThemeText>
          )}
          {garment && (
            <View style={styles.summary}>
              {garment.image ? (
                <Image
                  source={{ uri: `data:image/*;base64,${garment.image}` }}
                  style={styles.photo}
                />
              ) : (
                <View style={[styles.photo, styles.placeholder]}>
                  <Icon
                    name="shirt-outline"
                    size={24}
                    color={theme.colors.muted}
                  />
                </View>
              )}
              <ThemeText customStyle={[captionText, styles.usage]}>
                {usageSummary(garment.logIds?.length ?? 0, lastUsed, language)}
              </ThemeText>
            </View>
          )}
          {garment && (
            <View style={styles.storage}>
              <ThemeText customStyle={styles.storageLabel}>
                {localization.InStorage[language]}
              </ThemeText>
              <Switch
                accessibilityLabel={localization.InStorage[language]}
                value={garment.stored === true}
                onValueChange={stored => {
                  dispatch(setGarmentsStored({ ids: [garment.id], stored }));
                }}
              />
            </View>
          )}
          <View style={styles.when}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${localization.When[language]}: ${whenLabel}`}
              onPress={() => setPickerOpen(true)}
              style={styles.whenValue}
            >
              <ThemeText customStyle={captionText}>
                {localization.When[language]}
              </ThemeText>
              <ThemeText numberOfLines={1}>{whenLabel}</ThemeText>
            </Pressable>
            {when ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={localization.BackToNow[language]}
                onPress={() => setWhen(undefined)}
                style={styles.icon}
              >
                <Icon name="close" size={18} color={theme.colors.muted} />
              </Pressable>
            ) : (
              <View style={styles.icon}>
                <Icon
                  name="calendar-outline"
                  size={18}
                  color={theme.colors.muted}
                />
              </View>
            )}
          </View>
          <View style={styles.actions}>
            {garment && (
              <Button
                mode="outlined"
                style={styles.action}
                onPress={() => {
                  close();
                  onEdit(garment);
                }}
              >
                {localization.Edit[language]}
              </Button>
            )}
            <Button mode="contained" style={styles.action} onPress={logUse}>
              {localization.LogUse[language]}
            </Button>
          </View>
          <DateTimePickerModal
            isVisible={pickerOpen}
            mode="datetime"
            date={when ?? new Date()}
            maximumDate={new Date()}
            onConfirm={date => {
              setPickerOpen(false);
              // Uses can't be logged in the future.
              setWhen(date > new Date() ? undefined : date);
            }}
            onCancel={() => setPickerOpen(false)}
          />
        </View>
      )}
    </BottomSheet>
  );
}
const styles = StyleSheet.create({
  content: {
    gap: theme.spacing.md,
  },
  summary: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  photo: {
    width: 56,
    height: 56,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.surface,
  },
  placeholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  usage: {
    flex: 1,
  },
  when: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 48,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.muted,
    borderRadius: theme.radius.sm,
  },
  whenValue: {
    flex: 1,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: theme.spacing.md,
  },
  icon: {
    width: theme.touch,
    minHeight: theme.touch,
    justifyContent: "center",
    alignItems: "center",
  },
  storage: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: theme.touch,
  },
  storageLabel: {
    flex: 1,
  },
  actions: {
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  action: {
    flex: 1,
  },
});
