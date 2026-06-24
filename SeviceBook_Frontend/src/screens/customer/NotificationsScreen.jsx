// src/screens/customer/NotificationsScreen.jsx
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, Animated as RNAnimated
} from 'react-native';
import Reanimated, { FadeInUp, FadeIn, Layout, SlideOutRight } from 'react-native-reanimated';
import { Swipeable } from 'react-native-gesture-handler';
import Skeleton from '../../components/Skeleton';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../../theme/typography';

const DUMMY_NOTIFICATIONS = [
  { _id: '1', title: 'Booking Confirmed!', body: 'Suresh AC Repair accepted your booking.', type: 'booking_confirmed', isRead: false, createdAt: new Date().toISOString() },
  { _id: '2', title: 'Service Completed', body: 'Your AC Repair service is completed. Please rate your experience.', type: 'booking_completed', isRead: false, createdAt: new Date(Date.now() - 3600000).toISOString() },
  { _id: '3', title: 'Payment Successful', body: '₹850 paid successfully for AC Repair service.', type: 'payment_success', isRead: true, createdAt: new Date(Date.now() - 86400000).toISOString() },
  { _id: '4', title: 'Booking Cancelled', body: 'Your booking has been cancelled.', type: 'booking_cancelled', isRead: true, createdAt: new Date(Date.now() - 172800000).toISOString() },
];

const getIconForType = (type) => {
  if (type === 'booking_confirmed') return { icon: '✅', color: '#10B981', bg: '#D1FAE5' };
  if (type === 'booking_completed') return { icon: '🎉', color: '#8B5CF6', bg: '#EDE9FE' };
  if (type === 'booking_cancelled') return { icon: '❌', color: '#EF4444', bg: '#FEE2E2' };
  if (type === 'payment_success') return { icon: '💳', color: '#3B82F6', bg: '#EFF6FF' };
  if (type === 'booking_request') return { icon: '📋', color: '#F59E0B', bg: '#FEF3C7' };
  return { icon: '🔔', color: '#6366F1', bg: '#E0E7FF' };
};

const getTimeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};

import { notificationAPI } from '../../api/notification.api';
import { socketService } from '../../services/socket.service';
import { useFocusEffect } from '@react-navigation/native';

