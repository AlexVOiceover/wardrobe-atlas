import { useEffect, useMemo, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Button } from "react-native-paper";
import Icon from "react-native-vector-icons/Ionicons";
import { formatDate } from "../../utils/dates";
import { useNavigation } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../../redux/store";
import { logGarments } from "../../components/QuickLogSheet";
import { returnToOutfits } from "../../components/LogComponent";
import { ThemeView } from "../../components/ThemeView";
import { ThemeText } from "../../components/ThemeText";
import { PageHeader } from "../../components/PageHeader";
import { FilterChip } from "../../components/FilterChip";
import { SectionHeading } from "../../components/SectionHeading";
import { ListRow } from "../../components/ListRow";
import { useWardrobeView } from "../../components/WardrobeSelector";
import { filterByWardrobe } from "../../utils/wardrobes";
import { lastUseDates } from "../../utils/categories";
import {
  ACCESSORY,
  OUTFIT_PIECES,
  currentSeason,
  outfitCandidates,
} from "../../utils/outfits";
import { STYLES } from "../../utils/styles";
import { seasonList } from "../../utils/data";
import {
  localization,
  outfitPieces,
  styleNames,
} from "../../utils/localization";
import { captionText, theme } from "../../utils/theme";
import { photoUri } from "../../utils/photoStore";

