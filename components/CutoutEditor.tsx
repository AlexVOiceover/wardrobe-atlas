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
import { photoUri, readPhoto, savePhoto } from "../utils/photoStore";
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
// How far pinching can zoom in
export const MAX_ZOOM = 6;
// The close-up shown while painting: its size and how much it magnifies
export const LOUPE_SIZE = 128;
const LOUPE_ZOOM = 2;
const LOUPE_MARGIN = 8;

type Point = { x: number; y: number };
type Frame = { x: number; y: number; width: number; height: number };
// Zoom and pan of the photo: canvas position = fitted position × scale + x/y
export type Zoom = { scale: number; x: number; y: number };
export const NO_ZOOM: Zoom = { scale: 1, x: 0, y: 0 };

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

/** Where the fitted image sits on the canvas once zoomed and panned. */
export const zoomedFrame = (frame: Frame, zoom: Zoom): Frame => ({
  x: frame.x * zoom.scale + zoom.x,
  y: frame.y * zoom.scale + zoom.y,
  width: frame.width * zoom.scale,
  height: frame.height * zoom.scale,
});

/** Keeps the zoomed photo over the middle of the canvas, so it can't be lost. */
export const clampZoom = (
  zoom: Zoom,
  area: { width: number; height: number },
  frame: Frame,
): Zoom => {
  if (zoom.scale <= 1.01) return NO_ZOOM;
  const clamp = (value: number, low: number, high: number) =>
    Math.min(Math.max(value, low), high);
  return {
    scale: zoom.scale,
    x: clamp(
      zoom.x,
      area.width / 2 - (frame.x + frame.width) * zoom.scale,
      area.width / 2 - frame.x * zoom.scale,
    ),
    y: clamp(
      zoom.y,
      area.height / 2 - (frame.y + frame.height) * zoom.scale,
      area.height / 2 - frame.y * zoom.scale,
    ),
  };
};

/**
 * Zoom while pinching: the spread of the two fingers sets the scale, and the
 * spot first between them stays between them as they move.
 */
export const pinchZoom = (
  start: { zoom: Zoom; center: Point; distance: number },
  center: Point,
  distance: number,
  area: { width: number; height: number },
  frame: Frame,
): Zoom => {
  const scale = Math.min(
    Math.max((start.zoom.scale * distance) / Math.max(start.distance, 1), 1),
    MAX_ZOOM,
  );
  const ratio = scale / start.zoom.scale;
  return clampZoom(
    {
      scale,
      x: center.x - (start.center.x - start.zoom.x) * ratio,
      y: center.y - (start.center.y - start.zoom.y) * ratio,
    },
    area,
    frame,
  );
};

