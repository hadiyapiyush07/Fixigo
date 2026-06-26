import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, KeyboardAvoidingView, Platform
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser } from '../../store/slices/authSlice';
import { showMessage } from 'react-native-flash-message';
import Button from '../../components/common/Button';
import Input  from '../../components/common/Input';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS } from '../../theme/typography';

const LoginScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { isLoading, isLoggedIn } = useSelector(s => s.auth);

  const [form, setForm] = useState({ phoneOrEmail: '', password: '' });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    // If somehow isLoggedIn becomes true (e.g., from OTP screen), AppNavigator handles it
  }, [isLoggedIn]);

  const validate = () => {
    const e = {};
    if (!form.phoneOrEmail) e.phoneOrEmail = 'Email or Phone is required';
    if (!form.password) e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    
    let credentials = { password: form.password };
    if (form.phoneOrEmail.includes('@')) {
      credentials.email = form.phoneOrEmail;
    } else {
      credentials.phone = form.phoneOrEmail;
    }

    const resultAction = await dispatch(loginUser(credentials));
    if (loginUser.fulfilled.match(resultAction)) {
      // Navigate to OTP Screen with phone and mockOtp
      navigation.navigate('OtpVerification', { 
        phone: resultAction.payload.phone,
        mockOtp: resultAction.payload.mockOtp 
      });
    } else {
      setErrors({ apiError: resultAction.payload || "Invalid credentials" });
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: COLORS.white }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to Fixigo</Text>
        </View>

        <View style={styles.form}>
          {errors.apiError && (
            <Text style={styles.apiErrorText}>{errors.apiError}</Text>
          )}

          <Input 
            label="Email or Phone Number" 
            placeholder="Enter registered email or phone" 
            value={form.phoneOrEmail} 
            onChangeText={t => setForm({...form, phoneOrEmail: t})} 
            keyboardType="email-address" 
            autoCapitalize="none"
            error={errors.phoneOrEmail} 
          />
          <Input 
            label="Password" 
            placeholder="Enter password" 
            value={form.password} 
            onChangeText={t => setForm({...form, password: t})} 
            secureTextEntry 
            error={errors.password} 
          />

          <TouchableOpacity style={styles.forgotBtn} onPress={() => navigation.navigate('ForgotPassword')}>
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>

          <Button 
            title="Continue" 
            onPress={handleLogin} 
            loading={isLoading} 
            disabled={isLoading} 
            style={{ marginTop: SPACING.md }} 
          />
        </View>

        <View style={styles.registerRow}>
          <Text style={styles.registerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.registerLink}>Sign up</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  content: { padding: SPACING.xl, paddingBottom: SPACING.xxl * 2, justifyContent: 'center', minHeight: '100%' },
  header: { marginBottom: SPACING.xxl },
  title: { fontSize: 32, fontWeight: '800', color: COLORS.text, marginBottom: 8 },
  subtitle: { fontSize: FONT_SIZES.lg, color: COLORS.textLight },
  form: { gap: SPACING.md },
  apiErrorText: { color: '#EF4444', fontSize: FONT_SIZES.md, fontWeight: '600', marginBottom: SPACING.sm, textAlign: 'center' },
  forgotBtn: { alignSelf: 'flex-end', paddingVertical: 5 },
  forgotText: { color: COLORS.primary, fontWeight: '600', fontSize: FONT_SIZES.sm },
  registerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: SPACING.xxl },
  registerText: { color: COLORS.textLight, fontSize: FONT_SIZES.md },
  registerLink: { color: COLORS.primary, fontSize: FONT_SIZES.md, fontWeight: '700' },
});

export default LoginScreen;
