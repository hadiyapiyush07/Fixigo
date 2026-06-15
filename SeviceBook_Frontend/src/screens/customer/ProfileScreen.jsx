// src/screens/customer/ProfileScreen.jsx
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert, Switch,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser } from '../../store/slices/authSlice';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../../theme/typography';

const ProfileScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { user } = useSelector(s => s.auth);
  const [notifications, setNotifications] = useState(true);

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

  const MenuItem = ({ icon, label, onPress, danger = false, right }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.menuLeft}>
        <Text style={styles.menuIcon}>{icon}</Text>
        <Text style={[styles.menuLabel, danger && { color: COLORS.error }]}>{label}</Text>
      </View>
      {right || <Text style={styles.menuArrow}>›</Text>}
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatarBox}>
          <Text style={styles.avatarText}>
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </Text>
        </View>
        <Text style={styles.name}>{user?.name || 'User'}</Text>
        <Text style={styles.email}>{user?.email || ''}</Text>
        <Text style={styles.phone}>📱 {user?.phone || ''}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>
            {user?.role === 'provider' ? '🔧 Service Provider' : '👤 Customer'}
          </Text>
        </View>
      </View>

      {/* Menu sections */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.menuCard}>
          <MenuItem icon="👤" label="Edit Profile"      onPress={() => {}} />
          <View style={styles.divider} />
          <MenuItem icon="📍" label="Saved Addresses"   onPress={() => {}} />
          <View style={styles.divider} />
          <MenuItem icon="🔒" label="Change Password"   onPress={() => {}} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        <View style={styles.menuCard}>
          <MenuItem
            icon="🔔"
            label="Push Notifications"
            right={
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ true: COLORS.primary }}
                thumbColor={COLORS.white}
              />
            }
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support</Text>
        <View style={styles.menuCard}>
          <MenuItem icon="❓" label="Help & FAQ"        onPress={() => {}} />
          <View style={styles.divider} />
          <MenuItem icon="📞" label="Contact Support"   onPress={() => {}} />
          <View style={styles.divider} />
          <MenuItem icon="⭐" label="Rate the App"      onPress={() => {}} />
          <View style={styles.divider} />
          <MenuItem icon="📄" label="Privacy Policy"    onPress={() => {}} />
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.menuCard}>
          <MenuItem icon="🚪" label="Logout" onPress={handleLogout} danger />
        </View>
      </View>

      <Text style={styles.version}>ServiceBook v1.0.0</Text>

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: COLORS.background },

  header: {
    backgroundColor: COLORS.primary,
    alignItems:      'center',
    paddingTop:      SPACING.xxxl + SPACING.xl,
    paddingBottom:   SPACING.xxxl,
    paddingHorizontal: SPACING.xl,
  },
  avatarBox: {
    width:           90,
    height:          90,
    borderRadius:    45,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:    SPACING.md,
    borderWidth:     3,
    borderColor:     COLORS.white,
  },
  avatarText:   { fontSize: 38, fontWeight: '800', color: COLORS.white },
  name:         { fontSize: FONT_SIZES.xxl, fontWeight: '800', color: COLORS.white, marginBottom: 4 },
  email:        { fontSize: FONT_SIZES.sm, color: 'rgba(255,255,255,0.8)', marginBottom: 2 },
  phone:        { fontSize: FONT_SIZES.sm, color: 'rgba(255,255,255,0.8)', marginBottom: SPACING.md },
  roleBadge:    { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.xs, borderRadius: BORDER_RADIUS.round },
  roleText:     { color: COLORS.white, fontSize: FONT_SIZES.sm, fontWeight: '600' },

  section:      { paddingHorizontal: SPACING.xl, marginTop: SPACING.xl },
  sectionTitle: { fontSize: FONT_SIZES.sm, fontWeight: '600', color: COLORS.textSecondary, marginBottom: SPACING.sm, textTransform: 'uppercase', letterSpacing: 0.5 },

  menuCard:     { backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.lg, ...SHADOWS.sm, overflow: 'hidden' },
  menuItem:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.lg },
  menuLeft:     { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  menuIcon:     { fontSize: 20 },
  menuLabel:    { fontSize: FONT_SIZES.md, color: COLORS.textPrimary, fontWeight: '500' },
  menuArrow:    { fontSize: 22, color: COLORS.textTertiary },
  divider:      { height: 1, backgroundColor: COLORS.divider, marginHorizontal: SPACING.lg },

  version:      { textAlign: 'center', color: COLORS.textTertiary, fontSize: FONT_SIZES.xs, marginVertical: SPACING.xxxl },
});

export default ProfileScreen;
