import { Dispatch, ReactNode, SetStateAction, useContext } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaInsetsContext } from "react-native-safe-area-context";
import { localization } from "../utils/localization";
import { RootState } from "../redux/store";
import { useSelector } from "react-redux";
import { theme } from "../utils/theme";
import { HeaderIcon } from "./PageHeader";
import { ThemeText } from "./ThemeText";
/**
 * A sheet anchored to the bottom of the screen, closed by its ✕, a tap
 * outside or Back. Long content scrolls; the sheet stays above the keyboard.
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
  // Without a provider (tests) there is no inset.
  const bottomInset = useContext(SafeAreaInsetsContext)?.bottom ?? 0;
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
        sheet by the part the keyboard covers.
      */}
      <KeyboardAvoidingView behavior="padding" style={styles.overlay}>
        <Pressable
          accessibilityLabel={localization.Close[language]}
          onPress={close}
          style={StyleSheet.absoluteFill}
        />
        <View
          accessibilityViewIsModal
          style={[
            styles.sheet,
            { paddingBottom: Math.max(bottomInset, theme.spacing.sm) },
          ]}
        >
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
    justifyContent: "flex-end",
    backgroundColor: theme.colors.scrim,
  },
  sheet: {
    width: "100%",
    maxHeight: "85%",
    paddingLeft: theme.spacing.md,
    paddingRight: theme.spacing.xs,
    paddingTop: theme.spacing.xs,
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
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
