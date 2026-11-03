import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { Button } from "react-native-paper";
import { useSelector } from "react-redux";
import type { RootState } from "../redux/store";
import { useUpdates } from "../hooks/useUpdates";
import {
  allowUpdateInstallation,
  checkForUpdates,
  getInstalledVersion,
  resumePendingUpdate,
  type UpdatePhase,
  type UpdateError,
} from "../utils/updateService";
import { localization } from "../utils/localization";
import { captionText, theme } from "../utils/theme";
import { ThemeText } from "./ThemeText";

const phaseText: Record<UpdatePhase, readonly string[]> = {
  idle: localization.UpdateAutomatic,
  checking: localization.UpdateChecking,
  downloading: localization.UpdateDownloading,
  permission: localization.UpdatePermission,
  ready: localization.UpdateReady,
  installing: localization.UpdateInstalling,
  current: localization.UpdateCurrent,
  error: localization.UpdateNetworkError,
};
const errorText: Record<UpdateError, readonly string[]> = {
  network: localization.UpdateNetworkError,
  "rate-limit": localization.UpdateRateLimit,
  verification: localization.UpdateVerificationError,
  installation: localization.UpdateInstallError,
  unavailable: localization.UpdateUnavailable,
  unsupported: localization.UpdateUnsupported,
};
// The app-wide banner only shows when there is something to know or do;
// "checking" and "up to date" would just flash over the screen.
const bannerPhases: UpdatePhase[] = [
  "downloading",
  "permission",
  "ready",
  "installing",
  "error",
];
export function UpdateControls({ settings = false }: { settings?: boolean }) {
  const state = useUpdates();
  const language = useSelector((s: RootState) => s.settings.language);
  const { versionName } = getInstalledVersion();
  // Closing the banner hides it until the update state moves on.
  const [dismissed, setDismissed] = useState<string>();
  const busy = state.phase === "checking" || state.phase === "downloading";
  const stateKey = `${state.phase}:${state.error ?? ""}`;
  if (
    !settings &&
    (!bannerPhases.includes(state.phase) || dismissed === stateKey)
  )
    return null;
  const text =
    state.phase === "error"
      ? errorText[state.error || "network"][language]
      : phaseText[state.phase][language];
  const status = (
    <ThemeText
      accessibilityLiveRegion="polite"
      numberOfLines={settings ? 2 : undefined}
      customStyle={settings ? [captionText, styles.status] : styles.bannerText}
    >
      {text}
      {state.availableVersion && state.phase !== "current"
        ? ` (v${state.availableVersion})`
        : ""}
      {state.phase === "downloading" && state.progress !== undefined
        ? ` ${state.progress}%`
        : ""}
    </ThemeText>
  );
  const actions = (
    <>
      {state.phase === "permission" && (
        <Button
          mode="outlined"
          onPress={() => {
            allowUpdateInstallation();
          }}
        >
          {localization.AllowUpdates[language]}
        </Button>
      )}
      {state.phase === "ready" && (
        <Button
          mode="outlined"
          onPress={() => {
            resumePendingUpdate();
          }}
        >
          {localization.InstallUpdate[language]}
        </Button>
      )}
    </>
  );
  if (settings) {
    // Status and buttons come last, so changing texts never move anything.
    return (
      <View style={styles.settings}>
        <Button
          mode="outlined"
          disabled={busy}
          onPress={() => {
            checkForUpdates({ manual: true });
          }}
        >
          {localization.CheckForUpdates[language]}
        </Button>
        <ThemeText testID="app-version" customStyle={captionText}>
          {localization.Version[language]}{" "}
          {versionName === "Development" ? versionName : `v${versionName}`}
        </ThemeText>
        {status}
        {actions}
      </View>
    );
  }
  return (
    <View style={styles.banner}>
      <View style={styles.bannerRow}>
        {status}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={localization.Close[language]}
          onPress={() => setDismissed(stateKey)}
          style={styles.close}
        >
          <Icon name="close" size={20} color={theme.colors.muted} />
        </Pressable>
      </View>
      {actions}
      {state.phase === "error" && (
        <Button
          mode="outlined"
          onPress={() => {
            checkForUpdates({ manual: true });
          }}
        >
          {localization.TryAgain[language]}
        </Button>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  settings: {
    gap: theme.spacing.sm,
  },
  // Two caption lines, reserved even when the text is shorter.
  status: {
    minHeight: 36,
  },
  // Floats over the top of the screen instead of pushing it down.
  banner: {
    position: "absolute",
    top: theme.spacing.sm,
    left: theme.spacing.sm,
    right: theme.spacing.sm,
    zIndex: 10,
    elevation: 6,
    padding: theme.spacing.md,
    paddingRight: theme.spacing.xs,
    gap: theme.spacing.sm,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.background,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  bannerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  bannerText: {
    flex: 1,
  },
  close: {
    width: theme.touch,
    minHeight: theme.touch,
    justifyContent: "center",
    alignItems: "center",
  },
});
