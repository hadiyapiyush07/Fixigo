import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, Alert,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator
} from 'react-native';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import { useDispatch, useSelector } from 'react-redux';
import { updateUser } from '../../store/slices/authSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../../theme/typography';
import { Avatar } from '../../components/ui/Avatar';
import { ChevronLeft, User, Mail, Phone } from 'lucide-react-native';
import { PrimaryButton } from '../../components/ui/PrimaryButton';

const EditProfileScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name.trim() || !email.trim() || !phone.trim()) {
      return Alert.alert('Validation Error', 'All fields are required.');
    }

    setLoading(true);
    try {
      const updatedData = { name, email, phone };
      dispatch(updateUser(updatedData));
      
      const storedUser = await AsyncStorage.getItem('user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        await AsyncStorage.setItem('user', JSON.stringify({ ...parsedUser, ...updatedData }));
      }
      
      Alert.alert('Success', 'Profile updated successfully!', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (e) {
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
    <KeyboardAvoidingView style={styles.safe} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft size={28} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        
        {/* Avatar Section */}
        <Animated.View entering={FadeInUp.delay(100).springify()} style={styles.avatarSection}>
          <View style={styles.avatarWrapper}>
            <Avatar name={name} size={110} />
            <TouchableOpacity style={styles.editBadge}>
              <Text style={styles.editBadgeIcon}>✏️</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Form Fields */}
        <Animated.View entering={FadeInUp.delay(200).springify()} style={styles.formSection}>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <View style={styles.inputWrapper}>
              <User size={20} color={COLORS.textTertiary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter your full name"
                placeholderTextColor={COLORS.textTertiary}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <View style={styles.inputWrapper}>
              <Mail size={20} color={COLORS.textTertiary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                placeholderTextColor={COLORS.textTertiary}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <View style={styles.inputWrapper}>
              <Phone size={20} color={COLORS.textTertiary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="Enter your phone number"
                placeholderTextColor={COLORS.textTertiary}
                keyboardType="phone-pad"
              />
            </View>
          </View>

        </Animated.View>
      </ScrollView>

      {/* Footer */}
      <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.footer}>
        <PrimaryButton 
          title="Save Changes" 
          onPress={handleSave} 
          loading={loading}
        />
      </Animated.View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', 
    paddingHorizontal: SPACING.lg, paddingTop: Platform.OS === 'ios' ? 60 : SPACING.xxl, paddingBottom: SPACING.md 
  },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center', ...SHADOWS.sm },
  headerTitle: { fontSize: FONT_SIZES.xl, fontWeight: '800', color: COLORS.textPrimary },
  
  content: { padding: SPACING.xl },
  
  avatarSection: { alignItems: 'center', marginBottom: SPACING.xxxl, marginTop: SPACING.lg },
  avatarWrapper: { position: 'relative' },
  editBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: COLORS.white, width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', ...SHADOWS.md, borderWidth: 1, borderColor: COLORS.border },
  editBadgeIcon: { fontSize: 16 },

  formSection: { gap: SPACING.lg },
  inputGroup: { gap: 8 },
  label: { fontSize: FONT_SIZES.sm, fontWeight: '700', color: COLORS.textSecondary, marginLeft: 4 },
  
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.surface, borderWidth: 1.5, borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.lg, paddingHorizontal: SPACING.md, height: 56
  },
  inputIcon: { marginRight: SPACING.sm },
  input: { flex: 1, fontSize: FONT_SIZES.md, color: COLORS.textPrimary, fontWeight: '600' },

  footer: { padding: SPACING.lg, paddingBottom: Platform.OS === 'ios' ? 32 : SPACING.lg, backgroundColor: COLORS.surface, borderTopWidth: 1, borderTopColor: COLORS.border },
});

export default EditProfileScreen;
