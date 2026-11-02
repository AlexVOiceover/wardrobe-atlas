import { ReactElement } from "react";
import { Button, Dialog, Portal } from "react-native-paper";
import { localization } from "../utils/localization";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
const CustomModal = ({
  setVisible,
  visible,
  label,
  minHeight = 200,
  maxHeight,
  showClose = true,
  children,
}: {
  setVisible: (visible: boolean) => void;
  visible: boolean;
  label?: string;
  minHeight?: number;
  maxHeight?: number;
  showClose?: boolean;
  children: ReactElement;
}) => {
  const storedSettings = useSelector((state: RootState) => state.settings);
  return (
    <Portal>
      <Dialog
        visible={visible}
        onDismiss={() => setVisible(false)}
        style={{
          minHeight: minHeight,
          maxHeight: maxHeight,
          backgroundColor: "#ffffff",
        }}
      >
        {label && (
          <Dialog.Title
            style={{
              color: "#111111",
              textAlign: "center",
              fontSize: 20,
              fontWeight: "bold",
              paddingHorizontal: 10,
              marginHorizontal: 0,
            }}
          >
            {label}
          </Dialog.Title>
        )}
        <Dialog.Content>{children}</Dialog.Content>
        {showClose && (
          <Dialog.Actions>
            <Button onPress={() => setVisible(false)}>
              {localization.Close[storedSettings.language]}
            </Button>
          </Dialog.Actions>
        )}
      </Dialog>
    </Portal>
  );
};
export default CustomModal;
