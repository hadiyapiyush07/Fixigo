import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform
} from 'react-native';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser } from '../../store/slices/authSlice';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../../theme/typography';
import { Avatar } from '../../components/ui/Avatar';
import { Card } from '../../components/ui/Card';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { 
  MapPin, Lock, TicketPercent, CreditCard, Bell, 
  HelpCircle, Shield, FileText, Star, LogOut, ChevronRight, Wallet, Gift
} from 'lucide-react-native';

const ProfileScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: () => dispatch(logoutUser()) }
      ]
    );
  };

  const renderMenuItem = (icon, title, onPress, showBorder = true) => (
    <View style={styles.menuItemWrapper}>
      <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
        <View style={styles.menuIconBox}>{icon}</View>
        <Text style={styles.menuText}>{title}</Text>
        <ChevronRight size={20} color={COLORS.textTertiary} />
      </TouchableOpacity>
      {showBorder && <View style={styles.divider} />}
    </View>
  );

  return (
    <View style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        
        {/* Header Profile Section */}
        <Animated.View entering={FadeInUp.delay(100).springify()}>
          <Card style={styles.profileHeader}>
            <Avatar name={user?.name} size={88} />
            <Text style={styles.userName}>{user?.name || 'Guest User'}</Text>
            <Text style={styles.userPhone}>{user?.phone || ''} • {user?.email || 'No email added'}</Text>
            
            <PrimaryButton 
              title="Edit Profile" 
              variant="outline" 
              style={styles.editBtn} 
              onPress={() => navigation.navigate('EditProfile')}
            />
          </Card>
        </Animated.View>

        {/* Account Settings */}
        <Animated.View entering={FadeInUp.delay(200).springify()}>
          <Text style={styles.sectionTitle}>Account Settings</Text>
          <Card noPadding style={{ marginBottom: SPACING.xl }}>
            {renderMenuItem(<MapPin size={20} color={COLORS.primary} />, 'Saved Addresses', () => navigation.navigate('SavedAddresses'))}
            {renderMenuItem(<Lock size={20} color={COLORS.primary} />, 'Change Password', () => navigation.navigate('ChangePassword'))}
            {renderMenuItem(<TicketPercent size={20} color={COLORS.primary} />, 'My Coupons', () => Alert.alert('Coming Soon', 'Coupons will be available soon!'))}
            {renderMenuItem(<CreditCard size={20} color={COLORS.primary} />, 'Payment Methods', () => Alert.alert('Coming Soon', 'Payment methods will be available soon!'))}
            {renderMenuItem(<Bell size={20} color={COLORS.primary} />, 'Notifications', () => navigation.navigate('Notifications'), false)}
          </Card>
        </Animated.View>

        {/* Support & Legal */}
        <Animated.View entering={FadeInUp.delay(300).springify()}>
          <Text style={styles.sectionTitle}>Support & Legal</Text>
          <Card noPadding style={{ marginBottom: SPACING.xl }}>
            {renderMenuItem(<HelpCircle size={20} color={COLORS.textSecondary} />, 'Help & Support', () => Alert.alert('Support', 'Contact us at support@fixigo.in'))}
            {renderMenuItem(<Shield size={20} color={COLORS.textSecondary} />, 'Privacy Policy', () => {})}
            {renderMenuItem(<FileText size={20} color={COLORS.textSecondary} />, 'Terms & Conditions', () => {})}
            {renderMenuItem(<Star size={20} color={COLORS.warning} fill={COLORS.warning} />, 'Rate Fixigo', () => {}, false)}
          </Card>
        </Animated.View>

        {/* Logout */}
        <Animated.View entering={FadeInDown.delay(400).springify()}>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
            <LogOut size={20} color={COLORS.danger} style={{ marginRight: SPACING.sm }} />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </Animated.View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: SPACING.lg, paddingTop: Platform.OS === 'ios' ? 60 : SPACING.xxl, paddingBottom: SPACING.md, backgroundColor: COLORS.background },
  headerTitle: { fontSize: 32, fontWeight: '900', color: COLORS.textPrimary, letterSpacing: -0.5 },
  scroll: { padding: SPACING.lg },
  
  profileHeader: { alignItems: 'center', paddingVertical: SPACING.xl, marginBottom: SPACING.xl },
  userName: { fontSize: FONT_SIZES.xxl, fontWeight: '800', color: COLORS.textPrimary, marginTop: SPACING.md },
  userPhone: { fontSize: FONT_SIZES.sm, fontWeight: '600', color: COLORS.textSecondary, marginTop: 4 },
  
  statsRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, marginTop: SPACING.lg, width: '100%', borderWidth: 1, borderColor: COLORS.border },
  statBox: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: FONT_SIZES.lg, fontWeight: '800', color: COLORS.textPrimary },
  statLabel: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '600', marginTop: 2 },
  statDivider: { width: 1, height: 40, backgroundColor: COLORS.border },

  editBtn: { marginTop: SPACING.xl, minWidth: 160 },

  sectionTitle: { fontSize: 13, fontWeight: '800', color: COLORS.textTertiary, marginBottom: SPACING.sm, marginLeft: SPACING.sm, textTransform: 'uppercase', letterSpacing: 1 },

  menuItemWrapper: { paddingHorizontal: SPACING.md },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.lg },
  menuIconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center', marginRight: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
  menuText: { flex: 1, fontSize: FONT_SIZES.md, fontWeight: '700', color: COLORS.textPrimary },
  divider: { height: 1, backgroundColor: COLORS.divider, marginLeft: 56 },

  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.errorLight, padding: SPACING.lg, borderRadius: BORDER_RADIUS.xl, borderWidth: 1, borderColor: COLORS.error },
  logoutText: { fontSize: FONT_SIZES.md, fontWeight: '800', color: COLORS.danger },
});

export default ProfileScreen;