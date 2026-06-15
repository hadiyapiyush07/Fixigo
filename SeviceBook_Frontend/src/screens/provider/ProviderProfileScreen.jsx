import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser } from '../../store/slices/authSlice';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS } from '../../theme/typography';

const ProviderProfileScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { user } = useSelector(s => s.auth);

const handleLogout = () => {
  Alert.alert('Logout', 'Are you sure?', [
    { text: 'Cancel', style: 'cancel' },
    {
      text: 'Logout',
      style: 'destructive',
      onPress: () => {
        dispatch(logoutUser());
      },
    },
  ]);
};

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase()}</Text>
        </View>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <Text style={styles.phone}>📱 {user?.phone}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>🔧 Service Provider</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>🚪 Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: COLORS.background },
  header:     { backgroundColor: COLORS.primary, alignItems: 'center', paddingTop: 60, paddingBottom: 40 },
  avatar:     { width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center', marginBottom: 12, borderWidth: 3, borderColor: COLORS.white },
  avatarText: { fontSize: 38, fontWeight: '800', color: COLORS.white },
  name:       { fontSize: FONT_SIZES.xxl, fontWeight: '800', color: COLORS.white },
  email:      { fontSize: FONT_SIZES.sm, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  phone:      { fontSize: FONT_SIZES.sm, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  badge:      { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 16, paddingVertical: 4, borderRadius: 20, marginTop: 12 },
  badgeText:  { color: COLORS.white, fontSize: FONT_SIZES.sm, fontWeight: '600' },
  logoutBtn:  { margin: SPACING.xl, backgroundColor: COLORS.errorLight, padding: SPACING.lg, borderRadius: BORDER_RADIUS.lg, alignItems: 'center' },
  logoutText: { color: COLORS.error, fontWeight: '700', fontSize: FONT_SIZES.lg },
});

export default ProviderProfileScreen;