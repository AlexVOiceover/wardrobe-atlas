import { Dispatch, ReactNode, SetStateAction } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Button } from "react-native-paper";
import { localization } from "../utils/localization";
import { RootState } from "../redux/store";
import { useSelector } from "react-redux";
import { theme } from "../utils/theme";
import { SectionHeading } from "./SectionHeading";
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
      <View style={styles.overlay}>
        <Pressable
          accessibilityLabel={localization.Close[language]}
          onPress={close}
          style={styles.backdrop}
        />
        <View style={styles.sheet}>
          <SectionHeading
            title={title}
            right={
              <Button onPress={close}>{localization.Close[language]}</Button>
            }
          />
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.content}
          >
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: theme.colors.scrim,
  },
  backdrop: {
    flex: 1,
  },
  sheet: {
    maxHeight: "85%",
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: theme.radius.sm,
    borderTopRightRadius: theme.radius.sm,
  },
  content: {
    paddingBottom: theme.spacing.lg,
  },
});
