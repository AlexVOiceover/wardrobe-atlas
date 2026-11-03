import { useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button } from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../redux/store";
import { setGarmentImage } from "../redux/itemsSlice";
import { isCutout, removeBackground } from "../utils/backgroundRemoval";
import { localization } from "../utils/localization";
import { captionText, theme } from "../utils/theme";
import { ConfirmationDialog } from "./ConfirmationDialog";
import { ThemeText } from "./ThemeText";

/**
 * Removes the background of every photo that isn't cut out yet, one garment
 * at a time. Each garment is saved as soon as it's done, so Stop keeps them.
 */
export function BulkBackgroundRemoval({ language }: { language: number }) {
  const dispatch = useDispatch();
  const garments = useSelector((s: RootState) => s.itemsList.items);
  const pending = garments.filter(g => g.image && !isCutout(g.image));
  const [confirming, setConfirming] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number }>();
  const [message, setMessage] = useState("");
  const stopped = useRef(false);
  useEffect(
    () => () => {
      stopped.current = true;
    },
    [],
  );
  const run = async () => {
    const queue = pending.map(g => ({ id: g.id, image: g.image }));
    stopped.current = false;
    setMessage("");
    let done = 0;
    let failed = 0;
    setProgress({ done, total: queue.length });
    for (const garment of queue) {
      if (stopped.current) break;
      const result = await removeBackground(garment.image);
      if ("image" in result) {
        dispatch(setGarmentImage({ id: garment.id, image: result.image }));
        done++;
      } else if (
        result.error === "preparing" ||
        result.error === "unsupported"
      ) {
        // Nothing else will work either until this changes.
        setMessage(
          (result.error === "preparing"
            ? localization.BackgroundPreparing
            : localization.BackgroundUnsupported)[language],
        );
        setProgress(undefined);
        return;
      } else failed++;
      setProgress({ done: done + failed, total: queue.length });
    }
    setProgress(undefined);
    setMessage(
      [
        localization.BackgroundsDone[language].replace("{done}", String(done)),
        failed > 0
          ? localization.BackgroundsSkipped[language].replace(
              "{n}",
              String(failed),
            )
          : "",
      ]
        .filter(Boolean)
        .join(" "),
    );
  };
  return (
    <View style={styles.container}>
      <ConfirmationDialog
        visible={confirming}
        setVisible={setConfirming}
        title={localization.RemoveAllBackgrounds[language]}
        message={localization.ConfirmRemoveBackgrounds[language].replace(
          "{n}",
          String(pending.length),
        )}
        onConfirm={run}
      />
      {progress ? (
        <View style={styles.row}>
          <ThemeText
            accessibilityLiveRegion="polite"
            customStyle={styles.progress}
          >
            {localization.BackgroundProgress[language]
              .replace("{done}", String(progress.done))
              .replace("{total}", String(progress.total))}
          </ThemeText>
          <Button
            mode="outlined"
            onPress={() => {
              stopped.current = true;
            }}
          >
            {localization.Stop[language]}
          </Button>
        </View>
      ) : (
        <Button
          mode="outlined"
          icon="content-cut"
          onPress={() =>
            pending.length > 0
              ? setConfirming(true)
              : setMessage(localization.NoPhotosToProcess[language])
          }
        >
          {localization.RemoveAllBackgrounds[language]}
        </Button>
      )}
      {!!message && (
        <ThemeText accessibilityLiveRegion="polite" customStyle={captionText}>
          {message}
        </ThemeText>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  progress: {
    flex: 1,
  },
});
