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
});
export const ItemBox = (props: ItemSummaryProps) => {
  const navigation = useNavigation<any>();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={props.name}
      onPress={() =>
        navigation.navigate("ItemForm", { editingIndex: props.id })
      }
    >
      <ItemSummary {...props} />
    </Pressable>
  );
};
