// src/screens/auth/SplashScreen.jsx
// This screen only loads stored auth from AsyncStorage.
// AppNavigator handles ALL navigation automatically based on isLoggedIn state.
// No navigation.replace() needed here anymore.

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useDispatch } from 'react-redux';
import { loadStoredAuth } from '../../store/slices/authSlice';
import { COLORS, FONT_SIZES, SPACING } from '../../theme/typography';

const SplashScreen = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    // Load token from AsyncStorage
    // When this completes → isInitialized becomes true in Redux
    // → AppNavigator re-renders → shows correct screen automatically
    dispatch(loadStoredAuth());
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.logoBox}>
        <Text style={styles.logo}>🏠</Text>
        <Text style={styles.appName}>ServiceBook</Text>
        <Text style={styles.tagline}>Home Services at your doorstep</Text>
      </View>
      <ActivityIndicator
        color={COLORS.white}
        size="large"
        style={styles.loader}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex:            1,
    backgroundColor: COLORS.primary,
    alignItems:      'center',
    justifyContent:  'center',
  },
  logoBox:  { alignItems: 'center' },
  logo:     { fontSize: 72, marginBottom: SPACING.lg },
  appName:  { fontSize: FONT_SIZES.huge, fontWeight: '800', color: COLORS.white },
  tagline:  { fontSize: FONT_SIZES.md, color: 'rgba(255,255,255,0.8)', marginTop: SPACING.sm },
  loader:   { marginTop: SPACING.xxxl },
});

export default SplashScreen;
