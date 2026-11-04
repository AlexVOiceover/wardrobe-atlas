import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button, TextInput } from "react-native-paper";
import type { CollectionTag } from "../redux/itemsSlice";
import { localization } from "../utils/localization";
import { theme } from "../utils/theme";
import { BottomSheet } from "./BottomSheet";
import { FormErrors } from "./FormErrors";

/** Why a collection name can't be used; renaming may keep its own name. */
export const collectionNameError = (
  collections: CollectionTag[],
  name: string,
  current?: string,
) => {
  const wanted = name.trim().toLowerCase();
  if (!wanted) return "CollectionNameRequired" as const;
  const taken = collections.some(
    collection =>
      collection.label !== current && collection.label.toLowerCase() === wanted,
  );
  return taken ? ("NameTaken" as const) : undefined;
};

/** Asks for a name for a new or renamed collection. */
export function CollectionNameSheet({
  isOpen,
  setIsOpen,
  title,
  language,
  collections,
  initial = "",
  onSave,
}: {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  title: string;
  language: number;
  collections: CollectionTag[];
  initial?: string;
  onSave: (name: string) => void;
}) {
  const [name, setName] = useState(initial);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!isOpen) return;
    setName(initial);
    setError("");
  }, [isOpen, initial]);
  const save = () => {
    const problem = collectionNameError(
      collections,
      name,
      initial || undefined,
    );
    if (problem) {
      setError(localization[problem][language]);
      return;
    }
    onSave(name.trim());
    setIsOpen(false);
  };
  return (
    <BottomSheet isOpen={isOpen} setIsOpen={setIsOpen} title={title}>
      <View style={styles.content}>
        <TextInput
          mode="outlined"
          dense
          autoFocus
          label={localization.Collection_name[language]}
          accessibilityLabel={localization.Collection_name[language]}
          value={name}
          onChangeText={text => {
            setName(text);
            setError("");
          }}
          onSubmitEditing={save}
        />
        <FormErrors errors={error ? [error] : []} />
        <View style={styles.actions}>
          <Button
            mode="outlined"
            style={styles.action}
            onPress={() => setIsOpen(false)}
          >
            {localization.Cancel[language]}
          </Button>
          <Button mode="contained" style={styles.action} onPress={save}>
            {localization.Save[language]}
          </Button>
        </View>
      </View>
    </BottomSheet>
  );
}
const styles = StyleSheet.create({
  content: {
    gap: theme.spacing.sm,
  },
  actions: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  action: {
    flex: 1,
  },
});
