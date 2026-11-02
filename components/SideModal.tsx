import { Dispatch, ReactElement, SetStateAction } from "react";
import { Modal, ScrollView, View } from "react-native";
import { Button } from "react-native-paper";
import { localization } from "../utils/localization";
import { RootState } from "../redux/store";
import { useSelector } from "react-redux";
export const SideModal = ({
  isOpen,
  setIsOpen,
  children,
}: {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  children: ReactElement;
}) => {
  const { language } = useSelector((s: RootState) => s.settings);
  return (
    <Modal
      visible={isOpen}
      animationType="none"
      onRequestClose={() => setIsOpen(false)}
    >
      <View style={{ flex: 1, backgroundColor: "#ffffff", padding: 16 }}>
        <Button onPress={() => setIsOpen(false)}>
          {localization.Close[language]}
        </Button>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 24 }}
        >
          {children}
        </ScrollView>
      </View>
    </Modal>
  );
};
