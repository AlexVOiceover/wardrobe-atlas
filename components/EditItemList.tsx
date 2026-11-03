import {
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { Dispatch, SetStateAction, useState } from "react";
import { CustomInput } from "../components/CustomInput";
import { useDispatch } from "react-redux";
import { ThemeText } from "../components/ThemeText";
import {
  CollectionTag,
  deleteCollection,
  itemRefresher,
  updateCollection,
} from "../redux/itemsSlice";
import Icon from "react-native-vector-icons/Ionicons";
import { theme } from "../utils/theme";
export const EditItemList = ({
  item,
  setRefresh,
  CollectionsState,
  containerStyle,
}: {
  item: CollectionTag;
  setRefresh: Dispatch<SetStateAction<boolean>>;
  CollectionsState: CollectionTag[];
  containerStyle?: StyleProp<ViewStyle>;
}) => {
  const [enableEditing, setEnableEditing] = useState(false);
  const dispatch = useDispatch();
  const [newNameInput, setNewNameInput] = useState(item.label || "");
  return (
    <View style={[styles.container, containerStyle]}>
      {enableEditing ? (
        <View style={styles.inputWrapper}>
          <CustomInput
            mode="outlined"
            textContentType="name"
            style={styles.editInput}
            value={newNameInput}
            onChangeText={text => setNewNameInput(text)}
          />
        </View>
      ) : (
        <ThemeText numberOfLines={2} customStyle={styles.itemLabel}>
          {item.label}
        </ThemeText>
      )}

      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => {
            if (
              (CollectionsState.filter(
                x => x.label.toLowerCase() === newNameInput.toLowerCase(),
              ).length < 1 &&
                newNameInput.length < 20) ||
              newNameInput === item.label
            ) {
              setEnableEditing(prev => !prev);
              if (enableEditing) {
                dispatch(
                  updateCollection({
                    name: item.label,
                    newName: newNameInput || item.label,
                    color: item.color,
                  }),
                );
                setRefresh(prev => !prev);
              }
            }
          }}
        >
          <Icon
            name={enableEditing ? "checkmark" : "create-outline"}
            size={22}
            color={theme.colors.text}
          />
        </TouchableOpacity>
        {!enableEditing && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              dispatch(deleteCollection({ name: item.label }));
              dispatch(itemRefresher());
              setRefresh(prev => !prev);
            }}
          >
            <Icon name="trash-outline" size={22} color={theme.colors.danger} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    width: "100%",
    minHeight: 56,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  inputWrapper: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  editInput: {
    height: 40,
  },
  itemLabel: {
    flex: 1,
  },
  actionsRow: {
    flexDirection: "row",
  },
  actionButton: {
    width: theme.touch,
    minHeight: theme.touch,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
});
