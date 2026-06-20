import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { notificationAPI } from '../../api/notification.api';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS } from '../../theme/typography';
import { Card } from '../../components/ui/Card';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { EmptyState } from '../../components/ui/EmptyState';

const NotificationScreen = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [])
  );

  const fetchNotifications = async () => {
    try {
      const res = await notificationAPI.getMine();
      setNotifications(res.data.data || []);
    } catch (e) {
      // Error fetching notifications
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const markAsRead = async (id, currentStatus) => {
    if (currentStatus) return; // already read
    try {
      await notificationAPI.markRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    } catch (e) {
      // Error marking as read
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationAPI.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (e) {
      // Error marking all as read
    }
  };

  const deleteNotification = async (id) => {
    try {
      await notificationAPI.delete(id);
      setNotifications(prev => prev.filter(n => n._id !== id));
    } catch (e) {
      // Error deleting notification
    }
  };

  // Group by Date
  const groupNotifications = () => {
    const groups = {};
    notifications.forEach(n => {
      const date = new Date(n.createdAt).toLocaleDateString();
      if (!groups[date]) groups[date] = [];
      groups[date].push(n);
    });
    return Object.entries(groups).map(([date, data]) => ({ date, data }));
  };

  const renderItem = ({ item }) => {
    const isUnread = !item.read;
    return (
      <TouchableOpacity onPress={() => markAsRead(item._id, item.read)} activeOpacity={0.8}>
        <Card style={[styles.card, isUnread && styles.unreadCard]}>
          <View style={styles.cardHeader}>
            <Text style={styles.title}>{item.title}</Text>
            <TouchableOpacity onPress={() => deleteNotification(item._id)}>
              <Text style={styles.deleteIcon}>🗑️</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.message}>{item.message}</Text>
          <Text style={styles.time}>{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
        </Card>
      </TouchableOpacity>
    );
  };

  if (!loading && notifications.length === 0) {
    return (
      <View style={styles.safe}>
        <EmptyState icon="🔕" title="No Notifications" subtitle="You're all caught up!" />
      </View>
    );
  }

  return (
    <View style={styles.safe}>
      <View style={styles.header}>
        <SectionHeader title="Notifications" />
        {notifications.some(n => !n.read) && (
          <TouchableOpacity onPress={markAllAsRead}>
            <Text style={styles.markAll}>Mark All Read</Text>
          </TouchableOpacity>
        )}
      </View>
      <FlatList
        data={groupNotifications()}
        keyExtractor={item => item.date}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchNotifications(); }} />}
        contentContainerStyle={styles.list}
        renderItem={({ item: group }) => (
          <View style={styles.group}>
            <Text style={styles.dateHeader}>{group.date === new Date().toLocaleDateString() ? 'Today' : group.date}</Text>
            {group.data.map(n => <View key={n._id}>{renderItem({ item: n })}</View>)}
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.lg, marginTop: SPACING.lg },
  markAll: { color: COLORS.primary, fontWeight: '600', fontSize: FONT_SIZES.sm },
  list: { padding: SPACING.lg, paddingBottom: 100 },
  group: { marginBottom: SPACING.xl },
  dateHeader: { fontSize: FONT_SIZES.sm, fontWeight: '700', color: COLORS.textSecondary, marginBottom: SPACING.md, textTransform: 'uppercase' },
  card: { marginBottom: SPACING.md, padding: SPACING.md, opacity: 0.8 },
  unreadCard: { opacity: 1, borderLeftWidth: 4, borderLeftColor: COLORS.primary },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  title: { fontSize: FONT_SIZES.md, fontWeight: '700', color: COLORS.textPrimary, flex: 1 },
  deleteIcon: { fontSize: 16 },
  message: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, lineHeight: 20 },
  time: { fontSize: FONT_SIZES.xs, color: COLORS.textTertiary, marginTop: SPACING.sm, alignSelf: 'flex-end' }
});

export default NotificationScreen;
