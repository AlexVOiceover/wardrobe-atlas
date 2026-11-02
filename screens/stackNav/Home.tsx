import { updateLaundryReminder } from "../../utils/notifications";
import React, { useEffect, useMemo } from "react";
import MyTabs from "../../routers/BottomTabNav";
import { ThemeView } from "../../components/ThemeView";
import { PermissionsAndroid, Platform } from "react-native";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
export async function GetAllPermissions() {
  try {
    if (Platform.OS === "android") {
      const userResponse = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      ]);
      return userResponse;
    }
  } catch (err) {
    console.log(err);
  }
  return null;
}
export function Home() {
  const storedSettings = useSelector((state: RootState) => state.settings);
  const storedItems = useSelector((state: RootState) => state.itemsList.items);
  const numberOfLaundry = useMemo(() => {
    return storedItems.filter(
      item =>
        (item.laundryCounter ?? 0) >=
          (item.overrideMaxLaundry ?? false
            ? item.maxLaundryNumber
            : storedSettings.laundryNumber) &&
        (item.laundryable ?? true),
    ).length;
  }, [storedSettings.laundryNumber, storedItems]);
  useEffect(() => {
    GetAllPermissions();
  }, []);
  useEffect(() => {
    updateLaundryReminder(numberOfLaundry, storedSettings.enableLaundry);
  }, [storedSettings.enableLaundry, numberOfLaundry]);
  return (
    <ThemeView>
      <MyTabs />
    </ThemeView>
  );
}
