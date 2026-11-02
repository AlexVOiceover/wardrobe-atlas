import { Dispatch, SetStateAction } from "react";
import { FlatList, StyleSheet, TouchableOpacity, View } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { CollectionTag } from "../redux/itemsSlice";
import {
  COLLECTION_SORT_VALUES,
  CollectionSortValue,
} from "../utils/collectionOrder";
import { EditItemList } from "./EditItemList";
import { EmptyState } from "./EmptyState";
import { theme } from "../utils/theme";
type Props = {
  collections: CollectionTag[];
  sortValue: CollectionSortValue;
  refresh: boolean;
  setRefresh: Dispatch<SetStateAction<boolean>>;
  emptyText: string;
  onMoveCollection: (value: string, direction: "up" | "down") => void;
};
export const CollectionList = ({
  collections,
  sortValue,
  refresh,
  setRefresh,
  emptyText,
  onMoveCollection,
}: Props) => {
  const isCustomSort = sortValue === COLLECTION_SORT_VALUES.CUSTOM;
  if (collections.length === 0) {
    return <EmptyState message={emptyText} />;
  }
  return (
    <FlatList
      key={`collection-list-${sortValue}`}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      data={collections}
      extraData={{ refresh, sortValue }}
      keyExtractor={item => item.value}
      renderItem={({ item, index }) => (
        <View
          style={
            isCustomSort
              ? styles.collectionRowCustom
              : styles.collectionRowStandard
          }
        >
          {isCustomSort && (
            <View style={styles.reorderColumn}>
              <TouchableOpacity
                disabled={index === 0}
                onPress={() => onMoveCollection(item.value, "up")}
                style={styles.reorderButton}
              >
                <Icon
                  name="arrow-up-bold"
                  size={18}
                  color={theme.colors.text}
                />
              </TouchableOpacity>
              <TouchableOpacity
                disabled={index === collections.length - 1}
                onPress={() => onMoveCollection(item.value, "down")}
                style={styles.reorderButton}
              >
                <Icon
                  name="arrow-down-bold"
                  size={18}
                  color={theme.colors.text}
                />
              </TouchableOpacity>
            </View>
          )}
          <EditItemList
            item={item}
            setRefresh={setRefresh}
            CollectionsState={collections}
            containerStyle={
              isCustomSort
                ? styles.collectionItemCustom
                : styles.collectionItemStandard
            }
          />
        </View>
      )}
    />
  );
};
const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.md,
  },
  collectionRowCustom: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  collectionRowStandard: {},
  reorderColumn: {
    width: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  reorderButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  collectionItemStandard: {
    width: "100%",
    alignSelf: "center",
    marginBottom: 0,
  },
  collectionItemCustom: {
    flex: 1,
    alignSelf: "stretch",
    marginBottom: 0,
  },
});
