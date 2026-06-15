// src/screens/auth/LoginScreen.jsx
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, clearError } from '../../store/slices/authSlice';
import Button from '../../components/common/Button';
import Input  from '../../components/common/Input';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS } from '../../theme/typography';

const LoginScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { isLoading, error } = useSelector(s => s.auth);
  // NOTE: No isLoggedIn check here — AppNavigator handles redirect automatically

  const [form, setForm] = useState({ phone: '', password: '' });
  const [errors, setErrors] = useState({});

  // Show server error if any
  useEffect(() => {
    if (error) {
      Alert.alert('Login Failed', error);
      dispatch(clearError());
    }
  }, [error]);

  const validate = () => {
    const e = {};
    if (!form.phone || form.phone.length !== 10) {
      e.phone = 'Enter valid 10-digit phone number';
    }
    if (!form.password || form.password.length < 6) {
      e.password = 'Password must be at least 6 characters';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = () => {
    if (!validate()) return;
    // Dispatch login — when fulfilled, isLoggedIn becomes true
    // AppNavigator automatically shows CustomerTabs or ProviderTabs
    // No navigation.replace() needed here
    dispatch(loginUser({ phone: form.phone, password: form.password }));
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>🏠</Text>
          <Text style={styles.welcome}>Welcome back 👋</Text>
          <Text style={styles.subtitle}>Login to your ServiceBook account</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Input
            label="Phone Number"
            placeholder="Enter your 10-digit phone number"
            value={form.phone}
            onChangeText={(t) => setForm({ ...form, phone: t })}
            keyboardType="phone-pad"
            maxLength={10}
            error={errors.phone}
          />

          <Input
            label="Password"
            placeholder="Enter your password"
            value={form.password}
            onChangeText={(t) => setForm({ ...form, password: t })}
            secureTextEntry
            error={errors.password}
          />

          <Button
            title="Login"
            onPress={handleLogin}
            loading={isLoading}
            style={styles.loginBtn}
          />
        </View>

        {/* Register link */}
        <View style={styles.registerRow}>
          <Text style={styles.registerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.registerLink}>Register</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content:   { padding: SPACING.xl, paddingTop: SPACING.xxxl + SPACING.xl },

  header:   { alignItems: 'center', marginBottom: SPACING.xxxl },
  logo:     { fontSize: 64, marginBottom: SPACING.md },
  welcome:  { fontSize: FONT_SIZES.xxxl, fontWeight: '800', color: COLORS.textPrimary },
  subtitle: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary, marginTop: SPACING.sm },

  form:     { backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.xl, padding: SPACING.xl, marginBottom: SPACING.xl },
  loginBtn: { marginTop: SPACING.sm },

  registerRow:  { flexDirection: 'row', justifyContent: 'center' },
  registerText: { color: COLORS.textSecondary, fontSize: FONT_SIZES.md },
  registerLink: { color: COLORS.primary, fontWeight: '700', fontSize: FONT_SIZES.md },
});

export default LoginScreen;
