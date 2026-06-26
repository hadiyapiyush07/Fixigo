import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, KeyboardAvoidingView } from 'react-native';
import { authAPI } from '../../api/auth.api';
import { showMessage } from 'react-native-flash-message';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { COLORS, FONT_SIZES, SPACING } from '../../theme/typography';

const ChangePasswordScreen = ({ navigation }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      showMessage({ message: "All fields are required", type: "warning" });
      return;
    }
    if (newPassword !== confirmPassword) {
      showMessage({ message: "New passwords do not match", type: "warning" });
      return;
    }
    if (newPassword.length < 6 || !/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword) || !/[!@#$%^&*]/.test(newPassword)) {
      showMessage({ message: "Password too weak", description: "Must be at least 6 chars and contain uppercase, lowercase, number, and special character", type: "warning" });
      return;
    }

    setLoading(true);
    try {
      await authAPI.changePassword(currentPassword, newPassword);
      showMessage({ message: "Password Changed", description: "Your password has been updated successfully.", type: "success" });
      navigation.goBack();
    } catch (error) {
      showMessage({ message: "Update Failed", description: error.response?.data?.message || "Incorrect current password", type: "danger" });
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: COLORS.white }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>Change Password</Text>
          <Text style={styles.subtitle}>Create a new strong password</Text>
        </View>

        <View style={styles.form}>
          <Input 
            label="Current Password" 
            placeholder="Enter current password" 
            value={currentPassword} 
            onChangeText={setCurrentPassword} 
            secureTextEntry 
          />
          <Input 
            label="New Password" 
            placeholder="Min 6 characters" 
            value={newPassword} 
            onChangeText={setNewPassword} 
            secureTextEntry 
          />
          <Input 
            label="Confirm New Password" 
            placeholder="Re-enter new password" 
            value={confirmPassword} 
            onChangeText={setConfirmPassword} 
            secureTextEntry 
          />

          <Button 
            title="Update Password" 
            onPress={handleChangePassword} 
            loading={loading} 
            disabled={loading} 
            style={{ marginTop: SPACING.lg }} 
          />
        </View>
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
});

export default ChangePasswordScreen;
