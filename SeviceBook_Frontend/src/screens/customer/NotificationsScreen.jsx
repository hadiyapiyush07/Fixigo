// src/screens/customer/NotificationsScreen.jsx
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity,
} from 'react-native';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../../theme/typography';

const DUMMY_NOTIFICATIONS = [
  { _id: '1', title: 'Booking Confirmed!', body: 'Suresh AC Repair accepted your booking.', type: 'booking_confirmed', isRead: false, createdAt: new Date().toISOString() },
  { _id: '2', title: 'Service Completed', body: 'Your AC Repair service is completed. Please rate your experience.', type: 'booking_completed', isRead: false, createdAt: new Date(Date.now() - 3600000).toISOString() },
  { _id: '3', title: 'Payment Successful', body: '₹850 paid successfully for AC Repair service.', type: 'payment_success', isRead: true, createdAt: new Date(Date.now() - 86400000).toISOString() },
  { _id: '4', title: 'Booking Cancelled', body: 'Your booking has been cancelled.', type: 'booking_cancelled', isRead: true, createdAt: new Date(Date.now() - 172800000).toISOString() },
];

const NOTIF_ICONS = {
  booking_confirmed:  '✅',
  booking_completed:  '🎉',
  booking_cancelled:  '❌',
  payment_success:    '💳',
  booking_request:    '📋',
  system:             '📢',
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

const NotificationsScreen = () => {
  const [notifications, setNotifications] = useState(DUMMY_NOTIFICATIONS);

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const NotifItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.card, !item.isRead && styles.cardUnread]}
      onPress={() => {
        setNotifications(prev =>
          prev.map(n => n._id === item._id ? { ...n, isRead: true } : n)
        );
      }}
      activeOpacity={0.8}
    >
      <View style={styles.iconBox}>
        <Text style={styles.icon}>{NOTIF_ICONS[item.type] || '🔔'}</Text>
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, !item.isRead && styles.titleUnread]}>
          {item.title}
        </Text>
        <Text style={styles.body} numberOfLines={2}>{item.body}</Text>
        <Text style={styles.time}>{getTimeAgo(item.createdAt)}</Text>
      </View>
      {!item.isRead && <View style={styles.dot} />}
    </TouchableOpacity>
  );

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
        renderItem={({ item }) => <NotifItem item={item} />}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🔔</Text>
            <Text style={styles.emptyText}>No notifications yet</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: COLORS.background },
  header:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.xl, paddingTop: SPACING.xl + SPACING.lg, paddingBottom: SPACING.lg, backgroundColor: COLORS.white, ...SHADOWS.sm },
  headerTitle: { fontSize: FONT_SIZES.xxl, fontWeight: '800', color: COLORS.textPrimary },
  unreadText:  { fontSize: FONT_SIZES.sm, color: COLORS.primary, marginTop: 2 },
  markAllBtn:  { backgroundColor: COLORS.primaryLight, paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: BORDER_RADIUS.round },
  markAllText: { fontSize: FONT_SIZES.sm, color: COLORS.primary, fontWeight: '600' },

  list:        { padding: SPACING.xl, gap: SPACING.sm, paddingBottom: SPACING.xxxl },

  card:        { flexDirection: 'row', backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.lg, padding: SPACING.lg, alignItems: 'flex-start', ...SHADOWS.sm },
  cardUnread:  { borderLeftWidth: 3, borderLeftColor: COLORS.primary },

  iconBox:     { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: SPACING.md, flexShrink: 0 },
  icon:        { fontSize: 20 },

  content:     { flex: 1 },
  title:       { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, fontWeight: '500', marginBottom: 2 },
  titleUnread: { color: COLORS.textPrimary, fontWeight: '700' },
  body:        { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, lineHeight: 18, marginBottom: 4 },
  time:        { fontSize: FONT_SIZES.xs, color: COLORS.textTertiary },

  dot:         { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary, marginLeft: SPACING.sm, marginTop: 4 },

  empty:       { alignItems: 'center', paddingTop: 80 },
  emptyIcon:   { fontSize: 64, marginBottom: SPACING.lg },
  emptyText:   { fontSize: FONT_SIZES.lg, color: COLORS.textSecondary },
});

export default NotificationsScreen;
