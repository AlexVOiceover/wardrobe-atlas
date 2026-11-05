import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  PanResponder,
  StyleSheet,
  View,
} from "react-native";
import { Portal } from "react-native-paper";
import { CutoutStroke, editCutout } from "../utils/backgroundRemoval";
import { localization } from "../utils/localization";
import { captionText, theme } from "../utils/theme";
import { FilterChip } from "./FilterChip";
import { HeaderIcon } from "./PageHeader";
import { ThemeText } from "./ThemeText";
import { DiscardDialog } from "../hooks/useDiscardGuard";

// Brush widths as fractions of the image width
export const BRUSH_SIZES = [0.03, 0.06, 0.12];
// Earlier versions kept for Undo
const HISTORY = 20;
// Finger movements shorter than this (in points) add no new point.
const MIN_STEP = 2;

type Point = { x: number; y: number };
type Frame = { x: number; y: number; width: number; height: number };

/** Where an image of the given aspect sits when fitted inside an area. */
export const fitImage = (
  area: { width: number; height: number },
  aspect: number,
): Frame => {
  if (area.width <= 0 || area.height <= 0 || aspect <= 0)
    return { x: 0, y: 0, width: 0, height: 0 };
  const width = Math.min(area.width, area.height * aspect);
  const height = width / aspect;
  return {
    x: (area.width - width) / 2,
    y: (area.height - height) / 2,
    width,
    height,
  };
};

/** A finger path on screen as a stroke over the image. */
export const toStroke = (
  points: Point[],
  frame: Frame,
  mode: CutoutStroke["mode"],
  size: number,
): CutoutStroke => ({
  mode,
  size,
  points: points.flatMap(point => [
    (point.x - frame.x) / frame.width,
    (point.y - frame.y) / frame.height,
  ]),
});

/**
 * Full-screen editor to fix a cutout by hand: paint to erase leftovers or,
 * while the original photo is known, to restore parts that were cut away.
 * Each stroke is applied on the phone when the finger lifts.
 */
