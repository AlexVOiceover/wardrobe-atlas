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
import { theme } from "./utils/theme";
function App(): ReactElement {
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
                primary: theme.colors.text,
                onPrimary: theme.colors.background,
                secondary: theme.colors.muted,
                secondaryContainer: theme.colors.surface,
                onSecondaryContainer: theme.colors.text,
                background: theme.colors.background,
                surface: theme.colors.background,
                surfaceVariant: theme.colors.surface,
                onSurface: theme.colors.text,
                onSurfaceVariant: theme.colors.muted,
                outline: theme.colors.muted,
                error: theme.colors.danger,
                primaryContainer: theme.colors.surface,
                onPrimaryContainer: theme.colors.text,
                tertiary: theme.colors.text,
                tertiaryContainer: theme.colors.surface,
                onTertiary: theme.colors.background,
                onTertiaryContainer: theme.colors.text,
                errorContainer: theme.colors.surface,
                onErrorContainer: theme.colors.danger,
                onError: theme.colors.background,
                inverseSurface: theme.colors.text,
                inverseOnSurface: theme.colors.background,
                inversePrimary: theme.colors.background,
                elevation: {
                  level0: "transparent",
                  level1: theme.colors.background,
                  level2: theme.colors.background,
                  level3: theme.colors.background,
                  level4: theme.colors.background,
                  level5: theme.colors.background,
                },
              },
            }}
          >
            {/* The safe-area padding behind the status bar and system navigation
                buttons takes the bar color, so the header and tab bar run to the edges. */}
            <SafeAreaView style={[{ flex: 1, backgroundColor: theme.colors.bar }]}>
              <StatusBar
                barStyle="light-content"
                backgroundColor={theme.colors.bar}
              />
              <GestureHandlerRootView
                style={{ flex: 1, backgroundColor: theme.colors.background }}
              >
                <Navigator />
                {/* Floats over the screens; never pushes them down. */}
                <UpdateControls />
              </GestureHandlerRootView>
            </SafeAreaView>
          </PaperProvider>
        </PersistGate>
      </ReduxProvider>
    </SafeAreaProvider>
  );
}
export default App;
