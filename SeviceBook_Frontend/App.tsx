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
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { navigationRef } from './src/navigation/RootNavigation';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import store from './src/store/index';
import AppNavigator from './src/navigation/AppNavigator';
import ErrorBoundary from './src/components/common/ErrorBoundary';
import FlashMessage from 'react-native-flash-message';

const App = () => {
  return (
    // GestureHandlerRootView — required for react-native-gesture-handler
    // Must wrap everything at the root level
    <GestureHandlerRootView style={{ flex: 1 }}>

      {/* Redux Provider — makes global state available to all screens */}
      <Provider store={store}>

        {/* SafeAreaProvider — handles phone notch, status bar, home indicator */}
        <SafeAreaProvider>

          {/* Status bar — white text on colored background */}
          <StatusBar
            barStyle="dark-content"
            backgroundColor="#FFFFFF"
            translucent={false}
          />

          {/* NavigationContainer — required root for all navigation */}
          <NavigationContainer ref={navigationRef}>
            <ErrorBoundary>
              <AppNavigator />
            </ErrorBoundary>
          </NavigationContainer>
          <FlashMessage position="top" />
        </SafeAreaProvider>
      </Provider> 
    </GestureHandlerRootView>
  );
};

export default App;
