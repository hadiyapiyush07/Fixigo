import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Animated as RNAnimated } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Reanimated, { FadeInUp, FadeIn, Layout, SlideOutRight } from 'react-native-reanimated';
import { Swipeable } from 'react-native-gesture-handler';
import { notificationAPI } from '../../api/notification.api';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../../theme/typography';

const getIconForNotification = (title) => {
  const t = title?.toLowerCase() || '';
  if (t.includes('book')) return { icon: '📅', color: '#3B82F6', bg: '#EFF6FF' };
  if (t.includes('pay')) return { icon: '💳', color: '#10B981', bg: '#D1FAE5' };
  if (t.includes('arriv')) return { icon: '📍', color: '#F59E0B', bg: '#FEF3C7' };
  if (t.includes('cancel')) return { icon: '❌', color: '#EF4444', bg: '#FEE2E2' };
  if (t.includes('welcome')) return { icon: '🎉', color: '#8B5CF6', bg: '#EDE9FE' };
  if (t.includes('rating') || t.includes('review')) return { icon: '⭐', color: '#EAB308', bg: '#FEF9C3' };
  return { icon: '🔔', color: '#6366F1', bg: '#E0E7FF' };
};

const NotificationScreen = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Close open swipeables
  const rowRefs = new Map();

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
      console.log('Error fetching notifications:', e);
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
      console.log('Error marking read:', e);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationAPI.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (e) {
      console.log('Error marking all read:', e);
    }
  };

  const deleteNotification = async (id) => {
    try {
      setNotifications(prev => prev.filter(n => n._id !== id));
      await notificationAPI.delete(id);
    } catch (e) {
      console.log('Error deleting:', e);
    }
  };

  // Group by Date
  const groupNotifications = () => {
    const groups = {};
    notifications.forEach(n => {
      const date = new Date(n.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
      const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
      const yesterdayDate = new Date();
      yesterdayDate.setDate(yesterdayDate.getDate() - 1);
      const yesterday = yesterdayDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

      let groupName = date;
      if (date === today) groupName = 'Today';
      else if (date === yesterday) groupName = 'Yesterday';

      if (!groups[groupName]) groups[groupName] = [];
      groups[groupName].push(n);
    });
    return Object.entries(groups).map(([date, data]) => ({ date, data }));
  };

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

  const renderItem = ({ item, index }) => {
    const isUnread = !item.read;
    const styleInfo = getIconForNotification(item.title);

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
            // Close others
            [...rowRefs.entries()].forEach(([key, ref]) => {
              if (key !== item._id && ref) ref.close();
            });
          }}
          friction={2}
          rightThreshold={40}
        >
          <TouchableOpacity 
            onPress={() => markAsRead(item._id, item.read)} 
            activeOpacity={0.9}
            style={[styles.card, isUnread && styles.unreadCard]}
          >
            <View style={[styles.iconBox, { backgroundColor: styleInfo.bg }]}>
              <Text style={styles.icon}>{styleInfo.icon}</Text>
            </View>
            <View style={styles.contentBox}>
              <View style={styles.cardHeader}>
                <Text style={[styles.title, isUnread && styles.unreadTitle]}>{item.title}</Text>
                <Text style={styles.time}>{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
              </View>
              <Text style={styles.message} numberOfLines={2}>{item.message}</Text>
            </View>
            {isUnread && <View style={styles.unreadDot} />}
          </TouchableOpacity>
        </Swipeable>
      </Reanimated.View>
    );
  };

  if (!loading && notifications.length === 0) {
    return (
      <View style={styles.safe}>
        <View style={styles.header}>
          <Text style={styles.screenTitle}>Notifications</Text>
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
    <View style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Notifications</Text>
        {notifications.some(n => !n.read) && (
          <TouchableOpacity onPress={markAllAsRead} style={styles.markAllBtn}>
            <Text style={styles.markAll}>Mark All Read</Text>
          </TouchableOpacity>
        )}
      </View>
      <FlatList
        data={groupNotifications()}
        keyExtractor={item => item.date}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchNotifications(); }} colors={[COLORS.primary]} />}
        contentContainerStyle={styles.list}
        renderItem={({ item: group }) => (
          <View style={styles.group}>
            <Text style={styles.dateHeader}>{group.date}</Text>
            {group.data.map((n, idx) => <View key={n._id}>{renderItem({ item: n, index: idx })}</View>)}
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F9FAFB' },
  
  header: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
    paddingHorizontal: SPACING.xl, paddingTop: SPACING.xxl, paddingBottom: SPACING.lg,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6'
  },
  screenTitle: { fontSize: FONT_SIZES.xl, fontWeight: '800', color: '#111827' },
  markAllBtn: { backgroundColor: '#F3E8FD', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  markAll: { color: COLORS.primary, fontWeight: '700', fontSize: 12 },

  list: { padding: SPACING.lg, paddingBottom: 100 },
  group: { marginBottom: SPACING.xl },
  dateHeader: { fontSize: 13, fontWeight: '800', color: '#9CA3AF', marginBottom: SPACING.md, letterSpacing: 1, textTransform: 'uppercase' },
  
  card: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF',
    padding: SPACING.lg, marginBottom: SPACING.md, borderRadius: BORDER_RADIUS.lg,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
    borderWidth: 1, borderColor: '#F3F4F6'
  },
  unreadCard: { backgroundColor: '#F5F3FF', borderColor: '#DDD6FE' },
  
  iconBox: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginRight: SPACING.md },
  icon: { fontSize: 24 },
  
  contentBox: { flex: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  title: { fontSize: FONT_SIZES.md, fontWeight: '600', color: '#374151', flex: 1, marginRight: 8 },
  unreadTitle: { fontWeight: '800', color: '#111827' },
  time: { fontSize: 11, color: '#9CA3AF', fontWeight: '500' },
  message: { fontSize: 13, color: '#6B7280', lineHeight: 18 },
  
  unreadDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.primary, position: 'absolute', top: 20, right: 20 },

  deleteAction: { backgroundColor: '#EF4444', justifyContent: 'center', alignItems: 'center', width: 90, marginBottom: SPACING.md, borderRadius: BORDER_RADIUS.lg, marginLeft: SPACING.sm },
  deleteActionText: { color: '#FFF', fontWeight: '800', fontSize: FONT_SIZES.sm },

  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: -50 },
  emptyIconBox: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#F3E8FD', alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.xl },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: FONT_SIZES.xl, fontWeight: '800', color: '#111827', marginBottom: SPACING.sm },
  emptySubtitle: { fontSize: FONT_SIZES.md, color: '#6B7280', textAlign: 'center', maxWidth: 250, lineHeight: 22 },
});

export default NotificationScreen;
