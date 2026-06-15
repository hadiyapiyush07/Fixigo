// src/screens/auth/RegisterScreen.jsx
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser, clearError } from '../../store/slices/authSlice';
import Button from '../../components/common/Button';
import Input  from '../../components/common/Input';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS } from '../../theme/typography';

const RegisterScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { isLoading, error } = useSelector(s => s.auth);
  // NOTE: No isLoggedIn check — AppNavigator handles redirect automatically

  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '', confirmPassword: '',
    role: 'customer',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (error) {
      Alert.alert('Registration Failed', error);
      dispatch(clearError());
    }
  }, [error]);

  const validate = () => {
    const e = {};
    if (!form.name || form.name.length < 2)       e.name            = 'Name must be at least 2 characters';
    if (!form.email || !form.email.includes('@'))  e.email           = 'Enter a valid email address';
    if (!form.phone || form.phone.length !== 10)   e.phone           = 'Enter valid 10-digit phone number';
    if (!form.password || form.password.length < 6) e.password       = 'Password must be at least 6 characters';
    if (form.password !== form.confirmPassword)    e.confirmPassword = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = () => {
    if (!validate()) return;
    const { confirmPassword, ...data } = form;
    // Dispatch register — when fulfilled, isLoggedIn becomes true
    // AppNavigator automatically shows correct tabs
    dispatch(registerUser(data));
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
        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join ServiceBook today</Text>
        </View>

        {/* Role Toggle */}
        <View style={styles.roleRow}>
          {['customer', 'provider'].map((r) => (
            <TouchableOpacity
              key={r}
              style={[styles.roleBtn, form.role === r && styles.roleBtnActive]}
              onPress={() => setForm({ ...form, role: r })}
            >
              <Text style={[styles.roleText, form.role === r && styles.roleTextActive]}>
                {r === 'customer' ? '👤 Customer' : '🔧 Service Provider'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.form}>
          <Input label="Full Name"        placeholder="Ravi Kumar"           value={form.name}            onChangeText={t => setForm({...form, name: t})}            autoCapitalize="words"       error={errors.name} />
          <Input label="Email"            placeholder="ravi@example.com"     value={form.email}           onChangeText={t => setForm({...form, email: t})}           keyboardType="email-address" error={errors.email} />
          <Input label="Phone Number"     placeholder="9876543210"           value={form.phone}           onChangeText={t => setForm({...form, phone: t})}           keyboardType="phone-pad" maxLength={10} error={errors.phone} />
          <Input label="Password"         placeholder="Min 6 characters"     value={form.password}        onChangeText={t => setForm({...form, password: t})}        secureTextEntry              error={errors.password} />
          <Input label="Confirm Password" placeholder="Re-enter password"    value={form.confirmPassword} onChangeText={t => setForm({...form, confirmPassword: t})} secureTextEntry              error={errors.confirmPassword} />

          <Button
            title="Create Account"
            onPress={handleRegister}
            loading={isLoading}
            style={{ marginTop: SPACING.sm }}
          />
        </View>

        <View style={styles.loginRow}>
          <Text style={styles.loginText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginLink}>Login</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content:   { padding: SPACING.xl, paddingTop: SPACING.xxxl },

  header:   { marginBottom: SPACING.xl },
  title:    { fontSize: FONT_SIZES.xxxl, fontWeight: '800', color: COLORS.textPrimary },
  subtitle: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary, marginTop: SPACING.xs },

  roleRow: { flexDirection: 'row', marginBottom: SPACING.xl, gap: SPACING.md },
  roleBtn: { flex: 1, paddingVertical: SPACING.md, borderRadius: BORDER_RADIUS.md, borderWidth: 1.5, borderColor: COLORS.border, alignItems: 'center', backgroundColor: COLORS.white },
  roleBtnActive:  { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  roleText:       { fontSize: FONT_SIZES.sm, fontWeight: '600', color: COLORS.textSecondary },
  roleTextActive: { color: COLORS.primary },

  form: { backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.xl, padding: SPACING.xl, marginBottom: SPACING.xl },

  loginRow:  { flexDirection: 'row', justifyContent: 'center', marginBottom: SPACING.xxxl },
  loginText: { color: COLORS.textSecondary, fontSize: FONT_SIZES.md },
  loginLink: { color: COLORS.primary, fontWeight: '700', fontSize: FONT_SIZES.md },
});

export default RegisterScreen;
