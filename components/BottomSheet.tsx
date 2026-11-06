import { Dispatch, ReactNode, SetStateAction } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { localization } from "../utils/localization";
import { RootState } from "../redux/store";
import { useSelector } from "react-redux";
import { theme } from "../utils/theme";
import { HeaderIcon } from "./PageHeader";
import { ThemeText } from "./ThemeText";
/**
 * A panel centred on the screen (the owner prefers it to one at the bottom),
 * closed by its ✕, a tap outside or Back. Long content scrolls; the panel
 * stays above the keyboard.
 */
export const BottomSheet = ({
  isOpen,
  setIsOpen,
  title,
  children,
}: {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  title: string;
  children: ReactNode;
}) => {
  const { language } = useSelector((s: RootState) => s.settings);
  const close = () => setIsOpen(false);
  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="none"
      onRequestClose={close}
    >
      {/*
        When Android resizes the modal for the keyboard this adds nothing;
        when it draws under the keyboard instead (Android 15+), it lifts the
        panel by the part the keyboard covers.
      */}
      <KeyboardAvoidingView behavior="padding" style={styles.overlay}>
        <Pressable
          accessibilityLabel={localization.Close[language]}
          onPress={close}
          style={StyleSheet.absoluteFill}
        />
        <View accessibilityViewIsModal style={styles.sheet}>
          <View style={styles.header}>
            <ThemeText
              accessibilityRole="header"
              numberOfLines={2}
              customStyle={styles.title}
            >
              {title}
            </ThemeText>
            <HeaderIcon
              name="close"
              color={theme.colors.text}
              label={localization.Close[language]}
              onPress={close}
            />
          </View>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.content}
          >
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    padding: theme.spacing.md,
    backgroundColor: theme.colors.scrim,
  },
  sheet: {
    width: "100%",
    maxHeight: "85%",
    paddingLeft: theme.spacing.md,
    paddingRight: theme.spacing.xs,
    paddingVertical: theme.spacing.xs,
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.sm,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: theme.touch,
  },
  title: {
    flex: 1,
    fontWeight: "600",
    fontSize: theme.type.body,
  },
  content: {
    paddingRight: theme.spacing.sm + theme.spacing.xs,
    paddingBottom: theme.spacing.md,
  },
});
