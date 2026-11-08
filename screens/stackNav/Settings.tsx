import { UpdateControls } from "../../components/UpdateControls";
import { View, StyleSheet, ScrollView } from "react-native";
import { ThemeView } from "../../components/ThemeView";
import { PageHeader } from "../../components/PageHeader";
import { useState } from "react";
import { languagesList } from "../../utils/data";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { changeLanguage, setHeatMap } from "../../redux/settingsSlice";
import { Button, Snackbar } from "react-native-paper";
import { exportStoreToJson } from "../../utils/exportStoreToJson";
import { importStoreFromJson } from "../../utils/importStoreFromJson";
import { localization } from "../../utils/localization";
import { captionText, theme } from "../../utils/theme";
import { ThemeText } from "../../components/ThemeText";
import { FilterChip } from "../../components/FilterChip";
import { ListRow } from "../../components/ListRow";
import { SectionHeading } from "../../components/SectionHeading";
import { BulkBackgroundRemoval } from "../../components/BulkBackgroundRemoval";
import { ConfirmationDialog } from "../../components/ConfirmationDialog";
export const Settings = () => {
  const storedSettings = useSelector((state: RootState) => state.settings);
  const { language, enableHeatMap } = storedSettings;
  const dispatch = useDispatch();
  // What the snackbar says after an export or import.
  const [notice, setNotice] = useState("");
  const [importing, setImporting] = useState(false);
  const [checkedHeatMap, setCheckedHeatMap] = useState(enableHeatMap);
  const setCheckboxes = (newEnableHeatMap: boolean) => {
    setCheckedHeatMap(newEnableHeatMap);
  };
  const exportBackup = async () => {
    const exported = await exportStoreToJson();
    if (exported) setNotice(localization.ExportDone[language]);
    return exported;
  };
  const importBackup = async () => {
    const result = await importStoreFromJson(setCheckboxes);
    if (result === "imported") setNotice(localization.ImportDone[language]);
    else if (result === "invalid")
      setNotice(localization.ImportFailed[language]);
  };
  return (
    <ThemeView>
      <PageHeader title={localization.Settings[language]} />
      <ConfirmationDialog
        visible={importing}
        setVisible={setImporting}
        title={localization.ImportBackup[language]}
        message={localization.ImportBackupMessage[language]}
        confirmLabel={localization.Import[language]}
        onConfirm={importBackup}
      >
        <Button
          mode="outlined"
          icon="export"
          onPress={async () => {
            setImporting(false);
            // Back to the question once the backup is saved.
            if (await exportBackup()) setImporting(true);
          }}
        >
          {localization.ExportFirst[language]}
        </Button>
      </ConfirmationDialog>
      <Snackbar visible={!!notice} onDismiss={() => setNotice("")}>
        {notice}
      </Snackbar>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View>
          <SectionHeading title={localization.Language[language]} />
          <View style={styles.row}>
            {languagesList.map(option => (
              <FilterChip
                key={option.value}
                label={option.label}
                selected={language === option.value}
                onPress={() => dispatch(changeLanguage({ lang: option.value }))}
              />
            ))}
          </View>
        </View>
        <View>
          <SectionHeading title={localization.Display[language]} />
          <ListRow
            title={localization.RecentUsage[language]}
            subtitle={localization.RecentUsageHelp[language]}
            switchValue={checkedHeatMap}
            onSwitch={value => {
              setCheckedHeatMap(value);
              dispatch(setHeatMap({ enableHeatMap: value }));
            }}
          />
        </View>
        <View>
          <SectionHeading title={localization.Backup[language]} />
          <View style={styles.row}>
            <Button
              onPress={exportBackup}
              mode="outlined"
              style={styles.backupButton}
            >
              {localization.Export[language]}
            </Button>
            <Button
              onPress={() => setImporting(true)}
              mode="outlined"
              style={styles.backupButton}
            >
              {localization.Import[language]}
            </Button>
          </View>
          <ThemeText customStyle={styles.hint}>
            {localization.BackupHint[language]}
          </ThemeText>
        </View>
        <View>
          <SectionHeading title={localization.PhotoTools[language]} />
          <BulkBackgroundRemoval language={language} />
        </View>
        <View>
          <SectionHeading title={localization.Updates[language]} />
          <UpdateControls settings />
        </View>
      </ScrollView>
    </ThemeView>
  );
};
const styles = StyleSheet.create({
  container: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
    rowGap: theme.spacing.md,
  },
  row: {
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  backupButton: {
    flex: 1,
  },
  hint: {
    ...captionText,
    marginTop: theme.spacing.sm,
  },
});
