import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, Alert, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { bookingAPI } from '../../api/booking.api';
import { COLORS, FONT_SIZES, SPACING } from '../../theme/typography';
import { Card } from '../../components/ui/Card';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { formatDistance, calculateDistance } from '../../utils/distance';

const RequestItem = React.memo(({ item, onAccept, onDecline, currentLocation }) => {
  let displayDistance = 'Distance unknown';
  
  if (currentLocation && item.location?.coordinates && item.location.coordinates.length === 2) {
    const [lng, lat] = item.location.coordinates;
    const dist = calculateDistance(currentLocation.latitude, currentLocation.longitude, lat, lng);
    displayDistance = formatDistance(dist);
  } else if (item.distance) {
    displayDistance = `${item.distance} km away`;
  } else if (item.address?.addressLine) {
    displayDistance = item.address.addressLine;
  }

  return (
    <Card>
      <View style={styles.reqHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.serviceName}>{item.serviceId?.name}</Text>
          <Text style={styles.customerName}>{item.customerId?.name}</Text>
        </View>
        <Text style={styles.amount}>₹{item.pricing?.totalAmount || item.totalAmount || 0}</Text>
      </View>
      
      <View style={styles.metaRow}>
        <Text style={[styles.metaTxt, { flex: 1, marginRight: SPACING.sm }]} numberOfLines={1}>
          📍 {displayDistance}
        </Text>
        <Text style={styles.metaTxt}>⏱ {new Date(item.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</Text>
      </View>

      <View style={styles.actionRow}>
        <PrimaryButton 
          title="Decline" 
          variant="danger" 
          style={styles.btn} 
          textStyle={{ fontSize: FONT_SIZES.sm }}
          onPress={() => onDecline(item._id)} 
        />
        <View style={{ width: SPACING.md }} />
        <PrimaryButton 
          title="Accept" 
          variant="primary" 
          style={styles.btn} 
          textStyle={{ fontSize: FONT_SIZES.sm }}
          onPress={() => onAccept(item._id)} 
        />
      </View>
    </Card>
  );
});

import { socketService } from '../../services/socket.service';
import { useLocation } from '../../hooks/useLocation';

const RequestsScreen = ({ navigation }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Track location since we are online receiving requests
  const { location } = useLocation({ isOnline: true });

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

  const handleAction = useCallback(async (id, status) => {
    try {
      if (status === 'confirmed') {
        await bookingAPI.accept(id);
      } else {
        await bookingAPI.reject(id, 'Declined by provider');
      }
      setRequests(prev => prev.filter(req => req._id !== id));
      if (status === 'confirmed') {
        navigation.navigate('BookingDetail', { bookingId: id });
      }
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Action failed');
    }
  }, [navigation]);

  const handleAccept = useCallback((id) => handleAction(id, 'confirmed'), [handleAction]);
  const handleDecline = useCallback((id) => handleAction(id, 'rejected'), [handleAction]);

  const renderRequest = useCallback(({ item }) => (
    <RequestItem 
      item={item} 
      onAccept={handleAccept} 
      onDecline={handleDecline} 
      currentLocation={location}
    />
  ), [handleAccept, handleDecline, location]);

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
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={Platform.OS === 'android'}
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