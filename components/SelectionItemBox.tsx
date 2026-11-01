import { Pressable, Text } from "react-native";
import { Dispatch, SetStateAction } from "react";
import { ItemSummary } from "./ItemSummary";
import type { ItemSummaryProps } from "./ItemBox";
export const SelectionItemBox = ({
  selectedIdCollector,
  setSelectedIdCollector,
  ...item
}: ItemSummaryProps & {
  selectedIdCollector: string[];
  setSelectedIdCollector: Dispatch<SetStateAction<string[]>>;
}) => {
  const selected = selectedIdCollector.includes(item.id);
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={item.name}
      accessibilityState={{ checked: selected }}
      onPress={() =>
        setSelectedIdCollector(current =>
          current.includes(item.id)
            ? current.filter(id => id !== item.id)
            : [...current, item.id],
        )
      }
      style={{
        margin: 4,
        padding: 8,
        borderWidth: selected ? 3 : 1,
        width: 144,
      }}
    >
      <Text style={{ color: "#111111" }}>{selected ? "[x]" : "[ ]"}</Text>
      <ItemSummary {...item} />
    </Pressable>
  );
};
