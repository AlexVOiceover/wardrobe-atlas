import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Icon from "react-native-vector-icons/Ionicons";
import { HomeBottom } from "../screens/bottomNav/HomeBottom";
import { Collections } from "../screens/bottomNav/Collections";
import { More } from "../screens/bottomNav/More";
import { OutfitLog } from "../screens/bottomNav/OutfitLog";
import { localization } from "../utils/localization";
import { theme } from "../utils/theme";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
const Tab = createBottomTabNavigator();
const tabIcon =
  (name: string) =>
  ({ color, size }: { color: string; size: number }) =>
    <Icon name={name} color={color} size={size} />;
export default function MyTabs() {
  const { language } = useSelector((s: RootState) => s.settings);
  return (
    <Tab.Navigator
      // The root SafeAreaView in App.tsx already pads above the system
      // navigation bar; adding the inset again leaves a gap under the tabs.
      safeAreaInsets={{ bottom: 0 }}
      screenOptions={{
        headerShown: false,
        animation: "none",
        // The app now rises above the keyboard; the tabs needn't ride on it.
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: theme.colors.onBar,
        tabBarInactiveTintColor: theme.colors.onBarMuted,
        tabBarStyle: {
          backgroundColor: theme.colors.bar,
          borderTopColor: theme.colors.bar,
          elevation: 0,
        },
      }}
    >
      <Tab.Screen
        name="Closet"
        component={HomeBottom}
        options={{
          title: localization.Closet[language],
          tabBarIcon: tabIcon("shirt-outline"),
        }}
      />
      <Tab.Screen
        name="Outfits"
        component={OutfitLog}
        options={{
          title: localization.Outfits[language],
          tabBarIcon: tabIcon("calendar-outline"),
        }}
      />
      <Tab.Screen
        name="Collections"
        component={Collections}
        options={{
          title: localization.Collections[language],
          tabBarIcon: tabIcon("albums-outline"),
        }}
      />
      <Tab.Screen
        name="More"
        component={More}
        options={{
          title: localization.More[language],
          tabBarIcon: tabIcon("ellipsis-horizontal"),
        }}
      />
    </Tab.Navigator>
  );
}
