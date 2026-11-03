import { UpdateControls } from "../../components/UpdateControls";
import { View, StyleSheet, ScrollView } from "react-native";
import { ThemeView } from "../../components/ThemeView";
import { PageHeader } from "../../components/PageHeader";
import { useState } from "react";
import { languagesList } from "../../utils/data";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { CustomInput } from "../../components/CustomInput";
import {
  changeLanguage,
  setHeatMap,
  userNameSetter,
} from "../../redux/settingsSlice";
import { Button, Snackbar, Switch } from "react-native-paper";
import { exportStoreToJson } from "../../utils/exportStoreToJson";
import { importStoreFromJson } from "../../utils/importStoreFromJson";
import { localization } from "../../utils/localization";
import { theme } from "../../utils/theme";
import { FilterChip } from "../../components/FilterChip";
import { ListRow } from "../../components/ListRow";
import { SectionHeading } from "../../components/SectionHeading";
import { BulkBackgroundRemoval } from "../../components/BulkBackgroundRemoval";
export const Settings = () => {
  const storedSettings = useSelector((state: RootState) => state.settings);
  const { language, name, enableHeatMap } = storedSettings;
  const dispatch = useDispatch();
  const [visible, setVisible] = useState(false);
  const onToggleSnackBar = () => setVisible(!visible);
  const onDismissSnackBar = () => setVisible(false);
  const [exportOrImport, setExportOrImport] = useState(0);
  const [checkedHeatMap, setCheckedHeatMap] = useState(enableHeatMap);
  const setCheckboxes = (newEnableHeatMap: boolean) => {
    setCheckedHeatMap(newEnableHeatMap);
  };
  return (
    <ThemeView>
      <PageHeader title={localization.Settings[language]} />
      <Snackbar visible={visible} onDismiss={onDismissSnackBar}>
        {exportOrImport === 0
          ? localization.ExportDone[language]
          : localization.ImportDone[language]}
      </Snackbar>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View>
          <SectionHeading title={localization.Profile[language]} />
          <CustomInput
            mode="outlined"
            textContentType="name"
            label={localization.Your_Name[language]}
            value={name}
            onChangeText={value => dispatch(userNameSetter({ name: value }))}
          />
        </View>
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
          <SectionHeading title={localization.Backup[language]} />
          <View style={styles.row}>
            <Button
              onPress={async () => {
                if (await exportStoreToJson()) {
                  setExportOrImport(0);
                  onToggleSnackBar();
                }
              }}
              mode="outlined"
              style={styles.backupButton}
            >
              {localization.Export[language]}
            </Button>
            <Button
              onPress={async () => {
                if (await importStoreFromJson(setCheckboxes)) {
                  setExportOrImport(1);
                  onToggleSnackBar();
                }
              }}
              mode="outlined"
              style={styles.backupButton}
            >
              {localization.Import[language]}
            </Button>
          </View>
        </View>
        <View>
          <SectionHeading title={localization.Photos[language]} />
          <BulkBackgroundRemoval language={language} />
        </View>
        <View>
          <SectionHeading title={localization.Display[language]} />
          <ListRow
            title={localization.RecentUsage[language]}
            subtitle={localization.RecentUsageHelp[language]}
            right={
              <Switch
                value={checkedHeatMap}
                onValueChange={value => {
                  setCheckedHeatMap(value);
                  dispatch(setHeatMap({ enableHeatMap: value }));
                }}
              />
            }
          />
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
});
