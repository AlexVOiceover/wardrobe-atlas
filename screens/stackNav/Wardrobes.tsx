import React, { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Button, TextInput } from "react-native-paper";
import Icon from "react-native-vector-icons/Ionicons";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../../redux/store";
import {
  addWardrobe,
  renameWardrobe,
  deleteWardrobe,
} from "../../redux/itemsSlice";
import { wardrobeNameError } from "../../utils/wardrobes";
import { localization as l } from "../../utils/localization";
import { theme } from "../../utils/theme";
import { PageHeader } from "../../components/PageHeader";
import { ThemeView } from "../../components/ThemeView";
import { FormErrors } from "../../components/FormErrors";
import { ListRow } from "../../components/ListRow";
export function Wardrobes() {
  const { wardrobes, items } = useSelector((s: RootState) => s.itemsList);
  const { language } = useSelector((s: RootState) => s.settings);
  const dispatch = useDispatch();
  const [editing, setEditing] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
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
                  onPress={() =>
                    Alert.alert(
                      l.Delete[language] + ": " + w.name,
                      l.DeleteWardrobeMessage[language],
                      [
                        { text: l.Cancel[language], style: "cancel" },
                        {
                          text: l.Delete[language],
                          style: "destructive",
                          onPress: () => {
                            dispatch(deleteWardrobe({ id: w.id }));
                            if (editing === w.id) cancel();
                          },
                        },
                      ],
                    )
                  }
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
