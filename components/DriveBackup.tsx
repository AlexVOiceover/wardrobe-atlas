import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { Button } from "react-native-paper";
import NetInfo from "@react-native-community/netinfo";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../redux/store";
import { setDriveLastBackup } from "../redux/settingsSlice";
import {
  DriveBackupFile,
  DriveError,
  backupFileName,
  backupFolder,
  downloadBackup,
  listBackups,
  pruneBackups,
  uploadBackup,
} from "../utils/driveBackup";
import {
  connectAccount,
  connectedAccount,
  disconnectAccount,
  withDriveToken,
} from "../utils/googleAccount";
import { backupText } from "../utils/exportStoreToJson";
import { applyBackup } from "../utils/importStoreFromJson";
import { formatDateTime } from "../utils/dates";
import { localization } from "../utils/localization";
import { captionText, theme } from "../utils/theme";
import { BottomSheet } from "./BottomSheet";
import { ConfirmationDialog } from "./ConfirmationDialog";
import { ListRow } from "./ListRow";
import { ThemeText } from "./ThemeText";

const megabytes = (bytes: number) =>
  `${Math.max(0.1, bytes / 1024 / 1024).toFixed(1)} MB`;

/**
 * Settings › Backup › Google Drive: connect an account, back up by hand into
 * the "Wardrobe Atlas backups" folder (newest 3 kept) and restore from it.
 */