/** Suggests a top, bottom, shoes and optionally an accessory to wear together. */
export function SuggestOutfit() {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch();
  const { language } = useSelector((s: RootState) => s.settings);
  const { items, logs, wardrobes } = useSelector((s: RootState) => s.itemsList);
  const { selected } = useWardrobeView();
  const wardrobe = wardrobes.some(w => w.id === selected)
    ? selected
    : undefined;
  const [style, setStyle] = useState("casual");
  const [season, setSeason] = useState(currentSeason);
  const [preferLeastWorn, setPreferLeastWorn] = useState(true);
  const [withAccessory, setWithAccessory] = useState(false);
  // How far each piece has been reshuffled through its candidates.
  const [positions, setPositions] = useState([0, 0, 0, 0]);
  useEffect(() => {
    setPositions([0, 0, 0, 0]);
  }, [style, season, preferLeastWorn, withAccessory]);
  const lastUsed = useMemo(() => lastUseDates(items, logs), [items, logs]);
  const pieces = withAccessory
    ? OUTFIT_PIECES
    : OUTFIT_PIECES.filter(piece => piece !== ACCESSORY);
  // Random orders change with the choices or the garments, not every render.
  const candidates = useMemo(
    () =>
      OUTFIT_PIECES.map(category =>
        outfitCandidates(filterByWardrobe(items, wardrobe), {
          category,
          style,
          season,
          lastUsed,
          preferLeastWorn,
        }),
      ),
    [items, lastUsed, style, season, preferLeastWorn, wardrobe],
  );
  const chosen = pieces.map(piece => {
    const options = candidates[piece];
    return {
      piece,
      count: options.length,
      garment: options.length
        ? options[positions[piece] % options.length]
        : undefined,
    };
  });
  const next = (piece: number) =>
    setPositions(current =>
      current.map((position, i) => (i === piece ? position + 1 : position)),
    );
  const styleLabel = styleNames[language][style];
  const seasonLabel =
    seasonList[language].find(option => option.value === season)?.label ??
    season;
  const wear = () => {
    const worn = chosen.flatMap(c => (c.garment ? [c.garment] : []));
    if (worn.length === 0) return;
    const logged = logGarments(
      dispatch,
      worn,
      language,
      undefined,
      localization.StyledOutfit[language].replace(
        "{style}",
        language === 1 ? styleLabel.toLowerCase() : styleLabel,
      ),
    );
    returnToOutfits(navigation, { kind: "logged", ...logged });
  };
  return (
    <ThemeView>
      <PageHeader title={localization.SuggestOutfit[language]} />
      <ScrollView contentContainerStyle={styles.content}>
        <SectionHeading title={localization.Style[language]} />
        <View style={styles.chips}>
          {STYLES.map(value => (
            <FilterChip
              key={value}
              label={styleNames[language][value]}
              selected={style === value}
              onPress={() => setStyle(value)}
            />
          ))}
        </View>
        <SectionHeading title={localization.Season[language]} />
        <View style={styles.chips}>
          {seasonList[language].map(option => (
            <FilterChip
              key={option.value}
              label={option.label}
              selected={season === option.value}
              onPress={() => setSeason(option.value)}
            />
          ))}
        </View>
        <ListRow
          title={localization.PreferLeastWorn[language]}
          switchValue={preferLeastWorn}
          onSwitch={setPreferLeastWorn}
        />
        <ListRow
          title={localization.IncludeAccessory[language]}
          switchValue={withAccessory}
          onSwitch={setWithAccessory}
        />
        <View style={styles.pieces}>
          {chosen.map(({ piece, count, garment }) => {
            const names = outfitPieces[language][piece];
            return (
              <View key={piece} style={styles.piece}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={garment?.name ?? names.one}
                  disabled={!garment}
                  onPress={() =>
                    garment &&
                    navigation.navigate("ItemForm", {
                      editingIndex: garment.id,
                    })
                  }
                >
                  {garment?.image ? (
                    <Image
                      source={{ uri: photoUri(garment.image) }}
                      style={styles.photo}
                    />
                  ) : (
                    <View style={[styles.photo, styles.placeholder]}>
                      <Icon
                        name="shirt-outline"
                        size={28}
                        color={theme.colors.muted}
                      />
                    </View>
                  )}
                </Pressable>
                <View style={styles.text}>
                  <ThemeText customStyle={captionText}>{names.one}</ThemeText>
                  {garment ? (
                    <>
                      <ThemeText numberOfLines={2}>{garment.name}</ThemeText>
                      <ThemeText customStyle={captionText}>
                        {lastUsed[garment.id]
                          ? localization.LastUsedOn[language].replace(
                              "{date}",
                              formatDate(lastUsed[garment.id], language),
                            )
                          : localization.NeverWorn[language]}
                      </ThemeText>
                    </>
                  ) : (
                    <ThemeText customStyle={captionText}>
                      {localization.NoCandidates[language]
                        .replace("{pieces}", names.many)
                        .replace(
                          "{style}",
                          language === 1
                            ? styleLabel.toLowerCase()
                            : styleLabel,
                        )
                        .replace("{season}", seasonLabel)}
                    </ThemeText>
                  )}
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={localization.AnotherOption[
                    language
                  ].replace("{piece}", names.one)}
                  accessibilityState={{ disabled: count < 2 }}
                  disabled={count < 2}
                  onPress={() => next(piece)}
                  style={[styles.shuffle, count < 2 && styles.disabled]}
                >
                  <Icon name="refresh" size={22} color={theme.colors.text} />
                </Pressable>
              </View>
            );
          })}
        </View>
        <View style={styles.actions}>
          <Button
            mode="outlined"
            style={styles.action}
            onPress={() => pieces.forEach(next)}
          >
            {localization.ShuffleAll[language]}
          </Button>
          <Button
            mode="contained"
            style={styles.action}
            disabled={!chosen.some(c => c.garment)}
            onPress={wear}
          >
            {localization.WearThis[language]}
          </Button>
        </View>
      </ScrollView>
    </ThemeView>
  );
}
const styles = StyleSheet.create({
  content: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  pieces: {
    marginTop: theme.spacing.md,
    gap: theme.spacing.md,
  },
  piece: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  photo: {
    width: 88,
    height: 88,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.surface,
  },
  placeholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    flex: 1,
    gap: 2,
  },
  shuffle: {
    width: theme.touch,
    minHeight: theme.touch,
    justifyContent: "center",
    alignItems: "center",
  },
  disabled: {
    opacity: 0.3,
  },
  actions: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    marginTop: theme.spacing.lg,
  },
  action: {
    flex: 1,
  },
});
