import React, { useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";
import { Button, TextInput } from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../../redux/store";
import {
  addWardrobe,
  renameWardrobe,
  deleteWardrobe,
} from "../../redux/itemsSlice";
import { wardrobeNameError } from "../../utils/wardrobes";
import { localization as l } from "../../utils/localization";
import { BackButton } from "../../components/BackButton";
import { ThemeView } from "../../components/ThemeView";
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
      <BackButton pageTitle={l.Wardrobes[language]} />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 16, gap: 12 }}
      >
        {wardrobes.map(w => (
          <View key={w.id} style={{ borderWidth: 1, padding: 8 }}>
            <Text>{w.name}</Text>
            <Text>
              {items.filter(item => item.wardrobeId === w.id).length}{" "}
              {l.GarmentRecords[language]}
            </Text>
            <Button
              onPress={() => {
                setEditing(w.id);
                setName(w.name);
                setError("");
              }}
            >
              {l.Edit[language]}
            </Button>
            <Button
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
              {l.Delete[language]}
            </Button>
          </View>
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
          <View style={{ gap: 8 }}>
            <TextInput
              label={l.Name[language]}
              value={name}
              onChangeText={setName}
              autoFocus
            />
            {!!error && <Text accessibilityRole="alert">{error}</Text>}
            <Button onPress={save}>{l.Save[language]}</Button>
            <Button onPress={cancel}>{l.Cancel[language]}</Button>
          </View>
        )}
      </ScrollView>
    </ThemeView>
  );
}
