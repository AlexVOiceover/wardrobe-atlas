import { useEffect, useState } from "react";
import {
  NavigationAction,
  useNavigation,
  usePreventRemove,
} from "@react-navigation/native";
import { ConfirmationDialog } from "../components/ConfirmationDialog";
import { localization } from "../utils/localization";

/** "Discard changes?": Keep editing, or Discard (red). */
export const DiscardDialog = ({
  visible,
  language,
  onKeep,
  onDiscard,
}: {
  visible: boolean;
  language: number;
  onKeep: () => void;
  onDiscard: () => void;
}) => (
  <ConfirmationDialog
    visible={visible}
    setVisible={shown => !shown && onKeep()}
    title={localization.DiscardChanges[language]}
    cancelLabel={localization.KeepEditing[language]}
    confirmLabel={localization.Discard[language]}
    onConfirm={onDiscard}
  />
);

/**
 * Asks "Discard changes?" when a changed form's screen is about to close
 * (Back, the header arrow). Saving and deleting go through `leave`, which
 * stops asking first, so they never prompt.
 */
export function useDiscardGuard(changed: boolean, language: number) {
  const navigation = useNavigation();
  // The navigation that was stopped, while the question shows.
  const [stopped, setStopped] = useState<NavigationAction>();
  // Set once leaving is allowed; runs after the guard is off.
  const [leaving, setLeaving] = useState<() => void>();
  usePreventRemove(changed && !leaving, ({ data }) => setStopped(data.action));
  useEffect(() => {
    leaving?.();
  }, [leaving]);
  const leave = (go: () => void) => setLeaving(() => go);
  const dialog = (
    <DiscardDialog
      visible={!!stopped}
      language={language}
      onKeep={() => setStopped(undefined)}
      onDiscard={() => {
        const action = stopped;
        setStopped(undefined);
        if (action) leave(() => navigation.dispatch(action));
      }}
    />
  );
  return { leave, dialog };
}
