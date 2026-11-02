import { View } from "react-native";
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
export function UpdateControls({ settings = false }: { settings?: boolean }) {
  const state = useUpdates();
  const language = useSelector((s: RootState) => s.settings.language);
  const { versionName } = getInstalledVersion();
  const busy = state.phase === "checking" || state.phase === "downloading";
  if (!settings && (state.phase === "idle" || state.phase === "current"))
    return null;
  const text =
    state.phase === "error"
      ? errorText[state.error || "network"][language]
      : phaseText[state.phase][language];
  return (
    <View
      style={
        settings
          ? { gap: theme.spacing.sm }
          : {
              padding: theme.spacing.md,
              gap: theme.spacing.sm,
              backgroundColor: theme.colors.surface,
            }
      }
    >
      {settings && (
        <Button
          mode="outlined"
          disabled={busy}
          onPress={() => {
            checkForUpdates({ manual: true });
          }}
        >
          {localization.CheckForUpdates[language]}
        </Button>
      )}
      <ThemeText
        accessibilityLiveRegion="polite"
        customStyle={settings ? captionText : undefined}
      >
        {text}
        {state.availableVersion && state.phase !== "current"
          ? ` (v${state.availableVersion})`
          : ""}
        {state.phase === "downloading" && state.progress !== undefined
          ? ` ${state.progress}%`
          : ""}
      </ThemeText>
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
      {!settings && state.phase === "error" && (
        <Button
          mode="outlined"
          onPress={() => {
            checkForUpdates({ manual: true });
          }}
        >
          {localization.TryAgain[language]}
        </Button>
      )}
      {settings && (
        <ThemeText testID="app-version" customStyle={captionText}>
          {localization.Version[language]}{" "}
          {versionName === "Development" ? versionName : `v${versionName}`}
        </ThemeText>
      )}
    </View>
  );
}
