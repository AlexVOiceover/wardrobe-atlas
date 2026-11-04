import { localization } from "../utils/localization";
import { useSelector } from "react-redux";
import type { RootState } from "../redux/store";
import { Dispatch, SetStateAction, useState } from "react";
import { Image, Pressable } from "react-native";
import CustomModal from "./CustomModal";
import useWidthScreen from "../hooks/useWidthScreen";
import { theme } from "../utils/theme";
import { ThemeText } from "./ThemeText";
/**
 * The garment's photo. It is `width` wide and fills the height its parent
 * gives it, never shorter than a square.
 */
export const ImageViewer = ({
  imageUrl,
  setImageModalVisible,
  width = 160,
  fit = "cover",
}: {
  width?: number;
  // "contain" shows the whole image, for cut-outs on a plain background.
  fit?: "cover" | "contain";
  imageUrl: string;
  setImageModalVisible: Dispatch<SetStateAction<boolean>>;
}) => {
  const [showImageFull, setShowImageFull] = useState(false);
  const language = useSelector((s: RootState) => s.settings.language);
  const screenWidth = useWidthScreen();
  return (
    <>
      <CustomModal
        setVisible={setShowImageFull}
        visible={showImageFull}
        maxHeight={screenWidth}
      >
        <Image
          accessibilityLabel={localization.Photo[language]}
          source={{ uri: `data:image/*;base64,${imageUrl}` }}
          style={{
            width: "100%",
            height: screenWidth * 0.7,
            resizeMode: "contain",
          }}
        />
      </CustomModal>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={localization.ChoosePhoto[language]}
        onLongPress={() => imageUrl !== "" && setShowImageFull(true)}
        onPress={() => setImageModalVisible(true)}
        style={{
          width,
          flexGrow: 1,
          minHeight: width,
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
            style={{ width: "100%", height: "100%", resizeMode: fit }}
          />
        ) : (
          <ThemeText>{localization.AddPhoto[language]}</ThemeText>
        )}
      </Pressable>
    </>
  );
};
