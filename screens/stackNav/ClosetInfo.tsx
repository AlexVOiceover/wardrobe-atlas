import { PageHeader } from "../../components/PageHeader";
import { ThemeView } from "../../components/ThemeView";
import { ScrollView, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { closetInfo, localization } from "../../utils/localization";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { useMemo } from "react";
import { visibleCategories } from "../../utils/categories";
import { ItemBox, garmentSummary } from "../../components/ItemBox";
import { GarmentGrid } from "../../components/GarmentGrid";
import { ListRow } from "../../components/ListRow";
import { SectionHeading } from "../../components/SectionHeading";
import { ThemeText } from "../../components/ThemeText";
import { useWardrobeView } from "../../components/WardrobeSelector";
import { filterByWardrobe } from "../../utils/wardrobes";
import { RECENT_DAYS, daysAgo, topUsed } from "../../utils/closetStats";
import { captionText, theme } from "../../utils/theme";
/**
 * Counts and most used garments, for the wardrobe chosen in the Closet (or
 * all of them). A garment opens its edit page, as there is nothing to log
 * from here.
 */
export const ClosetInfo = ({}) => {
  const navigation = useNavigation<any>();
  const storedSettings = useSelector((state: RootState) => state.settings);
  const storedItems = useSelector((state: RootState) => state.itemsList.items);
  const storedEvents = useSelector((state: RootState) => state.itemsList.logs);
  const wardrobes = useSelector(
    (state: RootState) => state.itemsList.wardrobes ?? [],
  );
  const storedCollections = useSelector(
    (state: RootState) => state.itemsList.collectionTags,
  );
  const language = storedSettings.language;
  const storedCategories = visibleCategories(
    useSelector((state: RootState) => state.CategoryList),
    language,
  );
  const { selected } = useWardrobeView();
  const wardrobe =
    selected === "" || wardrobes.some(w => w.id === selected)
      ? selected
      : undefined;
  const scopeLabel =
    wardrobe === undefined
      ? localization.AllWardrobes[language]
      : `${localization.Wardrobe[language]}: ${
          wardrobe === ""
            ? localization.Unassigned[language]
            : wardrobes.find(w => w.id === wardrobe)?.name ?? ""
        }`;
  const garments = useMemo(
    () => filterByWardrobe(storedItems, wardrobe),
    [storedItems, wardrobe],
  );
  const data = useMemo(() => {
    const logIds = new Set(garments.flatMap(g => g.logIds ?? []));
    const outfits =
      wardrobe === undefined
        ? storedEvents.length
        : storedEvents.filter(event => logIds.has(event.eventId)).length;
    const collections =
      wardrobe === undefined
        ? storedCollections.length
        : storedCollections.filter(tag =>
            garments.some(g => g.collection?.includes(tag.value)),
          ).length;
    return {
      counts: [garments.length, outfits, collections],
      recent: topUsed(garments, storedEvents, {
        since: daysAgo(RECENT_DAYS),
      }),
      overall: topUsed(garments, storedEvents),
    };
  }, [garments, storedEvents, storedCollections, wardrobe]);
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
        <ThemeText
          customStyle={[captionText, { marginTop: theme.spacing.sm }]}
        >
          {scopeLabel}
        </ThemeText>
        {data.counts.map((value, index) => (
          <ListRow key={index} title={titles[index]} right={count(value)} />
        ))}
        <View style={{ marginTop: theme.spacing.md }}>
          <SectionHeading title={localization.Categories[language]} />
          {storedCategories.map(category => (
            <ListRow
              key={category.index}
              title={category.label}
              right={count(
                garments.filter(it => it.category === category.index).length,
              )}
            />
          ))}
        </View>
        {[data.recent, data.overall].map((top, index) =>
          top.length > 0 ? (
            <View key={index} style={{ marginTop: theme.spacing.md }}>
              <SectionHeading title={titles[3 + index]} />
              <GarmentGrid
                garments={top}
                renderGarment={garment => (
                  <ItemBox
                    {...garmentSummary(garment)}
                    onPress={() =>
                      navigation.navigate("ItemForm", {
                        editingIndex: garment.id,
                      })
                    }
                  />
                )}
              />
            </View>
          ) : null,
        )}
      </ScrollView>
    </ThemeView>
  );
};
