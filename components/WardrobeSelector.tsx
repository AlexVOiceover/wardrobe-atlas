import React, { createContext, useContext, useState } from "react";
import { Pressable, View } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { RadioButton, Button } from "react-native-paper";
import { useSelector } from "react-redux";
import type { RootState } from "../redux/store";
import { localization as l } from "../utils/localization";
import { theme } from "../utils/theme";
import { BottomSheet } from "./BottomSheet";
import { FieldBox } from "./FieldBox";
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
  const label =
    options.find(o => o.value === selection)?.label ??
    l.WardrobeUnavailable[language];
  return (
    <View style={compact ? { flex: 1, alignItems: "flex-start" } : undefined}>
      {compact ? (
        <Button
          mode="text"
          textColor={theme.colors.onBar}
          icon="chevron-down"
          contentStyle={{ flexDirection: "row-reverse" }}
          onPress={() => setExpanded(!expanded)}
        >
          {label}
        </Button>
      ) : (
        // In forms it looks like the other fields.
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${l.Wardrobe[language]}: ${label}`}
          onPress={() => setExpanded(!expanded)}
        >
          <FieldBox
            label={l.Wardrobe[language]}
            right={
              <Icon
                name="chevron-down"
                size={20}
                color={theme.colors.text}
                style={{ paddingHorizontal: theme.spacing.sm }}
              />
            }
          >
            <ThemeText numberOfLines={1}>{label}</ThemeText>
          </FieldBox>
        </Pressable>
      )}
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
