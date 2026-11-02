import React, { Dispatch, SetStateAction, useMemo, useState } from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Text } from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { ItemBox } from "./ItemBox";
import dayjs from "dayjs";
import { deleteEventLog, deleteLog } from "../redux/itemsSlice";
import { colors } from "../utils/colors";
import { ConfirmationDialog } from "./ConfirmationDialog";
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
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      style={[styles.container, { backgroundColor: "#ffffff" }]}
    >
      <View style={styles.header}>
        <View style={styles.eventInfo}>
          <Text variant="titleMedium" style={styles.eventTitle}>
            {eventName}
          </Text>
          <View style={styles.dateTimeRow}>
            <Text variant="bodySmall" style={styles.dateText}>
              {dayjs(eventDate).format("DD/MM/YYYY")}
            </Text>
            <View style={styles.separator} />
            <Text variant="bodySmall" style={styles.timeText}>
              {dayjs(eventDate).format("h:mm A")}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => setConfirmVisible(true)}
          style={styles.deleteButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.deleteIcon}>✕</Text>
        </TouchableOpacity>
      </View>

      <ConfirmationDialog
        visible={confirmVisible}
        setVisible={setConfirmVisible}
        onConfirm={handleDelete}
      />

      <View style={[styles.itemsGrid, { borderColor: "#777777" }]}>
        {associatedItems.length > 0 ? (
          associatedItems.map(item => (
            <View key={`log-item-${item.id}`} style={styles.itemWrapper}>
              <ItemBox
                primary={item.primaryColor || colors.white}
                secondary={item.secondaryColor || colors.white}
                tertiary={item.tertiaryColor || colors.white}
                image={item.image}
                name={item.name}
                type={item.type}
                id={item.id}
                logs={item.logIds || []}
                addSpace={true}
              />
            </View>
          ))
        ) : (
          <Text variant="bodySmall" style={styles.noItemsText}>
            No items associated with this log.
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};
const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginVertical: 8,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    color: "#111111",
    fontWeight: "bold",
    textTransform: "capitalize",
    marginBottom: 2,
  },
  dateTimeRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateText: {
    color: "#111111",
  },
  timeText: {
    color: "#111111",
  },
  separator: {
    width: 1,
    height: 10,
    backgroundColor: "#ffffff",
    marginHorizontal: 8,
  },
  deleteButton: {
    backgroundColor: "#ffffff",
    width: 28,
    height: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  deleteIcon: {
    color: "#111111",
    fontSize: 14,
    fontWeight: "900",
    lineHeight: 18,
  },
  itemsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    backgroundColor: "#ffffff", // Subtle tint
    padding: 10,
    justifyContent: "flex-start",
    borderTopWidth: 1,
    minHeight: 80,
  },
  itemWrapper: {
    width: "100%",
    alignItems: "center",
    paddingVertical: 4,
  },
  noItemsText: {
    width: "100%",
    textAlign: "center",
    marginTop: 20,
    color: "#111111",
  },
});
