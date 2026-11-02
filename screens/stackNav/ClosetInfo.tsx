import { BackButton } from "../../components/BackButton";
import { ThemeText } from "../../components/ThemeText";
import { ThemeView } from "../../components/ThemeView";
import { View, StyleSheet, FlatList } from "react-native";
import {
  categoryInfo,
  closetInfo,
  localization,
} from "../../utils/localization";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { Children, ReactNode, useMemo } from "react";
import { defaultCategories } from "./Category";
import { ItemBox } from "../../components/ItemBox";
import { item } from "../../redux/itemsSlice";
import { Category } from "../../redux/categoriesSlice";
const InfoCardWrapper = ({
  title,
  children,
}: {
  title: string;
  index: number;
  children?: ReactNode;
}) => {
  if (Children.count(children) === 0) {
    return null;
  }
  return (
    <View style={[styles.cardWrapper]}>
      <ThemeText>{title}</ThemeText>

      <View style={styles.row}>{children}</View>
    </View>
  );
};
const InfoCardNumber = ({
  title,
  value,
}: {
  title: string;
  value: number;
  index: number;
}) => {
  return (
    <View style={[styles.cardNumber]}>
      <ThemeText customStyle={[{}]}>{title}</ThemeText>
      <ThemeText customStyle={[{}]}>{String(value)}</ThemeText>
    </View>
  );
};
const InfoCardCategories = ({
  items,
  Categories,
  language,
}: {
  items: item[];
  Categories: Category[];
  language: number;
}) => {
  const counts = Categories.map(
    cat => items.filter(it => cat.index == it.category).length,
  );
  return (
    <View>
      {Categories.map((category, index) => (
        <View key={"Card" + index} style={[styles.cardNumber]}>
          <ThemeText>
            {(category.name[language] || category.name[0]) + " " + categoryInfo[language]}
          </ThemeText>
          <View style={styles.countRow}>
            <ThemeText customStyle={[{}]}>
              {String(counts[index] || 0)}
            </ThemeText>
            <ThemeText customStyle={[{}]}>
              {" item" + ((counts[index] || 0) > 1 ? "s" : "")}
            </ThemeText>
          </View>
        </View>
      ))}
    </View>
  );
};
export const ClosetInfo = ({}) => {
  const storedSettings = useSelector((state: RootState) => state.settings);
  const storedItems = useSelector((state: RootState) => state.itemsList.items);
  const storedEvents = useSelector((state: RootState) => state.itemsList.logs);
  const storedCollections = useSelector(
    (state: RootState) => state.itemsList.collectionTags,
  );
  const storedCategories = [
    ...defaultCategories,
    ...useSelector((state: RootState) => state.CategoryList.Categories),
  ];
  const data = useMemo(() => {
    const sortedItems = [...storedItems].sort(
      (a, b) => (b.logIds?.length || 0) - (a.logIds?.length || 0),
    );
    const currentDate = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(currentDate.getMonth() - 1);
    const filteredEventsLastMonth = storedEvents.filter(x => {
      const eventDate = new Date(JSON.parse(x.eventDate));
      return eventDate >= oneMonthAgo && eventDate <= currentDate;
    });
    const top5LastMonth = sortedItems
      .filter(x => {
        return x.logIds?.some(logId =>
          filteredEventsLastMonth.some(event => event.eventId === logId),
        );
      })
      .slice(0, 5);
    const top5 = sortedItems
      .filter(x => x.logIds && x.logIds.length > 0)
      .slice(0, 5);
    let info: [number, number, number, item[], item[]] = [
      storedItems.length,
      storedEvents.length,
      storedCollections.length,
      top5LastMonth,
      top5,
    ];
    return info;
  }, [storedItems, storedEvents, storedCollections]);
  return (
    <ThemeView>
      <BackButton
        pageTitle={localization.ClosetInfo[storedSettings.language]}
      />
      <FlatList
        ListFooterComponent={
          <InfoCardCategories
            Categories={storedCategories}
            items={storedItems}
            language={storedSettings.language}
          />
        }
        showsVerticalScrollIndicator={false}
        data={closetInfo[storedSettings.language]}
        renderItem={({ item, index }) =>
          index > 2 ? (
            <InfoCardWrapper
              index={index}
              key={"infoCard" + index}
              title={item}
            >
              {(data[index] as item[]).map((item: item) => {
                return (
                  <ItemBox
                    primary={item.primaryColor || "#fff"}
                    secondary={item.secondaryColor || "#fff"}
                    tertiary={item.tertiaryColor || "#fff"}
                    key={item.id}
                    image={item.image}
                    name={item.name}
                    type={item.type}
                    id={item.id}
                    logs={item.logIds || []}
                    addSpace={true}
                  />
                );
              })}
            </InfoCardWrapper>
          ) : (
            <InfoCardNumber
              index={index}
              key={"infoCardNum" + index}
              title={item}
              value={data[index] as number}
            />
          )
        }
      />
    </ThemeView>
  );
};
const styles = StyleSheet.create({
  cardWrapper: {
    flexDirection: "column",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#777777",
    borderWidth: 1,
    padding: 8,
  },
  cardNumber: {
    flexDirection: "column",
    backgroundColor: "#ffffff",
    alignItems: "center",
    borderColor: "#777777",
    borderWidth: 1,
    padding: 8,
  },
  row: {
    width: "100%",
    flexDirection: "column",
  },
  countRow: {
    flexDirection: "row",
    alignItems: "center",
  },
});