/** The close-up sits top left, or top right when the finger is under it. */
export const loupeSide = (point: Point): "left" | "right" =>
  point.x < LOUPE_SIZE + 2 * LOUPE_MARGIN &&
  point.y < LOUPE_SIZE + 2 * LOUPE_MARGIN
    ? "right"
    : "left";

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
 * Each stroke is applied on the phone when the finger lifts. Two fingers zoom
 * and move the photo; while painting, a close-up in a top corner shows what
 * the finger covers.
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
  // The cutout being edited and the photo it came from, as base64 for the
  // native editor; the result is saved as a new photo file on Done.
  const [current, setCurrent] = useState("");
  const [originalData, setOriginalData] = useState<string>();
  const [history, setHistory] = useState<string[]>([]);
  const [mode, setMode] = useState<CutoutStroke["mode"]>("erase");
  const [brush, setBrush] = useState(1);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [points, setPoints] = useState<Point[]>([]);
  const [area, setArea] = useState({ width: 0, height: 0 });
  const [aspect, setAspect] = useState(1);
  const [asking, setAsking] = useState(false);
  const [zoom, setZoom] = useState(NO_ZOOM);
  const [touching, setTouching] = useState(false);
  useEffect(() => {
    if (!visible) return;
    setAsking(false);
    setZoom(NO_ZOOM);
    setCurrent("");
    setOriginalData(undefined);
    setHistory([]);
    setMode("erase");
    setFailed(false);
    setPoints([]);
    let open = true;
    Promise.all([readPhoto(image), original ? readPhoto(original) : undefined])
      .then(([cutout, photo]) => {
        if (!open) return;
        setCurrent(cutout);
        setOriginalData(photo);
      })
      .catch(() => open && setFailed(true));
    Image.getSize(
      photoUri(image),
      (width, height) => height > 0 && setAspect(width / height),
      () => {},
    );
    return () => {
      open = false;
    };
  }, [visible, image, original]);
  const frame = fitImage(area, aspect);
  const shown = zoomedFrame(frame, zoom);
  // The responder is made once, so it reads the latest values from here.
  const latest = useRef({
    busy,
    area,
    frame,
    zoom,
    mode,
    brush,
    current,
    original: originalData,
  });
  latest.current = {
    busy: busy || !current,
    area,
    frame,
    zoom,
    mode,
    brush,
    current,
    original: originalData,
  };
  const stroke = useRef<Point[]>([]);
  // What the fingers are doing, and where a pinch started
  const gesture = useRef<{
    kind: "paint" | "pinch";
    // The canvas's position on the screen
    origin: Point;
    start?: { zoom: Zoom; center: Point; distance: number };
  }>({ kind: "paint", origin: { x: 0, y: 0 } });
  const apply = async (path: Point[]) => {
    const now = latest.current;
    setBusy(true);
    setFailed(false);
    // The brush keeps its size on screen, so it paints finer when zoomed in.
    const edited = await editCutout(now.current, now.original, [
      toStroke(
        path,
        zoomedFrame(now.frame, now.zoom),
        now.mode,
        BRUSH_SIZES[now.brush] / now.zoom.scale,
      ),
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
        const { locationX: x, locationY: y, pageX, pageY } = event.nativeEvent;
        gesture.current = {
          kind: "paint",
          origin: { x: (pageX ?? x) - x, y: (pageY ?? y) - y },
        };
        stroke.current = [{ x, y }];
        setPoints(stroke.current);
        setTouching(true);
      },
      onPanResponderMove: event => {
        const { touches = [] } = event.nativeEvent;
        if (touches.length >= 2) {
          // A second finger turns the stroke into a pinch; nothing is painted.
          const { origin } = gesture.current;
          const [a, b] = touches;
          const center = {
            x: (a.pageX + b.pageX) / 2 - origin.x,
            y: (a.pageY + b.pageY) / 2 - origin.y,
          };
          const distance = Math.hypot(a.pageX - b.pageX, a.pageY - b.pageY);
          if (gesture.current.kind !== "pinch") {
            gesture.current = {
              kind: "pinch",
              origin,
              start: { zoom: latest.current.zoom, center, distance },
            };
            stroke.current = [];
            setPoints([]);
            setTouching(false);
            return;
          }
          const now = latest.current;
          setZoom(
            pinchZoom(
              gesture.current.start!,
              center,
              distance,
              now.area,
              now.frame,
            ),
          );
          return;
        }
        // Lifting one finger of a pinch doesn't start painting.
        if (gesture.current.kind === "pinch") return;
        const { locationX: x, locationY: y } = event.nativeEvent;
        const last = stroke.current[stroke.current.length - 1];
        if (last && Math.hypot(x - last.x, y - last.y) < MIN_STEP) return;
        stroke.current = [...stroke.current, { x, y }];
        setPoints(stroke.current);
      },
      onPanResponderRelease: () => {
        if (gesture.current.kind === "paint" && stroke.current.length > 0)
          apply(stroke.current);
        stroke.current = [];
        setTouching(false);
      },
      onPanResponderTerminate: () => {
        stroke.current = [];
        setPoints([]);
        setTouching(false);
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
  // The brush's size on screen; the same at every zoom.
  const dot = BRUSH_SIZES[brush] * frame.width;
  const finger = touching ? points[points.length - 1] : undefined;
  const pathStyle = mode === "erase" ? styles.erasePath : styles.restorePath;
  const ringStyle = mode === "erase" ? styles.eraseRing : styles.restoreRing;
  // A circle of the given size centred on a point
  const circle = (point: Point, size: number) => ({
    left: point.x - size / 2,
    top: point.y - size / 2,
    width: size,
    height: size,
    borderRadius: size / 2,
  });
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
            {zoom.scale > 1 && (
              <HeaderIcon
                name="scan-outline"
                label={localization.ShowWholePhoto[language]}
                onPress={() => setZoom(NO_ZOOM)}
              />
            )}
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
              onPress={async () => {
                if (history.length === 0) return onCancel();
                setBusy(true);
                try {
                  onDone(await savePhoto(current));
                } catch {
                  setFailed(true);
                } finally {
                  setBusy(false);
                }
              }}
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
                  left: shown.x,
                  top: shown.y,
                  width: shown.width,
                  height: shown.height,
                },
              ]}
            >
              {current !== "" ? (
                <Image
                  accessibilityLabel={localization.Photo[language]}
                  source={{ uri: `data:image/webp;base64,${current}` }}
                  style={StyleSheet.absoluteFill}
                  resizeMode="stretch"
                />
              ) : (
                <ActivityIndicator style={StyleSheet.absoluteFill} />
              )}
            </View>
            {/* The painted path, faint, and a ring showing the brush. */}
            {points.map((point, index) => (
              <View
                key={index}
                pointerEvents="none"
                style={[styles.dot, pathStyle, circle(point, dot)]}
              />
            ))}
            {finger && (
              <View
                pointerEvents="none"
                style={[
                  styles.dot,
                  styles.ring,
                  ringStyle,
                  circle(finger, dot),
                ]}
              />
            )}
            {/* What the finger covers, magnified, away from the finger. */}
            {finger && (
              <View
                testID="cutout-loupe"
                pointerEvents="none"
                style={[
                  styles.loupe,
                  loupeSide(finger) === "left"
                    ? { left: LOUPE_MARGIN }
                    : { right: LOUPE_MARGIN },
                ]}
              >
                <Image
                  source={{ uri: `data:image/webp;base64,${current}` }}
                  resizeMode="stretch"
                  style={{
                    position: "absolute",
                    left: LOUPE_SIZE / 2 - (finger.x - shown.x) * LOUPE_ZOOM,
                    top: LOUPE_SIZE / 2 - (finger.y - shown.y) * LOUPE_ZOOM,
                    width: shown.width * LOUPE_ZOOM,
                    height: shown.height * LOUPE_ZOOM,
                  }}
                />
                {points.map((point, index) => (
                  <View
                    key={index}
                    style={[
                      styles.dot,
                      pathStyle,
                      circle(
                        {
                          x: LOUPE_SIZE / 2 + (point.x - finger.x) * LOUPE_ZOOM,
                          y: LOUPE_SIZE / 2 + (point.y - finger.y) * LOUPE_ZOOM,
                        },
                        dot * LOUPE_ZOOM,
                      ),
                    ]}
                  />
                ))}
                <View
                  style={[
                    styles.dot,
                    styles.ring,
                    ringStyle,
                    circle(
                      { x: LOUPE_SIZE / 2, y: LOUPE_SIZE / 2 },
                      dot * LOUPE_ZOOM,
                    ),
                  ]}
                />
              </View>
            )}
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
            <ThemeText customStyle={captionText}>
              {localization.ZoomHint[language]}
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
  erasePath: {
    backgroundColor: "rgba(220,38,38,0.3)",
  },
  restorePath: {
    backgroundColor: "rgba(22,163,74,0.3)",
  },
  ring: {
    borderWidth: 2,
  },
  eraseRing: {
    borderColor: "rgb(220,38,38)",
  },
  restoreRing: {
    borderColor: "rgb(22,163,74)",
  },
  loupe: {
    position: "absolute",
    top: LOUPE_MARGIN,
    width: LOUPE_SIZE,
    height: LOUPE_SIZE,
    borderRadius: LOUPE_SIZE / 2,
    borderWidth: 3,
    borderColor: theme.colors.bar,
    backgroundColor: theme.colors.surface,
    overflow: "hidden",
    elevation: 6,
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
