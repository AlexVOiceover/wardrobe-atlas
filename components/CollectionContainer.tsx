import { ReactNode, useState } from "react";
import { Pressable, View } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../redux/store";
import { toggleCollection } from "../redux/itemsSlice";
import { theme } from "../utils/theme";
import { SectionHeading } from "./SectionHeading";
export const CollectionContainer = ({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) => {
  const collection = useSelector((state: RootState) =>
    state.itemsList.collectionTags.find(value => value.label === label),
  );
  const [open, setOpen] = useState(collection?.isOpen ?? true);
  const dispatch = useDispatch();
  return (
    <View style={{ marginBottom: theme.spacing.md }}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={() => {
          setOpen(current => !current);
          dispatch(toggleCollection({ name: label }));
        }}
      >
        <SectionHeading
          title={label}
          right={
            <Icon
              name={open ? "chevron-down" : "chevron-forward"}
              size={18}
              color={theme.colors.muted}
            />
          }
        />
      </Pressable>
      {open && children}
    </View>
  );
};
