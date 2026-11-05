import React, { useMemo } from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { formatDateTime } from "../utils/dates";
import {
  deleteEventLog,
  deleteLog,
  restoreEventLog,
  type item,
  type logsType,
} from "../redux/itemsSlice";
import { GarmentPhoto } from "./GarmentPhoto";
import { ThemeText } from "./ThemeText";
import { localization } from "../utils/localization";
import { captionText, theme } from "../utils/theme";
/**
 * Deletes a logged outfit and returns the action that puts it back exactly:
 * same place in the list and in each garment's logIds.
 */
export function deleteOutfit(
  dispatch: (action: any) => void,
  logs: logsType[],
  garments: item[],
  eventId: string,
) {
  const index = logs.findIndex(log => log.eventId === eventId);
  if (index < 0) return undefined;
  const restore = restoreEventLog({
    log: logs[index],
    index,
    garments: garments.flatMap(garment => {
      const at = garment.logIds?.indexOf(eventId) ?? -1;
      return at < 0 ? [] : [{ id: garment.id, index: at }];
    }),
  });
  dispatch(deleteLog({ selectedLogId: eventId }));
  dispatch(deleteEventLog({ selectedLogId: eventId }));
  return { name: logs[index].eventName, restore };
}
/** What Outfits shows with Undo after another screen logged or deleted. */
export type OutfitNotice =
  | { kind: "logged"; eventId: string; name: string }
  | {
      kind: "deleted";
      name: string;
      restore: ReturnType<typeof restoreEventLog>;
    };

/** Goes back to the Outfits tab, which shows the notice with Undo. */
export const returnToOutfits = (navigation: any, notice: OutfitNotice) =>
  navigation.popTo("StackNavHome", {
    screen: "Outfits",
    params: { notice },
  });

/**
 * A logged outfit: name, date, notes and small photos of its garments. A tap
 * opens it for editing.
 */
export const LogComponent = ({
  eventName,
  eventDate,
  eventId,
  notes,
  onPress,
}: {
  eventName: string;
  eventDate: Date;
  eventId: string;
  notes?: string;
  onPress: () => void;
}) => {
  const itemsState = useSelector((state: RootState) => state.itemsList.items);
  const language = useSelector((state: RootState) => state.settings.language);
  const associatedItems = useMemo(() => {
    return itemsState.filter(item => item.logIds?.some(id => id === eventId));
  }, [itemsState, eventId]);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={localization.EditNamed[language].replace(
        "{name}",
        eventName,
      )}
      onPress={onPress}
      style={styles.container}
    >
      <ThemeText numberOfLines={2} customStyle={styles.eventTitle}>
        {eventName}
      </ThemeText>
      <ThemeText customStyle={captionText}>
        {formatDateTime(eventDate, language)}
      </ThemeText>
      {!!notes && (
        <ThemeText numberOfLines={1} customStyle={captionText}>
          {notes}
        </ThemeText>
      )}
      {associatedItems.length > 0 ? (
        <View style={styles.photos}>
          {associatedItems.map(garment => (
            <GarmentPhoto
              key={garment.id}
              image={garment.image}
              size={56}
              label={garment.name || localization.Garment[language]}
            />
          ))}
        </View>
      ) : (
        <ThemeText customStyle={captionText}>
          {localization.NoLogItems[language]}
        </ThemeText>
      )}
    </Pressable>
  );
};
const styles = StyleSheet.create({
  container: {
    gap: 2,
    paddingVertical: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  eventTitle: {
    fontWeight: "600",
  },
  photos: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xs,
  },
});
