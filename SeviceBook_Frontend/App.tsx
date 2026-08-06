/**
 * App.tsx — Root component of ServiceBook app
 *
 * WHAT THIS FILE DOES:
 * 1. Wraps everything in Redux Provider (global state)
 * 2. Wraps in NavigationContainer (enables navigation)
 * 3. Wraps in SafeAreaProvider (handles notch/status bar on all phones)
 * 4. Renders AppNavigator which decides which screens to show
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { navigationRef } from './src/navigation/RootNavigation';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import store from './src/store/index';
import AppNavigator from './src/navigation/AppNavigator';
import ErrorBoundary from './src/components/common/ErrorBoundary';
import FlashMessage from 'react-native-flash-message';
import NotificationService from './src/services/NotificationService';
import { ThemeProvider } from './src/theme/ThemeContext';

const App = () => {
  React.useEffect(() => {
    NotificationService.setupChannels();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <SafeAreaProvider>
          <ThemeProvider>
            <NavigationContainer ref={navigationRef}>
              <ErrorBoundary>
                <AppNavigator />
              </ErrorBoundary>
            </NavigationContainer>
            <FlashMessage position="top" />
          </ThemeProvider>
        </SafeAreaProvider>
      </Provider> 
    </GestureHandlerRootView>
  );
};

export default App;
