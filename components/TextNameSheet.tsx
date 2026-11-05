import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button, TextInput } from "react-native-paper";
import { localization } from "../utils/localization";
import { theme } from "../utils/theme";
import { BottomSheet } from "./BottomSheet";
import { FormErrors } from "./FormErrors";

/**
 * Asks for one name (a collection, a wardrobe). Save checks it with
 * `validate`, which returns the message to show; Cancel just closes.
 */
export function TextNameSheet({
  isOpen,
  setIsOpen,
  title,
  label,
  language,
  initial = "",
  validate,
  onSave,
}: {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  title: string;
  label: string;
  language: number;
  initial?: string;
  validate: (name: string) => string | undefined;
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
    const problem = validate(name);
    if (problem) {
      setError(problem);
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
          label={label}
          accessibilityLabel={label}
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
