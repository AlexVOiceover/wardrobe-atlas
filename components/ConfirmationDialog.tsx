import React, { ReactNode } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { Button } from "react-native-paper";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { localization } from "../utils/localization";
import { theme } from "../utils/theme";
import { ThemeText } from "./ThemeText";
import CustomModal from "./CustomModal";
interface ConfirmationDialogProps {
  visible: boolean;
  setVisible: (visible: boolean) => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  /** Optional content rendered under the message (e.g. section checkboxes). */
  children?: ReactNode;
  /** Disable confirm (e.g. when no sections are selected). */
  confirmDisabled?: boolean;
  /** Names the action; "Delete" unless given. */
  confirmLabel?: string;
  cancelLabel?: string;
  /** Destructive actions get a red button. */
  destructive?: boolean;
}
/** A centred question: Cancel on the left, the named action on the right. */
export const ConfirmationDialog = ({
  visible,
  setVisible,
  onConfirm,
  title,
  message,
  children,
  confirmDisabled = false,
  confirmLabel,
  cancelLabel,
  destructive = true,
}: ConfirmationDialogProps) => {
  const language =
    useSelector((state: RootState) => state.settings.language) || 0;
  const handleConfirm = () => {
    if (confirmDisabled) return;
    onConfirm();
    setVisible(false);
  };
  return (
    <CustomModal
      visible={visible}
      setVisible={setVisible}
      label={title || localization.Delete[language]}
      minHeight={0}
      maxHeight={560}
      showClose={false}
    >
      <View>
        {(!!message || children != null) && (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {!!message && (
              <ThemeText customStyle={styles.message}>{message}</ThemeText>
            )}
            {children != null ? (
              <View style={styles.extraContent}>{children}</View>
            ) : null}
          </ScrollView>
        )}
        <View style={styles.buttonContainer}>
          <Button onPress={() => setVisible(false)}>
            {cancelLabel ?? localization.Cancel[language]}
          </Button>
          <Button
            mode="contained"
            onPress={handleConfirm}
            disabled={confirmDisabled}
            buttonColor={destructive ? theme.colors.danger : undefined}
            textColor={destructive ? theme.colors.background : undefined}
          >
            {confirmLabel ?? localization.Delete[language]}
          </Button>
        </View>
      </View>
    </CustomModal>
  );
};
const styles = StyleSheet.create({
  scroll: {
    width: "100%",
    maxHeight: 360,
  },
  scrollContent: {
    paddingBottom: 4,
  },
  message: {
    fontSize: 16,
    marginBottom: 16,
  },
  extraContent: {
    width: "100%",
    marginBottom: 12,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
    marginTop: 8,
  },
});
