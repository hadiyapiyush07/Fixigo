import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, FlatList,
} from 'react-native';
import { COLORS, FONT_SIZES, SPACING } from '../../theme/typography';

const TABS = ['This Week', 'This Month', 'All Time'];

const MOCK_TRANSACTIONS = [
  { id: '1', service: 'AC Repair',         customer: 'Rahul M.',    amount: 850,  date: '15 Jun', status: 'paid' },
  { id: '2', service: 'Plumbing',          customer: 'Sneha P.',    amount: 650,  date: '13 Jun', status: 'paid' },
  { id: '3', service: 'Electrical Work',   customer: 'Amit K.',     amount: 1200, date: '11 Jun', status: 'paid' },
  { id: '4', service: 'Cleaning',          customer: 'Priya S.',    amount: 500,  date: '10 Jun', status: 'pending' },
  { id: '5', service: 'Washing Machine',   customer: 'Vijay R.',    amount: 750,  date: '08 Jun', status: 'paid' },
];

const EarningsScreen = () => {
  const [activeTab, setActiveTab] = useState(0);

  const totalEarnings = MOCK_TRANSACTIONS
    .filter(t => t.status === 'paid')
    .reduce((sum, t) => sum + t.amount, 0);

  const pendingAmount = MOCK_TRANSACTIONS
    .filter(t => t.status === 'pending')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Earnings</Text>
      </View>

      {/* Earnings Hero */}
      <View style={styles.heroCard}>
        <Text style={styles.heroLabel}>Total Earnings</Text>
        <Text style={styles.heroAmount}>₹{totalEarnings.toLocaleString('en-IN')}</Text>
        <View style={styles.heroStats}>
          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>₹{pendingAmount}</Text>
            <Text style={styles.heroStatLabel}>Pending</Text>
          </View>
          <View style={styles.heroDivider} />
          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>{MOCK_TRANSACTIONS.length}</Text>
            <Text style={styles.heroStatLabel}>Total Jobs</Text>
          </View>
          <View style={styles.heroDivider} />
          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>₹{Math.round(totalEarnings / MOCK_TRANSACTIONS.length)}</Text>
            <Text style={styles.heroStatLabel}>Avg / Job</Text>
          </View>
        </View>
      </View>

      {/* Period Tabs */}
      <View style={styles.tabsRow}>
        {TABS.map((tab, i) => (
          <TouchableOpacity
            key={tab}
            style={[styles.periodTab, activeTab === i && styles.periodTabActive]}
            onPress={() => setActiveTab(i)}
          >
            <Text style={[styles.periodTabText, activeTab === i && styles.periodTabTextActive]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Withdraw Card */}
      <View style={styles.withdrawCard}>
        <View>
          <Text style={styles.withdrawLabel}>Available to Withdraw</Text>
          <Text style={styles.withdrawAmount}>₹{totalEarnings.toLocaleString('en-IN')}</Text>
        </View>
        <TouchableOpacity style={styles.withdrawBtn}>
          <Text style={styles.withdrawBtnText}>Withdraw</Text>
        </TouchableOpacity>
      </View>

      {/* Transaction History */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Transaction History</Text>
        {MOCK_TRANSACTIONS.map(tx => (
          <View key={tx.id} style={styles.txCard}>
            <View style={styles.txIcon}>
              <Text style={{ fontSize: 20 }}>💳</Text>
            </View>
            <View style={styles.txInfo}>
              <Text style={styles.txService}>{tx.service}</Text>
              <Text style={styles.txCustomer}>{tx.customer} · {tx.date}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.txAmount}>+₹{tx.amount}</Text>
              <View style={[styles.txBadge, tx.status === 'pending' && styles.txBadgePending]}>
                <Text style={[styles.txBadgeText, tx.status === 'pending' && styles.txBadgeTextPending]}>
                  {tx.status === 'paid' ? 'Paid' : 'Pending'}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },

  header: {
    paddingHorizontal: SPACING.xl,
    paddingTop:        SPACING.xl + SPACING.lg,
    paddingBottom:     SPACING.md,
    backgroundColor:   '#FFFFFF',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 4,
  },
  title: { fontSize: FONT_SIZES.xxl, fontWeight: '800', color: '#111827' },

  heroCard: {
    margin:           SPACING.xl,
    backgroundColor:  COLORS.primary,
    borderRadius:     20,
    padding:          SPACING.xl,
    alignItems:       'center',
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 16, elevation: 8,
  },
  heroLabel:  { fontSize: FONT_SIZES.sm, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
  heroAmount: { fontSize: 42, fontWeight: '800', color: '#FFFFFF', marginVertical: 6 },
  heroStats:  { flexDirection: 'row', marginTop: SPACING.lg, paddingTop: SPACING.lg, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)', width: '100%', justifyContent: 'space-around' },
  heroStat:   { alignItems: 'center' },
  heroStatValue: { fontSize: FONT_SIZES.lg, fontWeight: '700', color: '#FFFFFF' },
  heroStatLabel: { fontSize: FONT_SIZES.xs, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  heroDivider:   { width: 1, backgroundColor: 'rgba(255,255,255,0.2)' },

  tabsRow: {
    flexDirection:    'row',
    marginHorizontal: SPACING.xl,
    marginBottom:     SPACING.lg,
    backgroundColor:  '#FFFFFF',
    borderRadius:     12,
    padding:          4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  periodTab:         { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  periodTabActive:   { backgroundColor: COLORS.primary },
  periodTabText:     { fontSize: FONT_SIZES.sm, fontWeight: '600', color: '#9CA3AF' },
  periodTabTextActive: { color: '#FFFFFF' },

  withdrawCard: {
    marginHorizontal: SPACING.xl,
    marginBottom:     SPACING.xl,
    backgroundColor:  '#ECFDF5',
    borderRadius:     16,
    padding:          SPACING.lg,
    flexDirection:    'row',
    justifyContent:   'space-between',
    alignItems:       'center',
    borderWidth:      1,
    borderColor:      '#86EFAC',
  },
  withdrawLabel:   { fontSize: FONT_SIZES.sm, color: '#065F46', fontWeight: '500' },
  withdrawAmount:  { fontSize: FONT_SIZES.xl, fontWeight: '800', color: '#065F46', marginTop: 2 },
  withdrawBtn:     { backgroundColor: '#22C55E', paddingHorizontal: SPACING.xl, paddingVertical: 12, borderRadius: 12 },
  withdrawBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: FONT_SIZES.sm },

  section:      { paddingHorizontal: SPACING.xl },
  sectionTitle: { fontSize: FONT_SIZES.lg, fontWeight: '700', color: '#111827', marginBottom: SPACING.md },

  txCard: {
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: '#FFFFFF',
    borderRadius:    14,
    padding:         SPACING.md,
    marginBottom:    SPACING.sm,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  txIcon:     { width: 44, height: 44, borderRadius: 12, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', marginRight: SPACING.md },
  txInfo:     { flex: 1 },
  txService:  { fontSize: FONT_SIZES.md, fontWeight: '600', color: '#111827' },
  txCustomer: { fontSize: FONT_SIZES.xs, color: '#9CA3AF', marginTop: 2 },
  txAmount:   { fontSize: FONT_SIZES.md, fontWeight: '800', color: '#22C55E' },
  txBadge:    { backgroundColor: '#DCFCE7', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2, marginTop: 4 },
  txBadgeText:{ fontSize: 10, fontWeight: '700', color: '#16A34A' },
  txBadgePending:     { backgroundColor: '#FEF3C7' },
  txBadgeTextPending: { color: '#D97706' },
});

export default EarningsScreen;