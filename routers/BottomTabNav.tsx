import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { AddNewCloths } from "../screens/bottomNav/AddNewCloths";
import { HomeBottom } from "../screens/bottomNav/HomeBottom";
import { OutfitLog } from "../screens/bottomNav/OutfitLog";
import { localization } from "../utils/localization";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
const Tab = createBottomTabNavigator();
export default function MyTabs() {
  const { language } = useSelector((s: RootState) => s.settings);
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        animation: "none",
        tabBarIcon: () => null,
        tabBarIconStyle: { display: "none" },
        tabBarActiveTintColor: "#111111",
        tabBarInactiveTintColor: "#555555",
        tabBarActiveBackgroundColor: "#eeeeee",
        tabBarStyle: { backgroundColor: "#ffffff" },
      }}
    >
      <Tab.Screen
        name={localization.My_closet[language]}
        component={HomeBottom}
      />
      <Tab.Screen name="Add" component={AddNewCloths} />
      <Tab.Screen
        name={localization.Outfit_Log[language]}
        component={OutfitLog}
      />
    </Tab.Navigator>
  );
}
