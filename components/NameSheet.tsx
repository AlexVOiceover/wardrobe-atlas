import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button } from "react-native-paper";
import { languagesList } from "../utils/data";
import { localization } from "../utils/localization";
import { translateText } from "../utils/translate";
import { captionText, theme } from "../utils/theme";
import { BottomSheet } from "./BottomSheet";
import { CustomInput } from "./CustomInput";
import { FormErrors } from "./FormErrors";
import { ThemeText } from "./ThemeText";

const TRANSLATE_DELAY = 500;

/**
 * Asks for a name in English and Spanish. Typing in one fills the other with
 * an on-device translation (or a copy when translation isn't available),
 * unless the user has typed in that field too.
 */
export function NameSheet({
  isOpen,
  setIsOpen,
  title,
  language,
  initial = ["", ""],
  validate,
  onSave,
}: {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  title: string;
  language: number;
  initial?: string[];
  validate: (names: string[]) => string | undefined;
  onSave: (names: string[]) => void;
}) {
  const [names, setNames] = useState(initial);
  const [typed, setTyped] = useState([false, false]);
  const [status, setStatus] = useState<"" | "translating" | "failed">("");
  const [error, setError] = useState<string>();
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const request = useRef(0);
  const stopTimer = () => {
    if (timer.current !== undefined) clearTimeout(timer.current);
  };
  const initialKey = initial.join("\u0000");
  useEffect(() => {
    if (!isOpen) return;
    setNames(initialKey.split("\u0000"));
    setTyped([false, false]);
    setStatus("");
    setError(undefined);
  }, [isOpen, initialKey]);
  useEffect(() => stopTimer, []);
  const change = (index: number, text: string) => {
    const other = 1 - index;
    setNames(current => current.map((name, i) => (i === index ? text : name)));
    setTyped(current =>
      current.map((value, i) => (i === index ? true : value)),
    );
    setError(undefined);
    stopTimer();
    if (typed[other]) return;
    const id = ++request.current;
    if (!text.trim()) {
      setStatus("");
      return;
    }
    setStatus("translating");
    timer.current = setTimeout(async () => {
      const translated = await translateText(text, index, other);
      // A newer keystroke or the user typing in the other field wins.
      if (id !== request.current) return;
      setNames(current =>
        current.map((name, i) =>
          i === other ? translated ?? text.trim() : name,
        ),
      );
      setStatus(translated ? "" : "failed");
    }, TRANSLATE_DELAY);
  };
  const save = () => {
    // Saving before a translation arrives copies the other name.
    const trimmed = names.map((name, i) => name.trim() || names[1 - i].trim());
    const problem = validate(trimmed);
    if (problem) {
      setError(problem);
      return;
    }
    stopTimer();
    request.current++;
    onSave(trimmed);
    setIsOpen(false);
  };
  // The app's language comes first.
  const order = [language, 1 - language];
  return (
    <BottomSheet isOpen={isOpen} setIsOpen={setIsOpen} title={title}>
      <View style={styles.content}>
        {order.map((index, position) => (
          <CustomInput
            key={index}
            mode="outlined"
            dense
            autoFocus={position === 0}
            label={languagesList[index].label}
            accessibilityLabel={languagesList[index].label}
            value={names[index]}
            onChangeText={text => change(index, text)}
          />
        ))}
        {status !== "" && (
          <ThemeText accessibilityLiveRegion="polite" customStyle={captionText}>
            {status === "translating"
              ? localization.Translating[language]
              : localization.TranslationUnavailable[language]}
          </ThemeText>
        )}
        {error && <FormErrors errors={[error]} />}
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
