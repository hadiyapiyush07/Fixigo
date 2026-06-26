import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { authAPI } from '../../api/auth.api';
import { showMessage } from 'react-native-flash-message';
import Button from '../../components/common/Button';
import Input  from '../../components/common/Input';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS } from '../../theme/typography';

const ForgotPasswordScreen = ({ navigation }) => {
  const [step, setStep] = useState(1); // 1: Phone, 2: OTP & New Password
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {
    if (!/^[6-9]\d{9}$/.test(phone)) {
      showMessage({ message: "Invalid Phone", description: "Enter valid 10-digit number", type: "warning" });
      return;
    }
    setLoading(true);
    try {
      const res = await authAPI.forgotPassword(phone);
      const mockOtp = res.data?.data?.mockOtp;
      
      showMessage({ message: "OTP Sent", type: "success" });
      
      if (mockOtp) {
        setTimeout(() => {
          Alert.alert("Demo Mode Active", `Your OTP is: ${mockOtp}`);
        }, 500);
      }
      
      setStep(2);
    } catch (error) {
      showMessage({ message: "Failed", description: error.response?.data?.message || "User not found", type: "danger" });
    }
    setLoading(false);
  };

  const handleResetPassword = async () => {
    if (otp.length !== 6) {
      showMessage({ message: "Invalid OTP", type: "warning" });
      return;
    }
    if (password.length < 6 || password !== confirmPassword) {
      showMessage({ message: "Invalid Password", description: "Must be 6 chars and match confirm", type: "warning" });
      return;
    }
    setLoading(true);
    try {
      await authAPI.resetPassword(phone, otp, password);
      showMessage({ message: "Password Reset Successful", description: "You can now login", type: "success" });
      navigation.navigate('Login');
    } catch (error) {
      showMessage({ message: "Failed", description: error.response?.data?.message || "Reset failed", type: "danger" });
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: COLORS.white }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Forgot Password</Text>
          <Text style={styles.subtitle}>
            {step === 1 ? 'Enter your registered mobile number' : 'Enter OTP and new password'}
          </Text>
        </View>

        {step === 1 ? (
          <View style={styles.form}>
            <Input 
              label="Phone Number" 
              placeholder="9876543210" 
              value={phone} 
              onChangeText={setPhone} 
              keyboardType="phone-pad" 
              maxLength={10} 
            />
            <Button title="Send OTP" onPress={handleSendOtp} loading={loading} style={{ marginTop: SPACING.lg }} />
          </View>
        ) : (
          <View style={styles.form}>
            <Input 
              label="OTP" 
              placeholder="Enter 6-digit code" 
              value={otp} 
              onChangeText={setOtp} 
              keyboardType="number-pad" 
              maxLength={6} 
            />
            <Input 
              label="New Password" 
              placeholder="Enter strong password" 
              value={password} 
              onChangeText={setPassword} 
              secureTextEntry 
            />
            <Input 
              label="Confirm Password" 
              placeholder="Re-enter password" 
              value={confirmPassword} 
              onChangeText={setConfirmPassword} 
              secureTextEntry 
            />
            <Button title="Reset Password" onPress={handleResetPassword} loading={loading} style={{ marginTop: SPACING.lg }} />
          </View>
        )}

        <TouchableOpacity style={styles.backBtn} onPress={() => step === 2 ? setStep(1) : navigation.goBack()}>
          <Text style={styles.backText}>Back to {step === 2 ? 'Phone' : 'Login'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  content: { padding: SPACING.xl, paddingTop: Platform.OS === 'ios' ? 60 : 40 },
  header: { marginBottom: SPACING.xxl },
  title: { fontSize: 28, fontWeight: '800', color: COLORS.text, marginBottom: 8 },
  subtitle: { fontSize: FONT_SIZES.md, color: COLORS.textLight },
  form: { gap: SPACING.md },
  backBtn: { alignSelf: 'center', marginTop: SPACING.xxl },
  backText: { color: COLORS.primary, fontWeight: '600', fontSize: FONT_SIZES.md }
});

export default ForgotPasswordScreen;
