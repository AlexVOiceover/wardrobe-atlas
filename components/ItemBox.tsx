import { Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
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
/** A garment card; without handlers a tap opens the garment form. */
export const ItemBox = ({
  onPress,
  onLongPress,
  ...props
}: ItemSummaryProps & {
  onPress?: () => void;
  onLongPress?: () => void;
}) => {
  const navigation = useNavigation<any>();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={props.name}
      accessibilityState={
        props.selected === undefined ? undefined : { selected: props.selected }
      }
      onPress={
        onPress ??
        (() => navigation.navigate("ItemForm", { editingIndex: props.id }))
      }
      onLongPress={onLongPress}
    >
      <ItemSummary {...props} />
    </Pressable>
  );
};
