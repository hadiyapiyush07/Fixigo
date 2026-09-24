import { useTheme } from '../../theme/ThemeContext';
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, Alert, Platform, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { bookingAPI } from '../../api/booking.api';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS } from '../../theme/typography';
import { Card } from '../../components/ui/Card';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { formatDistance, calculateDistance } from '../../utils/distance';

const RequestItem = React.memo(({ item, onAccept, onDecline, currentLocation }) => {
  const { colors: COLORS, shadows: SHADOWS, statusColors: STATUS_COLORS } = useTheme();
  const styles = React.useMemo(() => createStyles(COLORS, SHADOWS, STATUS_COLORS), [COLORS, SHADOWS, STATUS_COLORS]);

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
        <TouchableOpacity 
          style={styles.declineBtn}
          onPress={() => onDecline(item._id)} 
          activeOpacity={0.8}
        >
          <Text style={styles.declineBtnText}>Decline</Text>
        </TouchableOpacity>
        <View style={{ width: SPACING.md }} />
        <TouchableOpacity 
          style={styles.acceptBtn}
          onPress={() => onAccept(item._id)}
          activeOpacity={0.8}
        >
          <Text style={styles.acceptBtnText}>Accept</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );
});

import { socketService } from '../../services/socket.service';
import { useLocation } from '../../hooks/useLocation';

const RequestsScreen = ({ navigation }) => {
  const { colors: COLORS, shadows: SHADOWS, statusColors: STATUS_COLORS } = useTheme();
  const styles = React.useMemo(() => createStyles(COLORS, SHADOWS, STATUS_COLORS), [COLORS, SHADOWS, STATUS_COLORS]);

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
      requestAnimationFrame(() => setLoading(false));
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

const createStyles = (COLORS, SHADOWS, STATUS_COLORS) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  list: { padding: SPACING.lg },
  reqHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  serviceName: { fontSize: FONT_SIZES.lg, fontWeight: '700', color: COLORS.textPrimary },
  customerName: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginTop: 2 },
  amount: { fontSize: FONT_SIZES.xl, fontWeight: '800', color: COLORS.primary },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: SPACING.md, marginBottom: SPACING.lg },
  metaTxt: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, fontWeight: '600' },
  actionRow: { flexDirection: 'row' },
  declineBtn: { 
    flex: 1, height: 48, borderRadius: BORDER_RADIUS.xl, 
    backgroundColor: '#FEE2E2', borderWidth: 1, borderColor: '#FCA5A5',
    alignItems: 'center', justifyContent: 'center'
  },
  declineBtnText: { color: '#DC2626', fontWeight: '700', fontSize: FONT_SIZES.sm },
  acceptBtn: { 
    flex: 1, height: 48, borderRadius: BORDER_RADIUS.xl, 
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center'
  },
  acceptBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: FONT_SIZES.sm },
});

export default RequestsScreen;
