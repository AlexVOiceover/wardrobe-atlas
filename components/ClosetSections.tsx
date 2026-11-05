import { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import type { item } from "../redux/itemsSlice";
import type { ClosetSection } from "../utils/categories";
import { captionText, theme } from "../utils/theme";
import { GarmentGrid } from "./GarmentGrid";
import { ThemeText } from "./ThemeText";

const Heading = ({
  label,
  count,
  open,
  onToggle,
  small = false,
}: {
  label: string;
  count: number;
  open: boolean;
  onToggle: () => void;
  small?: boolean;
}) => (
  <Pressable
    accessibilityRole="button"
    accessibilityLabel={`${label}, ${count}`}
    accessibilityState={{ expanded: open }}
    onPress={onToggle}
    hitSlop={small ? 4 : 0}
    style={[styles.heading, small && styles.typeHeading]}
  >
    <Icon
      name={open ? "chevron-down" : "chevron-forward"}
      size={small ? 16 : 18}
      color={theme.colors.muted}
    />
    <ThemeText
      numberOfLines={1}
      customStyle={[styles.label, small ? captionText : styles.categoryLabel]}
    >
      {label}
    </ThemeText>
    <ThemeText customStyle={captionText}>{count}</ThemeText>
  </Pressable>
);

/** The garments ClosetSections shows: none from folded headings. */
export const visibleGarments = (
  sections: ClosetSection[],
  collapsed: string[],
): item[] =>
  sections
    .filter(section => !collapsed.includes(section.key))
    .flatMap(section => section.types)
    // Uncategorized garments have no type heading to fold.
    .filter(group => !group.label || !collapsed.includes(group.key))
    .flatMap(group => group.garments);

/** Closet garments grouped by category, then type, with foldable headings. */
export function ClosetSections({
  sections,
  collapsed,
  onToggle,
  columns,
  renderGarment,
}: {
  sections: ClosetSection[];
  collapsed: string[];
  onToggle: (key: string) => void;
  columns: number;
  renderGarment: (garment: item) => ReactNode;
}) {
  return (
    <>
      {sections.map(section => {
        const open = !collapsed.includes(section.key);
        return (
          <View key={section.key} style={styles.section}>
            <Heading
              label={section.label}
              count={section.count}
              open={open}
              onToggle={() => onToggle(section.key)}
            />
            {open &&
              section.types.map(group => {
                const typeOpen = !collapsed.includes(group.key);
                return (
                  <View key={group.key} style={styles.type}>
                    {/* Uncategorized garments have no type headings. */}
                    {!!group.label && (
                      <Heading
                        small
                        label={group.label}
                        count={group.garments.length}
                        open={typeOpen}
                        onToggle={() => onToggle(group.key)}
                      />
                    )}
                    {(typeOpen || !group.label) && (
                      <GarmentGrid
                        garments={group.garments}
                        renderGarment={renderGarment}
                        columns={columns}
                      />
                    )}
                  </View>
                );
              })}
          </View>
        );
      })}
    </>
  );
}
const styles = StyleSheet.create({
  section: {
    marginBottom: theme.spacing.md,
  },
  heading: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    minHeight: theme.touch,
  },
  typeHeading: {
    minHeight: 36,
  },
  label: {
    flex: 1,
  },
  categoryLabel: {
    fontWeight: "600",
    fontSize: theme.type.title,
  },
  type: {
    marginBottom: theme.spacing.sm,
  },
});
