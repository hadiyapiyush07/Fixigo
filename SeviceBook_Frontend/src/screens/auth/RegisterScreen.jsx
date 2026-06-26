import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, KeyboardAvoidingView, Platform
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser } from '../../store/slices/authSlice';
import { showMessage } from 'react-native-flash-message';
import Button from '../../components/common/Button';
import Input  from '../../components/common/Input';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS } from '../../theme/typography';

const getPasswordStrength = (pass) => {
  if (!pass) return { score: 0, text: '', color: COLORS.grey };
  let score = 0;
  if (pass.length > 5) score += 1;
  if (pass.length > 8) score += 1;
  if (/[A-Z]/.test(pass)) score += 1;
  if (/[0-9]/.test(pass)) score += 1;
  if (/[^A-Za-z0-9]/.test(pass)) score += 1;

  if (score < 3) return { score, text: 'Weak', color: '#EF4444' };
  if (score < 5) return { score, text: 'Medium', color: '#F59E0B' };
  return { score, text: 'Strong', color: '#10B981' };
};

const RegisterScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { isLoading } = useSelector(s => s.auth);

  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '', confirmPassword: '', role: 'customer',
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.name || form.name.trim().length < 3) e.name = 'Name must be at least 3 characters';
    else if (!/^[a-zA-Z\s]+$/.test(form.name)) e.name = 'Only alphabets and spaces allowed';

    if (!form.email || !/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Enter a valid email address';
    if (!form.phone || !/^[6-9]\d{9}$/.test(form.phone)) e.phone = 'Enter valid 10-digit Indian number';
    
    if (!form.password || form.password.length < 6) e.password = 'Password must be at least 6 characters';
    else if (!/[A-Z]/.test(form.password) || !/[a-z]/.test(form.password) || !/[0-9]/.test(form.password) || !/[!@#$%^&*]/.test(form.password)) {
      e.password = 'Must contain uppercase, lowercase, number, and special character';
    }

    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    const { confirmPassword, ...data } = form;
    
    const resultAction = await dispatch(registerUser(data));
    if (registerUser.fulfilled.match(resultAction)) {
      showMessage({
        message: "Account created successfully",
        description: "Please login to continue.",
        type: "success",
        duration: 3000,
      });
      navigation.navigate('Login');
    } else {
      showMessage({
        message: "Registration Failed",
        description: resultAction.payload || "Something went wrong",
        type: "danger",
      });
    }
  };

  const strength = getPasswordStrength(form.password);

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: COLORS.white }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join Fixigo today</Text>
        </View>

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
          <Input label="Full Name" placeholder="Ravi Kumar" value={form.name} onChangeText={t => setForm({...form, name: t})} autoCapitalize="words" error={errors.name} />
          <Input label="Email" placeholder="ravi@example.com" value={form.email} onChangeText={t => setForm({...form, email: t})} keyboardType="email-address" error={errors.email} />
          <Input label="Phone Number" placeholder="9876543210" value={form.phone} onChangeText={t => setForm({...form, phone: t})} keyboardType="phone-pad" maxLength={10} error={errors.phone} />
          
          <Input label="Password" placeholder="Strong password" value={form.password} onChangeText={t => setForm({...form, password: t})} secureTextEntry error={errors.password} />
          {form.password.length > 0 && (
            <View style={styles.strengthContainer}>
              <View style={styles.strengthBars}>
                <View style={[styles.bar, strength.score >= 1 && { backgroundColor: strength.color }]} />
                <View style={[styles.bar, strength.score >= 3 && { backgroundColor: strength.color }]} />
                <View style={[styles.bar, strength.score >= 5 && { backgroundColor: strength.color }]} />
              </View>
              <Text style={[styles.strengthText, { color: strength.color }]}>{strength.text}</Text>
            </View>
          )}

          <Input label="Confirm Password" placeholder="Re-enter password" value={form.confirmPassword} onChangeText={t => setForm({...form, confirmPassword: t})} secureTextEntry error={errors.confirmPassword} />

          <Button title="Create Account" onPress={handleRegister} loading={isLoading} disabled={isLoading} style={{ marginTop: SPACING.lg }} />
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
  container: { flex: 1, backgroundColor: COLORS.white },
  content: { padding: SPACING.xl, paddingBottom: SPACING.xxl * 2 },
  header: { marginBottom: SPACING.xl, marginTop: Platform.OS === 'ios' ? 40 : 20 },
  title: { fontSize: 28, fontWeight: '800', color: COLORS.text, marginBottom: 8 },
  subtitle: { fontSize: FONT_SIZES.md, color: COLORS.textLight },
  roleRow: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.xl },
  roleBtn: { flex: 1, paddingVertical: SPACING.md, borderRadius: BORDER_RADIUS.md, borderWidth: 1.5, borderColor: COLORS.border, alignItems: 'center' },
  roleBtnActive: { borderColor: COLORS.primary, backgroundColor: `${COLORS.primary}10` },
  roleText: { fontSize: FONT_SIZES.md, fontWeight: '600', color: COLORS.textLight },
  roleTextActive: { color: COLORS.primary },
  form: { gap: SPACING.md },
  strengthContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: -10, marginBottom: 10 },
  strengthBars: { flexDirection: 'row', gap: 5, flex: 1, marginRight: 15 },
  bar: { height: 4, flex: 1, backgroundColor: '#E5E7EB', borderRadius: 2 },
  strengthText: { fontSize: 12, fontWeight: '600' },
  loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: SPACING.xxl },
  loginText: { color: COLORS.textLight, fontSize: FONT_SIZES.md },
  loginLink: { color: COLORS.primary, fontSize: FONT_SIZES.md, fontWeight: '700' },
});

export default RegisterScreen;
