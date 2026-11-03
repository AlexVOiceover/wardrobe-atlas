import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MyTabs from "./BottomTabNav";
import { Category } from "../screens/stackNav/Category";
import { ItemForm } from "../screens/stackNav/ItemForm";
import { ItemSelector } from "../screens/stackNav/ItemSelector";
import { EventLogForm } from "../screens/stackNav/EventLogForm";
import { CollectionForm } from "../screens/stackNav/CollectionForm";
import { Settings } from "../screens/stackNav/Settings";
import { ClosetInfo } from "../screens/stackNav/ClosetInfo";
import { ManageCategories } from "../screens/stackNav/ManageCategories";
import { BulkModeForm } from "../screens/stackNav/BulkModeForm";
import { Wardrobes } from "../screens/stackNav/Wardrobes";
import { SuggestOutfit } from "../screens/stackNav/SuggestOutfit";
import { WardrobeProvider } from "../components/WardrobeSelector";
import { theme } from "../utils/theme";
export default function Navigator() {
  const Stack = createNativeStackNavigator();
  return (
    <WardrobeProvider>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            animation: "none",
            contentStyle: { backgroundColor: theme.colors.background },
          }}
        >
          <Stack.Screen
            name="StackNavHome"
            component={MyTabs}
            options={{ headerShown: false, orientation: "portrait" }}
          />
          <Stack.Screen
            name="Wardrobes"
            component={Wardrobes}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="CollectionForm"
            component={CollectionForm}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Settings"
            component={Settings}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ClosetInfo"
            component={ClosetInfo}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Category"
            component={Category}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="SuggestOutfit"
            component={SuggestOutfit}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ManageCategories"
            component={ManageCategories}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="BulkModeForm"
            component={BulkModeForm}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ItemSelector"
            component={ItemSelector}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ItemForm"
            component={ItemForm}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="EventLogForm"
            component={EventLogForm}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </WardrobeProvider>
  );
}