export function DriveBackup({
  language,
  onNotice,
  syncDisplay,
}: {
  language: number;
  onNotice: (text: string) => void;
  syncDisplay: (enabled: boolean) => void;
}) {
  const dispatch = useDispatch();
  const lastBackupAt = useSelector(
    (s: RootState) => s.settings.driveLastBackupAt,
  );
  // undefined while checking, "" when not connected
  const [account, setAccount] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  // A backup waiting for "not on Wi-Fi" to be confirmed
  const [pending, setPending] = useState<string>();
  const [backups, setBackups] = useState<DriveBackupFile[]>();
  const [chosen, setChosen] = useState<DriveBackupFile>();
  const l = localization;
  useEffect(() => {
    connectedAccount()
      .then(email => setAccount(email ?? ""))
      .catch(() => setAccount(""));
  }, []);

  // Runs Drive work with a spinner; failures become a message under the
  // buttons. Losing the Google sign-in shows Connect again.
  const run = async (work: () => Promise<void>, failure: string) => {
    setBusy(true);
    setError("");
    try {
      await work();
    } catch (caught) {
      if (!(caught instanceof DriveError)) {
        // getTokens fails when the account or its permission is gone.
        if (!(await connectedAccount().catch(() => undefined))) {
          setAccount("");
          setError(l.DriveReconnect[language]);
          return;
        }
      }
      setError(failure);
    } finally {
      setBusy(false);
    }
  };

  const upload = (text: string) =>
    run(async () => {
      await withDriveToken(async token => {
        const folder = await backupFolder(token);
        await uploadBackup(token, folder, backupFileName(new Date()), text);
        await pruneBackups(token, folder);
      });
      dispatch(setDriveLastBackup({ at: new Date().toISOString() }));
      onNotice(l.DriveBackedUp[language]);
    }, l.DriveBackupFailed[language]);

  const backUp = async () => {
    const text = backupText();
    const network = await NetInfo.fetch();
    // Off Wi-Fi it asks first; backups with photos can be large.
    if (network.type !== "wifi" && network.type !== "ethernet") {
      setPending(text);
      return;
    }
    await upload(text);
  };

  const openRestore = () =>
    run(async () => {
      const files = await withDriveToken(async token =>
        listBackups(token, await backupFolder(token)),
      );
      setBackups(files);
    }, l.DriveListFailed[language]);

  const restore = (file: DriveBackupFile) =>
    run(async () => {
      const text = await withDriveToken(token =>
        downloadBackup(token, file.id),
      );
      try {
        await applyBackup(text, syncDisplay);
      } catch {
        throw new DriveError(0, "Not a backup");
      }
      onNotice(l.DriveRestored[language]);
    }, l.DriveRestoreFailed[language]);

  const connect = async () => {
    setError("");
    try {
      const email = await connectAccount();
      if (email) setAccount(email);
    } catch (caught) {
      // Google's code (e.g. 10 = the app isn't registered for this key) says
      // what to fix in the Google Cloud setup.
      const { code, message } = (caught ?? {}) as {
        code?: string;
        message?: string;
      };
      const detail = [code, message].filter(Boolean).join(": ");
      setError(
        detail
          ? `${l.DriveConnectFailed[language]} (${detail})`
          : l.DriveConnectFailed[language],
      );
    }
  };

  const disconnect = async () => {
    await disconnectAccount().catch(() => {});
    setAccount("");
  };

  if (account === undefined)
    return <ActivityIndicator color={theme.colors.muted} />;
  return (
    <View style={styles.section}>
      <ThemeText customStyle={styles.title}>
        {l.GoogleDrive[language]}
      </ThemeText>
      {account ? (
        <>
          <ThemeText customStyle={captionText}>
            {`${account} · ${l.DriveLastBackup[language].replace(
              "{when}",
              lastBackupAt
                ? formatDateTime(lastBackupAt, language)
                : l.Never[language],
            )}`}
          </ThemeText>
          <View style={styles.row}>
            <Button
              mode="contained"
              disabled={busy}
              onPress={backUp}
            >
              {l.BackUpNow[language]}
            </Button>
            <Button
              mode="outlined"
              disabled={busy}
              onPress={openRestore}
            >
              {l.RestoreFromDrive[language]}
            </Button>
          </View>
        </>
      ) : (
        <>
          <ThemeText customStyle={captionText}>
            {l.DriveExplain[language]}
          </ThemeText>
          <Button mode="outlined" icon="google-drive" onPress={connect}>
            {l.ConnectDrive[language]}
          </Button>
        </>
      )}
      {busy && <ActivityIndicator color={theme.colors.muted} />}
      {!!error && (
        <ThemeText accessibilityLiveRegion="polite" customStyle={styles.error}>
          {error}
        </ThemeText>
      )}
      {!!account && (
        <Button
          mode="text"
          compact
          style={styles.disconnect}
          disabled={busy}
          onPress={disconnect}
        >
          {l.DisconnectDrive[language]}
        </Button>
      )}

      <ConfirmationDialog
        visible={pending !== undefined}
        setVisible={shown => !shown && setPending(undefined)}
        title={l.NotOnWifi[language]}
        message={l.NotOnWifiMessage[language].replace(
          "{size}",
          megabytes(pending?.length ?? 0),
        )}
        confirmLabel={l.BackUpAnyway[language]}
        destructive={false}
        onConfirm={() => {
          const text = pending!;
          setPending(undefined);
          upload(text);
        }}
      />
      <BottomSheet
        isOpen={backups !== undefined}
        setIsOpen={open => !open && setBackups(undefined)}
        title={l.RestoreFromDrive[language]}
      >
        {backups?.length === 0 && (
          <ThemeText customStyle={captionText}>
            {l.NoDriveBackups[language]}
          </ThemeText>
        )}
        {backups?.map(file => (
          <ListRow
            key={file.id}
            icon="cloud-download-outline"
            title={formatDateTime(file.createdTime, language)}
            subtitle={megabytes(file.size)}
            onPress={() => {
              setBackups(undefined);
              setChosen(file);
            }}
          />
        ))}
      </BottomSheet>
      <ConfirmationDialog
        visible={!!chosen}
        setVisible={shown => !shown && setChosen(undefined)}
        title={l.RestoreBackup[language]}
        message={l.ImportBackupMessage[language]}
        confirmLabel={l.Restore[language]}
        onConfirm={() => {
          const file = chosen!;
          setChosen(undefined);
          restore(file);
        }}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  section: {
    gap: theme.spacing.sm,
  },
  title: {
    fontWeight: "600",
  },
  // Stacked, so long Spanish labels are never cut short.
  row: {
    gap: theme.spacing.sm,
  },
  error: {
    color: theme.colors.danger,
    fontSize: theme.type.caption,
  },
  disconnect: {
    alignSelf: "flex-start",
  },
});
