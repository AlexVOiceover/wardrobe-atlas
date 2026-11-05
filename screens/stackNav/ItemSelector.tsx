import { useState } from "react";
import { Button } from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";
import { useNavigation } from "@react-navigation/native";
import { RootState } from "../../redux/store";
import { GarmentPicker } from "../../components/GarmentPicker";
import { WhenControl, logGarments } from "../../components/QuickLogSheet";
import { returnToOutfits } from "../../components/LogComponent";
import { localization } from "../../utils/localization";

/**
 * Outfits +: tick garments as in the Closet, optionally move "When" earlier,
 * and log them as one outfit. Outfits then offers Undo.
 */
export const ItemSelector = () => {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch();
  const { items } = useSelector((state: RootState) => state.itemsList);
  const language = useSelector((state: RootState) => state.settings.language);
  const [picked, setPicked] = useState<string[]>([]);
  const [when, setWhen] = useState<Date>();
  const log = () => {
    const garments = items.filter(garment => picked.includes(garment.id));
    if (garments.length === 0) return;
    const logged = logGarments(dispatch, garments, language, when);
    returnToOutfits(navigation, { kind: "logged", ...logged });
  };
  return (
    <GarmentPicker
      title={localization.LogOutfit[language]}
      picked={picked}
      setPicked={setPicked}
      footer={
        <>
          <Button mode="contained" disabled={picked.length === 0} onPress={log}>
            {localization.LogOutfitCount[language].replace(
              "{n}",
              String(picked.length),
            )}
          </Button>
          <WhenControl when={when} setWhen={setWhen} language={language} />
        </>
      }
    />
  );
};