export function CutoutEditor({
  visible,
  image,
  original,
  language,
  onCancel,
  onDone,
}: {
  visible: boolean;
  image: string;
  original?: string;
  language: number;
  onCancel: () => void;
  onDone: (image: string) => void;
}) {
  const [current, setCurrent] = useState(image);
  const [history, setHistory] = useState<string[]>([]);
  const [mode, setMode] = useState<CutoutStroke["mode"]>("erase");
  const [brush, setBrush] = useState(1);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [points, setPoints] = useState<Point[]>([]);
  const [area, setArea] = useState({ width: 0, height: 0 });
  const [aspect, setAspect] = useState(1);
  const [asking, setAsking] = useState(false);
  useEffect(() => {
    if (!visible) return;
    setAsking(false);
    setCurrent(image);
    setHistory([]);
    setMode("erase");
    setFailed(false);
    setPoints([]);
    Image.getSize(
      `data:image/webp;base64,${image}`,
      (width, height) => height > 0 && setAspect(width / height),
      () => {},
    );
  }, [visible, image]);
  const frame = fitImage(area, aspect);
  // The responder is made once, so it reads the latest values from here.
  const latest = useRef({ busy, frame, mode, brush, current, original });
  latest.current = { busy, frame, mode, brush, current, original };
  const stroke = useRef<Point[]>([]);
  const apply = async (path: Point[]) => {
    const now = latest.current;
    setBusy(true);
    setFailed(false);
    const edited = await editCutout(now.current, now.original, [
      toStroke(path, now.frame, now.mode, BRUSH_SIZES[now.brush]),
    ]);
    if (edited) {
      setHistory(previous => [...previous, now.current].slice(-HISTORY));
      setCurrent(edited);
    } else setFailed(true);
    setPoints([]);
    setBusy(false);
  };
  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !latest.current.busy,
      onMoveShouldSetPanResponder: () => !latest.current.busy,
      onPanResponderGrant: event => {
        const { locationX: x, locationY: y } = event.nativeEvent;
        stroke.current = [{ x, y }];
        setPoints(stroke.current);
      },
      onPanResponderMove: event => {
        const { locationX: x, locationY: y } = event.nativeEvent;
        const last = stroke.current[stroke.current.length - 1];
        if (last && Math.hypot(x - last.x, y - last.y) < MIN_STEP) return;
        stroke.current = [...stroke.current, { x, y }];
        setPoints(stroke.current);
      },
      onPanResponderRelease: () => {
        if (stroke.current.length > 0) apply(stroke.current);
        stroke.current = [];
      },
      onPanResponderTerminate: () => {
        stroke.current = [];
        setPoints([]);
      },
    }),
  ).current;
  const undo = () => {
    if (history.length === 0) return;
    setCurrent(history[history.length - 1]);
    setHistory(previous => previous.slice(0, -1));
  };
  // Closing with strokes applied asks before throwing them away.
  const close = () => (history.length > 0 ? setAsking(true) : onCancel());
  const dot = BRUSH_SIZES[brush] * frame.width;
  const sizeLabels = [
    localization.BrushFine,
    localization.BrushMedium,
    localization.BrushWide,
  ];
  return (
    <Modal visible={visible} animationType="none" onRequestClose={close}>
      {/* Dialogs show inside this full-screen modal, not under it. */}
      <Portal.Host>
        <DiscardDialog
          visible={asking}
          language={language}
          onKeep={() => setAsking(false)}
          onDiscard={() => {
            setAsking(false);
            onCancel();
          }}
        />
        <View style={styles.screen}>
          <View style={styles.bar}>
            <HeaderIcon
              name="close"
              label={localization.Cancel[language]}
              onPress={close}
            />
            <ThemeText numberOfLines={1} customStyle={styles.title}>
              {localization.FixCutout[language]}
            </ThemeText>
            {history.length > 0 && (
              <HeaderIcon
                name="arrow-undo"
                label={localization.Undo[language]}
                onPress={undo}
              />
            )}
            <HeaderIcon
              name="checkmark"
              label={localization.Done[language]}
              onPress={() =>
                history.length > 0 ? onDone(current) : onCancel()
              }
            />
          </View>
          <View
            testID="cutout-canvas"
            style={styles.canvas}
            onLayout={event => {
              const { width, height } = event.nativeEvent.layout;
              setArea({ width, height });
            }}
            {...responder.panHandlers}
          >
            {/* Touches go to the canvas, so positions are relative to it. */}
            <View
              pointerEvents="none"
              style={[
                styles.image,
                {
                  left: frame.x,
                  top: frame.y,
                  width: frame.width,
                  height: frame.height,
                },
              ]}
            >
              <Image
                accessibilityLabel={localization.Photo[language]}
                source={{ uri: `data:image/webp;base64,${current}` }}
                style={StyleSheet.absoluteFill}
                resizeMode="stretch"
              />
            </View>
            {points.map((point, index) => (
              <View
                key={index}
                pointerEvents="none"
                style={[
                  styles.dot,
                  mode === "erase" ? styles.eraseDot : styles.restoreDot,
                  {
                    left: point.x - dot / 2,
                    top: point.y - dot / 2,
                    width: dot,
                    height: dot,
                    borderRadius: dot / 2,
                  },
                ]}
              />
            ))}
            {busy && (
              <View pointerEvents="none" style={styles.busy}>
                <ActivityIndicator color={theme.colors.text} />
              </View>
            )}
          </View>
          <View style={styles.tools}>
            <ThemeText
              accessibilityLiveRegion="polite"
              customStyle={captionText}
            >
              {failed
                ? localization.FixCutoutFailed[language]
                : mode === "erase"
                ? localization.EraseHint[language]
                : localization.RestoreHint[language]}
            </ThemeText>
            <View style={styles.row}>
              <FilterChip
                dense
                icon="remove-circle-outline"
                label={localization.Erase[language]}
                selected={mode === "erase"}
                onPress={() => setMode("erase")}
              />
              {/* The original photo is only known until the garment is saved. */}
              {original && (
                <FilterChip
                  dense
                  icon="add-circle-outline"
                  label={localization.Restore[language]}
                  selected={mode === "restore"}
                  onPress={() => setMode("restore")}
                />
              )}
            </View>
            <View style={styles.row}>
              {sizeLabels.map((label, index) => (
                <FilterChip
                  key={index}
                  dense
                  label={label[language]}
                  selected={brush === index}
                  onPress={() => setBrush(index)}
                />
              ))}
            </View>
          </View>
        </View>
      </Portal.Host>
    </Modal>
  );
}
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    height: 56,
    paddingHorizontal: theme.spacing.xs,
    backgroundColor: theme.colors.bar,
  },
  title: {
    flex: 1,
    color: theme.colors.onBar,
    fontSize: theme.type.title,
    fontWeight: "600",
  },
  // Grey shows through where the garment is cut away.
  canvas: {
    flex: 1,
    margin: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    overflow: "hidden",
  },
  image: {
    position: "absolute",
  },
  dot: {
    position: "absolute",
  },
  eraseDot: {
    backgroundColor: "rgba(220,38,38,0.45)",
  },
  restoreDot: {
    backgroundColor: "rgba(22,163,74,0.45)",
  },
  busy: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  tools: {
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.md,
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },
});
