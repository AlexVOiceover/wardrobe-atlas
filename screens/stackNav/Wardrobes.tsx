import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Button } from "react-native-paper";
import Icon from "react-native-vector-icons/Ionicons";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../../redux/store";
import {
  addWardrobe,
  renameWardrobe,
  deleteWardrobe,
  type Wardrobe,
} from "../../redux/itemsSlice";
import { wardrobeNameError } from "../../utils/wardrobes";
import { countText, localization as l } from "../../utils/localization";
import { theme } from "../../utils/theme";
import { PageHeader } from "../../components/PageHeader";
import { ThemeView } from "../../components/ThemeView";
import { ListRow } from "../../components/ListRow";
import { ConfirmationDialog } from "../../components/ConfirmationDialog";
import { TextNameSheet } from "../../components/TextNameSheet";
/**
 * Every wardrobe with its garment count. Adding and renaming use a name sheet,
 * like collections; its Cancel, a tap outside or Back just close it.
 */
export function Wardrobes() {
  const { wardrobes, items } = useSelector((s: RootState) => s.itemsList);
  const { language } = useSelector((s: RootState) => s.settings);
  const dispatch = useDispatch();
  // The wardrobe being renamed, "" while adding one, null when closed.
  const [editing, setEditing] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Wardrobe>();
  const renaming = wardrobes.find(w => w.id === editing);
  return (
    <ThemeView>
      <ConfirmationDialog
        visible={!!deleting}
        setVisible={shown => !shown && setDeleting(undefined)}
        title={`${l.Delete[language]}: ${deleting?.name ?? ""}`}
        message={l.DeleteWardrobeMessage[language]}
        onConfirm={() => {
          if (!deleting) return;
          dispatch(deleteWardrobe({ id: deleting.id }));
          if (editing === deleting.id) setEditing(null);
        }}
      />
      <TextNameSheet
        isOpen={editing !== null}
        setIsOpen={open => {
          if (!(typeof open === "function" ? open(true) : open))
            setEditing(null);
        }}
        title={renaming ? l.Rename[language] : l.AddWardrobe[language]}
        label={l.Name[language]}
        language={language}
        initial={renaming?.name ?? ""}
        validate={name => {
          const invalid = wardrobeNameError(wardrobes, name, editing || undefined);
          return invalid ? l[invalid][language] : undefined;
        }}
        onSave={name => {
          // A wardrobe deleted meanwhile isn't brought back.
          if (editing && !renaming) return;
          dispatch(
            renaming
              ? renameWardrobe({ id: renaming.id, name })
              : addWardrobe({ name }),
          );
        }}
      />
      <PageHeader title={l.Wardrobes[language]} />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
      >
        {wardrobes.map(w => (
          <ListRow
            key={w.id}
            title={w.name}
            subtitle={countText(
              l.GarmentCount,
              l.GarmentsCount,
              items.filter(item => item.wardrobeId === w.id).length,
              language,
            )}
            right={
              <View style={styles.actions}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${l.Rename[language]}: ${w.name}`}
                  style={styles.action}
                  onPress={() => setEditing(w.id)}
                >
                  <Icon
                    name="create-outline"
                    size={22}
                    color={theme.colors.text}
                  />
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${l.Delete[language]}: ${w.name}`}
                  style={styles.action}
                  onPress={() => setDeleting(w)}
                >
                  <Icon
                    name="trash-outline"
                    size={22}
                    color={theme.colors.danger}
                  />
                </Pressable>
              </View>
            }
          />
        ))}
        <Button mode="outlined" onPress={() => setEditing("")}>
          {l.AddWardrobe[language]}
        </Button>
      </ScrollView>
    </ThemeView>
  );
}
const styles = StyleSheet.create({
  content: {
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  actions: {
    flexDirection: "row",
  },
  action: {
    width: theme.touch,
    height: theme.touch,
    justifyContent: "center",
    alignItems: "center",
  },
});
