import { localization } from "../utils/localization";
import { useSelector } from "react-redux";
import type { RootState } from "../redux/store";
import { Dispatch, SetStateAction, useState } from "react";
import { Image, Pressable } from "react-native";
import CustomModal from "./CustomModal";
import useWidthScreen from "../hooks/useWidthScreen";
import { theme } from "../utils/theme";
import { ThemeText } from "./ThemeText";
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
          accessibilityLabel={localization.Photo[language]}
          source={{ uri: `data:image/*;base64,${imageUrl}` }}
          style={{ width: "100%", height: width * 0.7, resizeMode: "contain" }}
        />
      </CustomModal>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={localization.ChoosePhoto[language]}
        onLongPress={() => imageUrl !== "" && setShowImageFull(true)}
        onPress={() => setImageModalVisible(true)}
        style={{
          width: 160,
          height: 160,
          borderRadius: theme.radius.sm,
          overflow: "hidden",
          backgroundColor: theme.colors.surface,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {imageUrl !== "" ? (
          <Image
            source={{ uri: `data:image/*;base64,${imageUrl}` }}
            style={{ width: 160, height: 160, resizeMode: "cover" }}
          />
        ) : (
          <ThemeText>{localization.AddPhoto[language]}</ThemeText>
        )}
      </Pressable>
    </>
  );
};
