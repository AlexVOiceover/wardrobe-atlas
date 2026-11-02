import { AppHeader } from "./components/AppHeader";
import { UpdateControls } from "./components/UpdateControls";
import { StatusBar } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import Navigator from "./routers/stack";
import { MD3LightTheme, PaperProvider } from "react-native-paper";
import { ReactElement, useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Provider as ReduxProvider } from "react-redux";
import { store, persistor } from "./redux/store";
import { PersistGate } from "redux-persist/integration/react";
import { startAutomaticUpdates } from "./utils/updateService";
function App(): ReactElement {
  const backgroundStyle = {
    backgroundColor: "#ffffff",
  };
  useEffect(() => startAutomaticUpdates(), []);
  return (
    <SafeAreaProvider>
      <ReduxProvider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <PaperProvider
            theme={{
              ...MD3LightTheme,
              roundness: 0,
              animation: { scale: 0 },
              colors: {
                ...MD3LightTheme.colors,
                primary: "#111111",
                onPrimary: "#ffffff",
                secondary: "#333333",
                secondaryContainer: "#eeeeee",
                onSecondaryContainer: "#111111",
                background: "#ffffff",
                surface: "#ffffff",
                surfaceVariant: "#eeeeee",
                onSurface: "#111111",
                onSurfaceVariant: "#333333",
                outline: "#666666",
                error: "#111111",
                primaryContainer: "#eeeeee",
                onPrimaryContainer: "#111111",
                tertiary: "#111111",
                tertiaryContainer: "#eeeeee",
                onTertiary: "#ffffff",
                onTertiaryContainer: "#111111",
                errorContainer: "#eeeeee",
                onErrorContainer: "#111111",
                onError: "#ffffff",
                inverseSurface: "#333333",
                inverseOnSurface: "#ffffff",
                inversePrimary: "#ffffff",
                elevation: {
                  level0: "transparent",
                  level1: "#ffffff",
                  level2: "#ffffff",
                  level3: "#ffffff",
                  level4: "#ffffff",
                  level5: "#ffffff",
                },
              },
            }}
          >
            <SafeAreaView style={[{ flex: 1 }]}>
              <StatusBar
                barStyle="dark-content"
                backgroundColor={backgroundStyle.backgroundColor}
              />
              <GestureHandlerRootView style={{ flex: 1 }}>
                <AppHeader />
                <UpdateControls />
                <Navigator />
              </GestureHandlerRootView>
            </SafeAreaView>
          </PaperProvider>
        </PersistGate>
      </ReduxProvider>
    </SafeAreaProvider>
  );
}
export default App;
