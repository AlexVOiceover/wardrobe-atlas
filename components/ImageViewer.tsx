import { localization } from "../utils/localization";
import { useSelector } from "react-redux";
import type { RootState } from "../redux/store";
import { Dispatch, SetStateAction, useState } from "react";
import { Image, Pressable, Text } from "react-native";
import CustomModal from "./CustomModal";
import useWidthScreen from "../hooks/useWidthScreen";
export const ImageViewer = ({
  imageUrl,
  setImageModalVisible,
}: {
  imageUrl: string;
  setImageModalVisible: Dispatch<SetStateAction<boolean>>;
}) => {
  const [showImageFull, setShowImageFull] = useState(false);
  const language = useSelector((s: RootState) => s.settings.language);
  const width = useWidthScreen();
  return (
    <>
      <CustomModal
        setVisible={setShowImageFull}
        visible={showImageFull}
        maxHeight={width}
      >
        <Image
          accessibilityLabel="Photo"
          source={{ uri: `data:image/*;base64,${imageUrl}` }}
          style={{ width: "100%", height: width * 0.7, resizeMode: "contain" }}
        />
      </CustomModal>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Choose photo; hold to preview"
        onLongPress={() => imageUrl !== "" && setShowImageFull(true)}
        onPress={() => setImageModalVisible(true)}
        style={{
          minHeight: 80,
          minWidth: 80,
          borderWidth: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {imageUrl !== "" ? (
          <Image
            source={{ uri: `data:image/*;base64,${imageUrl}` }}
            style={{ width: 80, height: 80, resizeMode: "contain" }}
          />
        ) : (
          <Text style={{ color: "#111111" }}>
            {localization.AddPhoto[language]}
          </Text>
        )}
      </Pressable>
    </>
  );
};
