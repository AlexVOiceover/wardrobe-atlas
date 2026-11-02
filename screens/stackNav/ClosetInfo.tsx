import { PageHeader } from "../../components/PageHeader";
import { ThemeView } from "../../components/ThemeView";
import { ScrollView, View } from "react-native";
import { closetInfo, localization } from "../../utils/localization";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { useMemo } from "react";
import { defaultCategories } from "./Category";
import { ItemBox, garmentSummary } from "../../components/ItemBox";
import { GarmentGrid } from "../../components/GarmentGrid";
import { ListRow } from "../../components/ListRow";
import { SectionHeading } from "../../components/SectionHeading";
import { ThemeText } from "../../components/ThemeText";
import { item } from "../../redux/itemsSlice";
import { theme } from "../../utils/theme";
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
  const language = storedSettings.language;
  const titles = closetInfo[language];
  const count = (value: number) => <ThemeText>{String(value)}</ThemeText>;
  return (
    <ThemeView>
      <PageHeader title={localization.ClosetInfo[language]} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: theme.spacing.md,
          paddingBottom: theme.spacing.lg,
        }}
      >
        {[0, 1, 2].map(index => (
          <ListRow
            key={index}
            title={titles[index]}
            right={count(data[index] as number)}
          />
        ))}
        <View style={{ marginTop: theme.spacing.md }}>
          <SectionHeading title={localization.Categories[language]} />
          {storedCategories.map(category => (
            <ListRow
              key={category.index}
              title={category.name[language] || category.name[0]}
              right={count(
                storedItems.filter(it => it.category === category.index).length,
              )}
            />
          ))}
        </View>
        {[3, 4].map(index =>
          (data[index] as item[]).length > 0 ? (
            <View key={index} style={{ marginTop: theme.spacing.md }}>
              <SectionHeading title={titles[index]} />
              <GarmentGrid
                garments={data[index] as item[]}
                renderGarment={garment => (
                  <ItemBox {...garmentSummary(garment)} />
                )}
              />
            </View>
          ) : null,
        )}
      </ScrollView>
    </ThemeView>
  );
};
