import React, { createContext, useContext, useState } from "react";
import { View } from "react-native";
import { RadioButton, Button } from "react-native-paper";
import { useSelector } from "react-redux";
import type { RootState } from "../redux/store";
import { localization as l } from "../utils/localization";
import { captionText, theme } from "../utils/theme";
import { BottomSheet } from "./BottomSheet";
import { ThemeText } from "./ThemeText";
const WardrobeContext = createContext<{
  selected?: string;
  select: (id?: string) => void;
}>({ select: () => {} });
export function WardrobeProvider({ children }: { children: React.ReactNode }) {
  const [selected, select] = useState<string>();
  return (
    <WardrobeContext.Provider value={{ selected, select }}>
      {children}
    </WardrobeContext.Provider>
  );
}
export const useWardrobeView = () => useContext(WardrobeContext);
export function WardrobeSelector({
  value,
  onChange,
  all = false,
  compact = false,
}: {
  value?: string;
  onChange: (id?: string) => void;
  all?: boolean;
  compact?: boolean;
}) {
  const { wardrobes = [] } = useSelector((s: RootState) => s.itemsList);
  const { language } = useSelector((s: RootState) => s.settings);
  const [expanded, setExpanded] = useState(false);
  const options = [
    ...(all ? [{ value: "all", label: l.AllWardrobes[language] }] : []),
    { value: "", label: l.Unassigned[language] },
    ...wardrobes.map(w => ({ value: "wardrobe:" + w.id, label: w.name })),
  ];
  const selection =
    value === undefined ? (all ? "all" : "") : value ? "wardrobe:" + value : "";
  return (
    <View
      style={
        compact
          ? { flex: 1, alignItems: "flex-start" }
          : { gap: theme.spacing.xs }
      }
    >
      {!compact && (
        <ThemeText customStyle={captionText}>{l.Wardrobe[language]}</ThemeText>
      )}
      <Button
        mode={compact ? "text" : "outlined"}
        textColor={compact ? theme.colors.onBar : undefined}
        icon="chevron-down"
        contentStyle={{ flexDirection: "row-reverse" }}
        onPress={() => setExpanded(!expanded)}
      >
        {options.find(o => o.value === selection)?.label ??
          l.WardrobeUnavailable[language]}
      </Button>
      <BottomSheet
        isOpen={expanded}
        setIsOpen={setExpanded}
        title={l.Wardrobe[language]}
      >
        {expanded && (
          <RadioButton.Group
            value={selection}
            onValueChange={id => {
              onChange(
                id === "all"
                  ? undefined
                  : id.startsWith("wardrobe:")
                  ? id.slice(9)
                  : "",
              );
              setExpanded(false);
            }}
          >
            {options.map(o => (
              <RadioButton.Item key={o.value} label={o.label} value={o.value} />
            ))}
          </RadioButton.Group>
        )}
      </BottomSheet>
    </View>
  );
}
