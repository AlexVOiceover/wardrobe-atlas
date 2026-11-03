import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { CustomInput } from "./CustomInput";
import { ThemeText } from "./ThemeText";
import { FormErrors } from "./FormErrors";
import { localization } from "../utils/localization";
import { theme } from "../utils/theme";

/** A category or type row with rename (inline) and delete actions. */
export const EditableNameRow = ({
  label,
  language,
  onPress,
  validate,
  onRename,
  onDelete,
}: {
  label: string;
  language: number;
  onPress?: () => void;
  validate: (name: string) => string | undefined;
  onRename: (name: string) => void;
  onDelete: () => void;
}) => {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(label);
  const [error, setError] = useState<string>();
  const save = () => {
    const trimmed = name.trim();
    if (trimmed === label) {
      setEditing(false);
      return;
    }
    const problem = validate(trimmed);
    if (problem) {
      setError(problem);
      return;
    }
    onRename(trimmed);
    setError(undefined);
    setEditing(false);
  };
  const action = (
    icon: string,
    accessibilityLabel: string,
    onAction: () => void,
    color = theme.colors.text,
  ) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onAction}
      style={styles.action}
    >
      <Icon name={icon} size={22} color={color} />
    </Pressable>
  );
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {editing ? (
          <View style={styles.input}>
            <CustomInput
              mode="outlined"
              dense
              autoFocus
              accessibilityLabel={`${localization.Rename[language]}: ${label}`}
              value={name}
              onChangeText={setName}
              onSubmitEditing={save}
            />
          </View>
        ) : (
          <Pressable
            accessibilityRole={onPress ? "button" : undefined}
            accessibilityLabel={label}
            disabled={!onPress}
            onPress={onPress}
            style={styles.label}
          >
            <ThemeText numberOfLines={2} customStyle={styles.labelText}>
              {label}
            </ThemeText>
            {onPress && (
              <Icon
                name="chevron-forward"
                size={18}
                color={theme.colors.muted}
              />
            )}
          </Pressable>
        )}
        {editing ? (
          <>
            {action("checkmark", localization.Save[language], save)}
            {action("close", localization.Cancel[language], () => {
              setName(label);
              setError(undefined);
              setEditing(false);
            })}
          </>
        ) : (
          <>
            {action(
              "create-outline",
              `${localization.Rename[language]}: ${label}`,
              () => {
                setName(label);
                setEditing(true);
              },
            )}
            {action(
              "trash-outline",
              `${localization.Delete[language]}: ${label}`,
              onDelete,
              theme.colors.danger,
            )}
          </>
        )}
      </View>
      {error && <FormErrors errors={[error]} />}
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
    paddingVertical: theme.spacing.xs,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 56,
  },
  label: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    minHeight: theme.touch,
  },
  labelText: {
    flex: 1,
  },
  input: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  action: {
    width: theme.touch,
    minHeight: theme.touch,
    justifyContent: "center",
    alignItems: "center",
  },
});
