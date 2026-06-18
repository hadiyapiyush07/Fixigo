import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Alert, ScrollView, StatusBar,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser } from '../../store/slices/authSlice';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS } from '../../theme/typography';

const MenuItem = ({ icon, label, sublabel, onPress, danger }) => (
  <TouchableOpacity
    style={styles.menuItem}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={[styles.menuIcon, danger && styles.menuIconDanger]}>
      <Text style={styles.menuIconText}>{icon}</Text>
    </View>
    <View style={styles.menuContent}>
      <Text style={[styles.menuLabel, danger && { color: '#EF4444' }]}>{label}</Text>
      {sublabel ? <Text style={styles.menuSublabel}>{sublabel}</Text> : null}
    </View>
    {!danger && <Text style={styles.menuChevron}>›</Text>}
  </TouchableOpacity>
);

const ProviderProfileScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { user } = useSelector(s => s.auth);

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => dispatch(logoutUser()),
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <StatusBar barStyle="light-content" />

      {/* Hero Header */}
      <View style={styles.hero}>
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.onlineBadge}>
            <View style={styles.onlineDot} />
          </View>
        </View>

        <Text style={styles.name}>{user?.name}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleBadgeText}>🔧 Service Provider</Text>
        </View>

        <View style={styles.contactRow}>
          {user?.email && (
            <View style={styles.contactChip}>
              <Text style={styles.contactText}>✉️  {user.email}</Text>
            </View>
          )}
          {user?.phone && (
            <View style={styles.contactChip}>
              <Text style={styles.contactText}>📱  {user.phone}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Info Cards */}
      <View style={styles.statsRow}>
        <View style={styles.infoCard}>
          <Text style={styles.infoCardValue}>4.8 ⭐</Text>
          <Text style={styles.infoCardLabel}>Rating</Text>
        </View>
        <View style={[styles.infoCard, { borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#E5E7EB' }]}>
          <Text style={styles.infoCardValue}>128</Text>
          <Text style={styles.infoCardLabel}>Total Jobs</Text>
        </View>
        <View style={styles.infoCard}>
          <Text style={styles.infoCardValue}>2 yrs</Text>
          <Text style={styles.infoCardLabel}>Experience</Text>
        </View>
      </View>

      {/* Menu */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Account</Text>
        <View style={styles.menuCard}>
          <MenuItem icon="👤" label="Edit Profile"       sublabel="Update your personal info" onPress={() => {}} />
          <View style={styles.divider} />
          <MenuItem icon="🔔" label="Notifications"     sublabel="Manage your alerts"        onPress={() => {}} />
          <View style={styles.divider} />
          <MenuItem icon="🔒" label="Change Password"   sublabel="Keep your account secure"  onPress={() => {}} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Services</Text>
        <View style={styles.menuCard}>
          <MenuItem icon="🛠️"  label="My Services"       sublabel="View & manage your services" onPress={() => {}} />
          <View style={styles.divider} />
          <MenuItem icon="💰" label="Earnings & Payouts" sublabel="Track your earnings"          onPress={() => navigation.navigate('Earnings')} />
          <View style={styles.divider} />
          <MenuItem icon="📊" label="Performance Stats"  sublabel="Reviews, ratings & more"     onPress={() => {}} />
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.menuCard}>
          <MenuItem icon="🚪" label="Logout" danger onPress={handleLogout} />
        </View>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },

  /* Hero */
  hero: {
    backgroundColor: COLORS.primary,
    alignItems:      'center',
    paddingTop:      60,
    paddingBottom:   36,
    paddingHorizontal: SPACING.xl,
  },
  avatarWrap: { position: 'relative', marginBottom: 14 },
  avatar: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.6)',
  },
  avatarText:  { fontSize: 36, fontWeight: '800', color: '#FFFFFF' },
  onlineBadge: {
    position: 'absolute', bottom: 4, right: 4,
    backgroundColor: '#22C55E', borderRadius: 10,
    width: 20, height: 20,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: COLORS.primary,
  },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFFFFF' },

  name: { fontSize: 24, fontWeight: '800', color: '#FFFFFF', textAlign: 'center' },

  roleBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 14, paddingVertical: 4,
    borderRadius: 20, marginTop: 8,
  },
  roleBadgeText: { color: '#FFFFFF', fontSize: FONT_SIZES.sm, fontWeight: '600' },

  contactRow: { marginTop: 14, gap: 8, alignItems: 'center' },
  contactChip: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 20,
  },
  contactText: { color: 'rgba(255,255,255,0.9)', fontSize: FONT_SIZES.xs },

  /* Stats row */
  statsRow: {
    flexDirection:   'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: SPACING.xl,
    marginTop:       -20,
    borderRadius:    16,
    overflow:        'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 12, elevation: 6,
  },
  infoCard: { flex: 1, alignItems: 'center', paddingVertical: 18 },
  infoCardValue: { fontSize: FONT_SIZES.xl, fontWeight: '800', color: '#111827' },
  infoCardLabel: { fontSize: FONT_SIZES.xs, color: '#6B7280', marginTop: 2 },

  /* Sections */
  section:      { paddingHorizontal: SPACING.xl, marginTop: SPACING.xl },
  sectionLabel: { fontSize: FONT_SIZES.xs, fontWeight: '700', color: '#9CA3AF', letterSpacing: 1, marginBottom: 10, textTransform: 'uppercase' },

  menuCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: SPACING.lg },
  menuIcon: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center', justifyContent: 'center',
    marginRight: SPACING.md,
  },
  menuIconDanger: { backgroundColor: '#FEE2E2' },
  menuIconText:   { fontSize: 18 },
  menuContent:    { flex: 1 },
  menuLabel:      { fontSize: FONT_SIZES.md, fontWeight: '600', color: '#111827' },
  menuSublabel:   { fontSize: FONT_SIZES.xs, color: '#9CA3AF', marginTop: 1 },
  menuChevron:    { fontSize: 22, color: '#D1D5DB', fontWeight: '300' },
  divider:        { height: 1, backgroundColor: '#F9FAFB', marginLeft: 72 },
});

export default ProviderProfileScreen;