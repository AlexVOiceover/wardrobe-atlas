import React, { Dispatch, SetStateAction, useMemo, useState } from "react";
import { View, Pressable, StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { ItemBox, garmentSummary } from "./ItemBox";
import dayjs from "dayjs";
import { deleteEventLog, deleteLog } from "../redux/itemsSlice";
import { ConfirmationDialog } from "./ConfirmationDialog";
import { GarmentGrid } from "./GarmentGrid";
import { ThemeText } from "./ThemeText";
import { localization } from "../utils/localization";
import { captionText, theme } from "../utils/theme";
interface LogComponentProps {
  eventName: string;
  eventDate: Date;
  eventId: string;
  setRefresh: Dispatch<SetStateAction<boolean>>;
  setModalVisible: Dispatch<SetStateAction<boolean>>;
  setModalEventId: Dispatch<SetStateAction<string>>;
}
export const LogComponent = ({
  eventName,
  eventDate,
  eventId,
  setRefresh,
  setModalVisible,
  setModalEventId,
}: LogComponentProps) => {
  const dispatch = useDispatch();
  const itemsState = useSelector((state: RootState) => state.itemsList.items);
  const language = useSelector((state: RootState) => state.settings.language);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const associatedItems = useMemo(() => {
    return itemsState.filter(item => item.logIds?.some(id => id === eventId));
  }, [itemsState, eventId]);
  const handleDelete = () => {
    dispatch(deleteLog({ selectedLogId: eventId }));
    dispatch(deleteEventLog({ selectedLogId: eventId }));
    setRefresh(prev => !prev);
  };
  const handlePress = () => {
    setModalVisible(true);
    setModalEventId(eventId);
  };
  return (
    <View style={styles.container}>
      <ConfirmationDialog
        visible={confirmVisible}
        setVisible={setConfirmVisible}
        onConfirm={handleDelete}
      />
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={eventName}
          onPress={handlePress}
          style={styles.eventInfo}
        >
          <ThemeText customStyle={styles.eventTitle}>{eventName}</ThemeText>
          <ThemeText customStyle={captionText}>
            {dayjs(eventDate).format("DD/MM/YYYY · h:mm A")}
          </ThemeText>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={localization.Delete[language]}
          onPress={() => setConfirmVisible(true)}
          style={styles.deleteButton}
        >
          <Icon name="close" size={20} color={theme.colors.muted} />
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
