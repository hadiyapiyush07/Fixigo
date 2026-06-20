import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { providerAPI } from '../../api/provider.api';
import { COLORS, FONT_SIZES, SPACING } from '../../theme/typography';
import { Card } from '../../components/ui/Card';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { EmptyState } from '../../components/ui/EmptyState';

const EarningsScreen = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await providerAPI.getMyStats();
      setStats(res.data.data);
    } catch (e) {
      console.log('Error fetching stats', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.safe}>
        <LoadingSkeleton height={120} />
        <LoadingSkeleton height={120} />
        <LoadingSkeleton height={120} />
      </View>
    );
  }

  const earnings = stats?.earnings || 0;
  const todayEarnings = stats?.todayEarnings || 0;
  const pendingPayments = stats?.pendingPayments || 0;

  return (
    <View style={styles.safe}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchStats(); }} />}
        contentContainerStyle={styles.scroll}
      >
        <SectionHeader title="Earnings Overview" />
        
        <View style={styles.grid}>
          <Card style={styles.gridCard}>
            <Text style={styles.valTxt}>₹{todayEarnings}</Text>
            <Text style={styles.labelTxt}>Today's Earnings</Text>
          </Card>
          <Card style={styles.gridCard}>
            <Text style={styles.valTxt}>₹{earnings}</Text>
            <Text style={styles.labelTxt}>Total Earnings</Text>
          </Card>
        </View>
        
        <Card style={styles.pendingCard}>
          <Text style={styles.valTxt}>₹{pendingPayments}</Text>
          <Text style={styles.labelTxt}>Pending Settlements</Text>
        </Card>

        <SectionHeader title="Settlement History" style={{ marginTop: SPACING.lg }} />
        <EmptyState icon="🏦" title="No settlements yet" subtitle="Your earnings will be settled to your bank account weekly." />

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: SPACING.lg },
  grid: { flexDirection: 'row', gap: SPACING.md },
  gridCard: { flex: 1, alignItems: 'center', paddingVertical: SPACING.xl },
  pendingCard: { alignItems: 'center', paddingVertical: SPACING.xl },
  valTxt: { fontSize: FONT_SIZES.xxl, fontWeight: '800', color: COLORS.primary },
  labelTxt: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginTop: SPACING.xs, fontWeight: '600' }
});

export default EarningsScreen;