const NotificationsScreen = () => {
  const [notifications, setNotifications] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await notificationAPI.getMine();
      setNotifications(res.data.data || []);
    } catch (e) {
      console.log('Error fetching notifications', e);
    } finally {
      setIsLoaded(true);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchNotifications();
      
      socketService.on('notification:new', fetchNotifications);
      socketService.on('booking:status_update', fetchNotifications);

      return () => {
        socketService.off('notification:new', fetchNotifications);
        socketService.off('booking:status_update', fetchNotifications);
      };
    }, [])
  );

  const markAllRead = async () => {
    try {
      await notificationAPI.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (e) {
      console.log('Error marking all read', e);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await notificationAPI.delete(id);
      setNotifications(prev => prev.filter(n => n._id !== id));
    } catch (e) {
      console.log('Error deleting notification', e);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const rowRefs = new Map();

  const renderRightActions = (progress, dragX, id) => {
    const scale = dragX.interpolate({
      inputRange: [-80, 0],
      outputRange: [1, 0.5],
      extrapolate: 'clamp',
    });
    return (
      <TouchableOpacity 
        style={styles.deleteAction}
        onPress={() => deleteNotification(id)}
      >
        <RNAnimated.Text style={[styles.deleteActionText, { transform: [{ scale }] }]}>🗑️ Delete</RNAnimated.Text>
      </TouchableOpacity>
    );
  };

  const NotifItem = ({ item, index }) => {
    const styleInfo = getIconForType(item.type);
    
    return (
      <Reanimated.View 
        entering={FadeInUp.delay(index * 100).springify()} 
        layout={Layout.springify()} 
        exiting={SlideOutRight}
      >
        <Swipeable
          ref={ref => {
            if (ref && !rowRefs.has(item._id)) {
              rowRefs.set(item._id, ref);
            }
          }}
          renderRightActions={(progress, dragX) => renderRightActions(progress, dragX, item._id)}
          onSwipeableWillOpen={() => {
            [...rowRefs.entries()].forEach(([key, ref]) => {
              if (key !== item._id && ref) ref.close();
            });
          }}
          friction={2}
          rightThreshold={40}
        >
          <TouchableOpacity
            style={[styles.card, !item.read && styles.cardUnread]}
            onPress={async () => {
              if (!item.read) {
                try {
                  await notificationAPI.markRead(item._id);
                  setNotifications(prev =>
                    prev.map(n => n._id === item._id ? { ...n, read: true } : n)
                  );
                } catch (e) {
                  console.log('Error marking read', e);
                }
              }
            }}
            activeOpacity={0.9}
          >
            <View style={[styles.iconBox, { backgroundColor: styleInfo.bg }]}>
              <Text style={styles.icon}>{styleInfo.icon}</Text>
            </View>
            <View style={styles.content}>
              <View style={styles.cardHeader}>
                <Text style={[styles.title, !item.read && styles.titleUnread]}>
                  {item.title}
                </Text>
                <Text style={styles.time}>{getTimeAgo(item.createdAt)}</Text>
              </View>
              <Text style={styles.body} numberOfLines={2}>{item.message || item.body}</Text>
            </View>
            {!item.read && <View style={styles.unreadDot} />}
          </TouchableOpacity>
        </Swipeable>
      </Reanimated.View>
    );
  };

  if (!isLoaded) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Notifications</Text>
        </View>
        <View style={{ padding: SPACING.lg, gap: SPACING.md }}>
          {[1, 2, 3, 4, 5].map(i => (
            <View key={i} style={[styles.card, { paddingVertical: 20 }]}>
              <Skeleton width={48} height={48} borderRadius={24} style={{ marginRight: SPACING.md }} />
              <View style={{ flex: 1, gap: 8 }}>
                <Skeleton width="70%" height={16} />
                <Skeleton width="100%" height={12} />
                <Skeleton width="40%" height={12} />
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  }

  if (notifications.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Notifications</Text>
        </View>
        <Reanimated.View entering={FadeIn.duration(600)} style={styles.emptyContainer}>
          <View style={styles.emptyIconBox}>
            <Text style={styles.emptyIcon}>🔕</Text>
          </View>
          <Text style={styles.emptyTitle}>All Caught Up!</Text>
          <Text style={styles.emptySubtitle}>You have no new notifications right now.</Text>
        </Reanimated.View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <Text style={styles.unreadText}>{unreadCount} unread</Text>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllRead} style={styles.markAllBtn}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={item => item._id}
        renderItem={({ item, index }) => <NotifItem item={item} index={index} />}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#F9FAFB' },
  header:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.xl, paddingTop: SPACING.xl + SPACING.lg, paddingBottom: SPACING.lg, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  headerTitle: { fontSize: FONT_SIZES.xxl, fontWeight: '800', color: '#111827' },
  unreadText:  { fontSize: FONT_SIZES.sm, color: COLORS.primary, marginTop: 2, fontWeight: '600' },
  markAllBtn:  { backgroundColor: '#F3E8FD', paddingHorizontal: SPACING.md, paddingVertical: 8, borderRadius: 20 },
  markAllText: { fontSize: FONT_SIZES.sm, color: COLORS.primary, fontWeight: '700' },

  list:        { padding: SPACING.lg, gap: SPACING.md, paddingBottom: 100 },

  card: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF',
    padding: SPACING.lg, borderRadius: BORDER_RADIUS.lg,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
    borderWidth: 1, borderColor: '#F3F4F6'
  },
  cardUnread: { backgroundColor: '#F5F3FF', borderColor: '#DDD6FE' },

  iconBox: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginRight: SPACING.md },
  icon: { fontSize: 24 },

  content: { flex: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  title: { fontSize: FONT_SIZES.md, fontWeight: '600', color: '#374151', flex: 1, marginRight: 8 },
  titleUnread: { fontWeight: '800', color: '#111827' },
  time: { fontSize: 11, color: '#9CA3AF', fontWeight: '500' },
  body: { fontSize: 13, color: '#6B7280', lineHeight: 18 },

  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.primary, position: 'absolute', top: 20, right: 20 },

  deleteAction: { backgroundColor: '#EF4444', justifyContent: 'center', alignItems: 'center', width: 90, borderRadius: BORDER_RADIUS.lg, marginLeft: SPACING.sm, height: '100%' },
  deleteActionText: { color: '#FFF', fontWeight: '800', fontSize: FONT_SIZES.sm },

  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: -50 },
  emptyIconBox: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#F3E8FD', alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.xl },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: FONT_SIZES.xl, fontWeight: '800', color: '#111827', marginBottom: SPACING.sm },
  emptySubtitle: { fontSize: FONT_SIZES.md, color: '#6B7280', textAlign: 'center', maxWidth: 250, lineHeight: 22 },
});

export default NotificationsScreen;
