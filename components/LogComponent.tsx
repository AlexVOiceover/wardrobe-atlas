import React, { Dispatch, SetStateAction, useMemo } from "react";
import { View, Pressable, StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { ItemBox, garmentSummary } from "./ItemBox";
import dayjs from "dayjs";
import {
  deleteEventLog,
  deleteLog,
  restoreEventLog,
  type item,
  type logsType,
} from "../redux/itemsSlice";
import { GarmentGrid } from "./GarmentGrid";
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
interface LogComponentProps {
  eventName: string;
  eventDate: Date;
  eventId: string;
  /** Deletes at once; the list offers Undo. */
  onDelete: () => void;
  setModalVisible: Dispatch<SetStateAction<boolean>>;
  setModalEventId: Dispatch<SetStateAction<string>>;
}
export const LogComponent = ({
  eventName,
  eventDate,
  eventId,
  onDelete,
  setModalVisible,
  setModalEventId,
}: LogComponentProps) => {
  const itemsState = useSelector((state: RootState) => state.itemsList.items);
  const language = useSelector((state: RootState) => state.settings.language);
  const associatedItems = useMemo(() => {
    return itemsState.filter(item => item.logIds?.some(id => id === eventId));
  }, [itemsState, eventId]);
  const handlePress = () => {
    setModalVisible(true);
    setModalEventId(eventId);
  };
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={eventName}
          onPress={handlePress}
          style={styles.eventInfo}
        >
          <ThemeText numberOfLines={2} customStyle={styles.eventTitle}>
            {eventName}
          </ThemeText>
          <ThemeText customStyle={captionText}>
            {dayjs(eventDate).format("DD/MM/YYYY · h:mm A")}
          </ThemeText>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${localization.Delete[language]}: ${eventName}`}
          onPress={onDelete}
          style={styles.deleteButton}
        >
          <Icon name="trash-outline" size={22} color={theme.colors.danger} />
        </Pressable>
      </View>
      {associatedItems.length > 0 ? (
        <GarmentGrid
          garments={associatedItems}
          renderGarment={garment => <ItemBox {...garmentSummary(garment)} />}
        />
      ) : (
        <ThemeText customStyle={captionText}>
          {localization.NoLogItems[language]}
        </ThemeText>
      )}
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    paddingBottom: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  eventInfo: {
    flex: 1,
    minHeight: theme.touch,
    justifyContent: "center",
  },
  eventTitle: {
    fontWeight: "600",
  },
  deleteButton: {
    width: theme.touch,
    height: theme.touch,
    justifyContent: "center",
    alignItems: "flex-end",
  },
});
