import { Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { ItemSummary } from "./ItemSummary";
export type ItemSummaryProps = {
  image: string;
  name: string;
  primary: string;
  secondary: string;
  tertiary: string;
  type: string;
  id: string;
  logs?: string[];
  addSpace?: boolean;
};
export const ItemBox = (props: ItemSummaryProps) => {
  const navigation = useNavigation<any>();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={props.name}
      onPress={() =>
        navigation.navigate("ItemForm", { editingIndex: props.id })
      }
      style={{ margin: 4, padding: 8, borderWidth: 1, width: "100%" }}
    >
      <ItemSummary {...props} />
    </Pressable>
  );
};
