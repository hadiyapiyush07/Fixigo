// src/screens/customer/ProfileScreen.jsx
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser } from '../../store/slices/authSlice';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS } from '../../theme/typography';
import { Avatar } from '../../components/ui/Avatar';
import { Card } from '../../components/ui/Card';
import { PrimaryButton } from '../../components/ui/PrimaryButton';

const ProfileScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: () => dispatch(logoutUser()) 
        }
      ]
    );
  };

  const renderMenuItem = (icon, title, onPress, showBorder = true) => (
    <View style={styles.menuItemWrapper}>
      <TouchableOpacity 
        style={styles.menuItem} 
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={styles.menuIconBox}>
          <Text style={styles.menuIcon}>{icon}</Text>
        </View>
        <Text style={styles.menuText}>{title}</Text>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>
      {showBorder && <View style={styles.divider} />}
    </View>
  );

  return (
    <View style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        
        {/* Header Profile Section */}
        <Card style={styles.profileHeader}>
          <Avatar name={user?.name} size={80} />
          <Text style={styles.userName}>{user?.name || 'Guest User'}</Text>
          <Text style={styles.userEmail}>{user?.email || ''}</Text>
          <Text style={styles.userPhone}>{user?.phone || '+91 '}</Text>
          
          <PrimaryButton 
            title="Edit Profile" 
            variant="outline" 
            style={styles.editBtn} 
            textStyle={{ fontSize: FONT_SIZES.sm }}
            onPress={() => Alert.alert('Coming Soon', 'Profile editing will be available soon!')}
          />
        </Card>

        {/* Account Settings */}
        <Text style={styles.sectionTitle}>Account Settings</Text>
        <Card noPadding>
          {renderMenuItem('📍', 'Saved Addresses', () => Alert.alert('Coming Soon', 'Saved addresses will be available soon!'))}
          {renderMenuItem('🏷️', 'My Coupons', () => Alert.alert('Coming Soon', 'Coupons will be available soon!'))}
          {renderMenuItem('💳', 'Payment Methods', () => Alert.alert('Coming Soon', 'Payment methods will be available soon!'))}
          {renderMenuItem('🔔', 'Notifications', () => navigation.navigate('Notifications'), false)}
        </Card>

        {/* Support & Legal */}
        <Text style={styles.sectionTitle}>Support & Legal</Text>
        <Card noPadding>
          {renderMenuItem('🎧', 'Help & Support', () => Alert.alert('Support', 'For help, contact us at support@fixigo.in'))}
          {renderMenuItem('🔒', 'Privacy Policy', () => {})}
          {renderMenuItem('📄', 'Terms & Conditions', () => {})}
          {renderMenuItem('⭐', 'Rate Fixigo', () => {}, false)}
        </Card>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutIcon}>🚪</Text>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <View style={{ height: SPACING.xxxl }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: SPACING.lg },
  
  profileHeader: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  userName: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: SPACING.md,
  },
  userEmail: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  userPhone: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginTop: 4,
  },
  editBtn: {
    marginTop: SPACING.lg,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xl,
  },

  sectionTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
    marginLeft: SPACING.xs,
    textTransform: 'uppercase',
  },

  menuItemWrapper: {
    paddingHorizontal: SPACING.md,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  menuIcon: {
    fontSize: 18,
  },
  menuText: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  chevron: {
    fontSize: FONT_SIZES.xl,
    color: COLORS.textTertiary,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginLeft: 52, // align with text
  },

  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.errorLight,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    marginTop: SPACING.xl,
  },
  logoutIcon: {
    fontSize: 20,
    marginRight: SPACING.sm,
  },
  logoutText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.error,
  }
});

export default ProfileScreen;