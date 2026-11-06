import { Dispatch, SetStateAction, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Button } from "react-native-paper";
import Icon from "react-native-vector-icons/Ionicons";
import { formatDate, formatDateTime } from "../utils/dates";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { useDispatch } from "react-redux";
import "react-native-get-random-values";
import { nanoid } from "nanoid";
import { addEventLog, addLog, type item } from "../redux/itemsSlice";
import { countText, localization } from "../utils/localization";
import { captionText, theme } from "../utils/theme";
import { BottomSheet } from "./BottomSheet";
import { ThemeText } from "./ThemeText";
import { GarmentPhoto } from "./GarmentPhoto";

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
        formatDate(lastUsed, language),
      )}`
    : count;
};

/**
 * Logs one use of the garments as a single Outfits entry, named after the
 * garment or "Outfit" for several unless a name is given.
 */
export function logGarments(
  dispatch: Dispatch<any>,
  garments: item[],
  language: number,
  when?: Date,
  eventName?: string,
) {
  const eventId = nanoid();
  const name =
    eventName ||
    (garments.length === 1
      ? garments[0].name.trim() || localization.Garment[language]
      : localization.Outfit[language]);
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
  return { eventId, name };
}

/**
 * Logs one use of the given garments as a single Outfits entry. "When" starts
 * as now and can be moved to an earlier time. With one garment, its row shows
 * its uses and opens Edit; with several, their photos show what is logged.
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
  const close = () => {
    setWhen(undefined);
    onClose();
  };
  const setOpen: Dispatch<SetStateAction<boolean>> = value => {
    if (!(typeof value === "function" ? value(true) : value)) close();
  };
  const logUse = () => {
    if (garments.length === 0) return;
    const log = logGarments(dispatch, garments, language, when);
    close();
    onLogged(log);
  };
  const name = garment?.name || localization.Garment[language];
  return (
    <BottomSheet
      isOpen={garments.length > 0}
      setIsOpen={setOpen}
      title={garment ? name : localization.Outfit[language]}
    >
      {garments.length > 0 && (
        <View style={styles.content}>
          {garment ? (
            <View style={styles.garmentRow}>
              <GarmentPhoto image={garment.image} size={56} />
              <ThemeText customStyle={[captionText, styles.usage]}>
                {usageSummary(garment.logIds?.length ?? 0, lastUsed, language)}
              </ThemeText>
            </View>
          ) : (
            <>
              <View style={styles.thumbnails}>
                {garments.map(picked => (
                  <GarmentPhoto
                    key={picked.id}
                    image={picked.image}
                    size={40}
                    label={picked.name || localization.Garment[language]}
                  />
                ))}
              </View>
              <ThemeText customStyle={captionText}>
                {countText(
                  localization.GarmentCount,
                  localization.GarmentsCount,
                  garments.length,
                  language,
                )}
              </ThemeText>
            </>
          )}
          {/* Logging is what this panel is for, so it gets a big target. */}
          <View style={styles.log}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={localization.LogUse[language]}
              onPress={logUse}
              style={({ pressed }) => [
                styles.logButton,
                pressed && styles.logButtonPressed,
              ]}
            >
              <Icon name="checkmark" size={32} color={theme.colors.onBar} />
              <ThemeText customStyle={styles.logText}>
                {localization.LogUse[language]}
              </ThemeText>
            </Pressable>
            <WhenControl when={when} setWhen={setWhen} language={language} />
          </View>
          {garment && (
            <Button
              mode="outlined"
              icon={editIcon}
              onPress={() => {
                close();
                onEdit(garment);
              }}
            >
              {localization.EditGarment[language]}
            </Button>
          )}
        </View>
      )}
    </BottomSheet>
  );
}
const editIcon = ({ size, color }: { size: number; color: string }) => (
  <Icon name="create-outline" size={size} color={color} />
);
/**
 * "Now · change" under a log button: picks an earlier time to log at; ✕ goes
 * back to now. Future times count as now.
 */
export function WhenControl({
  when,
  setWhen,
  language,
}: {
  when?: Date;
  setWhen: (when?: Date) => void;
  language: number;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const whenLabel = when
    ? formatDateTime(when, language)
    : localization.Now[language];
  return (
    <>
      <View style={styles.when}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${localization.When[language]}: ${whenLabel}`}
          onPress={() => setPickerOpen(true)}
          style={styles.whenValue}
        >
          <ThemeText customStyle={styles.whenText}>
            {when ? whenLabel : localization.NowChange[language]}
          </ThemeText>
        </Pressable>
        {when && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={localization.BackToNow[language]}
            onPress={() => setWhen(undefined)}
            style={styles.icon}
          >
            <Icon name="close" size={18} color={theme.colors.muted} />
          </Pressable>
        )}
      </View>
      <DateTimePickerModal
        isVisible={pickerOpen}
        mode="datetime"
        date={when ?? new Date()}
        maximumDate={new Date()}
        is24Hour
        onConfirm={date => {
          setPickerOpen(false);
          // Uses can't be logged in the future.
          setWhen(date > new Date() ? undefined : date);
        }}
        onCancel={() => setPickerOpen(false)}
      />
    </>
  );
}
const styles = StyleSheet.create({
  content: {
    gap: theme.spacing.md,
  },
  garmentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  usage: {
    flex: 1,
  },
  thumbnails: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs,
  },
  log: {
    alignItems: "center",
  },
  logButton: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: theme.colors.bar,
    justifyContent: "center",
    alignItems: "center",
    gap: 2,
  },
  logButtonPressed: {
    opacity: 0.8,
  },
  logText: {
    color: theme.colors.onBar,
    fontWeight: "600",
    textAlign: "center",
  },
  // A small text button under Log use.
  when: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  whenValue: {
    justifyContent: "center",
    minHeight: theme.touch,
    paddingHorizontal: theme.spacing.sm,
  },
  whenText: {
    color: theme.colors.bar,
    fontSize: theme.type.caption,
  },
  icon: {
    width: theme.touch,
    minHeight: theme.touch,
    justifyContent: "center",
    alignItems: "center",
  },
});
