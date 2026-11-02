import { View, Text } from "react-native";
import { Button } from "react-native-paper";
import { useSelector } from "react-redux";
import type { RootState } from "../redux/store";
import { useUpdates } from "../hooks/useUpdates";
import {
  allowUpdateInstallation,
  checkForUpdates,
  resumePendingUpdate,
  type UpdatePhase,
  type UpdateError,
} from "../utils/updateService";
import { localization } from "../utils/localization";

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
  const busy = state.phase === "checking" || state.phase === "downloading";
  if (!settings && (state.phase === "idle" || state.phase === "current"))
    return null;
  const text =
    state.phase === "error"
      ? errorText[state.error || "network"][language]
      : phaseText[state.phase][language];
  return (
    <View style={{ padding: 8, gap: 6, borderBottomWidth: settings ? 0 : 1 }}>
      {settings && (
        <Button
          mode="outlined"
          disabled={busy}
          onPress={() => {
            void checkForUpdates({ manual: true });
          }}
        >
          {localization.CheckForUpdates[language]}
        </Button>
      )}
      <Text accessibilityLiveRegion="polite" style={{ color: "#111111" }}>
        {text}
        {state.availableVersion && state.phase !== "current"
          ? ` (v${state.availableVersion})`
          : ""}
        {state.phase === "downloading" && state.progress !== undefined
          ? ` ${state.progress}%`
          : ""}
      </Text>
      {state.phase === "permission" && (
        <Button
          mode="outlined"
          onPress={() => {
            void allowUpdateInstallation();
          }}
        >
          {localization.AllowUpdates[language]}
        </Button>
      )}
      {state.phase === "ready" && (
        <Button
          mode="outlined"
          onPress={() => {
            void resumePendingUpdate();
          }}
        >
          {localization.InstallUpdate[language]}
        </Button>
      )}
      {!settings && state.phase === "error" && (
        <Button
          mode="outlined"
          onPress={() => {
            void checkForUpdates({ manual: true });
          }}
        >
          {localization.TryAgain[language]}
        </Button>
      )}
    </View>
  );
}
