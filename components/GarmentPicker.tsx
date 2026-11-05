import { Dispatch, ReactNode, SetStateAction, useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useSelector } from "react-redux";
import type { RootState } from "../redux/store";
import { normalizeGridColumns } from "../redux/settingsSlice";
import { closetSections } from "../utils/categories";
import { filterItemsBySearch } from "../utils/filters";
import { filterByWardrobe } from "../utils/wardrobes";
import { localization } from "../utils/localization";
import { theme } from "../utils/theme";
import { ThemeView } from "./ThemeView";
import { PageHeader } from "./PageHeader";
import { SearchField } from "./SearchField";
import { FilterChip } from "./FilterChip";
import { EmptyState } from "./EmptyState";
import { ClosetSections } from "./ClosetSections";
import { ItemBox, garmentSummary } from "./ItemBox";
import { cardDensity } from "./GarmentGrid";
import { useWardrobeView } from "./WardrobeSelector";

/**
 * Ticks garments laid out as in the Closet: the wardrobe shown there, by
 * category and type, each garment once. Stored garments stay hidden unless
 * asked for; ticked ones always show. Folding headings is only for this
 * screen and saves nothing.
 */
export function GarmentPicker({
  title,
  picked,
  setPicked,
  onBack,
  footer,
}: {
  title: string;
  picked: string[];
  setPicked: Dispatch<SetStateAction<string[]>>;
  onBack?: () => void;
  footer: ReactNode;
}) {
  const { items, wardrobes } = useSelector((s: RootState) => s.itemsList);
  const settings = useSelector((s: RootState) => s.settings);
  const categoryState = useSelector((s: RootState) => s.CategoryList);
  const language = settings.language;
  const { selected } = useWardrobeView();
  const wardrobe = wardrobes?.some(w => w.id === selected)
    ? selected
    : undefined;
  const [search, setSearch] = useState("");
  const [showStored, setShowStored] = useState(false);
  const [collapsed, setCollapsed] = useState<string[]>([]);
  const columns = normalizeGridColumns(settings.gridColumns);
  const density = cardDensity(columns);
  const inView = useMemo(
    () =>
      items.filter(
        garment =>
          picked.includes(garment.id) ||
          filterByWardrobe([garment], wardrobe).length > 0,
      ),
    [items, picked, wardrobe],
  );
  const hiddenStored = inView.filter(
    garment => garment.stored === true && !picked.includes(garment.id),
  ).length;
  const sections = useMemo(() => {
    const shown = inView.filter(
      garment =>
        showStored || garment.stored !== true || picked.includes(garment.id),
    );
    return closetSections(
      filterItemsBySearch(shown, search),
      categoryState,
      language,
    );
  }, [inView, showStored, picked, search, categoryState, language]);
  const toggle = (id: string) =>
    setPicked(current =>
      current.includes(id)
        ? current.filter(other => other !== id)
        : [...current, id],
    );
  return (
    <ThemeView>
      <PageHeader title={title} onBack={onBack} />
      <SearchField
        value={search}
        placeholder={localization.SearchPlaceholder[language]}
        onChangeText={setSearch}
      />
      {(hiddenStored > 0 || showStored) && (
        <View style={styles.chips}>
          <FilterChip
            label={localization.ShowStored[language].replace(
              "{n}",
              String(hiddenStored),
            )}
            selected={showStored}
            onPress={() => setShowStored(current => !current)}
          />
        </View>
      )}
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {sections.length === 0 && (
          <EmptyState
            message={
              search || items.length > 0
                ? localization.NoWardrobeItems[language]
                : localization.NoGarmentsYet[language]
            }
          />
        )}
        <ClosetSections
          sections={sections}
          collapsed={collapsed}
          onToggle={key =>
            setCollapsed(current =>
              current.includes(key)
                ? current.filter(other => other !== key)
                : [...current, key],
            )
          }
          columns={columns}
          renderGarment={garment => (
            <ItemBox
              {...garmentSummary(garment)}
              type=""
              density={density}
              selected={picked.includes(garment.id)}
              onPress={() => toggle(garment.id)}
              onLongPress={() => toggle(garment.id)}
            />
          )}
        />
      </ScrollView>
      <View style={styles.footer}>{footer}</View>
    </ThemeView>
  );
}
const styles = StyleSheet.create({
  chips: {
    flexDirection: "row",
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.md,
  },
  footer: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border,
  },
});
