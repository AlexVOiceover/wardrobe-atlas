import { ReactElement, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { ThemeText } from "./ThemeText";
import Icon from "react-native-vector-icons/Ionicons";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { toggleCollection } from "../redux/itemsSlice";
export const CollectionContainer = ({
  label,
  children,
  LaundryReminder = false,
}: {
  label: string;
  children: ReactElement;
  color?: string;
  LaundryReminder?: boolean;
}) => {
  const collectionTags = useSelector(
    (state: RootState) => state.itemsList.collectionTags,
  );
  const [isFolded, setIsFolded] = useState(
    LaundryReminder
      ? false
      : collectionTags.find(x => x.label === label)?.isOpen,
  );
  const dispatch = useDispatch();
  return (
    <View style={[styles.container, { backgroundColor: "#ffffff" }]}>
      <Pressable
        onPress={() => {
          setIsFolded(prev => !prev);
          !LaundryReminder && dispatch(toggleCollection({ name: label }));
        }}
        style={[
          styles.header,
          {
            backgroundColor: "#ffffff",
          },
        ]}
      >
        <View style={{ flexDirection: "row", paddingHorizontal: 8 }}>
          {LaundryReminder && (
            <Icon
              style={{ marginRight: 5 }}
              color="#111111"
              name={"warning-outline"}
              size={20}
            />
          )}
          <ThemeText customStyle={styles.headerText}>{label}</ThemeText>
        </View>
        <Icon
          color="#111111"
          name={isFolded ? "chevron-down" : "chevron-up"}
          size={20}
        />
      </Pressable>
      <View style={isFolded ? styles.childrenContainer : undefined}>
        {isFolded && children}
      </View>
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    width: "100%",
    borderWidth: 0.4,
  },
  header: {
    width: "100%",
    height: 32,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingRight: 20,
  },
  headerText: {
    fontWeight: "500",
  },
  childrenContainer: {
    minHeight: 72,
  },
});
