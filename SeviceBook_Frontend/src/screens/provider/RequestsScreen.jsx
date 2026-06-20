import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { bookingAPI } from '../../api/booking.api';
import { COLORS, FONT_SIZES, SPACING } from '../../theme/typography';
import { Card } from '../../components/ui/Card';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { socketService } from '../../services/socket.service';

const RequestsScreen = ({ navigation }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchRequests();

      const interval = setInterval(() => {
        fetchRequests();
      }, 10000); // 10s polling

      return () => clearInterval(interval);
    }, [])
  );

  useEffect(() => {
    socketService.on('booking:new', fetchRequests);
    
    return () => {
      socketService.off('booking:new', fetchRequests);
    };
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await bookingAPI.getProviderBookings({ status: 'pending', page: 1, limit: 20 });
      setRequests(res.data.data?.data || []);
    } catch (e) {
      console.log('Error fetching requests', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleAction = async (id, status) => {
    try {
      await bookingAPI.updateStatus(id, status);
      setRequests(prev => prev.filter(req => req._id !== id));
      if (status === 'confirmed') {
        navigation.navigate('BookingDetail', { bookingId: id });
      }
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Action failed');
    }
  };

  const renderRequest = ({ item }) => (
    <Card>
      <View style={styles.reqHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.serviceName}>{item.serviceId?.name}</Text>
          <Text style={styles.customerName}>{item.customerId?.name}</Text>
        </View>
        <Text style={styles.amount}>₹{item.totalAmount}</Text>
      </View>
      
      <View style={styles.metaRow}>
        <Text style={styles.metaTxt}>📍 {item.distance ? `${item.distance} km away` : 'Distance unknown'}</Text>
        <Text style={styles.metaTxt}>⏱ {new Date(item.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</Text>
      </View>

      <View style={styles.actionRow}>
        <PrimaryButton 
          title="Decline" 
          variant="danger" 
          style={styles.btn} 
          textStyle={{ fontSize: FONT_SIZES.sm }}
          onPress={() => handleAction(item._id, 'rejected')} 
        />
        <View style={{ width: SPACING.md }} />
        <PrimaryButton 
          title="Accept" 
          variant="primary" 
          style={styles.btn} 
          textStyle={{ fontSize: FONT_SIZES.sm }}
          onPress={() => handleAction(item._id, 'confirmed')} 
        />
      </View>
    </Card>
  );

  if (loading) {
    return (
      <View style={styles.safe}>
        <LoadingSkeleton height={180} />
        <LoadingSkeleton height={180} />
      </View>
    );
  }

  return (
    <View style={styles.safe}>
      <FlatList
        data={requests}
        keyExtractor={item => item._id}
        renderItem={renderRequest}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchRequests(); }} />}
        ListHeaderComponent={<SectionHeader title="Pending Requests" subtitle={`You have ${requests.length} new requests`} />}
        ListEmptyComponent={<EmptyState icon="📬" title="No New Requests" subtitle="You're all caught up!" />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  list: { padding: SPACING.lg },
  reqHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  serviceName: { fontSize: FONT_SIZES.lg, fontWeight: '700', color: COLORS.textPrimary },
  customerName: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginTop: 2 },
  amount: { fontSize: FONT_SIZES.xl, fontWeight: '800', color: COLORS.primary },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: SPACING.md, marginBottom: SPACING.lg },
  metaTxt: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, fontWeight: '600' },
  actionRow: { flexDirection: 'row' },
  btn: { flex: 1, paddingVertical: SPACING.sm }
});

export default RequestsScreen;