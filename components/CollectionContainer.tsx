import { ReactNode, useState } from "react";
import { Pressable, View } from "react-native";
import { ThemeText } from "./ThemeText";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../redux/store";
import { toggleCollection } from "../redux/itemsSlice";
export const CollectionContainer = ({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
  color?: string;
}) => {
  const collection = useSelector((state: RootState) =>
    state.itemsList.collectionTags.find(value => value.label === label),
  );
  const [open, setOpen] = useState(collection?.isOpen ?? true);
  const dispatch = useDispatch();
  return (
    <View style={{ width: "100%", borderWidth: 1 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={() => {
          setOpen(current => !current);
          dispatch(toggleCollection({ name: label }));
        }}
        style={{ minHeight: 44, padding: 8 }}
      >
        <ThemeText>
          {open ? "− " : "+ "}
          {label}
        </ThemeText>
      </Pressable>
      {open && children}
    </View>
  );
};
