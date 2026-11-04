import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import { useSelector } from "react-redux";
import type { RootState } from "../redux/store";
import { localization } from "../utils/localization";
import { theme } from "../utils/theme";
import type { item } from "../redux/itemsSlice";
import { ItemSummary } from "./ItemSummary";
import type { CardDensity } from "./GarmentGrid";
export type ItemSummaryProps = {
  image: string;
  name: string;
  primary: string;
  secondary: string;
  tertiary: string;
  type: string;
  id: string;
  logs?: string[];
  density?: CardDensity;
  stored?: boolean;
  // Undefined outside select mode.
  selected?: boolean;
};
export const garmentSummary = (garment: item): ItemSummaryProps => ({
  id: garment.id,
  image: garment.image,
  name: garment.name,
  type: garment.type,
  primary: garment.primaryColor || "",
  secondary: garment.secondaryColor || "",
  tertiary: garment.tertiaryColor || "",
  logs: garment.logIds || [],
  stored: garment.stored === true,
});
// Two taps closer together than this count as a double tap.
export const DOUBLE_TAP_MS = 300;

/**
 * A garment card; without handlers a tap opens the garment form. With
 * onDoubleTap, a single tap waits briefly in case a second one follows, and a
 * double tap flashes a check mark on the card.
 */
export const ItemBox = ({
  onPress,
  onLongPress,
  onDoubleTap,
  ...props
}: ItemSummaryProps & {
  onPress?: () => void;
  onLongPress?: () => void;
  onDoubleTap?: () => void;
}) => {
  const navigation = useNavigation<any>();
  const language = useSelector((s: RootState) => s.settings.language);
  const pendingTap = useRef<ReturnType<typeof setTimeout>>(undefined);
  const flashTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [flash, setFlash] = useState(false);
  const stopTimer = (timer: typeof pendingTap) => {
    if (timer.current !== undefined) clearTimeout(timer.current);
    timer.current = undefined;
  };
  useEffect(
    () => () => {
      stopTimer(pendingTap);
      stopTimer(flashTimer);
    },
    [],
  );
  const tap =
    onPress ??
    (() => navigation.navigate("ItemForm", { editingIndex: props.id }));
  const doubleTap = () => {
    onDoubleTap?.();
    setFlash(true);
    stopTimer(flashTimer);
    flashTimer.current = setTimeout(() => setFlash(false), 900);
  };
  const press = () => {
    if (!onDoubleTap) return tap();
    if (pendingTap.current) {
      stopTimer(pendingTap);
      doubleTap();
      return;
    }
    pendingTap.current = setTimeout(() => {
      pendingTap.current = undefined;
      tap();
    }, DOUBLE_TAP_MS);
  };
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={props.name}
      accessibilityState={
        props.selected === undefined ? undefined : { selected: props.selected }
      }
      // Screen readers use double tap to activate, so logging is an action.
      accessibilityActions={
        onDoubleTap
          ? [{ name: "logUse", label: localization.LogUse[language] }]
          : undefined
      }
      onAccessibilityAction={event =>
        event.nativeEvent.actionName === "logUse" && doubleTap()
      }
      onPress={press}
      onLongPress={onLongPress}
    >
      <ItemSummary {...props} />
      {flash && (
        <View pointerEvents="none" style={styles.flash}>
          <Icon name="checkmark-circle" size={48} color={theme.colors.bar} />
        </View>
      )}
    </Pressable>
  );
};
const styles = StyleSheet.create({
  flash: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.45)",
    borderRadius: theme.radius.sm,
  },
});
