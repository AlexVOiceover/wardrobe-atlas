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
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import {
  changeCategoryTypeByIndex,
  delCategoryTypeByIndex,
} from "../redux/categoriesSlice";
export const EditItemList = ({
  item,
  setRefresh,
  CollectionsState,
  isCatType = false, //for catTypes
  ignoreNum, //for catTypes
  currentIndex, //for catTypes
  catIndex, //for catTypes
  containerStyle,
}: {
  item: CollectionTag;
  setRefresh: Dispatch<SetStateAction<boolean>>;
  CollectionsState:
    | CollectionTag[]
    | {
        label: string;
        value: string;
        icon: number;
      }[];
  isCatType?: boolean;
  ignoreNum?: number;
  currentIndex?: number;
  catIndex?: number;
  containerStyle?: StyleProp<ViewStyle>;
}) => {
  const [enableEditing, setEnableEditing] = useState(false);
  const dispatch = useDispatch();
  const [newNameInput, setNewNameInput] = useState(item.label || "");
  const [] = useState(false);
  const [] = useState([item.color || "#fff"]);
  return (
    <View
      style={[styles.container, containerStyle, { backgroundColor: "#ffffff" }]}
    >
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
        <ThemeText customStyle={[styles.itemLabel, { color: "#111111" }]}>
          {item.label}
        </ThemeText>
      )}

      {(currentIndex ?? 0) >= (ignoreNum ?? 0) && (
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
                  !isCatType
                    ? dispatch(
                        updateCollection({
                          name: item.label,
                          newName: newNameInput || item.label,
                          color: item.color,
                        }),
                      )
                    : dispatch(
                        changeCategoryTypeByIndex({
                          index: catIndex ?? 0,
                          typeIndex: (currentIndex ?? 0) - (ignoreNum ?? 0),
                          typeName: newNameInput || item.label,
                        }),
                      );
                  setRefresh(prev => !prev);
                }
              }
            }}
          >
            <Icon
              name={enableEditing ? "check-bold" : "note-edit"}
              size={25}
              color="#111111"
            />
          </TouchableOpacity>
          {!enableEditing && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                if (!isCatType) {
                  dispatch(deleteCollection({ name: item.label }));
                  dispatch(itemRefresher());
                } else {
                  dispatch(
                    delCategoryTypeByIndex({
                      index: catIndex ?? 0,
                      typeIndex: (currentIndex ?? 0) - (ignoreNum ?? 0),
                    }),
                  );
                }
                setRefresh(prev => !prev);
              }}
            >
              <Icon name="delete" size={30} color="#111111" />
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    width: "80%",
    minHeight: 59,
    alignSelf: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#777777",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  inputWrapper: {
    flex: 1,
    marginLeft: 20,
    marginRight: 8,
  },
  editInput: {
    height: 40,
  },
  itemLabel: {
    fontWeight: "700",
    marginLeft: 20,
    flex: 1,
  },
  paletteWrapper: {
    marginRight: 8,
  },
  paletteButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  iconButton: {
    borderColor: "#777777",
    borderWidth: 2,
    borderStyle: "solid",
  },
  iconImage: {
    width: 28,
    height: 28,
  },
  actionsRow: {
    flexDirection: "row",
  },
  actionButton: {
    width: 64,
    minHeight: 59,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
});
