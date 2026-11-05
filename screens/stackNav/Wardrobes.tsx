import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Button, TextInput } from "react-native-paper";
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
import { localization as l } from "../../utils/localization";
import { theme } from "../../utils/theme";
import { PageHeader } from "../../components/PageHeader";
import { ThemeView } from "../../components/ThemeView";
import { FormErrors } from "../../components/FormErrors";
import { ListRow } from "../../components/ListRow";
import { ConfirmationDialog } from "../../components/ConfirmationDialog";
import { useDiscardGuard } from "../../hooks/useDiscardGuard";
export function Wardrobes() {
  const { wardrobes, items } = useSelector((s: RootState) => s.itemsList);
  const { language } = useSelector((s: RootState) => s.settings);
  const dispatch = useDispatch();
  const [editing, setEditing] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState<Wardrobe>();
  // Leaving with a typed name that wasn't saved asks first.
  const { dialog } = useDiscardGuard(
    editing !== null &&
      name !== (wardrobes.find(w => w.id === editing)?.name ?? ""),
    language,
  );
  const cancel = () => {
    setEditing(null);
    setName("");
    setError("");
  };
  const save = () => {
    const invalid = wardrobeNameError(wardrobes, name, editing || undefined);
    if (invalid) {
      setError(l[invalid][language]);
      return;
    }
    if (editing && !wardrobes.some(w => w.id === editing)) {
      cancel();
      return;
    }
    dispatch(
      editing ? renameWardrobe({ id: editing, name }) : addWardrobe({ name }),
    );
    cancel();
  };
  return (
    <ThemeView>
      {dialog}
      <ConfirmationDialog
        visible={!!deleting}
        setVisible={shown => !shown && setDeleting(undefined)}
        title={`${l.Delete[language]}: ${deleting?.name ?? ""}`}
        message={l.DeleteWardrobeMessage[language]}
        onConfirm={() => {
          if (!deleting) return;
          dispatch(deleteWardrobe({ id: deleting.id }));
          if (editing === deleting.id) cancel();
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
            subtitle={`${
              items.filter(item => item.wardrobeId === w.id).length
            } ${l.GarmentRecords[language]}`}
            right={
              <View style={styles.actions}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${l.Edit[language]}: ${w.name}`}
                  style={styles.action}
                  onPress={() => {
                    setEditing(w.id);
                    setName(w.name);
                    setError("");
                  }}
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
        {editing === null ? (
          <Button
            mode="outlined"
            onPress={() => {
              setEditing("");
              setName("");
            }}
          >
            {l.AddWardrobe[language]}
          </Button>
        ) : (
          <View style={styles.form}>
            <TextInput
              mode="outlined"
              label={l.Name[language]}
              value={name}
              onChangeText={setName}
              autoFocus
            />
            <FormErrors errors={error ? [error] : []} />
            <Button mode="contained" onPress={save}>
              {l.Save[language]}
            </Button>
            <Button onPress={cancel}>{l.Cancel[language]}</Button>
          </View>
        )}
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
  form: {
    gap: theme.spacing.sm,
  },
});
