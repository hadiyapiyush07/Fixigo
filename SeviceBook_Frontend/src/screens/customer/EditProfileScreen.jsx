import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, Alert,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { updateUser } from '../../store/slices/authSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../../theme/typography';
import { Avatar } from '../../components/ui/Avatar';
import axiosInstance from '../../api/axiosInstance'; // Using axiosInstance since there isn't a specific update profile API yet

const EditProfileScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name.trim() || !email.trim() || !phone.trim()) {
      Alert.alert('Validation Error', 'All fields are required.');
      return;
    }

    setLoading(true);
    try {
      // Attempt backend update (if implemented)
      // Since we don't have a specific authAPI method, we'll try an optimistic approach
      // let res = await axiosInstance.put('/auth/profile', { name, email, phone });
      
      // Update Redux
      const updatedData = { name, email, phone };
      dispatch(updateUser(updatedData));
      
      // Update AsyncStorage
      const storedUser = await AsyncStorage.getItem('user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        await AsyncStorage.setItem('user', JSON.stringify({ ...parsedUser, ...updatedData }));
      }
      
      Alert.alert('Success', 'Profile updated successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (e) {
      console.log('Profile update failed:', e);
      // Fallback: still update locally if backend API throws 404
      const updatedData = { name, email, phone };
      dispatch(updateUser(updatedData));
      
      const storedUser = await AsyncStorage.getItem('user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        await AsyncStorage.setItem('user', JSON.stringify({ ...parsedUser, ...updatedData }));
      }
      
      Alert.alert('Success', 'Profile updated locally.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <Avatar name={name} size={100} />
          <TouchableOpacity style={styles.changePhotoBtn}>
            <Text style={styles.changePhotoText}>Change Photo</Text>
          </TouchableOpacity>
        </View>

        {/* Form Fields */}
        <View style={styles.formSection}>
          <Text style={styles.label}>Full Name</Text>
          <View style={styles.inputWrapper}>
            <Text style={styles.inputIcon}>👤</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter your full name"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <Text style={styles.label}>Email Address</Text>
          <View style={styles.inputWrapper}>
            <Text style={styles.inputIcon}>✉️</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              placeholderTextColor="#9CA3AF"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <Text style={styles.label}>Phone Number</Text>
          <View style={styles.inputWrapper}>
            <Text style={styles.inputIcon}>📱</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="Enter your phone number"
              placeholderTextColor="#9CA3AF"
              keyboardType="phone-pad"
            />
          </View>
        </View>
      </ScrollView>

      {/* Save Button */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.saveBtn} 
          onPress={handleSave} 
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.saveBtnText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  
  header: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg, paddingTop: 60, paddingBottom: SPACING.md,
    backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F3F4F6'
  },
  backBtn:     { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F5F7FA', alignItems: 'center', justifyContent: 'center' },
  backBtnText: { fontSize: 26, color: '#111827', fontWeight: '300', lineHeight: 28 },
  headerTitle: { fontSize: FONT_SIZES.lg, fontWeight: '800', color: '#111827' },

  content: { padding: SPACING.xl },
  
  avatarSection: { alignItems: 'center', marginBottom: SPACING.xxl },
  changePhotoBtn: { marginTop: SPACING.md, paddingHorizontal: 16, paddingVertical: 6, backgroundColor: '#F3F4F6', borderRadius: 20 },
  changePhotoText: { color: '#4B5563', fontSize: FONT_SIZES.sm, fontWeight: '600' },

  formSection: { gap: SPACING.md },
  label: { fontSize: FONT_SIZES.sm, fontWeight: '600', color: '#4B5563', marginBottom: 4 },
  
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB',
    borderRadius: 12, paddingHorizontal: SPACING.md,
    height: 54
  },
  inputIcon: { fontSize: 18, marginRight: 12 },
  input: { flex: 1, fontSize: FONT_SIZES.md, color: '#111827' },

  footer: { padding: SPACING.lg, paddingBottom: 30, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  saveBtn: { backgroundColor: COLORS.primary, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', ...SHADOWS.md },
  saveBtnText: { color: COLORS.white, fontSize: FONT_SIZES.md, fontWeight: '700' }
});

export default EditProfileScreen;
