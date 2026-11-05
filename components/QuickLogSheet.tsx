import { Dispatch, SetStateAction, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Button } from "react-native-paper";
import Icon from "react-native-vector-icons/Ionicons";
import dayjs from "dayjs";
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
        dayjs(lastUsed).format("DD/MM/YYYY"),
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
      // The garment's name is in its row, so the title says what this is for.
      title={
        garment ? localization.LogUse[language] : localization.Outfit[language]
      }
    >
      {garments.length > 0 && (
        <View style={styles.content}>
          {garment ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={localization.EditNamed[language].replace(
                "{name}",
                name,
              )}
              onPress={() => {
                close();
                onEdit(garment);
              }}
              style={styles.garmentRow}
            >
              <GarmentPhoto image={garment.image} size={56} />
              <View style={styles.garmentText}>
                <ThemeText numberOfLines={2} customStyle={styles.name}>
                  {name}
                </ThemeText>
                <ThemeText customStyle={captionText}>
                  {usageSummary(
                    garment.logIds?.length ?? 0,
                    lastUsed,
                    language,
                  )}
                </ThemeText>
              </View>
              <Icon
                name="chevron-forward"
                size={20}
                color={theme.colors.muted}
              />
            </Pressable>
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
          <View>
            <Button mode="contained" onPress={logUse}>
              {localization.LogUse[language]}
            </Button>
            <WhenControl when={when} setWhen={setWhen} language={language} />
          </View>
        </View>
      )}
    </BottomSheet>
  );
}
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
    ? dayjs(when).format("DD/MM/YYYY · HH:mm")
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
    minHeight: theme.touch,
  },
  garmentText: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontWeight: "600",
  },
  thumbnails: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs,
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
